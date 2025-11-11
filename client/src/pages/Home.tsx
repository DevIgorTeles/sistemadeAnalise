import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Loader2, Plus, AlertCircle, BarChart3 } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2">OPA</h1>
            <p className="text-muted-foreground">Operação de Prevenção e Análise</p>
          </div>
          
          <div className="glass-card p-8 mb-6">
            <p className="text-foreground mb-6">
              Sistema inteligente para análise de saques e depósitos com detecção automática de fraudes.
            </p>
            <a href={getLoginUrl()}>
              <Button className="w-full btn-primary">Fazer Login</Button>
            </a>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Tema Dark Glass • Análise em tempo real • Auditoria completa</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28]">
      {/* Header */}
      <header className="border-b border-border glass-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-gradient">{APP_TITLE}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="glass-card p-8 mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, {user?.name}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "admin" 
              ? "Painel de administração • Gerencie usuários, importe dados e acompanhe relatórios"
              : "Analise clientes e registre decisões de fraude com segurança"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/analise/nova">
            <Card className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <Plus className="text-primary mb-4" size={32} />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nova Análise</h3>
              <p className="text-muted-foreground">Registre uma nova análise de cliente</p>
            </Card>
          </Link>

          <Link href="/fraudes">
            <Card className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <AlertCircle className="text-destructive mb-4" size={32} />
              <h3 className="text-lg font-semibold text-foreground mb-2">Fraudes</h3>
              <p className="text-sm text-muted-foreground">
                Visualize casos de fraude reportados
              </p>
            </Card>
          </Link>

          {user?.role === "admin" && (
            <>
              <Link href="/admin/importar-csv">
                <Card className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <BarChart3 className="text-accent mb-4" size={32} />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Importar CSV</h3>
                  <p className="text-sm text-muted-foreground">
                    Carregue dados em lote
                  </p>
                </Card>
              </Link>

              <Link href="/admin/usuarios">
                <Card className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <BarChart3 className="text-secondary mb-4" size={32} />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Usuários</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie contas de acesso
                  </p>
                </Card>
              </Link>

              <Link href="/admin/relatorios">
                <Card className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <BarChart3 className="text-chart-4 mb-4" size={32} />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Relatórios</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe métricas e produtividade
                  </p>
                </Card>
              </Link>
            </>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Análises Hoje</div>
            <div className="text-3xl font-bold text-primary">—</div>
          </Card>
          <Card className="glass-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Fraudes Reportadas</div>
            <div className="text-3xl font-bold text-destructive">—</div>
          </Card>
          <Card className="glass-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Taxa de Aprovação</div>
            <div className="text-3xl font-bold text-chart-4">—</div>
          </Card>
        </div>
      </main>
    </div>
  );
}

