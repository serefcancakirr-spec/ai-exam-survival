// Stage 22: every exam-mode question (TYT from Stage 22A, AYT Sayısal from Stage 22B-1), found by id.
import { AYT_QUESTIONS } from './ayt-bank';
import { TYT_QUESTIONS, type TytQuestion } from './tyt-bank';

export const EXAM_QUESTIONS: TytQuestion[] = [...TYT_QUESTIONS, ...AYT_QUESTIONS];
export const EXAM_BY_ID = new Map(EXAM_QUESTIONS.map((question) => [question.id, question]));
