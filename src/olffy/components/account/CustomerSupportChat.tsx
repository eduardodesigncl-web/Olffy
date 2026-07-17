"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { SupportConversation } from "lib/support/types";
import {
  getCustomerSupportConversationAction,
  sendCustomerSupportMessageAction,
} from "../../integration/support-actions";
import styles from "./CustomerSupportChat.module.css";

const WELCOME_MESSAGE = "¡Hola! ¿En qué te puedo ayudar?";
const RECEIVED_MESSAGE =
  "¡Gracias! Recibimos tu consulta. Te responderemos a la brevedad por este chat o a tu correo.";

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CustomerSupportChat() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (markRead: boolean) => {
    const result = await getCustomerSupportConversationAction({ markRead });
    if (result.ok) {
      setConversation(result.conversation);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(
      () => void refresh(open),
      open ? 6000 : 20000,
    );
    return () => window.clearInterval(interval);
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void refresh(true).finally(() => setLoading(false));
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [open, conversation?.messages.length]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const body = message.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    const result = await sendCustomerSupportMessageAction({ message: body });
    setSending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("");
    setConversation(result.conversation);
  };

  const lastMessage = conversation?.messages.at(-1);
  const showAcknowledgement = lastMessage?.sender === "customer";
  const unread = conversation?.unreadCustomer ?? 0;

  return (
    <div className={styles.root}>
      {open && (
        <section className={styles.panel} aria-label="Chat de ayuda OLFFY">
          <header className={styles.header}>
            <div className={styles.avatar} aria-hidden="true">
              <span>✿</span>
            </div>
            <div>
              <strong>Ayuda OLFFY</strong>
              <span>Estamos para ayudarte</span>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </header>

          <div className={styles.messages} ref={scrollRef} aria-live="polite">
            <div className={`${styles.row} ${styles.storeRow}`}>
              <div className={`${styles.bubble} ${styles.storeBubble}`}>
                {WELCOME_MESSAGE}
              </div>
            </div>

            {conversation?.messages.map((item) => (
              <div
                key={item.id}
                className={`${styles.row} ${
                  item.sender === "customer"
                    ? styles.customerRow
                    : styles.storeRow
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    item.sender === "customer"
                      ? styles.customerBubble
                      : styles.storeBubble
                  }`}
                >
                  <span>{item.body}</span>
                  <time>{timeLabel(item.createdAt)}</time>
                </div>
              </div>
            ))}

            {showAcknowledgement && (
              <div className={`${styles.row} ${styles.storeRow}`}>
                <div className={`${styles.bubble} ${styles.storeBubble}`}>
                  {RECEIVED_MESSAGE}
                </div>
              </div>
            )}

            {loading && !conversation && (
              <div className={styles.loading}>Cargando conversación…</div>
            )}
          </div>

          <form className={styles.composer} onSubmit={send}>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribe tu consulta…"
              aria-label="Mensaje para OLFFY"
              maxLength={2000}
              rows={1}
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              aria-label="Enviar mensaje"
            >
              {sending ? "…" : "➜"}
            </button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
        </section>
      )}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Cerrar ayuda" : "Abrir chat de ayuda"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9.5 9.5 0 0 1-3.7-.8L4 20l1.4-3.7A7.4 7.4 0 0 1 4 12a7.5 7.5 0 0 1 8-7.5 7.5 7.5 0 0 1 8 7Z" />
          <path d="M8.5 11.8h.01M12 11.8h.01M15.5 11.8h.01" />
        </svg>
        {unread > 0 && (
          <span className={styles.badge}>{Math.min(unread, 9)}</span>
        )}
      </button>
    </div>
  );
}
