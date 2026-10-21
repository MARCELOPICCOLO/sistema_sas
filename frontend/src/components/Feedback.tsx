import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { assinar, estadoAtual, fecharToast, type Estado } from "../feedback";

const ICONES = {
  success: faCircleCheck,
  error: faCircleExclamation,
  warning: faTriangleExclamation,
  info: faCircleInfo,
};

const PERIGOSO = /exclu|remov|apag|limpar|cancel|desativ|sem salvar/i;

/** Montado uma vez na raiz da aplicação. */
export function FeedbackHost() {
  const [atual, setAtual] = useState<Estado>(estadoAtual);
  const botaoOk = useRef<HTMLButtonElement>(null);

  useEffect(() => assinar(setAtual), []);

  const confirmacao = atual.confirmacao;

  useEffect(() => {
    if (!confirmacao) return;
    botaoOk.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") confirmacao.resolver(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmacao]);

  const perigoso = confirmacao ? PERIGOSO.test(confirmacao.mensagem) : false;

  return (
    <>
      <div className="toast-stack" aria-live="polite">
        {atual.toasts.map((t) => (
          <div key={t.id} className={`toast is-${t.tipo}`} role={t.tipo === "error" ? "alert" : "status"}>
            <FontAwesomeIcon icon={ICONES[t.tipo]} className="toast__icon" />
            <span className="toast__msg">{t.mensagem}</span>
            <button className="toast__close" onClick={() => fecharToast(t.id)} aria-label="Fechar">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ))}
      </div>

      {confirmacao && (
        <div className="confirm-overlay" onClick={() => confirmacao.resolver(false)}>
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-msg"
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`confirm-dialog__icon ${perigoso ? "is-danger" : ""}`}>
              <FontAwesomeIcon icon={perigoso ? faTriangleExclamation : faCircleInfo} />
            </span>
            <h3>{perigoso ? "Tem certeza?" : "Confirmar ação"}</h3>
            <p id="confirm-msg">{confirmacao.mensagem}</p>
            <div className="confirm-dialog__actions">
              <button className="btn btn-secondary" onClick={() => confirmacao.resolver(false)}>
                Cancelar
              </button>
              <button
                ref={botaoOk}
                className={`btn ${perigoso ? "btn-danger" : "btn-primary"}`}
                onClick={() => confirmacao.resolver(true)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
