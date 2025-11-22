import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecione as opções...",
  label,
  disabled = false,
  maxSelections,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Fechar ao pressionar Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  const handleToggle = (option: string) => {
    if (disabled) return;

    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return;
      }
      onChange([...selected, option]);
    }
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1 block">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={cn(
            "w-full min-h-[42px] px-3 py-2 text-left rounded-md",
            "flex items-center justify-between gap-2",
            "text-foreground transition-all duration-200",
            // Fundo opaco e visível
            "bg-background border-2 border-border",
            // Estados de hover e focus melhorados
            !disabled && [
              "hover:border-primary/60 hover:bg-background/95",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "active:bg-background/90",
            ],
            // Estado aberto
            isOpen && "border-primary ring-2 ring-primary/30 bg-background shadow-md",
            // Estado desabilitado
            disabled && "opacity-50 cursor-not-allowed bg-muted/50",
            !disabled && "cursor-pointer"
          )}
        >
          <div className="flex-1 flex flex-wrap gap-2 min-h-[26px]">
            {selected.length === 0 ? (
              <span className="text-muted-foreground text-sm py-1">
                {placeholder}
              </span>
            ) : (
              <>
                {selected.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="bg-primary/25 text-primary border border-primary/40 hover:bg-primary/35 hover:border-primary/60 flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-all duration-150 shadow-sm"
                  >
                    <span className="max-w-[200px] truncate font-medium">{item}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(item, e)}
                      className="ml-1.5 hover:bg-primary/30 active:bg-primary/40 rounded-full p-0.5 transition-all duration-150 flex items-center justify-center"
                      disabled={disabled}
                      aria-label={`Remover ${item}`}
                    >
                      <X size={12} className="text-white font-bold" />
                    </button>
                  </Badge>
                ))}
                {selected.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-all duration-150 px-2 py-1 rounded-md font-medium"
                    disabled={disabled}
                    aria-label="Limpar todas as seleções"
                  >
                    Limpar tudo
                  </button>
                )}
              </>
            )}
          </div>
          {!disabled && (
            <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
              {selected.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-full font-semibold shadow-sm">
                  {selected.length}
                </span>
              )}
              <div className={cn(
                "transition-transform duration-200",
                isOpen && "rotate-180"
              )}>
                <ChevronDown size={18} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1.5 bg-background border-2 border-primary/30 rounded-md shadow-xl max-h-[300px] overflow-auto transition-all duration-200 opacity-100">
            <div className="p-2 space-y-0.5">
              {options.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground text-center bg-muted/30 rounded-md">
                  Nenhuma opção disponível
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = selected.includes(option);
                  return (
                    <label
                      key={option}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150",
                        "hover:bg-primary/15 hover:border-l-2 hover:border-l-primary",
                        "focus-within:bg-primary/15 focus-within:border-l-2 focus-within:border-l-primary",
                        isSelected && [
                          "bg-primary/10 border-l-2 border-l-primary",
                          "font-medium"
                        ],
                        "active:bg-primary/20"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(option)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                      />
                      <span className={cn(
                        "text-sm flex-1",
                        isSelected ? "text-foreground font-medium" : "text-foreground/90"
                      )}>
                        {option}
                      </span>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary shadow-sm flex-shrink-0" />
                      )}
                    </label>
                  );
                })
              )}
            </div>
            {maxSelections && (
              <div className="px-3 py-2.5 border-t-2 border-border bg-muted/40">
                <p className="text-xs text-muted-foreground text-center font-medium">
                  {selected.length}/{maxSelections} selecionados
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1.5 px-1">
          <span className="font-medium text-foreground/80">
            {selected.length}
          </span>{" "}
          {selected.length === 1 ? "opção selecionada" : "opções selecionadas"}
        </div>
      )}
    </div>
  );
}

