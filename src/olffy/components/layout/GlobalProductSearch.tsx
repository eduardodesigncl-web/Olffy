"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  isSearchableQuery,
  MIN_QUERY_LENGTH,
  normalizeSearchText,
  type SearchResultDto,
} from "lib/search/product-search";
import styles from "./GlobalProductSearch.module.css";

// Milisegundos desde la última pulsación hasta la búsqueda automática.
// Enter cancela este temporizador y busca de inmediato.
export const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedSearch = {
  expiresAt: number;
  results: SearchResultDto[];
};

type SearchStatus =
  | "idle" // sin consulta suficiente: texto de ayuda
  | "typing" // esperando el debounce, sin spinner todavía
  | "loading"
  | "results"
  | "empty"
  | "error";

interface GlobalProductSearchProps {
  open: boolean;
  onClose: () => void;
  onOpenProduct: (handle: string) => void;
  onViewAll: (query: string) => void;
}

// Burbuja de búsqueda global bajo la navbar + overlay que difumina y bloquea
// el contenido de fondo. El cliente solo habla con /api/storefront/search;
// nunca con Shopify directamente.
export function GlobalProductSearch({
  open,
  onClose,
  onOpenProduct,
  onViewAll,
}: GlobalProductSearchProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<SearchResultDto[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, CachedSearch>());
  // Contador de versión: una respuesta solo puede aplicar si sigue siendo la
  // última búsqueda lanzada (protege contra respuestas fuera de orden).
  const versionRef = useRef(0);

  const listboxId = useId();

  const cancelPending = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    versionRef.current += 1;
  }, []);

  const reset = useCallback(() => {
    cancelPending();
    setQuery("");
    setResults([]);
    setStatus("idle");
    setActiveIndex(-1);
  }, [cancelPending]);

  // Autofocus al abrir; al cerrar se limpia el estado y el padre devuelve el
  // foco a la lupa.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      return;
    }
    reset();
  }, [open, reset]);

  useEffect(() => cancelPending, [cancelPending]);

  const executeSearch = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!isSearchableQuery(trimmed)) return;

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    abortRef.current?.abort();
    const version = ++versionRef.current;
    setActiveIndex(-1);

    const cacheKey = normalizeSearchText(trimmed);
    const cached = cacheRef.current.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setResults(cached.results);
      setStatus(cached.results.length ? "results" : "empty");
      return;
    }
    if (cached) cacheRef.current.delete(cacheKey);

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");

    try {
      const response = await fetch(
        `/api/storefront/search?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error(`search_http_${response.status}`);
      const data = (await response.json()) as { results: SearchResultDto[] };

      if (version !== versionRef.current) return;
      cacheRef.current.set(cacheKey, {
        expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
        results: data.results,
      });
      setResults(data.results);
      setStatus(data.results.length ? "results" : "empty");
    } catch (error) {
      if (controller.signal.aborted || version !== versionRef.current) return;
      console.error("Búsqueda OLFFY falló", error);
      setResults([]);
      setStatus("error");
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    // Un texto nuevo invalida resultados y solicitudes de la consulta previa.
    cancelPending();
    setResults([]);

    if (!isSearchableQuery(value.trim())) {
      setStatus("idle");
      return;
    }

    setStatus("typing");
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void executeSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const selectResult = (result: SearchResultDto) => {
    onClose();
    onOpenProduct(result.handle);
  };

  const viewAll = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    onViewAll(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const active = activeIndex >= 0 ? results[activeIndex] : undefined;
      if (active) {
        selectResult(active);
        return;
      }
      void executeSearch(query);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay: oscurece + difumina y bloquea el contenido bajo la navbar. */}
      <div
        className={styles.overlay}
        onClick={onClose}
        aria-hidden="true"
        data-testid="search-overlay"
      />

      {/* Contenedor sticky de alto 0: mantiene la burbuja pegada bajo la
          navbar sin depender de mediciones de scroll. */}
      <div className={styles.anchor}>
        <div
          id="global-product-search"
          className={styles.panel}
          role="dialog"
          aria-label="Buscar productos"
        >
          <div className={styles.inputRow}>
            <svg
              className={styles.inputIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              role="combobox"
              aria-label="Buscar productos"
              aria-expanded={status === "results"}
              aria-controls={listboxId}
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
              }
              aria-autocomplete="list"
              placeholder="Buscar cuadernos, planners, stickers..."
              value={query}
              onChange={(event) => handleChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar búsqueda"
            >
              ✕
            </button>
          </div>

          <div className={styles.body} aria-live="polite">
            {status === "idle" && (
              <p className={styles.hint}>
                Escribe al menos {MIN_QUERY_LENGTH} letras para buscar en la
                tienda.
              </p>
            )}

            {status === "typing" && (
              <p className={styles.hint}>
                Escribe para buscar; presiona Enter para buscar ahora.
              </p>
            )}

            {status === "loading" && (
              <p className={styles.hint} data-testid="search-loading">
                Buscando productos…
              </p>
            )}

            {status === "empty" && (
              <div className={styles.emptyState}>
                <p>No encontramos productos para “{query.trim()}”.</p>
                <button
                  type="button"
                  className={styles.viewAllBtn}
                  onClick={viewAll}
                >
                  Explorar la tienda completa
                </button>
              </div>
            )}

            {status === "error" && (
              <div className={styles.emptyState}>
                <p>No pudimos completar la búsqueda.</p>
                <button
                  type="button"
                  className={styles.viewAllBtn}
                  onClick={() => void executeSearch(query)}
                >
                  Reintentar
                </button>
              </div>
            )}

            {status === "results" && (
              <>
                <ul
                  id={listboxId}
                  className={styles.results}
                  role="listbox"
                  aria-label="Resultados de búsqueda"
                >
                  {results.map((result, index) => (
                    <li key={result.handle} role="presentation">
                      <button
                        type="button"
                        id={`${listboxId}-${index}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        className={`${styles.result} ${
                          index === activeIndex ? styles.resultActive : ""
                        }`}
                        onClick={() => selectResult(result)}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        <span className={styles.resultThumb} aria-hidden="true">
                          {result.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={result.image} alt="" loading="lazy" />
                          ) : null}
                        </span>
                        <span className={styles.resultInfo}>
                          <span className={styles.resultName}>
                            {result.name}
                          </span>
                          <span className={styles.resultCat}>{result.cat}</span>
                        </span>
                        <span className={styles.resultMeta}>
                          <span className={styles.resultPrice}>
                            {result.price}
                          </span>
                          <span
                            className={
                              result.availableForSale
                                ? styles.resultStock
                                : styles.resultOutOfStock
                            }
                          >
                            {result.availableForSale ? "Disponible" : "Agotado"}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={styles.viewAllBtn}
                  onClick={viewAll}
                >
                  Ver todos los resultados →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
