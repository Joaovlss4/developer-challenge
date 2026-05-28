#!/usr/bin/env bash
#
# setup.sh — Configuração inicial do repositório
#
# Execute este script uma vez antes de iniciar o desenvolvimento.
# Ele configura os hooks Git necessários para o funcionamento correto
# das proteções do repositório.
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "Configurando o repositório do Developer Challenge..."
echo ""

# Verifica se está dentro de um repositório git
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo -e "${RED}Erro: Este script deve ser executado dentro de um repositório Git.${NC}"
  exit 1
fi

# Configura o diretório de hooks para .githooks/
git config core.hooksPath .githooks

# Garante permissão de execução no hook
chmod +x .githooks/pre-push

echo -e "${GREEN}✓${NC} Hooks Git configurados em .githooks/"
echo -e "${GREEN}✓${NC} Hook pre-push ativado"
echo ""
echo -e "${YELLOW}Importante:${NC} Leia a seção '⚠️ Regras do Repositório' no README.md antes de começar."
echo ""
echo -e "${GREEN}Setup concluído. Boa sorte no desafio!${NC}"
echo ""
