/**
 * Operações de banco de dados relacionadas a métricas de análises
 * Consolida queries de saques e depósitos para relatórios
 * REFATORADO: Versão limpa e funcional
 */

import { eq, and, desc, gte, lte, like, or } from "drizzle-orm";
import { saques, depositos, fraudes, users, clientes } from "../../drizzle/schema";
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
 * Busca fraudes para marcar análises com fraude
 * CORRIGIDO: Busca TODAS as fraudes dos clientes que aparecem nas análises,
 * não apenas as que correspondem ao filtro de data
 * CORRIGIDO: Normaliza datas para garantir match correto
 */
async function buscarFraudesParaAnalises(idsClientes: string[], datasAnalise: string[]) {
  const db = await getDb();
  if (!db || idsClientes.length === 0) return new Set<string>();
  
  console.log(`[Metricas] Buscando fraudes para ${idsClientes.length} clientes únicos`);
  
  // Buscar TODAS as fraudes dos clientes que aparecem nas análises
  // Isso garante que fraudes reportadas em qualquer data sejam encontradas
  const fraudesResult = await db
    .select({
      idCliente: fraudes.idCliente,
      dataAnalise: fraudes.dataAnalise,
    })
    .from(fraudes)
    .where(
      or(...idsClientes.map(id => eq(fraudes.idCliente, id)))
    );
  
  console.log(`[Metricas] Encontradas ${fraudesResult.length} fraudes para os clientes`);
  
  // Função auxiliar para normalizar data para string YYYY-MM-DD
  const normalizarData = (data: any): string => {
    if (!data) return '';
    // Se já for string no formato YYYY-MM-DD, retornar diretamente
    if (typeof data === 'string') {
      // Extrair apenas a parte da data (YYYY-MM-DD) se houver hora
      const match = data.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
      return data;
    }
    // Se for Date object, converter para YYYY-MM-DD
    if (data instanceof Date) {
      const year = data.getFullYear();
      const month = String(data.getMonth() + 1).padStart(2, '0');
      const day = String(data.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Tentar converter para Date e depois para string
    try {
      const date = new Date(data);
      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // Ignorar erros de conversão
    }
    return '';
  };
  
  // Criar Set com chaves únicas (idCliente + dataAnalise normalizada)
  // Uma fraude marca TODAS as análises daquele cliente naquela data
  const fraudesSet = new Set<string>();
  
  fraudesResult.forEach(fraude => {
    // Normalizar data da fraude antes de criar a chave
    const dataNormalizada = normalizarData(fraude.dataAnalise);
    const chave = `${fraude.idCliente}|${dataNormalizada}`;
    fraudesSet.add(chave);
    console.log(`[Metricas] Adicionando fraude ao Set: ${chave} (data original: ${fraude.dataAnalise}, normalizada: ${dataNormalizada})`);
  });
  
  console.log(`[Metricas] Total de chaves de fraude no Set: ${fraudesSet.size}`);
  console.log(`[Metricas] Chaves de fraude:`, Array.from(fraudesSet).slice(0, 10));
  
  return fraudesSet;
}

/**
 * Busca status dos clientes
 */
async function buscarStatusClientes(idsClientes: string[]) {
  const db = await getDb();
  if (!db || idsClientes.length === 0) return new Map<string, string>();
  
  const clientesResult = await db
    .select({
      idCliente: clientes.idCliente,
      statusCliente: clientes.statusCliente,
    })
    .from(clientes)
    .where(
      or(...idsClientes.map(id => eq(clientes.idCliente, id)))
    );
  
  const statusMap = new Map<string, string>();
  clientesResult.forEach(cliente => {
    statusMap.set(cliente.idCliente, cliente.statusCliente || 'OK');
  });
  
  return statusMap;
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
  const [saquesResult, depositosResult] = await Promise.all([
    deveBuscarSaques ? buscarSaques(filtros) : Promise.resolve([]),
    deveBuscarDepositos ? buscarDepositos(filtros) : Promise.resolve([]),
  ]);
  
  console.log(`[Metricas] Buscando análises com filtros:`, {
    tipo_analise: filtros.tipo_analise,
    data_inicio: filtros.data_inicio,
    data_fim: filtros.data_fim,
    id_cliente: filtros.id_cliente,
    analista_id: filtros.analista_id,
  });
  console.log(`[Metricas] Saques encontrados: ${saquesResult.length}, Depósitos encontrados: ${depositosResult.length}`);
  
  // Combinar resultados de ambas as tabelas
  if (deveBuscarSaques) {
    results.push(...saquesResult);
  }
  
  if (deveBuscarDepositos) {
    results.push(...depositosResult);
  }
  
  console.log(`[Metricas] Total de análises combinadas: ${results.length}`);
  
  // Log de análises com auditoria e fraude para debug
  const analisesComAuditoria = results.filter(a => a.auditoriaUsuario === true || a.auditoriaData);
  const analisesComAuditoriaData = results.filter(a => a.auditoriaData);
  console.log(`[Metricas] Análises com auditoriaUsuario=true: ${analisesComAuditoria.length}, com auditoriaData: ${analisesComAuditoriaData.length}`);
  
  // Buscar fraudes e status dos clientes que aparecem nas análises
  const idsClientesUnicos = [...new Set(results.map(a => a.idCliente).filter(Boolean))];
  const datasAnaliseUnicas = [...new Set(results.map(a => a.dataAnalise?.toString()).filter(Boolean))];
  
  const [fraudesSet, clientesStatus] = await Promise.all([
    buscarFraudesParaAnalises(idsClientesUnicos, datasAnaliseUnicas),
    buscarStatusClientes(idsClientesUnicos),
  ]);
  
  // Função auxiliar para normalizar data para string YYYY-MM-DD
  const normalizarData = (data: any): string => {
    if (!data) return '';
    // Se já for string no formato YYYY-MM-DD, retornar diretamente
    if (typeof data === 'string') {
      // Extrair apenas a parte da data (YYYY-MM-DD) se houver hora
      const match = data.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
      return data;
    }
    // Se for Date object, converter para YYYY-MM-DD
    if (data instanceof Date) {
      const year = data.getFullYear();
      const month = String(data.getMonth() + 1).padStart(2, '0');
      const day = String(data.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Tentar converter para Date e depois para string
    try {
      const date = new Date(data);
      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // Ignorar erros de conversão
    }
    return '';
  };
  
  // Adicionar campo temFraude e statusCliente - preservar todos os valores originais do banco
  const resultsComFraude = results.map(analise => {
    // Normalizar data da análise antes de criar a chave para garantir match correto
    const dataNormalizada = normalizarData(analise.dataAnalise);
    const chave = `${analise.idCliente || ''}|${dataNormalizada}`;
    const statusCliente = clientesStatus.get(analise.idCliente) || 'OK';
    const temFraude = fraudesSet.has(chave);
    
    // Log para debug de análises com fraude
    if (temFraude) {
      console.log(`[Metricas] ✅ Análise ${analise.id} (${analise.idCliente}) marcada com fraude. Chave: ${chave}`);
    }
    
    return {
      ...analise,
      temFraude: temFraude,
      statusCliente: statusCliente,
      // Não normalizar - preservar valores exatamente como vêm do banco
    };
  });
  
  // Ordenar resultados combinados
  // PRIORIDADE: Análises com auditoria/fraude aparecem primeiro
  const resultadosOrdenados = resultsComFraude.sort((a, b) => {
    // Priorizar análises com auditoria OU fraude
    const aTemProblema = Boolean(a.auditoriaData || (a as any).temFraude);
    const bTemProblema = Boolean(b.auditoriaData || (b as any).temFraude);
    
    // Se uma tem problema e outra não, a com problema vem primeiro
    if (aTemProblema && !bTemProblema) return -1;
    if (!aTemProblema && bTemProblema) return 1;
    
    // Se ambas têm ou não têm problema, ordenar por data (mais recente primeiro)
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
  
  // Log detalhado para debug
  console.log(`[Metricas] Total de análises retornadas: ${resultadosOrdenados.length}`);
  console.log(`[Metricas] Análises com auditoria: ${resultadosOrdenados.filter(a => a.auditoriaData).length}`);
  console.log(`[Metricas] Análises com fraude: ${resultadosOrdenados.filter(a => (a as any).temFraude).length}`);
  console.log(`[Metricas] Análises com auditoria E fraude: ${resultadosOrdenados.filter(a => a.auditoriaData && (a as any).temFraude).length}`);
  
  // Log de algumas análises para debug
  if (resultadosOrdenados.length > 0) {
    const primeirasAnalises = resultadosOrdenados.slice(0, 5);
    console.log(`[Metricas] Primeiras 5 análises:`, primeirasAnalises.map(a => ({
      id: a.id,
      idCliente: a.idCliente,
      dataAnalise: a.dataAnalise,
      tipoAnalise: a.tipoAnalise,
      temFraude: (a as any).temFraude,
      auditoriaData: a.auditoriaData,
      auditoriaUsuario: a.auditoriaUsuario,
    })));
  }
  
  return resultadosOrdenados;
}
