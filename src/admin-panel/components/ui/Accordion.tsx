import { useState } from "react";
import styles from "./Accordion.module.css";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

// Acordeón genérico (una sola respuesta abierta a la vez) — usado en el FAQ
// de Contacto y reutilizable en cualquier otra lista de pregunta/respuesta.
export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      {items.map((item) => {
        const isOpen = item.id === openId;
        return (
          <div key={item.id} className={styles.item}>
            <button
              type="button"
              className={styles.trigger}
              onClick={() => toggle(item.id)}
            >
              <span className={styles.question}>{item.question}</span>
              <span
                className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}
              >
                +
              </span>
            </button>
            <div
              className={styles.answerWrap}
              style={{ maxHeight: isOpen ? "240px" : "0" }}
            >
              <p className={styles.answer}>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
