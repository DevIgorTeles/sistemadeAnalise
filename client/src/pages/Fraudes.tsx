import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function Fraudes() {
  const { user } = useAuth();
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: fraudes, isLoading } = trpc.fraudes.listar.useQuery({
    limit,
    offset,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Fraudes Reportadas</h1>
            <p className="text-muted-foreground mt-1">Acompanhe todos os casos de fraude</p>
          </div>
          <Link href="/">
            <Button variant="outline">← Voltar</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : fraudes && fraudes.length > 0 ? (
          <div className="space-y-4">
            {fraudes.map((fraude) => (
              <Card key={fraude.id} className="glass-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="text-destructive" size={20} />
                      <h3 className="text-lg font-semibold text-foreground">
                        Cliente: {fraude.idCliente}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Motivo:</span>
                        <p className="text-foreground font-medium">{fraude.motivoPadrao}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data:</span>
                        <p className="text-foreground font-medium">
                          {new Date(fraude.dataRegistro).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    {fraude.motivoLivre && (
                      <div className="mt-4">
                        <span className="text-muted-foreground text-sm">Observação:</span>
                        <p className="text-foreground text-sm mt-1">{fraude.motivoLivre}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card p-12 text-center">
            <AlertCircle className="mx-auto text-muted-foreground mb-4" size={40} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma fraude reportada
            </h3>
            <p className="text-muted-foreground">
              Quando fraudes forem reportadas, elas aparecerão aqui
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

