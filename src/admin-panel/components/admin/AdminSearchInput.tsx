// @ts-nocheck
import styles from "./AdminSearchInput.module.css";

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Input de búsqueda del panel admin (controlado). Reutilizable en las
// distintas secciones que necesiten filtrar listas.
export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: AdminSearchInputProps) {
  return (
    <div className={styles.wrap}>
      <svg
        className={styles.icon}
        width="15"
        height="15"
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
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
