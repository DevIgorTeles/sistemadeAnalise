/**
 * Operações de banco de dados relacionadas a análises (saques e depósitos)
 * Consolida lógica comum entre os dois tipos de análise
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { saques, depositos, clientes, users, InsertSaque, InsertDeposito } from "../../drizzle/schema";
import { getDb } from "./connection";
import { withCache, CacheKeys, deleteCache, invalidateCache } from "../_core/cache";
import { getDataAtualBrasilia, paraISOStringBrasilia } from "../utils/timezone";

/**
 * Tipo para criação de análise que suporta ambos os tipos (SAQUE e DEPOSITO)
 */
export type AnaliseInput = {
  tipoAnalise: "SAQUE" | "DEPOSITO";
  idCliente: string;
  nomeCompleto: string | null;
  dataAnalise: Date | string;
  dataCriacaoConta?: Date | string | null;
  tempoAnaliseSegundos?: number | null;
  observacao?: string | null;
  fonteConsulta?: string | null;
  qtdApostas?: number | null;
  retornoApostas?: string | null;
  analistaId?: number | null;
  auditoriaUsuario?: boolean | null;
  auditoriaData?: Date;
  // Campos específicos de SAQUE
  horarioSaque?: string | null;
  valorSaque?: string | null;
  metricaSaque?: string | null;
  categoriaSaque?: string | null;
  jogoEsporteSaque?: string | null;
  financeiro?: string | null;
  // Campos específicos de DEPOSITO
  valorDeposito?: string | null;
  ganhoPerda?: string | null;
  categoriaDeposito?: string | null;
  jogoEsporteDepositoApos?: string | null;
};

/**
 * Busca a última análise de um cliente (pode ser saque ou depósito)
 */
export async function getUltimaAnalise(idCliente: string) {
  return withCache(
    CacheKeys.ultimaAnalise(idCliente),
    async () => {
      const db = await getDb();
      if (!db) return undefined;
      
      // Buscar última análise em saques
      const ultimoSaque = await db
        .select()
        .from(saques)
        .where(eq(saques.idCliente, idCliente))
        .orderBy(desc(saques.dataAnalise), desc(saques.id))
        .limit(1);
      
      // Buscar última análise em depositos
      const ultimoDeposito = await db
        .select()
        .from(depositos)
        .where(eq(depositos.idCliente, idCliente))
        .orderBy(desc(depositos.dataAnalise), desc(depositos.id))
        .limit(1);
      
      // Comparar e retornar a mais recente
      if (ultimoSaque.length === 0 && ultimoDeposito.length === 0) {
        return undefined;
      }
      
      if (ultimoSaque.length === 0) return ultimoDeposito[0];
      if (ultimoDeposito.length === 0) return ultimoSaque[0];
      
      const dataSaque = new Date(ultimoSaque[0].dataAnalise);
      const dataDeposito = new Date(ultimoDeposito[0].dataAnalise);
      
      // Retornar a análise com data mais recente, ou a com ID maior se a data for igual
      if (dataSaque > dataDeposito) {
        return ultimoSaque[0];
      } else if (dataDeposito > dataSaque) {
        return ultimoDeposito[0];
      } else {
        // Mesma data, comparar por ID
        return (ultimoSaque[0].id > ultimoDeposito[0].id) ? ultimoSaque[0] : ultimoDeposito[0];
      }
    },
    180 // Cache por 3 minutos
  );
}

/**
 * Busca a data de criação da conta mais antiga de um cliente
 */
export async function getDataCriacaoConta(idCliente: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Busca a data de criação da conta mais antiga disponível em qualquer análise do cliente
  const saquesResult = await db
    .select({ dataCriacaoConta: saques.dataCriacaoConta, dataAnalise: saques.dataAnalise })
    .from(saques)
    .where(
      and(
        eq(saques.idCliente, idCliente),
        sql`${saques.dataCriacaoConta} IS NOT NULL`
      )
    )
    .orderBy(saques.dataAnalise)
    .limit(1);
  
  const depositosResult = await db
    .select({ dataCriacaoConta: depositos.dataCriacaoConta, dataAnalise: depositos.dataAnalise })
    .from(depositos)
    .where(
      and(
        eq(depositos.idCliente, idCliente),
        sql`${depositos.dataCriacaoConta} IS NOT NULL`
      )
    )
    .orderBy(depositos.dataAnalise)
    .limit(1);
  
  // Retornar a data mais antiga entre as duas tabelas
  if (saquesResult.length === 0 && depositosResult.length === 0) {
    return null;
  }
  
  if (saquesResult.length === 0) return depositosResult[0].dataCriacaoConta;
  if (depositosResult.length === 0) return saquesResult[0].dataCriacaoConta;
  
  // Comparar datas e retornar a mais antiga
  const dataSaque = new Date(saquesResult[0].dataAnalise);
  const dataDeposito = new Date(depositosResult[0].dataAnalise);
  
  return dataSaque < dataDeposito 
    ? saquesResult[0].dataCriacaoConta 
    : depositosResult[0].dataCriacaoConta;
}

/**
 * Verifica se já existe análise do mesmo tipo na mesma data
 */
export async function verificarDuplicidade(
  idCliente: string, 
  dataAnalise: string,
  tipoAnalise: "SAQUE" | "DEPOSITO"
) {
  const db = await getDb();
  if (!db) return false;
  
  const tabela = tipoAnalise === "SAQUE" ? saques : depositos;
  
  const result = await db
    .select()
    .from(tabela)
    .where(and(
      eq(tabela.idCliente, idCliente),
      eq(tabela.dataAnalise, dataAnalise as any)
    ))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Busca a análise mais recente do mesmo tipo e mesma data
 */
export async function getAnalisePorDataETipo(
  idCliente: string, 
  dataAnalise: string,
  tipoAnalise: "SAQUE" | "DEPOSITO"
) {
  const db = await getDb();
  if (!db) return undefined;

  const tabela = tipoAnalise === "SAQUE" ? saques : depositos;

  const result = await db
    .select()
    .from(tabela)
    .where(and(
      eq(tabela.idCliente, idCliente),
      eq(tabela.dataAnalise, dataAnalise as any)
    ))
    .orderBy(desc(tabela.id), desc(tabela.auditoriaData), desc(tabela.dataAnalise))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Busca análise por data (pode ser saque ou depósito)
 */
export async function getAnalisePorData(idCliente: string, dataAnalise: string) {
  return withCache(
    CacheKeys.analisePorData(idCliente, dataAnalise),
    async () => {
      const db = await getDb();
      if (!db) return undefined;

      // Buscar em ambas as tabelas e retornar a mais recente
      const saquesResult = await db
        .select()
        .from(saques)
        .where(and(
          eq(saques.idCliente, idCliente),
          eq(saques.dataAnalise, dataAnalise as any)
        ))
        .orderBy(desc(saques.id), desc(saques.auditoriaData), desc(saques.dataAnalise))
        .limit(1);

      const depositosResult = await db
        .select()
        .from(depositos)
        .where(and(
          eq(depositos.idCliente, idCliente),
          eq(depositos.dataAnalise, dataAnalise as any)
        ))
        .orderBy(desc(depositos.id), desc(depositos.auditoriaData), desc(depositos.dataAnalise))
        .limit(1);

      // Retornar a mais recente entre as duas
      if (saquesResult.length === 0 && depositosResult.length === 0) {
        return undefined;
      }

      if (saquesResult.length === 0) return depositosResult[0];
      if (depositosResult.length === 0) return saquesResult[0];

      // Comparar IDs para retornar a mais recente
      return saquesResult[0].id > depositosResult[0].id ? saquesResult[0] : depositosResult[0];
    },
    300 // Cache por 5 minutos
  );
}

/**
 * Busca uma análise específica por ID e tipo
 * Usado para buscar detalhes completos de uma análise na listagem
 * REFATORADO: Retorna TODOS os campos da tabela correta com join para analista
 */
export async function getAnalisePorIdETipo(
  id: number,
  tipoAnalise: "SAQUE" | "DEPOSITO"
) {
  const db = await getDb();
  if (!db) return undefined;

  if (tipoAnalise === "SAQUE") {
    const result = await db
      .select({
        // Campos comuns
        id: saques.id,
        idCliente: saques.idCliente,
        nomeCompleto: saques.nomeCompleto,
        dataAnalise: saques.dataAnalise,
        dataCriacaoConta: saques.dataCriacaoConta,
        tempoAnaliseSegundos: saques.tempoAnaliseSegundos,
        qtdApostas: saques.qtdApostas,
        retornoApostas: saques.retornoApostas,
        observacao: saques.observacao,
        fonteConsulta: saques.fonteConsulta,
        analistaId: saques.analistaId,
        auditoriaUsuario: saques.auditoriaUsuario,
        auditoriaData: saques.auditoriaData,
        financeiro: saques.financeiro,
        // Campos específicos de SAQUE
        horarioSaque: saques.horarioSaque,
        valorSaque: saques.valorSaque,
        metricaSaque: saques.metricaSaque,
        categoriaSaque: saques.categoriaSaque,
        jogoEsporteSaque: saques.jogoEsporteSaque,
        // Analista responsável
        analistaNome: users.name,
      })
      .from(saques)
      .leftJoin(users, eq(saques.analistaId, users.id))
      .where(eq(saques.id, id))
      .limit(1);

    if (result.length === 0) return undefined;
    
    // Adicionar tipoAnalise ao resultado
    return { ...result[0], tipoAnalise: "SAQUE" as const };
  } else {
    const result = await db
      .select({
        // Campos comuns
        id: depositos.id,
        idCliente: depositos.idCliente,
        nomeCompleto: depositos.nomeCompleto,
        dataAnalise: depositos.dataAnalise,
        dataCriacaoConta: depositos.dataCriacaoConta,
        tempoAnaliseSegundos: depositos.tempoAnaliseSegundos,
        qtdApostas: depositos.qtdApostas,
        retornoApostas: depositos.retornoApostas,
        observacao: depositos.observacao,
        fonteConsulta: depositos.fonteConsulta,
        analistaId: depositos.analistaId,
        auditoriaUsuario: depositos.auditoriaUsuario,
        auditoriaData: depositos.auditoriaData,
        financeiro: depositos.financeiro,
        // Campos específicos de DEPOSITO
        valorDeposito: depositos.valorDeposito,
        ganhoPerda: depositos.ganhoPerda,
        categoriaDeposito: depositos.categoriaDeposito,
        jogoEsporteDepositoApos: depositos.jogoEsporteDepositoApos,
        // Analista responsável
        analistaNome: users.name,
      })
      .from(depositos)
      .leftJoin(users, eq(depositos.analistaId, users.id))
      .where(eq(depositos.id, id))
      .limit(1);

    if (result.length === 0) return undefined;
    
    // Adicionar tipoAnalise ao resultado
    return { ...result[0], tipoAnalise: "DEPOSITO" as const };
  }
}

/**
 * Função auxiliar para construir objeto de saque a partir do input
 */
function buildSaqueFromInput(analise: AnaliseInput, dataAnalise: string, dataCriacaoConta: string | null): InsertSaque {
  const saque: InsertSaque = {
    idCliente: analise.idCliente,
    nomeCompleto: analise.nomeCompleto,
    dataAnalise: dataAnalise,
    dataCriacaoConta: dataCriacaoConta,
  };
  
  // Adicionar campos opcionais apenas se estiverem definidos
  if (analise.horarioSaque !== undefined) saque.horarioSaque = analise.horarioSaque;
  if (analise.valorSaque !== undefined) saque.valorSaque = analise.valorSaque;
  if (analise.metricaSaque !== undefined) saque.metricaSaque = analise.metricaSaque;
  if (analise.categoriaSaque !== undefined) saque.categoriaSaque = analise.categoriaSaque;
  if (analise.jogoEsporteSaque !== undefined) saque.jogoEsporteSaque = analise.jogoEsporteSaque;
  if (analise.financeiro !== undefined) saque.financeiro = analise.financeiro;
  if (analise.tempoAnaliseSegundos !== undefined) saque.tempoAnaliseSegundos = analise.tempoAnaliseSegundos;
  if (analise.qtdApostas !== undefined) saque.qtdApostas = analise.qtdApostas;
  if (analise.retornoApostas !== undefined) saque.retornoApostas = analise.retornoApostas;
  if (analise.observacao !== undefined) saque.observacao = analise.observacao;
  if (analise.fonteConsulta !== undefined) saque.fonteConsulta = analise.fonteConsulta;
  if (analise.analistaId !== undefined && analise.analistaId !== null) saque.analistaId = analise.analistaId;
  
  // REGRA DE NEGÓCIO: auditoriaUsuario é boolean
  if (analise.auditoriaUsuario !== undefined) {
    saque.auditoriaUsuario = analise.auditoriaUsuario;
    if (analise.auditoriaUsuario === true) {
      saque.auditoriaData = analise.auditoriaData || getDataAtualBrasilia();
    } else {
      saque.auditoriaData = null;
    }
  }
  
  return saque;
}

/**
 * Função auxiliar para construir objeto de depósito a partir do input
 */
function buildDepositoFromInput(analise: AnaliseInput, dataAnalise: string, dataCriacaoConta: string | null): InsertDeposito {
  const deposito: InsertDeposito = {
    idCliente: analise.idCliente,
    nomeCompleto: analise.nomeCompleto,
    dataAnalise: dataAnalise,
    dataCriacaoConta: dataCriacaoConta,
  };
  
  // Adicionar campos opcionais apenas se estiverem definidos
  if (analise.valorDeposito !== undefined) deposito.valorDeposito = analise.valorDeposito;
  if (analise.ganhoPerda !== undefined) deposito.ganhoPerda = analise.ganhoPerda;
  if (analise.financeiro !== undefined) deposito.financeiro = analise.financeiro;
  if (analise.categoriaDeposito !== undefined) deposito.categoriaDeposito = analise.categoriaDeposito;
  if (analise.jogoEsporteDepositoApos !== undefined) deposito.jogoEsporteDepositoApos = analise.jogoEsporteDepositoApos;
  if (analise.tempoAnaliseSegundos !== undefined) deposito.tempoAnaliseSegundos = analise.tempoAnaliseSegundos;
  if (analise.qtdApostas !== undefined) deposito.qtdApostas = analise.qtdApostas;
  if (analise.retornoApostas !== undefined) deposito.retornoApostas = analise.retornoApostas;
  if (analise.observacao !== undefined) deposito.observacao = analise.observacao;
  if (analise.fonteConsulta !== undefined) deposito.fonteConsulta = analise.fonteConsulta;
  if (analise.analistaId !== undefined && analise.analistaId !== null) deposito.analistaId = analise.analistaId;
  
  // REGRA DE NEGÓCIO: auditoriaUsuario é boolean
  if (analise.auditoriaUsuario !== undefined) {
    deposito.auditoriaUsuario = analise.auditoriaUsuario;
    if (analise.auditoriaUsuario === true) {
      deposito.auditoriaData = analise.auditoriaData || getDataAtualBrasilia();
    } else {
      deposito.auditoriaData = null;
    }
  }
  
  return deposito;
}

/**
 * Cria uma nova análise (saque ou depósito)
 */
export async function criarAnalise(analise: AnaliseInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Validar que auditoriaData não seja preenchido indevidamente
  if (analise.auditoriaData !== undefined && analise.auditoriaData !== null) {
    console.warn("[Database] AVISO: auditoriaData foi fornecido ao criar análise. Isso não deveria acontecer. Ignorando valor.");
    analise.auditoriaData = undefined;
  }
  
  // Garantir que o cliente existe
  const cliente = await db.select().from(clientes).where(eq(clientes.idCliente, analise.idCliente)).limit(1);
  if (cliente.length === 0) {
    await db.insert(clientes).values({ idCliente: analise.idCliente, nomeCompleto: analise.nomeCompleto });
  }
  
  // Converter datas para string YYYY-MM-DD
  const dataAnalise = typeof analise.dataAnalise === 'string' 
    ? analise.dataAnalise 
    : paraISOStringBrasilia(analise.dataAnalise as Date);
  
  const dataCriacaoConta = typeof analise.dataCriacaoConta === 'string'
    ? analise.dataCriacaoConta
    : analise.dataCriacaoConta instanceof Date
    ? paraISOStringBrasilia(analise.dataCriacaoConta)
    : analise.dataCriacaoConta ?? null;
  
  // Inserir na tabela específica baseado no tipo
  if (analise.tipoAnalise === "SAQUE") {
    const saque = buildSaqueFromInput(analise, dataAnalise, dataCriacaoConta);
    await db.insert(saques).values(saque);
  } else {
    const deposito = buildDepositoFromInput(analise, dataAnalise, dataCriacaoConta);
    await db.insert(depositos).values(deposito);
  }
  
  // Invalidar cache relacionado a análises
  await deleteCache(CacheKeys.ultimaAnalise(analise.idCliente));
  await deleteCache(CacheKeys.analisePorData(analise.idCliente, dataAnalise));
  await invalidateCache('metricas:analises:*');
}

