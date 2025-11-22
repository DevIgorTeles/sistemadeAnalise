import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { formatarDataHora } from "@/utils/formatters";

export default function Auditorias() {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const { data: auditorias, isLoading } = trpc.auditorias.listar.useQuery({}, {
    enabled: Boolean(user),
  });

  if (loading || !user) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] py-8">
      <div className="container">
        <PageHeader
          title="Auditorias Registradas"
          description="Visualize todas as auditorias registradas pela equipe e revise os detalhes."
          icon={ShieldAlert}
          backUrl="/"
        />

        {isLoading ? (
          <LoadingState className="min-h-[400px]" size={40} />
        ) : auditorias && auditorias.length > 0 ? (
          <div className="space-y-4">
            {auditorias.map((auditoria) => (
              <Card key={auditoria.id} className="glass-card p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldAlert className="text-amber-400" size={20} />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Cliente: {auditoria.idCliente}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatarDataHora(auditoria.criadoEm)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "uppercase tracking-wide",
                      auditoria.tipo === "ESPORTIVO"
                        ? "border-blue-500/40 text-blue-200 bg-blue-500/10"
                        : "border-purple-500/40 text-purple-200 bg-purple-500/10"
                    )}
                  >
                    {auditoria.tipo}
                  </Badge>
                </div>

                {auditoria.nomeCliente && (
                  <div className="mb-3 text-sm text-muted-foreground">
                    Nome do usuário: <span className="text-foreground font-medium">{auditoria.nomeCliente}</span>
                  </div>
                )}

                <div className="space-y-2 text-sm text-foreground">
                  <span className="text-muted-foreground">Motivo:</span>
                  <p className="whitespace-pre-line">{auditoria.motivo}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={18} />
                  <span>
                    Analista responsável:{" "}
                    <span className="text-foreground font-medium">
                      {auditoria.nomeAnalista ?? `ID ${auditoria.analistaId}`}
                    </span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma auditoria registrada"
            description="Assim que auditorias forem marcadas nas análises, elas aparecerão aqui."
          />
        )}
      </div>
    </div>
  );
}


