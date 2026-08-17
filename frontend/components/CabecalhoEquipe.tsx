// components/CabecalhoEquipe.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";

interface CabecalhoEquipeProps {
  titulo?: string;
  subtitulo?: string;
}

export function CabecalhoEquipe({
  titulo = "Gerenciamento de equipe",
  subtitulo = "Gerencie os usuários e os acessos da sua empresa.",
}: CabecalhoEquipeProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
        marginBottom: 24,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#ecfdf5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 19,
          }}
        >
          <FontAwesomeIcon icon={faUsers} />
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {titulo}
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            {subtitulo}
          </p>
        </div>
      </div>
    </div>
  );
}
