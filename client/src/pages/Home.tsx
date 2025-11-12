import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Loader2,
  Plus,
  AlertCircle,
  FileSpreadsheet,
  Users as UsersIcon,
  LineChart,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { APP_TITLE } from "@/const";

type AccentKey = "primary" | "warning" | "destructive" | "accent" | "info" | "muted";

const accentMap: Record<AccentKey, { icon: string; bg: string; border: string }> = {
  primary: { icon: "text-sky-300", bg: "bg-sky-500/15", border: "hover:border-sky-400/40" },
  warning: { icon: "text-amber-300", bg: "bg-amber-500/15", border: "hover:border-amber-400/40" },
  destructive: { icon: "text-rose-300", bg: "bg-rose-500/15", border: "hover:border-rose-400/40" },
  accent: { icon: "text-emerald-300", bg: "bg-emerald-500/15", border: "hover:border-emerald-400/40" },
  info: { icon: "text-fuchsia-300", bg: "bg-fuchsia-500/15", border: "hover:border-fuchsia-400/40" },
  muted: { icon: "text-slate-300", bg: "bg-slate-500/15", border: "hover:border-slate-400/40" },
};

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: AccentKey;
  adminOnly?: boolean;
}

export default function Home() {
  const { user, loading, logout } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  const quickActions: QuickAction[] = [
    {
      title: "Nova Análise",
      description: "Registre uma nova análise de cliente",
      href: "/analise/nova",
      icon: Plus,
      accent: "primary" as const,
    },
    {
      title: "Fraudes",
      description: "Visualize casos de fraude reportados",
      href: "/fraudes",
      icon: AlertCircle,
      accent: "destructive" as const,
    },
    {
      title: "Auditorias",
      description: "Revise análises sinalizadas e motivos registrados",
      href: "/auditorias",
      icon: ClipboardList,
      accent: "warning" as const,
    },
    {
      title: "Importar CSV",
      description: "Carregue dados em lote",
      href: "/admin/importar-csv",
      icon: FileSpreadsheet,
      accent: "accent" as const,
      adminOnly: true,
    },
    {
      title: "Usuários",
      description: "Gerencie contas de acesso e permissões",
      href: "/admin/usuarios",
      icon: UsersIcon,
      accent: "info" as const,
      adminOnly: true,
    },
    {
      title: "Relatórios",
      description: "Acompanhe métricas e produtividade da equipe",
      href: "/admin/relatorios",
      icon: LineChart,
      accent: "primary" as const,
      adminOnly: true,
    },
  ].filter(action => (action.adminOnly ? isAdmin : true));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28]">
      <header className="border-b border-border/60 glass-blur sticky top-0 z-50 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-gradient">{APP_TITLE}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-foreground font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {isAdmin ? "Administrador" : "Analista"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-10">
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <Card className="glass-card p-8 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/20 border border-slate-700/40 shadow-lg shadow-slate-900/20">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 text-xs font-medium mb-4">
                  <ShieldAlert className="h-4 w-4" />
                  OPA • Operação de Prevenção e Análise
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
                  Bem-vindo de volta, {user?.name?.split(" ")[0] ?? "Analista"}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                  {isAdmin
                    ? "Gerencie usuários, mantenha os dados sincronizados e acompanhe a produtividade da equipe em um único painel."
                    : "Monitore clientes, registre análises e mantenha o pipeline de auditoria atualizado com poucos cliques."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/analise/nova">
                  <Button size="lg" className="btn-primary gap-2">
                    <Plus className="h-4 w-4" />
                    Nova análise
                  </Button>
                </Link>
                <Link href={isAdmin ? "/admin/relatorios" : "/auditorias"}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:border-slate-300 hover:bg-slate-800/60"
                  >
                    {isAdmin ? "Ver relatórios" : "Auditorias pendentes"}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 border border-border/60 shadow-inner shadow-slate-900/30">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Perfil
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? "Administrador do sistema" : "Analista de operações"}
                </p>
              </div>
              <div className="border-t border-border/60 pt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Último acesso
                </p>
                <p className="text-sm text-foreground">
                  {user?.lastSignedIn
                    ? new Date(user.lastSignedIn).toLocaleString("pt-BR")
                    : "Sessão atual"}
                </p>
              </div>
              <div className="border-t border-border/60 pt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Ambiente
                </p>
                <p className="text-sm text-foreground">OPA • v2.4 · Dark Glass Theme</p>
              </div>
            </div>
          </Card>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Ações rápidas</h2>
            <p className="text-xs text-muted-foreground">
              Acesse as áreas mais utilizadas para manter o fluxo de trabalho atualizado.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {quickActions.map(action => {
              const accent = accentMap[action.accent];
              return (
                <Link key={action.title} href={action.href}>
                  <Card
                    className={`glass-card p-6 h-full transition-all duration-200 border border-border/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/20 cursor-pointer ${accent.border}`}
                  >
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent.bg} mb-4`}
                    >
                      <action.icon className={`h-5 w-5 ${accent.icon}`} />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Section removed per request */}
      </main>
    </div>
  );
}

