/**
 * Router de análises (saques e depósitos)
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sanitizeString, sanitizeIdentifier } from "../_core/sanitize";
import { getDataAtualBrasilia, paraISOStringBrasilia } from "../utils/timezone";
import { toDate } from "../validations/utils";
import { analisesSchema } from "../validations/schemas";
import {
  getUltimaAnalise,
  verificarDuplicidade,
  criarAnalise,
  getAnalisePorDataETipo,
  getAnalisePorIdETipo,
  getDataCriacaoConta,
} from "../db";
import { registrarAuditoria } from "../db/auditorias";

export const analisesRouter = router({
  getUltimo: protectedProcedure
    .input(z.object({ idCliente: z.string() }))
    .query(async ({ input }) => {
      const ultima = await getUltimaAnalise(input.idCliente);
      return ultima || null;
    }),

  getDataCriacaoConta: protectedProcedure
    .input(z.object({ idCliente: z.string() }))
    .query(async ({ input }) => {
      const dataCriacaoConta = await getDataCriacaoConta(input.idCliente);
      return dataCriacaoConta ? dataCriacaoConta.toString() : null;
    }),

  verificarHoje: protectedProcedure
    .input(z.object({
      idCliente: z.string().min(1),
      dataAnalise: z.string(),
      tipoAnalise: z.enum(["SAQUE", "DEPOSITO"]),
    }))
    .query(async ({ input }) => {
      const duplicado = await verificarDuplicidade(
        input.idCliente, 
        input.dataAnalise,
        input.tipoAnalise
      );
      if (!duplicado) {
        return { duplicado: false, analise: null };
      }

      const analise = await getAnalisePorDataETipo(
        input.idCliente, 
        input.dataAnalise,
        input.tipoAnalise
      );
      return { duplicado: true, analise: analise || null };
    }),

  criar: protectedProcedure
    .input(analisesSchema)
    .mutation(async ({ input, ctx }) => {
      // VALIDAÇÃO ADICIONAL: Garantir que auditoriaData não seja enviado
      if ('auditoriaData' in input && (input as any).auditoriaData !== undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "auditoriaData não pode ser enviado pelo frontend - é preenchido automaticamente quando auditoria é marcada",
        });
      }
      
      // Check for duplicity
      const normalizedIdCliente = input.idCliente.trim();
      const dataAnaliseDate = toDate(input.dataAnalise);
      if (!dataAnaliseDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Data da análise inválida",
        });
      }
      const dataAnaliseStr = paraISOStringBrasilia(dataAnaliseDate);

      // Verificar duplicidade considerando o tipo de análise
      const isDuplicado = await verificarDuplicidade(
        normalizedIdCliente,
        dataAnaliseStr,
        input.tipoAnalise
      );
      if (isDuplicado) {
        const analiseExistente = await getAnalisePorDataETipo(
          normalizedIdCliente,
          dataAnaliseStr,
          input.tipoAnalise
        );
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este usuário já foi analisado na data de hoje.",
        });
      }

      // Converter dataCriacaoConta para string YYYY-MM-DD se fornecida
      let dataCriacaoContaStr: string | null = null;
      if (input.dataCriacaoConta) {
        if (input.dataCriacaoConta instanceof Date) {
          dataCriacaoContaStr = paraISOStringBrasilia(input.dataCriacaoConta);
        } else if (typeof input.dataCriacaoConta === 'string') {
          dataCriacaoContaStr = input.dataCriacaoConta;
        } else {
          const dataCriacaoContaDate = toDate(input.dataCriacaoConta);
          dataCriacaoContaStr = dataCriacaoContaDate ? paraISOStringBrasilia(dataCriacaoContaDate) : null;
        }
      }
      
      // Sanitizar campos de texto antes de salvar
      const observacao = input.observacao ? sanitizeString(input.observacao.trim()) : undefined;
      const fonteConsulta = input.fonteConsulta ? sanitizeString(input.fonteConsulta.trim()) : undefined;

      // Create analysis - sanitizar todos os campos de texto
      const analise = {
        idCliente: sanitizeIdentifier(normalizedIdCliente),
        nomeCompleto: sanitizeString(input.nomeCompleto.trim()),
        dataAnalise: dataAnaliseStr,
        dataCriacaoConta: dataCriacaoContaStr,
        tipoAnalise: input.tipoAnalise,
        horarioSaque:
          input.tipoAnalise === "SAQUE"
            ? sanitizeString(input.horarioSaque.trim())
            : undefined,
        valorSaque:
          input.tipoAnalise === "SAQUE"
            ? input.valorSaque.toString()
            : undefined,
        metricaSaque:
          input.tipoAnalise === "SAQUE"
            ? sanitizeString(input.metricaSaque.trim())
            : undefined,
        categoriaSaque:
          input.tipoAnalise === "SAQUE"
            ? sanitizeString(input.categoriaSaque.trim())
            : undefined,
        jogoEsporteSaque:
          input.tipoAnalise === "SAQUE"
            ? sanitizeString(input.jogoEsporteSaque.trim())
            : undefined,
        valorDeposito:
          input.valorDeposito !== undefined
            ? input.valorDeposito.toString()
            : undefined,
        ganhoPerda:
          input.ganhoPerda !== undefined && input.ganhoPerda !== null
            ? input.ganhoPerda.toString()
            : undefined,
        financeiro:
          input.financeiro !== undefined
            ? input.financeiro.toString()
            : undefined,
        categoriaDeposito:
          input.tipoAnalise === "DEPOSITO"
            ? sanitizeString(input.categoriaDeposito.trim())
            : undefined,
        jogoEsporteDepositoApos:
          input.tipoAnalise === "DEPOSITO"
            ? sanitizeString(input.jogoEsporteDepositoApos.trim())
            : undefined,
        tempoAnaliseSegundos: input.tempoAnaliseSegundos,
        qtdApostas: input.qtdApostas,
        retornoApostas:
          input.retornoApostas !== undefined
            ? input.retornoApostas.toString()
            : undefined,
        observacao,
        fonteConsulta: fonteConsulta && fonteConsulta.length > 0 ? fonteConsulta : undefined,
        analistaId: ctx.user?.id,
        auditoriaUsuario: input.auditoriaUsuario ?? false,
        auditoriaData: undefined,
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
    }),

  getPorIdETipo: protectedProcedure
    .input(z.object({
      id: z.number(),
      tipoAnalise: z.enum(["SAQUE", "DEPOSITO"]),
    }))
    .query(async ({ input }) => {
      const analise = await getAnalisePorIdETipo(input.id, input.tipoAnalise);
      if (!analise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Análise não encontrada",
        });
      }
      return analise;
    }),
});

