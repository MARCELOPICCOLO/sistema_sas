// pages/GestaoPontosVenda.tsx
import React, { useState, useEffect } from "react";
import SidebarPdv from "../../components/SidebarPdv";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL;

interface Mesa {
  id: number;
  number: number;
  restaurant_id: number;
}

interface GestaoPontosVendaProps {
  setTela: (tela: string) => void;
}

export default function GestaoPontosVenda({ setTela }: GestaoPontosVendaProps) {
  const [pontosVenda, setPontosVenda] = useState<Mesa[]>([]);
  const [pontoAtual, setPontoAtual] = useState("");
  const [novaPontoCodigo, setNovaPontoCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`${API_URL}/tables?restaurant_id=1`);
        const tablesData = await response.json();
        setPontosVenda(tablesData);

        if (tablesData.length > 0) {
          setPontoAtual(`mesa-${tablesData[0].number}`);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }

    loadData();
  }, []);

  const adicionarPonto = async () => {
    const numeroPonto = Number(novaPontoCodigo);

    if (!Number.isInteger(numeroPonto) || numeroPonto <= 0) {
      return alert("Digite um número válido");
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          restaurant_id: 1,
          number: numeroPonto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          alert(data.message);
        } else {
          alert(data.message || "Erro ao criar ponto de venda");
        }
        return;
      }

      const nomePonto = `mesa-${data.number}`;

      setPontosVenda((prev) => [...prev, data]);
      setPontoAtual(nomePonto);
      setNovaPontoCodigo("");
      alert(`Ponto ${data.number} adicionado com sucesso!`);
    } catch (error) {
      console.error("Erro ao adicionar ponto:", error);
      alert("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const excluirPonto = async (pontoId: number, pontoNumero: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/tables/${pontoId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        alert("Erro ao excluir ponto de venda");
        return;
      }

      setPontosVenda((prev) => prev.filter((p) => p.id !== pontoId));

      if (pontoAtual === `mesa-${pontoNumero}`) {
        const firstPonto = pontosVenda.find((p) => p.id !== pontoId);
        setPontoAtual(firstPonto ? `mesa-${firstPonto.number}` : "");
      }

      alert(`Ponto ${pontoNumero} excluído com sucesso!`);
    } catch (error) {
      console.error("Erro ao excluir ponto:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const handlePontoClick = (ponto: string) => {
    setPontoAtual(ponto);
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "#1f2937",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Botão Voltar ao Dashboard */}
      <div
        style={{
          padding: "10px 20px",
          background: "#1f2937",
          borderBottom: "1px solid #374151",
        }}
      >
        <button
          onClick={() => setTela("dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            padding: "4px 0",
            fontSize: 12,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          <FontAwesomeIcon icon={faArrowLeft} size="sm" />
          Voltar ao Dashboard
        </button>
      </div>

      {/* Sidebar ocupando o restante da tela */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <SidebarPdv
          mesas={pontosVenda}
          mesaAtual={pontoAtual}
          novaMesa={novaPontoCodigo}
          onNovaMesaChange={setNovaPontoCodigo}
          onAdicionarMesa={adicionarPonto}
          onMesaClick={handlePontoClick}
          onExcluirMesa={excluirPonto}
          loading={loading}
        />
      </div>
    </div>
  );
}
