import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Logar erro em produção (pode ser enviado para serviço de logging)
    if (process.env.NODE_ENV === "production") {
      // TODO: Enviar para serviço de logging centralizado
      console.error("[ErrorBoundary] Erro capturado:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === "development";
      
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">Ocorreu um erro inesperado</h2>
            
            <p className="text-muted-foreground mb-6 text-center">
              {isDevelopment
                ? "Verifique os detalhes abaixo e o console para mais informações."
                : "Por favor, recarregue a página ou entre em contato com o suporte se o problema persistir."}
            </p>

            {/* Stack trace apenas em desenvolvimento */}
            {isDevelopment && this.state.error?.stack && (
              <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
                <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {/* Mensagem de erro genérica em produção */}
            {!isDevelopment && this.state.error && (
              <div className="p-4 w-full rounded bg-muted mb-6">
                <p className="text-sm text-muted-foreground">
                  {this.state.error.message || "Erro desconhecido"}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
