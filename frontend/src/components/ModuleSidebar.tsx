import { useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export interface ModuleSidebarItem {
  id: string;
  icon: IconDefinition;
  label: string;
  description?: string;
  onClick: () => void;
}

interface ModuleSidebarProps {
  icon: IconDefinition;
  title: string;
  subtitle?: string;
  items: ModuleSidebarItem[];
  /** Conteúdo opcional no rodapé (oculto quando o menu está encolhido). */
  footer?: ReactNode;
}

const CHAVE = "menu-modulo-encolhido";

const lerPreferencia = () => {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
};

/**
 * Menu lateral das operações de um módulo (Caixa, Produtos, Equipe...).
 * Pode ser encolhido para mostrar só os ícones; a preferência vale para
 * todos os módulos e fica salva no navegador.
 */
export default function ModuleSidebar({ icon, title, subtitle, items, footer }: ModuleSidebarProps) {
  const [encolhido, setEncolhido] = useState(lerPreferencia);

  const alternar = () => {
    setEncolhido((atual) => {
      const novo = !atual;
      try {
        localStorage.setItem(CHAVE, novo ? "1" : "0");
      } catch {
        // Sem persistência: vale só nesta sessão.
      }
      return novo;
    });
  };

  return (
    <aside
      className={`module-sidebar${encolhido ? " is-collapsed" : ""}`}
      aria-label={`Operações de ${title}`}
    >
      <div className="module-sidebar__head">
        <span className="module-sidebar__logo" title={encolhido ? title : undefined}>
          <FontAwesomeIcon icon={icon} />
        </span>
        <span className="module-sidebar__title">
          <strong>{title}</strong>
          {subtitle && <small>{subtitle}</small>}
        </span>
      </div>

      <nav className="module-sidebar__nav">
        {items.map((item) => (
          <button
            key={item.id}
            className="module-sidebar__item"
            onClick={item.onClick}
            data-label={item.label}
            aria-label={item.label}
          >
            <span className="module-sidebar__icon">
              <FontAwesomeIcon icon={item.icon} />
            </span>
            <span className="module-sidebar__text">
              <strong>{item.label}</strong>
              {item.description && <small>{item.description}</small>}
            </span>
          </button>
        ))}
      </nav>

      {footer && !encolhido && <div className="module-sidebar__footer">{footer}</div>}

      {/* Seta na borda direita do menu */}
      <button
        className="module-sidebar__toggle"
        onClick={alternar}
        aria-label={encolhido ? "Expandir menu" : "Encolher menu"}
        aria-expanded={!encolhido}
        title={encolhido ? "Expandir menu" : "Encolher menu"}
      >
        <FontAwesomeIcon icon={encolhido ? faChevronRight : faChevronLeft} />
      </button>
    </aside>
  );
}
