import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  size?: number;
  message?: string;
}

/**
 * Componente reutilizável para estados de carregamento
 */
export function LoadingState({ className, size = 32, message }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] flex items-center justify-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary" size={size} />
        {message && <p className="text-muted-foreground text-sm">{message}</p>}
      </div>
    </div>
  );
}

