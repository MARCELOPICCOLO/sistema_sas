import axios, { type InternalAxiosRequestConfig } from "axios";

export const API_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const TOKEN_KEY = "auth_token";
export const USER_KEY = "user";

/** Disparado quando a API responde 401 (token expirado/inválido). */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// O token só é enviado para a própria API, nunca para outros domínios.
const isApiUrl = (url: string) => url.startsWith(API_URL);

const isLoginUrl = (url: string) => url.includes("/auth/login");

const handleUnauthorized = (status: number | undefined, url: string) => {
  if (status !== 401 || isLoginUrl(url) || !getToken()) {
    return;
  }

  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = getToken();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers.Accept = config.headers.Accept || "application/json";

  return config;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
});

let interceptorsInstalled = false;

/**
 * Instala os tratamentos globais de autenticação:
 * - envia o token JWT nas requisições à API;
 * - encerra a sessão quando a API responde 401.
 *
 * Cobre a instância `api`, a instância padrão do axios e `fetch`,
 * pois as telas usam as três formas.
 */
export function installAuthInterceptors() {
  if (interceptorsInstalled) {
    return;
  }

  interceptorsInstalled = true;

  for (const instance of [api, axios]) {
    instance.interceptors.request.use((config) => {
      const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
      return isApiUrl(url) ? attachToken(config) : config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`;
        handleUnauthorized(error.response?.status, url);
        return Promise.reject(error);
      },
    );
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);

    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (url.startsWith(API_URL)) {
      handleUnauthorized(response.status, url);
    }

    return response;
  };
}

/** Extrai uma mensagem amigável de um erro de requisição. */
export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

    const firstValidationError = data?.errors
      ? Object.values(data.errors)[0]?.[0]
      : undefined;

    if (firstValidationError) return firstValidationError;
    if (data?.message) return data.message;
    if (!error.response) return "Não foi possível conectar ao servidor.";
  }

  return fallback;
}

export default api;
