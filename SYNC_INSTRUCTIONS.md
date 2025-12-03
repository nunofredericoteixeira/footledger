# Como Sincronizar Dados de Performance - GUIA PRÁTICO

## OPÇÃO MAIS SIMPLES - Script Standalone (RECOMENDADO!)

Este script NÃO precisa do projeto descarregado! Executa sozinho no teu Mac.

### Passo 1: Fazer Download do Script
1. No Bolt, clica no ficheiro `sync-cron.sh` na barra lateral
2. Clica em "Download" ou copia todo o conteúdo
3. Guarda como `sync-footladger.sh` no Desktop

### Passo 2: Dar Permissões
Abrir **Terminal** e executar:
```bash
chmod +x ~/Desktop/sync-footladger.sh
```

### Passo 3: Executar
```bash
~/Desktop/sync-footladger.sh
```

**Pronto!** O script:
- Verifica as pastas do iCloud automaticamente
- Instala as dependências necessárias
- Lê todos os CSV
- Sincroniza com o Supabase
- Limpa tudo no final

---

## OPÇÃO ALTERNATIVA - Com o Projeto Completo

Se já tens o projeto no Mac ou queres fazer download:

### Passo 1: Localizar/Download do Projeto

**Se já tens o projeto:**
```bash
# Ir para a pasta onde está o projeto (exemplo):
cd ~/Downloads/footladger
# ou
cd ~/Desktop/footladger
```

**Se não tens o projeto:**
1. No Bolt, clicar em "Download Project" (canto superior direito)
2. Descompactar o ZIP
3. Abrir Terminal e ir para a pasta:
```bash
cd ~/Downloads/footladger  # ajustar o caminho se necessário
```

### Passo 2: Instalar Dependências
```bash
npm install
```

### Passo 3: Executar Sync
```bash
npm run sync-performance
```

---

## OPÇÃO AUTOMÁTICA - Cron Job

Para executar automaticamente todos os dias às 3h da manhã:

### Com o Script Standalone:
```bash
# Abrir configuração do cron
crontab -e

# Adicionar esta linha:
0 3 * * * ~/Desktop/sync-footladger.sh >> ~/Desktop/sync.log 2>&1
```

### Com o Projeto Completo:
```bash
# Abrir configuração do cron
crontab -e

# Adicionar esta linha (ajustar o caminho):
0 3 * * * cd ~/Downloads/footladger && npm run sync-performance >> ~/Desktop/sync.log 2>&1
```

## Verificar Resultados

Depois de executar o sync:
1. Abrir a aplicação Footladger
2. Ir para **"A Minha Equipa"**
3. Ver os pontos atualizados de cada jogador

## Troubleshooting

### "npm: command not found"
Instalar Node.js: https://nodejs.org/

### "Directory not found"
Confirmar que as pastas do iCloud estão sincronizadas:
- Ir para Preferências do Sistema > Apple ID > iCloud
- Confirmar que "iCloud Drive" está ativo
- Verificar se as pastas existem

### "Permission denied"
```bash
chmod +x sync-performance-data.js
```

## Notas Importantes

- O script lê ficheiros CSV das 12 pastas do iCloud
- Cada ficheiro CSV deve ter o nome do jogador
- O sync só funciona quando executado no teu Mac (não no servidor Bolt)
- Os dados são enviados diretamente para o Supabase
