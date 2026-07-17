"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupportConversation } from "lib/support/types";
import styles from "./AdminSupportInbox.module.css";

type InboxPayload = {
  conversations?: SupportConversation[];
  unread?: number;
  error?: string;
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminSupportInbox() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/support", {
        cache: "no-store",
      });
      const payload = (await response.json()) as InboxPayload;
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar");
      setConversations(payload.conversations ?? []);
      setSelectedId((current) => {
        if (
          current &&
          payload.conversations?.some((item) => item.id === current)
        ) {
          return current;
        }
        return (
          payload.conversations?.find((item) => item.unreadAdmin > 0)?.id ??
          payload.conversations?.[0]?.id ??
          null
        );
      });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), open ? 6000 : 15000);
    return () => window.clearInterval(interval);
  }, [load, open]);

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId],
  );
  const unread = conversations.reduce(
    (total, conversation) => total + conversation.unreadAdmin,
    0,
  );

  useEffect(() => {
    if (!open || !selected || selected.unreadAdmin === 0) return;

    setConversations((current) =>
      current.map((item) =>
        item.id === selected.id ? { ...item, unreadAdmin: 0 } : item,
      ),
    );
    void fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected.id }),
    });
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [open, selected?.messages.length]);

  const sendReply = async (sendEmail: boolean) => {
    const message = reply.trim();
    if (!selected || !message || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selected.id,
          message,
          sendEmail,
        }),
      });
      const payload = (await response.json()) as InboxPayload;
      if (payload.conversations) setConversations(payload.conversations);
      if (!response.ok)
        throw new Error(payload.error || "No se pudo responder");
      setReply("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo responder");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((current) => !current)}
        aria-label="Consultas de clientes"
        aria-expanded={open}
        title="Consultas de clientes"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unread > 0 && <span>{Math.min(unread, 99)}</span>}
      </button>

      {open && (
        <section className={styles.panel} aria-label="Bandeja de consultas">
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>ATENCIÓN AL CLIENTE</span>
              <h2>Consultas</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
          </header>

          <div className={styles.workspace}>
            <aside className={styles.list}>
              {loading && conversations.length === 0 && (
                <p className={styles.empty}>Cargando consultas…</p>
              )}
              {!loading && conversations.length === 0 && (
                <p className={styles.empty}>Todavía no hay consultas.</p>
              )}
              {conversations.map((conversation) => {
                const last = conversation.messages.at(-1);
                return (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`${styles.listItem} ${
                      conversation.id === selectedId
                        ? styles.listItemActive
                        : ""
                    }`}
                    onClick={() => setSelectedId(conversation.id)}
                  >
                    <span className={styles.customerLine}>
                      <strong>
                        {conversation.customerName ||
                          conversation.customerEmail}
                      </strong>
                      {conversation.unreadAdmin > 0 && (
                        <i>{conversation.unreadAdmin}</i>
                      )}
                    </span>
                    <span className={styles.preview}>
                      {last?.body || "Sin mensajes"}
                    </span>
                    <time>{dateLabel(conversation.lastMessageAt)}</time>
                  </button>
                );
              })}
            </aside>

            <div className={styles.thread}>
              {selected ? (
                <>
                  <div className={styles.customerHeader}>
                    <div>
                      <strong>
                        {selected.customerName || "Cliente OLFFY"}
                      </strong>
                      <a href={`mailto:${selected.customerEmail}`}>
                        {selected.customerEmail}
                      </a>
                    </div>
                    <span>
                      {selected.status === "answered"
                        ? "Respondida"
                        : "Abierta"}
                    </span>
                  </div>

                  <div className={styles.messages} ref={scrollRef}>
                    {selected.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`${styles.messageRow} ${
                          message.sender === "admin"
                            ? styles.adminRow
                            : styles.clientRow
                        }`}
                      >
                        <div className={styles.messageBubble}>
                          <p>{message.body}</p>
                          <time>{dateLabel(message.createdAt)}</time>
                          {message.deliveryChannel === "chat_email" && (
                            <small>
                              {message.emailStatus === "sent"
                                ? "Chat + correo enviado"
                                : message.emailStatus === "failed"
                                  ? "Guardado en chat · correo falló"
                                  : "Chat + correo"}
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.replyBox}>
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Escribe una respuesta…"
                      maxLength={2000}
                      rows={3}
                    />
                    <div className={styles.replyActions}>
                      <button
                        type="button"
                        onClick={() => void sendReply(false)}
                        disabled={!reply.trim() || sending}
                      >
                        Responder en chat
                      </button>
                      <button
                        type="button"
                        className={styles.emailButton}
                        onClick={() => void sendReply(true)}
                        disabled={!reply.trim() || sending}
                      >
                        Chat + correo
                      </button>
                    </div>
                    <p>
                      La respuesta queda siempre en el chat. Usa correo cuando
                      el cliente ya no esté conectado.
                    </p>
                  </div>
                </>
              ) : (
                <div className={styles.noSelection}>
                  Selecciona una consulta.
                </div>
              )}
            </div>
          </div>
          {error && <div className={styles.error}>{error}</div>}
        </section>
      )}
    </div>
  );
}
