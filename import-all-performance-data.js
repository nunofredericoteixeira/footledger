import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const cloudDocsPath = '/Users/nunoteixeira/Desktop/-footledger-download 2';

const folders = [
  'Minutos_Jogadores_GK_FR',
  'Minutos_Jogadores_FR',
  'Minutos_Jogadores_GK_PT',
  'Minutos_Jogadores_GK_IT',
  'Minutos_Jogadores_PT',
  'Minutos_Jogadores_IT',
  'Minutos_Jogadores_GK_ES',
  'Minutos_Jogadores_ES',
  'Minutos_Jogadores_GK_ING',
  'Minutos_Jogadores_ING',
  'Minutos_Jogadores_AL',
  'Minutos_Jogadores_GK_AL'
];

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index].trim();
    });
    rows.push(row);
  }

  return rows;
}

async function importPlayerCSV(filePath, playerName, season = '2025-2026') {
  try {
    console.log(`Processing ${playerName}...`);

    const csvContent = readFileSync(filePath, 'utf-8');
    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      console.log(`  ⚠️  No data found in ${playerName}`);
      return { success: false, records: 0 };
    }

    const performanceData = rows.map(row => ({
      player_name: playerName,
      match_date: row.Date,
      performance_score: parseFloat(row.Pts_Total) || 0,
      season: season,
    }));

    const { error } = await supabase
      .from('player_performance_data')
      .upsert(performanceData, {
        onConflict: 'player_name,match_date,season',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`  ❌ Error for ${playerName}:`, error.message);
      return { success: false, records: 0, error };
    }

    console.log(`  ✅ Imported ${rows.length} records for ${playerName}`);
    return { success: true, records: rows.length };

  } catch (error) {
    console.error(`  ❌ Error processing ${playerName}:`, error.message);
    return { success: false, records: 0, error };
  }
}

async function processFolders() {
  console.log('🚀 Starting import of performance data...\n');

  let totalRecords = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const folder of folders) {
    const folderPath = join(cloudDocsPath, folder);
    console.log(`\n📁 Processing folder: ${folder}`);

    try {
      const files = readdirSync(folderPath).filter(f => f.endsWith('.csv'));
      console.log(`   Found ${files.length} CSV files`);

      for (const file of files) {
        const playerName = file.replace('.csv', '');
        const filePath = join(folderPath, file);

        const result = await importPlayerCSV(filePath, playerName);

        if (result.success) {
          successCount++;
          totalRecords += result.records;
        } else {
          errorCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(`   ❌ Error reading folder ${folder}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Import complete!');
  console.log(`   Total records imported: ${totalRecords}`);
  console.log(`   Successful imports: ${successCount}`);
  console.log(`   Failed imports: ${errorCount}`);
  console.log('='.repeat(60));
}

processFolders().catch(console.error);
