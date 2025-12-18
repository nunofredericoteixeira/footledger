import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const MY_TEAM_USER_ID = process.env.MY_TEAM_USER_ID;
const SEASON = '2025-2026';

if (!SUPABASE_URL || !SUPABASE_KEY || !MY_TEAM_USER_ID) {
  console.error('Missing VITE_SUPABASE_URL, SUPABASE key or MY_TEAM_USER_ID in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ICLOUD_BASE = '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs';
const FOLDERS = [
  'Minutos_Jogadores_PT',
  'Minutos_Jogadores_ES',
  'Minutos_Jogadores_FR',
  'Minutos_Jogadores_IT',
  'Minutos_Jogadores_ING',
  'Minutos_Jogadores_AL',
  'Minutos_Jogadores_GK_PT',
  'Minutos_Jogadores_GK_ES',
  'Minutos_Jogadores_GK_FR',
  'Minutos_Jogadores_GK_IT',
  'Minutos_Jogadores_GK_ING',
  'Minutos_Jogadores_GK_AL'
];

const MANUAL_FILE_OVERRIDES = {
  'zaidu': 'Minutos_Jogadores_PT/Zaidu Sanusi.csv',
  'leandro barreiro': 'Minutos_Jogadores_PT/Leandro Barreiro Martins.csv'
};

function normalize(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

async function loadMyTeamPlayers() {
  const { data, error } = await supabase
    .from('user_player_selections')
    .select('player_pool(id,name)')
    .eq('user_id', MY_TEAM_USER_ID);

  if (error) throw new Error(error.message);
  if (!data) return [];

  return data
    .map(item => item.player_pool)
    .filter(Boolean);
}

async function findCSVForPlayer(playerName) {
  const normalizedTarget = normalize(playerName);

  const manual = MANUAL_FILE_OVERRIDES[normalizedTarget];
  if (manual) {
    const manualPath = path.join(ICLOUD_BASE, manual);
    try {
      await fs.access(manualPath);
      return manualPath;
    } catch (err) {
      console.warn(`  ⚠️  Override path not found: ${manualPath}`);
    }
  }

  for (const folder of FOLDERS) {
    const folderPath = path.join(ICLOUD_BASE, folder);
    try {
      const files = await fs.readdir(folderPath);
      for (const file of files) {
        if (!file.endsWith('.csv')) continue;
        const normalizedFile = normalize(file.replace('.csv', ''));
        if (normalizedFile === normalizedTarget) {
          return path.join(folderPath, file);
        }
      }
    } catch (err) {
      // Pasta não encontrada? Ignorar.
    }
  }
  return null;
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length !== headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = parts[index]?.trim();
    });
    rows.push(row);
  }
  return rows;
}

async function upsertPlayerScores(player, csvPath) {
  const content = await fs.readFile(csvPath, 'utf-8');
  const rows = parseCSV(content);
  if (!rows.length) return 0;

  const uniqueMatches = new Map();
  for (const row of rows) {
    const matchDate = row.Date;
    if (!matchDate) continue;
    const score = parseFloat(row.Pts_Total);
    if (Number.isNaN(score)) continue;
    uniqueMatches.set(matchDate, {
      player_name: player.name,
      match_date: matchDate,
      performance_score: score,
      season: SEASON
    });
  }

  const performanceData = Array.from(uniqueMatches.values());

  const { error } = await supabase
    .from('player_performance_data')
    .upsert(performanceData, { onConflict: 'player_name,match_date,season' });

  if (error) throw new Error(error.message);
  return performanceData.length;
}

async function run() {
  console.log('Buscando jogadores da Minha Equipa...');
  const players = await loadMyTeamPlayers();

  console.log(`Encontrados ${players.length} jogadores.`);
  let totalMatches = 0;

  for (const player of players) {
    console.log(`\n== ${player.name} ==`);
    const csvPath = await findCSVForPlayer(player.name);
    if (!csvPath) {
      console.log('  ❌ CSV não encontrado');
      continue;
    }

    console.log(`  CSV: ${csvPath}`);
    try {
      const count = await upsertPlayerScores(player, csvPath);
      console.log(`  ✅ Inseridos/atualizados ${count} registos`);
      totalMatches += count;
    } catch (err) {
      console.log(`  ❌ Erro: ${err.message}`);
    }
  }

  console.log(`\nTotal de registos processados: ${totalMatches}`);
  console.log('Atualizando user_player_total_points...');

  const { error: rpcError } = await supabase.rpc('update_user_player_points_for_user', {
    target_user_id: MY_TEAM_USER_ID
  });

  if (rpcError) {
    console.error('Erro ao atualizar os pontos da equipa:', rpcError.message);
  } else {
    console.log('✅ Pontos atualizados em user_player_total_points');
  }
}

run().catch(err => {
  console.error('Erro geral:', err);
  process.exit(1);
});

