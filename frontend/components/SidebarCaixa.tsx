import React from "react";
import { faArrowUp, faTags, faFileImport, faWallet } from "@fortawesome/free-solid-svg-icons";

import ModuleSidebar from "../src/components/ModuleSidebar";

interface SidebarCaixaProps {
  setShowModalSaida: (show: boolean) => void;
  setShowModalGerenciar: (show: boolean) => void;
  /** Abre a importação de planilha (gastos ou vendas, com os modelos para baixar). */
  onImportar: () => void;
}

export const SidebarCaixa: React.FC<SidebarCaixaProps> = ({
  setShowModalSaida,
  setShowModalGerenciar,
  onImportar,
}) => (
  <ModuleSidebar
    icon={faWallet}
    title="Caixa"
    subtitle="Gestão financeira"
    items={[
      {
        id: "saida",
        icon: faArrowUp,
        label: "Nova Saída",
        description: "Registrar gasto",
        onClick: () => setShowModalSaida(true),
      },
      {
        id: "categorias",
        icon: faTags,
        label: "Categorias",
        description: "Gerenciar categorias",
        onClick: () => setShowModalGerenciar(true),
      },
      {
        id: "importar",
        icon: faFileImport,
        label: "Importar planilha",
        description: "Gastos ou vendas (Excel/CSV)",
        onClick: onImportar,
      },
    ]}
  />
);
