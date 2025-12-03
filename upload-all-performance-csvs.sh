#!/bin/bash

# Configuração
SUPABASE_URL="https://jdqdfkiquuyfxvdjtjxv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcWRma2lxdXV5Znh2ZGp0anh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4OTE3NTUsImV4cCI6MjA0MzQ2Nzc1NX0.X4BzfeL9SkhKpkb52nNF23V0HrHk3vLi8hYv0BsD50I"
CLOUD_DOCS_PATH="/Users/nunoteixeira/Desktop/-footledger-download 2"

# Lista de pastas
FOLDERS=(
  "Minutos_Jogadores_PT"
  "Minutos_Jogadores_ES"
  "Minutos_Jogadores_FR"
  "Minutos_Jogadores_IT"
  "Minutos_Jogadores_ING"
  "Minutos_Jogadores_AL"
  "Minutos_Jogadores_GK_PT"
  "Minutos_Jogadores_GK_ES"
  "Minutos_Jogadores_GK_FR"
  "Minutos_Jogadores_GK_IT"
  "Minutos_Jogadores_GK_ING"
  "Minutos_Jogadores_GK_AL"
)

echo "🚀 Iniciando upload de ficheiros CSV de performance..."
echo ""

total_files=0
uploaded_files=0
failed_files=0

for folder in "${FOLDERS[@]}"; do
  folder_path="$CLOUD_DOCS_PATH/$folder"

  if [ ! -d "$folder_path" ]; then
    echo "⚠️  Pasta não encontrada: $folder"
    continue
  fi

  echo "📁 Processando pasta: $folder"

  for csvfile in "$folder_path"/*.csv; do
    if [ ! -f "$csvfile" ]; then
      continue
    fi

    total_files=$((total_files + 1))
    playerName=$(basename "$csvfile" .csv)

    echo -n "   Uploading: $playerName ... "

    # Ler conteúdo do CSV e escapar para JSON
    csvContent=$(cat "$csvfile" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')

    # Escapar playerName para JSON (incluindo acentos)
    playerNameEscaped=$(echo "$playerName" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')

    # Fazer POST request com charset UTF-8
    response=$(curl -s -w "\n%{http_code}" -X POST \
      "$SUPABASE_URL/functions/v1/import-csv-performance" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json; charset=utf-8" \
      --data-raw "{\"csvContent\": \"$csvContent\", \"playerName\": \"$playerNameEscaped\", \"season\": \"2025-2026\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
      echo "✅"
      uploaded_files=$((uploaded_files + 1))
    else
      echo "❌ (HTTP $http_code)"
      echo "     Error: $body"
      failed_files=$((failed_files + 1))
    fi
  done

  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo:"
echo "   Total de ficheiros: $total_files"
echo "   Uploaded com sucesso: $uploaded_files"
echo "   Falhados: $failed_files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
