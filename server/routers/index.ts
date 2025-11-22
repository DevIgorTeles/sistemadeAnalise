/**
 * Router principal da aplicação
 * Agrega todos os sub-routers
 */

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { systemRouter } from "../_core/systemRouter";
import { publicProcedure, router } from "../_core/trpc";
import { analisesRouter } from "./analises";
import { fraudesRouter } from "./fraudes";
import { auditoriasRouter } from "./auditorias";
import { usuariosRouter } from "./usuarios";
import { metricasRouter } from "./metricas";

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

  usuarios: usuariosRouter,
  analises: analisesRouter,
  auditorias: auditoriasRouter,
  metricas: metricasRouter,
  fraudes: fraudesRouter,
});

export type AppRouter = typeof appRouter;

