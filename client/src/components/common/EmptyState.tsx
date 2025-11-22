import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

/**
 * Componente reutilizável para estados vazios
 */
export function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <Card className={`glass-card p-12 text-center ${className || ""}`}>
      <Icon className="mx-auto text-muted-foreground mb-4" size={40} />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

