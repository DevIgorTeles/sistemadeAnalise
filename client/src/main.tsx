import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Dynamically inject analytics script only when env variables are set.
// This avoids having literal %VITE_*% placeholders in index.html which
// cause malformed URI requests during development when variables are
// not defined.
const analyticsEndpoint = (import.meta as any).env?.VITE_ANALYTICS_ENDPOINT as
  | string
  | undefined;
const analyticsWebsiteId = (import.meta as any).env?.VITE_ANALYTICS_WEBSITE_ID as
  | string
  | undefined;
if (analyticsEndpoint && analyticsEndpoint.length > 0) {
  try {
    const s = document.createElement("script");
    s.defer = true;
    s.src = analyticsEndpoint.replace(/\/$/, "") + "/umami";
    if (analyticsWebsiteId) s.setAttribute("data-website-id", analyticsWebsiteId);
    document.head.appendChild(s);
  } catch (e) {
    // Non-fatal
    console.warn("Failed to inject analytics script", e);
  }
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
