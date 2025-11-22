import { TipoAnalise } from "@/constants/analise";

interface TipoAnaliseSelectorProps {
  tipo: TipoAnalise;
  onChange: (tipo: TipoAnalise) => void;
}

/**
 * Componente para seleção do tipo de análise (SAQUE ou DEPOSITO)
 */
export function TipoAnaliseSelector({ tipo, onChange }: TipoAnaliseSelectorProps) {
  return (
    <div>
      <label className="text-foreground mb-4 block text-base font-semibold">
        Tipo de Análise *
      </label>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onChange("SAQUE")}
          className={`p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
            tipo === "SAQUE"
              ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/10"
              : "border-border/50 bg-background/30 hover:border-primary/50 hover:bg-background/50"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div
                className={`font-bold text-lg mb-1 ${
                  tipo === "SAQUE" ? "text-primary" : "text-foreground"
                }`}
              >
                Análise de Saque
              </div>
              <div className="text-sm text-muted-foreground">
                Registre saques do cliente
              </div>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                tipo === "SAQUE"
                  ? "border-primary bg-primary"
                  : "border-border/50 group-hover:border-primary/50"
              }`}
            >
              {tipo === "SAQUE" && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange("DEPOSITO")}
          className={`p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
            tipo === "DEPOSITO"
              ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/10"
              : "border-border/50 bg-background/30 hover:border-primary/50 hover:bg-background/50"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div
                className={`font-bold text-lg mb-1 ${
                  tipo === "DEPOSITO" ? "text-primary" : "text-foreground"
                }`}
              >
                Análise de Depósito
              </div>
              <div className="text-sm text-muted-foreground">
                Registre depósitos do cliente
              </div>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                tipo === "DEPOSITO"
                  ? "border-primary bg-primary"
                  : "border-border/50 group-hover:border-primary/50"
              }`}
            >
              {tipo === "DEPOSITO" && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

