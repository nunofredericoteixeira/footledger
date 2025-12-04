/**
 * Syncs all player performance CSVs from multiple iCloud folders into player_performance_data.
 * Expects .env.local with:
 *  - VITE_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *
 * Files must follow the pattern: YYYY-YYYY_Player Name.csv
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SEASON = '2025-2026';
const FOLDERS = [
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_PT',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_ING',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_IT',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_FR',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_ES',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_AL',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_PT',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_ING',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_IT',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_FR',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_ES',
  '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_GK_AL',
];

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [k, ...rest] = trimmed.split('=');
    if (!process.env[k]) process.env[k] = rest.join('=');
  }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function extractInfo(filename) {
  const seasonMatch = filename.match(/(\d{4}-\d{4})_(.+)\.csv$/);
  if (seasonMatch) {
    return { season: seasonMatch[1], playerName: seasonMatch[2] };
  }
  // Fallback: no season in name
  const base = filename.replace('.csv', '');
  return { season: DEFAULT_SEASON, playerName: base };
}

function parseCSV(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  const result = [];
  for (const line of lines) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    result.push(values);
  }
  return result;
}

async function processCSVFile(filePath) {
  const filename = path.basename(filePath);
  const { season, playerName } = extractInfo(filename);

  const content = fs.readFileSync(filePath, 'utf8');
  const data = parseCSV(content);
  const performanceDataMap = new Map();

  if (!data.length) {
    console.log(`Empty file: ${filename}`);
    return;
  }

  // Determine score column
  const header = data[0].map((h) => h.trim().toLowerCase());
  const scoreIndex = header.findIndex((h) => h.includes('pts') || h.includes('points'));
  const scoreCol = scoreIndex >= 0 ? scoreIndex : data[0].length - 1;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dateValue = row[0];
    const scoreValue = row[scoreCol];
    if (!dateValue || scoreValue === undefined || scoreValue === null || scoreValue === '') continue;

    const matchDate = new Date(dateValue);
    if (isNaN(matchDate.getTime())) continue;

    const formattedDate = matchDate.toISOString().split('T')[0];
    const score = parseFloat(scoreValue) || 0;

    // Deduplicate by date for this player (keep last occurrence in the file)
    performanceDataMap.set(formattedDate, {
      player_name: playerName,
      match_date: formattedDate,
      performance_score: score,
      season,
    });
  }

  const performanceData = Array.from(performanceDataMap.values());

  if (!performanceData.length) {
    console.log(`No rows for ${playerName} (${filename})`);
    return;
  }

  // Upsert in chunks to avoid payload issues
  const chunkSize = 500;
  for (let i = 0; i < performanceData.length; i += chunkSize) {
    const chunk = performanceData.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('player_performance_data')
      .upsert(chunk, { onConflict: 'player_name,match_date,season', ignoreDuplicates: false });

    if (error) {
      console.error(`Error uploading ${playerName} (batch ${i / chunkSize + 1}):`, error.message);
      return;
    }
  }

  console.log(`✓ ${playerName}: ${performanceData.length} rows`);
}

async function syncFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.warn(`Folder not found: ${folderPath}`);
    return;
  }
  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.csv'));
  console.log(`\n📂 ${folderPath} — ${files.length} files`);
  for (const file of files) {
    await processCSVFile(path.join(folderPath, file));
  }
}

async function main() {
  console.log('Starting sync for all leagues/GK');
  for (const folder of FOLDERS) {
    await syncFolder(folder);
  }
  console.log('\n✅ Done syncing all folders');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
