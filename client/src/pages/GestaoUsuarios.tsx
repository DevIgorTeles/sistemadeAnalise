import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Shield, User, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function GestaoUsuarios() {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [, navigate] = useLocation();
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoRole, setNovoRole] = useState<"analista" | "admin">("analista");
  const [novaSenha, setNovaSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const criarUsuarioMutation = trpc.usuarios.criar.useMutation();
  const {
    data: usuarios = [],
    isLoading: carregandoUsuarios,
    refetch,
  } = trpc.usuarios.listar.useQuery(undefined, {
    enabled: Boolean(user && user.role === "admin"),
  });

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

  const handleCriarUsuario = async () => {
    if (!novoEmail || !novoNome || !novaSenha) {
      toast.error("Preencha email e nome");
      return;
    }

    setIsLoading(true);
    try {
      await criarUsuarioMutation.mutateAsync({
        email: novoEmail,
        nome: novoNome,
        role: novoRole,
        password: novaSenha,
      });

      toast.success("Usuário criado com sucesso");
      setNovoEmail("");
      setNovoNome("");
      setNovoRole("analista");
      setNovaSenha("");
      refetch();
    } catch (error: any) {
      console.error("Erro criando usuário:", error);
      toast.error("Erro ao criar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] py-8">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-1">Crie e gerencie contas de acesso</p>
          </div>
          <Link href="/">
            <Button variant="outline">← Voltar</Button>
          </Link>
        </div>

        {/* Criar Novo Usuário */}
        <Card className="glass-card p-8 mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <Plus className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Criar Novo Usuário</h2>
              <p className="text-sm text-muted-foreground">Adicione um novo usuário ao sistema</p>
            </div>
          </div>
          
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleCriarUsuario(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="novoNome" className="text-sm font-medium text-foreground">
                  Nome Completo *
                </Label>
                <Input
                  id="novoNome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="João Silva"
                  className="px-4 py-3"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novoEmail" className="text-sm font-medium text-foreground">
                  E-mail *
                </Label>
                <Input
                  id="novoEmail"
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="joao@exemplo.com"
                  className="px-4 py-3"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="novaSenha" className="text-sm font-medium text-foreground">
                  Senha *
                </Label>
                <Input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="px-4 py-3"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novoRole" className="text-sm font-medium text-foreground">
                  Perfil de Acesso
                </Label>
                <select
                  id="novoRole"
                  value={novoRole}
                  onChange={(e) => setNovoRole(e.target.value as "analista" | "admin")}
                  className="w-full px-4 py-3 rounded-lg"
                  disabled={isLoading}
                >
                  <option value="analista">Analista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !novoNome || !novoEmail || !novaSenha}
              className="btn-primary w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Criando...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Criar Usuário
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Lista de Usuários */}
        <Card className="glass-card p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-secondary/20">
                <Users className="text-accent" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Usuários Ativos</h2>
                <p className="text-sm text-muted-foreground">{usuarios.length} registros</p>
              </div>
            </div>
            {carregandoUsuarios && <Loader2 className="animate-spin text-primary" size={20} />}
          </div>
          
          {carregandoUsuarios ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto text-primary mb-4" size={32} />
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/20 mb-4">
                <User className="text-muted-foreground" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">Comece criando seu primeiro usuário acima</p>
            </div>
          ) : (
            <div className="space-y-2">
              {usuarios.map((usr, idx) => (
                <div 
                  key={usr.id} 
                  className="p-4 rounded-lg border border-border/50 bg-background/30 hover:border-primary/50 hover:bg-background/50 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center ring-2 ring-primary/20">
                          {usr.role === "admin" ? (
                            <Shield size={20} className="text-foreground" />
                          ) : (
                            <User size={20} className="text-foreground" />
                          )}
                        </div>
                        {usr.ativo && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{usr.name}</p>
                        <p className="text-sm text-muted-foreground">{usr.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        usr.role === "admin" 
                          ? "bg-destructive/10 text-destructive border border-destructive/20" 
                          : "bg-accent/10 text-accent border border-accent/20"
                      }`}>
                        {usr.role === "admin" ? "Administrador" : "Analista"}
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        usr.ativo 
                          ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {usr.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

