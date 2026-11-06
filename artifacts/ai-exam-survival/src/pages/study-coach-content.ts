// AI Study Coach: the written advice library.
// Students and teachers can improve this file without touching any code logic.
// Each strategy says which difficulties and problems it suits best; the coach picks the best three.

export const COACH_SUBJECTS = [
  'English',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'Literature',
  'Foreign Language',
  'Other',
] as const;
export type CoachSubject = (typeof COACH_SUBJECTS)[number];

export const COACH_DIFFICULTIES = ['comfortable', 'somewhat-hard', 'very-hard'] as const;
export type CoachDifficulty = (typeof COACH_DIFFICULTIES)[number];
export const DIFFICULTY_LABELS: Record<CoachDifficulty, string> = {
  comfortable: 'Comfortable',
  'somewhat-hard': 'Somewhat hard',
  'very-hard': 'Very hard',
};

export const COACH_PROBLEMS = ['none', 'understand', 'remember', 'time', 'nerves'] as const;
export type CoachProblem = (typeof COACH_PROBLEMS)[number];
export const PROBLEM_LABELS: Record<CoachProblem, string> = {
  none: 'Not sure / nothing specific',
  understand: 'I don’t understand it',
  remember: 'I understand it but forget it',
  time: 'I run out of time in exams',
  nerves: 'I get nervous in exams',
};

export type Strategy = {
  id: string;
  title: string;
  how: string;
  why: string;
  difficulties: CoachDifficulty[];
  problems: CoachProblem[];
};

export type SubjectGuide = {
  /** A short practice task used inside the action list, e.g. "solve 5 practice problems". */
  practice: string;
  /** Topic ideas shown as suggestions in the topic box. */
  topics: string[];
  strategies: Strategy[];
};

const ALL: CoachDifficulty[] = ['comfortable', 'somewhat-hard', 'very-hard'];
const HARDER: CoachDifficulty[] = ['somewhat-hard', 'very-hard'];
const EASIER: CoachDifficulty[] = ['comfortable', 'somewhat-hard'];

export const SUBJECT_GUIDES: Record<CoachSubject, SubjectGuide> = {
  Mathematics: {
    practice: 'solve 5 practice problems',
    topics: ['Linear equations', 'Quadratic equations', 'Functions and graphs', 'Geometry and angles', 'Trigonometry', 'Probability and statistics'],
    strategies: [
      { id: 'math-worked', title: 'Worked example, then a twin problem', how: 'Study one solved example line by line, cover it, then solve a similar problem on your own.', why: 'Copying the structure first and then working alone builds the method step by step.', difficulties: HARDER, problems: ['understand', 'none'] },
      { id: 'math-mixed', title: 'Mixed practice set', how: 'Do 6–8 problems from different topics in one session instead of one type in a row.', why: 'Mixing trains you to choose the right method, just like in the exam.', difficulties: EASIER, problems: ['remember', 'none'] },
      { id: 'math-errors', title: 'Mistake log', how: 'For every wrong answer, write what went wrong and the correct step. Retry those problems two days later.', why: 'Most lost marks come from the same few mistakes repeated.', difficulties: HARDER, problems: ['understand', 'remember'] },
      { id: 'math-timed', title: 'Timed problem sets', how: 'Set a timer for 10 minutes and do as many problems as you can, then check every answer.', why: 'Practising under time pressure makes exam timing feel normal.', difficulties: ALL, problems: ['time', 'nerves'] },
    ],
  },
  Biology: {
    practice: 'label a diagram from memory',
    topics: ['Cells and organelles', 'Genetics and DNA', 'Photosynthesis', 'Respiration', 'Ecology', 'Human body systems'],
    strategies: [
      { id: 'bio-draw', title: 'Draw and label from memory', how: 'Sketch the diagram (a cell, the heart, a leaf) without notes, label it, then check and correct in another colour.', why: 'Drawing from memory shows exactly which parts you have not learned yet.', difficulties: HARDER, problems: ['remember', 'none'] },
      { id: 'bio-process', title: 'Turn a process into steps', how: 'Write a process (mitosis, photosynthesis) as a numbered flowchart with one short line per step.', why: 'Biology processes are easier to understand when you see the order.', difficulties: HARDER, problems: ['understand'] },
      { id: 'bio-terms', title: 'Key-term flashcards', how: 'Make a flashcard for each key word and use Review mode until every card is mastered.', why: 'Exam answers need the exact scientific words.', difficulties: EASIER, problems: ['remember', 'none'] },
      { id: 'bio-exam', title: 'Exam questions with keywords', how: 'Answer two exam-style questions, then compare with the mark scheme and underline the keywords you missed.', why: 'Marks are given for specific terms, so practise using them.', difficulties: ALL, problems: ['time', 'nerves'] },
    ],
  },
  Chemistry: {
    practice: 'balance 5 equations or do 3 calculations',
    topics: ['Atomic structure', 'Chemical bonding', 'The mole', 'Balancing equations', 'Acids and bases', 'Rates of reaction'],
    strategies: [
      { id: 'chem-calc', title: 'Calculation template', how: 'For each calculation write: what you know, the formula, the numbers with units, the answer with units.', why: 'A fixed layout prevents most calculation mistakes and earns method marks.', difficulties: HARDER, problems: ['understand', 'time'] },
      { id: 'chem-balance', title: 'Equation drills', how: 'Balance five equations in a row, then check by counting atoms on both sides.', why: 'Balancing becomes fast and automatic with short, regular practice.', difficulties: ALL, problems: ['remember', 'none'] },
      { id: 'chem-particles', title: 'Explain with particles', how: 'For each observation (fizzing, colour change), write one sentence about what the particles are doing.', why: 'Linking what you see to particles is how chemistry is explained in exams.', difficulties: HARDER, problems: ['understand'] },
      { id: 'chem-cards', title: 'Formula and ion flashcards', how: 'Make flashcards for formulas, ion charges and symbols. Do one short round every day.', why: 'Small daily reviews stop facts from fading.', difficulties: EASIER, problems: ['remember', 'nerves'] },
    ],
  },
  Physics: {
    practice: 'solve 4 problems with units',
    topics: ['Forces and motion', 'Energy and work', 'Electricity', 'Waves', 'Magnetism', 'Pressure'],
    strategies: [
      { id: 'phy-steps', title: 'Given → Find → Equation → Solve', how: 'Write what is given, what you must find, the equation, then substitute and solve with units.', why: 'A clear routine stops you freezing on long problems.', difficulties: HARDER, problems: ['understand', 'nerves'] },
      { id: 'phy-formulas', title: 'Formula sheet from memory', how: 'Write every formula you need, with what each letter means and its unit. Check and fix the gaps.', why: 'You cannot use a formula you cannot remember.', difficulties: ALL, problems: ['remember', 'none'] },
      { id: 'phy-sketch', title: 'Sketch it first', how: 'Before calculating, draw a quick diagram with arrows for forces or a simple circuit.', why: 'A sketch turns words into something you can reason about.', difficulties: HARDER, problems: ['understand'] },
      { id: 'phy-timed', title: 'Timed problem sets', how: 'Do 4 problems in 12 minutes, then mark them and redo any you missed.', why: 'Builds speed while keeping accuracy.', difficulties: EASIER, problems: ['time'] },
    ],
  },
  English: {
    practice: 'write one PEEL paragraph',
    topics: ['Reading comprehension', 'Essay writing', 'Grammar and punctuation', 'Vocabulary', 'Persuasive writing', 'Summary writing'],
    strategies: [
      { id: 'eng-peel', title: 'PEEL paragraphs', how: 'Write each paragraph as Point, Evidence, Explain, Link. Highlight each part in a different colour.', why: 'A clear structure makes answers easier to write and to mark.', difficulties: HARDER, problems: ['understand', 'time'] },
      { id: 'eng-active', title: 'Active reading', how: 'Read a short text and write a one-line summary next to each paragraph.', why: 'Summarising forces you to understand, not just read.', difficulties: ALL, problems: ['understand', 'none'] },
      { id: 'eng-vocab', title: 'Words in your own sentences', how: 'Pick 5 new words and use each one in a sentence about your own life.', why: 'Using a word yourself makes it stick far better than reading it.', difficulties: EASIER, problems: ['remember'] },
      { id: 'eng-timed', title: '20-minute timed writing', how: 'Spend 5 minutes planning and 15 minutes writing an answer to a past question.', why: 'Planning quickly is the skill that saves time in the exam.', difficulties: ALL, problems: ['time', 'nerves'] },
    ],
  },
  Literature: {
    practice: 'learn 3 short quotations',
    topics: ['Themes', 'Characters', 'Poetry analysis', 'Context', 'Language and imagery', 'Essay planning'],
    strategies: [
      { id: 'lit-quotes', title: 'Quote bank', how: 'Choose 3–5 short quotations for each main theme or character and write what each one shows.', why: 'Short quotations are easy to remember and strong as evidence.', difficulties: ALL, problems: ['remember', 'none'] },
      { id: 'lit-map', title: 'Theme map', how: 'Draw a mind map linking characters, key events and themes on one page.', why: 'Seeing the links helps you answer any question angle.', difficulties: HARDER, problems: ['understand'] },
      { id: 'lit-thesis', title: 'Three different openings', how: 'For one essay question, write three different one-sentence arguments, then pick the strongest.', why: 'A clear argument at the start shapes the whole essay.', difficulties: HARDER, problems: ['understand', 'nerves'] },
      { id: 'lit-plan', title: '10-minute essay plans', how: 'Plan (do not write) an essay in 10 minutes: argument, three points, a quote for each.', why: 'Fast planning is what makes timed essays manageable.', difficulties: EASIER, problems: ['time'] },
    ],
  },
  History: {
    practice: 'write one paragraph with specific evidence',
    topics: ['Causes of World War I', 'The Cold War', 'The Industrial Revolution', 'The Ottoman Empire', 'Revolutions', 'Source analysis'],
    strategies: [
      { id: 'his-timeline', title: 'Timeline from memory', how: 'Draw a timeline of the key dates and events without notes, then check and add what you missed.', why: 'Order and dates hold the whole topic together.', difficulties: ALL, problems: ['remember', 'none'] },
      { id: 'his-cause', title: 'Cause-and-effect chains', how: 'For one event, write the causes on the left and the consequences on the right, joined by arrows.', why: 'Most history questions ask why something happened or what it led to.', difficulties: HARDER, problems: ['understand'] },
      { id: 'his-source', title: 'Source questions', how: 'For a source, note who made it, when, why, and how useful it is for the question.', why: 'This four-part check gives a clear, well-marked answer.', difficulties: HARDER, problems: ['understand', 'time'] },
      { id: 'his-peel', title: 'Evidence-first paragraphs', how: 'Write a paragraph that names at least two specific facts (names, dates, numbers).', why: 'Specific evidence is what lifts an answer to the top marks.', difficulties: EASIER, problems: ['time', 'nerves'] },
    ],
  },
  Geography: {
    practice: 'learn one case study',
    topics: ['Rivers and coasts', 'Plate tectonics', 'Weather and climate', 'Population', 'Urbanisation', 'Map and data skills'],
    strategies: [
      { id: 'geo-case', title: 'Case-study cards', how: 'Make one card per case study: place, key facts and figures, causes, impacts, responses.', why: 'Named places and numbers turn general answers into strong ones.', difficulties: ALL, problems: ['remember', 'none'] },
      { id: 'geo-sketch', title: 'Sketch and label processes', how: 'Draw a simple labelled sketch of a process, such as how a meander or volcano forms.', why: 'Processes are easier to explain once you can draw them.', difficulties: HARDER, problems: ['understand'] },
      { id: 'geo-data', title: 'Describe the data', how: 'For a graph or map, describe the overall pattern, quote two numbers, and name one exception.', why: 'This is exactly what data questions are marked on.', difficulties: HARDER, problems: ['time', 'understand'] },
      { id: 'geo-terms', title: 'Key-term flashcards', how: 'Make flashcards for the key terms and review them in short daily rounds.', why: 'Precise terms make answers clearer and earn marks.', difficulties: EASIER, problems: ['remember', 'nerves'] },
    ],
  },
  'Foreign Language': {
    practice: 'use 5 new words in sentences',
    topics: ['Vocabulary', 'Verb tenses', 'Listening', 'Speaking', 'Reading', 'Writing'],
    strategies: [
      { id: 'lang-cards', title: 'Say-it-aloud flashcards', how: 'Review vocabulary flashcards and say each word aloud before you flip the card.', why: 'Saying words aloud links sound, spelling and meaning.', difficulties: ALL, problems: ['remember', 'none'] },
      { id: 'lang-sentences', title: 'Five sentences about you', how: 'Write five sentences about your own life using today’s words or tense.', why: 'Personal sentences are easier to remember and reuse in speaking.', difficulties: HARDER, problems: ['understand', 'remember'] },
      { id: 'lang-listen', title: '10-minute listening', how: 'Listen to a short clip in the language and write down five words you recognise.', why: 'Regular listening makes exam audio feel familiar.', difficulties: EASIER, problems: ['time'] },
      { id: 'lang-speak', title: 'One-minute recordings', how: 'Record yourself answering a common exam question for one minute, then listen back.', why: 'Practising out loud reduces nerves in the speaking exam.', difficulties: ALL, problems: ['nerves'] },
    ],
  },
  Other: {
    practice: 'answer 5 practice questions',
    topics: [],
    strategies: [
      { id: 'gen-teach', title: 'Teach it back', how: 'Explain the topic out loud in simple words, as if teaching a younger student.', why: 'If you can explain it simply, you really understand it.', difficulties: HARDER, problems: ['understand', 'none'] },
      { id: 'gen-recall', title: 'Blank-page recall', how: 'Close your notes, write everything you remember, then check and fill the gaps in a different colour.', why: 'Pulling ideas from memory is one of the most effective ways to learn.', difficulties: ALL, problems: ['remember', 'none'] },
      { id: 'gen-spaced', title: 'Short, spaced sessions', how: 'Study in 25-minute sessions spread over several days instead of one long session.', why: 'Spreading practice out helps you remember for longer.', difficulties: EASIER, problems: ['remember'] },
      { id: 'gen-exam', title: 'Exam-condition practice', how: 'Answer practice questions with a timer and no notes, then mark your work.', why: 'Rehearsing the real conditions makes the exam feel familiar.', difficulties: ALL, problems: ['time', 'nerves'] },
    ],
  },
};

export const GRADE_TIPS: Record<'9' | '10' | '11' | '12', string> = {
  '9': 'Grade 9 is the best time to build habits. Short, regular sessions now make the later years much easier.',
  '10': 'In grade 10, topics start to connect. When something new feels hard, check which earlier topic it builds on.',
  '11': 'Grade 11 has more exams close together. Start revising a week earlier than feels necessary, and use past questions often.',
  '12': 'In grade 12, practise full past papers under timed conditions and focus your time on the topics that earn the most marks.',
};

export const PROBLEM_TIPS: Record<CoachProblem, string> = {
  none: 'Start with a quick self-test: the questions you miss show you where to spend your time.',
  understand: 'Find one worked example, explain each step in your own words, and write down one specific question to ask your teacher.',
  remember: 'Test yourself instead of re-reading: close your notes, recall, then check. Repeat after one day, three days and one week.',
  time: 'Before you start a timed question, decide how many minutes it deserves based on its marks, and move on when the time is up.',
  nerves:
    'Practise under exam conditions so the real exam feels familiar, and try slow breathing: in for 4, hold for 4, out for 4. If worry feels too big, talk to a teacher or your school counsellor.',
};
