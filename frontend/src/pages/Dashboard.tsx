import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { MODULOS } from "../modules";
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
  cor: string;
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
  const modulos = MODULOS.filter((m) => permitidos.has(m.slug));

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
        cor: "var(--c-green)",
      },
      {
        label: "Saídas hoje",
        valor: moeda(hoje.saidas),
        icon: faArrowDown,
        cor: "var(--c-red)",
      },
      {
        label: "Saldo do dia",
        valor: moeda(hoje.saldo),
        icon: faScaleBalanced,
        cor: "var(--c-blue)",
        negativo: hoje.saldo < 0,
      },
    );
  }
  if (pedidos) {
    stats.push({
      label: "Pedidos abertos",
      valor: String(pedidos.filter((o) => o.status === "aberto").length),
      icon: faReceipt,
      cor: "var(--c-violet)",
    });
  }

  const temResumo = carregandoResumo || stats.length > 0;

  return (
    <div className="dash">
      <main className="dash-content">
        <section className="dash-banner">
          <header className="dash-header">
            <span className="dash-header__date">
              <FontAwesomeIcon icon={faCalendarDay} /> {dataExtenso}
            </span>
            <h1>
              {saudacao()}, {primeiroNome}!
            </h1>
            <p>
              {nomeEmpresa ? `Bem-vindo ao painel de ${nomeEmpresa}. ` : ""}
              Veja como está o seu negócio hoje.
            </p>
          </header>

          {temResumo && (
            <section className="dash-stats" aria-label="Resumo de hoje" aria-busy={carregandoResumo}>
              {carregandoResumo
                ? Array.from({ length: qtdSkeletons }, (_, i) => (
                    <div key={i} className="dash-stat is-loading" aria-hidden>
                      <span className="dash-skeleton dash-skeleton--label" />
                      <span className="dash-skeleton dash-skeleton--value" />
                    </div>
                  ))
                : stats.map((s) => (
                    <div
                      key={s.label}
                      className="dash-stat"
                      style={{ "--stat": s.cor } as CSSProperties}
                    >
                      <div className="dash-stat__head">
                        <span className="dash-stat__icon">
                          <FontAwesomeIcon icon={s.icon} />
                        </span>
                        <span className="dash-stat__label">{s.label}</span>
                      </div>
                      <strong className={`dash-stat__value${s.negativo ? " is-negative" : ""}`}>
                        {s.valor}
                      </strong>
                    </div>
                  ))}
            </section>
          )}
        </section>

        <section>
          <div className="dash-section-title">
            <h2>Módulos</h2>
            <span className="dash-pill">{modulos.length} disponíveis</span>
          </div>
          <hr className="dash-divider" />

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
                <button
                  key={m.slug}
                  className="dash-card"
                  style={{ "--accent": m.cor } as CSSProperties}
                  onClick={() => setTela(m.slug)}
                >
                  <span className="dash-card__header">
                    <span className="dash-card__icon">
                      <FontAwesomeIcon icon={m.icon} />
                    </span>
                    <span className="dash-card__title">{m.titulo}</span>
                    <span className="dash-card__go" aria-hidden>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </span>
                  </span>
                  <span className="dash-card__body">
                    <span className="dash-card__desc">{m.descricao}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
