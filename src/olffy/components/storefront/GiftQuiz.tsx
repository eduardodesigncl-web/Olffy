import { useState } from 'react';
import { ProductGrid } from '../product';
import { GiftIcon, type GiftIconName } from './GiftIcon';
import { QuizStepper } from './QuizStepper';
import type { Product, QuizQuestion } from '../../types';
import styles from './GiftQuiz.module.css';

interface GiftQuizProps {
  questions: QuizQuestion[];
  products: Product[];
  onProductClick: (product: Product) => void;
}

// Cuántos productos se muestran de entrada en resultados vs. tras "Ver más".
const INITIAL_RESULTS = 3;
const MAX_RESULTS = 8;

// Categorías preferidas según la actividad elegida (pregunta 2) — pesan más
// que el estilo porque describen el uso concreto del regalo.
// Categorías reales del catálogo (colecciones Shopify): Cuadernos, Libretas,
// Planners, Stickers, Tacos de Notas, FlashCards, Marcapáginas, Empaque…
const ACTIVIDAD_CATS: Record<string, string[]> = {
  escribir: ['Cuadernos', 'Libretas', 'Tacos de Notas', 'FlashCards'],
  organizar: ['Planners', 'Cuadernos', 'Tacos de Notas'],
  decorar: ['Stickers', 'Marcapáginas', 'Papelería'],
  scrapbooking: ['Stickers', 'FlashCards', 'Papelería'],
  crear: ['Cuadernos', 'Libretas', 'Papelería'],
  regalo: ['Empaque', 'Marcapáginas', 'Stickers'],
};

// Categorías afines al estilo elegido (pregunta 3) — desempatan dentro del
// mismo presupuesto/actividad.
const ESTILO_CATS: Record<string, string[]> = {
  colorido: ['Stickers', 'Marcapáginas', 'Papelería'],
  cute: ['Stickers', 'Libretas', 'Empaque'],
  artistico: ['Cuadernos', 'Libretas'],
  practico: ['Planners', 'Tacos de Notas', 'Cuadernos'],
  coleccionable: ['Stickers', 'Marcapáginas', 'FlashCards'],
  sorpresa: ['Empaque', 'Regalos'],
};

// Recomendaciones según respuestas: filtra por presupuesto (pregunta 4),
// puntúa por actividad (pregunta 2, peso 2) y estilo (pregunta 3, peso 1),
// y devuelve hasta MAX_RESULTS productos — completando desde el catálogo sin
// duplicar si el filtro deja menos de 4.
function getQuizResults(answers: Record<number, string>, products: Product[]): Product[] {
  const actividad = answers[2];
  const estilo = answers[3];
  const budget = answers[4];

  let pool = [...products];
  if (budget === 'bajo') pool = pool.filter((p) => p.n <= 5000);
  else if (budget === 'medio') pool = pool.filter((p) => p.n <= 15000);
  else if (budget === 'alto') pool = pool.filter((p) => p.n <= 30000);
  // 'premium' no filtra: todo el catálogo califica.

  const actividadCats = actividad ? (ACTIVIDAD_CATS[actividad] ?? []) : [];
  const estiloCats = estilo ? (ESTILO_CATS[estilo] ?? []) : [];

  const scored = pool
    .map((p, idx) => {
      let score = 0;
      if (actividadCats.includes(p.cat)) score += 2;
      if (estiloCats.includes(p.cat)) score += 1;
      return { p, score, idx };
    })
    .sort((a, b) => b.score - a.score || a.idx - b.idx);

  const results = scored.slice(0, MAX_RESULTS).map((s) => s.p);

  if (results.length < 4) {
    const chosen = new Set(results.map((p) => p.id));
    for (const p of products) {
      if (results.length >= 4) break;
      if (!chosen.has(p.id)) {
        results.push(p);
        chosen.add(p.id);
      }
    }
  }

  return results;
}

// Quiz de regalos — se despliega dentro de la sección de color de RegalosPage
// (sin card propia). Arranca en la pregunta 1: 4 preguntas con barra de
// progreso y volver → resultados progresivos (3 primero, luego hasta 8).
// Estado 100% local: quizStep, quizAnswers, quizDone, showAll.
export function GiftQuiz({ questions, products, onProductClick }: GiftQuizProps) {
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleAnswer = (value: string) => {
    const nextAnswers = { ...quizAnswers, [quizStep]: value };
    setQuizAnswers(nextAnswers);
    if (quizStep >= questions.length) {
      setQuizDone(true);
    } else {
      setQuizStep((s) => s + 1);
    }
  };

  const handleBack = () => setQuizStep((s) => Math.max(1, s - 1));

  const handleRetry = () => {
    setQuizStep(1);
    setQuizAnswers({});
    setQuizDone(false);
    setShowAll(false);
  };

  if (quizDone) {
    const results = getQuizResults(quizAnswers, products);
    const visible = showAll ? results : results.slice(0, INITIAL_RESULTS);
    const hasMore = results.length > INITIAL_RESULTS;
    return (
      <div className={styles.results}>
        <div className={styles.resultsHeader}>
          <h3 className={styles.resultsTitle}>Tus recomendaciones</h3>
          <p className={styles.resultsText}>Elegimos estos productos pensando en tus respuestas.</p>
        </div>
        <div className={styles.resultsGrid}>
          <ProductGrid products={visible} onProductClick={onProductClick} />
        </div>
        <div className={styles.resultsActions}>
          {hasMore && !showAll && (
            <button type="button" className={styles.moreLink} onClick={() => setShowAll(true)}>
              Ver más recomendaciones
            </button>
          )}
          <button type="button" className={styles.retryLink} onClick={handleRetry}>
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[quizStep - 1];
  if (!currentQuestion) return null;

  return (
    <div className={styles.wrap}>
      <QuizStepper totalSteps={questions.length} currentStep={quizStep} />
      <div className={styles.stepLabel}>
        Pregunta {quizStep} de {questions.length}
      </div>

      {quizStep > 1 && (
        <button type="button" className={styles.backBtn} onClick={handleBack}>
          ← Volver
        </button>
      )}

      <h3 className={styles.question}>{currentQuestion.question}</h3>

      <div className={styles.optionsGrid}>
        {currentQuestion.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.option}
            onClick={() => handleAnswer(option.value)}
          >
            <span className={styles.optionIcon}>
              <GiftIcon name={(option.icon ?? 'gift') as GiftIconName} size={22} />
            </span>
            <span className={styles.optionLabel}>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
