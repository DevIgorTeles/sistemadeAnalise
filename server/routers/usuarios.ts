/**
 * Router de usuários
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { sanitizeString, sanitizeIdentifier } from "../_core/sanitize";
import { getDataAtualBrasilia } from "../utils/timezone";
import { criarUsuarioSchema } from "../validations/schemas";
import { upsertUser, listarUsuarios } from "../db";

export const usuariosRouter = router({
  listar: protectedProcedure
    .query(async () => {
      const usuarios = await listarUsuarios();
      return usuarios;
    }),
  
  criar: protectedProcedure
    .input(criarUsuarioSchema)
    .mutation(async ({ input }) => {
      // Sanitizar campos de texto antes de salvar
      // Use email as openId for local users created via admin UI
      const openId = sanitizeIdentifier(input.email);
      await upsertUser({
        password: input.password,
        openId,
        name: sanitizeString(input.nome),
        email: sanitizeIdentifier(input.email),
        loginMethod: 'local',
        role: input.role,
        lastSignedIn: getDataAtualBrasilia(),
      });
      return { success: true };
    }),
});

