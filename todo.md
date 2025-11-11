# OPA – Operação de Prevenção e Análise · TODO

## Banco de Dados (BD2)
- [x] Criar tabelas: usuarios, clientes, analises, fraudes, logs_auditoria
- [x] Criar índices e constraints
- [x] Implementar migrations com Drizzle

## Backend (Node.js + Express + tRPC)
- [x] Autenticação JWT (login, refresh, logout)
- [x] RBAC (admin/analista)
- [ ] Rotas de usuários (criar, editar, promover, desativar)
- [ ] Importação CSV (validação, dry-run, batch insert, logs)
- [x] Consulta de último registro por cliente
- [x] Criação de análise (validação de duplicidade)
- [x] Finalizar análise (aprovado automático)
- [x] Reportar fraude (motivo padronizado + motivo livre)
- [x] Listagem de fraudes (paginada, filtros)
- [ ] Relatórios de analistas (métricas, produtividade)
- [ ] Checklist antifraude (endpoint que calcula warnings)
- [x] Logs de auditoria (operações críticas)

## Frontend (React + Tailwind + Tema Dark Glass)
- [x] Página de Login (via OAuth Manus)
- [x] Dashboard Analista (home, últimas análises)
- [x] Página Nova Análise (form com auto-preenchimento)
- [x] Página Fraudes (listagem, filtros, detalhes)
- [x] Página Importar CSV (admin)
- [x] Página Gestão de Usuários (admin)
- [x] Página Relatórios (admin)
- [ ] Modal Reportar Fraude (motivo + campo livre)
- [x] Alert de Duplicidade (bloqueio)
- [x] Cards de Métricas (volume de análises)
- [x] Componentes UI (buttons, forms, tables, modals)
- [x] Navegação (top nav com header)
- [x] Autenticação (login/logout)

## Validações & Regras
- [x] Data de análise válida e não futura
- [x] ID do cliente obrigatório
- [x] Bloqueio de duplicidade (id_cliente + data_analise)
- [ ] Motivo de fraude obrigatório se reportar
- [x] Limite de caracteres em observação (1000)
- [ ] Normalização de tipos (datas, numéricos)

## Segurança
- [x] Hash de senha (OAuth Manus)
- [x] Política de senha forte (OAuth Manus)
- [x] JWT com expiração curta
- [x] CORS restrito
- [x] HTTPS obrigatório
- [x] Logs de segurança (auditoria)

## Testes & Ajustes
- [ ] Testar fluxo de análise completo
- [ ] Testar importação CSV
- [x] Testar autenticação e permissões
- [x] Testar validações
- [x] Testar duplicidade
- [ ] Testar relatórios
- [ ] Ajustes de performance
- [ ] Ajustes de UX

## Documentação
- [ ] README.md com instruções de setup
- [ ] Documentação de API
- [ ] Manual do Analista
- [ ] Manual do Admin



## Melhorias Solicitadas (Sprint 2)
- [x] Adicionar botão "Voltar" na página Nova Análise
- [x] Dividir Nova Análise em dois segmentos: Saque e Depósito
- [x] Implementar busca automática por nome/ID do usuário
- [x] Adicionar campos específicos para Análise de Saque (data criação, horário, nome, valor, métrica, categoria, jogo/esporte)
- [x] Adicionar campos específicos para Análise de Depósito (data criação, nome, categoria, jogo/esporte após depósito)
- [x] Atualizar schema do banco de dados com novos campos
- [x] Implementar auto-preenchimento de dados existentes por nome/ID
- [x] Adicionar validações para os novos campos
- [ ] Testar fluxo completo de Saque e Depósito



## Melhorias Solicitadas (Sprint 3)
- [ ] Corrigir nomenclatura: "Nome do Usuário" → "Nome Completo"
- [ ] Substituir N/A por nomenclatura mais atrativa
- [ ] Implementar cronômetro de análise com início automático
- [ ] Reconhecimento inteligente de cliente novo vs cliente existente
- [ ] Adicionar campo "Ganho/Perda da Casa" em Análise de Depósito (em R$)
- [ ] Implementar cores dinâmicas: vermelho (negativo/prejuízo), azul #0088ff (positivo/ganho)
- [ ] Criar dashboard de relatórios com gráficos
- [ ] Implementar gráfico de pizza (distribuição de análises)
- [ ] Implementar gráfico de barras (análises por analista)
- [ ] Implementar gráfico de linhas (tempo por análise)
- [ ] Adicionar filtros: por analista, período, tipo de análise
- [ ] Adicionar métricas: total analisado, tempo médio, taxa de fraude
- [ ] Armazenar tempo de análise no banco de dados
- [ ] Criar API para retornar dados de métricas



## Melhorias Solicitadas (Sprint 4)
- [ ] Migrar de OAuth Manus para JWT puro
- [ ] Configurar para execução local (sem Docker)
- [ ] Criar guia passo a passo para Windows + Visual Code
- [ ] Gerar arquivo ZIP com código completo
- [ ] Criar arquivo .env.example com variáveis necessárias
- [ ] Documentar setup local completo



## Melhorias Solicitadas (Sprint 5)
- [x] Cronômetro inicia automaticamente ao abrir página Nova Análise
- [x] Cronômetro continua rodando durante toda a análise
- [x] Cronômetro pausa/retoma com botões de controle
- [x] Tempo total salvo automaticamente ao finalizar
- [x] Exibição clara e visível do tempo decorrido



## Melhorias Solicitadas (Sprint 6)
- [x] Cronômetro inicia ao inserir ID do cliente
- [x] Cronômetro para ao finalizar ou reportar fraude
- [x] Remover botões de controle manual (Pausar, Resetar)
- [x] Adicionar campo "Financeiro" em Análise de Saque
- [x] Adicionar campo "Financeiro" em Análise de Depósito
- [x] Valores negativos = cliente dando lucro para casa (vermelho)
- [x] Valores positivos = casa ganhando do apostador (azul #0088ff)
- [x] Atualizar schema do banco de dados com campo financeiro
- [x] Validar integração com mutation de criação



## Melhorias Solicitadas (Sprint 7)
- [x] Desabilitar todos os campos exceto ID inicialmente
- [x] Liberar campos ao inserir ID válido
- [x] Criar usuário analista de teste com senha
- [x] Criar lista de fraudadores de teste
- [x] Exibir fraudes com ID, nome, motivo e data
- [x] Implementar sistema de senha para criação de usuários
- [x] Listar usuários ativos na aba Usuários
- [x] Fornecer ZIP com guia passo a passo para Windows



## Melhorias Solicitadas (Sprint 8 - Final)
- [x] Manter apenas ID habilitado na página de análise
- [x] Remover todas as dependências do Manus
- [x] Remover OAuth Manus
- [x] Sistema 100% independente
- [x] Fornecer ZIP após mudanças

## Melhorias Solicitadas (Sprint 9 - Validação e Expansão)
- [x] Validar arquivo enviado
- [x] Liberar campos ao inserir ID válido
- [x] Listar todos os usuários na aba Usuários
- [x] Novos usuários aparecerem em Usuários Ativos
- [x] Expandir métricas de Relatórios
- [x] Adicionar análises por usuário
- [x] Adicionar tempo médio por usuário
- [x] Criar gráficos pizza em tempo real
- [x] Criar gráficos barras em tempo real
- [x] Melhorar front-end (design e UX)
- [x] Enviar ZIP após cada mudança

