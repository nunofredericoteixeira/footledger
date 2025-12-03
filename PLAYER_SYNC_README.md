# Sistema de Sincronização de Pontuação de Jogadores

Este documento explica como funciona o sistema automático de pontuação dos jogadores no FootLedger.

## Visão Geral

O sistema monitora ficheiros Excel na pasta do iCloud e calcula automaticamente os pontos dos jogadores com base nos seus desempenhos durante a semana do "Eleven of the Week" (terça a segunda).

## Como Funciona

### 1. Estrutura dos Ficheiros

Os ficheiros Excel devem estar localizados em:
```
/Users/nunoteixeira/Library/Mobile Documents/com~apple~CloudDocs/Minutos_Jogadores_PT
```

Formato dos ficheiros:
- Nome: `2025-2026_[NomeDoJogador].xlsx`
- Exemplo: `2025-2026_Cristiano_Ronaldo.xlsx`

### 2. Estrutura Interna dos Ficheiros Excel

Cada ficheiro deve conter:
- **Coluna A**: Data do jogo
- **Coluna U**: Pontuação do desempenho do jogador

### 3. Regras de Pontuação

- **11 Inicial**: Recebe 100% da pontuação (valor total da coluna U)
- **5 Suplentes**: Recebe 50% da pontuação (metade do valor da coluna U)
- **Período**: Apenas datas dentro da semana ativa (terça a segunda)
- **Jogador inexistente**: É ignorado (sem erro)
- **Sem dados**: Mantém pontuação 0

### 4. Definição da Semana

A semana de jogo é definida automaticamente quando um utilizador valida o seu "Eleven of the Week":
- **Início**: Terça-feira às 00:00
- **Fim**: Segunda-feira às 23:59

## Instalação e Execução

### 1. Instalar Dependências

```bash
npm install
```

Isto instalará:
- `xlsx`: Para ler ficheiros Excel

### 2. Configurar Variáveis de Ambiente

Certifique-se que o ficheiro `.env` contém:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configurar Sincronização Automática (Diária às 7h)

O sistema está configurado para sincronizar automaticamente todos os dias às 7h da manhã.

**Configurar no macOS/Linux usando cron:**

1. Edite o crontab:
```bash
crontab -e
```

2. Adicione esta linha (ajuste o caminho para o seu projeto):
```
0 7 * * * /caminho/para/projeto/sync-cron.sh
```

Por exemplo:
```
0 7 * * * /Users/nunoteixeira/footledger/sync-cron.sh
```

3. Verifique se o cron está ativo:
```bash
crontab -l
```

**Configurar no macOS usando launchd (alternativa recomendada):**

1. Crie o ficheiro `~/Library/LaunchAgents/com.footledger.sync.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.footledger.sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/caminho/para/projeto/sync-cron.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>7</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/footledger-sync.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/footledger-sync-error.log</string>
</dict>
</plist>
```

2. Carregue o agente:
```bash
launchctl load ~/Library/LaunchAgents/com.footledger.sync.plist
```

3. Para descarregar:
```bash
launchctl unload ~/Library/LaunchAgents/com.footledger.sync.plist
```

### 4. Executar Sincronização Manual

Se precisar executar a sincronização manualmente:

```bash
npm run sync-players
```

Ou execute diretamente o script cron:
```bash
./sync-cron.sh
```

### 5. Verificar Logs

Os logs são guardados em `/tmp/footledger-sync.log`:

```bash
tail -f /tmp/footledger-sync.log
```

## Como os Pontos São Calculados

1. **Sincronização Diária (7h da manhã)**:
   - O script executa automaticamente todos os dias às 7h
   - Faz scan de todos os ficheiros Excel na pasta do iCloud
   - Carrega os dados atualizados para o Supabase
   - Um trigger na base de dados recalcula automaticamente todos os "Eleven of the Week" ativos

2. **Quando um utilizador valida o Eleven**:
   - As datas da semana (terça a segunda) são definidas automaticamente
   - O sistema procura os desempenhos de todos os jogadores selecionados nesse período
   - Os pontos são calculados:
     - 11 Inicial: Soma total dos valores da coluna U
     - Suplentes: Soma de 50% dos valores da coluna U
   - O total é armazenado em `calculated_points`

3. **Atualização Automática**:
   - Após cada sincronização diária (7h da manhã)
   - Todos os "Eleven of the Week" da semana correspondente são recalculados automaticamente
   - Os utilizadores veem os pontos atualizados no dashboard a partir das 7h

## Estrutura da Base de Dados

### Tabela: `player_performance_data`

Armazena os dados de desempenho individuais:
```sql
- id: uuid
- player_name: text (nome do jogador)
- match_date: date (data do jogo)
- performance_score: decimal (pontuação)
- season: text (época, ex: "2025-2026")
- created_at: timestamptz
- updated_at: timestamptz
```

### Tabela: `weekly_eleven_selections` (atualizada)

Campos adicionados:
```sql
- week_start_date: date (início da semana)
- week_end_date: date (fim da semana)
- calculated_points: decimal (pontos calculados automaticamente)
```

### Funções SQL

- `calculate_weekly_eleven_points(selection_id)`: Calcula pontos para uma seleção específica
- `recalculate_all_weekly_points()`: Recalcula todos os "Eleven of the Week" ativos
- Trigger automático após INSERT/UPDATE/DELETE em `player_performance_data`

## Resolução de Problemas

### O script não encontra a pasta
- Verifique se o caminho está correto
- No Mac, a pasta do iCloud pode ter permissões especiais
- Certifique-se que a pasta existe e está sincronizada

### Os pontos não são atualizados
- Verifique se o cron/launchd está configurado corretamente
- Execute manualmente: `./sync-cron.sh` para testar
- Verifique os logs: `tail -f /tmp/footledger-sync.log`
- Confirme que os nomes dos jogadores nos ficheiros Excel correspondem aos nomes na base de dados
- Verifique se o caminho no script cron está correto

### Ficheiros não são processados
- Verifique o formato do nome: `2025-2026_NomeJogador.xlsx`
- Certifique-se que a coluna A tem datas válidas
- Certifique-se que a coluna U tem valores numéricos

### Erro de permissões no Supabase
- Verifique se as políticas RLS estão ativas
- Admins devem ter permissão para inserir/atualizar `player_performance_data`
- Todos os utilizadores autenticados devem poder ler

## Monitorização

O script fornece logs detalhados em `/tmp/footledger-sync.log`:
- Data e hora de cada sincronização
- ✓ Ficheiros processados com sucesso
- Número de registos carregados por jogador
- Erros de parsing ou upload
- Tempo de conclusão da sincronização

Para monitorizar em tempo real:
```bash
tail -f /tmp/footledger-sync.log
```

Para ver apenas os erros:
```bash
tail -f /tmp/footledger-sync-error.log
```

## Segurança

- Apenas admins podem inserir/atualizar dados de desempenho
- Row Level Security (RLS) está ativado
- Todos os utilizadores autenticados podem ver os dados
- Os cálculos são feitos no servidor (SECURITY DEFINER)
