// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchResultDto } from "lib/search/product-search";
import { GlobalProductSearch, SEARCH_DEBOUNCE_MS } from "./GlobalProductSearch";

const RESULT_PLANNER: SearchResultDto = {
  handle: "planner-semanal",
  name: "Planner Semanal",
  cat: "Planners",
  price: "$8.990",
  availableForSale: true,
};

const RESULT_CUADERNO: SearchResultDto = {
  handle: "cuaderno-puntos",
  name: "Cuaderno Puntos",
  cat: "Cuadernos",
  price: "$6.990",
  availableForSale: false,
};

function jsonResponse(results: SearchResultDto[]) {
  return {
    ok: true,
    json: async () => ({ query: "", results }),
  } as Response;
}

function renderSearch(
  overrides: Partial<Parameters<typeof GlobalProductSearch>[0]> = {},
) {
  const props = {
    open: true,
    onClose: vi.fn(),
    onOpenProduct: vi.fn(),
    onViewAll: vi.fn(),
    ...overrides,
  };
  const view = render(<GlobalProductSearch {...props} />);
  return { props, view };
}

function searchInput() {
  return screen.getByRole("combobox", { name: "Buscar productos" });
}

describe("GlobalProductSearch", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("focuses the input when opened and shows the help text", () => {
    renderSearch();
    expect(document.activeElement).toBe(searchInput());
    expect(screen.getByText(/al menos 2 letras/i)).toBeTruthy();
  });

  it("does not search with fewer than 2 characters", async () => {
    renderSearch();
    fireEvent.change(searchInput(), { target: { value: "a" } });
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS + 100));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("waits exactly 2.5s after the last keystroke before searching", async () => {
    fetchMock.mockResolvedValue(jsonResponse([RESULT_PLANNER]));
    renderSearch();

    fireEvent.change(searchInput(), { target: { value: "plan" } });
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 100));
    expect(fetchMock).not.toHaveBeenCalled();

    // Una nueva pulsación reinicia el temporizador completo.
    fireEvent.change(searchInput(), { target: { value: "planner" } });
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 100));
    expect(fetchMock).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toContain("q=planner");
    expect(screen.getByText("Planner Semanal")).toBeTruthy();
  });

  it("searches immediately on Enter and cancels the pending timer", async () => {
    fetchMock.mockResolvedValue(jsonResponse([RESULT_PLANNER]));
    renderSearch();

    fireEvent.change(searchInput(), { target: { value: "planner" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // El temporizador del debounce quedó cancelado: no hay segunda llamada.
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS + 100));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ignores an out-of-order response from a previous query", async () => {
    let resolveFirst: (value: Response) => void;
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(jsonResponse([RESULT_CUADERNO]));

    renderSearch();

    fireEvent.change(searchInput(), { target: { value: "planner" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    fireEvent.change(searchInput(), { target: { value: "cuaderno" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(screen.getByText("Cuaderno Puntos")).toBeTruthy();

    // La respuesta antigua llega tarde: no debe reemplazar los resultados.
    await act(async () => {
      resolveFirst!(jsonResponse([RESULT_PLANNER]));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByText("Planner Semanal")).toBeNull();
    expect(screen.getByText("Cuaderno Puntos")).toBeTruthy();
  });

  it("shows the empty state with the query text", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    renderSearch();

    fireEvent.change(searchInput(), { target: { value: "unicornio" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(
      screen.getByText(/No encontramos productos para “unicornio”/),
    ).toBeTruthy();
  });

  it("shows a recoverable error state with retry", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(jsonResponse([RESULT_PLANNER]));
    renderSearch();

    fireEvent.change(searchInput(), { target: { value: "planner" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByText(/No pudimos completar la búsqueda/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByText("Planner Semanal")).toBeTruthy();
  });

  it("closes with Escape, the close button and the overlay", () => {
    const { props, view } = renderSearch();

    fireEvent.keyDown(searchInput(), { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar búsqueda" }));
    expect(props.onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(
      view.container.ownerDocument.querySelector(
        "[data-testid='search-overlay']",
      )!,
    );
    expect(props.onClose).toHaveBeenCalledTimes(3);
  });

  it("opens a result and closes the panel", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([RESULT_PLANNER, RESULT_CUADERNO]),
    );
    const { props } = renderSearch();

    fireEvent.change(searchInput(), { target: { value: "pl" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(0));

    fireEvent.click(screen.getByRole("option", { name: /Planner Semanal/ }));
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onOpenProduct).toHaveBeenCalledWith("planner-semanal");
  });

  it("navigates results with arrow keys and selects with Enter", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([RESULT_PLANNER, RESULT_CUADERNO]),
    );
    const { props } = renderSearch();

    fireEvent.change(searchInput(), { target: { value: "pl" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(0));

    fireEvent.keyDown(searchInput(), { key: "ArrowDown" });
    fireEvent.keyDown(searchInput(), { key: "ArrowDown" });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    expect(props.onOpenProduct).toHaveBeenCalledWith("cuaderno-puntos");
  });

  it("shows availability per result and links to the full store", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([RESULT_PLANNER, RESULT_CUADERNO]),
    );
    const { props } = renderSearch();

    fireEvent.change(searchInput(), { target: { value: "papeleria" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(screen.getByText("Disponible")).toBeTruthy();
    expect(screen.getByText("Agotado")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Ver todos los resultados/ }),
    );
    expect(props.onViewAll).toHaveBeenCalledWith("papeleria");
    expect(props.onClose).toHaveBeenCalled();
  });

  it("clears stale results as soon as the text changes", async () => {
    fetchMock.mockResolvedValue(jsonResponse([RESULT_PLANNER]));
    renderSearch();

    fireEvent.change(searchInput(), { target: { value: "planner" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByText("Planner Semanal")).toBeTruthy();

    fireEvent.change(searchInput(), { target: { value: "cuaderno" } });
    expect(screen.queryByText("Planner Semanal")).toBeNull();
  });
});
