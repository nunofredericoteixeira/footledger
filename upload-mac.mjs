#!/usr/bin/env node

/**
 * INSTRUÇÕES:
 * 1. Copie este ficheiro para o seu Mac
 * 2. No terminal: npm install @supabase/supabase-js
 * 3. Execute: node upload-mac.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://jdqdfkiquuyfxvdjtjxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcWRma2lxdXV5Znh2ZGp0anh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQwNTYzMywiZXhwIjoyMDc0OTgxNjMzfQ.gIHKh9s-LgJ5uYoP9gOEr5aMfpxNUFxckxLcWNh0I8M';

const CSV_DIR = '/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_ING';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const performances = [];

  for (const line of lines) {
    const values = line.split(',');
    if (values.length >= 15) {
      performances.push({
        date: values[0],
        day: values[1],
        competition: values[2],
        round: values[3],
        venue: values[4],
        result: values[5],
        opponent: values[6],
        team: values[7],
        starter: values[8],
        position: values[9],
        minutes: parseInt(values[10]) || 0,
        goals: parseInt(values[11]) || 0,
        assists: parseInt(values[12]) || 0,
        penalty_kicks: parseInt(values[13]) || 0,
        penalty_attempts: parseInt(values[14]) || 0,
        shots: parseInt(values[15]) || 0,
        shots_on_target: parseInt(values[16]) || 0,
        yellow_cards: parseInt(values[17]) || 0,
        red_cards: parseInt(values[18]) || 0,
        touches: parseInt(values[19]) || 0,
        tackles: parseInt(values[20]) || 0,
        interceptions: parseInt(values[21]) || 0,
        blocks: parseInt(values[22]) || 0,
        xg: parseFloat(values[23]) || 0,
        npxg: parseFloat(values[24]) || 0,
        xag: parseFloat(values[25]) || 0,
        sca: parseInt(values[26]) || 0,
        gca: parseInt(values[27]) || 0,
        passes_completed: parseInt(values[28]) || 0,
        passes_attempted: parseInt(values[29]) || 0,
        pass_completion_pct: parseFloat(values[30]) || 0,
        progressive_passes: parseInt(values[31]) || 0,
        carries: parseInt(values[32]) || 0,
        progressive_carries: parseInt(values[33]) || 0,
        take_ons_attempted: parseInt(values[34]) || 0,
        take_ons_successful: parseInt(values[35]) || 0
      });
    }
  }

  return performances;
}

async function uploadPlayer(playerName, csvContent) {
  console.log(`\nProcessando ${playerName}...`);

  const performances = parseCSV(csvContent);

  if (performances.length === 0) {
    console.log('  Sem dados válidos');
    return { success: false, count: 0 };
  }

  const { data: player } = await supabase
    .from('player_pool')
    .select('id')
    .ilike('name', playerName)
    .maybeSingle();

  if (!player) {
    console.log(`  Jogador não encontrado: ${playerName}`);
    return { success: false, count: 0 };
  }

  const records = performances.map(p => ({
    ...p,
    player_id: player.id
  }));

  const { error } = await supabase
    .from('player_performance')
    .upsert(records, { onConflict: 'player_id,date' });

  if (error) {
    console.log(`  Erro: ${error.message}`);
    return { success: false, count: 0 };
  }

  console.log(`  ${performances.length} registos inseridos`);
  return { success: true, count: performances.length };
}

async function main() {
  console.log('Iniciando upload...\n');

  const files = readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
  console.log(`Encontrados ${files.length} ficheiros\n`);

  let success = 0;
  let failed = 0;
  let total = 0;

  for (const file of files) {
    const playerName = file.replace('.csv', '');
    const content = readFileSync(join(CSV_DIR, file), 'utf-8');
    const result = await uploadPlayer(playerName, content);

    if (result.success) {
      success++;
      total += result.count;
    } else {
      failed++;
    }
  }

  console.log('\n=== RESUMO ===');
  console.log(`Sucesso: ${success}`);
  console.log(`Falhados: ${failed}`);
  console.log(`Total registos: ${total}`);
}

main().catch(console.error);
