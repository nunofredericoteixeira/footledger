import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ICLOUD_FOLDER = '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_PT';
const SEASON = '2025-2026';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function extractPlayerName(filename) {
  const match = filename.match(/\d{4}-\d{4}_(.+)\.csv$/);
  return match ? match[1] : null;
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

async function processCSVFile(filePath) {
  try {
    const filename = path.basename(filePath);
    const playerName = extractPlayerName(filename);

    if (!playerName) {
      console.log(`Skipping file (invalid format): ${filename}`);
      return;
    }

    console.log(`Processing player: ${playerName}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = parseCSV(content);

    const performanceData = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const dateValue = row[0];
      const scoreValue = row[20];

      if (!dateValue || scoreValue === undefined || scoreValue === null || scoreValue === '') {
        continue;
      }

      let matchDate;
      try {
        matchDate = new Date(dateValue);

        if (isNaN(matchDate.getTime())) {
          continue;
        }

        const formattedDate = matchDate.toISOString().split('T')[0];
        const score = parseFloat(scoreValue) || 0;

        performanceData.push({
          player_name: playerName,
          match_date: formattedDate,
          performance_score: score,
          season: SEASON
        });
      } catch (error) {
        console.error(`Error parsing date for ${playerName}, row ${i}:`, error.message);
        continue;
      }
    }

    if (performanceData.length > 0) {
      const { error } = await supabase
        .from('player_performance_data')
        .upsert(performanceData, {
          onConflict: 'player_name,match_date,season',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Error uploading data for ${playerName}:`, error.message);
      } else {
        console.log(`✓ Successfully uploaded ${performanceData.length} records for ${playerName}`);
      }
    } else {
      console.log(`No valid data found for ${playerName}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

async function syncAllFiles() {
  try {
    const now = new Date();
    console.log(`\n[${now.toLocaleString()}] Starting sync...`);
    console.log(`Scanning folder: ${ICLOUD_FOLDER}`);

    if (!fs.existsSync(ICLOUD_FOLDER)) {
      console.error(`Folder does not exist: ${ICLOUD_FOLDER}`);
      return;
    }

    const files = fs.readdirSync(ICLOUD_FOLDER);
    const csvFiles = files.filter(f => f.endsWith('.csv') && f.includes(SEASON));

    console.log(`Found ${csvFiles.length} CSV files to process\n`);

    for (const file of csvFiles) {
      const filePath = path.join(ICLOUD_FOLDER, file);
      await processCSVFile(filePath);
    }

    console.log(`\n✓ Sync completed at ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('Error syncing files:', error.message);
  }
}

console.log('='.repeat(60));
console.log('FootLedger Player Data Sync Service');
console.log('='.repeat(60));
console.log(`Folder: ${ICLOUD_FOLDER}`);
console.log(`Season: ${SEASON}`);
console.log(`Schedule: Daily at 7:00 AM`);
console.log('='.repeat(60));

syncAllFiles().catch(console.error);
