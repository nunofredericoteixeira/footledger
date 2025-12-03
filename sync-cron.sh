#!/bin/bash

# Script para sincronizar dados de performance do iCloud para Supabase
# Pode ser executado diretamente ou agendado com cron

# Configuração
SUPABASE_URL="https://jdqdfkiquuyfxvdjtjxv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqaGZrZmhnaHB2bm9vZW1mbWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzNzQ2OCwiZXhwIjoyMDcyNTEzNDY4fQ.XtEFdD4sX7X_lcA_PBkhaf4bcOQeJhqlcbpx6aJXZp4"

# Pastas do iCloud
DIRS=(
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_PT"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_ES"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_FR"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_IT"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_ING"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_AL"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_GK_PT"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_GK_ES"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_GK_FR"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_GK_IT"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_GK_ING"
  "$HOME/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/Minutos_Jogadores_GK_AL"
)

echo "==================================="
echo "FootLadger Performance Sync"
echo "==================================="
echo ""
echo "Verificando pastas do iCloud..."
echo ""

# Verificar se pelo menos uma pasta existe
FOUND=false
for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    FOUND=true
    COUNT=$(find "$dir" -name "*.csv" 2>/dev/null | wc -l | tr -d ' ')
    echo "✓ $dir ($COUNT ficheiros)"
  fi
done

if [ "$FOUND" = false ]; then
  echo ""
  echo "❌ ERRO: Nenhuma pasta encontrada!"
  echo ""
  echo "Certifica-te que:"
  echo "1. O iCloud Drive está ativo"
  echo "2. As pastas estão sincronizadas"
  echo "3. Os caminhos estão corretos"
  echo ""
  exit 1
fi

echo ""
echo "Instalando dependências necessárias..."

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Criar package.json mínimo
cat > package.json << 'EOF'
{
  "name": "footladger-sync",
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4"
  }
}
EOF

# Instalar dependências
npm install --silent > /dev/null 2>&1

# Criar script de sync inline
cat > sync.js << 'SYNCEOF'
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DIRS = process.env.DIRS.split(':');

function normalizePlayerName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    if (!matchDate || scoreValue === undefined || scoreValue === null) continue;
    const parsedDate = new Date(matchDate);
    if (isNaN(parsedDate.getTime())) continue;
    const score = parseFloat(scoreValue);
    if (isNaN(score)) continue;
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

async function getPlayerFromDB(fileName) {
  const playerNameFromFile = path.basename(fileName, path.extname(fileName));
  const normalizedFileName = normalizePlayerName(playerNameFromFile);
  const { data: players } = await supabase.from('player_pool').select('id, name');
  if (!players) return null;
  for (const player of players) {
    if (normalizePlayerName(player.name) === normalizedFileName) {
      return player;
    }
  }
  return null;
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

async function sync() {
  console.log('\nIniciando sincronização...\n');
  const files = [];
  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    const dirFiles = fs.readdirSync(dir)
      .filter(file => file.endsWith('.csv'))
      .map(file => path.join(dir, file));
    files.push(...dirFiles);
  }

  console.log(`Total: ${files.length} ficheiros CSV encontrados\n`);
  const weeklySelectionsMap = await getUserWeeklySelections();
  const userPointsUpdates = new Map();

  for (const file of files) {
    try {
      const fileName = path.basename(file);
      const player = await getPlayerFromDB(fileName);
      if (!player) continue;

      const weeklyScores = parsePlayerCSVFile(file);
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
        }
      }
    } catch (error) {
      console.error(`Erro: ${path.basename(file)}`);
    }
  }

  console.log(`\nAtualizando ${userPointsUpdates.size} registos...\n`);
  let updated = 0;
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
    if (!error) updated++;
  }
  console.log(`✅ Sincronização completa! ${updated} registos atualizados.\n`);
}

sync().catch(console.error);
SYNCEOF

# Exportar variáveis e executar
export SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_KEY="$SUPABASE_KEY"
export DIRS="${DIRS[0]}:${DIRS[1]}:${DIRS[2]}:${DIRS[3]}:${DIRS[4]}:${DIRS[5]}:${DIRS[6]}:${DIRS[7]}:${DIRS[8]}:${DIRS[9]}:${DIRS[10]}:${DIRS[11]}"

echo ""
echo "Sincronizando dados..."
echo ""

node sync.js

# Limpar
cd /
rm -rf "$TEMP_DIR"

echo ""
echo "==================================="
echo "Sync concluído!"
echo "==================================="
