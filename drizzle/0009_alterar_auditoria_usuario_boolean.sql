-- Migration: Alterar auditoria_usuario de INT para BOOLEAN
-- e garantir que auditoria_data seja NULL quando auditoria_usuario = FALSE

-- ============================================================================
-- ATENÇÃO: Esta migration altera a estrutura do campo auditoria_usuario
-- ============================================================================

-- 1. Converter valores existentes:
--    - Se auditoria_usuario IS NOT NULL (tinha ID do analista) → TRUE
--    - Se auditoria_usuario IS NULL → FALSE
--    - Se auditoria_data IS NULL mas auditoria_usuario tinha valor → NULL

-- Alterar tipo do campo em saques
ALTER TABLE `saques` 
  MODIFY COLUMN `auditoria_usuario` TINYINT(1) DEFAULT 0;

-- Converter valores existentes: NULL ou 0 → FALSE (0), qualquer outro valor → TRUE (1)
UPDATE `saques` 
SET `auditoria_usuario` = CASE 
  WHEN `auditoria_usuario` IS NULL OR `auditoria_usuario` = 0 THEN 0
  ELSE 1
END;

-- Garantir que auditoria_data seja NULL quando auditoria_usuario = FALSE
UPDATE `saques` 
SET `auditoria_data` = NULL 
WHERE `auditoria_usuario` = 0 AND `auditoria_data` IS NOT NULL;

-- Alterar tipo do campo em depositos
ALTER TABLE `depositos` 
  MODIFY COLUMN `auditoria_usuario` TINYINT(1) DEFAULT 0;

-- Converter valores existentes: NULL ou 0 → FALSE (0), qualquer outro valor → TRUE (1)
UPDATE `depositos` 
SET `auditoria_usuario` = CASE 
  WHEN `auditoria_usuario` IS NULL OR `auditoria_usuario` = 0 THEN 0
  ELSE 1
END;

-- Garantir que auditoria_data seja NULL quando auditoria_usuario = FALSE
UPDATE `depositos` 
SET `auditoria_data` = NULL 
WHERE `auditoria_usuario` = 0 AND `auditoria_data` IS NOT NULL;

-- ============================================================================
-- Trigger de proteção (opcional, mas recomendado)
-- ============================================================================

-- Trigger para saques: garantir que auditoria_data seja NULL se auditoria_usuario = FALSE
DELIMITER $$

DROP TRIGGER IF EXISTS `trg_saques_auditoria_check`$$

CREATE TRIGGER `trg_saques_auditoria_check`
BEFORE INSERT ON `saques`
FOR EACH ROW
BEGIN
  IF NEW.`auditoria_usuario` = 0 OR NEW.`auditoria_usuario` IS NULL THEN
    SET NEW.`auditoria_data` = NULL;
  END IF;
END$$

-- Trigger para saques UPDATE
DROP TRIGGER IF EXISTS `trg_saques_auditoria_check_update`$$

CREATE TRIGGER `trg_saques_auditoria_check_update`
BEFORE UPDATE ON `saques`
FOR EACH ROW
BEGIN
  IF NEW.`auditoria_usuario` = 0 OR NEW.`auditoria_usuario` IS NULL THEN
    SET NEW.`auditoria_data` = NULL;
  END IF;
END$$

-- Trigger para depositos: garantir que auditoria_data seja NULL se auditoria_usuario = FALSE
DROP TRIGGER IF EXISTS `trg_depositos_auditoria_check`$$

CREATE TRIGGER `trg_depositos_auditoria_check`
BEFORE INSERT ON `depositos`
FOR EACH ROW
BEGIN
  IF NEW.`auditoria_usuario` = 0 OR NEW.`auditoria_usuario` IS NULL THEN
    SET NEW.`auditoria_data` = NULL;
  END IF;
END$$

-- Trigger para depositos UPDATE
DROP TRIGGER IF EXISTS `trg_depositos_auditoria_check_update`$$

CREATE TRIGGER `trg_depositos_auditoria_check_update`
BEFORE UPDATE ON `depositos`
FOR EACH ROW
BEGIN
  IF NEW.`auditoria_usuario` = 0 OR NEW.`auditoria_usuario` IS NULL THEN
    SET NEW.`auditoria_data` = NULL;
  END IF;
END$$

DELIMITER ;

-- ============================================================================
-- Verificação final
-- ============================================================================

-- Verificar se há registros inconsistentes (auditoria_usuario = FALSE mas auditoria_data preenchido)
SELECT 
  'saques' as tabela,
  COUNT(*) as registros_inconsistentes
FROM `saques`
WHERE (`auditoria_usuario` = 0 OR `auditoria_usuario` IS NULL) 
  AND `auditoria_data` IS NOT NULL

UNION ALL

SELECT 
  'depositos' as tabela,
  COUNT(*) as registros_inconsistentes
FROM `depositos`
WHERE (`auditoria_usuario` = 0 OR `auditoria_usuario` IS NULL) 
  AND `auditoria_data` IS NOT NULL;

-- Se houver registros inconsistentes após a migration, execute:
-- UPDATE `saques` SET `auditoria_data` = NULL WHERE `auditoria_usuario` = 0;
-- UPDATE `depositos` SET `auditoria_data` = NULL WHERE `auditoria_usuario` = 0;

