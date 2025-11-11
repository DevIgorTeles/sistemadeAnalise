-- ============================================================================
-- SCRIPT DE DADOS FICTÍCIOS PARA TESTES - SISTEMA OPA
-- Cria dados variados para testes de relatórios e outras funcionalidades
-- ============================================================================

USE opa_system;

-- Limpar dados anteriores de teste (opcional - comentar se quiser manter)
-- DELETE FROM logs_auditoria WHERE usuario_id IN (SELECT id FROM users);
-- DELETE FROM fraudes;
-- DELETE FROM analises;
-- DELETE FROM clientes WHERE id_cliente LIKE 'TEST_%';

-- ============================================================================
-- 1. INSERIR CLIENTES (Mínimo 5)
-- ============================================================================

INSERT INTO clientes (id_cliente, nome_completo, status_cliente) VALUES
('TEST_CLI_001', 'João Silva Santos', 'OK'),
('TEST_CLI_002', 'Maria Oliveira Costa', 'MONITORAR'),
('TEST_CLI_003', 'Pedro Alves Ribeiro', 'CRITICO'),
('TEST_CLI_004', 'Ana Paula Souza', 'OK'),
('TEST_CLI_005', 'Carlos Eduardo Lima', 'MONITORAR'),
('TEST_CLI_006', 'Fernanda Torres', 'OK'),
('TEST_CLI_007', 'Roberto Mendes Junior', 'CRITICO'),
('TEST_CLI_008', 'Juliana Ferreira', 'MONITORAR');

-- ============================================================================
-- 2. INSERIR ANÁLISES DE SAQUE (Mínimo 5)
-- ============================================================================

-- Obter IDs dos usuários para auditoria
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);
SET @analista_id = (SELECT id FROM users WHERE role = 'analista' LIMIT 1);

INSERT INTO analises 
    (id_cliente, nome_completo, data_analise, data_criacao_conta, tipo_analise, 
     horario_saque, valor_saque, metrica_saque, categoria_saque, jogo_esporte_saque,
     tempo_analise_segundos, observacao, fonte_consulta, auditoria_usuario, auditoria_data) VALUES

-- Análises de SAQUE - Cassino
('TEST_CLI_001', 'João Silva Santos', '2024-12-01', '2024-11-15', 'SAQUE',
 '14:23:45', '1500.00', 'SALDO 5200->3700', 'CASSINO', NULL,
 120, 'Cliente com alta atividade em slots', 'BD2', @analista_id, NOW()),

('TEST_CLI_004', 'Ana Paula Souza', '2024-12-02', '2024-11-10', 'SAQUE',
 '18:45:30', '3000.00', 'SALDO 8200->5200', 'CASSINO', NULL,
 145, 'Grande saque após bônus recebido', 'BD2', @analista_id, NOW()),

('TEST_CLI_006', 'Fernanda Torres', '2024-12-03', '2024-11-20', 'SAQUE',
 '09:12:15', '750.50', 'SALDO 2100->1349.50', 'CASSINO', NULL,
 95, 'Atividade normal de cassino', 'BD2', @admin_id, NOW()),

-- Análises de SAQUE - Sportbook
('TEST_CLI_002', 'Maria Oliveira Costa', '2024-12-01', '2024-10-05', 'SAQUE',
 '16:30:00', '2500.00', 'SALDO 5500->3000', 'SPORTBOOK', 'Futebol Internacional',
 180, 'Múltiplas apostas esportivas no fim de semana', 'BD2', @analista_id, NOW()),

('TEST_CLI_005', 'Carlos Eduardo Lima', '2024-12-04', '2024-11-01', 'SAQUE',
 '20:15:20', '1800.00', 'SALDO 4000->2200', 'SPORTBOOK', 'Basketball NBA',
 160, 'Cliente ativo em apostas esportivas', 'BD2', @analista_id, NOW()),

('TEST_CLI_008', 'Juliana Ferreira', '2024-12-02', '2024-10-20', 'SAQUE',
 '11:45:10', '2200.00', 'SALDO 4800->2600', 'SPORTBOOK', 'Tennis WTA',
 130, 'Movimentação suspeita de apostas consecutivas', 'BD2', @admin_id, NOW()),

-- Análises de SAQUE - Outros
('TEST_CLI_003', 'Pedro Alves Ribeiro', '2024-12-05', '2024-09-15', 'SAQUE',
 '13:22:30', '950.00', 'SALDO 3200->2250', 'OUTROS', NULL,
 110, 'Padrão de saque em horários alternados', 'BD2', @admin_id, NOW());

-- ============================================================================
-- 3. INSERIR ANÁLISES DE DEPOSITO (Mínimo 5)
-- ============================================================================

INSERT INTO analises 
    (id_cliente, nome_completo, data_analise, data_criacao_conta, tipo_analise,
     valor_deposito, ganho_perda, financeiro, categoria_deposito, jogo_esporte_deposito_apos,
     tempo_analise_segundos, observacao, fonte_consulta, auditoria_usuario, auditoria_data) VALUES

-- Análises de DEPOSITO - Cassino com ganho
('TEST_CLI_001', 'João Silva Santos', '2024-12-06', '2024-11-15', 'DEPOSITO',
 '2000.00', '350.00', '-350.00', 'CASSINO', 'CASSINO',
 100, 'Cliente ganhou em slots e retirou lucro', 'BD2', @analista_id, NOW()),

('TEST_CLI_004', 'Ana Paula Souza', '2024-12-07', '2024-11-10', 'DEPOSITO',
 '5000.00', '1200.00', '-1200.00', 'CASSINO', 'CASSINO',
 145, 'Grande ganho em jogos de mesa', 'BD2', @admin_id, NOW()),

('TEST_CLI_006', 'Fernanda Torres', '2024-12-08', '2024-11-20', 'DEPOSITO',
 '1200.00', '80.00', '-80.00', 'CASSINO', 'CASSINO',
 90, 'Ganho pequeno em slots', 'BD2', @analista_id, NOW()),

-- Análises de DEPOSITO - Sportbook com perda
('TEST_CLI_002', 'Maria Oliveira Costa', '2024-12-06', '2024-10-05', 'DEPOSITO',
 '3000.00', '-800.00', '800.00', 'SPORTBOOK', 'Futebol Brasileiro',
 170, 'Cliente teve perda em apostas esportivas', 'BD2', @analista_id, NOW()),

('TEST_CLI_005', 'Carlos Eduardo Lima', '2024-12-09', '2024-11-01', 'DEPOSITO',
 '1500.00', '-450.00', '450.00', 'SPORTBOOK', 'Soccer Championship',
 125, 'Depósito após perdas consecutivas', 'BD2', @analista_id, NOW()),

('TEST_CLI_008', 'Juliana Ferreira', '2024-12-07', '2024-10-20', 'DEPOSITO',
 '2100.00', '-500.00', '500.00', 'SPORTBOOK', 'Tennis ATP',
 140, 'Atividade intensa em apostas esportivas', 'BD2', @admin_id, NOW()),

-- Análises de DEPOSITO - Outros
('TEST_CLI_003', 'Pedro Alves Ribeiro', '2024-12-10', '2024-09-15', 'DEPOSITO',
 '1000.00', '150.00', '-150.00', 'OUTROS', 'OUTROS',
 85, 'Depósito sem padrão identificado', 'BD2', @admin_id, NOW());

-- ============================================================================
-- 4. INSERIR FRAUDES (Mínimo 5)
-- ============================================================================

SET @fraude_admin_id = @admin_id;
SET @fraude_analista_id = @analista_id;

INSERT INTO fraudes (id_cliente, data_registro, motivo_padrao, motivo_livre, analista_id) VALUES

('TEST_CLI_003', DATE_SUB(NOW(), INTERVAL 2 DAY), 
 'COMPORTAMENTO_SUSPEITO', 
 'Múltiplos saques em horários irregulares, padrão de atividade atípico',
 @fraude_admin_id),

('TEST_CLI_007', DATE_SUB(NOW(), INTERVAL 1 DAY),
 'GOLPE',
 'Cliente utiliza credenciais falsas para cadastro',
 @fraude_analista_id),

('TEST_CLI_002', DATE_SUB(NOW(), INTERVAL 3 DAY),
 'MULTIPLA_CONTA',
 'Possível criação de múltiplas contas com documentos diferentes',
 @fraude_admin_id),

('TEST_CLI_005', DATE_SUB(NOW(), INTERVAL 5 DAY),
 'MANIPULACAO_JOGOS',
 'Evidências de manipulação em apostas esportivas',
 @fraude_analista_id),

('TEST_CLI_008', DATE_SUB(NOW(), INTERVAL 1 DAY),
 'CHARGEBACK',
 'Cliente iniciou processo de chargeback sem justificativa',
 @fraude_admin_id),

('TEST_CLI_007', DATE_SUB(NOW(), INTERVAL 4 DAY),
 'DOCUMENTACAO_FALSA',
 'Documentos enviados apresentam inconsistências',
 @fraude_analista_id);

-- ============================================================================
-- 5. INSERIR LOGS DE AUDITORIA (Histórico de ações)
-- ============================================================================

INSERT INTO logs_auditoria (tipo, detalhe, usuario_id, criado_em) VALUES

('LOGIN_USUARIO', JSON_OBJECT('action', 'login', 'email', 'admin@opasystem.com'), @admin_id, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('ANALISE_CRIADA', JSON_OBJECT('id_cliente', 'TEST_CLI_001', 'tipo', 'SAQUE'), @analista_id, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('ANALISE_FINALIZADA', JSON_OBJECT('id_cliente', 'TEST_CLI_001', 'status', 'APROVADO'), @analista_id, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('FRAUDE_REPORTADA', JSON_OBJECT('id_cliente', 'TEST_CLI_003', 'motivo', 'COMPORTAMENTO_SUSPEITO'), @admin_id, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ANALISE_CRIADA', JSON_OBJECT('id_cliente', 'TEST_CLI_002', 'tipo', 'DEPOSITO'), @analista_id, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('LOGIN_USUARIO', JSON_OBJECT('action', 'login', 'email', 'analista@opasystem.com'), @analista_id, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('FRAUDE_REPORTADA', JSON_OBJECT('id_cliente', 'TEST_CLI_007', 'motivo', 'GOLPE'), @analista_id, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ============================================================================
-- 6. RESUMO DOS DADOS INSERIDOS
-- ============================================================================

SELECT '=== RESUMO DE DADOS INSERIDOS ===' AS info;

SELECT 
    COUNT(*) AS total_clientes,
    SUM(CASE WHEN status_cliente = 'OK' THEN 1 ELSE 0 END) AS clientes_ok,
    SUM(CASE WHEN status_cliente = 'MONITORAR' THEN 1 ELSE 0 END) AS clientes_monitorar,
    SUM(CASE WHEN status_cliente = 'CRITICO' THEN 1 ELSE 0 END) AS clientes_critico
FROM clientes
WHERE id_cliente LIKE 'TEST_%';

SELECT 
    tipo_analise,
    COUNT(*) AS quantidade
FROM analises
WHERE id_cliente LIKE 'TEST_%'
GROUP BY tipo_analise;

SELECT 
    COUNT(*) AS total_fraudes
FROM fraudes
WHERE id_cliente LIKE 'TEST_%';

SELECT 
    tipo,
    COUNT(*) AS quantidade
FROM logs_auditoria
GROUP BY tipo;

-- ============================================================================
-- 7. CONSULTAS ÚTEIS PARA TESTES
-- ============================================================================

-- Ver todas as análises com detalhes
-- SELECT a.*, c.nome_completo, c.status_cliente 
-- FROM analises a 
-- JOIN clientes c ON a.id_cliente = c.id_cliente 
-- WHERE a.id_cliente LIKE 'TEST_%'
-- ORDER BY a.data_analise DESC;

-- Ver todas as fraudes com analista
-- SELECT f.*, u.name AS analista_nome, c.nome_completo 
-- FROM fraudes f 
-- JOIN users u ON f.analista_id = u.id 
-- JOIN clientes c ON f.id_cliente = c.id_cliente
-- WHERE f.id_cliente LIKE 'TEST_%'
-- ORDER BY f.data_registro DESC;

-- Ver logs de auditoria recentes
-- SELECT * FROM logs_auditoria ORDER BY criado_em DESC LIMIT 10;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

SELECT '✅ Dados fictícios inseridos com sucesso!' AS status;

