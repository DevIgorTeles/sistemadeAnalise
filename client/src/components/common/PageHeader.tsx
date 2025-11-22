import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  backUrl?: string;
  backLabel?: string;
}

/**
 * Componente reutilizável para cabeçalhos de página
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
  backUrl,
  backLabel = "← Voltar",
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
          {Icon && <Icon className="text-white" size={28} />}
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {backUrl && (
          <Link href={backUrl}>
            <Button variant="outline">{backLabel}</Button>
          </Link>
        )}
        {action}
      </div>
    </div>
  );
}

