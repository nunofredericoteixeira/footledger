import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function normalizePlayerName(name: string): string {
  if (!name) return "";
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return normalized;
}

function getWeekDates(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : day === 1 ? -6 : 2 - day;

  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diff);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    start: weekStart.toISOString().split("T")[0],
    end: weekEnd.toISOString().split("T")[0],
  };
}

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

    const { data: weeklySelections } = await supabase
      .from("weekly_eleven_selections")
      .select("user_id, week_start_date, week_end_date, starting_eleven, substitutes");

    if (!weeklySelections) {
      return new Response(
        JSON.stringify({ error: "Could not fetch weekly selections" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const selectionMap = new Map();
    for (const selection of weeklySelections) {
      const key = `${selection.user_id}_${selection.week_start_date}`;
      const startingPlayers = Array.isArray(selection.starting_eleven)
        ? selection.starting_eleven.map((p: any) => (typeof p === "string" ? p : p.name))
        : [];
      const substituteNames = Array.isArray(selection.substitutes)
        ? selection.substitutes.map((p: any) => (typeof p === "string" ? p : p.name))
        : [];

      selectionMap.set(key, {
        user_id: selection.user_id,
        week_start_date: selection.week_start_date,
        week_end_date: selection.week_end_date,
        starting_eleven: startingPlayers,
        substitutes: substituteNames,
      });
    }

    const userPointsUpdates = new Map();
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
        const normalizedFileName = normalizePlayerName(playerName);
        console.log(`Searching for player: "${playerName}" (normalized: "${normalizedFileName}")`);

        const { data: exactMatches, error: exactError } = await supabase
          .from("player_pool")
          .select("id, name")
          .ilike("name", playerName);

        if (exactError) {
          console.error("Error searching for player:", exactError);
          results.push({
            player: playerName,
            status: "error",
            message: `Database error: ${exactError.message}`,
          });
          continue;
        }

        let player = null;

        if (exactMatches && exactMatches.length > 0) {
          for (const match of exactMatches) {
            if (normalizePlayerName(match.name) === normalizedFileName) {
              player = match;
              console.log(`EXACT MATCH: "${match.name}"`);
              break;
            }
          }
        }

        if (!player) {
          const { data: similarMatches } = await supabase
            .from("player_pool")
            .select("id, name")
            .or(`name.ilike.%${playerName}%,name.ilike.%${playerName.split(' ')[0]}%`)
            .limit(5);

          const similarNames = similarMatches?.map(p => p.name).join(", ") || "none";

          results.push({
            player: playerName,
            status: "error",
            message: `Player not found. Similar: ${similarNames}`,
          });
          continue;
        }

        console.log(`Found player: ${player.name} (ID: ${player.id})`);

        const lines = content.split("\n").filter((line: string) => line.trim());
        console.log(`Total lines in CSV: ${lines.length}`);

        const matches = [];
        let validLines = 0;
        let invalidDateCount = 0;
        let invalidScoreCount = 0;
        let missingDataCount = 0;

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

          if (i === 1) {
            console.log(`First data row has ${values.length} columns`);
            console.log(`Column 0 (date): "${values[0]}"`);
            console.log(`Column 17 (Pts_Total): "${values[17]}"`);
          }

          const matchDate = values[0];
          const scoreValue = values[17];

          if (!matchDate || scoreValue === undefined || scoreValue === null || scoreValue === "") {
            missingDataCount++;
            continue;
          }

          let parsedDate;
          try {
            parsedDate = new Date(matchDate);
            if (isNaN(parsedDate.getTime())) {
              invalidDateCount++;
              continue;
            }
          } catch {
            invalidDateCount++;
            continue;
          }

          const score = parseFloat(scoreValue);
          if (isNaN(score)) {
            invalidScoreCount++;
            console.log(`Invalid score for date ${matchDate}: "${scoreValue}"`);
            continue;
          }

          matches.push({
            date: matchDate,
            score: score,
          });
          validLines++;
        }

        console.log(`Valid lines: ${validLines}`);
        console.log(`Invalid dates: ${invalidDateCount}`);
        console.log(`Invalid scores: ${invalidScoreCount}`);
        console.log(`Missing data: ${missingDataCount}`);

        let pointsAdded = 0;
        const normalizedPlayer = normalizePlayerName(player.name);
        const weeklyPerformance = new Map();

        console.log(`\n=== Checking ${player.name} (normalized: "${normalizedPlayer}") ===`);
        console.log(`Total selections to check: ${selectionMap.size}`);

        for (const [key, selection] of selectionMap.entries()) {
          console.log(`\nChecking selection: ${key}`);
          console.log(`Week: ${selection.week_start_date} to ${selection.week_end_date}`);
          console.log(`Starting eleven (${selection.starting_eleven.length}): ${selection.starting_eleven.join(', ')}`);
          console.log(`Substitutes (${selection.substitutes.length}): ${selection.substitutes.join(', ')}`);

          const isInStarting = selection.starting_eleven.some(
            (p: string) => {
              const normalized = normalizePlayerName(p);
              console.log(`  Comparing starting: "${p}" (normalized: "${normalized}") === "${normalizedPlayer}" ? ${normalized === normalizedPlayer}`);
              return normalized === normalizedPlayer;
            }
          );
          const isInSubstitutes = selection.substitutes.some(
            (p: string) => {
              const normalized = normalizePlayerName(p);
              console.log(`  Comparing substitute: "${p}" (normalized: "${normalized}") === "${normalizedPlayer}" ? ${normalized === normalizedPlayer}`);
              return normalized === normalizedPlayer;
            }
          );

          console.log(`Result: isInStarting=${isInStarting}, isInSubstitutes=${isInSubstitutes}`);

          if (!isInStarting && !isInSubstitutes) continue;

          const weekStart = new Date(selection.week_start_date);
          const weekEnd = new Date(selection.week_end_date);

          let totalScore = 0;
          let matchCount = 0;

          for (const match of matches) {
            const matchDate = new Date(match.date);
            if (matchDate >= weekStart && matchDate <= weekEnd) {
              totalScore += match.score;
              matchCount++;
            }
          }

          if (matchCount > 0) {
            const averageScore = totalScore / matchCount;
            const pointsToAdd = isInStarting ? averageScore : averageScore * 0.5;

            const existingPoints = userPointsUpdates.get(selection.user_id) || 0;
            userPointsUpdates.set(selection.user_id, existingPoints + pointsToAdd);
            pointsAdded += pointsToAdd;

            console.log(
              `Week ${selection.week_start_date} to ${selection.week_end_date}: ${player.name} played ${matchCount} match(es), ` +
              `total score ${totalScore.toFixed(2)}, average ${averageScore.toFixed(2)}. ` +
              `Added ${pointsToAdd.toFixed(2)} points to user ${selection.user_id} (${isInStarting ? "starting" : "substitute"})`
            );

            weeklyPerformance.set(selection.week_start_date, {
              totalScore,
              matchCount,
              averageScore,
              weekEnd: selection.week_end_date,
            });
          }
        }

        for (const [weekStart, perfData] of weeklyPerformance.entries()) {
          const { error: performanceError } = await supabase
            .from("player_performance")
            .upsert(
              {
                player_id: player.id,
                week_start_date: weekStart,
                week_end_date: perfData.weekEnd,
                total_score: perfData.totalScore,
                matches_played: perfData.matchCount,
                average_score: perfData.averageScore,
              },
              { onConflict: "player_id,week_start_date" }
            );

          if (performanceError) {
            console.error(`Error updating performance for ${player.name}:`, performanceError);
          }
        }

        results.push({
          player: playerName,
          status: "success",
          matchesProcessed: matches.length,
          weeksProcessed: weeklyPerformance.size,
          pointsAdded,
          debug: {
            totalLines: lines.length,
            validLines,
            invalidDateCount,
            invalidScoreCount,
            missingDataCount,
          },
        });
      } catch (error) {
        results.push({
          player: playerName,
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    for (const [userId, pointsToAdd] of userPointsUpdates.entries()) {
      const { error: updateError } = await supabase.rpc("update_user_player_points", {
        user_id_param: userId,
        points_to_add: pointsToAdd,
      });

      if (updateError) {
        console.error(`Error updating points for user ${userId}:`, updateError);
      } else {
        console.log(`Successfully added ${pointsToAdd.toFixed(2)} points to user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-performance-data:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
