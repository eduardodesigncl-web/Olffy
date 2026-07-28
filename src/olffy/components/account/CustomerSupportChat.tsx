"use client";

import Image from "next/image";
import type {
  SupportConversation,
  SupportIssueCategory,
} from "lib/support/types";
import {
  formatSupportDate,
  SUPPORT_DIAGNOSTIC_OPTIONS,
  supportIssueCategoryLabel,
  supportStatusLabel,
} from "lib/support/workflow";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  getCustomerSupportConversationAction,
  sendCustomerSupportMessageAction,
} from "../../integration/support-actions";
import styles from "./CustomerSupportChat.module.css";

const WELCOME_MESSAGE =
  "¡Hola! Para ayudarte más rápido, primero identifiquemos tu consulta.";

export function CustomerSupportChat() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SupportIssueCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewReply, setHasNewReply] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUnreadRef = useRef<number | null>(null);
  const openRef = useRef(false);
  openRef.current = open;

  const refresh = useCallback(async (markRead: boolean) => {
    const result = await getCustomerSupportConversationAction({ markRead });
    if (result.ok) {
      const nextUnread = result.conversation?.unreadCustomer ?? 0;
      if (
        !markRead &&
        !openRef.current &&
        lastUnreadRef.current !== null &&
        nextUnread > lastUnreadRef.current
      ) {
        setHasNewReply(true);
      }
      if (markRead) setHasNewReply(false);
      lastUnreadRef.current = nextUnread;
      setConversation(result.conversation);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    const requestedConversation = new URLSearchParams(
      window.location.search,
    ).get("support");
    if (requestedConversation) setOpen(true);
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(
      () => void refresh(false),
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
    if (!open || !conversation) return;
    const heartbeat = (keepalive = false) => {
      if (!keepalive && document.visibilityState !== "visible") return;
      void fetch("/api/support/heartbeat", {
        method: "POST",
        cache: "no-store",
        keepalive,
      });
    };
    const visibility = () => {
      if (document.visibilityState === "visible") heartbeat();
      else heartbeat(true);
    };
    const pagehide = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/support/heartbeat", new Blob([]));
      } else {
        heartbeat(true);
      }
    };

    heartbeat();
    const interval = window.setInterval(() => heartbeat(), 60_000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
    };
  }, [open, conversation?.id]);

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
    const diagnosisRequired =
      !conversation || conversation.status === "resolved";
    if (diagnosisRequired && (!category || !subcategory)) {
      setError("Selecciona el motivo de tu consulta para continuar.");
      return;
    }
    if (!body || sending) return;

    setSending(true);
    setError(null);
    const result = await sendCustomerSupportMessageAction({
      message: body,
      ...(diagnosisRequired && category && subcategory
        ? { category, subcategory }
        : {}),
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("");
    setCategory(null);
    setSubcategory(null);
    setConversation(result.conversation);
  };

  const unread = conversation?.unreadCustomer ?? 0;
  const diagnosisRequired = !conversation || conversation.status === "resolved";
  const selectedDiagnostic = SUPPORT_DIAGNOSTIC_OPTIONS.find(
    (option) => option.value === category,
  );

  return (
    <div className={styles.root}>
      {open && (
        <section className={styles.panel} aria-label="Chat de ayuda OLFFY">
          <header className={styles.header}>
            <div className={styles.avatar} aria-hidden="true">
              <span>✿</span>
            </div>
            <div className={styles.headerCopy}>
              <strong>Ayuda OLFFY</strong>
              <span>
                {conversation
                  ? `#${conversation.reference} · ${supportStatusLabel(conversation.status)}`
                  : "Estamos para ayudarte"}
              </span>
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

          {conversation && (
            <div className={styles.conversationMeta}>
              <span>
                Iniciada el {formatSupportDate(conversation.createdAt)}
              </span>
              {conversation.relatedOrderName && (
                <span>Pedido relacionado: {conversation.relatedOrderName}</span>
              )}
              {conversation.issueCategory && (
                <span>
                  Motivo:{" "}
                  {supportIssueCategoryLabel(conversation.issueCategory)}
                  {conversation.issueSubcategory
                    ? ` · ${conversation.issueSubcategory}`
                    : ""}
                </span>
              )}
            </div>
          )}

          <div className={styles.messages} ref={scrollRef} aria-live="polite">
            {!conversation && (
              <div className={`${styles.row} ${styles.storeRow}`}>
                <div className={`${styles.bubble} ${styles.storeBubble}`}>
                  {WELCOME_MESSAGE}
                </div>
              </div>
            )}

            {conversation && (
              <div className={styles.startedSeparator}>
                Consulta iniciada el {formatSupportDate(conversation.createdAt)}
              </div>
            )}

            {conversation?.messages.map((item) =>
              item.sender === "system" ? (
                <div className={styles.systemEvent} key={item.id}>
                  <strong>{item.senderName}</strong>
                  <span>{item.body}</span>
                  <time title={formatSupportDate(item.createdAt)}>
                    {formatSupportDate(item.createdAt)}
                  </time>
                </div>
              ) : (
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
                    <strong className={styles.messageAuthor}>
                      {item.sender === "customer" ? "Tú" : item.senderName}
                    </strong>
                    <span>{item.body}</span>
                    <time title={formatSupportDate(item.createdAt)}>
                      {formatSupportDate(item.createdAt)}
                    </time>
                  </div>
                </div>
              ),
            )}

            {diagnosisRequired && (
              <div className={styles.diagnostic}>
                {conversation?.status === "resolved" && (
                  <div className={`${styles.row} ${styles.storeRow}`}>
                    <div className={`${styles.bubble} ${styles.storeBubble}`}>
                      Tu consulta anterior está resuelta. Si necesitas algo más,
                      identifiquemos el nuevo motivo.
                    </div>
                  </div>
                )}
                <p className={styles.diagnosticQuestion}>
                  {selectedDiagnostic
                    ? selectedDiagnostic.question
                    : "¿Con qué necesitas ayuda?"}
                </p>
                {!selectedDiagnostic ? (
                  <div className={styles.diagnosticOptions}>
                    {SUPPORT_DIAGNOSTIC_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => {
                          setCategory(option.value);
                          setSubcategory(null);
                          setError(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.categoryBack}
                      onClick={() => {
                        setCategory(null);
                        setSubcategory(null);
                      }}
                    >
                      ← {selectedDiagnostic.label}
                    </button>
                    <div className={styles.diagnosticOptions}>
                      {selectedDiagnostic.options.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={
                            subcategory === option
                              ? styles.diagnosticOptionActive
                              : ""
                          }
                          onClick={() => {
                            setSubcategory(option);
                            setError(null);
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {subcategory && (
                      <p className={styles.detailPrompt}>
                        Perfecto. Escribe los detalles para que el equipo pueda
                        resolverlo más rápido.
                      </p>
                    )}
                  </>
                )}
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
              placeholder={
                diagnosisRequired && !subcategory
                  ? "Selecciona una opción arriba…"
                  : "Cuéntanos los detalles…"
              }
              aria-label="Mensaje para OLFFY"
              maxLength={2000}
              rows={1}
            />
            <button
              type="submit"
              disabled={
                !message.trim() ||
                sending ||
                (diagnosisRequired && (!category || !subcategory))
              }
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
        className={`${styles.launcher} ${
          hasNewReply ? styles.launcherNewReply : ""
        }`}
        onClick={() => {
          setHasNewReply(false);
          setOpen((current) => !current);
        }}
        aria-label={
          open
            ? "Cerrar ayuda OLFFY"
            : unread > 0
              ? `Abrir chat de ayuda OLFFY, ${unread} ${
                  unread === 1 ? "mensaje sin leer" : "mensajes sin leer"
                }`
              : "Abrir chat de ayuda OLFFY"
        }
        aria-expanded={open}
      >
        <Image
          src="/olffy/logo.png"
          alt=""
          width={46}
          height={20}
          className={styles.launcherLogo}
          aria-hidden="true"
        />
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {Math.min(unread, 9)}
          </span>
        )}
      </button>
    </div>
  );
}
