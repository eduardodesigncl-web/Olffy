"use client";

import { useState, type InputHTMLAttributes } from "react";
import styles from "./PasswordInput.module.css";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  wrapperClassName?: string;
  toggleClassName?: string;
};

export function PasswordInput({
  className = "",
  wrapperClassName = "",
  toggleClassName = "",
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={`${styles.wrapper} ${wrapperClassName}`.trim()}>
      <input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        className={`${styles.input} ${className}`.trim()}
      />
      <button
        type="button"
        className={`${styles.toggle} ${toggleClassName}`.trim()}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
            <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 6 9 6a16.4 16.4 0 0 1-2.1 2.8" />
            <path d="M6.6 6.6C4.4 8.1 3 10 3 10s3.5 6 9 6c1 0 2-.2 2.8-.5" />
          </svg>
        ) : (
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        )}
      </button>
    </span>
  );
}
