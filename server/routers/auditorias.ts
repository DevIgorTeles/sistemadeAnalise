/**
 * Router de auditorias
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sanitizeString, sanitizeIdentifier } from "../_core/sanitize";
import { logger } from "../_core/logger";
import { auditoriaSchema, auditoriaFiltroSchema } from "../validations/schemas";
import {
  registrarAuditoriaAnalise,
  listarAuditorias,
  getStatusAuditoria,
  getAuditoriaPorAnalise,
  registrarAuditoria,
} from "../db";

export const auditoriasRouter = router({
  registrar: protectedProcedure
    .input(auditoriaSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Sanitizar campos de texto antes de salvar
      await registrarAuditoriaAnalise({
        idCliente: sanitizeIdentifier(input.idCliente),
        motivo: sanitizeString(input.motivo),
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
      try {
        const auditorias = await listarAuditorias(input ?? {});
        return auditorias;
      } catch (error) {
        logger.logError(
          "Erro ao listar auditorias",
          error instanceof Error ? error : new Error(String(error)),
          undefined,
          { input }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar auditorias",
        });
      }
    }),

  status: protectedProcedure
    .input(z.object({ idCliente: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        return await getStatusAuditoria(input.idCliente);
      } catch (error) {
        logger.logError(
          "Erro ao buscar status de auditoria",
          error instanceof Error ? error : new Error(String(error)),
          undefined,
          { idCliente: input.idCliente }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar status de auditoria",
        });
      }
    }),

  porAnalise: protectedProcedure
    .input(z.object({ 
      idCliente: z.string().min(1),
      dataAnalise: z.string().min(1),
      tipoAnalise: z.enum(["SAQUE", "DEPOSITO"]).optional(),
    }))
    .query(async ({ input }) => {
      const auditoria = await getAuditoriaPorAnalise(
        input.idCliente, 
        input.dataAnalise,
        input.tipoAnalise
      );
      return auditoria;
    }),
});

