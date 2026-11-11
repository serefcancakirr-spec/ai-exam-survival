// Stage 11: shows learning content (quiz questions, quiz topics, starter flashcards) in Turkish.
// Display only: saved data always keeps the English text. Everything falls back to the text as saved.
import type { Flashcard, FlashcardDeck } from '../pages/flashcards-model';
import { STARTER_DECKS } from '../pages/flashcards-starter-decks';
import { QUESTION_SEEDS, type QuizQuestion, type QuizSubject } from '../pages/quiz-question-bank';
import { STARTER_CARDS_TR, STARTER_DECK_NAMES_TR } from './flashcards-starter-tr';
import { QUESTIONS_TR, TOPICS_TR } from './quiz-questions-tr';

type Lang = 'tr' | 'en';
type TrEntry = { prompt: string; options: Map<string, string>; explanation: string };

// subject + English question text -> Turkish question
const QUESTION_INDEX = new Map<string, TrEntry>();
for (const [subject, list] of Object.entries(QUESTIONS_TR) as [QuizSubject, NonNullable<(typeof QUESTIONS_TR)[QuizSubject]>][]) {
  const seeds = QUESTION_SEEDS[subject];
  list.forEach(([prompt, options, explanation], i) => {
    const seed = seeds[i];
    if (!seed) return;
    QUESTION_INDEX.set(`${subject}|${seed.prompt}`, {
      prompt,
      options: new Map(seed.options.map((english, k) => [english, options[k]])),
      explanation,
    });
  });
}

/** The question in the chosen language. Saved English questions are found by their English text. */
export function localizeQuestion(question: QuizQuestion, lang: Lang): QuizQuestion {
  if (lang !== 'tr') return question;
  const tr = QUESTION_INDEX.get(`${question.subject}|${question.prompt}`);
  if (!tr) return question;
  return {
    ...question,
    prompt: tr.prompt,
    options: question.options.map((option) => ({ ...option, text: tr.options.get(option.text) ?? option.text })),
    explanation: tr.explanation,
  };
}

/** True when a Turkish version exists for this question (used by tests and the review screen). */
export function hasTurkishQuestion(question: Pick<QuizQuestion, 'subject' | 'prompt'>) {
  return QUESTION_INDEX.has(`${question.subject}|${question.prompt}`);
}

/** A quiz topic name (or a starter-deck topic) in the chosen language. */
export function topicName(topic: string, lang: Lang) {
  return lang === 'tr' ? (TOPICS_TR[topic] ?? topic) : topic;
}

const STARTER_DECK_BY_ID = new Map(STARTER_DECKS.map((deck) => [deck.id, deck]));
const STARTER_CARD_BY_ID = new Map(STARTER_DECKS.flatMap((deck) => deck.cards.map((card) => [card.id, card] as const)));

/** A deck's name: Turkish only for a starter deck whose name was not changed by the student. */
export function deckName(deck: Pick<FlashcardDeck, 'id' | 'name' | 'starter'>, lang: Lang) {
  const original = STARTER_DECK_BY_ID.get(deck.id);
  if (lang !== 'tr' || !deck.starter || !original || original.name !== deck.name) return deck.name;
  return STARTER_DECK_NAMES_TR[deck.id] ?? deck.name;
}

/** A deck's topic: Turkish only for a starter deck whose topic was not changed by the student. */
export function deckTopic(deck: Pick<FlashcardDeck, 'id' | 'topic' | 'starter'>, lang: Lang) {
  const original = STARTER_DECK_BY_ID.get(deck.id);
  if (lang !== 'tr' || !deck.starter || !original || original.topic !== deck.topic) return deck.topic;
  return TOPICS_TR[deck.topic] ?? deck.topic;
}

/** A card in the chosen language: each starter text the student has not changed is shown in Turkish. */
export function localizeCard<T extends Pick<Flashcard, 'id' | 'front' | 'answer' | 'explanation'>>(card: T, lang: Lang): T {
  const original = STARTER_CARD_BY_ID.get(card.id);
  const tr = STARTER_CARDS_TR[card.id];
  if (lang !== 'tr' || !original || !tr) return card;
  return {
    ...card,
    front: card.front === original.front ? tr[0] : card.front,
    answer: card.answer === original.answer ? tr[1] : card.answer,
    explanation: card.explanation === original.explanation ? tr[2] : card.explanation,
  };
}

const STARTER_NAME_TR = new Map(STARTER_DECKS.map((deck) => [deck.name, STARTER_DECK_NAMES_TR[deck.id] ?? deck.name]));

/** Progress Tracker (read-only) only sees names: a quiz topic, a starter-deck topic or a starter-deck name. */
export function learningName(name: string, lang: Lang) {
  if (lang !== 'tr') return name;
  return TOPICS_TR[name] ?? STARTER_NAME_TR.get(name) ?? name;
}
