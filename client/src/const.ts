export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "OPA - Operação de Prevenção e Análise";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/0088ff/001a33?text=OPA";

// Login URL para sistema local (sem Manus OAuth)
export const getLoginUrl = () => {
  return "/login";
};

