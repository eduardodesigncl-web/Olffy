import { describe, expect, it } from "vitest";
import {
  normalizeCustomerEmail,
  validateCustomerEmail,
  validateCustomerName,
  validateCustomerPassword,
} from "./auth-input";

describe("customer auth input", () => {
  it("normaliza el correo antes de usarlo como identidad", () => {
    expect(normalizeCustomerEmail("  Cliente@Ejemplo.CL ")).toBe(
      "cliente@ejemplo.cl",
    );
  });

  it("rechaza correos inválidos", () => {
    expect(() => validateCustomerEmail("cliente-sin-dominio")).toThrow(
      "correo electrónico válido",
    );
  });

  it("normaliza espacios en el nombre", () => {
    expect(validateCustomerName("  Ana   Pérez  ")).toBe("Ana Pérez");
  });

  it("exige al menos ocho caracteres", () => {
    expect(() => validateCustomerPassword("corta1")).toThrow(
      "al menos 8 caracteres",
    );
  });

  it("exige que ambas contraseñas coincidan", () => {
    expect(() => validateCustomerPassword("segura123", "distinta123")).toThrow(
      "no coinciden",
    );
  });

  it("acepta una contraseña válida", () => {
    expect(validateCustomerPassword("segura123", "segura123")).toBe(
      "segura123",
    );
  });
});
