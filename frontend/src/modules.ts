import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import {
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
  slug: ModuloSlug;
  path: string;
  titulo: string;
  descricao: string;
  icon: IconDefinition;
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

export const pathDoModulo = (slug: string): string =>
  MODULOS.find((m) => m.slug === slug)?.path ?? "/";
