/**
 * Router de métricas
 */

import { router, protectedProcedure } from "../_core/trpc";
import { metricasFiltroSchema } from "../validations/schemas";
import { listarMetricasAnalises } from "../db";

export const metricasRouter = router({
  getAnalises: protectedProcedure
    .input(metricasFiltroSchema)
    .query(async ({ input }) => {
      return await listarMetricasAnalises(input);
    }),
});

