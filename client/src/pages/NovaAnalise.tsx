import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Loader2, ArrowLeft, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

type TipoAnalise = "SAQUE" | "DEPOSITO";

const METRICAS_SAQUE = [
  "SALDO 1000->4.999",
  "SALDO 5000->9.999",
  "SALDO 10000->5.0000",
  "SAQUE MENSAL 5000->9.999",
  "SAQUE MENSAL 10.000->29.999",
  "SAQUE MENSAL 30.000->69.999",
  "SAQUE MENSAL 80.000->99.999",
  "SAQUE MENSAL 100.000->200.000",
  "APOSTAS 1000->4.999",
  "APOSTAS 5.000->9.999",
  "APOSTAS 10.000->29.000",
  "APOSTAS 30.000->40.999",
  "APOSTAS 50.000->79.999",
];

const CATEGORIAS = ["CASSINO", "SPORTBOOK", "N/A"];

export default function NovaAnalise() {
  useAuth();
  const [, navigate] = useLocation();
  
  const [tipoAnalise, setTipoAnalise] = useState<TipoAnalise>("SAQUE");
  const [idCliente, setIdCliente] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [dataCriacaoConta, setDataCriacaoConta] = useState("");
  const [dataAnalise, setDataAnalise] = useState(new Date().toISOString().split("T")[0]);
  
  // Campos Saque
  const [horarioSaque, setHorarioSaque] = useState("");
  const [valorSaque, setValorSaque] = useState("");
  const [metricaSaque, setMetricaSaque] = useState("");
  const [categoriaSaque, setCategoriaSaque] = useState("");
  const [jogoEsporteSaque, setJogoEsporteSaque] = useState("");
  
  // Campos Depósito
  const [valorDeposito, setValorDeposito] = useState("");
  const [categoriaDeposito, setCategoriaDeposito] = useState("");
  const [jogoEsporteDepositoApos, setJogoEsporteDepositoApos] = useState("");
  const [financeiro, setFinanceiro] = useState("");
  
  // Campos Comuns
  const [observacao, setObservacao] = useState("");
  const [isDuplicado, setIsDuplicado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [auditoriaMarcada, setAuditoriaMarcada] = useState(false);
  const [auditoriaModalAberto, setAuditoriaModalAberto] = useState(false);
  const [auditoriaTipo, setAuditoriaTipo] = useState<"ESPORTIVO" | "CASSINO" | "">("");
  const [auditoriaMotivo, setAuditoriaMotivo] = useState("");
  const [auditoriaErro, setAuditoriaErro] = useState("");

  const { data: verificacaoHoje } = trpc.analises.verificarHoje.useQuery(
    { idCliente, dataAnalise },
    { enabled: idCliente.length > 0 && dataAnalise.length > 0 }
  );
  const { data: auditoriaStatus } = trpc.auditorias.status.useQuery(
    { idCliente },
    { enabled: idCliente.length > 0 }
  );
  const alertaDuplicadoRef = useRef<string | null>(null);

  // Cronômetro automático (inicia ao inserir ID)
  const [tempoSegundos, setTempoSegundos] = useState(0);
  const [cronometroAtivo, setCronometroAtivo] = useState(false); // Inicia ao inserir ID

  // Fetch última análise
  const { data: ultimaAnalise } = trpc.analises.getUltimo.useQuery(
    { idCliente },
    { enabled: idCliente.length > 0 }
  );

  const analiseDoDia = verificacaoHoje?.analise ?? null;
  const dataAnaliseBloqueada = analiseDoDia
    ? (analiseDoDia.auditoriaData ?? analiseDoDia.dataAnalise ?? null)
    : null;
  const dataAnaliseBloqueadaFormatada = dataAnaliseBloqueada
    ? new Date(dataAnaliseBloqueada as string | number | Date).toLocaleString()
    : "";
  const clienteAuditorado = auditoriaStatus?.temAuditoria ?? false;
  const ultimaAuditoria = auditoriaStatus?.ultima ?? null;
  const camposDesabilitados = !idCliente || isDuplicado;

  useEffect(() => {
    if (!idCliente) {
      setIsDuplicado(false);
      alertaDuplicadoRef.current = null;
      return;
    }

    if (verificacaoHoje?.duplicado) {
      setIsDuplicado(true);
      setCronometroAtivo(false);
      if (alertaDuplicadoRef.current !== `${idCliente}-${dataAnalise}`) {
        toast.error("Cliente já foi analisado nesta data.");
        alertaDuplicadoRef.current = `${idCliente}-${dataAnalise}`;
      }
    } else {
      setIsDuplicado(false);
      alertaDuplicadoRef.current = null;
    }
  }, [verificacaoHoje, idCliente, dataAnalise]);

  // Auto-preencher com última análise
  useEffect(() => {
    if (isDuplicado) {
      return;
    }

    if (ultimaAnalise) {
      setNomeCompleto(ultimaAnalise.nomeCompleto || "");
      setDataCriacaoConta(ultimaAnalise.dataCriacaoConta?.toString().split("T")[0] || "");
      
      if (ultimaAnalise.tipoAnalise === "SAQUE") {
        setTipoAnalise("SAQUE");
        setValorSaque(ultimaAnalise.valorSaque?.toString() || "");
        setMetricaSaque(ultimaAnalise.metricaSaque || "");
        setCategoriaSaque(ultimaAnalise.categoriaSaque || "");
        setJogoEsporteSaque(ultimaAnalise.jogoEsporteSaque || "");
      } else if (ultimaAnalise.tipoAnalise === "DEPOSITO") {
        setTipoAnalise("DEPOSITO");
        setValorDeposito(ultimaAnalise.valorDeposito?.toString() || "");
        setCategoriaDeposito(ultimaAnalise.categoriaDeposito || "");
        setJogoEsporteDepositoApos(ultimaAnalise.jogoEsporteDepositoApos || "");
      }
      
      setObservacao(ultimaAnalise.observacao || "");
    } else if (ultimaAnalise === null) {
      setNomeCompleto("");
      setDataCriacaoConta("");
      setHorarioSaque("");
      setValorSaque("");
      setMetricaSaque("");
      setCategoriaSaque("");
      setJogoEsporteSaque("");
      setValorDeposito("");
      setCategoriaDeposito("");
      setJogoEsporteDepositoApos("");
      setFinanceiro("");
      setObservacao("");
    }
  }, [ultimaAnalise, isDuplicado]);

  useEffect(() => {
    if (idCliente.length === 0) {
      setNomeCompleto("");
      setDataCriacaoConta("");
      setHorarioSaque("");
      setValorSaque("");
      setMetricaSaque("");
      setCategoriaSaque("");
      setJogoEsporteSaque("");
      setValorDeposito("");
      setCategoriaDeposito("");
      setJogoEsporteDepositoApos("");
      setFinanceiro("");
      setObservacao("");
      setTipoAnalise("SAQUE");
      setAuditoriaMarcada(false);
      setAuditoriaTipo("");
      setAuditoriaMotivo("");
      setAuditoriaErro("");
    }
  }, [idCliente]);

  // Iniciar cronômetro ao inserir ID do cliente
  useEffect(() => {
    if (idCliente.length > 0 && !isDuplicado) {
      setCronometroAtivo(true);
      setTempoSegundos(0);
    } else {
      setCronometroAtivo(false);
    }
  }, [idCliente, isDuplicado]);

  // Cronômetro automático que inicia ao inserir ID
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cronometroAtivo) {
      interval = setInterval(() => {
        setTempoSegundos(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cronometroAtivo]);

  // Função para formatar tempo
  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    }
    return `${minutos}m ${segs}s`;
  };

  // Criar análise
  const criarMutation = trpc.analises.criar.useMutation({
    onError: (error) => {
      if (error.message.includes("duplicado")) {
        setIsDuplicado(true);
        toast.error("Cliente já analisado hoje");
      } else {
        toast.error("Erro ao criar análise");
      }
    },
  });

  // Finalizar análise
  const finalizarMutation = trpc.analises.finalizar.useMutation({
    onSuccess: () => {
      toast.success("Análise finalizada e aprovada");
      navigate("/");
    },
    onError: () => {
      toast.error("Erro ao finalizar análise");
    },
  });

  const registrarAuditoriaMutation = trpc.auditorias.registrar.useMutation({
    onError: () => {
      toast.error("Erro ao registrar auditoria");
    },
  });

  const handleFinalizar = async () => {
    const idClienteTrimmed = idCliente.trim();
    const nomeTrimmed = nomeCompleto.trim();
    const observacaoTrimmed = observacao.trim();
    const financeiroTrimmed = financeiro.trim();

    if (!idClienteTrimmed || !dataAnalise) {
      toast.error("Preencha ID do cliente e data válidos");
      return;
    }

    if (!nomeTrimmed) {
      toast.error("Informe o nome do cliente");
      return;
    }

    if (!observacaoTrimmed) {
      toast.error("Descreva a observação da análise");
      return;
    }

    if (!financeiroTrimmed) {
      toast.error("Informe o financeiro da análise");
      return;
    }

    if (isDuplicado) {
      toast.error("Cliente já analisado nesta data. Ajuste a data para continuar.");
      return;
    }

    if (auditoriaMarcada) {
      if (!auditoriaTipo) {
        setAuditoriaErro("Selecione o tipo da auditoria");
        toast.error("Selecione o tipo da auditoria");
        return;
      }
      if (!auditoriaMotivo.trim()) {
        setAuditoriaErro("Informe o motivo da auditoria");
        toast.error("Informe o motivo da auditoria");
        return;
      }
    }

    const financeiroNumber = parseFloat(financeiroTrimmed);
    if (Number.isNaN(financeiroNumber)) {
      toast.error("Financeiro inválido");
      return;
    }

    if (tipoAnalise === "SAQUE") {
      const horarioTrimmed = horarioSaque.trim();
      const metricaTrimmed = metricaSaque.trim();
      const categoriaTrimmed = categoriaSaque.trim();
      const jogoTrimmed = jogoEsporteSaque.trim();
      const valorSaqueNumber = valorSaque ? parseFloat(valorSaque) : NaN;

      if (!horarioTrimmed) {
        toast.error("Informe o horário do saque");
        return;
      }

      if (!valorSaque || Number.isNaN(valorSaqueNumber) || valorSaqueNumber <= 0) {
        toast.error("Informe o valor do saque (maior que 0)");
        return;
      }

      if (!metricaTrimmed) {
        toast.error("Selecione a métrica do saque");
        return;
      }

      if (!categoriaTrimmed) {
        toast.error("Selecione a categoria do saque");
        return;
      }

      if (!jogoTrimmed) {
        toast.error("Informe o jogo ou esporte do saque");
        return;
      }
    } else {
      const categoriaDepositoTrimmed = categoriaDeposito.trim();
      const jogoDepositoTrimmed = jogoEsporteDepositoApos.trim();
      const valorDepositoNumber = valorDeposito ? parseFloat(valorDeposito) : NaN;

      if (!valorDeposito || Number.isNaN(valorDepositoNumber) || valorDepositoNumber <= 0) {
        toast.error("Informe o valor do depósito (maior que 0)");
        return;
      }

      if (!categoriaDepositoTrimmed) {
        toast.error("Selecione a categoria do depósito");
        return;
      }

      if (!jogoDepositoTrimmed) {
        toast.error("Informe o jogo ou esporte após o depósito");
        return;
      }
    }

    setIsLoading(true);
    try {
      await criarMutation.mutateAsync({
        idCliente: idClienteTrimmed,
        dataAnalise,
        nomeCompleto: nomeTrimmed,
        dataCriacaoConta: dataCriacaoConta ? new Date(dataCriacaoConta) : undefined,
        tipoAnalise,
        horarioSaque: tipoAnalise === "SAQUE" ? horarioSaque.trim() : undefined,
        valorSaque:
          tipoAnalise === "SAQUE" && valorSaque
            ? parseFloat(valorSaque)
            : undefined,
        metricaSaque:
          tipoAnalise === "SAQUE" ? metricaSaque.trim() : undefined,
        categoriaSaque:
          tipoAnalise === "SAQUE" ? categoriaSaque.trim() : undefined,
        jogoEsporteSaque:
          tipoAnalise === "SAQUE" ? jogoEsporteSaque.trim() : undefined,
        valorDeposito:
          tipoAnalise === "DEPOSITO" && valorDeposito
            ? parseFloat(valorDeposito)
            : undefined,
        categoriaDeposito:
          tipoAnalise === "DEPOSITO" ? categoriaDeposito.trim() : undefined,
        jogoEsporteDepositoApos:
          tipoAnalise === "DEPOSITO"
            ? jogoEsporteDepositoApos.trim()
            : undefined,
        financeiro: financeiroNumber,
        observacao: observacaoTrimmed,
        tempoAnaliseSegundos: tempoSegundos,
      });
      
      // Resetar cronômetro após sucesso
      setCronometroAtivo(false);
      setTempoSegundos(0);

      if (auditoriaMarcada) {
        await registrarAuditoriaMutation.mutateAsync({
          idCliente,
          motivo: auditoriaMotivo.trim(),
          tipo: auditoriaTipo as "ESPORTIVO" | "CASSINO",
        });
      }

      await finalizarMutation.mutateAsync({
        idCliente,
        dataAnalise,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportarFraude = () => {
    toast.info("Modal de fraude em desenvolvimento");
  };

  const abrirModalAuditoria = () => {
    setAuditoriaErro("");
    setAuditoriaModalAberto(true);
  };

  const handleToggleAuditoria = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      abrirModalAuditoria();
    } else {
      handleCancelarAuditoria();
    }
  };

  const handleConfirmarAuditoria = () => {
    if (!auditoriaTipo) {
      setAuditoriaErro("Selecione o tipo da auditoria");
      return;
    }
    if (!auditoriaMotivo.trim()) {
      setAuditoriaErro("Informe o motivo da auditoria");
      return;
    }

    setAuditoriaMarcada(true);
    setAuditoriaErro("");
    setAuditoriaModalAberto(false);
    toast.success("Auditoria marcada para esta análise");
  };

  const handleCancelarAuditoria = () => {
    setAuditoriaMarcada(false);
    setAuditoriaTipo("");
    setAuditoriaMotivo("");
    setAuditoriaErro("");
    setAuditoriaModalAberto(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] py-8">
      <div className="container max-w-3xl">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gradient">Nova Análise</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
        </div>

        {isDuplicado && (
          <Card className="glass-card p-4 mb-6 border-destructive/50 bg-destructive/10">
            <div className="flex gap-3">
              <AlertCircle className="text-destructive flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-destructive">Análise Duplicada</h3>
                <p className="text-sm text-destructive/80">
                  Cliente já foi analisado hoje. Registro duplicado bloqueado.
                </p>
                {dataAnaliseBloqueadaFormatada && (
                  <p className="text-xs text-destructive/60 mt-1">
                    Última análise registrada em {dataAnaliseBloqueadaFormatada}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Card do Cronômetro Automático */}
        {idCliente && !isDuplicado && (
          <Card className="glass-card p-6 mb-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/30 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Clock className="text-primary" size={28} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tempo de Análise (Automático)</p>
                  <p className="text-4xl font-bold text-gradient font-mono tracking-wider">{formatarTempo(tempoSegundos)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-400">Em andamento</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="glass-card p-8">
          <div className="space-y-6">
            {/* Seleção de Tipo de Análise */}
            <div>
              <Label className="text-foreground mb-4 block text-base font-semibold">Tipo de Análise *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipoAnalise("SAQUE")}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                    tipoAnalise === "SAQUE"
                      ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-background/30 hover:border-primary/50 hover:bg-background/50"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                  disabled={camposDesabilitados}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className={`font-bold text-lg mb-1 ${tipoAnalise === "SAQUE" ? "text-primary" : "text-foreground"}`}>
                        Análise de Saque
                      </div>
                      <div className="text-sm text-muted-foreground">Registre saques do cliente</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      tipoAnalise === "SAQUE" 
                        ? "border-primary bg-primary" 
                        : "border-border/50 group-hover:border-primary/50"
                    }`}>
                      {tipoAnalise === "SAQUE" && (
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoAnalise("DEPOSITO")}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                    tipoAnalise === "DEPOSITO"
                      ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-background/30 hover:border-primary/50 hover:bg-background/50"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                  disabled={camposDesabilitados}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className={`font-bold text-lg mb-1 ${tipoAnalise === "DEPOSITO" ? "text-primary" : "text-foreground"}`}>
                        Análise de Depósito
                      </div>
                      <div className="text-sm text-muted-foreground">Registre depósitos do cliente</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      tipoAnalise === "DEPOSITO" 
                        ? "border-primary bg-primary" 
                        : "border-border/50 group-hover:border-primary/50"
                    }`}>
                      {tipoAnalise === "DEPOSITO" && (
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Campos Comuns */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Informações do Cliente</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="idCliente" className="text-foreground">
                      ID do Cliente *
                    </Label>
                    {isDuplicado && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                        <AlertCircle size={14} />
                        Já analisado hoje
                      </span>
                    )}
                    {(clienteAuditorado || auditoriaMarcada) && !isDuplicado && (
                      <Badge variant="outline" className="border-amber-500 text-amber-200 bg-amber-500/10 flex items-center gap-1 text-[11px] font-medium">
                        <span className="text-lg leading-none">⚠️</span>
                        Auditorado
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="idCliente"
                    value={idCliente}
                    onChange={(e) => setIdCliente(e.target.value)}
                    placeholder="Digite o ID"
                    className="mt-2 bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="nomeCompleto" className="text-foreground">
                    Nome do Usuário
                  </Label>
                  <Input
                    id="nomeCompleto"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Nome completo do cliente"
                    className="mt-2 bg-input border-border text-foreground"
                    disabled={camposDesabilitados}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataCriacaoConta" className="text-foreground">
                    Data de Criação da Conta
                  </Label>
                  <Input
                    id="dataCriacaoConta"
                    type="date"
                    value={dataCriacaoConta}
                    onChange={(e) => setDataCriacaoConta(e.target.value)}
                    className="mt-2 bg-input border-border text-foreground"
                    disabled={camposDesabilitados}
                  />
                </div>
                <div>
                  <Label htmlFor="dataAnalise" className="text-foreground">
                    Data da Análise *
                  </Label>
                  <Input
                    id="dataAnalise"
                    type="date"
                    value={dataAnalise}
                    onChange={(e) => setDataAnalise(e.target.value)}
                    className="mt-2 bg-input border-border text-foreground"
                    disabled={!idCliente}
                  />
                </div>
              </div>

            </div>

            {/* Campos Específicos - SAQUE */}
            {tipoAnalise === "SAQUE" && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Detalhes do Saque</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="horarioSaque" className="text-foreground">
                      Horário do Saque
                    </Label>
                    <Input
                      id="horarioSaque"
                      type="time"
                      value={horarioSaque}
                      onChange={(e) => setHorarioSaque(e.target.value)}
                      className="mt-2 bg-input border-border text-foreground"
                    disabled={camposDesabilitados}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valorSaque" className="text-foreground">
                      Valor do Saque
                    </Label>
                    <Input
                      id="valorSaque"
                      type="number"
                      step="0.01"
                      value={valorSaque}
                      onChange={(e) => setValorSaque(e.target.value)}
                      placeholder="0.00"
                      className="mt-2 bg-input border-border text-foreground"
                    disabled={camposDesabilitados}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor="metricaSaque" className="text-foreground">
                    Métrica
                  </Label>
                  <select
                    id="metricaSaque"
                    value={metricaSaque}
                    onChange={(e) => setMetricaSaque(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                    disabled={camposDesabilitados}
                  >
                    <option value="">Selecione uma métrica...</option>
                    {METRICAS_SAQUE.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoriaSaque" className="text-foreground">
                      Categoria
                    </Label>
                    <select
                      id="categoriaSaque"
                      value={categoriaSaque}
                      onChange={(e) => setCategoriaSaque(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                    disabled={camposDesabilitados}
                    >
                      <option value="">Selecione...</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="jogoEsporteSaque" className="text-foreground">
                      Jogo/Esporte
                    </Label>
                    <Input
                      id="jogoEsporteSaque"
                      value={jogoEsporteSaque}
                      onChange={(e) => setJogoEsporteSaque(e.target.value)}
                      placeholder="Ex: Futebol, Slots"
                      className="mt-2 bg-input border-border text-foreground"
                    disabled={camposDesabilitados}
                    />
                  </div>
                  <div>
                    <Label htmlFor="financeiro" className="text-foreground">
                      Financeiro (R$)
                    </Label>
                    <Input
                      id="financeiro"
                      type="number"
                      step="0.01"
                      value={financeiro}
                      onChange={(e) => setFinanceiro(e.target.value)}
                      placeholder="Positivo: casa ganha | Negativo: cliente lucra"
                      className="mt-2 bg-input border-border text-foreground"
                    disabled={camposDesabilitados}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Campos Específicos - DEPOSITO */}
            {tipoAnalise === "DEPOSITO" && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Detalhes do Depósito</h3>
                
                <div className="mb-4">
                  <Label htmlFor="valorDeposito" className="text-foreground">
                    Valor do Depósito
                  </Label>
                  <Input
                    id="valorDeposito"
                    type="number"
                    step="0.01"
                    value={valorDeposito}
                    onChange={(e) => setValorDeposito(e.target.value)}
                    placeholder="0.00"
                    className="mt-2 bg-input border-border text-foreground"
                    disabled={camposDesabilitados}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoriaDeposito" className="text-foreground">
                      Categoria
                    </Label>
                    <select
                      id="categoriaDeposito"
                      value={categoriaDeposito}
                      onChange={(e) => setCategoriaDeposito(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                      disabled={camposDesabilitados}
                    >
                      <option value="">Selecione...</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="jogoEsporteDepositoApos" className="text-foreground">
                      Jogo/Esporte após Depósito
                    </Label>
                    <Input
                      id="jogoEsporteDepositoApos"
                      value={jogoEsporteDepositoApos}
                      onChange={(e) => setJogoEsporteDepositoApos(e.target.value)}
                      placeholder="N/A se não realizou apostas"
                      className="mt-2 bg-input border-border text-foreground"
                      disabled={camposDesabilitados}
                    />
                  </div>
                  <div>
                    <Label htmlFor="financeiro" className="text-foreground">
                      Financeiro (R$)
                    </Label>
                    <Input
                      id="financeiro"
                      type="number"
                      step="0.01"
                      value={financeiro}
                      onChange={(e) => setFinanceiro(e.target.value)}
                      placeholder="Positivo: casa ganha | Negativo: cliente lucra"
                      className="mt-2 bg-input border-border text-foreground"
                      disabled={camposDesabilitados}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Observação */}
            <div className="border-t border-border pt-6">
              <Label htmlFor="observacao" className="text-foreground">
                Observação (máx. 1000 caracteres)
              </Label>
              <Textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value.slice(0, 1000))}
                placeholder="Notas adicionais..."
                className="mt-2 bg-input border-border text-foreground"
                rows={4}
                disabled={camposDesabilitados}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {observacao.length}/1000
              </div>
            </div>

            {/* Auditoria */}
            <div className="border-t border-border pt-6">
              <div className="space-y-3 border border-border/50 rounded-lg p-4 bg-background/40">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="auditoriaFlag"
                      checked={auditoriaMarcada}
                      onCheckedChange={handleToggleAuditoria}
                      disabled={camposDesabilitados}
                    />
                    <div>
                      <Label htmlFor="auditoriaFlag" className="text-foreground font-medium cursor-pointer">
                        Auditoria?
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Defina motivo e tipo de auditoria antes de finalizar a análise.
                      </p>
                    </div>
                  </div>
                  {auditoriaMarcada && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={abrirModalAuditoria}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={handleCancelarAuditoria}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                {auditoriaMarcada && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-200 flex items-center gap-2">
                        ⚠️ Auditoria marcada nesta análise
                      </span>
                      <span className="text-xs uppercase tracking-wide text-amber-300">{auditoriaTipo}</span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-line">{auditoriaMotivo}</p>
                  </div>
                )}

                {!auditoriaMarcada && ultimaAuditoria && (
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary flex items-center gap-2">
                        ⚠️ Auditoria existente para este cliente
                      </span>
                      <span className="text-xs uppercase tracking-wide text-primary">{ultimaAuditoria.tipo}</span>
                    </div>
                    <p className="text-foreground/90">{ultimaAuditoria.motivo}</p>
                    <p className="text-xs text-muted-foreground">
                      Registrada em{" "}
                      {ultimaAuditoria.criadoEm
                        ? new Date(ultimaAuditoria.criadoEm as string | number | Date).toLocaleString("pt-BR")
                        : "-"}{" "}
                      por {ultimaAuditoria.nomeAnalista ?? "—"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
              <Button
                onClick={handleFinalizar}
                disabled={isDuplicado || isLoading || !idCliente}
                className="flex-1 btn-primary"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Finalizar Análise (Aprovado)
                  </>
                )}
              </Button>
              <Button
                onClick={handleReportarFraude}
                disabled={isDuplicado || !idCliente}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <AlertCircle className="mr-2" size={16} />
                Reportar Fraude
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={auditoriaModalAberto} onOpenChange={(open) => setAuditoriaModalAberto(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar auditoria</DialogTitle>
            <DialogDescription>
              Informe o motivo e selecione o tipo de auditoria para este cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium text-foreground">
                Tipo da auditoria *
              </Label>
              <RadioGroup
                value={auditoriaTipo || undefined}
                onValueChange={(value: "ESPORTIVO" | "CASSINO") => {
                  setAuditoriaErro("");
                  setAuditoriaTipo(value);
                }}
                className="mt-3 grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor="auditoria-esportivo"
                  className="border border-border rounded-lg px-4 py-3 flex items-center gap-2 cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 transition-colors"
                >
                  <RadioGroupItem value="ESPORTIVO" id="auditoria-esportivo" />
                  <div>
                    <span className="text-sm font-semibold text-foreground">Esportivo</span>
                    <p className="text-xs text-muted-foreground">Eventos e apostas esportivas</p>
                  </div>
                </label>
                <label
                  htmlFor="auditoria-cassino"
                  className="border border-border rounded-lg px-4 py-3 flex items-center gap-2 cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 transition-colors"
                >
                  <RadioGroupItem value="CASSINO" id="auditoria-cassino" />
                  <div>
                    <span className="text-sm font-semibold text-foreground">Cassino</span>
                    <p className="text-xs text-muted-foreground">Jogos de cassino e slots</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="auditoriaMotivo" className="text-sm font-medium text-foreground">
                Motivo da auditoria *
              </Label>
              <Textarea
                id="auditoriaMotivo"
                value={auditoriaMotivo}
                onChange={(e) => {
                  setAuditoriaErro("");
                  setAuditoriaMotivo(e.target.value.slice(0, 500));
                }}
                placeholder="Descreva de forma objetiva o motivo pelo qual esta análise exige auditoria."
                className="mt-2"
                rows={4}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {auditoriaMotivo.length}/500 caracteres
              </div>
            </div>

            {auditoriaErro && (
              <div className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle size={16} className="text-destructive" />
                {auditoriaErro}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAuditoriaModalAberto(false)}>
              Fechar
            </Button>
            <Button onClick={handleConfirmarAuditoria} className="btn-primary">
              Confirmar auditoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

