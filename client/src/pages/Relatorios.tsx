import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Download, BarChart3, PieChart, TrendingUp, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { LoadingState } from "@/components/common/LoadingState";
import { formatarTempo, formatarMoeda, formatarData, formatarDataHora } from "@/utils/formatters";

export default function Relatorios() {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);
  
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipoAnalise, setTipoAnalise] = useState<"SAQUE" | "DEPOSITO" | "">("");
  const [idClienteFiltro, setIdClienteFiltro] = useState("");
  const [analiseSelecionada, setAnaliseSelecionada] = useState<any>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [analisesVisiveis, setAnalisesVisiveis] = useState(10);
  const [usuariosVisiveis, setUsuariosVisiveis] = useState(10);
  const [tempoMedioUsuariosVisiveis, setTempoMedioUsuariosVisiveis] = useState(9);
  
  const [metricas, setMetricas] = useState({
    totalAnalises: 0,
    totalSaques: 0,
    totalDepositos: 0,
    tempoMedioSegundos: 0,
    taxaFraude: 0,
    analisesPorUsuario: {} as Record<string, number>,
    tempoMedioPorUsuario: {} as Record<string, number>,
  });

  // Fetch métricas - deve estar antes de qualquer return
  const { data: analises, isLoading } = trpc.metricas.getAnalises.useQuery(
    {
      analista_id: user?.role === "admin" ? undefined : user?.id,
      data_inicio: dataInicio ? new Date(dataInicio) : undefined,
      data_fim: dataFim ? new Date(dataFim) : undefined,
      tipo_analise: tipoAnalise || undefined,
      id_cliente: idClienteFiltro || undefined,
    },
    {
      enabled: Boolean(user && user.role === "admin"),
    }
  );

  // Processar dados para gráficos
  useEffect(() => {
    if (analises && analises.length > 0) {
      setAnalisesVisiveis(Math.min(10, analises.length));
      const saques = analises.filter(a => a.tipoAnalise === "SAQUE").length;
      const depositos = analises.filter(a => a.tipoAnalise === "DEPOSITO").length;
      const tempoTotal = analises.reduce((sum, a) => sum + (a.tempoAnaliseSegundos || 0), 0);
      const tempoMedio = analises.length > 0 ? Math.round(tempoTotal / analises.length) : 0;

      // Análises por usuário
      const analisesPorUsuario: Record<string, number> = {};
      const temposPorUsuario: Record<string, { total: number; count: number }> = {};

      analises.forEach(a => {
        const userName = a.nomeCompleto || "Desconhecido";
        analisesPorUsuario[userName] = (analisesPorUsuario[userName] || 0) + 1;
        
        if (!temposPorUsuario[userName]) {
          temposPorUsuario[userName] = { total: 0, count: 0 };
        }
        temposPorUsuario[userName].total += a.tempoAnaliseSegundos || 0;
        temposPorUsuario[userName].count += 1;
      });

      const tempoMedioPorUsuario: Record<string, number> = {};
      Object.entries(temposPorUsuario).forEach(([user, data]) => {
        tempoMedioPorUsuario[user] = Math.round(data.total / data.count);
      });

      setMetricas({
        totalAnalises: analises.length,
        totalSaques: saques,
        totalDepositos: depositos,
        tempoMedioSegundos: tempoMedio,
        taxaFraude: 0,
        analisesPorUsuario,
        tempoMedioPorUsuario,
      });
      setUsuariosVisiveis(
        Math.min(10, Object.keys(analisesPorUsuario).length)
      );
    }
  }, [analises]);
  const analisesLimitadas = useMemo(() => {
    if (!analises) return [];
    return analises.slice(0, analisesVisiveis);
  }, [analises, analisesVisiveis]);

  const podeCarregarMais = analises ? analisesVisiveis < analises.length : false;

  const usuariosOrdenados = useMemo(() => {
    return Object.entries(metricas.analisesPorUsuario).sort(
      (a, b) => b[1] - a[1]
    );
  }, [metricas.analisesPorUsuario]);

  const usuariosLimitados = useMemo(() => {
    return usuariosOrdenados.slice(0, usuariosVisiveis);
  }, [usuariosOrdenados, usuariosVisiveis]);

  const podeVerMaisUsuarios = usuariosOrdenados.length > usuariosVisiveis;

  // Tempo Médio por Usuário - ordenar e limitar
  const tempoMedioUsuariosOrdenados = useMemo(() => {
    return Object.entries(metricas.tempoMedioPorUsuario).sort(
      (a, b) => b[1] - a[1]
    );
  }, [metricas.tempoMedioPorUsuario]);

  const tempoMedioUsuariosLimitados = useMemo(() => {
    return tempoMedioUsuariosOrdenados.slice(0, tempoMedioUsuariosVisiveis);
  }, [tempoMedioUsuariosOrdenados, tempoMedioUsuariosVisiveis]);

  const podeVerMaisTempoMedio = tempoMedioUsuariosOrdenados.length > tempoMedioUsuariosVisiveis;

  const handleExportarCSV = () => {
    if (!analises || analises.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const headers = ["ID Cliente", "Nome", "Data", "Tipo", "Valor", "Tempo (s)", "Categoria"];
    const rows = analises.map(a => [
      a.idCliente,
      a.nomeCompleto || "",
      a.dataAnalise?.toString() || "",
      a.tipoAnalise || "",
      a.tipoAnalise === "SAQUE" ? a.valorSaque : a.valorDeposito,
      a.tempoAnaliseSegundos || 0,
      a.tipoAnalise === "SAQUE" ? a.categoriaSaque : a.categoriaDeposito,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Relatório exportado com sucesso");
  };


const getTipoBadgeClass = (tipo: "SAQUE" | "DEPOSITO" | null | undefined) => {
  if (tipo === "SAQUE") {
    return "bg-sky-500/15 text-sky-300 border border-sky-500/20";
  }
  if (tipo === "DEPOSITO") {
    return "bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20";
  }
  return "bg-muted/20 text-muted-foreground border border-border/40";
};

const getValorBadgeClass = (valor: number) => {
  if (valor >= 10_000) {
    return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
  }
  if (valor >= 1_000) {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  }
  if (valor <= 0) {
    return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
  }
  return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
};

const getTempoBadgeClass = (segundos: number) => {
  if (segundos <= 60) {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
  }
  if (segundos <= 180) {
    return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
  }
  return "bg-rose-500/10 text-rose-300 border border-rose-500/20";
};

const categoriaClasses: Record<string, string> = {
  CASSINO: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
  SPORTBOOK: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  OUTROS: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
  "N/A": "bg-muted/15 text-muted-foreground border border-border/40",
};

  const getCategoriaBadgeClass = (categoria?: string | null) => {
    if (!categoria) {
      return "bg-muted/15 text-muted-foreground border border-border/40";
    }
    const normalizada = categoria.toUpperCase();
    return categoriaClasses[normalizada] || "bg-muted/15 text-muted-foreground border border-border/40";
  };

  // Cores para gráficos
  const cores = ["#0088ff", "#00d4ff", "#00ff88", "#ffaa00", "#ff6b6b", "#c084fc"];

  // Early return após todos os hooks
  if (loading || !user || user.role !== "admin") {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28]">
      {/* Header */}
      <header className="border-b border-border glass-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={20} className="mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Relatórios & Métricas</h1>
          </div>
          <Button onClick={handleExportarCSV} className="btn-primary">
            <Download size={18} className="mr-2" />
            Exportar CSV
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filtros */}
        <Card className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground mb-2 block">Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-background/50 border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-background/50 border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Tipo de Análise</Label>
              <select
                value={tipoAnalise}
                onChange={(e) => setTipoAnalise(e.target.value as any)}
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-md text-foreground"
              >
                <option value="">Todos</option>
                <option value="SAQUE">Saque</option>
                <option value="DEPOSITO">Depósito</option>
              </select>
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">ID do Cliente</Label>
              <Input
                type="text"
                value={idClienteFiltro}
                onChange={(e) => setIdClienteFiltro(e.target.value)}
                placeholder="Filtrar por ID do cliente"
                className="bg-background/50 border-border text-foreground"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => {
                setDataInicio("");
                setDataFim("");
                setTipoAnalise("");
                setIdClienteFiltro("");
              }}
              variant="outline"
              className="w-full md:w-auto"
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Análises</p>
                <p className="text-3xl font-bold text-primary">{metricas.totalAnalises}</p>
              </div>
              <BarChart3 className="text-primary/50" size={32} />
            </div>
          </Card>

          <Card className="glass-card p-6 hover:border-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saques Analisados</p>
                <p className="text-3xl font-bold text-accent">{metricas.totalSaques}</p>
              </div>
              <TrendingUp className="text-accent/50" size={32} />
            </div>
          </Card>

          <Card className="glass-card p-6 hover:border-secondary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Depósitos Analisados</p>
                <p className="text-3xl font-bold text-secondary">{metricas.totalDepositos}</p>
              </div>
              <PieChart className="text-secondary/50" size={32} />
            </div>
          </Card>

          <Card className="glass-card p-6 hover:border-chart-4/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tempo Médio</p>
                <p className="text-3xl font-bold text-chart-4">
                  {formatarTempo(metricas.tempoMedioSegundos)}
                </p>
              </div>
              <Clock className="text-chart-4/50" size={32} />
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico Pizza - Distribuição Saque vs Depósito */}
          <Card className="glass-card p-6 h-[360px] flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Distribuição por Tipo</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {metricas.totalAnalises > 0 && (
                    <>
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#0088ff"
                        strokeWidth="60"
                        strokeDasharray={`${(metricas.totalSaques / metricas.totalAnalises) * 502.65} 502.65`}
                        transform="rotate(-90 100 100)"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="60"
                        strokeDasharray={`${(metricas.totalDepositos / metricas.totalAnalises) * 502.65} 502.65`}
                        strokeDashoffset={-((metricas.totalSaques / metricas.totalAnalises) * 502.65)}
                        transform="rotate(-90 100 100)"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{metricas.totalAnalises}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 space-y-2 text-sm flex-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0088ff" }}></div>
                  <span className="text-muted-foreground">Saques</span>
                </div>
                <span className="font-semibold text-foreground">{metricas.totalSaques} ({Math.round((metricas.totalSaques / metricas.totalAnalises) * 100)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00d4ff" }}></div>
                  <span className="text-muted-foreground">Depósitos</span>
                </div>
                <span className="font-semibold text-foreground">{metricas.totalDepositos} ({Math.round((metricas.totalDepositos / metricas.totalAnalises) * 100)}%)</span>
              </div>
            </div>
          </Card>

          {/* Gráfico Barras - Análises por Usuário */}
          <Card
            className={`glass-card p-6 flex flex-col ${
              usuariosVisiveis > 10 ? "" : "h-[360px]"
            } overflow-hidden`}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Análises por Usuário</h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {usuariosLimitados.length > 0 ? (
                usuariosLimitados.map(([usuario, count], idx) => {
                  // Key única usando nome do usuário e índice
                  const uniqueKey = `usuario-${usuario}-${idx}`;
                  const maxValor =
                    usuariosOrdenados.length > 0
                      ? usuariosOrdenados[0][1]
                      : count;
                  let widthPercent = 0;
                  if (maxValor > 0) {
                    const raw = (count / maxValor) * 100;
                    widthPercent = raw > 0 ? Math.max(raw, 5) : 0;
                  }

                  return (
                    <div key={uniqueKey}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground truncate">
                          {usuario}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: cores[idx % cores.length],
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum dado</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {podeVerMaisUsuarios && (
                <Button
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() =>
                    setUsuariosVisiveis((prev) =>
                      Math.min(prev + 10, usuariosOrdenados.length)
                    )
                  }
                >
                  Ver mais usuários
                </Button>
              )}
              {usuariosVisiveis > 10 && (
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => setUsuariosVisiveis(10)}
                >
                  Ver menos
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Tempo Médio por Usuário */}
        <Card className="glass-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Tempo Médio por Usuário</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {tempoMedioUsuariosLimitados.length > 0 ? (
              tempoMedioUsuariosLimitados.map(([usuario, tempo], idx) => {
                // Key única usando nome do usuário e índice
                const uniqueKey = `tempo-${usuario}-${idx}`;
                return (
                  <div key={uniqueKey} className="p-4 border border-border/50 rounded-lg hover:border-accent/50 transition-colors">
                    <p className="text-sm text-muted-foreground mb-2 truncate">{usuario}</p>
                    <p className="text-2xl font-bold text-accent">{formatarTempo(tempo)}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground">Nenhum dado</p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {podeVerMaisTempoMedio && (
              <Button
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={() =>
                  setTempoMedioUsuariosVisiveis((prev) =>
                    Math.min(prev + 9, tempoMedioUsuariosOrdenados.length)
                  )
                }
              >
                Ver mais usuários
              </Button>
            )}
            {tempoMedioUsuariosVisiveis > 9 && (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => setTempoMedioUsuariosVisiveis(9)}
              >
                Ver menos
              </Button>
            )}
          </div>
        </Card>

        {/* Tabela de Análises */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Detalhes das Análises</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : analises && analises.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground">ID Cliente</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Nome</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Valor</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Tempo</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Categoria</th>
                  </tr>
                </thead>
                <tbody>
                  {analisesLimitadas.map((analise, index) => {
                    const valorNumerico = parseFloat(
                      analise.tipoAnalise === "SAQUE"
                        ? analise.valorSaque?.toString() || "0"
                        : analise.valorDeposito?.toString() || "0"
                    );
                    const tempoSegundos = analise.tempoAnaliseSegundos || 0;
                    const categoria =
                      analise.tipoAnalise === "SAQUE"
                        ? analise.categoriaSaque
                        : analise.categoriaDeposito;
                    const tipo =
                      analise.tipoAnalise === "SAQUE"
                        ? "SAQUE"
                        : analise.tipoAnalise === "DEPOSITO"
                        ? "DEPOSITO"
                        : null;

                    // Key única combinando tipo e ID para evitar duplicatas entre saques e depositos
                    const uniqueKey = `${analise.tipoAnalise || 'UNKNOWN'}-${analise.id}-${index}`;

                    return (
                      <tr 
                        key={uniqueKey} 
                        className="border-b border-border/50 hover:bg-background/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setAnaliseSelecionada(analise);
                          setModalAberto(true);
                        }}
                      >
                        <td className="py-3 px-4 text-foreground">{analise.idCliente}</td>
                        <td className="py-3 px-4 text-foreground">{analise.nomeCompleto || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatarData(analise.dataAnalise)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getTipoBadgeClass(tipo)}`}
                          >
                            {tipo ?? analise.tipoAnalise ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getValorBadgeClass(valorNumerico)}`}
                          >
                            {formatarMoeda(valorNumerico)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getTempoBadgeClass(tempoSegundos)}`}
                          >
                            {formatarTempo(tempoSegundos)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getCategoriaBadgeClass(categoria)}`}
                          >
                            {categoria || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {podeCarregarMais && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => setAnalisesVisiveis((prev) => Math.min(prev + 10, analises?.length || prev))}
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    Ver mais
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma análise encontrada</p>
          )}
        </Card>

        {/* Modal de Detalhes da Análise */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Análise</DialogTitle>
              <DialogDescription>
                Informações completas da análise realizada
              </DialogDescription>
            </DialogHeader>
            {analiseSelecionada && (
              <div className="space-y-6 mt-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">ID do Cliente</Label>
                    <p className="text-foreground font-semibold">{analiseSelecionada.idCliente}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Nome Completo</Label>
                    <p className="text-foreground font-semibold">{analiseSelecionada.nomeCompleto || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Data da Análise</Label>
                    <p className="text-foreground font-semibold">
                      {formatarData(analiseSelecionada.dataAnalise)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Data de Criação da Conta</Label>
                    <p className="text-foreground font-semibold">
                      {formatarData(analiseSelecionada.dataCriacaoConta)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Tipo de Análise</Label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getTipoBadgeClass(analiseSelecionada.tipoAnalise as any)}`}>
                      {analiseSelecionada.tipoAnalise || "—"}
                    </span>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Tempo de Análise</Label>
                    <p className="text-foreground font-semibold">
                      {formatarTempo(analiseSelecionada.tempoAnaliseSegundos || 0)}
                    </p>
                  </div>
                </div>

                {/* Campos específicos de SAQUE */}
                {analiseSelecionada.tipoAnalise === "SAQUE" && (
                  <div className="border-t border-border pt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Detalhes do Saque</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Horário do Saque</Label>
                        <p className="text-foreground font-semibold">{analiseSelecionada.horarioSaque || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Valor do Saque</Label>
                        <p className="text-foreground font-semibold">
                          {analiseSelecionada.valorSaque ? formatarMoeda(parseFloat(analiseSelecionada.valorSaque.toString())) : "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Métrica do Saque</Label>
                        <p className="text-foreground font-semibold">{analiseSelecionada.metricaSaque || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Categoria</Label>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getCategoriaBadgeClass(analiseSelecionada.categoriaSaque)}`}>
                          {analiseSelecionada.categoriaSaque || "—"}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-muted-foreground text-sm">Jogo/Esporte</Label>
                        <p className="text-foreground font-semibold">{analiseSelecionada.jogoEsporteSaque || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos específicos de DEPOSITO */}
                {analiseSelecionada.tipoAnalise === "DEPOSITO" && (
                  <div className="border-t border-border pt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Detalhes do Depósito</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Valor do Depósito</Label>
                        <p className="text-foreground font-semibold">
                          {analiseSelecionada.valorDeposito ? formatarMoeda(parseFloat(analiseSelecionada.valorDeposito.toString())) : "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Ganho/Perda</Label>
                        <p className={`font-semibold ${
                          parseFloat(analiseSelecionada.ganhoPerda?.toString() || "0") >= 0 
                            ? "text-emerald-400" 
                            : "text-rose-400"
                        }`}>
                          {analiseSelecionada.ganhoPerda ? formatarMoeda(parseFloat(analiseSelecionada.ganhoPerda.toString())) : "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Categoria</Label>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getCategoriaBadgeClass(analiseSelecionada.categoriaDeposito)}`}>
                          {analiseSelecionada.categoriaDeposito || "—"}
                        </span>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Jogo/Esporte Após Depósito</Label>
                        <p className="text-foreground font-semibold">{analiseSelecionada.jogoEsporteDepositoApos || "—"}</p>
                      </div>
                      {analiseSelecionada.qtdApostas && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Quantidade de Apostas</Label>
                          <p className="text-foreground font-semibold">{analiseSelecionada.qtdApostas}</p>
                        </div>
                      )}
                      {analiseSelecionada.retornoApostas && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Retorno das Apostas</Label>
                          <p className="text-foreground font-semibold">
                            {formatarMoeda(parseFloat(analiseSelecionada.retornoApostas.toString()))}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {analiseSelecionada.observacao && (
                  <div className="border-t border-border pt-4">
                    <Label className="text-muted-foreground text-sm">Observações</Label>
                    <p className="text-foreground mt-2 whitespace-pre-wrap">{analiseSelecionada.observacao}</p>
                  </div>
                )}

                {/* Informações de Auditoria */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informações de Auditoria</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Fonte de Consulta</Label>
                      <p className="text-foreground font-semibold">{analiseSelecionada.fonteConsulta || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Data de Auditoria</Label>
                      <p className="text-foreground font-semibold">
                        {formatarDataHora(analiseSelecionada.auditoriaData)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

