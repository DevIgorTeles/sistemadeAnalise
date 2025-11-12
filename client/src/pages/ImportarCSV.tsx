import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function ImportarCSV() {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [, navigate] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Por favor, selecione um arquivo CSV");
        return;
      }
      setFile(selectedFile);
      setUploadStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implementar upload de CSV via tRPC
      // const formData = new FormData();
      // formData.append("file", file);
      // await trpc.import.csv.mutateAsync(formData);
      
      toast.success("Importação iniciada");
      setUploadStatus("success");
      setFile(null);
    } catch (error) {
      toast.error("Erro ao importar arquivo");
      setUploadStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] py-8">
      <div className="container max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Importar CSV</h1>
            <p className="text-muted-foreground mt-1">Carregue dados em lote para o sistema</p>
          </div>
          <Link href="/">
            <Button variant="outline">← Voltar</Button>
          </Link>
        </div>

        <Card className="glass-card p-8">
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="mx-auto text-muted-foreground mb-4" size={40} />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Arraste o arquivo ou clique para selecionar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Apenas arquivos .csv são aceitos
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>

            {/* Selected File */}
            {file && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus === "success" && (
              <div className="p-4 bg-chart-4/10 border border-chart-4/20 rounded-lg flex items-center gap-3">
                <CheckCircle className="text-chart-4" size={20} />
                <div>
                  <p className="font-semibold text-chart-4">Importação realizada</p>
                  <p className="text-sm text-chart-4/80">Dados foram processados com sucesso</p>
                </div>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
                <AlertCircle className="text-destructive" size={20} />
                <div>
                  <p className="font-semibold text-destructive">Erro na importação</p>
                  <p className="text-sm text-destructive/80">Verifique o arquivo e tente novamente</p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-muted/10 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Formato esperado:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Colunas: id_cliente, data_analise, valor_deposito, valor_saque, qtd_apostas, retorno_apostas, observacao</li>
                <li>• Primeira linha deve conter os cabeçalhos</li>
                <li>• Datas no formato YYYY-MM-DD</li>
                <li>• Valores numéricos com ponto como separador decimal</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleUpload}
                disabled={!file || isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                {isLoading ? "Importando..." : "Importar Arquivo"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFile(null)}
                disabled={!file || isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

