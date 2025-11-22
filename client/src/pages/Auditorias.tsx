import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ShieldAlert, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { formatarData } from "@/utils/formatters";

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
          description="Visualize todas as auditorias registradas pela equipe"
          icon={ShieldAlert}
          backUrl="/"
        />

        {isLoading ? (
          <LoadingState className="min-h-[400px]" size={40} />
        ) : auditorias && auditorias.length > 0 ? (
          <div className="space-y-4">
            {auditorias.map((auditoria) => (
              <Card key={auditoria.id} className="glass-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldAlert className="text-amber-400" size={20} />
                      <h3 className="text-lg font-semibold text-foreground">
                        Cliente: {auditoria.idCliente}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">Data do Registro:</span>
                        <p className="text-foreground font-medium">
                          {formatarData(auditoria.criadoEm)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Tipo de Auditoria:</span>
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
                      <div>
                        <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                          <User size={14} />
                          Analista Responsável:
                        </span>
                        <p className="text-foreground font-medium">
                          {auditoria.nomeAnalista || `ID: ${auditoria.analistaId || "—"}`}
                        </p>
                      </div>
                    </div>

                    {auditoria.nomeCliente && (
                      <div className="mb-4">
                        <span className="text-muted-foreground text-sm font-medium block mb-1">
                          Nome do Cliente:
                        </span>
                        <p className="text-foreground font-medium">
                          {auditoria.nomeCliente}
                        </p>
                      </div>
                    )}

                    {auditoria.motivo && (
                      <div className="mt-4">
                        <span className="text-muted-foreground text-sm font-medium block mb-2">
                          Motivo da Auditoria:
                        </span>
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-4">
                          <p className="text-foreground text-sm whitespace-pre-line leading-relaxed">
                            {auditoria.motivo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma auditoria registrada"
            description="Quando auditorias forem registradas, elas aparecerão aqui"
          />
        )}
      </div>
    </div>
  );
}


