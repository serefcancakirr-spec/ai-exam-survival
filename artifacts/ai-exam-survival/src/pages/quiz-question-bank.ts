export const QUIZ_GRADES = ['9', '10', '11', '12'] as const;

export const QUIZ_SUBJECTS = [
  'English',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'Literature',
] as const;

export type QuizGrade = (typeof QUIZ_GRADES)[number];
export type QuizSubject = (typeof QUIZ_SUBJECTS)[number];
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizOptionId = 'A' | 'B' | 'C' | 'D';

export type QuizOption = {
  id: QuizOptionId;
  text: string;
};

export type QuizQuestion = {
  id: string;
  grade: QuizGrade;
  subject: QuizSubject;
  topic: string;
  difficulty: QuizDifficulty;
  prompt: string;
  options: QuizOption[];
  correctOptionId: QuizOptionId;
  explanation: string;
};

export type QuestionSeed = Omit<QuizQuestion, 'id' | 'grade' | 'subject' | 'options'> & {
  options: [string, string, string, string];
};

function question(
  topic: string,
  difficulty: QuizDifficulty,
  prompt: string,
  options: [string, string, string, string],
  correctOptionId: QuizOptionId,
  explanation: string,
): QuestionSeed {
  return { topic, difficulty, prompt, options, correctOptionId, explanation };
}

export const QUESTION_SEEDS: Record<QuizSubject, QuestionSeed[]> = {
  English: [
    question('Grammar & Usage', 'easy', 'Which sentence correctly joins two independent clauses with a semicolon?', ['I finished the draft; I still need to proofread it.', 'I finished; because I still need to proofread it.', 'I finished the draft; and I proofread it.', 'I; finished the draft before lunch.'], 'A', 'A semicolon can join two complete, closely related sentences without a coordinating conjunction.'),
    question('Grammar & Usage', 'medium', 'Which verb completes the sentence with correct agreement? “Neither the coach nor the players ___ ready.”', ['is', 'are', 'was', 'has'], 'B', 'With “neither…nor,” the verb agrees with the nearer subject. “Players” is plural, so “are” is correct.'),
    question('Grammar & Usage', 'medium', 'Which sentence uses parallel structure?', ['The club values reading, writing, and discussing.', 'The club values reading, to write, and discussion.', 'The club values to read, writing, and discussing.', 'The club values reading, writers, and to discuss.'], 'A', 'The three items in the list use the same grammatical form: the gerunds reading, writing, and discussing.'),
    question('Grammar & Usage', 'hard', 'Which revision best removes the misplaced modifier? “Walking to school, the rain soaked Lena’s backpack.”', ['Walking to school, Lena’s backpack was soaked by rain.', 'As Lena walked to school, rain soaked her backpack.', 'The rain, walking to school, soaked Lena’s backpack.', 'Lena’s backpack soaked the rain while walking to school.'], 'B', 'The revision makes Lena the person doing the opening action, so the modifier is no longer misplaced.'),
    question('Grammar & Usage', 'easy', 'Which sentence correctly places a comma after an introductory clause?', ['After the bell rang, the students left the room.', 'After, the bell rang the students left the room.', 'After the bell, rang the students left the room.', 'After the bell rang the students, left the room.'], 'A', 'A comma separates the introductory dependent clause “After the bell rang” from the main clause.'),
    question('Rhetoric & Argument', 'easy', 'A speaker cites years of experience treating patients to build trust. Which appeal is used?', ['Ethos', 'Pathos', 'Logos', 'Irony'], 'A', 'Ethos appeals to a speaker’s credibility, character, or relevant experience.'),
    question('Rhetoric & Argument', 'medium', 'Which evidence most directly supports the claim that the school garden increased student participation?', ['A survey found that 68 students joined garden activities, up from 34 the previous term.', 'The garden has a green fence and six raised beds.', 'Several students said gardening is relaxing.', 'The school mascot is a falcon.'], 'A', 'The before-and-after participation counts directly measure the claimed increase.'),
    question('Rhetoric & Argument', 'medium', 'A writer acknowledges that a policy may cost money, then explains its long-term savings. What is the acknowledged concern called?', ['A counterclaim', 'A topic sentence', 'A citation', 'A conclusion'], 'A', 'A counterclaim presents an opposing point or concern that the writer can address.'),
    question('Rhetoric & Argument', 'hard', 'Which sentence is the clearest, most arguable claim for an essay?', ['Public libraries are buildings with books.', 'The town should extend library hours because students need a quiet study space after school.', 'Libraries have existed for a long time.', 'Some people visit the library on weekends.'], 'B', 'It takes a position and gives a reason that can be supported with evidence.'),
    question('Rhetoric & Argument', 'easy', 'Which rhetorical appeal relies most on facts, data, and logical reasoning?', ['Logos', 'Ethos', 'Pathos', 'Alliteration'], 'A', 'Logos is an appeal to logic, commonly supported with facts, examples, or data.'),
    question('Reading Skills', 'easy', 'Mina checks the forecast, packs an umbrella, and looks at the dark clouds. What is the best inference?', ['She expects rain.', 'She plans to go swimming.', 'She has lost her backpack.', 'She is moving to another town.'], 'A', 'The forecast, umbrella, and dark clouds together support the inference that Mina expects rain.'),
    question('Reading Skills', 'medium', 'A passage describes a crowded station, hurried footsteps, and a train pulling away. Which tone is best supported?', ['Urgent', 'Playful', 'Sleepy', 'Celebratory'], 'A', 'The crowd, hurried movement, and departing train create a sense of urgency.'),
    question('Reading Skills', 'medium', 'A paragraph lists three ways trees reduce city heat and ends by saying urban tree cover should be expanded. What is its central idea?', ['Trees can help cool cities, so cities should plant more of them.', 'Trees grow only in rural areas.', 'Cities are always warmer in winter.', 'Urban parks are difficult to maintain.'], 'A', 'The supporting details and concluding recommendation both focus on trees reducing urban heat.'),
    question('Reading Skills', 'hard', 'A character repeatedly checks the locked door after hearing a noise. What does this action most strongly suggest?', ['The character feels unsafe or anxious.', 'The character is preparing a meal.', 'The character has forgotten the time.', 'The character is celebrating good news.'], 'A', 'Repeatedly checking a lock after a noise is evidence of worry about safety.'),
    question('Reading Skills', 'easy', 'In “The path was arduous, so we rested often,” what does “arduous” most nearly mean?', ['Difficult', 'Short', 'Crowded', 'Familiar'], 'A', 'The need to rest often indicates that the path was difficult or tiring.'),
    question('Writing & Research', 'easy', 'Which sentence is the strongest thesis for an essay about later school start times?', ['School schedules are interesting.', 'High schools should start later because additional sleep can improve students’ alertness and attendance.', 'Many students use alarm clocks.', 'This essay is about school.'], 'B', 'A thesis states a focused, arguable position and previews its reasoning.'),
    question('Writing & Research', 'medium', 'A student restates an author’s idea in new wording and cites the source. What is this called?', ['Paraphrasing', 'Copyediting', 'Brainstorming', 'Proofreading'], 'A', 'A paraphrase restates a source’s idea in the writer’s own words and still requires attribution.'),
    question('Writing & Research', 'medium', 'Which source is most appropriate for a research paper on local air quality?', ['A recent report from the city environmental agency', 'An anonymous comment on a message board', 'An advertisement for air freshener', 'A fictional story set in the city'], 'A', 'A current report from the relevant public agency is a traceable, topic-specific source.'),
    question('Writing & Research', 'hard', 'Which transition best signals a contrast between two ideas?', ['However', 'For example', 'Similarly', 'As a result'], 'A', '“However” signals a contrast; the other choices signal examples, similarity, or consequence.'),
    question('Writing & Research', 'easy', 'Which detail belongs in a conclusion rather than a new body paragraph?', ['A brief restatement of the essay’s main point', 'A new claim with no supporting evidence', 'An unrelated statistic', 'A quotation never discussed earlier'], 'A', 'A conclusion reinforces the main point and brings the argument to a close.'),
  ],
  Mathematics: [
    question('Algebra', 'easy', 'Solve: 2x + 7 = 19.', ['5', '6', '12', '13'], 'B', 'Subtract 7 from both sides to get 2x = 12, then divide by 2: x = 6.'),
    question('Algebra', 'medium', 'What is the slope of the line through (2, 3) and (6, 11)?', ['1', '2', '4', '8'], 'B', 'Slope is change in y divided by change in x: (11 − 3) / (6 − 2) = 8 / 4 = 2.'),
    question('Algebra', 'medium', 'Factor x² − 5x + 6.', ['(x − 2)(x − 3)', '(x + 2)(x + 3)', '(x − 1)(x − 6)', '(x + 1)(x − 6)'], 'A', 'The numbers −2 and −3 multiply to 6 and add to −5.'),
    question('Algebra', 'hard', 'If 3(2x − 1) = 4x + 9, what is x?', ['3', '6', '9', '12'], 'B', 'Expand to get 6x − 3 = 4x + 9. Subtract 4x and add 3: 2x = 12, so x = 6.'),
    question('Algebra', 'easy', 'Simplify: 3a + 2a − a.', ['2a', '4a', '5a', '6a'], 'B', 'Combine like terms: (3 + 2 − 1)a = 4a.'),
    question('Geometry', 'easy', 'The angles in a triangle add up to how many degrees?', ['90°', '180°', '270°', '360°'], 'B', 'The interior angles of every Euclidean triangle sum to 180 degrees.'),
    question('Geometry', 'medium', 'A right triangle has legs of length 6 and 8. What is the hypotenuse?', ['10', '12', '14', '48'], 'A', 'By the Pythagorean theorem, c² = 6² + 8² = 100, so c = 10.'),
    question('Geometry', 'medium', 'What is the area of a circle with radius 3?', ['3π', '6π', '9π', '18π'], 'C', 'The area is πr². With r = 3, the area is 9π square units.'),
    question('Geometry', 'hard', 'Two similar triangles have side lengths in a ratio of 2:5. If the smaller triangle has perimeter 18, what is the larger perimeter?', ['30', '36', '45', '90'], 'C', 'Perimeters scale by the same ratio as corresponding sides: 18 × 5/2 = 45.'),
    question('Geometry', 'easy', 'What is the measure of the third angle in a triangle with angles 50° and 60°?', ['60°', '70°', '80°', '90°'], 'B', 'The angles sum to 180°, so the third angle is 180° − 50° − 60° = 70°.'),
    question('Functions & Graphs', 'easy', 'For f(x) = 2x − 3, what is f(4)?', ['5', '8', '11', '−5'], 'A', 'Substitute x = 4: f(4) = 2(4) − 3 = 5.'),
    question('Functions & Graphs', 'medium', 'Which equation has slope 3 and y-intercept −2?', ['y = 3x − 2', 'y = −2x + 3', 'y = 3x + 2', 'y = −3x − 2'], 'A', 'In slope-intercept form y = mx + b, m is the slope and b is the y-intercept.'),
    question('Functions & Graphs', 'medium', 'What is the vertex of y = (x − 2)² + 1?', ['(−2, 1)', '(2, 1)', '(1, 2)', '(2, −1)'], 'B', 'Vertex form is y = (x − h)² + k, so the vertex is (h, k) = (2, 1).'),
    question('Functions & Graphs', 'hard', 'A linear function passes through (0, 4) and (3, 10). What is its rule?', ['f(x) = 2x + 4', 'f(x) = 3x + 4', 'f(x) = 2x − 4', 'f(x) = 4x + 2'], 'A', 'The slope is (10 − 4) / (3 − 0) = 2 and the y-intercept is 4.'),
    question('Functions & Graphs', 'easy', 'Which ordered pair lies on y = x + 1?', ['(2, 3)', '(2, 2)', '(1, 3)', '(0, 0)'], 'A', 'When x = 2, y = x + 1 = 3, so (2, 3) satisfies the equation.'),
    question('Statistics & Probability', 'easy', 'What is the mean of 2, 4, and 6?', ['3', '4', '5', '12'], 'B', 'The mean is the sum divided by the number of values: (2 + 4 + 6) / 3 = 4.'),
    question('Statistics & Probability', 'medium', 'A fair six-sided die is rolled once. What is the probability of rolling an even number?', ['1/6', '1/3', '1/2', '2/3'], 'C', 'Three of the six outcomes—2, 4, and 6—are even, so the probability is 3/6 = 1/2.'),
    question('Statistics & Probability', 'medium', 'What is the median of 3, 7, 8, 10, and 12?', ['7', '8', '9', '10'], 'B', 'The values are already ordered; the middle, third value is 8.'),
    question('Statistics & Probability', 'hard', 'A survey about school lunch is answered only by students in the cafeteria. What is the main concern?', ['The sample may exclude students who do not eat in the cafeteria.', 'The survey has too many answer choices.', 'The data must be normally distributed.', 'The results cannot be counted.'], 'A', 'A cafeteria-only sample may not represent students who bring lunch or eat elsewhere.'),
    question('Statistics & Probability', 'easy', 'A bag has 3 red and 2 blue counters. What is the probability of drawing a blue counter?', ['2/5', '3/5', '1/2', '2/3'], 'A', 'There are 2 blue counters out of 5 total counters, so the probability is 2/5.'),
  ],
  Biology: [
    question('Cells & Genetics', 'easy', 'Which organelle releases usable energy from food during cellular respiration?', ['Ribosome', 'Mitochondrion', 'Golgi apparatus', 'Vacuole'], 'B', 'Mitochondria carry out most cellular respiration and transfer energy into ATP.'),
    question('Cells & Genetics', 'medium', 'Which process produces two genetically similar body cells for growth and repair?', ['Meiosis', 'Mitosis', 'Fertilization', 'Diffusion'], 'B', 'Mitosis separates duplicated chromosomes into two daughter cells with the same chromosome number.'),
    question('Cells & Genetics', 'medium', 'In a DNA molecule, adenine pairs with which base?', ['Cytosine', 'Guanine', 'Thymine', 'Uracil'], 'C', 'In DNA, adenine pairs with thymine; cytosine pairs with guanine.'),
    question('Cells & Genetics', 'hard', 'A cell is placed in a solution with a higher solute concentration than its cytoplasm. What is most likely to happen?', ['Water moves out of the cell by osmosis.', 'Water moves into the cell by osmosis.', 'The cell immediately makes more DNA.', 'Solute moves through the membrane without any gradient.'], 'A', 'Water moves across a selectively permeable membrane toward the higher solute concentration.'),
    question('Cells & Genetics', 'easy', 'What is an allele?', ['A version of a gene', 'A type of cell membrane', 'A complete chromosome set', 'A protein-building organelle'], 'A', 'Alleles are different forms of the same gene.'),
    question('Evolution & Ecology', 'easy', 'In most ecosystems, which organisms bring energy into the food web by making sugars from sunlight?', ['Producers', 'Decomposers', 'Primary consumers', 'Predators'], 'A', 'Producers such as plants and algae convert light energy into chemical energy.'),
    question('Evolution & Ecology', 'medium', 'What is natural selection?', ['Individuals with helpful inherited traits tend to leave more offspring.', 'Organisms choose new traits when they need them.', 'Every member of a population changes at the same time.', 'Traits acquired during life are always inherited.'], 'A', 'Natural selection changes populations over generations because inherited traits affect reproductive success.'),
    question('Evolution & Ecology', 'medium', 'If a predator population suddenly decreases, what may happen first to its prey population?', ['It may increase because fewer individuals are eaten.', 'It must become extinct.', 'It stops reproducing.', 'It immediately changes species.'], 'A', 'With fewer predators, more prey may survive long enough to reproduce, although other factors also affect population size.'),
    question('Evolution & Ecology', 'hard', 'Why can a loss of one species affect several other populations in a food web?', ['Species are connected through feeding relationships.', 'All species have identical diets.', 'Energy is created by predators.', 'Food webs contain only one pathway.'], 'A', 'A species can be both food for some organisms and a consumer of others, so changes can ripple through connected populations.'),
    question('Evolution & Ecology', 'easy', 'What is an organism’s role and position in its ecosystem called?', ['Niche', 'Atom', 'Tissue', 'Allele'], 'A', 'A niche describes how an organism uses resources and interacts with its environment.'),
    question('Human Biology', 'easy', 'Where does most gas exchange between air and blood occur in the lungs?', ['Alveoli', 'Esophagus', 'Bronchi only', 'Diaphragm'], 'A', 'Alveoli are tiny air sacs surrounded by capillaries where oxygen and carbon dioxide diffuse.'),
    question('Human Biology', 'medium', 'Which blood vessel carries blood away from the heart?', ['Artery', 'Vein', 'Capillary', 'Lymph node'], 'A', 'Arteries carry blood away from the heart; veins return blood to it.'),
    question('Human Biology', 'medium', 'Which hormone helps lower blood glucose by helping cells take in glucose?', ['Insulin', 'Adrenaline', 'Melatonin', 'Thyroxine'], 'A', 'Insulin, produced by the pancreas, helps regulate blood glucose by promoting uptake and storage.'),
    question('Human Biology', 'hard', 'After a rise in body temperature, sweating helps return temperature toward its normal range. This is an example of:', ['Negative feedback', 'A mutation', 'Natural selection', 'Positive feedback'], 'A', 'Negative feedback counters a change and helps maintain a stable internal condition.'),
    question('Human Biology', 'easy', 'Which system sends rapid electrical signals around the body?', ['Nervous system', 'Digestive system', 'Skeletal system', 'Excretory system'], 'A', 'The nervous system uses neurons to transmit electrical and chemical signals.'),
    question('Scientific Method', 'easy', 'A student changes the amount of light a plant receives and measures its growth. What is the independent variable?', ['Amount of light', 'Plant growth', 'Type of ruler', 'Final height'], 'A', 'The independent variable is the factor deliberately changed—in this case, light amount.'),
    question('Scientific Method', 'medium', 'Why include a control group in an experiment?', ['To provide a comparison that does not receive the tested treatment', 'To guarantee the hypothesis is correct', 'To change several variables at once', 'To remove the need to collect data'], 'A', 'A control group provides a baseline for comparing the treatment group.'),
    question('Scientific Method', 'medium', 'A good hypothesis should be:', ['Testable and connected to an observation', 'Impossible to measure', 'A conclusion written before collecting results', 'A list of unrelated facts'], 'A', 'A hypothesis is a testable proposed explanation or prediction.'),
    question('Scientific Method', 'hard', 'Repeated trials give slightly different measurements. What is the best next step?', ['Report the variation and use an appropriate summary such as the mean.', 'Discard every result except the largest.', 'Change the hypothesis until all values match.', 'Stop measuring and report certainty.'], 'A', 'Repeated measurements naturally vary; reporting the data and a suitable summary is more reliable than cherry-picking.'),
    question('Scientific Method', 'easy', 'What is the dependent variable in an experiment?', ['The outcome that is measured', 'The factor intentionally changed', 'A factor kept constant', 'The equipment label'], 'A', 'The dependent variable is the measured response to the independent variable.'),
  ],
  Chemistry: [
    question('Atoms & Periodic Table', 'easy', 'Which subatomic particle determines an element’s atomic number?', ['Proton', 'Neutron', 'Electron', 'Photon'], 'A', 'An element’s atomic number equals the number of protons in its nucleus.'),
    question('Atoms & Periodic Table', 'medium', 'Two atoms of the same element have different numbers of neutrons. They are:', ['Isotopes', 'Ions of different elements', 'Compounds', 'Molecules with different proton counts'], 'A', 'Isotopes are atoms of the same element with different neutron counts.'),
    question('Atoms & Periodic Table', 'medium', 'Elements in the same column of the periodic table often have similar chemical properties because they have similar:', ['Valence electron arrangements', 'Numbers of occupied shells in every case', 'Mass numbers', 'Neutron counts'], 'A', 'For main-group elements, members of a group generally have similar valence electron patterns, which influence bonding.'),
    question('Atoms & Periodic Table', 'hard', 'A neutral atom has 11 protons. How many electrons does it have?', ['10', '11', '12', '22'], 'B', 'A neutral atom has equal numbers of protons and electrons.'),
    question('Atoms & Periodic Table', 'easy', 'Where are protons and neutrons found in an atom?', ['In the nucleus', 'In the electron cloud only', 'Outside the atom', 'Inside chemical bonds only'], 'A', 'The nucleus contains protons and neutrons; electrons occupy the surrounding electron cloud.'),
    question('Bonding & Reactions', 'easy', 'In a covalent bond, atoms generally:', ['Share pairs of electrons', 'Transfer protons', 'Share neutrons', 'Lose their nuclei'], 'A', 'Covalent bonding involves sharing electron pairs between atoms.'),
    question('Bonding & Reactions', 'medium', 'Which balanced equation has the correct coefficients for H₂ + O₂ → H₂O?', ['2H₂ + O₂ → 2H₂O', 'H₂ + 2O₂ → H₂O', 'H₂ + O₂ → 2H₂O', '2H₂ + 2O₂ → H₂O'], 'A', 'Two H₂ molecules and one O₂ molecule form two H₂O molecules, conserving four hydrogen atoms and two oxygen atoms.'),
    question('Bonding & Reactions', 'medium', 'A catalyst speeds up a reaction by:', ['Lowering the activation energy', 'Increasing the mass of the products', 'Being permanently consumed', 'Changing the identity of the reactants'], 'A', 'A catalyst provides an alternate pathway with lower activation energy and is regenerated by the reaction.'),
    question('Bonding & Reactions', 'hard', 'In a closed system, 12 g of carbon reacts completely with 32 g of oxygen. What mass of carbon dioxide forms?', ['20 g', '32 g', '44 g', '384 g'], 'C', 'Conservation of mass gives 12 g + 32 g = 44 g of products in the closed system.'),
    question('Bonding & Reactions', 'easy', 'What is the chemical formula for water?', ['H₂O', 'HO₂', 'H₂O₂', 'OH'], 'A', 'A water molecule contains two hydrogen atoms and one oxygen atom.'),
    question('Matter & Solutions', 'easy', 'Which is a physical change?', ['Ice melting', 'Iron rusting', 'Wood burning', 'A cake baking'], 'A', 'Melting changes water’s state but does not create a new substance.'),
    question('Matter & Solutions', 'medium', 'A sample has a mass of 20 g and a volume of 5 mL. What is its density?', ['2 g/mL', '4 g/mL', '15 g/mL', '25 g/mL'], 'B', 'Density is mass divided by volume: 20 g / 5 mL = 4 g/mL.'),
    question('Matter & Solutions', 'medium', 'In salt water, which substance is the solute?', ['Salt', 'Water', 'The container', 'The air above it'], 'A', 'The solute is the substance dissolved; water is the solvent in this solution.'),
    question('Matter & Solutions', 'hard', 'A solution has pH 3. Compared with a solution at pH 5, it has:', ['A higher hydrogen-ion concentration', 'A lower hydrogen-ion concentration', 'The same hydrogen-ion concentration', 'No hydrogen ions'], 'A', 'Each pH unit represents a tenfold change; pH 3 has 100 times the hydrogen-ion concentration of pH 5.'),
    question('Matter & Solutions', 'easy', 'Which state of matter has a definite volume but takes the shape of its container?', ['Liquid', 'Solid', 'Gas', 'Plasma only'], 'A', 'A liquid keeps a definite volume while flowing to fit its container.'),
    question('Chemical Calculations', 'easy', 'What is the approximate molar mass of H₂O? (H ≈ 1, O ≈ 16)', ['16 g/mol', '17 g/mol', '18 g/mol', '20 g/mol'], 'C', 'H₂O contains two hydrogen atoms and one oxygen atom: 2(1) + 16 = 18 g/mol.'),
    question('Chemical Calculations', 'medium', 'How many moles are in 36 g of water if its molar mass is 18 g/mol?', ['0.5 mol', '2 mol', '18 mol', '54 mol'], 'B', 'Moles equal mass divided by molar mass: 36 g / 18 g/mol = 2 mol.'),
    question('Chemical Calculations', 'medium', 'What is the molarity of 1 mole of solute in 2 liters of solution?', ['0.5 M', '1 M', '2 M', '3 M'], 'A', 'Molarity is moles per liter: 1 mol / 2 L = 0.5 M.'),
    question('Chemical Calculations', 'hard', 'In 2H₂ + O₂ → 2H₂O, how many moles of H₂O can form from 4 moles of H₂ with excess O₂?', ['2 mol', '4 mol', '6 mol', '8 mol'], 'B', 'The balanced ratio of H₂ to H₂O is 2:2, or 1:1, so 4 moles of H₂ can form 4 moles of H₂O.'),
    question('Chemical Calculations', 'easy', 'How many atoms are in one molecule of CO₂?', ['1', '2', '3', '4'], 'C', 'CO₂ contains one carbon atom and two oxygen atoms, for three atoms total.'),
  ],
  Physics: [
    question('Motion & Forces', 'easy', 'A cyclist travels 30 meters in 5 seconds. What is the average speed?', ['5 m/s', '6 m/s', '25 m/s', '150 m/s'], 'B', 'Average speed is distance divided by time: 30 m / 5 s = 6 m/s.'),
    question('Motion & Forces', 'medium', 'A car’s velocity changes from 4 m/s to 16 m/s in 3 seconds. What is its average acceleration?', ['4 m/s²', '6 m/s²', '12 m/s²', '20 m/s²'], 'A', 'Acceleration is change in velocity divided by time: (16 − 4) / 3 = 4 m/s².'),
    question('Motion & Forces', 'medium', 'What net force accelerates a 2 kg cart at 3 m/s²?', ['1.5 N', '5 N', '6 N', '9 N'], 'C', 'Newton’s second law gives F = ma = 2 kg × 3 m/s² = 6 N.'),
    question('Motion & Forces', 'hard', 'A book rests on a table. Which statement best describes the forces on the book?', ['The upward support force balances the downward gravitational force.', 'Gravity is absent because the book is not moving.', 'The book has a net upward force.', 'The table pulls the book downward more than gravity.'], 'A', 'At rest with no vertical acceleration, the support force balances the book’s weight.'),
    question('Motion & Forces', 'easy', 'What is the SI unit of force?', ['Joule', 'Newton', 'Watt', 'Pascal'], 'B', 'Force is measured in newtons (N).'),
    question('Energy & Work', 'easy', 'Which expression gives the kinetic energy of an object?', ['½mv²', 'mgh', 'F/a', 'mv'], 'A', 'Kinetic energy is one-half the mass times the square of speed.'),
    question('Energy & Work', 'medium', 'How much work is done when a 10 N force moves an object 3 m in the force’s direction?', ['3 J', '13 J', '30 J', '300 J'], 'C', 'For force parallel to motion, work is W = Fd = 10 N × 3 m = 30 J.'),
    question('Energy & Work', 'medium', 'A book is lifted to a higher shelf. Which energy store increases?', ['Gravitational potential energy', 'Chemical energy of the shelf', 'Sound energy only', 'Nuclear energy'], 'A', 'Lifting an object increases its gravitational potential energy relative to the ground.'),
    question('Energy & Work', 'hard', 'A closed system loses 50 J of kinetic energy while gaining 50 J of thermal energy. What happens to total energy?', ['It stays the same.', 'It increases by 50 J.', 'It decreases by 50 J.', 'It becomes zero.'], 'A', 'Energy changes form, but the total remains conserved in the closed system.'),
    question('Energy & Work', 'easy', 'What is the SI unit of power?', ['Watt', 'Newton', 'Meter', 'Coulomb'], 'A', 'Power is the rate of energy transfer or work and is measured in watts.'),
    question('Waves & Sound', 'easy', 'What does the frequency of a wave measure?', ['The number of cycles passing a point per second', 'The distance from crest to trough', 'The total energy in a room', 'The speed of the source only'], 'A', 'Frequency is the number of complete cycles per second, measured in hertz.'),
    question('Waves & Sound', 'medium', 'If wave speed stays constant and frequency increases, what happens to wavelength?', ['It decreases.', 'It increases.', 'It stays exactly the same.', 'It becomes zero immediately.'], 'A', 'Wave speed equals frequency times wavelength; at fixed speed, a higher frequency means a shorter wavelength.'),
    question('Waves & Sound', 'medium', 'Which change makes a sound louder, while keeping its pitch the same?', ['Increasing the wave amplitude', 'Increasing the wave frequency', 'Changing the wave into light', 'Reducing the vibration amplitude'], 'A', 'Greater amplitude corresponds to greater sound intensity; frequency determines pitch.'),
    question('Waves & Sound', 'hard', 'Why can sound not travel through a vacuum?', ['It needs particles to vibrate and transfer the disturbance.', 'Its wavelength is always too long.', 'Gravity blocks every sound wave.', 'Sound is a type of electrical current.'], 'A', 'Sound is a mechanical wave and requires a material medium; a vacuum has no particles to carry it.'),
    question('Waves & Sound', 'easy', 'What is the distance between matching points on consecutive waves, such as crest to crest?', ['Wavelength', 'Amplitude', 'Frequency', 'Period'], 'A', 'Wavelength is the distance between consecutive points in the same phase.'),
    question('Electricity & Magnetism', 'easy', 'What is the SI unit of electric current?', ['Ampere', 'Volt', 'Ohm', 'Watt'], 'A', 'Electric current is measured in amperes (A).'),
    question('Electricity & Magnetism', 'medium', 'A 6 Ω resistor is connected to a 12 V source. What current flows through it?', ['0.5 A', '2 A', '6 A', '72 A'], 'B', 'Ohm’s law gives I = V/R = 12 V / 6 Ω = 2 A.'),
    question('Electricity & Magnetism', 'medium', 'In a simple series circuit, what happens if one bulb is removed and opens the circuit?', ['Current stops throughout the circuit.', 'The other bulbs receive more voltage from nowhere.', 'Current bypasses the gap automatically.', 'Only the removed bulb turns off.'], 'A', 'A series circuit has one path; opening it interrupts current everywhere in that path.'),
    question('Electricity & Magnetism', 'hard', 'Two identical resistors are added in parallel to an ideal voltage source. What happens to the equivalent resistance compared with one resistor?', ['It becomes smaller.', 'It becomes larger.', 'It stays the same.', 'It becomes infinite.'], 'A', 'Adding a parallel path lowers the equivalent resistance; two identical resistors in parallel have half the resistance of one.'),
    question('Electricity & Magnetism', 'easy', 'Which pole of a magnet is attracted to a north pole?', ['South pole', 'North pole', 'Either pole equally', 'Neither pole'], 'A', 'Opposite magnetic poles attract and like poles repel.'),
  ],
  History: [
    question('Ancient & Medieval', 'easy', 'Which ancient civilization developed a system of laws associated with Hammurabi?', ['Babylonian', 'Mayan', 'Inca', 'Mongol'], 'A', 'Hammurabi was a Babylonian king whose law code is among the best-known early written legal codes.'),
    question('Ancient & Medieval', 'medium', 'What was a central feature of the Roman Republic?', ['Elected officials and a senate shared political responsibilities.', 'A single pharaoh inherited all offices.', 'Citizens had no assemblies or laws.', 'The emperor was selected by a yearly lottery.'], 'A', 'The Roman Republic used elected magistrates and a senate, though political participation was limited.'),
    question('Ancient & Medieval', 'medium', 'Why was the Silk Road historically important?', ['It connected trade networks across parts of Asia, Africa, and Europe.', 'It was a single paved road built only for Roman armies.', 'It prevented all cultural exchange.', 'It carried silk only within China.'], 'A', 'The Silk Road was a network of routes that facilitated trade and cultural exchange across regions.'),
    question('Ancient & Medieval', 'hard', 'What was one major effect of the Magna Carta in England?', ['It established that the king was subject to certain laws.', 'It immediately created universal voting rights.', 'It ended every war in Europe.', 'It abolished Parliament.'], 'A', 'The 1215 Magna Carta limited some royal actions and became an important precedent for rule of law.'),
    question('Ancient & Medieval', 'easy', 'Which river was central to the development of ancient Egyptian civilization?', ['Nile', 'Amazon', 'Danube', 'Mississippi'], 'A', 'The Nile’s predictable flooding supported agriculture and settlement in ancient Egypt.'),
    question('Revolutions & Government', 'easy', 'In what year was the U.S. Declaration of Independence adopted?', ['1492', '1776', '1789', '1865'], 'B', 'The Continental Congress adopted the Declaration of Independence on July 4, 1776.'),
    question('Revolutions & Government', 'medium', 'Which idea is most closely associated with separation of powers?', ['Dividing government authority among branches', 'Giving all authority to one official', 'Replacing laws with custom', 'Allowing courts to write every budget'], 'A', 'Separation of powers distributes government responsibilities among branches to limit concentrated authority.'),
    question('Revolutions & Government', 'medium', 'The French Revolution began in 1789 amid demands for:', ['Political and social change, including greater representation', 'A return to feudal obligations', 'The end of all public education', 'A new Mongol empire'], 'A', 'Economic hardship and unequal political structures contributed to demands for major change in 1789.'),
    question('Revolutions & Government', 'hard', 'Which Enlightenment principle influenced constitutional government?', ['Government authority should be limited by laws and rights.', 'Monarchs should have unlimited power by birth.', 'Citizens should have no role in government.', 'Laws should change without public notice.'], 'A', 'Enlightenment thinkers argued for ideas such as natural rights, consent, and limits on government power.'),
    question('Revolutions & Government', 'easy', 'What is a constitution?', ['A framework that establishes government powers and rules', 'A list of all citizens’ jobs', 'A map of national borders', 'A record of yearly weather'], 'A', 'A constitution sets out a government’s structure, authority, and often the rights of its people.'),
    question('Modern World', 'easy', 'What event immediately triggered the start of World War I in 1914?', ['The assassination of Archduke Franz Ferdinand', 'The fall of the Berlin Wall', 'The start of the French Revolution', 'The signing of the Treaty of Versailles'], 'A', 'The assassination in Sarajevo set off a crisis among European powers, though deeper causes also contributed to the war.'),
    question('Modern World', 'medium', 'The Industrial Revolution first transformed production mainly through:', ['Mechanized manufacturing and new energy sources', 'A return to hand production in every industry', 'The end of long-distance trade', 'The replacement of cities by farms'], 'A', 'Mechanized production and new energy sources reshaped manufacturing, transport, and work.'),
    question('Modern World', 'medium', 'The United Nations was founded after World War II primarily to:', ['Promote international cooperation and help prevent future conflict', 'Replace every national government', 'Control all world trade directly', 'Restore the Roman Empire'], 'A', 'The UN was established in 1945 to encourage cooperation, peace, and collective security.'),
    question('Modern World', 'hard', 'Why is the fall of the Berlin Wall in 1989 considered significant?', ['It symbolized the weakening division of Europe during the Cold War.', 'It began World War I.', 'It created the Roman Republic.', 'It ended the Industrial Revolution.'], 'A', 'The wall’s opening symbolized major political changes in Eastern Europe and the approaching end of the Cold War division.'),
    question('Modern World', 'easy', 'Which conflict ended with the armistice of November 11, 1918?', ['World War I', 'World War II', 'The Korean War', 'The French Revolution'], 'A', 'The armistice of November 11, 1918, ended fighting on the Western Front of World War I.'),
    question('U.S. History', 'easy', 'The Emancipation Proclamation took effect in 1863 and declared enslaved people free in:', ['Areas in rebellion against the United States', 'Every country in the Americas', 'All border states without exception', 'The western territories only'], 'A', 'The proclamation applied to enslaved people in designated areas then in rebellion; later the 13th Amendment abolished slavery nationwide.'),
    question('U.S. History', 'medium', 'Which amendment abolished slavery throughout the United States?', ['10th', '13th', '15th', '19th'], 'B', 'The 13th Amendment, ratified in 1865, abolished slavery except as punishment for a crime.'),
    question('U.S. History', 'medium', 'What did the Supreme Court rule in Brown v. Board of Education (1954)?', ['Segregated public schools were unconstitutional.', 'Women could not vote in federal elections.', 'The income tax was unconstitutional.', 'The United States should enter World War I.'], 'A', 'Brown v. Board held that racial segregation in public schools violated the Equal Protection Clause.'),
    question('U.S. History', 'hard', 'The New Deal programs of the 1930s were primarily a response to:', ['The Great Depression', 'The American Revolution', 'The War of 1812', 'The Cold War'], 'A', 'President Franklin D. Roosevelt’s New Deal programs responded to the economic crisis of the Great Depression.'),
    question('U.S. History', 'easy', 'Which document begins with “We the People” and establishes the U.S. federal government?', ['The U.S. Constitution', 'The Emancipation Proclamation', 'The Monroe Doctrine', 'The Declaration of Sentiments'], 'A', '“We the People” is the opening phrase of the U.S. Constitution’s preamble.'),
  ],
  Geography: [
    question('Maps & Location', 'easy', 'What is the latitude of the Equator?', ['0°', '23.5° N', '66.5° S', '90° N'], 'A', 'The Equator is the line at 0 degrees latitude, halfway between the poles.'),
    question('Maps & Location', 'medium', 'What does a map scale help a reader determine?', ['Real-world distance represented by map distance', 'The age of the map paper', 'The temperature at every location', 'The number of languages in a country'], 'A', 'A map scale relates a measured distance on the map to the corresponding distance on Earth.'),
    question('Maps & Location', 'medium', 'Lines of longitude run from:', ['The North Pole to the South Pole', 'East to west, parallel to the Equator', 'One continent to another only', 'The Equator to the nearest ocean'], 'A', 'Meridians of longitude connect the poles and measure positions east or west of the Prime Meridian.'),
    question('Maps & Location', 'hard', 'Why do many flat world maps distort the size or shape of some places?', ['Projecting a curved Earth onto a flat surface requires distortion.', 'The Equator changes length each year.', 'Longitude lines are all parallel on Earth.', 'Maps cannot show more than one continent.'], 'A', 'Every flat map projection involves some distortion of area, shape, distance, or direction.'),
    question('Maps & Location', 'easy', 'What do contour lines on a topographic map connect?', ['Points of equal elevation', 'Places with equal population', 'Rivers with equal flow', 'Cities with the same time zone'], 'A', 'A contour line joins locations at the same elevation above a reference level.'),
    question('Physical Geography', 'easy', 'At a divergent plate boundary, tectonic plates move:', ['Apart', 'Toward each other', 'Sideways past each other only', 'Without any relative motion'], 'A', 'Divergent boundaries occur where plates move apart, often allowing magma to rise and form new crust.'),
    question('Physical Geography', 'medium', 'What is the difference between weathering and erosion?', ['Weathering breaks rock down; erosion transports the material.', 'Weathering transports rock; erosion creates sunlight.', 'They both mean only volcanic activity.', 'Erosion happens only in deserts.'], 'A', 'Weathering breaks material down in place, while erosion moves it by water, wind, ice, or gravity.'),
    question('Physical Geography', 'medium', 'A river delta most commonly forms where a river:', ['Enters a larger body of water and deposits sediment', 'Begins on a mountain peak', 'Flows through a desert without sediment', 'Moves underground through solid rock'], 'A', 'As river velocity slows at its mouth, sediment can be deposited and build a delta.'),
    question('Physical Geography', 'hard', 'A rain shadow is most likely on the side of a mountain that is:', ['Downwind, after moist air has risen and lost precipitation', 'Upwind, before air reaches the mountain', 'At the Equator only', 'Below sea level in every case'], 'A', 'Moist air often rises and rains on the windward side; descending air on the leeward side is drier.'),
    question('Physical Geography', 'easy', 'Which process moves loose soil downhill under the force of gravity?', ['Mass movement', 'Condensation', 'Photosynthesis', 'Sublimation'], 'A', 'Mass movement is the downslope movement of rock or soil under gravity.'),
    question('Climate & Biomes', 'easy', 'What is climate?', ['Long-term patterns of temperature and precipitation', 'The conditions outside at one moment', 'A single storm forecast', 'The daily movement of ocean tides'], 'A', 'Climate summarizes long-term patterns, while weather describes short-term atmospheric conditions.'),
    question('Climate & Biomes', 'medium', 'Which biome typically has high temperatures and heavy rainfall throughout the year?', ['Tropical rainforest', 'Tundra', 'Hot desert', 'Temperate grassland'], 'A', 'Tropical rainforests are generally warm and receive abundant rainfall year-round.'),
    question('Climate & Biomes', 'medium', 'Which gas is a major greenhouse gas released when fossil fuels are burned?', ['Carbon dioxide', 'Helium', 'Neon', 'Argon'], 'A', 'Burning fossil fuels releases carbon dioxide, which absorbs and emits infrared radiation.'),
    question('Climate & Biomes', 'hard', 'Why can removing large areas of forest affect a region’s water cycle?', ['It can reduce transpiration and change how water returns to the atmosphere.', 'It stops all evaporation from oceans.', 'It changes Earth’s rotation rate.', 'It removes the atmosphere’s nitrogen.'], 'A', 'Plants return water vapor to the atmosphere through transpiration, so widespread deforestation can affect local moisture patterns.'),
    question('Climate & Biomes', 'easy', 'Which biome is characterized by very low precipitation?', ['Desert', 'Tropical rainforest', 'Wetland', 'Temperate rainforest'], 'A', 'Deserts are defined by low precipitation, though their temperatures can vary.'),
    question('Human Geography', 'easy', 'Population density is calculated by dividing population by:', ['Land area', 'Average age', 'Annual rainfall', 'Number of languages'], 'A', 'Population density measures how many people live in a given unit of area.'),
    question('Human Geography', 'medium', 'Urbanization is the growth in the proportion of people living in:', ['Towns and cities', 'Rural farms only', 'Mountain forests', 'Uninhabited regions'], 'A', 'Urbanization describes an increasing share of a population living in urban areas.'),
    question('Human Geography', 'medium', 'Which is a push factor that may encourage people to leave a place?', ['A prolonged lack of jobs', 'A new local school', 'Family nearby', 'Reliable public services'], 'A', 'A push factor is a condition that encourages people to leave, such as limited employment.'),
    question('Human Geography', 'hard', 'A country’s population pyramid has a very wide base and narrows quickly toward the top. What does this often indicate?', ['A relatively young population and potentially rapid growth', 'A population made up only of retirees', 'No births for many decades', 'Equal numbers in every age group'], 'A', 'A wide base represents many young people; if birth rates remain high, the population may grow rapidly.'),
    question('Human Geography', 'easy', 'What is migration?', ['The movement of people from one place to another to live', 'The seasonal change in temperature', 'The movement of tectonic plates', 'The exchange of goods at a market'], 'A', 'Migration is the movement of people between places, often involving a change in residence.'),
  ],
  Literature: [
    question('Literary Elements', 'easy', '“The classroom was a beehive of activity” is an example of:', ['Metaphor', 'Simile', 'Onomatopoeia', 'Literal description'], 'A', 'The classroom is directly compared to a beehive without using “like” or “as,” making it a metaphor.'),
    question('Literary Elements', 'medium', 'What is a theme in a story?', ['A central idea or insight developed through the story', 'A list of every event in order', 'The place where the story occurs', 'The name of the narrator'], 'A', 'Theme is an idea or insight a work develops, not simply its plot or setting.'),
    question('Literary Elements', 'medium', 'A reader knows a character is being followed, but the character does not. This is an example of:', ['Dramatic irony', 'Alliteration', 'Personification', 'Flashback'], 'A', 'Dramatic irony occurs when the audience knows something a character does not.'),
    question('Literary Elements', 'hard', 'A writer adds an early hint that a conflict will happen later. What is this technique called?', ['Foreshadowing', 'Resolving the conflict', 'Changing the narrator', 'Providing a dictionary definition'], 'A', 'Foreshadowing is a clue or detail that suggests a later event.'),
    question('Literary Elements', 'easy', 'Who tells a first-person narrative?', ['A narrator who uses “I” or “we”', 'An outside narrator who never appears in the story', 'The reader', 'The publisher'], 'A', 'First-person narration uses pronouns such as “I” or “we” from a narrator’s perspective.'),
    question('Poetry', 'easy', '“Her smile was like sunshine” is an example of:', ['Simile', 'Metaphor', 'Hyperbole', 'Irony'], 'A', 'A simile makes a comparison using “like” or “as.”'),
    question('Poetry', 'medium', 'What is a stanza?', ['A grouped set of lines in a poem', 'The repeated end sound only', 'The poem’s title', 'A character’s speech in a play'], 'A', 'A stanza is a grouped section of lines, similar to a paragraph in prose.'),
    question('Poetry', 'medium', 'What is enjambment?', ['A sentence or phrase continuing beyond the end of a poetic line', 'A poem with exactly fourteen lines', 'A repeated consonant at the start of words', 'A pause marked at every line ending'], 'A', 'Enjambment occurs when a phrase or sentence runs on to the next poetic line without a grammatical pause.'),
    question('Poetry', 'hard', 'In traditional iambic pentameter, how many iambic feet are usually in each line?', ['Five', 'Four', 'Six', 'Ten'], 'A', '“Pentameter” refers to five metrical feet; an iamb has an unstressed syllable followed by a stressed one.'),
    question('Poetry', 'easy', 'Which sound device repeats the beginning consonant sound in nearby words?', ['Alliteration', 'Rhyme', 'Assonance', 'Enjambment'], 'A', 'Alliteration repeats initial consonant sounds in nearby words.'),
    question('Drama', 'easy', 'What is a soliloquy?', ['A speech in which a character speaks thoughts aloud, often alone on stage', 'A list of costume instructions', 'A conversation between two narrators', 'The final printed page of a novel'], 'A', 'A soliloquy reveals a character’s thoughts through a speech, commonly delivered alone.'),
    question('Drama', 'medium', 'In a play script, what does a stage direction usually provide?', ['Instructions about movement, setting, or delivery', 'A scientific explanation of the plot', 'A list of audience members', 'The author’s sales figures'], 'A', 'Stage directions guide performance details such as movement, setting, and sometimes tone.'),
    question('Drama', 'medium', 'A character briefly speaks to the audience, and the other characters are not meant to hear. This is an:', ['Aside', 'Act', 'Scene change', 'Prologue'], 'A', 'An aside is a short remark to the audience or another character that others on stage do not hear.'),
    question('Drama', 'hard', 'The audience knows a sealed letter contains a warning, but the characters open it too late. Which device is strongest?', ['Dramatic irony', 'Rhyme', 'Flash-forward', 'Onomatopoeia'], 'A', 'The audience’s knowledge exceeds the characters’ knowledge, creating dramatic irony.'),
    question('Drama', 'easy', 'A large division of a play is commonly called an:', ['Act', 'Stanza', 'Chapter heading only', 'Footnote'], 'A', 'Plays are commonly divided into acts, which may contain scenes.'),
    question('World Literature', 'easy', 'An epic is best described as:', ['A long narrative work centered on significant deeds or journeys', 'A one-line poem with no imagery', 'A list of stage directions', 'A short factual map key'], 'A', 'Epics are long narrative works that often recount heroic journeys or events important to a culture.'),
    question('World Literature', 'medium', 'What is an oral tradition?', ['Stories and knowledge passed by speaking and performance across generations', 'A text printed only in a textbook', 'A form of punctuation', 'A map drawn from memory'], 'A', 'Oral traditions preserve and transmit stories, histories, and knowledge through spoken performance.'),
    question('World Literature', 'medium', 'When comparing translations of a poem, why might a phrase differ between versions?', ['Translators make choices about meaning, tone, and word form.', 'The original text changes every time it is read.', 'Poems cannot be translated.', 'Every language has identical word order.'], 'A', 'Translation requires choices because words, sound, and cultural meanings rarely match exactly across languages.'),
    question('World Literature', 'hard', 'A character’s understanding of their community’s values changes. What is a strong focus for literary analysis?', ['How the character’s changing perspective develops the work’s theme', 'How many pages the book has', 'The color of the book cover', 'The order of the publisher’s advertisements'], 'A', 'Tracing a character’s changing perspective connects characterization to the work’s central meaning.'),
    question('World Literature', 'easy', 'What is a folktale?', ['A traditional story shared within a culture, often across generations', 'A laboratory procedure', 'A list of geographic coordinates', 'A stage lighting cue'], 'A', 'Folktales are traditional narratives passed down within communities, often orally.'),
  ],
};

const OPTION_IDS: QuizOptionId[] = ['A', 'B', 'C', 'D'];

// The same reviewed sample set is tagged for each high-school grade. A future
// curriculum-aligned release can replace these shared samples with grade-specific
// collections without changing the quiz flow.
export const QUIZ_QUESTION_BANK: QuizQuestion[] = QUIZ_SUBJECTS.flatMap(
  (subject, subjectIndex) =>
    QUIZ_GRADES.flatMap((grade) =>
      QUESTION_SEEDS[subject].map((seed, index) => {
        const correctOption = seed.options[OPTION_IDS.indexOf(seed.correctOptionId)];
        // Rotate correct positions across A–D so answer letters are not predictable.
        const answerPosition = (index + subjectIndex) % OPTION_IDS.length;
        const distractors = seed.options.filter(
          (_, optionIndex) => optionIndex !== OPTION_IDS.indexOf(seed.correctOptionId),
        );
        distractors.splice(answerPosition, 0, correctOption);

        return {
          id: `${grade}-${subject.toLowerCase().replaceAll(' ', '-')}-${index + 1}`,
          grade,
          subject,
          topic: seed.topic,
          difficulty: seed.difficulty,
          prompt: seed.prompt,
          options: distractors.map((text, optionIndex) => ({
            id: OPTION_IDS[optionIndex],
            text,
          })),
          correctOptionId: OPTION_IDS[answerPosition],
          explanation: seed.explanation,
        };
      }),
    ),
);

export const ALL_QUIZ_TOPICS = '__all_topics__';
export const QUIZ_QUESTION_COUNTS = [5, 10, 20] as const;
export type QuizQuestionCount = (typeof QUIZ_QUESTION_COUNTS)[number];

export function getQuizTopics(grade: QuizGrade, subject: QuizSubject) {
  return Array.from(
    new Set(
      QUIZ_QUESTION_BANK.filter(
        (item) => item.grade === grade && item.subject === subject,
      ).map((item) => item.topic),
    ),
  );
}

export function getQuizQuestionPool(
  grade: QuizGrade,
  subject: QuizSubject,
  topic: string,
  preferredDifficulty: QuizDifficulty,
) {
  const difficultyOrder: Record<QuizDifficulty, number> = {
    easy: 0,
    medium: 1,
    hard: 2,
  };
  const preferredRank = difficultyOrder[preferredDifficulty];

  return QUIZ_QUESTION_BANK.filter(
    (item) =>
      item.grade === grade &&
      item.subject === subject &&
      (topic === ALL_QUIZ_TOPICS || item.topic === topic),
  ).sort((left, right) => {
    const leftDistance = Math.abs(
      difficultyOrder[left.difficulty] - preferredRank,
    );
    const rightDistance = Math.abs(
      difficultyOrder[right.difficulty] - preferredRank,
    );
    return leftDistance - rightDistance;
  });
}
