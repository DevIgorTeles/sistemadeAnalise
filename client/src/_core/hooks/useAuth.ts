import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
  preserveNext?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const {
    redirectOnUnauthenticated = false,
    redirectPath = getLoginUrl(),
    preserveNext = true,
  } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  // Mover side effects do localStorage para useEffect separado
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (meQuery.data) {
        localStorage.setItem(
          "manus-runtime-user-info",
          JSON.stringify(meQuery.data)
        );
      } else {
        localStorage.removeItem("manus-runtime-user-info");
      }
    }
  }, [meQuery.data]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (meQuery.data) return; // Usar meQuery.data diretamente ao invés de state.user
    if (typeof window === "undefined") return;
    const redirectUrl = new URL(
      redirectPath,
      window.location.origin
    );

    if (preserveNext && !redirectUrl.searchParams.has("next")) {
      const nextValue = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      redirectUrl.searchParams.set("next", nextValue);
    }

    if (redirectUrl.pathname === window.location.pathname) return;

    window.location.href = redirectUrl.toString();
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    preserveNext,
    logoutMutation.isPending,
    meQuery.isLoading,
    meQuery.data, // Usar meQuery.data diretamente ao invés de state.user para evitar loops
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
