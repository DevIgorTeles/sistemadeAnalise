import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && auth.user) {
      const params = new URLSearchParams(window.location.search);
      const candidate = params.get("next") || params.get("redirect");
      const candidateSafe = candidate && candidate.startsWith("/") ? candidate : null;
      navigate(candidateSafe ?? "/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.user]); // navigate é estável do wouter, não precisa estar nas dependências

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Informe o e-mail e a senha para login.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Login falhou (${res.status})`);
      }
      // on success the server sets the session cookie; it may also return
      // the user object in the response to avoid an extra fetch.
      const body = await res.json().catch(() => ({}));
      const params = new URLSearchParams(window.location.search);
      const candidate = params.get("next") || params.get("redirect");

      let user = body?.user ?? null;

      // If server didn't return user, fallback to retrying the me query
      if (!user) {
        const maxAttempts = 8;
        const delayMs = 200;
        const utils = trpc.useUtils();
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const result = await utils.auth.me.fetch();
            if (result) {
              user = result;
              break;
            }
          } catch (e) {
            // ignore errors and retry
          }
          // small delay before next attempt
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      // Determine default redirect: admin -> '/', else -> '/analise/nova'
      const defaultRedirect = user && (user as any).role === "admin" ? "/" : "/analise/nova";
      const candidateSafe = candidate && candidate.startsWith("/") ? candidate : null;
      const redirectTo = candidateSafe ?? defaultRedirect;
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return auth.loading ? (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] flex items-center justify-center px-4">
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <span className="h-3 w-3 rounded-full bg-primary animate-pulse" />
        Verificando sessão...
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#131b28] flex items-center justify-center px-4">
      <div className="max-w-md w-full glass-card p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Bem-vindo</h1>
          <p className="text-muted-foreground">
            Acesse sua conta para continuar
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="block">
              <span className="text-sm font-medium text-foreground mb-2 block">E-mail</span>
              <input
                id="email"
                className="w-full px-4 py-3 rounded-lg"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                disabled={loading}
                required
              />
            </label>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block">
              <span className="text-sm font-medium text-foreground mb-2 block">Senha</span>
              <input
                id="password"
                className="w-full px-4 py-3 rounded-lg"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive animate-slide-in">
              {error}
            </div>
          )}

          <Button 
            className="w-full btn-primary" 
            type="submit" 
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Você será redirecionado automaticamente após o login
          </p>
        </div>
      </div>
    </div>
  );
}
