/**
 * Router de fraudes
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { sanitizeString, sanitizeIdentifier } from "../_core/sanitize";
import { getDataAtualBrasilia } from "../utils/timezone";
import { fraudeSchema } from "../validations/schemas";
import {
  reportarFraude,
  listarFraudes,
  getFraudesPorCliente,
  getFraudePorAnalise,
} from "../db";
import { registrarAuditoria } from "../db/auditorias";

export const fraudesRouter = router({
  reportar: protectedProcedure
    .input(fraudeSchema)
    .mutation(async ({ input, ctx }) => {
      // Sanitizar campos de texto antes de salvar
      const fraude = {
        idCliente: sanitizeIdentifier(input.idCliente),
        dataAnalise: input.dataAnalise,
        descricaoDetalhada: sanitizeString(input.descricaoDetalhada),
        motivoPadrao: sanitizeString(input.motivoPadrao),
        motivoLivre: input.motivoLivre ? sanitizeString(input.motivoLivre) : undefined,
        analistaId: ctx.user.id,
        dataRegistro: getDataAtualBrasilia(),
      };

      await reportarFraude(fraude);
      await registrarAuditoria("FRAUDE_REPORTADA", {
        idCliente: input.idCliente,
        motivo: input.motivoPadrao,
        usuarioId: ctx.user.id,
      }, ctx.user.id);

      return { success: true };
    }),

  status: protectedProcedure
    .input(z.object({ idCliente: z.string().min(1) }))
    .query(async ({ input }) => {
      const fraudesCliente = await getFraudesPorCliente(input.idCliente);
      return {
        temFraude: fraudesCliente.length > 0,
        fraudes: fraudesCliente,
      };
    }),

  porAnalise: protectedProcedure
    .input(z.object({ 
      idCliente: z.string().min(1),
      dataAnalise: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const fraude = await getFraudePorAnalise(input.idCliente, input.dataAnalise);
      return fraude;
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
});

