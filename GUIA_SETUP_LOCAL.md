# Guia Setup Local - FootLedger

## IMPORTANTE: Como Obter o Projeto

O projeto está no Bolt.new. Para trabalhar localmente, segue ESTES passos:

### Método 1: Export Manual (RECOMENDADO)

1. **Cria uma nova pasta local:**
   ```bash
   mkdir footledger-local
   cd footledger-local
   ```

2. **Copia estes ficheiros essenciais** (através do interface do Bolt.new):

#### Ficheiros de Configuração Raiz:
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `tailwind.config.js`
- `postcss.config.js`
- `eslint.config.js`
- `index.html`
- `.gitignore`

#### Ficheiro CRÍTICO:
- `.env` - **ESSENCIAL** para conexão à base de dados

#### Scripts de Sincronização:
- `import-all-performance-data.js`
- `sync-player-data.js`
- `sync-performance-data.js`

3. **Copia as pastas completas:**
   - `src/` (toda a pasta)
   - `public/` (toda a pasta)
   - `supabase/` (toda a pasta - migrações e functions)

4. **Instala dependências:**
   ```bash
   npm install
   ```

5. **Testa:**
   ```bash
   npm run dev
   ```

### Método 2: Via Git (se configurado)

Se o projeto estiver num repositório Git:
```bash
git clone [URL]
cd footledger
npm install
npm run dev
```

## Estrutura Mínima Necessária

```
footledger-local/
├── .env                          # CRÍTICO
├── package.json                  # CRÍTICO
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── import-all-performance-data.js  # Para updates
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/               # Todos os componentes
│   └── lib/                      # supabase.ts, translations, etc
├── public/                       # Imagens e assets
└── supabase/
    ├── migrations/               # Todas as migrações SQL
    └── functions/                # Edge functions
```

## Conteúdo do .env (ESSENCIAL)

O ficheiro `.env` deve ter estas variáveis (pede os valores corretos):

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

## Após Setup - Atualizar Performance

1. **Cria o CSV:**
   ```csv
   Nome,Equipa,Pontos,Jornada
   Cristiano Ronaldo,Al Nassr,8.5,5
   ```

2. **Guarda como:** `Jornada_5.csv` na pasta raiz

3. **Executa:**
   ```bash
   node import-all-performance-data.js
   ```

## Troubleshooting

**Erro de módulos não encontrados?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Erro de conexão Supabase?**
- Verifica o ficheiro `.env`
- Confirma as credenciais

**Scripts não funcionam?**
- Verifica que tens `dotenv` instalado: `npm install dotenv`
- Confirma que estás na pasta raiz do projeto

## Contacto para Suporte

Se precisares dos valores do `.env` ou tiveres problemas, contacta o administrador do projeto.
