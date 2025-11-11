import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUltimaAnalise,
  verificarDuplicidade,
  criarAnalise,
  reportarFraude,
  listarFraudes,
  registrarAuditoria,
  listarMetricasAnalises,
  upsertUser,
  listarUsuarios,
  getAnalisePorData,
  registrarAuditoriaAnalise,
  listarAuditorias,
  getStatusAuditoria
} from "./db";
import { TRPCError } from "@trpc/server";

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

const dateField = z.union([
  z.string().trim().min(1, "Data obrigatória"),
  z.date(),
]).superRefine(ensureValidDate);

const optionalDateField = dateField.optional().nullable();

const toDate = (value?: string | Date | null) => {
  if (!value) {
    return undefined;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const analiseBaseSchema = z.object({
  idCliente: z.string().trim().min(1, "ID do cliente obrigatório"),
  nomeCompleto: z.string().trim().min(2, "Nome do cliente obrigatório"),
  dataAnalise: dateField,
  dataCriacaoConta: optionalDateField,
  tempoAnaliseSegundos: z.number().int().min(0).optional(),
  observacao: z.string().trim().min(3, "Observação obrigatória").max(1000),
  fonteConsulta: z.string().trim().min(1).optional(),
  qtdApostas: z.number().int().min(0).optional(),
  retornoApostas: z.number().optional(),
  ganhoPerda: z.number().optional(),
});

// Schemas for validation
const analisesSchema = z.discriminatedUnion("tipoAnalise", [
  analiseBaseSchema.extend({
    tipoAnalise: z.literal("SAQUE"),
    horarioSaque: z.string().trim().min(1, "Horário do saque obrigatório"),
    valorSaque: z
      .number()
      .gt(0, "Valor do saque deve ser maior que zero"),
    metricaSaque: z.string().trim().min(1, "Métrica do saque obrigatória"),
    categoriaSaque: z.string().trim().min(1, "Categoria do saque obrigatória"),
    jogoEsporteSaque: z.string().trim().min(1, "Informe o jogo ou esporte"),
    financeiro: z.number(),
    valorDeposito: z.undefined().optional(),
    categoriaDeposito: z.undefined().optional(),
    jogoEsporteDepositoApos: z.undefined().optional(),
  }),
  analiseBaseSchema.extend({
    tipoAnalise: z.literal("DEPOSITO"),
    valorDeposito: z
      .number()
      .gt(0, "Valor do depósito deve ser maior que zero"),
    categoriaDeposito: z
      .string()
      .trim()
      .min(1, "Categoria do depósito obrigatória"),
    jogoEsporteDepositoApos: z
      .string()
      .trim()
      .min(1, "Informe o jogo ou esporte após o depósito"),
    financeiro: z.number(),
    valorSaque: z.undefined().optional(),
    horarioSaque: z.undefined().optional(),
    metricaSaque: z.undefined().optional(),
    categoriaSaque: z.undefined().optional(),
    jogoEsporteSaque: z.undefined().optional(),
  }),
]);

const fraudeSchema = z.object({
  idCliente: z.string().min(1),
  motivoPadrao: z.string().min(1, "Motivo obrigatorio"),
  motivoLivre: z.string().optional(),
});

const auditoriaSchema = z.object({
  idCliente: z.string().min(1),
  motivo: z.string().min(3, "Motivo obrigatorio"),
  tipo: z.enum(["ESPORTIVO", "CASSINO"]),
});

const auditoriaFiltroSchema = z.object({
  tipo: z.enum(["ESPORTIVO", "CASSINO"]).optional(),
  analistaId: z.number().int().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Usuários - administração
  usuarios: router({
    listar: protectedProcedure
      .query(async () => {
        const usuarios = await listarUsuarios();
        return usuarios;
      }),
    
    criar: protectedProcedure
      .input(z.object({ email: z.string().email(), nome: z.string().min(1), role: z.enum(["analista","admin"]).default("analista"), password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        // Use email as openId for local users created via admin UI
        const openId = input.email;
        await upsertUser({
          password: input.password,
          openId,
          name: input.nome,
          email: input.email,
          loginMethod: 'local',
          role: input.role,
          lastSignedIn: new Date(),
        });
        return { success: true };
      }),
  }),

  // Analises procedures
  analises: router({
    getUltimo: protectedProcedure
      .input(z.object({ idCliente: z.string() }))
      .query(async ({ input }) => {
        const ultima = await getUltimaAnalise(input.idCliente);
        return ultima || null;
      }),

    verificarHoje: protectedProcedure
      .input(z.object({
        idCliente: z.string().min(1),
        dataAnalise: z.string(),
      }))
      .query(async ({ input }) => {
        const duplicado = await verificarDuplicidade(input.idCliente, input.dataAnalise);
        if (!duplicado) {
          return { duplicado: false, analise: null };
        }

        const analise = await getAnalisePorData(input.idCliente, input.dataAnalise);
        return { duplicado: true, analise: analise || null };
      }),

    criar: protectedProcedure
      .input(analisesSchema)
      .mutation(async ({ input, ctx }) => {
        // Check for duplicity
        const normalizedIdCliente = input.idCliente.trim();
        const dataAnaliseDate = toDate(input.dataAnalise);
        if (!dataAnaliseDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Data da análise inválida",
          });
        }
        const dataAnaliseStr = dataAnaliseDate.toISOString().slice(0, 10);

        const isDuplicado = await verificarDuplicidade(
          normalizedIdCliente,
          dataAnaliseStr
        );
        if (isDuplicado) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cliente ja analisado hoje. Registro duplicado bloqueado.",
          });
        }

        const dataCriacaoContaDate = toDate(input.dataCriacaoConta);
        const observacao = input.observacao.trim();
        const fonteConsulta = input.fonteConsulta?.trim();

        // Create analysis
        const analise = {
          idCliente: normalizedIdCliente,
          nomeCompleto: input.nomeCompleto.trim(),
          dataAnalise: dataAnaliseDate,
          dataCriacaoConta: dataCriacaoContaDate,
          tipoAnalise: input.tipoAnalise,
          horarioSaque:
            input.tipoAnalise === "SAQUE"
              ? input.horarioSaque.trim()
              : undefined,
          valorSaque:
            input.tipoAnalise === "SAQUE"
              ? input.valorSaque.toString()
              : undefined,
          metricaSaque:
            input.tipoAnalise === "SAQUE"
              ? input.metricaSaque.trim()
              : undefined,
          categoriaSaque:
            input.tipoAnalise === "SAQUE"
              ? input.categoriaSaque.trim()
              : undefined,
          jogoEsporteSaque:
            input.tipoAnalise === "SAQUE"
              ? input.jogoEsporteSaque.trim()
              : undefined,
          valorDeposito:
            input.valorDeposito !== undefined
              ? input.valorDeposito.toString()
              : undefined,
          ganhoPerda:
            input.ganhoPerda !== undefined
              ? input.ganhoPerda.toString()
              : undefined,
          financeiro:
            input.financeiro !== undefined
              ? input.financeiro.toString()
              : undefined,
          categoriaDeposito:
            input.tipoAnalise === "DEPOSITO"
              ? input.categoriaDeposito.trim()
              : undefined,
          jogoEsporteDepositoApos:
            input.tipoAnalise === "DEPOSITO"
              ? input.jogoEsporteDepositoApos.trim()
              : undefined,
          tempoAnaliseSegundos: input.tempoAnaliseSegundos,
          qtdApostas: input.qtdApostas,
          retornoApostas:
            input.retornoApostas !== undefined
              ? input.retornoApostas.toString()
              : undefined,
          observacao,
          fonteConsulta: fonteConsulta && fonteConsulta.length > 0 ? fonteConsulta : undefined,
          auditoriaUsuario: ctx.user.id,
          auditoriaData: new Date(),
        };

        await criarAnalise(analise);
        await registrarAuditoria("ANALISE_CRIADA", {
          idCliente: normalizedIdCliente,
          dataAnalise: dataAnaliseStr,
          usuarioId: ctx.user.id,
        }, ctx.user.id);

        return { success: true };
      }),

    finalizar: protectedProcedure
      .input(z.object({ idCliente: z.string(), dataAnalise: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await registrarAuditoria("ANALISE_FINALIZADA", {
          idCliente: input.idCliente,
          dataAnalise: input.dataAnalise,
          usuarioId: ctx.user.id,
        }, ctx.user.id);

        return { success: true, status: "APROVADO" };
      })
  }),

  auditorias: router({
    registrar: protectedProcedure
      .input(auditoriaSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        await registrarAuditoriaAnalise({
          idCliente: input.idCliente,
          motivo: input.motivo,
          tipo: input.tipo,
          analistaId: ctx.user.id,
        });

        await registrarAuditoria("AUDITORIA_REGISTRADA", {
          idCliente: input.idCliente,
          motivo: input.motivo,
          tipo: input.tipo,
          usuarioId: ctx.user.id,
        }, ctx.user.id);

        return { success: true };
      }),

    listar: protectedProcedure
      .input(auditoriaFiltroSchema.optional())
      .query(async ({ input }) => {
        const auditorias = await listarAuditorias(input ?? {});
        return auditorias;
      }),

    status: protectedProcedure
      .input(z.object({ idCliente: z.string().min(1) }))
      .query(async ({ input }) => {
        return await getStatusAuditoria(input.idCliente);
      }),
  }),

  // Metricas procedures
  metricas: router({
    getAnalises: protectedProcedure
      .input(z.object({
        analista_id: z.number().optional(),
        data_inicio: z.date().optional(),
        data_fim: z.date().optional(),
        tipo_analise: z.enum(["SAQUE", "DEPOSITO"]).optional(),
      }))
      .query(async ({ input }) => {
        return await listarMetricasAnalises(input);
      }),
  }),

  // Fraudes procedures
  fraudes: router({
    reportar: protectedProcedure
      .input(fraudeSchema)
      .mutation(async ({ input, ctx }) => {
        const fraude = {
          ...input,
          analistaId: ctx.user.id,
          dataRegistro: new Date(),
        };

        await reportarFraude(fraude);
        await registrarAuditoria("FRAUDE_REPORTADA", {
          idCliente: input.idCliente,
          motivo: input.motivoPadrao,
          usuarioId: ctx.user.id,
        }, ctx.user.id);

        return { success: true };
      }),

    listar: protectedProcedure
      .input(z.object({ 
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const fraudes = await listarFraudes(input.limit, input.offset);
        return fraudes;
      }),
  }),
});

export type AppRouter = typeof appRouter;

