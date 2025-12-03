#!/bin/bash

echo "======================================="
echo "FootLedger - Instalação de Sync Automático"
echo "======================================="
echo ""

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_SCRIPT="$PROJECT_DIR/sync-cron.sh"

if [ ! -f "$CRON_SCRIPT" ]; then
  echo "❌ Erro: sync-cron.sh não encontrado!"
  exit 1
fi

chmod +x "$CRON_SCRIPT"

echo "A configurar cron job para sincronização diária..."
echo ""
echo "O script irá correr todos os dias às 7:00 da manhã"
echo ""

CRON_COMMAND="0 7 * * * cd \"$PROJECT_DIR\" && ./sync-cron.sh >> \"$PROJECT_DIR/sync.log\" 2>&1"

(crontab -l 2>/dev/null | grep -v "sync-cron.sh"; echo "$CRON_COMMAND") | crontab -

if [ $? -eq 0 ]; then
  echo "✅ Cron job instalado com sucesso!"
  echo ""
  echo "Detalhes:"
  echo "  - Horário: Todos os dias às 7:00 AM"
  echo "  - Script: $CRON_SCRIPT"
  echo "  - Log: $PROJECT_DIR/sync.log"
  echo ""
  echo "Para ver os cron jobs ativos:"
  echo "  crontab -l"
  echo ""
  echo "Para remover este cron job:"
  echo "  crontab -l | grep -v 'sync-cron.sh' | crontab -"
  echo ""
  echo "Para testar agora manualmente:"
  echo "  ./sync-cron.sh"
else
  echo "❌ Erro ao instalar cron job"
  exit 1
fi
