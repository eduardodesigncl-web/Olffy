"use client";

import type {
  SupportConversation,
  SupportCustomerContext,
  SupportIssueCategory,
  SupportStatus,
} from "lib/support/types";
import {
  formatSupportDate,
  SUPPORT_DIAGNOSTIC_OPTIONS,
  supportDateKey,
  supportIssueCategoryLabel,
  supportStatusLabel,
} from "lib/support/workflow";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./AdminSupportInbox.module.css";

type InboxPayload = {
  conversations?: SupportConversation[];
  context?: SupportCustomerContext;
  affectedCount?: number;
  warning?: string | null;
  error?: string;
};

type Filter = "all" | SupportStatus;
type InboxView = "active" | "archived";
type BulkIntent = "archive" | "delete" | "delete_all";

function compactDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

function relativeLastSeen(value: string | null) {
  if (!value) return "Sin actividad reciente";
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 60_000),
  );
  if (minutes < 1) return "Última actividad hace menos de 1 min";
  if (minutes < 60) return `Última actividad hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Última actividad hace ${hours} h`;
}

function fulfillmentLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    UNFULFILLED: "Sin preparar",
    PARTIALLY_FULFILLED: "Preparación parcial",
    FULFILLED: "Preparado",
    ON_HOLD: "En espera",
    SCHEDULED: "Programado",
    OPEN: "Abierto",
    PENDING: "Pendiente",
    IN_TRANSIT: "En tránsito",
    OUT_FOR_DELIVERY: "En reparto",
    READY_FOR_PICKUP: "Listo para retiro",
    DELIVERED: "Entregado",
    DELAYED: "Con retraso",
  };
  return value ? (labels[value] ?? value.replaceAll("_", " ")) : "Pendiente";
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1300);
        });
      }}
    >
      {copied ? "Copiado" : label}
    </button>
  );
}

export function AdminSupportInbox() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<InboxView>("active");
  const [selectedConversationIds, setSelectedConversationIds] = useState<
    string[]
  >([]);
  const [bulkIntent, setBulkIntent] = useState<BulkIntent | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | SupportIssueCategory
  >("all");
  const [context, setContext] = useState<SupportCustomerContext | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [reply, setReply] = useState("");
  const [resolutionMessage, setResolutionMessage] = useState(
    "Marcamos tu consulta como resuelta. Si todavía necesitas ayuda, puedes responder por este mismo chat.",
  );
  const [resolving, setResolving] = useState(false);
  const [archiveConfirming, setArchiveConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (manual = false) => {
      if (manual) {
        setRefreshing(true);
        setError(null);
        setSuccess(null);
      }
      try {
        const response = await fetch(
          `/api/admin/support${view === "archived" ? "?archived=1" : ""}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as InboxPayload;
        if (!response.ok) throw new Error(payload.error || "No se pudo cargar");
        setConversations(payload.conversations ?? []);
        setSelectedConversationIds((current) =>
          current.filter((id) =>
            payload.conversations?.some((item) => item.id === id),
          ),
        );
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
        setLastUpdatedAt(new Date());
        if (manual) setSuccess("Bandeja actualizada correctamente.");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo cargar");
      } finally {
        setLoading(false);
        if (manual) setRefreshing(false);
      }
    },
    [view],
  );

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 7000);
    return () => window.clearInterval(interval);
  }, [load]);

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId],
  );
  const filtered = useMemo(
    () =>
      conversations.filter(
        (item) =>
          (filter === "all" || item.status === filter) &&
          (categoryFilter === "all" || item.issueCategory === categoryFilter),
      ),
    [categoryFilter, conversations, filter],
  );
  const counts = useMemo(
    () => ({
      new: conversations.filter((item) => item.status === "new").length,
      inProgress: conversations.filter((item) => item.status === "in_progress")
        .length,
      waiting: conversations.filter(
        (item) => item.status === "waiting_information",
      ).length,
      resolved: conversations.filter(
        (item) =>
          item.status === "resolved" &&
          item.resolvedAt &&
          supportDateKey(item.resolvedAt) === supportDateKey(new Date()),
      ).length,
    }),
    [conversations],
  );

  useEffect(() => {
    if (selectedId && filtered.some((item) => item.id === selectedId)) return;
    setSelectedId(filtered[0]?.id ?? null);
  }, [filtered, selectedId]);

  useEffect(() => {
    setResolving(false);
    setArchiveConfirming(false);
  }, [selectedId, view]);

  useEffect(() => {
    setSelectedConversationIds([]);
    setBulkIntent(null);
  }, [categoryFilter, filter, view]);

  useEffect(() => {
    if (!selectedId) {
      setContext(null);
      setContextLoading(false);
      return;
    }
    const controller = new AbortController();
    setContextLoading(true);
    void fetch(
      `/api/admin/support?conversationId=${encodeURIComponent(selectedId)}`,
      {
        cache: "no-store",
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const payload = (await response.json()) as InboxPayload;
        if (!response.ok) throw new Error(payload.error || "No se pudo cargar");
        setContext(payload.context ?? null);
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setContext(null);
        setError(
          cause instanceof Error ? cause.message : "No se pudo cargar la ficha",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setContextLoading(false);
      });
    return () => controller.abort();
  }, [selectedId]);

  useEffect(() => {
    if (!selected || selected.unreadAdmin === 0) return;
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
  }, [selected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [selected?.messages.length]);

  const perform = async (
    action:
      | "reply"
      | "reply_chat"
      | "reply_chat_email"
      | "request_information"
      | "information_received"
      | "resolve"
      | "reopen"
      | "archive"
      | "restore"
      | "retry_email",
    options?: { message?: string; messageId?: number },
  ) => {
    if (!selected || sending) return false;
    setSending(true);
    setError(null);
    setWarning(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          conversationId: selected.id,
          message: options?.message,
          messageId: options?.messageId,
          requestId: action === "retry_email" ? undefined : crypto.randomUUID(),
        }),
      });
      const payload = (await response.json()) as InboxPayload;
      if (payload.conversations) setConversations(payload.conversations);
      if (!response.ok)
        throw new Error(payload.error || "No se pudo actualizar");
      setWarning(payload.warning ?? null);
      setSuccess(
        action === "reply_chat"
          ? "Respuesta enviada por chat."
          : action === "reply_chat_email"
            ? payload.warning
              ? "Respuesta enviada por chat; falta reenviar el correo."
              : "Respuesta enviada por chat y correo."
            : action === "reply"
              ? payload.warning
                ? "Respuesta guardada en el chat."
                : "Respuesta enviada por chat y correo."
              : action === "archive"
                ? "Conversación retirada de la bandeja activa."
                : action === "restore"
                  ? "Conversación restaurada en la bandeja activa."
                  : "Consulta actualizada correctamente.",
      );
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo actualizar",
      );
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendReply = async (channel: "reply_chat" | "reply_chat_email") => {
    const message = reply.trim();
    if (!message) return;
    if (await perform(channel, { message })) setReply("");
  };

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((item) => selectedConversationIds.includes(item.id));

  const toggleConversationSelection = (conversationId: string) => {
    setSelectedConversationIds((current) =>
      current.includes(conversationId)
        ? current.filter((id) => id !== conversationId)
        : [...current, conversationId],
    );
  };

  const toggleAllFiltered = () => {
    const filteredIds = filtered.map((item) => item.id);
    setSelectedConversationIds((current) =>
      allFilteredSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : [...new Set([...current, ...filteredIds])],
    );
  };

  const performBulk = async (intent: BulkIntent) => {
    if (sending) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const action =
        intent === "archive"
          ? "archive_many"
          : intent === "delete"
            ? "delete_archived"
            : "delete_all_archived";
      const response = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          conversationIds:
            intent === "delete_all" ? undefined : selectedConversationIds,
        }),
      });
      const payload = (await response.json()) as InboxPayload;
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo completar la acción");
      }
      setConversations(payload.conversations ?? []);
      setSelectedConversationIds([]);
      setBulkIntent(null);
      const total = payload.affectedCount ?? 0;
      setSuccess(
        intent === "archive"
          ? `${total} ${total === 1 ? "conversación archivada" : "conversaciones archivadas"}.`
          : `${total} ${total === 1 ? "conversación eliminada permanentemente" : "conversaciones eliminadas permanentemente"}.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>ATENCIÓN AL CLIENTE</span>
          <h1>Centro de soporte</h1>
          <p>
            Diagnóstico guiado, conversación y contexto de pedidos en un solo
            lugar.
          </p>
        </div>
        <div className={styles.refreshGroup}>
          {lastUpdatedAt && (
            <small>
              Actualizado a las{" "}
              {lastUpdatedAt.toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          )}
          <button
            type="button"
            className={styles.refresh}
            onClick={() => void load(true)}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing ? "Actualizando…" : "Actualizar bandeja"}
          </button>
        </div>
      </header>

      <div className={styles.summary}>
        <article>
          <span>Nuevas</span>
          <strong>{counts.new}</strong>
        </article>
        <article>
          <span>En atención</span>
          <strong>{counts.inProgress}</strong>
        </article>
        <article>
          <span>Esperando información</span>
          <strong>{counts.waiting}</strong>
        </article>
        <article>
          <span>Resueltas hoy</span>
          <strong>{counts.resolved}</strong>
        </article>
      </div>

      <nav className={styles.filters} aria-label="Filtrar consultas">
        {(
          [
            ["all", "Todas"],
            ["new", "Nuevas"],
            ["in_progress", "En atención"],
            ["waiting_information", "Esperando información"],
            ["resolved", "Resueltas"],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={filter === value ? styles.filterActive : ""}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
          >
            {label}
          </button>
        ))}
      </nav>

      <nav className={styles.queueTabs} aria-label="Vista de conversaciones">
        <button
          type="button"
          className={view === "active" ? styles.queueTabActive : ""}
          aria-pressed={view === "active"}
          onClick={() => {
            setConversations([]);
            setSelectedId(null);
            setLoading(true);
            setView("active");
          }}
        >
          Bandeja activa
        </button>
        <button
          type="button"
          className={view === "archived" ? styles.queueTabActive : ""}
          aria-pressed={view === "archived"}
          onClick={() => {
            setConversations([]);
            setSelectedId(null);
            setLoading(true);
            setView("archived");
          }}
        >
          Archivados
        </button>
      </nav>

      <nav className={styles.categoryFilters} aria-label="Filtrar por motivo">
        <span>Motivo</span>
        <button
          type="button"
          className={categoryFilter === "all" ? styles.filterActive : ""}
          onClick={() => setCategoryFilter("all")}
          aria-pressed={categoryFilter === "all"}
        >
          Todos
        </button>
        {SUPPORT_DIAGNOSTIC_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.value}
            className={
              categoryFilter === option.value ? styles.filterActive : ""
            }
            onClick={() => setCategoryFilter(option.value)}
            aria-pressed={categoryFilter === option.value}
          >
            {option.label}
          </button>
        ))}
      </nav>

      <section className={styles.panel} aria-label="Bandeja de consultas">
        {bulkIntent && (
          <div className={styles.bulkConfirmBackdrop}>
            <div
              className={styles.bulkConfirm}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="bulk-support-title"
            >
              <strong id="bulk-support-title">
                {bulkIntent === "archive"
                  ? `¿Archivar ${selectedConversationIds.length} conversaciones?`
                  : bulkIntent === "delete"
                    ? `¿Borrar permanentemente ${selectedConversationIds.length} conversaciones?`
                    : `¿Vaciar las ${conversations.length} conversaciones archivadas?`}
              </strong>
              <p>
                {bulkIntent === "archive"
                  ? "Se moverán a Archivados y podrás restaurarlas después."
                  : "Esta acción elimina definitivamente las conversaciones y todos sus mensajes. No se puede deshacer."}
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => setBulkIntent(null)}
                  disabled={sending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={
                    bulkIntent === "archive"
                      ? styles.confirmArchiveButton
                      : styles.confirmDeleteButton
                  }
                  onClick={() => void performBulk(bulkIntent)}
                  disabled={sending}
                >
                  {sending
                    ? "Procesando…"
                    : bulkIntent === "archive"
                      ? "Archivar seleccionadas"
                      : "Borrar definitivamente"}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.workspace}>
          <aside className={styles.list} aria-label="Conversaciones">
            <div className={styles.listHead}>
              <label className={styles.selectAllControl}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                  disabled={filtered.length === 0}
                  aria-label="Seleccionar todas las conversaciones visibles"
                />
                <span aria-hidden="true" />
                <strong>Conversaciones</strong>
              </label>
              <span className={styles.listCount}>{filtered.length}</span>
            </div>
            {(selectedConversationIds.length > 0 ||
              (view === "archived" && conversations.length > 0)) && (
              <div className={styles.bulkToolbar}>
                {selectedConversationIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setBulkIntent(view === "active" ? "archive" : "delete")
                    }
                  >
                    {view === "active"
                      ? `Archivar (${selectedConversationIds.length})`
                      : `Borrar (${selectedConversationIds.length})`}
                  </button>
                )}
                {view === "archived" && conversations.length > 0 && (
                  <button
                    type="button"
                    className={styles.deleteAllButton}
                    onClick={() => setBulkIntent("delete_all")}
                  >
                    Vaciar archivados
                  </button>
                )}
              </div>
            )}
            {loading && conversations.length === 0 && (
              <p className={styles.empty}>Cargando consultas…</p>
            )}
            {!loading && filtered.length === 0 && (
              <p className={styles.empty}>No hay consultas en este estado.</p>
            )}
            {filtered.map((conversation) => {
              const last =
                [...conversation.messages]
                  .reverse()
                  .find((message) => message.sender !== "system") ??
                conversation.messages.at(-1);
              return (
                <div className={styles.listItemRow} key={conversation.id}>
                  <label className={styles.conversationCheck}>
                    <input
                      type="checkbox"
                      checked={selectedConversationIds.includes(
                        conversation.id,
                      )}
                      onChange={() =>
                        toggleConversationSelection(conversation.id)
                      }
                      aria-label={`Seleccionar conversación de ${conversation.customerName || conversation.customerEmail}`}
                    />
                    <span aria-hidden="true" />
                  </label>
                  <button
                    type="button"
                    className={`${styles.listItem} ${conversation.id === selectedId ? styles.listItemActive : ""}`}
                    onClick={() => {
                      setSelectedId(conversation.id);
                      setDetailsOpen(true);
                    }}
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
                    <span className={styles.listMeta}>
                      <b>{supportStatusLabel(conversation.status)}</b>
                      <em>
                        {conversation.handledByAdminName || "Sin atender"}
                      </em>
                    </span>
                    <span className={styles.categoryTag}>
                      {supportIssueCategoryLabel(conversation.issueCategory)}
                      {conversation.issueSubcategory
                        ? ` · ${conversation.issueSubcategory}`
                        : ""}
                    </span>
                    <span className={styles.preview}>
                      {last?.body || "Sin mensajes"}
                    </span>
                    {conversation.relatedOrderName && (
                      <span className={styles.orderHint}>
                        {conversation.relatedOrderName}
                      </span>
                    )}
                    <time title={formatSupportDate(conversation.lastMessageAt)}>
                      {formatSupportDate(conversation.lastMessageAt)}
                    </time>
                  </button>
                </div>
              );
            })}
          </aside>

          <div className={styles.thread}>
            {selected ? (
              <>
                <div className={styles.threadHeader}>
                  <button
                    type="button"
                    className={styles.customerHeader}
                    onClick={() => setDetailsOpen((current) => !current)}
                    aria-expanded={detailsOpen}
                  >
                    <span className={styles.avatar}>
                      {(selected.customerName || selected.customerEmail)
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                    <span className={styles.customerIdentity}>
                      <strong>
                        #{selected.reference} ·{" "}
                        {selected.customerName || "Cliente OLFFY"}
                      </strong>
                      <small>
                        Iniciada el {formatSupportDate(selected.createdAt)}
                        {selected.issueCategory
                          ? ` · ${supportIssueCategoryLabel(selected.issueCategory)}`
                          : ""}
                        {selected.issueSubcategory
                          ? ` · ${selected.issueSubcategory}`
                          : ""}
                      </small>
                    </span>
                    <span className={styles.statusBadge}>
                      {supportStatusLabel(selected.status)}
                    </span>
                    <span className={styles.detailCue}>
                      {detailsOpen ? "Ocultar ficha" : "Ver ficha"}
                    </span>
                  </button>
                  <div className={styles.caseOverview}>
                    <div className={styles.caseFact}>
                      <span
                        className={
                          selected.customerOnline
                            ? styles.online
                            : styles.offline
                        }
                      >
                        <i /> Estado del cliente
                      </span>
                      <strong>
                        {selected.customerOnline
                          ? "En línea ahora"
                          : "Fuera de línea"}
                      </strong>
                      <small>
                        {selected.customerOnline
                          ? "Disponible para continuar por chat"
                          : relativeLastSeen(selected.customerLastSeenAt)}
                      </small>
                    </div>
                    <div className={styles.caseFact}>
                      <span>Responsable</span>
                      <strong>
                        {selected.handledByAdminName || "Sin asignar"}
                      </strong>
                      <small>
                        {selected.handledByAdminEmail ||
                          "Se asignará al responder"}
                      </small>
                    </div>
                    <div className={styles.caseFact}>
                      <span>Canal de respuesta</span>
                      <strong>Chat + correo</strong>
                      <small>{selected.customerEmail}</small>
                    </div>
                  </div>
                  <div className={styles.threadActions}>
                    {view === "active" && selected.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => void perform("request_information")}
                        disabled={sending}
                      >
                        Solicitar información por correo
                      </button>
                    )}
                    {view === "active" &&
                      selected.status === "waiting_information" && (
                        <button
                          type="button"
                          onClick={() => void perform("information_received")}
                          disabled={sending}
                        >
                          Información recibida
                        </button>
                      )}
                    {view === "active" && selected.status === "resolved" ? (
                      <button
                        type="button"
                        onClick={() => void perform("reopen")}
                        disabled={sending}
                      >
                        Reabrir
                      </button>
                    ) : view === "active" ? (
                      <button
                        type="button"
                        className={styles.resolveButton}
                        onClick={() => setResolving(true)}
                        disabled={sending}
                      >
                        Resolver consulta
                      </button>
                    ) : null}
                    {view === "active" ? (
                      <button
                        type="button"
                        className={styles.archiveButton}
                        onClick={() => setArchiveConfirming(true)}
                        disabled={sending}
                      >
                        Eliminar de la bandeja
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.restoreButton}
                        onClick={() => void perform("restore")}
                        disabled={sending}
                      >
                        Restaurar en bandeja activa
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.messages} ref={scrollRef}>
                  <div className={styles.startedEvent}>
                    Consulta iniciada el {formatSupportDate(selected.createdAt)}
                  </div>
                  {selected.messages.map((message) =>
                    message.sender === "system" ? (
                      <div className={styles.systemMessage} key={message.id}>
                        <strong>{message.senderName}</strong>
                        <span>{message.body}</span>
                        <time title={formatSupportDate(message.createdAt)}>
                          {formatSupportDate(message.createdAt)}
                        </time>
                        {message.emailStatus === "failed" && (
                          <span className={styles.systemEmailFailure}>
                            El correo no pudo enviarse.
                            <button
                              type="button"
                              onClick={() =>
                                void perform("retry_email", {
                                  messageId: message.id,
                                })
                              }
                              disabled={sending}
                            >
                              Reintentar correo
                            </button>
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        key={message.id}
                        className={`${styles.messageRow} ${message.sender === "admin" ? styles.adminRow : styles.clientRow}`}
                      >
                        <div className={styles.messageBubble}>
                          <strong className={styles.messageAuthor}>
                            {message.senderName}
                          </strong>
                          <p>{message.body}</p>
                          <time title={formatSupportDate(message.createdAt)}>
                            {formatSupportDate(message.createdAt)}
                          </time>
                          {message.sender === "admin" &&
                            message.deliveryChannel === "chat_and_email" &&
                            message.emailStatus === "sent" && (
                              <small>Chat + correo enviado</small>
                            )}
                          {message.sender === "admin" &&
                            message.emailStatus === "failed" && (
                              <span className={styles.emailFailure}>
                                La respuesta quedó en el chat, pero el correo no
                                pudo enviarse.
                                <button
                                  type="button"
                                  onClick={() =>
                                    void perform("retry_email", {
                                      messageId: message.id,
                                    })
                                  }
                                  disabled={sending}
                                >
                                  Reintentar correo
                                </button>
                              </span>
                            )}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {archiveConfirming ? (
                  <div className={styles.archiveBox}>
                    <strong>¿Retirar esta conversación?</strong>
                    <p>
                      Se moverá a Archivados para limpiar la zona de trabajo. El
                      historial no se borra y podrás restaurarlo cuando lo
                      necesites.
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => setArchiveConfirming(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() =>
                          void perform("archive").then((ok) => {
                            if (ok) setArchiveConfirming(false);
                          })
                        }
                      >
                        {sending ? "Archivando…" : "Archivar conversación"}
                      </button>
                    </div>
                  </div>
                ) : resolving ? (
                  <div className={styles.resolveBox}>
                    <strong>Resolver consulta</strong>
                    <p>¿La consulta quedó solucionada?</p>
                    <textarea
                      value={resolutionMessage}
                      onChange={(event) =>
                        setResolutionMessage(event.target.value)
                      }
                      maxLength={2000}
                      rows={3}
                    />
                    <div>
                      <button type="button" onClick={() => setResolving(false)}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={sending || !resolutionMessage.trim()}
                        onClick={() =>
                          void perform("resolve", {
                            message: resolutionMessage.trim(),
                          }).then((ok) => {
                            if (ok) setResolving(false);
                          })
                        }
                      >
                        Resolver
                      </button>
                    </div>
                  </div>
                ) : view === "archived" ? (
                  <div className={styles.archivedNotice}>
                    <strong>Conversación archivada</strong>
                    <span>
                      Restáurala para responder o cambiar su estado. Si el
                      cliente escribe, volverá automáticamente a la bandeja
                      activa.
                    </span>
                  </div>
                ) : (
                  <div className={styles.replyBox}>
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Escribe una respuesta…"
                      maxLength={2000}
                      rows={3}
                      disabled={selected.status === "resolved"}
                    />
                    <div className={styles.replyActions}>
                      <button
                        type="button"
                        className={styles.chatButton}
                        onClick={() => void sendReply("reply_chat")}
                        disabled={
                          !reply.trim() ||
                          sending ||
                          selected.status === "resolved"
                        }
                      >
                        {sending ? "Enviando…" : "Enviar por chat"}
                      </button>
                      <button
                        type="button"
                        className={styles.emailButton}
                        onClick={() => void sendReply("reply_chat_email")}
                        disabled={
                          !reply.trim() ||
                          sending ||
                          selected.status === "resolved"
                        }
                      >
                        {sending ? "Enviando…" : "Enviar por chat + correo"}
                      </button>
                    </div>
                    <p>
                      El correo incluirá número de caso, motivo y pedido
                      relacionado para que la respuesta tenga contexto.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noSelection}>Selecciona una consulta.</div>
            )}
          </div>

          {selected && detailsOpen && (
            <aside
              className={styles.customerPanel}
              aria-label="Ficha del cliente"
            >
              <div className={styles.customerPanelHead}>
                <div>
                  <span>FICHA DE SOPORTE</span>
                  <h2>Información del cliente</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  aria-label="Ocultar ficha"
                >
                  ×
                </button>
              </div>
              {contextLoading ? (
                <p className={styles.contextLoading}>Consultando Shopify…</p>
              ) : context ? (
                <>
                  <dl className={styles.profileList}>
                    <div>
                      <dt>Nombre</dt>
                      <dd>{context.customer.name}</dd>
                    </div>
                    <div>
                      <dt>Correo</dt>
                      <dd>
                        {context.customer.email}
                        <CopyButton
                          value={context.customer.email}
                          label="Copiar"
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>Teléfono</dt>
                      <dd>
                        {context.customer.phone || "Sin registrar"}
                        {context.customer.phone && (
                          <CopyButton
                            value={context.customer.phone}
                            label="Copiar"
                          />
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Puntos</dt>
                      <dd>
                        {context.customer.pointsBalance.toLocaleString("es-CL")}{" "}
                        pts
                      </dd>
                    </div>
                    <div>
                      <dt>Cliente desde</dt>
                      <dd>{compactDate(context.customer.memberSince)}</dd>
                    </div>
                    <div>
                      <dt>Cuenta</dt>
                      <dd>
                        {context.customer.status === "active"
                          ? "Activa"
                          : "Bloqueada"}
                      </dd>
                    </div>
                  </dl>
                  {context.customer.shopifyCustomerUrl && (
                    <a
                      className={styles.secondaryLink}
                      href={context.customer.shopifyCustomerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver cliente en Shopify
                    </a>
                  )}
                  <div className={styles.orderSection}>
                    <div className={styles.sectionTitle}>
                      <span>Pedido en curso</span>
                      {context.activeOrder && <i>Activo</i>}
                    </div>
                    {context.activeOrder ? (
                      <article className={styles.activeOrder}>
                        <div className={styles.orderTop}>
                          <strong>{context.activeOrder.name}</strong>
                          <CopyButton
                            value={context.activeOrder.name}
                            label="Copiar"
                          />
                          <time>
                            {compactDate(context.activeOrder.createdAt)}
                          </time>
                        </div>
                        <div className={styles.orderStatus}>
                          <span>
                            {fulfillmentLabel(
                              context.activeOrder.deliveryStatus ||
                                context.activeOrder.fulfillmentStatus,
                            )}
                          </span>
                          <small>{context.activeOrder.financialStatus}</small>
                        </div>
                        <div className={styles.trackingBox}>
                          <span>Código de seguimiento</span>
                          <strong>
                            {context.activeOrder.trackingNumber ||
                              "Aún sin código"}
                          </strong>
                          {context.activeOrder.trackingNumber && (
                            <CopyButton
                              value={context.activeOrder.trackingNumber}
                              label="Copiar código"
                            />
                          )}
                          {context.activeOrder.trackingCompany && (
                            <small>{context.activeOrder.trackingCompany}</small>
                          )}
                        </div>
                        <a
                          className={styles.shopifyButton}
                          href={context.activeOrder.shopifyAdminUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir pedido exacto en Shopify
                        </a>
                        {context.activeOrder.trackingUrl && (
                          <a
                            className={styles.trackingLink}
                            href={context.activeOrder.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Seguir envío
                          </a>
                        )}
                      </article>
                    ) : (
                      <p className={styles.noOrder}>
                        No hay pedidos activos para este correo.
                      </p>
                    )}
                  </div>
                  {context.recentOrders.length > 0 && (
                    <div className={styles.recentOrders}>
                      <span className={styles.sectionLabel}>
                        Pedidos recientes
                      </span>
                      {context.recentOrders.map((order) => (
                        <a
                          key={order.id}
                          href={order.shopifyAdminUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <strong>{order.name}</strong>
                          <small>
                            {compactDate(order.createdAt)} ·{" "}
                            {fulfillmentLabel(
                              order.deliveryStatus || order.fulfillmentStatus,
                            )}
                          </small>
                        </a>
                      ))}
                    </div>
                  )}
                  {context.shopifyError && (
                    <p className={styles.shopifyError}>
                      Shopify: {context.shopifyError}
                    </p>
                  )}
                </>
              ) : (
                <p className={styles.contextLoading}>
                  Sin información disponible.
                </p>
              )}
            </aside>
          )}
        </div>
        {success && (
          <div className={styles.success} role="status">
            {success}
          </div>
        )}
        {warning && (
          <div className={styles.warning} role="status">
            {warning}
          </div>
        )}
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
