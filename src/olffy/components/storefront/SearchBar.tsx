import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Input de búsqueda controlado — usado en Tienda (y reutilizable en
// Novedades u otras páginas de catálogo).
export function SearchBar({ value, onChange, placeholder = 'Buscar productos...' }: SearchBarProps) {
  return (
    <div className={styles.wrap}>
      <svg className={styles.icon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
