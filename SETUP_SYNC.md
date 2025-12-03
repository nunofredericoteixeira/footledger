# Configuração de Sincronização Automática

Este guia explica como configurar a sincronização automática dos dados de performance do iCloud para a base de dados.

## Opção 1: Sincronização Automática (Recomendado)

O script corre automaticamente todos os dias às 7:00 da manhã.

### Instalação

No terminal, dentro da pasta do projeto:

```bash
chmod +x install-cron.sh
./install-cron.sh
```

Pronto! A sincronização está configurada.

### Verificar se está a funcionar

Para ver o cron job ativo:
```bash
crontab -l
```

Para ver o log da última sincronização:
```bash
cat sync.log
```

### Desinstalar

Para remover a sincronização automática:
```bash
crontab -l | grep -v 'sync-cron.sh' | crontab -
```

## Opção 2: Sincronização Manual

Se preferires controlar quando sincronizar:

```bash
./sync-cron.sh
```

## Pastas Configuradas

O sistema sincroniza automaticamente as seguintes 12 pastas do iCloud:

1. `Minutos_Jogadores_PT` (Portugal)
2. `Minutos_Jogadores_ES` (Espanha)
3. `Minutos_Jogadores_FR` (França)
4. `Minutos_Jogadores_IT` (Itália)
5. `Minutos_Jogadores_ING` (Inglaterra)
6. `Minutos_Jogadores_AL` (Alemanha)
7. `Minutos_Jogadores_GK_PT` (Guarda-Redes Portugal)
8. `Minutos_Jogadores_GK_ES` (Guarda-Redes Espanha)
9. `Minutos_Jogadores_GK_FR` (Guarda-Redes França)
10. `Minutos_Jogadores_GK_IT` (Guarda-Redes Itália)
11. `Minutos_Jogadores_GK_ING` (Guarda-Redes Inglaterra)
12. `Minutos_Jogadores_GK_AL` (Guarda-Redes Alemanha)

Todas dentro de: `~/Library/Mobile Documents/com~apple~CloudDocs/FootLedger Admin/`

## Como Funciona

1. O script verifica todas as 12 pastas
2. Lê todos os ficheiros CSV de jogadores
3. Calcula os pontos semanais baseado nas performances
4. Atualiza automaticamente a base de dados
5. Gera um log com o resultado

## Resolução de Problemas

**As pastas não são encontradas:**
- Verifica que o iCloud Drive está ativo
- Confirma que as pastas estão sincronizadas (sem ícone de nuvem)
- Abre o Finder e vai para `iCloud Drive/FootLedger Admin`

**O cron não está a correr:**
- Confirma que deste permissões ao Terminal nas Definições do Sistema
- Verifica: Sistema > Privacidade e Segurança > Acesso Total ao Disco
- Adiciona o Terminal à lista

**Erros no log:**
- Verifica o ficheiro `sync.log` para ver detalhes
- Os erros mais comuns são pastas não sincronizadas ou ficheiros corrompidos
