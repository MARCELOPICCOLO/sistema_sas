import api, { USER_KEY } from "../api/axios";

export interface TelaPermissao {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
}

export interface SessionUser {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: "MASTER" | "ADMIN" | "USER" | null;
  is_master: boolean;
  company: { id: number; corporate_name: string; trade_name?: string | null } | null;
  telas: TelaPermissao[];
  /** Mantido por compatibilidade com telas antigas. */
  login: string;
}

interface MeResponse {
  user: Omit<SessionUser, "company" | "telas" | "login">;
  company: SessionUser["company"];
  telas: TelaPermissao[];
}

/** Carrega o usuário autenticado e as telas liberadas para ele. */
export async function fetchSession(): Promise<SessionUser> {
  const { data } = await api.get<MeResponse>("/auth/me");

  const session: SessionUser = {
    ...data.user,
    company: data.company ?? null,
    telas: Array.isArray(data.telas) ? data.telas.filter((t) => t.ativo !== false) : [],
    login: data.user.username,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(session));

  return session;
}

export const ROLE_LABEL: Record<string, string> = {
  MASTER: "Master",
  ADMIN: "Administrador",
  USER: "Colaborador",
};
