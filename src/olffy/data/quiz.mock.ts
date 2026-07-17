import type { QuizQuestion } from '../types';

// Quiz de regalos — versión ampliada (4 preguntas) respecto al original de
// Cloud Design. `icon` referencia un GiftIconName (SVG inline, sin emojis).
export const QUIZ: QuizQuestion[] = [
  {
    question: '¿Para quién es el regalo?',
    options: [
      { label: 'Para ella', value: 'ella', icon: 'heart' },
      { label: 'Para él', value: 'el', icon: 'book' },
      { label: 'Para mi amiga', value: 'amiga', icon: 'users' },
      { label: 'Para mi amigo', value: 'amigo', icon: 'users' },
      { label: 'Para mis hijos', value: 'hijos', icon: 'family' },
      { label: 'Para alguien que ama la papelería', value: 'papeleria', icon: 'notebook' },
    ],
  },
  {
    question: '¿Qué le gusta hacer?',
    options: [
      { label: 'Escribir y tomar notas', value: 'escribir', icon: 'pen' },
      { label: 'Organizar su semana', value: 'organizar', icon: 'calendar' },
      { label: 'Decorar cuadernos', value: 'decorar', icon: 'sticker' },
      { label: 'Scrapbooking', value: 'scrapbooking', icon: 'scissors' },
      { label: 'Dibujar o crear', value: 'crear', icon: 'palette' },
      { label: 'Armar regalos bonitos', value: 'regalo', icon: 'gift' },
    ],
  },
  {
    question: '¿Qué estilo le gustaría más?',
    options: [
      { label: 'Colorido y alegre', value: 'colorido', icon: 'palette' },
      { label: 'Tierno y cute', value: 'cute', icon: 'heart' },
      { label: 'Creativo/artístico', value: 'artistico', icon: 'pen' },
      { label: 'Práctico para el día a día', value: 'practico', icon: 'checklist' },
      { label: 'Coleccionable', value: 'coleccionable', icon: 'star' },
      { label: 'Sorpresa variada', value: 'sorpresa', icon: 'sparkles' },
    ],
  },
  {
    question: '¿Qué presupuesto tienes?',
    options: [
      { label: 'Hasta $5.000', value: 'bajo', icon: 'tag' },
      { label: '$5.000 a $15.000', value: 'medio', icon: 'tag' },
      { label: '$15.000 a $30.000', value: 'alto', icon: 'tag' },
      { label: 'Más de $30.000', value: 'premium', icon: 'sparkles' },
    ],
  },
];
