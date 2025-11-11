import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, ArrowLeft, Play, Pause, RotateCcw, Clock } from "lucide-react";
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
  const { user } = useAuth();
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

  // Cronômetro automático (inicia ao inserir ID)
  const [tempoSegundos, setTempoSegundos] = useState(0);
  const [cronometroAtivo, setCronometroAtivo] = useState(false); // Inicia ao inserir ID

  // Fetch última análise
  const { data: ultimaAnalise } = trpc.analises.getUltimo.useQuery(
    { idCliente },
    { enabled: idCliente.length > 0 }
  );

  // Auto-preencher com última análise
  useEffect(() => {
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
    }
  }, [ultimaAnalise]);

  // Iniciar cronômetro ao inserir ID do cliente
  useEffect(() => {
    if (idCliente.length > 0) {
      setCronometroAtivo(true);
      setTempoSegundos(0);
    } else {
      setCronometroAtivo(false);
    }
  }, [idCliente]);

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
    onSuccess: () => {
      toast.success("Análise criada com sucesso");
      navigate("/");
    },
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

  const handleFinalizar = async () => {
    if (!idCliente || !dataAnalise) {
      toast.error("Preencha ID do cliente e data");
      return;
    }

    setIsLoading(true);
    try {
      await criarMutation.mutateAsync({
        idCliente,
        dataAnalise,
        nomeCompleto,
        dataCriacaoConta: dataCriacaoConta ? new Date(dataCriacaoConta) : undefined,
        tipoAnalise,
        horarioSaque: tipoAnalise === "SAQUE" ? horarioSaque : undefined,
        valorSaque: tipoAnalise === "SAQUE" && valorSaque ? parseFloat(valorSaque) : undefined,
        metricaSaque: tipoAnalise === "SAQUE" ? metricaSaque : undefined,
        categoriaSaque: tipoAnalise === "SAQUE" ? categoriaSaque : undefined,
        jogoEsporteSaque: tipoAnalise === "SAQUE" ? jogoEsporteSaque : undefined,
        valorDeposito: tipoAnalise === "DEPOSITO" && valorDeposito ? parseFloat(valorDeposito) : undefined,
        categoriaDeposito: tipoAnalise === "DEPOSITO" ? categoriaDeposito : undefined,
        jogoEsporteDepositoApos: tipoAnalise === "DEPOSITO" ? jogoEsporteDepositoApos : undefined,
        financeiro: financeiro ? parseFloat(financeiro) : undefined,
        observacao,
        tempoAnaliseSegundos: tempoSegundos,
      });
      
      // Resetar cronômetro após sucesso
      setCronometroAtivo(false);
      setTempoSegundos(0);

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
              </div>
            </div>
          </Card>
        )}

        {/* Card do Cronômetro Automático */}
        {idCliente && (
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
                  }`}
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
                  }`}
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
                  <Label htmlFor="idCliente" className="text-foreground">
                    ID do Cliente *
                  </Label>
                  <Input
                    id="idCliente"
                    value={idCliente}
                    onChange={(e) => setIdCliente(e.target.value)}
                    placeholder="Digite o ID"
                    className="mt-2 bg-input border-border text-foreground"
                    disabled={false}
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
                    disabled={!idCliente}
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
                    disabled={!idCliente}
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
                      disabled={!idCliente}
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
                      disabled={!idCliente}
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
                    disabled={!idCliente}
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
                      disabled={!idCliente}
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
                      disabled={!idCliente}
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
                      disabled={!idCliente}
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
                    disabled={!idCliente}
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
                      disabled={!idCliente}
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
                      disabled={!idCliente}
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
                      disabled={!idCliente}
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
                disabled={!idCliente}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {observacao.length}/1000
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
    </div>
  );
}

