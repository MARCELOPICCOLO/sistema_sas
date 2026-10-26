import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import {
  faArrowDown,
  faArrowRight,
  faArrowUp,
  faCalendarDay,
  faLock,
  faReceipt,
  faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";

import api from "../api/axios";
import type { SessionUser } from "../auth/session";
import { modulosDoUsuario } from "../modules";
import "./Dashboard.css";

interface DashboardProps {
  user: SessionUser;
  setTela: (tela: string) => void;
}

interface Dia {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

interface PedidoResumo {
  status: string;
}

interface Stat {
  label: string;
  valor: string;
  icon: IconDefinition;
  negativo?: boolean;
}

type Linha = Record<string, unknown>;

/** Os indicadores mostram apenas o dia de hoje. */
const DIAS_RESUMO = 1;

const isoDe = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const diasAtras = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDe(d);
};

const moeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
};

export default function Dashboard({ user, setTela }: DashboardProps) {
  const permitidos = useMemo(() => new Set(user.telas.map((t) => t.slug)), [user.telas]);
  const modulos = modulosDoUsuario(user);

  const podeVerCaixa = permitidos.has("caixa");
  const podeVerVendas = permitidos.has("vendas");

  const [dias, setDias] = useState<Dia[] | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResumo[] | null>(null);

  useEffect(() => {
    let ativo = true;
    const hoje = diasAtras(0);

    const carregar = async () => {
      const [caixa, vendas] = await Promise.allSettled([
        podeVerCaixa
          ? api.get(`/orders/daily-summary`, {
              params: { start_date: diasAtras(DIAS_RESUMO - 1), end_date: hoje },
            })
          : Promise.resolve(null),
        podeVerVendas ? api.get(`/orders/by-date/${hoje}`) : Promise.resolve(null),
      ]);

      if (!ativo) return;

      if (caixa.status === "fulfilled" && caixa.value) {
        const linhas: Linha[] = Array.isArray(caixa.value.data) ? caixa.value.data : [];
        const porData = new Map(linhas.map((d) => [String(d.date), d]));
        // Dias sem movimento não vêm da API: preenche com zero.
        setDias(
          Array.from({ length: DIAS_RESUMO }, (_, i) => {
            const date = diasAtras(DIAS_RESUMO - 1 - i);
            const d = porData.get(date);
            return {
              date,
              entradas: Number(d?.total_entradas ?? 0),
              saidas: Number(d?.total_saidas ?? 0),
              saldo: Number(d?.saldo ?? 0),
            };
          }),
        );
      } else {
        setDias([]);
      }

      if (vendas.status === "fulfilled" && vendas.value) {
        const lista: Linha[] = Array.isArray(vendas.value.data) ? vendas.value.data : [];
        setPedidos(lista.map((o) => ({ status: String(o.status) })));
      } else {
        setPedidos([]);
      }
    };

    carregar();

    return () => {
      ativo = false;
    };
  }, [podeVerCaixa, podeVerVendas]);

  const nomeEmpresa = user.company?.trade_name || user.company?.corporate_name;
  const primeiroNome = (user.full_name || user.username).split(" ")[0];

  const dataLonga = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const dataExtenso = dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1);

  const carregandoResumo = (podeVerCaixa && dias === null) || (podeVerVendas && pedidos === null);
  const qtdSkeletons = (podeVerCaixa ? 3 : 0) + (podeVerVendas ? 1 : 0);

  const hoje = dias?.[dias.length - 1];

  const stats: Stat[] = [];
  if (hoje) {
    stats.push(
      {
        label: "Entradas hoje",
        valor: moeda(hoje.entradas),
        icon: faArrowUp,
      },
      {
        label: "Saídas hoje",
        valor: moeda(hoje.saidas),
        icon: faArrowDown,
      },
      {
        label: "Saldo do dia",
        valor: moeda(hoje.saldo),
        icon: faScaleBalanced,
        negativo: hoje.saldo < 0,
      },
    );
  }
  if (pedidos) {
    stats.push({
      label: "Pedidos abertos",
      valor: String(pedidos.filter((o) => o.status === "aberto").length),
      icon: faReceipt,
    });
  }

  const temResumo = carregandoResumo || stats.length > 0;

  return (
    <div className="dash">
      <main className="dash-content">
        <header className="dash-page-head">
          <h1>Painel</h1>
          <p>
            {saudacao()}, {primeiroNome}! <span aria-hidden>·</span>{" "}
            <FontAwesomeIcon icon={faCalendarDay} /> {dataExtenso}
            {nomeEmpresa ? ` · ${nomeEmpresa}` : ""}
          </p>
        </header>

        {temResumo && (
          <section className="dash-section" aria-label="Resumo de hoje" aria-busy={carregandoResumo}>
            <h2 className="dash-section__title">Resumo de hoje</h2>
            <p className="dash-section__desc">Movimento do caixa e dos pedidos do dia</p>

            <div className="dash-stats">
              {carregandoResumo
                ? Array.from({ length: qtdSkeletons }, (_, i) => (
                    <div key={i} className="dash-tile is-loading" aria-hidden>
                      <span className="dash-tile__icon" />
                      <span className="dash-tile__text">
                        <span className="dash-skeleton dash-skeleton--label" />
                        <span className="dash-skeleton dash-skeleton--value" />
                      </span>
                    </div>
                  ))
                : stats.map((s) => (
                    <div key={s.label} className="dash-tile">
                      <span className="dash-tile__icon">
                        <FontAwesomeIcon icon={s.icon} />
                      </span>
                      <span className="dash-tile__text">
                        <small>{s.label}</small>
                        <strong className={s.negativo ? "is-negative" : ""}>{s.valor}</strong>
                      </span>
                    </div>
                  ))}
            </div>
          </section>
        )}

        <section className="dash-section">
          <h2 className="dash-section__title">Módulos</h2>
          <p className="dash-section__desc">Áreas do sistema liberadas para você</p>

          {modulos.length === 0 ? (
            <div className="dash-empty">
              <span className="dash-empty__icon">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <strong>Nenhum módulo liberado</strong>
              <p>Solicite acesso ao administrador do sistema.</p>
            </div>
          ) : (
            <div className="dash-grid">
              {modulos.map((m) => (
                <button key={m.slug} className="dash-tile is-link" onClick={() => setTela(m.slug)}>
                  <span className="dash-tile__icon">
                    <FontAwesomeIcon icon={m.icon} />
                  </span>
                  <span className="dash-tile__text">
                    <strong className="dash-tile__title">{m.titulo}</strong>
                    <small>{m.descricao}</small>
                  </span>
                  <FontAwesomeIcon icon={faArrowRight} className="dash-tile__go" aria-hidden />
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
