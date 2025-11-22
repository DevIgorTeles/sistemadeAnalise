/**
 * Operações de banco de dados relacionadas a métricas de análises
 * Consolida queries de saques e depósitos para relatórios
 * REFATORADO: Versão limpa e funcional
 */

import { eq, and, desc, gte, lte, like } from "drizzle-orm";
import { saques, depositos, fraudes, users } from "../../drizzle/schema";
import { getDb } from "./connection";

/**
 * Tipo para filtros de métricas
 */
export type MetricasFiltros = {
  analista_id?: number;
  data_inicio?: Date;
  data_fim?: Date;
  tipo_analise?: string;
  id_cliente?: string;
};

/**
 * Campos comuns para seleção de análises
 */
const camposComunsAnalise = {
  id: true,
  idCliente: true,
  nomeCompleto: true,
  dataAnalise: true,
  dataCriacaoConta: true,
  financeiro: true,
  tempoAnaliseSegundos: true,
  qtdApostas: true,
  retornoApostas: true,
  observacao: true,
  fonteConsulta: true,
  analistaId: true,
  auditoriaUsuario: true,
  auditoriaData: true,
} as const;

/**
 * Função auxiliar para construir condições de filtro
 */
function buildConditions(filtros: MetricasFiltros, tabela: typeof saques | typeof depositos) {
  const conditions: any[] = [];
  
  if (filtros.analista_id) {
    conditions.push(eq(tabela.analistaId, filtros.analista_id));
  }
  if (filtros.id_cliente) {
    conditions.push(like(tabela.idCliente, `%${filtros.id_cliente}%`));
  }
  if (filtros.data_inicio) {
    conditions.push(gte(tabela.dataAnalise, filtros.data_inicio));
  }
  if (filtros.data_fim) {
    conditions.push(lte(tabela.dataAnalise, filtros.data_fim));
  }
  
  return conditions;
}

/**
 * Busca análises de saques com filtros
 * REFATORADO: Garante retorno correto de todos os campos
 */
async function buscarSaques(filtros: MetricasFiltros) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = buildConditions(filtros, saques);
  
  let query = db
    .select({
      // Selecionar campos explicitamente para garantir que todos sejam retornados
      id: saques.id,
      idCliente: saques.idCliente,
      nomeCompleto: saques.nomeCompleto,
      dataAnalise: saques.dataAnalise,
      dataCriacaoConta: saques.dataCriacaoConta,
      financeiro: saques.financeiro,
      tempoAnaliseSegundos: saques.tempoAnaliseSegundos,
      qtdApostas: saques.qtdApostas,
      retornoApostas: saques.retornoApostas,
      observacao: saques.observacao,
      fonteConsulta: saques.fonteConsulta,
      analistaId: saques.analistaId,
      auditoriaUsuario: saques.auditoriaUsuario,
      auditoriaData: saques.auditoriaData,
      // Campos específicos de saque
      horarioSaque: saques.horarioSaque,
      valorSaque: saques.valorSaque,
      metricaSaque: saques.metricaSaque,
      categoriaSaque: saques.categoriaSaque,
      jogoEsporteSaque: saques.jogoEsporteSaque,
      // Campo do join
      analistaNome: users.name,
    })
    .from(saques)
    .leftJoin(users, eq(saques.analistaId, users.id));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query.orderBy(desc(saques.dataAnalise), desc(saques.id));
  
  // Retornar dados sem normalização excessiva - preservar valores originais do banco
  return result.map(r => ({
    ...r,
    tipoAnalise: "SAQUE" as const,
  }));
}

/**
 * Busca análises de depósitos com filtros
 * REFATORADO: Garante retorno correto de todos os campos
 */
async function buscarDepositos(filtros: MetricasFiltros) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = buildConditions(filtros, depositos);
  
  let query = db
    .select({
      // Selecionar campos explicitamente para garantir que todos sejam retornados
      id: depositos.id,
      idCliente: depositos.idCliente,
      nomeCompleto: depositos.nomeCompleto,
      dataAnalise: depositos.dataAnalise,
      dataCriacaoConta: depositos.dataCriacaoConta,
      financeiro: depositos.financeiro,
      tempoAnaliseSegundos: depositos.tempoAnaliseSegundos,
      qtdApostas: depositos.qtdApostas,
      retornoApostas: depositos.retornoApostas,
      observacao: depositos.observacao,
      fonteConsulta: depositos.fonteConsulta,
      analistaId: depositos.analistaId,
      auditoriaUsuario: depositos.auditoriaUsuario,
      auditoriaData: depositos.auditoriaData,
      // Campos específicos de depósito
      valorDeposito: depositos.valorDeposito,
      ganhoPerda: depositos.ganhoPerda,
      categoriaDeposito: depositos.categoriaDeposito,
      jogoEsporteDepositoApos: depositos.jogoEsporteDepositoApos,
      // Campo do join
      analistaNome: users.name,
    })
    .from(depositos)
    .leftJoin(users, eq(depositos.analistaId, users.id));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query.orderBy(desc(depositos.dataAnalise), desc(depositos.id));
  
  // Retornar dados sem normalização excessiva - preservar valores originais do banco
  return result.map(r => ({
    ...r,
    tipoAnalise: "DEPOSITO" as const,
  }));
}

/**
 * Busca fraudes no período para marcar análises com fraude
 */
async function buscarFraudesNoPeriodo(filtros: MetricasFiltros) {
  const db = await getDb();
  if (!db) return new Set<string>();
  
  const conditions: any[] = [];
  
  if (filtros.id_cliente) {
    conditions.push(like(fraudes.idCliente, `%${filtros.id_cliente}%`));
  }
  if (filtros.data_inicio) {
    conditions.push(gte(fraudes.dataAnalise, filtros.data_inicio));
  }
  if (filtros.data_fim) {
    conditions.push(lte(fraudes.dataAnalise, filtros.data_fim));
  }
  
  let query = db
    .select({
      idCliente: fraudes.idCliente,
      dataAnalise: fraudes.dataAnalise,
    })
    .from(fraudes);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const fraudesResult = await query;
  
  // Criar Set com chaves únicas (idCliente + dataAnalise)
  return new Set(
    fraudesResult.map(f => `${f.idCliente}|${f.dataAnalise?.toString() || ''}`)
  );
}

/**
 * Lista métricas de análises das tabelas saques e depositos
 * REFATORADO: Versão limpa que garante retorno correto de dados
 * 
 * IMPORTANTE: Busca dados de AMBAS as tabelas (saques e depositos)
 * e retorna os resultados combinados com todos os campos necessários.
 */
export async function listarMetricasAnalises(filtros: MetricasFiltros) {
  const results: any[] = [];
  
  // Determinar quais tabelas buscar baseado no filtro de tipo
  const deveBuscarSaques = !filtros.tipo_analise || filtros.tipo_analise === "SAQUE";
  const deveBuscarDepositos = !filtros.tipo_analise || filtros.tipo_analise === "DEPOSITO";
  
  // Buscar análises em paralelo de ambas as tabelas
  const [saquesResult, depositosResult, fraudesSet] = await Promise.all([
    deveBuscarSaques ? buscarSaques(filtros) : Promise.resolve([]),
    deveBuscarDepositos ? buscarDepositos(filtros) : Promise.resolve([]),
    buscarFraudesNoPeriodo(filtros),
  ]);
  
  // Combinar resultados de ambas as tabelas
  if (deveBuscarSaques) {
    results.push(...saquesResult);
  }
  
  if (deveBuscarDepositos) {
    results.push(...depositosResult);
  }
  
  // Adicionar campo temFraude - preservar todos os valores originais do banco
  const resultsComFraude = results.map(analise => {
    const chave = `${analise.idCliente || ''}|${analise.dataAnalise?.toString() || ''}`;
    
    return {
      ...analise,
      temFraude: fraudesSet.has(chave),
      // Não normalizar - preservar valores exatamente como vêm do banco
    };
  });
  
  // Ordenar resultados combinados por data de análise (mais recente primeiro)
  return resultsComFraude.sort((a, b) => {
    if (!a.dataAnalise && !b.dataAnalise) return 0;
    if (!a.dataAnalise) return 1;
    if (!b.dataAnalise) return -1;
    
    const dataA = new Date(a.dataAnalise).getTime();
    const dataB = new Date(b.dataAnalise).getTime();
    if (dataB !== dataA) {
      return dataB - dataA; // Descendente por data
    }
    // Se mesma data, ordenar por ID (mais recente primeiro)
    return (b.id || 0) - (a.id || 0);
  });
}
