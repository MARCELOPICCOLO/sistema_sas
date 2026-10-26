import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import {
  faBuilding,
  faBoxes,
  faCashRegister,
  faChartLine,
  faShoppingCart,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export type ModuloSlug =
  | "produtos"
  | "vendas"
  | "caixa"
  | "gestao_relatorio"
  | "gestao_equipe";

export interface Modulo {
  slug: ModuloSlug | "empresas";
  path: string;
  titulo: string;
  descricao: string;
  icon: IconDefinition;
  /** Cor do módulo (variável CSS), usada no ícone e nos destaques. */
  cor: string;
}

/**
 * Módulos do sistema. O "slug" corresponde à tabela "telas" do backend,
 * que controla quais usuários podem acessar cada módulo.
 */
export const MODULOS: Modulo[] = [
  {
    slug: "vendas",
    path: "/vendas",
    titulo: "Gestão de Vendas",
    descricao: "Abra pedidos, lance itens e finalize vendas.",
    icon: faShoppingCart,
    cor: "var(--c-blue)",
  },
  {
    slug: "produtos",
    path: "/produtos",
    titulo: "Gestão de Estoque",
    descricao: "Produtos, categorias, preços e níveis de estoque.",
    icon: faBoxes,
    cor: "var(--c-violet)",
  },
  {
    slug: "caixa",
    path: "/caixa",
    titulo: "Gestão de Caixa",
    descricao: "Entradas, saídas e fluxo de caixa diário.",
    icon: faCashRegister,
    cor: "var(--c-green)",
  },
  {
    slug: "gestao_relatorio",
    path: "/relatorios",
    titulo: "Relatórios",
    descricao: "Análises de vendas, produtos e resultado do negócio.",
    icon: faChartLine,
    cor: "var(--c-amber)",
  },
  {
    slug: "gestao_equipe",
    path: "/equipe",
    titulo: "Gestão de Equipe",
    descricao: "Colaboradores, perfis e permissões de acesso.",
    icon: faUsers,
    cor: "var(--c-pink)",
  },
];

/**
 * Cadastro de empresas: exclusivo do operador master da plataforma.
 * Não faz parte das "telas" atribuíveis a usuários das empresas.
 */
export const MODULO_EMPRESAS: Modulo = {
  slug: "empresas",
  path: "/empresas",
  titulo: "Empresas",
  descricao: "Cadastro das empresas que usam o sistema.",
  icon: faBuilding,
  cor: "var(--c-blue)",
};

/** Módulos que o usuário pode abrir, na ordem do menu. */
export function modulosDoUsuario(user: { telas: { slug: string }[]; is_master: boolean }): Modulo[] {
  const permitidos = new Set(user.telas.map((t) => t.slug));
  const modulos = MODULOS.filter((m) => permitidos.has(m.slug));
  return user.is_master ? [...modulos, MODULO_EMPRESAS] : modulos;
}

export const pathDoModulo = (slug: string): string =>
  [...MODULOS, MODULO_EMPRESAS].find((m) => m.slug === slug)?.path ?? "/";
