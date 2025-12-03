import "dotenv/config";
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon Key');

const supabase = createClient(supabaseUrl, supabaseKey);

const PERFORMANCE_DATA_DIRS = [
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_PT',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_ES',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_FR',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_IT',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_ING',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_AL',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_PT',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_ES',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_FR',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_IT',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_ING',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_AL'
];

function normalizePlayerName(name) {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .replace(/ð/g, 'd')
    .replace(/ø/g, 'o')
    .replace(/ł/g, 'l')
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : day === 1 ? -6 : 2 - day;

  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diff);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0]
  };
}

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const result = [];

  for (const line of lines) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    result.push(values);
  }

  return result;
}

function parsePlayerCSVFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = parseCSV(content);

  const weeklyScores = new Map();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const matchDate = row[0];
    const scoreValue = row[24];

    if (!matchDate || scoreValue === undefined || scoreValue === null) {
      continue;
    }

    const parsedDate = new Date(matchDate);

    if (isNaN(parsedDate.getTime())) {
      continue;
    }

    const score = parseFloat(scoreValue);
    if (isNaN(score)) {
      continue;
    }

    const weekDates = getWeekDates(parsedDate);
    const weekKey = weekDates.start;

    if (!weeklyScores.has(weekKey)) {
      weeklyScores.set(weekKey, {
        week_start: weekKey,
        week_end: weekDates.end,
        total_score: 0,
        match_count: 0
      });
    }

    const weekData = weeklyScores.get(weekKey);
    weekData.total_score += score;
    weekData.match_count += 1;
  }

  return weeklyScores;
}

async function getPlayerFromDB(fileName, filePath) {
  const playerNameFromFile = path.basename(fileName, path.extname(fileName));
  const normalizedFileName = normalizePlayerName(playerNameFromFile);

  console.log(`  🔍 Looking for: "${playerNameFromFile}" (normalized: "${normalizedFileName}")`);

  const { data: players, error } = await supabase
    .from('player_pool')
    .select('id, name');

  if (error) {
    console.log(`  ❌ Database error: ${error.message}`);
    return null;
  }

  if (!players || players.length === 0) {
    console.log(`  ❌ No players found in database`);
    return null;
  }

  console.log(`  📊 Checking against ${players.length} players...`);

  // First try exact match
  for (const player of players) {
    if (normalizePlayerName(player.name) === normalizedFileName) {
      console.log(`  ✓ EXACT match: "${player.name}"`);
      return player;
    }
  }

  // If no exact match, try partial match (file name contained in DB name)
  let matchCount = 0;
  for (const player of players) {
    const normalizedDBName = normalizePlayerName(player.name);
    if (normalizedDBName.includes(normalizedFileName)) {
      matchCount++;
      if (matchCount === 1) {
        console.log(`  ✓ PARTIAL match: "${playerNameFromFile}" -> "${player.name}"`);
        return player;
      }
    }
  }

  // Player not found - add to database
  console.log(`  ⚠️  No match found - adding new player to database...`);

  // Detect if this is a goalkeeper based on file path
  const isGoalkeeper = filePath.includes('_GK_');
  const position = isGoalkeeper ? 'Goalkeeper' : 'Forward';

  const { data: newPlayer, error: insertError } = await supabase
    .from('player_pool')
    .insert({
      name: playerNameFromFile,
      position: position,
      value: 1000000, // Default value
      league: 'Unknown',
      club: 'Unknown'
    })
    .select('id, name')
    .single();

  if (insertError) {
    console.log(`  ❌ Error adding player: ${insertError.message}`);
    return null;
  }

  console.log(`  ✓ ADDED new player: "${newPlayer.name}" as ${position}`);
  return newPlayer;
}

async function getUserWeeklySelections() {
  const { data: selections } = await supabase
    .from('weekly_eleven_selections')
    .select('user_id, week_start_date, week_end_date, starting_eleven, substitutes');

  if (!selections) return [];

  const selectionMap = new Map();

  for (const selection of selections) {
    const key = `${selection.user_id}_${selection.week_start_date}`;

    const startingPlayers = Array.isArray(selection.starting_eleven)
      ? selection.starting_eleven.map(p => typeof p === 'string' ? p : p.name)
      : [];

    const substituteNames = Array.isArray(selection.substitutes)
      ? selection.substitutes.map(p => typeof p === 'string' ? p : p.name)
      : [];

    selectionMap.set(key, {
      user_id: selection.user_id,
      week_start_date: selection.week_start_date,
      week_end_date: selection.week_end_date,
      starting_eleven: startingPlayers,
      substitutes: substituteNames
    });
  }

  return selectionMap;
}

async function syncPerformanceData() {
  console.log('Starting performance data sync...\n');

  const files = [];

  for (const dir of PERFORMANCE_DATA_DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found (skipping): ${dir}`);
      continue;
    }

    const dirFiles = fs.readdirSync(dir)
      .filter(file => file.endsWith('.csv'))
      .map(file => path.join(dir, file));

    files.push(...dirFiles);
    console.log(`✓ Found ${dirFiles.length} file(s) in: ${path.basename(dir)}`);
  }

  if (files.length === 0) {
    console.log('\nNo CSV files found in any directory.');
    process.exit(0);
  }

  console.log(`\nTotal: ${files.length} player file(s)\n`);

  const weeklySelectionsMap = await getUserWeeklySelections();
  console.log(`Loaded ${weeklySelectionsMap.size} weekly selections from database\n`);

  const userPointsUpdates = new Map();

  for (const file of files) {
    try {
      const fileName = path.basename(file);
      console.log(`\nProcessing: ${fileName}`);

      const player = await getPlayerFromDB(fileName, file);

      if (!player) {
        console.log(`  ⚠️  Unable to process player: ${fileName}`);
        continue;
      }

      console.log(`  ✓ Matched to: ${player.name} (${player.id})`);

      const weeklyScores = parsePlayerCSVFile(file);
      console.log(`  Found ${weeklyScores.size} week(s) of data`);

      for (const [weekStart, scoreData] of weeklyScores.entries()) {
        for (const [selectionKey, selection] of weeklySelectionsMap.entries()) {
          if (selection.week_start_date !== weekStart) continue;

          const playerName = player.name;
          const isStarting = selection.starting_eleven.some(name =>
            normalizePlayerName(name) === normalizePlayerName(playerName)
          );
          const isSubstitute = selection.substitutes.some(name =>
            normalizePlayerName(name) === normalizePlayerName(playerName)
          );

          if (!isStarting && !isSubstitute) continue;

          const pointsMultiplier = isStarting ? 1.0 : 0.5;
          const weekPoints = Math.round(scoreData.total_score * pointsMultiplier);

          const userPointsKey = `${selection.user_id}_${player.id}`;

          if (!userPointsUpdates.has(userPointsKey)) {
            userPointsUpdates.set(userPointsKey, {
              user_id: selection.user_id,
              player_id: player.id,
              player_name: player.name,
              total_points: 0,
              weeks_selected: 0,
              last_week_date: null,
              last_week_points: 0
            });
          }

          const userData = userPointsUpdates.get(userPointsKey);
          userData.total_points += weekPoints;
          userData.weeks_selected += 1;

          if (!userData.last_week_date || weekStart > userData.last_week_date) {
            userData.last_week_date = weekStart;
            userData.last_week_points = weekPoints;
          }

          console.log(`    Week ${weekStart}: ${weekPoints} points for user (${isStarting ? 'Starting' : 'Substitute'})`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error reading file ${path.basename(file)}:`, error.message);
    }
  }

  console.log(`\n\n=== Updating Database ===`);
  console.log(`Total user-player combinations to update: ${userPointsUpdates.size}\n`);

  let updated = 0;
  let errors = 0;

  for (const [key, pointsData] of userPointsUpdates.entries()) {
    const { error } = await supabase
      .from('user_player_total_points')
      .upsert({
        user_id: pointsData.user_id,
        player_id: pointsData.player_id,
        total_points: pointsData.total_points,
        last_week_points: pointsData.last_week_points,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,player_id'
      });

    if (error) {
      console.error(`Error updating ${pointsData.player_name}:`, error.message);
      errors++;
    } else {
      updated++;
    }
  }

  console.log('\n=== Sync Complete ===');
  console.log(`✓ Successfully updated: ${updated} records`);
  if (errors > 0) {
    console.log(`✗ Errors: ${errors} records`);
  }

  console.log('\n✅ All performance data synchronized!');
}

syncPerformanceData().catch(console.error);
