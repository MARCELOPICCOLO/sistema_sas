// components/SidebarEquipe.tsx

import { faUsers, faPlus } from "@fortawesome/free-solid-svg-icons";

import ModuleSidebar from "../src/components/ModuleSidebar";

interface SidebarEquipeProps {
  onNovoColaborador: () => void;
}

export function SidebarEquipe({ onNovoColaborador }: SidebarEquipeProps) {
  return (
    <ModuleSidebar
      icon={faUsers}
      title="Equipe"
      subtitle="Gerenciamento"
      items={[
        {
          id: "novo",
          icon: faPlus,
          label: "Novo colaborador",
          description: "Cadastrar usuário",
          onClick: onNovoColaborador,
        },
      ]}
    />
  );
}
