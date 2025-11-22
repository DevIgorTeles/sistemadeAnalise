import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { formatarDataHora } from "@/utils/formatters";

interface FraudeAlertProps {
  idCliente: string;
  ultimaFraude?: {
    dataRegistro?: Date | string | null;
    descricaoDetalhada?: string | null;
    analistaNome?: string | null;
  } | null;
}

/**
 * Componente para alerta visual de fraude reportada
 * Aparece automaticamente quando um usuário já possui reporte de fraude
 */
export function FraudeAlert({
  idCliente,
  ultimaFraude,
}: FraudeAlertProps) {
  return (
    <Card className="glass-card p-5 mb-6 border-red-500/50 bg-red-500/10 animate-fade-in">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="p-2 rounded-lg bg-red-500/20">
            <AlertCircle className="text-red-400" size={24} />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-red-400 text-lg mb-2 flex items-center gap-2">
            🚨 Usuário com Fraude Reportada
          </h3>
          <p className="text-sm text-red-300/90 mb-2">
            <strong>ATENÇÃO:</strong> Este usuário (<strong>{idCliente}</strong>) já possui um reporte de fraude registrado no sistema.
          </p>
          {ultimaFraude?.dataRegistro && (
            <p className="text-sm text-red-300/80 mb-2">
              <strong>Último reporte:</strong> {formatarDataHora(ultimaFraude.dataRegistro)}
              {ultimaFraude.analistaNome && ` por ${ultimaFraude.analistaNome}`}
            </p>
          )}
          {ultimaFraude?.descricaoDetalhada && (
            <details className="mt-3">
              <summary className="text-sm text-red-300/80 cursor-pointer hover:text-red-300">
                Ver detalhes do reporte
              </summary>
              <div className="mt-2 p-3 bg-red-500/5 border border-red-500/20 rounded-md">
                <p className="text-xs text-red-200/90 whitespace-pre-line">
                  {ultimaFraude.descricaoDetalhada}
                </p>
              </div>
            </details>
          )}
          <p className="text-xs text-red-300/70 mt-3 italic">
            ⚠️ Este alerta aparece automaticamente para qualquer analista que acesse este usuário.
          </p>
        </div>
      </div>
    </Card>
  );
}

