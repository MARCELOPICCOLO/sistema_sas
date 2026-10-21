import React from "react";
import {
  faArrowUp,
  faTags,
  faFileImport,
  faFileExport,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import ModuleSidebar from "../src/components/ModuleSidebar";

interface SidebarCaixaProps {
  setShowModalSaida: (show: boolean) => void;
  setShowModalGerenciar: (show: boolean) => void;
  setShowModalImportarGastos: (show: boolean) => void;
  setShowModalImportarVendas: (show: boolean) => void;
}

export const SidebarCaixa: React.FC<SidebarCaixaProps> = ({
  setShowModalSaida,
  setShowModalGerenciar,
  setShowModalImportarGastos,
  setShowModalImportarVendas,
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
        id: "importarGastos",
        icon: faFileImport,
        label: "Importar Gastos",
        description: "CSV ou Excel",
        onClick: () => setShowModalImportarGastos(true),
      },
      {
        id: "importarVendas",
        icon: faFileExport,
        label: "Importar Vendas",
        description: "CSV ou Excel",
        onClick: () => setShowModalImportarVendas(true),
      },
    ]}
  />
);
