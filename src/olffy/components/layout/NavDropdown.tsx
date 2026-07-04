import { useState } from "react";
import styles from "./NavDropdown.module.css";

export interface NavDropdownItem {
  label: string;
  onClick: () => void;
}

interface NavDropdownProps {
  label: string;
  onLabelClick: () => void;
  items: NavDropdownItem[];
}

// Link de navbar desktop con submenú al hover (Tienda / Novedades / Regalos
// en el original). El click en el label principal también navega.
export function NavDropdown({ label, onLabelClick, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={styles.wrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className={styles.trigger} onClick={onLabelClick}>
        {label} <span className={styles.caret}>▾</span>
      </button>
      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
        {items.map((item) => (
          <button
            key={item.label}
            className={styles.item}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
