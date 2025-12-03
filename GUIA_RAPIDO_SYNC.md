# Guia Rápido - Sincronização de Performance

## Como Obter o Projeto Localmente

### Opção 1: Download via Bolt.new
1. Na interface do Bolt.new, usa a opção "Download Project" ou "Export"
2. Extrai o ficheiro ZIP/TAR.GZ descarregado

### Opção 2: Clone via Git (se disponível)
```bash
git clone [URL-DO-REPOSITORIO]
cd footledger
```

## Setup Inicial

```bash
# 1. Instalar dependências
npm install

# 2. Verificar ficheiro .env existe
cat .env

# 3. Iniciar desenvolvimento
npm run dev
```

## Atualizar Performance Semanal - PROCESSO SIMPLES

### Passo 1: Preparar o CSV
Cria um ficheiro CSV com o nome `Jornada_X.csv` (onde X é o número da jornada):

**Formato obrigatório:**
```csv
Nome,Equipa,Pontos,Jornada
Cristiano Ronaldo,Al Nassr,8.5,5
Lionel Messi,Inter Miami,9.0,5
```

### Passo 2: Colocar CSV na Pasta do Projeto
```bash
cp ~/Downloads/Jornada_5.csv ~/Desktop/project/
```

### Passo 3: Executar Upload
```bash
# Upload automático de TODOS os CSVs Jornada_*.csv
node import-all-performance-data.js
```

### Passo 4: Verificar
1. Console mostra quantos jogadores foram atualizados
2. Acede: http://localhost:5173
3. Verifica "Top Players"

## Scripts Disponíveis

```bash
npm run dev                    # Servidor desenvolvimento
npm run import-performance     # Import CSVs performance
```
