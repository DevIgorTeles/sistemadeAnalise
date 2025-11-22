/**
 * Schemas de validação Zod centralizados
 * Reutilizáveis em diferentes partes da aplicação
 */

import { z } from "zod";

/**
 * Validação de data - não permite datas futuras
 */
const ensureValidDate = (value: string | Date, ctx: z.RefinementCtx) => {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data inválida",
    });
    return;
  }

  if (parsedDate > new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data futura não permitida",
    });
  }
};

/**
 * Campo de data obrigatório
 */
export const dateField = z
  .union([
    z.string().trim().min(1, "Data obrigatória"),
    z.date(),
  ])
  .superRefine(ensureValidDate);

/**
 * Campo de data opcional
 */
export const optionalDateField = dateField.optional().nullable();

/**
 * Schema base para análises (comum entre SAQUE e DEPOSITO)
 */
export const analiseBaseSchema = z.object({
  idCliente: z.string().trim().min(1, "ID do cliente obrigatório"),
  nomeCompleto: z.string().trim().min(2, "Nome do cliente obrigatório"),
  dataAnalise: dateField,
  dataCriacaoConta: optionalDateField,
  tempoAnaliseSegundos: z.number().int().min(0).optional(),
  observacao: z.string().trim().max(1000).optional(),
  fonteConsulta: z.string().trim().min(1).optional(),
  qtdApostas: z.number().int().min(0).optional(),
  retornoApostas: z.number().optional(),
  ganhoPerda: z.number().optional().nullable(),
  auditoriaUsuario: z.boolean().optional(),
});

/**
 * Schema para análise de SAQUE
 */
const saqueSchema = analiseBaseSchema.extend({
  tipoAnalise: z.literal("SAQUE"),
  horarioSaque: z.string().trim().min(1, "Horário do saque obrigatório"),
  valorSaque: z.number().gt(0, "Valor do saque deve ser maior que zero"),
  metricaSaque: z.string().trim().min(1, "Métrica do saque obrigatória"),
  categoriaSaque: z.string().trim().min(1, "Categoria do saque obrigatória"),
  jogoEsporteSaque: z.string().trim().min(1, "Informe o jogo ou esporte"),
  financeiro: z.number(),
  // Campos de DEPOSITO devem ser undefined
  valorDeposito: z.undefined().optional(),
  categoriaDeposito: z.undefined().optional(),
  jogoEsporteDepositoApos: z.undefined().optional(),
});

/**
 * Schema para análise de DEPOSITO
 */
const depositoSchema = analiseBaseSchema.extend({
  tipoAnalise: z.literal("DEPOSITO"),
  valorDeposito: z.number().gt(0, "Valor do depósito deve ser maior que zero"),
  categoriaDeposito: z.string().trim().min(1, "Categoria do depósito obrigatória"),
  jogoEsporteDepositoApos: z.string().trim().min(1, "Informe o jogo ou esporte após o depósito"),
  financeiro: z.number(),
  // Campos de SAQUE devem ser undefined
  valorSaque: z.undefined().optional(),
  horarioSaque: z.undefined().optional(),
  metricaSaque: z.undefined().optional(),
  categoriaSaque: z.undefined().optional(),
  jogoEsporteSaque: z.undefined().optional(),
});

/**
 * Schema discriminado para análises (SAQUE ou DEPOSITO)
 */
export const analisesSchema = z.discriminatedUnion("tipoAnalise", [
  saqueSchema,
  depositoSchema,
]);

/**
 * Schema para reportar fraude
 */
export const fraudeSchema = z.object({
  idCliente: z.string().min(1),
  dataAnalise: z.string().trim().min(1, "Data da análise obrigatória"),
  descricaoDetalhada: z.string().trim().min(10, "Descrição detalhada obrigatória (mínimo 10 caracteres)"),
  motivoPadrao: z.string().min(1, "Motivo obrigatório"),
  motivoLivre: z.string().optional(),
});

/**
 * Schema para registrar auditoria
 */
export const auditoriaSchema = z.object({
  idCliente: z.string().min(1),
  motivo: z.string().min(3, "Motivo obrigatório"),
  tipo: z.enum(["ESPORTIVO", "CASSINO"]),
});

/**
 * Schema para filtros de auditoria
 */
export const auditoriaFiltroSchema = z.object({
  tipo: z.enum(["ESPORTIVO", "CASSINO"]).optional(),
  analistaId: z.number().int().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

/**
 * Schema para criar usuário
 */
export const criarUsuarioSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(1),
  role: z.enum(["analista", "admin"]).default("analista"),
  password: z.string().min(6),
});

/**
 * Schema para métricas de análises
 */
export const metricasFiltroSchema = z.object({
  analista_id: z.number().optional(),
  data_inicio: z.date().optional(),
  data_fim: z.date().optional(),
  tipo_analise: z.enum(["SAQUE", "DEPOSITO"]).optional(),
  id_cliente: z.string().optional(),
});

