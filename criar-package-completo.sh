#!/bin/bash

# Script para criar package completo do FootLedger
# Execute: bash criar-package-completo.sh

PACKAGE_NAME="footledger-completo-$(date +%Y%m%d-%H%M%S)"
TEMP_DIR="/tmp/$PACKAGE_NAME"

echo "📦 Criando package completo do FootLedger..."

# Criar estrutura
mkdir -p "$TEMP_DIR"

# Copiar ficheiros raiz essenciais
echo "📄 Copiando ficheiros de configuração..."
cp package.json "$TEMP_DIR/" 2>/dev/null
cp package-lock.json "$TEMP_DIR/" 2>/dev/null
cp vite.config.ts "$TEMP_DIR/" 2>/dev/null
cp tsconfig.json "$TEMP_DIR/" 2>/dev/null
cp tsconfig.app.json "$TEMP_DIR/" 2>/dev/null
cp tsconfig.node.json "$TEMP_DIR/" 2>/dev/null
cp tailwind.config.js "$TEMP_DIR/" 2>/dev/null
cp postcss.config.js "$TEMP_DIR/" 2>/dev/null
cp eslint.config.js "$TEMP_DIR/" 2>/dev/null
cp index.html "$TEMP_DIR/" 2>/dev/null
cp .gitignore "$TEMP_DIR/" 2>/dev/null
cp .env "$TEMP_DIR/" 2>/dev/null

# Copiar scripts de sync
echo "🔄 Copiando scripts de sincronização..."
cp import-all-performance-data.js "$TEMP_DIR/" 2>/dev/null
cp sync-player-data.js "$TEMP_DIR/" 2>/dev/null
cp sync-performance-data.js "$TEMP_DIR/" 2>/dev/null
cp import-player-csvs.js "$TEMP_DIR/" 2>/dev/null

# Copiar guias
echo "📚 Copiando documentação..."
cp GUIA_SETUP_LOCAL.md "$TEMP_DIR/" 2>/dev/null
cp GUIA_RAPIDO_SYNC.md "$TEMP_DIR/" 2>/dev/null

# Copiar pastas completas
echo "📁 Copiando código fonte..."
cp -r src "$TEMP_DIR/" 2>/dev/null
cp -r public "$TEMP_DIR/" 2>/dev/null
cp -r supabase "$TEMP_DIR/" 2>/dev/null

# Criar ZIP
cd /tmp
echo "🗜️  Comprimindo..."
tar -czf "${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME"

echo "✅ Package criado: /tmp/${PACKAGE_NAME}.tar.gz"
echo "📊 Tamanho: $(du -h /tmp/${PACKAGE_NAME}.tar.gz | cut -f1)"
echo ""
echo "Para usar:"
echo "  1. Descarrega: /tmp/${PACKAGE_NAME}.tar.gz"
echo "  2. Extrai: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "  3. Entra: cd $PACKAGE_NAME"
echo "  4. Instala: npm install"
echo "  5. Executa: npm run dev"

# Limpar temp dir
rm -rf "$TEMP_DIR"
