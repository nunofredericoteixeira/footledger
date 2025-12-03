#!/bin/bash

# Script para converter todos os ficheiros .xlsx para .csv
# Usa Python com a biblioteca openpyxl

echo "🔄 A converter ficheiros .xlsx para .csv..."
echo ""

# Verifica se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Por favor instala Python3 primeiro."
    exit 1
fi

# Verifica se openpyxl está instalado, senão instala
python3 -c "import openpyxl" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 A instalar biblioteca openpyxl..."
    pip3 install openpyxl
    echo ""
fi

# Script Python para fazer a conversão
python3 << 'PYTHON_SCRIPT'
import os
import sys
from pathlib import Path

try:
    from openpyxl import load_workbook
    import csv
except ImportError:
    print("❌ Erro: biblioteca openpyxl não instalada")
    print("Execute: pip3 install openpyxl")
    sys.exit(1)

def convert_xlsx_to_csv(xlsx_path, csv_path):
    """Converte ficheiro .xlsx para .csv"""
    try:
        # Carrega o workbook
        wb = load_workbook(xlsx_path, data_only=True)
        ws = wb.active

        # Escreve para CSV
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            for row in ws.iter_rows(values_only=True):
                writer.writerow(row)

        return True
    except Exception as e:
        print(f"❌ Erro ao converter {xlsx_path}: {e}")
        return False

# Procura todos os ficheiros .xlsx no diretório atual e subdiretórios
current_dir = Path.cwd()
xlsx_files = list(current_dir.rglob("*.xlsx"))

if not xlsx_files:
    print("⚠️  Nenhum ficheiro .xlsx encontrado no diretório atual")
    sys.exit(0)

print(f"📁 Encontrados {len(xlsx_files)} ficheiros .xlsx\n")

converted = 0
failed = 0

for xlsx_file in xlsx_files:
    # Ignora ficheiros temporários do Excel (começam com ~$)
    if xlsx_file.name.startswith('~$'):
        continue

    # Cria o nome do ficheiro CSV
    csv_file = xlsx_file.with_suffix('.csv')

    print(f"🔄 {xlsx_file.name} → {csv_file.name}")

    if convert_xlsx_to_csv(xlsx_file, csv_file):
        converted += 1
        print(f"   ✅ Convertido com sucesso")
    else:
        failed += 1

    print()

print("=" * 50)
print(f"✅ Conversão concluída!")
print(f"   Convertidos: {converted}")
if failed > 0:
    print(f"   ❌ Falhados: {failed}")
print("=" * 50)

PYTHON_SCRIPT

echo ""
echo "✨ Pronto! Os ficheiros .csv estão no mesmo diretório dos .xlsx"
