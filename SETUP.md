# Guia de Instalação - ClawAi

## 1. Instalar Node.js e npm

### Opção 1: Usando NVM (Recomendado - permite múltiplas versões)

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar o terminal ou executar:
source ~/.bashrc

# Instalar Node.js LTS
nvm install --lts
nvm use --lts
```

### Opção 2: Usando apt (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. Verificar instalação

```bash
node --version  # Deve mostrar v18.x ou superior
npm --version   # Deve mostrar 9.x ou superior
```

## 3. Instalar dependências do projeto

```bash
npm install
```

## 4. Configurar Tailwind CSS e shadcn-ui

Após instalar as dependências, execute:

```bash
# Instalar Tailwind CSS
npx tailwindcss init -p

# Inicializar shadcn-ui
npx shadcn-ui@latest init
```

## 5. Rodar o projeto

```bash
npm run dev
```

