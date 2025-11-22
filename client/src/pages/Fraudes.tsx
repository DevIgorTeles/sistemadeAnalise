import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { AlertCircle, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { formatarData, formatarDataHora } from "@/utils/formatters";

export default function Fraudes() {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: fraudes, isLoading } = trpc.fraudes.listar.useQuery(
    { limit, offset },
    { enabled: Boolean(user) }
  );

  if (loading || !user) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] py-8">
      <div className="container">
        <PageHeader
          title="Fraudes Reportadas"
          description="Visualize todos os casos de fraude reportados pela equipe"
          icon={AlertCircle}
          backUrl="/"
        />

        {isLoading ? (
          <LoadingState className="min-h-[400px]" size={40} />
        ) : fraudes && fraudes.length > 0 ? (
          <div className="space-y-4">
            {fraudes.map((fraude) => (
              <Card key={fraude.id} className="glass-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="text-destructive" size={20} />
                      <h3 className="text-lg font-semibold text-foreground">
                        Cliente: {fraude.idCliente}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">Data do Registro:</span>
                        <p className="text-foreground font-medium">
                          {formatarData(fraude.dataRegistro)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Data da Análise:</span>
                        <p className="text-foreground font-medium">
                          {fraude.dataAnalise ? formatarData(fraude.dataAnalise) : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                          <User size={14} />
                          Analista Responsável:
                        </span>
                        <p className="text-foreground font-medium">
                          {fraude.analistaNome || `ID: ${fraude.analistaId || "—"}`}
                        </p>
                      </div>
                    </div>

                    {fraude.descricaoDetalhada && (
                      <div className="mt-4">
                        <span className="text-muted-foreground text-sm font-medium block mb-2">
                          Descrição Detalhada da Suspeita:
                        </span>
                        <div className="bg-destructive/5 border border-destructive/20 rounded-md p-4">
                          <p className="text-foreground text-sm whitespace-pre-line leading-relaxed">
                            {fraude.descricaoDetalhada}
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
            title="Nenhuma fraude reportada"
            description="Quando fraudes forem reportadas, elas aparecerão aqui"
          />
        )}
      </div>
    </div>
  );
}

