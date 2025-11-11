import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { AlertCircle, Loader2, ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Auditorias() {
  const { data: auditorias, isLoading } = trpc.auditorias.listar.useQuery(undefined);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
              <ShieldAlert className="text-amber-400" size={28} />
              Auditorias Registradas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize todas as análises marcadas para auditoria e revise os detalhes registrados.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">← Voltar</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
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
                        {new Date(auditoria.criadoEm as string | number | Date).toLocaleString("pt-BR")}
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
          <Card className="glass-card p-12 text-center">
            <AlertCircle className="mx-auto text-muted-foreground mb-4" size={40} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma auditoria registrada
            </h3>
            <p className="text-muted-foreground">
              Assim que auditorias forem marcadas nas análises, elas aparecerão aqui.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}


