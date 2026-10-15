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
import { MODULOS } from "../modules";
import "./Dashboard.css";

interface DashboardProps {
  user: SessionUser;
  setTela: (tela: string) => void;
}

interface ResumoHoje {
  entradas?: number;
  saidas?: number;
  saldo?: number;
  abertas?: number;
  vendasHoje?: number;
}

interface Stat {
  label: string;
  valor: string;
  icon: IconDefinition;
  negativo?: boolean;
  detalhe?: string;
}

const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  const [resumo, setResumo] = useState<ResumoHoje | null>(null);

  useEffect(() => {
    if (!podeVerCaixa && !podeVerVendas) return;

    let ativo = true;
    const hoje = hojeISO();

    const carregar = async () => {
      const dados: ResumoHoje = {};

      const [caixa, vendas] = await Promise.allSettled([
        podeVerCaixa
          ? api.get(`/orders/daily-summary`, { params: { start_date: hoje, end_date: hoje } })
          : Promise.resolve(null),
        podeVerVendas ? api.get(`/orders/by-date/${hoje}`) : Promise.resolve(null),
      ]);

      if (caixa.status === "fulfilled" && caixa.value) {
        const dia = Array.isArray(caixa.value.data) ? caixa.value.data[0] : undefined;
        dados.entradas = Number(dia?.total_entradas ?? 0);
        dados.saidas = Number(dia?.total_saidas ?? 0);
        dados.saldo = Number(dia?.saldo ?? 0);
      }

      if (vendas.status === "fulfilled" && vendas.value) {
        const lista: Array<{ status: string }> = Array.isArray(vendas.value.data) ? vendas.value.data : [];
        dados.abertas = lista.filter((o) => o.status === "aberto").length;
        dados.vendasHoje = lista.filter((o) => o.status === "fechado").length;
      }

      if (ativo) setResumo(dados);
    };

    carregar();

    return () => {
      ativo = false;
    };
  }, [podeVerCaixa, podeVerVendas]);

  const nomeEmpresa = user.company?.trade_name || user.company?.corporate_name;
  const primeiroNome = (user.full_name || user.username).split(" ")[0];

  const dataExtenso = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const carregandoResumo = (podeVerCaixa || podeVerVendas) && resumo === null;
  const qtdSkeletons = (podeVerCaixa ? 3 : 0) + (podeVerVendas ? 1 : 0);

  const stats: Stat[] = [];
  if (resumo?.entradas !== undefined) {
    stats.push(
      { label: "Entradas hoje", valor: moeda(resumo.entradas), icon: faArrowUp },
      { label: "Saídas hoje", valor: moeda(resumo.saidas ?? 0), icon: faArrowDown },
      {
        label: "Saldo do dia",
        valor: moeda(resumo.saldo ?? 0),
        icon: faScaleBalanced,
        negativo: (resumo.saldo ?? 0) < 0,
      },
    );
  }
  if (resumo?.abertas !== undefined) {
    stats.push({
      label: "Comandas abertas",
      valor: String(resumo.abertas),
      icon: faReceipt,
      detalhe: `${resumo.vendasHoje ?? 0} fechadas hoje`,
    });
  }

  const temResumo = carregandoResumo || stats.length > 0;

  return (
    <div className="dash">
      <main className="dash-content">
        <header className="dash-header">
          <div>
            <h1>
              {saudacao()}, {primeiroNome}!
            </h1>
            <p>
              {nomeEmpresa ? `Bem-vindo ao painel de ${nomeEmpresa}. ` : ""}O que você quer fazer hoje?
            </p>
          </div>
          <span className="dash-header__date">
            <FontAwesomeIcon icon={faCalendarDay} /> {dataExtenso}
          </span>
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
                  <div key={s.label} className="dash-stat">
                    <div className="dash-stat__head">
                      <span className="dash-stat__label">{s.label}</span>
                      <span className="dash-stat__icon">
                        <FontAwesomeIcon icon={s.icon} />
                      </span>
                    </div>
                    <strong className={`dash-stat__value${s.negativo ? " is-negative" : ""}`}>
                      {s.valor}
                    </strong>
                    {s.detalhe && <span className="dash-stat__detail">{s.detalhe}</span>}
                  </div>
                ))}
          </section>
        )}

        <section>
          <div className="dash-section-title">
            <h2>Módulos</h2>
            <span className="dash-pill">{modulos.length} disponíveis</span>
          </div>

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
                  onClick={() => setTela(m.slug)}
                >
                  <span className="dash-card__top">
                    <span className="dash-card__icon">
                      <FontAwesomeIcon icon={m.icon} />
                    </span>
                    <span className="dash-card__go" aria-hidden>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </span>
                  </span>
                  <span className="dash-card__title">{m.titulo}</span>
                  <span className="dash-card__desc">{m.descricao}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
