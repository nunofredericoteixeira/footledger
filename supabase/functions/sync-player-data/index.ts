import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { csvData } = await req.json();

    if (!csvData || !Array.isArray(csvData)) {
      return new Response(
        JSON.stringify({ error: "csvData array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const SEASON = "2025-2026";
    const results = [];

    for (const fileData of csvData) {
      const { playerName, content } = fileData;

      if (!playerName || !content) {
        results.push({
          player: playerName || "unknown",
          status: "error",
          message: "Missing playerName or content",
        });
        continue;
      }

      try {
        const lines = content.split("\n").filter((line: string) => line.trim());
        const performanceData = [];

        for (let i = 1; i < lines.length; i++) {
          const values = [];
          let current = "";
          let inQuotes = false;

          for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          const dateValue = values[0];
          const scoreValue = values[20];

          if (!dateValue || scoreValue === undefined || scoreValue === "") {
            continue;
          }

          try {
            const matchDate = new Date(dateValue);
            if (isNaN(matchDate.getTime())) {
              continue;
            }

            const formattedDate = matchDate.toISOString().split("T")[0];
            const score = parseFloat(scoreValue) || 0;

            performanceData.push({
              player_name: playerName,
              match_date: formattedDate,
              performance_score: score,
              season: SEASON,
            });
          } catch (error) {
            console.error(`Error parsing date for ${playerName}:`, error);
            continue;
          }
        }

        if (performanceData.length > 0) {
          const { error } = await supabase
            .from("player_performance_data")
            .upsert(performanceData, {
              onConflict: "player_name,match_date,season",
              ignoreDuplicates: false,
            });

          if (error) {
            results.push({
              player: playerName,
              status: "error",
              message: error.message,
            });
          } else {
            results.push({
              player: playerName,
              status: "success",
              recordsUploaded: performanceData.length,
            });
          }
        } else {
          results.push({
            player: playerName,
            status: "no_data",
            message: "No valid data found",
          });
        }
      } catch (error) {
        results.push({
          player: playerName,
          status: "error",
          message: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Sync completed",
        results,
        totalProcessed: results.length,
        successful: results.filter((r) => r.status === "success").length,
        errors: results.filter((r) => r.status === "error").length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in sync-player-data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
