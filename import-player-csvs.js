import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSVLine(line) {
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

  return values;
}

async function importPlayerCSV(filePath) {
  const playerName = path.basename(filePath, '.csv');
  console.log(`\nProcessing: ${playerName}`);

  const { data: player, error: playerError } = await supabase
    .from('player_pool')
    .select('id, name')
    .ilike('name', playerName)
    .maybeSingle();

  if (playerError || !player) {
    console.log(`❌ Player not found in database: ${playerName}`);
    return;
  }

  console.log(`✓ Found player: ${player.name} (ID: ${player.id})`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length < 25) {
      skipped++;
      continue;
    }

    const [
      date, dayOfWeek, competition, round, venue, result, team, opponent,
      started, position, minutes, goals, assists, yellowCards, redCards,
      shotsOnTarget, penaltiesScored, penaltiesConceded,
      minutesPoints, goalsPoints, assistsPoints, yellowCardPoints,
      redCardPoints, shotsOnTargetPoints, penaltiesPoints, totalPoints
    ] = values;

    if (!date || date === 'Date') continue;

    const performanceData = {
      player_id: player.id,
      match_date: date,
      competition: competition || null,
      opponent: opponent || null,
      minutes_played: parseInt(minutes) || 0,
      goals: parseInt(goals) || 0,
      assists: parseInt(assists) || 0,
      yellow_cards: parseInt(yellowCards) || 0,
      red_cards: parseInt(redCards) || 0,
      shots_on_target: parseInt(shotsOnTarget) || 0,
      penalties_scored: parseInt(penaltiesScored) || 0,
      penalties_conceded: parseInt(penaltiesConceded) || 0,
      points: parseInt(totalPoints) || 0
    };

    const { error: insertError } = await supabase
      .from('player_performance')
      .upsert(performanceData, {
        onConflict: 'player_id,match_date',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.log(`  ❌ Error on ${date}: ${insertError.message}`);
    } else {
      imported++;
    }
  }

  console.log(`  ✓ Imported: ${imported} | Skipped: ${skipped}`);

  const { data: stats } = await supabase
    .from('player_performance')
    .select('points')
    .eq('player_id', player.id);

  if (stats && stats.length > 0) {
    const totalPoints = stats.reduce((sum, s) => sum + (s.points || 0), 0);

    await supabase
      .from('player_pool')
      .update({ points: totalPoints })
      .eq('id', player.id);

    console.log(`  ✓ Updated total points: ${totalPoints}`);
  }
}

async function importAllCSVs(dataDir) {
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Directory not found: ${dataDir}`);
    console.log('\nPlease create the data directory and add CSV files:');
    console.log('  mkdir -p data');
    console.log('  cp "/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_ING/"*.csv data/');
    return;
  }

  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.csv'))
    .sort();

  console.log(`\n📊 Found ${files.length} CSV files\n`);

  for (const file of files) {
    await importPlayerCSV(path.join(dataDir, file));
  }

  console.log('\n✅ Import completed!');
}

const dataDir = path.join(__dirname, 'data');
importAllCSVs(dataDir);
