import { useState } from 'react';
import { ProductGrid } from '../product';
import { GiftIcon, type GiftIconName } from './GiftIcon';
import { QuizStepper } from './QuizStepper';
import type { Product, QuizQuestion } from '../../types';
import styles from './GiftQuiz.module.css';
import { getQuizResults, quizBudgetLabel } from './quiz-results';

interface GiftQuizProps {
  questions: QuizQuestion[];
  products: Product[];
  onProductClick: (product: Product) => void;
}

// Cuántos productos se muestran de entrada en resultados vs. tras "Ver más".
const INITIAL_RESULTS = 3;
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
    const budgetLabel = quizBudgetLabel(quizAnswers[4]);
    return (
      <div className={styles.results}>
        <div className={styles.resultsHeader}>
          <h3 className={styles.resultsTitle}>Tus recomendaciones</h3>
          <p className={styles.resultsText}>
            {results.length
              ? `Elegimos productos disponibles ${budgetLabel ?? 'para tu presupuesto'} según tus respuestas.`
              : `No encontramos productos disponibles ${budgetLabel ?? 'en ese presupuesto'} que coincidan ahora.`}
          </p>
        </div>
        {visible.length > 0 && (
          <div className={styles.resultsGrid}>
            <ProductGrid products={visible} onProductClick={onProductClick} />
          </div>
        )}
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
