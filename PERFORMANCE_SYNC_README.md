# Performance Data Sync - Instruções

Este documento explica como sincronizar os dados de performance dos jogadores do Excel para a base de dados.

## Requisitos

1. Ficheiros Excel na pasta: `/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_PT`
2. **Cada jogador tem seu próprio ficheiro Excel** (nome do ficheiro = nome do jogador)
3. Formato esperado dos ficheiros Excel:
   - **Coluna A (0)**: Data do jogo
   - **Coluna Y (24)**: Pontuação do jogo (performance score)

## Como Funciona

### Sistema de Pontuação

O script calcula os pontos de forma inteligente:

1. **Lê cada ficheiro Excel** (um por jogador)
2. **Agrupa pontuações por semana** (Terça a Segunda)
3. **Verifica se o jogador foi selecionado** naquela semana no "Eleven of the Week"
4. **Calcula pontos baseado na posição**:
   - **Titular (11 principais)**: 100% dos pontos (coluna Y)
   - **Suplente (5 reservas)**: 50% dos pontos

### Pontos Totais vs Pontos Semanais

- **Pontos Totais**: Soma de TODAS as semanas em que o jogador foi selecionado
- **Pontos Semanais**: Pontos da última semana em que o jogador foi selecionado

## Como Executar

```bash
npm run sync-performance
```

### O que o script faz:

1. Lê todos os ficheiros `.xlsx` e `.xls` da pasta
2. Identifica o jogador pelo nome do ficheiro
3. Agrupa as pontuações por semana
4. Cruza com as seleções semanais dos utilizadores
5. Calcula pontos apenas quando o jogador foi selecionado
6. Atualiza a base de dados automaticamente

### Exemplo Prático

**Ficheiro**: `Cristiano Ronaldo.xlsx`

**Conteúdo do Excel**:
```
Data        | ... | Coluna Y (Pontos)
2025-10-07  | ... | 8.5
2025-10-10  | ... | 9.2
2025-10-14  | ... | 7.8
```

**Seleções do Utilizador**:
- Semana 1 (07-13 Out): Ronaldo como **Titular** no Eleven
- Semana 2 (14-20 Out): Ronaldo como **Suplente** no Eleven

**Resultado**:
- Semana 1: (8.5 + 9.2) × 100% = **17.7 pontos** (arredondado para 18)
- Semana 2: 7.8 × 50% = **3.9 pontos** (arredondado para 4)
- **Pontos Totais**: 18 + 4 = **22 pontos**
- **Pontos Semanais** (última semana): **4 pontos**

## Verificar Resultados

Os pontos aparecem automaticamente no ecrã **"A Minha Equipa"**:
- Cada jogador mostra os seus **Pontos Totais** e **Pontos Semanais**
- Os valores são atualizados em tempo real após o sync

## Estrutura de Dados

### user_player_total_points
Armazena pontuação agregada por utilizador:
```
- user_id: ID do utilizador
- player_id: ID do jogador
- total_points: Soma de todas as semanas selecionadas
- last_week_points: Pontos da última semana selecionada
```

### weekly_eleven_selections
Armazena as seleções semanais:
```
- user_id: ID do utilizador
- week_start_date: Terça (início da semana)
- week_end_date: Segunda (fim da semana)
- starting_eleven: Array com 11 titulares
- substitutes: Array com 5 suplentes
```

## Troubleshooting

### Jogadores não encontrados
Se o script reportar jogadores não encontrados:
1. Verificar se o nome do ficheiro Excel corresponde ao nome do jogador na BD
2. Os nomes são normalizados (minúsculas, sem acentos)
3. Exemplo: `João Félix.xlsx` → procura por "joao felix" na BD

### Pontos não aparecem
1. Verificar se o jogador foi realmente selecionado no "Eleven of the Week"
2. Confirmar que as datas da semana coincidem (Terça a Segunda)
3. Verificar se há dados na coluna Y do Excel

### Pontos parecem errados
1. Titulares recebem 100% dos pontos
2. Suplentes recebem 50% dos pontos
3. Os pontos totais são a soma de TODAS as semanas selecionadas
4. Os pontos semanais mostram APENAS a última semana

## Notas Importantes

- **Nome do ficheiro = Nome do jogador**: O sistema identifica o jogador pelo nome do ficheiro
- **Apenas semanas selecionadas contam**: Se o jogador não foi escolhido numa semana, não ganha pontos
- **Cálculo automático**: O sistema agrega automaticamente todos os jogos da mesma semana
- **Semanas vão de Terça a Segunda**: O sistema detecta automaticamente a semana de cada jogo
