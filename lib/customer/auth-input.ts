export const CUSTOMER_PASSWORD_MIN_LENGTH = 8;
export const CUSTOMER_PASSWORD_MAX_LENGTH = 128;

export function normalizeCustomerEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateCustomerEmail(value: string) {
  const email = normalizeCustomerEmail(value);

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("Ingresa un correo electrónico válido.");
  }

  return email;
}

export function validateCustomerName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");

  if (name.length < 2 || name.length > 100) {
    throw new Error("Ingresa un nombre válido de hasta 100 caracteres.");
  }

  return name;
}

export function validateCustomerPassword(
  password: string,
  confirmation?: string,
) {
  if (password.length < CUSTOMER_PASSWORD_MIN_LENGTH) {
    throw new Error(
      `La contraseña debe tener al menos ${CUSTOMER_PASSWORD_MIN_LENGTH} caracteres.`,
    );
  }

  if (password.length > CUSTOMER_PASSWORD_MAX_LENGTH) {
    throw new Error(
      `La contraseña no puede superar ${CUSTOMER_PASSWORD_MAX_LENGTH} caracteres.`,
    );
  }

  if (confirmation !== undefined && password !== confirmation) {
    throw new Error("Las contraseñas no coinciden.");
  }

  return password;
}
