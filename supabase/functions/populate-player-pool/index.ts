import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Map CSV positions to database positions
const positionMap: Record<string, string> = {
  "Goalkeeper": "Goalkeeper",
  "Centre-Back": "Centre-Back",
  "Left-Back": "Left-Back",
  "Right-Back": "Right-Back",
  "Defensive Midfield": "Defensive Midfield",
  "Central Midfield": "Central Midfield",
  "Left Midfield": "Left Midfield",
  "Right Midfield": "Right Midfield",
  "Attacking Midfield": "Attacking Midfield",
  "Left Winger": "Left Winger",
  "Right Winger": "Right Winger",
  "Centre-Forward": "Centre-Forward",
  "Second Striker": "Second Striker",
};

interface Player {
  name: string;
  league: string;
  club: string;
  position: string;
  value: number;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { players: rawPlayers } = await req.json();

    if (!rawPlayers || !Array.isArray(rawPlayers)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid players data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Received ${rawPlayers.length} players from frontend`);

    const players: Player[] = [];

    for (const rawPlayer of rawPlayers) {
      const { name, league, club, position, value } = rawPlayer;

      const mappedPosition = positionMap[position];
      if (!mappedPosition) {
        console.warn(`Unknown position: ${position} for player ${name}`);
        continue;
      }

      if (!name || !club || !league || isNaN(value)) {
        console.warn(`Invalid player data - name:${name}, club:${club}, league:${league}, value:${value}`);
        continue;
      }

      players.push({
        name,
        league,
        club,
        position: mappedPosition,
        value,
      });
    }

    console.log(`Successfully validated ${players.length} players`);

    if (players.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid players found in CSV" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clear existing players
    await supabase.from("player_pool").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert players in batches of 500
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const { error } = await supabase.from("player_pool").insert(batch);

      if (error) {
        console.error("Batch insert error:", error);
        return new Response(
          JSON.stringify({ error: `Failed to insert batch at index ${i}: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully populated ${inserted} players`,
        total: inserted
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});