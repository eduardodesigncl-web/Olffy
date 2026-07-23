// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PuntosAuthCard } from "./PuntosAuthCard";

const authActions = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  recover: vi.fn(),
  resend: vi.fn(),
}));

vi.mock("app/cuenta/actions", () => ({
  loginCustomerAction: authActions.login,
  registerCustomerAction: authActions.register,
  requestCustomerPasswordRecoveryAction: authActions.recover,
  resendCustomerConfirmationAction: authActions.resend,
}));

describe("PuntosAuthCard", () => {
  beforeEach(() => {
    authActions.login.mockReset();
    authActions.register.mockReset();
    authActions.recover.mockReset();
    authActions.resend.mockReset();
  });

  afterEach(() => cleanup());

  it("ofrece iniciar sesión o recuperar la contraseña para una cuenta existente", async () => {
    authActions.register.mockResolvedValue({
      ok: false,
      code: "account_exists",
      error: "Ya existe una cuenta asociada a este correo.",
    });

    render(<PuntosAuthCard initialMode="signup" />);
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "Ana Pérez" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Correo" }), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "segura123" },
    });
    fireEvent.change(screen.getByLabelText("Verificar contraseña"), {
      target: { value: "segura123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Este correo ya tiene una cuenta",
        }),
      ).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Restablecer contraseña" }),
    ).toBeTruthy();
  });

  it("explica cómo corregir credenciales inválidas y ofrece recuperación", async () => {
    authActions.login.mockResolvedValue({
      ok: false,
      code: "invalid_credentials",
      error:
        "No pudimos validar el acceso. Revisa que el correo esté bien escrito; si está correcto, la contraseña no coincide.",
    });

    render(<PuntosAuthCard />);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo" }), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "incorrecta123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Revisa que el correo esté bien escrito",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Restablecer contraseña" }),
    ).toBeTruthy();
  });

  it("presenta el aviso de contraseña actualizada como estado destacado", () => {
    render(
      <PuntosAuthCard initialNotice="Tu contraseña fue actualizada. Ya puedes iniciar sesión." />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Tu contraseña fue actualizada",
    );
  });
});
