# Como Copiar o Projeto FootLedger do Bolt.new

O Bolt.new não permite download direto. Usa este método manual simples:

## Passo 1: Criar Pasta Local

```bash
mkdir footledger-local
cd footledger-local
```

## Passo 2: Copiar Ficheiros Essenciais

No **editor do Bolt.new**, copia o conteúdo de cada ficheiro e cria-o localmente:

### Ficheiros Raiz (CRÍTICOS):

**package.json** - Copia e cola o conteúdo completo
**package-lock.json** - Copia e cola o conteúdo completo
**.env** - **ESSENCIAL** - Copia as variáveis:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

**vite.config.ts**
**tsconfig.json**
**index.html**
**tailwind.config.js**

### Script Essencial:

**import-all-performance-data.js** - Para actualizar pontuações

## Passo 3: Copiar Pastas

### src/ (Código Principal)
Cria a pasta `src/` e copia todos os ficheiros:
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/components/` - Todos os ficheiros .tsx
- `src/lib/` - Todos os ficheiros

### public/ (Assets)
Copia a pasta `public/` com todas as imagens

### supabase/ (Base de Dados)
**IMPORTANTE**: Não precisas copiar isto se a base de dados já está configurada online

## Passo 4: Instalar e Executar

```bash
npm install
npm run dev
```

## Actualizar Performance de Jogadores

1. Cria o ficheiro CSV:
```csv
Nome,Equipa,Pontos,Jornada
Cristiano Ronaldo,Al Nassr,8.5,5
Bernardo Silva,Manchester City,9.2,5
```

2. Guarda como `Jornada_X.csv` (X = número da jornada)

3. Executa:
```bash
node import-all-performance-data.js
```

## Estrutura Mínima Necessária

```
footledger-local/
├── .env                    ← CRÍTICO
├── package.json            ← CRÍTICO
├── package-lock.json
├── vite.config.ts
├── index.html
├── import-all-performance-data.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/
    └── lib/
```

## Ficheiros Mais Importantes

1. **.env** - Sem isto nada funciona
2. **package.json** - Define as dependências
3. **src/App.tsx** - Aplicação principal
4. **src/lib/supabase.ts** - Conexão à base de dados
5. **import-all-performance-data.js** - Script de actualização

## Troubleshooting

**Módulos não encontrados?**
```bash
rm -rf node_modules
npm install
```

**Erro de conexão?**
Verifica o `.env` - as credenciais têm que estar correctas

**Interface diferente?**
Confirma que copiaste todos os componentes de `src/components/`

---

**Nota**: Podes copiar apenas os ficheiros essenciais primeiro e testar. Depois adiciona os restantes conforme necessário.
