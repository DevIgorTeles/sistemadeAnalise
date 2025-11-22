import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatarTempo } from "@/utils/formatters";

interface TimerCardProps {
  segundos: number;
  ativo: boolean;
}

/**
 * Componente para exibir o cronômetro de análise
 */
export function TimerCard({ segundos, ativo }: TimerCardProps) {
  if (!ativo) return null;

  return (
    <Card className="glass-card p-6 mb-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/30 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
            <Clock className="text-white" size={28} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Tempo de Análise (Automático)
            </p>
            <p className="text-4xl font-bold text-gradient font-mono tracking-wider">
              {formatarTempo(segundos)}
            </p>
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
  );
}

