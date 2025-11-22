import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface DuplicadoAlertProps {
  idCliente: string;
  dataAnalise: string;
  tipoAnalise: "SAQUE" | "DEPOSITO";
}

/**
 * Componente para alerta de análise duplicada
 */
export function DuplicadoAlert({
  idCliente,
  dataAnalise,
  tipoAnalise,
}: DuplicadoAlertProps) {

  return (
    <Card className="glass-card p-5 mb-6 border-destructive/50 bg-destructive/10 animate-fade-in">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="p-2 rounded-lg bg-destructive/20">
            <AlertCircle className="text-white" size={24} />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-destructive text-lg mb-2">
            ⚠️ Análise Duplicada - Bloqueada
          </h3>
          <p className="text-sm text-destructive/90 mb-2">
            Este usuário já foi analisado na data de hoje.
          </p>
          <p className="text-sm text-destructive/80 mb-2">
            Não é possível criar uma nova análise do mesmo tipo para o mesmo cliente na mesma data.
          </p>
          <p className="text-xs text-destructive/70 mt-2 italic">
            💡 Você pode criar uma análise do outro tipo (se for SAQUE, pode criar DEPÓSITO e vice-versa) no mesmo dia.
          </p>
        </div>
      </div>
    </Card>
  );
}

