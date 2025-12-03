import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CSVRow {
  Date: string;
  Pts_Total: string;
  [key: string]: string;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index].trim();
    });
    rows.push(row as CSVRow);
  }

  return rows;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { csvContent, playerName, season } = await req.json();

    if (!csvContent || !playerName) {
      throw new Error("Missing required fields: csvContent, playerName");
    }

    const seasonToUse = season || "2025-2026";

    // Parse CSV
    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      throw new Error("No valid data found in CSV");
    }

    // Prepare data for insertion
    const performanceData = rows.map(row => ({
      player_name: playerName,
      match_date: row.Date,
      performance_score: parseFloat(row.Pts_Total) || 0,
      season: seasonToUse,
    }));

    // Insert data (upsert to avoid duplicates)
    const { data, error } = await supabase
      .from("player_performance_data")
      .upsert(performanceData, {
        onConflict: "player_name,match_date,season",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Imported ${rows.length} performance records for ${playerName}`,
        recordsProcessed: rows.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
