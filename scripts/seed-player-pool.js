/**
 * One-time helper to seed the player_pool table from the bundled CSV.
 * Uses service role key (required for inserts). Keep .env.local with:
 *  VITE_SUPABASE_URL
 *  SUPABASE_SERVICE_ROLE_KEY
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
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
const csvPath = path.join(process.cwd(), 'supabase', 'seed', 'Jogadores_Valor.xlsx - Sheet1.csv');

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map(v => v.trim());
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found at ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);
  // Drop header
  content.shift();

  const rows = content.map(parseCsvLine).map(([league, club, name, position, value, url]) => ({
    league,
    club,
    name,
    position,
    // Source values are 100x; normalize to real amounts.
    value: (Number(value) || 0) / 100,
    url: url || null,
  }));

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('player_pool').insert(chunk);
    if (error) {
      console.error('Insert error:', error.message);
      process.exit(1);
    }
    console.log(`Inserted/updated ${i + chunk.length} / ${rows.length}`);
  }

  console.log('Done seeding player_pool');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
