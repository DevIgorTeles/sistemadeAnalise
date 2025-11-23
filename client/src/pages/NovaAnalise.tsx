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
import { AlertCircle, Loader2, ArrowLeft, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { TipoAnalise, METRICAS_SAQUE, CATEGORIAS, TipoAuditoria } from "@/constants/analise";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { TipoAnaliseSelector } from "@/components/analise/TipoAnaliseSelector";
import { TimerCard } from "@/components/analise/TimerCard";
import { DuplicadoAlert } from "@/components/analise/DuplicadoAlert";
import { FraudeAlert } from "@/components/analise/FraudeAlert";
import { MultiSelect } from "@/components/analise/MultiSelect";
import { useTimer } from "@/hooks/useTimer";
import { formatarData, formatarDataHora } from "@/utils/formatters";
import { getDataHojeBrasilia, paraISOStringBrasilia } from "@/utils/timezone";

export default function NovaAnalise() {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [, navigate] = useLocation();
  
  // Todos os hooks devem ser chamados antes de qualquer return condicional
  const [tipoAnalise, setTipoAnalise] = useState<TipoAnalise>("SAQUE");
  const [idClienteInput, setIdClienteInput] = useState(""); // ID digitado pelo usuário (atualizado a cada caractere)
  const [idCliente, setIdCliente] = useState(""); // ID validado (usado nas queries, atualizado com debounce)
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [dataCriacaoConta, setDataCriacaoConta] = useState("");
  // Usar data atual no fuso horário de Brasília
  const [dataAnalise, setDataAnalise] = useState(getDataHojeBrasilia());
  
  // Campos Saque
  const [horarioSaque, setHorarioSaque] = useState("");
  const [valorSaque, setValorSaque] = useState("");
  const [metricasSaque, setMetricasSaque] = useState<string[]>([]);
  const [categoriasSaque, setCategoriasSaque] = useState<string[]>([]);
  const [jogoEsporteSaque, setJogoEsporteSaque] = useState("");
  
  // Campos Depósito
  const [valorDeposito, setValorDeposito] = useState("");
  const [categoriasDeposito, setCategoriasDeposito] = useState<string[]>([]);
  const [jogoEsporteDepositoApos, setJogoEsporteDepositoApos] = useState("");
  const [financeiro, setFinanceiro] = useState("");
  
  // Campos Comuns
  const [observacao, setObservacao] = useState("");
  const [isDuplicado, setIsDuplicado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analiseJaCriada, setAnaliseJaCriada] = useState(false); // Rastrear se a análise já foi criada nesta sessão
  const [auditoriaMarcada, setAuditoriaMarcada] = useState(false);
  const [auditoriaModalAberto, setAuditoriaModalAberto] = useState(false);
  const [auditoriaTipo, setAuditoriaTipo] = useState<"ESPORTIVO" | "CASSINO" | "">("");
  const [auditoriaMotivo, setAuditoriaMotivo] = useState("");
  const [auditoriaErro, setAuditoriaErro] = useState("");
  
  // Estados do modal de fraude
  const [fraudeMarcada, setFraudeMarcada] = useState(false);
  const [fraudeModalAberto, setFraudeModalAberto] = useState(false);
  const [fraudeDescricao, setFraudeDescricao] = useState("");
  const [fraudeErro, setFraudeErro] = useState("");

  // Cronômetro automático usando hook customizado
  const timer = useTimer({ autoStart: false });
  const alertaDuplicadoRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce: atualizar idCliente (usado nas queries) apenas depois que o usuário parar de digitar
  useEffect(() => {
    // Limpar timeout anterior se existir
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Se o campo foi limpo, atualizar imediatamente
    if (idClienteInput.length === 0) {
      setIdCliente("");
      return;
    }

    // Aguardar 500ms após o usuário parar de digitar antes de atualizar o ID validado
    debounceTimeoutRef.current = setTimeout(() => {
      setIdCliente(idClienteInput.trim());
    }, 800);

    // Cleanup: limpar timeout se o componente desmontar ou o valor mudar antes do timeout
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [idClienteInput]);

  // Validação de duplicidade: verifica se já existe análise do mesmo tipo na mesma data
  // Revalida automaticamente quando ID, data ou tipo de análise muda
  const { data: verificacaoHoje, refetch: refetchVerificacao } = trpc.analises.verificarHoje.useQuery(
    { idCliente, dataAnalise, tipoAnalise },
    { 
      enabled: idCliente.length > 0 && dataAnalise.length > 0 && !loading && !!user,
      // Revalidar sempre que os parâmetros mudarem
      refetchOnMount: true,
      refetchOnWindowFocus: false
    }
  );
  const { data: auditoriaStatus } = trpc.auditorias.status.useQuery(
    { idCliente },
    { enabled: idCliente.length > 0 && !loading && !!user }
  );
  const { data: fraudeStatus } = trpc.fraudes.status.useQuery(
    { idCliente },
    { enabled: idCliente.length > 0 && !loading && !!user }
  );

  // Fetch última análise
  const { data: ultimaAnalise } = trpc.analises.getUltimo.useQuery(
    { idCliente },
    { enabled: idCliente.length > 0 && !loading && !!user }
  );

  // Buscar data de criação da conta quando ID for inserido (sempre, mesmo se duplicado)
  const { data: dataCriacaoContaBuscada } = trpc.analises.getDataCriacaoConta.useQuery(
    { idCliente },
    { 
      enabled: idCliente.length > 0 && !loading && !!user,
      // Sempre buscar, mesmo quando duplicado, para mostrar a informação
      refetchOnMount: true,
      refetchOnWindowFocus: false
    }
  );

  const analiseDoDia = verificacaoHoje?.analise ?? null;
  const clienteAuditorado = auditoriaStatus?.temAuditoria ?? false;
  const ultimaAuditoria = auditoriaStatus?.ultima ?? null;
  const clienteComFraude = fraudeStatus?.temFraude ?? false;
  
  // Campos desabilitados quando:
  // - Não há ID do cliente
  // - Há análise duplicada do mesmo tipo na mesma data
  const camposDesabilitados = !idCliente || isDuplicado;

  // Iniciar timer automaticamente quando ID do cliente for informado
  useEffect(() => {
    if (idCliente.length > 0 && dataAnalise && !isDuplicado) {
      // Iniciar timer automaticamente se não estiver ativo e não houver duplicidade
      if (!timer.ativo) {
        timer.reiniciar();
      }
    } else if ((!idCliente || isDuplicado) && timer.ativo) {
      // Pausar timer apenas se estiver ativo e não houver ID ou se houver duplicidade
      timer.pausar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCliente, dataAnalise, isDuplicado]);

  // Validação rigorosa: verificar duplicidade do mesmo tipo na mesma data
  useEffect(() => {
    if (!idCliente || !dataAnalise) {
      setIsDuplicado(false);
      alertaDuplicadoRef.current = null;
      if (timer.ativo) {
        timer.pausar();
      }
      return;
    }

    // Verificar se há análise do mesmo tipo na data informada
    if (verificacaoHoje?.duplicado && verificacaoHoje?.analise) {
      setIsDuplicado(true);
      if (timer.ativo) {
        timer.pausar();
      }
      
      const keyAlerta = `${idCliente}-${dataAnalise}-${tipoAnalise}`;
      if (alertaDuplicadoRef.current !== keyAlerta) {
        toast.error(
          "Este usuário já foi analisado na data de hoje.",
          { duration: 6000 }
        );
        alertaDuplicadoRef.current = keyAlerta;
      }
    } else {
      setIsDuplicado(false);
      alertaDuplicadoRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificacaoHoje, idCliente, dataAnalise, tipoAnalise, analiseDoDia]);

  // Função auxiliar para limpar todos os campos do formulário (exceto ID do cliente e data de análise)
  const limparCamposFormulario = () => {
    setNomeCompleto("");
    setDataCriacaoConta("");
    setHorarioSaque("");
    setValorSaque("");
    setMetricasSaque([]);
    setCategoriasSaque([]);
    setJogoEsporteSaque("");
    setValorDeposito("");
    setCategoriasDeposito([]);
    setJogoEsporteDepositoApos("");
    setFinanceiro("");
    setObservacao("");
    setAuditoriaMarcada(false);
    setAuditoriaTipo("");
    setAuditoriaMotivo("");
    setAuditoriaErro("");
    timer.resetar();
  };

  // Auto-preencher apenas nome e data de criação quando ID existente é informado
  // IMPORTANTE: Não preenche nenhum dado de análises antigas, apenas nome e data de criação da conta
  useEffect(() => {
    if (!idCliente) {
      setNomeCompleto("");
      setDataCriacaoConta("");
      return;
    }

    // Preencher apenas o nome do cliente (sem dados de análises antigas)
    if (ultimaAnalise && !isDuplicado) {
      // Buscar nome do cliente, mas não preencher outros campos de análise
      setNomeCompleto(ultimaAnalise.nomeCompleto || "");
    }

    // Sempre buscar e preencher apenas a data de criação da conta do banco quando ID for inserido
    // Esta é a única informação adicional que preenchemos automaticamente
    if (dataCriacaoContaBuscada) {
      try {
        const dataFormatada = paraISOStringBrasilia(dataCriacaoContaBuscada);
        if (dataFormatada && dataFormatada !== "Invalid Date") {
          setDataCriacaoConta(dataFormatada);
        }
      } catch (error) {
        console.error("Erro ao formatar data de criação da conta buscada:", error);
        setDataCriacaoConta("");
      }
    } else {
      // Se não encontrou nenhuma data no banco, deixar campo vazio
      setDataCriacaoConta("");
    }
  }, [ultimaAnalise, dataCriacaoContaBuscada, idCliente, isDuplicado]);

  // Limpar TODOS os campos quando ID do cliente validado é removido/apagado
  useEffect(() => {
    if (idCliente.length === 0) {
      // Limpar todos os campos do formulário
      setAnaliseJaCriada(false); // Resetar flag de análise criada
      setNomeCompleto("");
      setDataCriacaoConta("");
      setHorarioSaque("");
      setValorSaque("");
      setMetricasSaque([]);
      setCategoriasSaque([]);
      setJogoEsporteSaque("");
      setValorDeposito("");
      setCategoriasDeposito([]);
      setJogoEsporteDepositoApos("");
      setFinanceiro("");
      setObservacao("");
      // Limpar campos de auditoria
      setAuditoriaMarcada(false);
      setAuditoriaTipo("");
      setAuditoriaMotivo("");
      setAuditoriaErro("");
      // Limpar campos de fraude
      setFraudeMarcada(false);
      setFraudeDescricao("");
      setFraudeErro("");
      // Resetar estados
      setIsDuplicado(false);
      setIsLoading(false);
      alertaDuplicadoRef.current = null;
      // Resetar e pausar timer apenas se estiver ativo
      if (timer.ativo) {
        timer.resetar();
        timer.pausar();
      }
      // Não resetar tipoAnalise - manter o tipo selecionado (SAQUE ou DEPOSITO)
      // Não resetar dataAnalise - manter a data selecionada
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCliente]);

  // Limpar campos específicos do tipo quando o tipo de análise mudar
  useEffect(() => {
    // Resetar estado de duplicado ao trocar tipo para revalidar
    setIsDuplicado(false);
    
    if (tipoAnalise === "SAQUE") {
      // Limpar campos de depósito
      setValorDeposito("");
      setCategoriasDeposito([]);
      setJogoEsporteDepositoApos("");
    } else {
      // Limpar campos de saque
      setHorarioSaque("");
      setValorSaque("");
      setMetricasSaque([]);
      setCategoriasSaque([]);
      setJogoEsporteSaque("");
    }
    // Sempre limpar financeiro ao trocar tipo (será recalculado)
    setFinanceiro("");
    
    // Revalidar duplicidade quando tipo mudar
    if (idCliente && dataAnalise) {
      refetchVerificacao();
    }
  }, [tipoAnalise, idCliente, dataAnalise, refetchVerificacao]);

  // O timer é controlado no useEffect de validação de duplicidade
  // Não precisa de useEffect separado aqui

  // Todos os hooks (incluindo useMutation) devem estar antes do return condicional
  const criarMutation = trpc.analises.criar.useMutation({
    onError: (error) => {
      if (error.message.includes("duplicado") || error.message.includes("ja analisado") || error.data?.code === "CONFLICT") {
        setIsDuplicado(true);
        setAnaliseJaCriada(true); // Marcar que a análise já existe
        toast.error("Este usuário já foi analisado na data de hoje.", {
          duration: 5000,
        });
      } else {
        toast.error("Erro ao criar análise: " + error.message);
      }
    },
  });

  const finalizarMutation = trpc.analises.finalizar.useMutation({
    onSuccess: () => {
      // Toast mais detalhado já foi exibido ao criar a análise
      // Este toast confirma a finalização
      toast.success("✅ Análise finalizada e aprovada com sucesso!", {
        duration: 3000
      });
      // Limpar campos do formulário e manter usuário na mesma tela para nova análise
      setIdClienteInput("");
      setIdCliente("");
      limparCamposFormulario();
      setDataAnalise(getDataHojeBrasilia());
    },
    onError: () => {
      toast.error("Erro ao finalizar análise");
    },
  });

  const registrarAuditoriaMutation = trpc.auditorias.registrar.useMutation({
    onError: (error) => {
      toast.error(`Erro ao registrar auditoria: ${error.message || "Erro desconhecido"}`, {
        duration: 5000
      });
    },
  });

  const reportarFraudeMutation = trpc.fraudes.reportar.useMutation({
    onSuccess: () => {
      // Não limpar campos aqui - isso será feito no handleFinalizar
      // A mensagem de sucesso será mostrada no handleFinalizar
    },
    onError: (error) => {
      toast.error(`Erro ao reportar fraude: ${error.message || "Erro desconhecido"}`, {
        duration: 5000
      });
      setFraudeErro(error.message || "Erro ao reportar fraude");
    },
  });

  // Return condicional deve vir DEPOIS de todos os hooks
  if (loading || !user) {
    return <LoadingState />;
  }

  const handleFinalizar = async () => {
    // Usar idClienteInput para garantir que pegamos o valor digitado, mesmo se o debounce ainda não atualizou
    const idClienteTrimmed = idClienteInput.trim();
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

    if (!financeiroTrimmed) {
      toast.error("Informe o financeiro da análise");
      return;
    }

    if (isDuplicado) {
      toast.error("Este usuário já foi analisado na data de hoje.", {
        duration: 5000,
      });
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

    if (fraudeMarcada) {
      if (!fraudeDescricao.trim() || fraudeDescricao.trim().length < 10) {
        toast.error("Informe a descrição detalhada da fraude (mínimo 10 caracteres)");
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

      if (metricasSaque.length === 0) {
        toast.error("Selecione pelo menos uma métrica do saque");
        return;
      }

      if (categoriasSaque.length === 0) {
        toast.error("Selecione pelo menos uma categoria do saque");
        return;
      }

      if (!jogoTrimmed) {
        toast.error("Informe o jogo ou esporte do saque");
        return;
      }
    } else {
      const jogoDepositoTrimmed = jogoEsporteDepositoApos.trim();
      const valorDepositoNumber = valorDeposito ? parseFloat(valorDeposito) : NaN;

      if (!valorDeposito || Number.isNaN(valorDepositoNumber) || valorDepositoNumber <= 0) {
        toast.error("Informe o valor do depósito (maior que 0)");
        return;
      }

      if (categoriasDeposito.length === 0) {
        toast.error("Selecione pelo menos uma categoria do depósito");
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
        // Enviar dataCriacaoConta como string (YYYY-MM-DD) diretamente, não como Date object
        dataCriacaoConta: dataCriacaoConta || undefined,
        tipoAnalise,
        horarioSaque: tipoAnalise === "SAQUE" ? horarioSaque.trim() : undefined,
        valorSaque:
          tipoAnalise === "SAQUE" && valorSaque
            ? parseFloat(valorSaque)
            : undefined,
        metricaSaque:
          tipoAnalise === "SAQUE" && metricasSaque.length > 0
            ? metricasSaque.join(", ")
            : undefined,
        categoriaSaque:
          tipoAnalise === "SAQUE" && categoriasSaque.length > 0
            ? categoriasSaque.join(", ")
            : undefined,
        jogoEsporteSaque:
          tipoAnalise === "SAQUE" ? jogoEsporteSaque.trim() : undefined,
        valorDeposito:
          tipoAnalise === "DEPOSITO" && valorDeposito
            ? parseFloat(valorDeposito)
            : undefined,
        categoriaDeposito:
          tipoAnalise === "DEPOSITO" && categoriasDeposito.length > 0
            ? categoriasDeposito.join(", ")
            : undefined,
        jogoEsporteDepositoApos:
          tipoAnalise === "DEPOSITO"
            ? jogoEsporteDepositoApos.trim()
            : undefined,
        financeiro: financeiroNumber,
        // ganhoPerda não é enviado do frontend - campo opcional no banco
        observacao: observacaoTrimmed || undefined,
        tempoAnaliseSegundos: timer.segundos,
        // REGRA DE NEGÓCIO: auditoriaUsuario é boolean
        // TRUE = auditoria marcada, FALSE = não marcada
        auditoriaUsuario: auditoriaMarcada,
      } as any); // Type assertion necessário devido à inferência do Zod com discriminated union
      
      // Toast informativo específico por tipo de análise
      const tipoTexto = tipoAnalise === "SAQUE" ? "SAQUE" : "DEPÓSITO";
      
      toast.success(
        `✅ Análise de ${tipoTexto} registrada com sucesso!\n` +
        `Cliente: ${idClienteTrimmed}\n` +
        `Tempo: ${Math.floor(timer.segundos / 60)}m ${timer.segundos % 60}s`,
        { duration: 5000 }
      );
      
      // Resetar cronômetro após sucesso
      timer.resetar();
      
      // Marcar que a análise foi criada
      setAnaliseJaCriada(true);

      if (auditoriaMarcada) {
        await registrarAuditoriaMutation.mutateAsync({
          idCliente: idClienteTrimmed,
          motivo: auditoriaMotivo.trim(),
          tipo: auditoriaTipo as TipoAuditoria,
        });
        toast.success(
          `✅ Auditoria registrada para cliente ${idClienteTrimmed}\n` +
          `Tipo: ${auditoriaTipo}`,
          { duration: 4000 }
        );
      }

      if (fraudeMarcada) {
        if (!fraudeDescricao.trim() || fraudeDescricao.trim().length < 10) {
          toast.error("Descrição detalhada da fraude é obrigatória (mínimo 10 caracteres)");
          return;
        }
        await reportarFraudeMutation.mutateAsync({
          idCliente: idClienteTrimmed,
          dataAnalise: dataAnalise,
          descricaoDetalhada: fraudeDescricao.trim(),
          motivoPadrao: "FRAUDE_REPORTADA",
          motivoLivre: undefined,
        });
        toast.success(
          `✅ Fraude reportada para cliente ${idClienteTrimmed}`,
          { duration: 4000 }
        );
      }

      await finalizarMutation.mutateAsync({
        idCliente: idClienteTrimmed,
        dataAnalise,
      });
      
      // Limpar campos após finalizar com sucesso
      setIdClienteInput("");
      setIdCliente("");
      limparCamposFormulario();
      setDataAnalise(getDataHojeBrasilia());
      setFraudeMarcada(false);
      setFraudeDescricao("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportarFraude = () => {
    if (!idClienteInput.trim()) {
      toast.error("Informe o ID do cliente antes de reportar fraude");
      return;
    }
    setFraudeErro("");
    setFraudeDescricao("");
    setFraudeModalAberto(true);
  };

  const handleToggleFraude = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      handleReportarFraude();
    } else {
      handleCancelarFraude();
    }
  };

  const handleConfirmarFraude = () => {
    const descricaoTrimmed = fraudeDescricao.trim();

    if (!descricaoTrimmed || descricaoTrimmed.length < 10) {
      setFraudeErro("Descrição detalhada é obrigatória (mínimo 10 caracteres)");
      return;
    }

    setFraudeMarcada(true);
    setFraudeErro("");
    setFraudeModalAberto(false);
    toast.success("Fraude marcada para esta análise");
  };

  const handleCancelarFraude = () => {
    setFraudeMarcada(false);
    setFraudeModalAberto(false);
    setFraudeDescricao("");
    setFraudeErro("");
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
        <PageHeader
          title="Nova Análise"
          backUrl="/"
        />

        {isDuplicado && verificacaoHoje?.analise && (
          <DuplicadoAlert
            idCliente={idCliente}
            dataAnalise={dataAnalise}
            tipoAnalise={tipoAnalise}
          />
        )}

        {clienteComFraude && idCliente && fraudeStatus?.fraudes && fraudeStatus.fraudes.length > 0 && (
          <FraudeAlert
            idCliente={idCliente}
            ultimaFraude={fraudeStatus.fraudes[0] || null}
          />
        )}

        <TimerCard segundos={timer.segundos} ativo={timer.ativo && !isDuplicado} />

        <Card className="glass-card p-8">
          <div className="space-y-6">
            <TipoAnaliseSelector 
              tipo={tipoAnalise} 
              onChange={(novoTipo) => {
                setTipoAnalise(novoTipo);
                // Resetar estado de duplicado ao mudar tipo para revalidar
                setIsDuplicado(false);
                // Revalidar duplicidade quando tipo mudar (se ID e data estiverem preenchidos)
                if (idCliente && dataAnalise) {
                  setTimeout(() => refetchVerificacao(), 100);
                }
              }} 
            />

            {/* Campos Comuns */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Informações do Cliente</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="idCliente" className="text-foreground">
                      ID do Cliente *
                    </Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isDuplicado && verificacaoHoje?.analise && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/30">
                          <AlertCircle size={14} className="text-destructive" />
                          Já analisado hoje
                        </span>
                      )}
                      {(clienteAuditorado || auditoriaMarcada) && (
                        <Badge variant="outline" className="border-amber-500 text-amber-200 bg-amber-500/20 flex items-center gap-1 text-[11px] font-semibold px-2 py-1">
                          <span className="text-lg leading-none">⚠️</span>
                          Auditorado
                        </Badge>
                      )}
                      {clienteComFraude && (
                        <Badge variant="outline" className="border-red-500 text-red-200 bg-red-500/20 flex items-center gap-1 text-[11px] font-semibold px-2 py-1">
                          <AlertCircle size={14} className="text-red-400" />
                          Fraude Reportada
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Input
                    id="idCliente"
                    value={idClienteInput}
                    onChange={(e) => {
                      setIdClienteInput(e.target.value);
                      // Resetar estado de duplicado ao mudar ID para revalidar
                      setIsDuplicado(false);
                      // Limpar campos quando o ID for apagado
                      if (e.target.value.length === 0) {
                        setIdCliente("");
                      }
                    }}
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
                    placeholder="Usuário"
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
                    onChange={(e) => {
                      setDataAnalise(e.target.value);
                      // Resetar estado de duplicado ao mudar data para revalidar
                      setIsDuplicado(false);
                      // Revalidar duplicidade quando data mudar (se ID estiver preenchido)
                      if (idCliente && e.target.value) {
                        setTimeout(() => refetchVerificacao(), 100);
                      }
                    }}
                    className="mt-2 bg-input border-border text-foreground"
                    disabled={!idCliente || isDuplicado}
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
                  <MultiSelect
                    options={METRICAS_SAQUE}
                    selected={metricasSaque}
                    onChange={setMetricasSaque}
                    label="Métricas *"
                    placeholder="Selecione uma ou mais métricas..."
                    disabled={camposDesabilitados}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <MultiSelect
                      options={CATEGORIAS}
                      selected={categoriasSaque}
                      onChange={setCategoriasSaque}
                      label="Categorias *"
                      placeholder="Selecione uma ou mais categorias..."
                      disabled={camposDesabilitados}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jogoEsporteSaque" className="text-foreground">
                      Jogo/Esporte
                    </Label>
                    <Input
                      id="jogoEsporteSaque"
                      value={jogoEsporteSaque}
                      onChange={(e) => setJogoEsporteSaque(e.target.value)}
                      placeholder="Ex: Futebol, Aviator"
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
                    <MultiSelect
                      options={CATEGORIAS}
                      selected={categoriasDeposito}
                      onChange={setCategoriasDeposito}
                      label="Categorias *"
                      placeholder="Selecione uma ou mais categorias..."
                      disabled={camposDesabilitados}
                    />
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
                Observação <span className="text-muted-foreground text-xs">(opcional, máx. 1000 caracteres)</span>
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

            {/* Auditoria e Fraude */}
            <div className="border-t border-border pt-6 space-y-6">
              {/* Seção de Auditoria */}
              <div className="space-y-4 border border-amber-500/20 rounded-lg p-5 bg-amber-500/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="auditoriaFlag"
                      checked={auditoriaMarcada}
                      onCheckedChange={handleToggleAuditoria}
                      disabled={camposDesabilitados}
                      className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                    <div>
                      <Label htmlFor="auditoriaFlag" className="text-foreground font-semibold cursor-pointer text-base">
                        Auditoria Detalhada
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Defina motivo e tipo de auditoria antes de finalizar a análise.
                      </p>
                    </div>
                  </div>
                  {auditoriaMarcada && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={abrirModalAuditoria} className="border-amber-500/30 hover:bg-amber-500/10">
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleCancelarAuditoria}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                {auditoriaMarcada && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-200 flex items-center gap-2">
                        <Shield size={16} />
                        Auditoria marcada nesta análise
                      </span>
                      <span className="text-xs uppercase tracking-wide text-amber-300 font-semibold px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30">
                        {auditoriaTipo}
                      </span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-line mt-2">{auditoriaMotivo}</p>
                  </div>
                )}

                {!auditoriaMarcada && ultimaAuditoria && (
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm space-y-1 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary flex items-center gap-2">
                        <Shield size={16} />
                        Auditoria existente para este cliente
                      </span>
                      <span className="text-xs uppercase tracking-wide text-primary font-semibold px-2 py-1 rounded bg-primary/20 border border-primary/30">
                        {ultimaAuditoria.tipo}
                      </span>
                    </div>
                    <p className="text-foreground/90 mt-2">{ultimaAuditoria.motivo}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Registrada em{" "}
                      {ultimaAuditoria.criadoEm
                        ? formatarDataHora(ultimaAuditoria.criadoEm)
                        : "-"}{" "}
                      por {ultimaAuditoria.nomeAnalista ?? "—"}
                    </p>
                  </div>
                )}
              </div>

              {/* Seção de Fraude */}
              <div className="space-y-4 border border-red-500/20 rounded-lg p-5 bg-red-500/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="fraudeFlag"
                      checked={fraudeMarcada}
                      onCheckedChange={handleToggleFraude}
                      disabled={camposDesabilitados}
                      className="border-red-500/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                    />
                    <div>
                      <Label htmlFor="fraudeFlag" className="text-foreground font-semibold cursor-pointer text-base">
                        Reportar como Fraude
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Marque esta opção se identificar suspeita de fraude nesta análise.
                      </p>
                    </div>
                  </div>
                  {fraudeMarcada && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleReportarFraude} className="border-red-500/30 hover:bg-red-500/10">
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelarFraude}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                {fraudeMarcada && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-200 flex items-center gap-2">
                        <AlertCircle size={16} />
                        Fraude marcada nesta análise
                      </span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-line mt-2">{fraudeDescricao}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
              <Button
                onClick={handleFinalizar}
                disabled={isDuplicado || isLoading || !idClienteInput.trim()}
                className="flex-1 btn-primary"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 text-white" size={16} />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 text-white" size={16} />
                    Finalizar Análise (Aprovado)
                  </>
                )}
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
                onValueChange={(value) => {
                  setAuditoriaErro("");
                  setAuditoriaTipo(value as TipoAuditoria);
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
                <AlertCircle size={16} className="text-white" />
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

      {/* Modal de Reporte de Fraude */}
      <Dialog open={fraudeModalAberto} onOpenChange={(open) => {
        if (!open) {
          handleCancelarFraude();
        } else {
          setFraudeModalAberto(true);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle size={20} />
              Reportar Fraude
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para marcar esta análise como fraude. A fraude será registrada quando você finalizar a análise.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {dataAnalise && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="text-foreground/90">
                  <strong>Data da análise:</strong> {formatarData(dataAnalise)}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="fraudeDescricao" className="text-sm font-medium text-foreground">
                Descrição Detalhada da Suspeita *
              </Label>
              <Textarea
                id="fraudeDescricao"
                value={fraudeDescricao}
                onChange={(e) => {
                  setFraudeErro("");
                  setFraudeDescricao(e.target.value);
                }}
                placeholder="Descreva detalhadamente:&#10;- A suspeita identificada&#10;- Motivo do reporte&#10;- Evidências observadas&#10;- Qualquer informação relevante"
                className="mt-2 min-h-[200px]"
                rows={8}
                disabled={isLoading}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Mínimo 10 caracteres. Inclua descrição detalhada, motivo e evidências.
                </p>
                <p className={`text-xs ${fraudeDescricao.length < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                  {fraudeDescricao.length}/10
                </p>
              </div>
            </div>

            {fraudeErro && (
              <div className="text-sm text-destructive flex items-center gap-2 bg-destructive/10 p-3 rounded-md border border-destructive/20">
                <AlertCircle size={16} />
                {fraudeErro}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelarFraude}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarFraude} 
              variant="destructive"
              disabled={!fraudeDescricao.trim() || fraudeDescricao.trim().length < 10}
              className="bg-destructive hover:bg-destructive/90"
            >
              <AlertCircle className="mr-2" size={16} />
              Confirmar fraude
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

