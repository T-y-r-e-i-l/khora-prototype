/* ============================================================
   Palinode — Philosophical Corpus
   Cross-traditional concept index used by the analysis engine.
   Each concept declares its trigger surface, its lineage, the
   reading it offers, and the question it turns back on the writer.
   ============================================================ */

const CATEGORIES = {
  resonance: { id:'resonance', label:'Resonance',  hue:'#F6A244', blurb:'A tradition your writing is already speaking to.' },
  tension:   { id:'tension',   label:'Tension',    hue:'#E5484D', blurb:'A logical strain worth sitting with.' },
  clarity:   { id:'clarity',   label:'Clarity',    hue:'#A78BFA', blurb:'A word doing more work than it has defined.' },
  stance:    { id:'stance',    label:'Stance',     hue:'#D8C25A', blurb:'How you are positioning yourself toward what you know.' },
  lineage:   { id:'lineage',   label:'Lineage',    hue:'#5EC7C0', blurb:'A parallel from another tradition entirely.' }
};

const TRADITIONS = {
  greek:      'Ancient Greek',
  hellenistic:'Hellenistic',
  modern:     'Modern European',
  existential:'Existentialist',
  analytic:   'Analytic',
  critical:   'Critical Theory',
  buddhist:   'Buddhist',
  daoist:     'Daoist',
  confucian:  'Confucian',
  vedic:      'Vedic & Hindu',
  islamic:    'Islamic & Sufi',
  african:    'African',
  japanese:   'Japanese Aesthetics',
  feminist:   'Feminist & Care Ethics'
};

/* --- Concept index -------------------------------------------------
   trigger : RegExp matched against the note (case-insensitive)
   category: key of CATEGORIES
   reading : the interpretive move the app makes
   turn    : the question handed back to the writer
   sources : { work, author, note }
   kin     : ids of adjacent concepts (drives the constellation)
------------------------------------------------------------------ */
const CONCEPTS = [
  {
    id:'eudaimonia', label:'Eudaimonia', tradition:'greek', category:'resonance',
    trigger:/\b(happy|happiness|fulfil?led|fulfilment|fulfillment|the good life|content(ed|ment)?|satisf(ied|action)|thriving|flourish)\w*/i,
    reading:'You are reaching for happiness as a feeling. Aristotle argued that eudaimonia is not a mood at all but an activity — a life going well over its whole arc, the way a flute-player is not "good" in a moment but across a performance. On that reading, asking whether you are happy today is close to a category error.',
    turn:'If happiness were an activity rather than a state, what would you have to be doing right now to be in it?',
    sources:[{work:'Nicomachean Ethics, Book I', author:'Aristotle', note:'The function argument: the good for a thing follows from what that thing characteristically does.'},
             {work:'Letters to Menoeceus', author:'Epicurus', note:'The rival account — pleasure as absence of disturbance, not accumulation.'}],
    kin:['virtue','telos','absurd']
  },
  {
    id:'virtue', label:'Virtue & Habituation', tradition:'greek', category:'resonance',
    trigger:/\b(habits?|routines?|discipline|practice|consistent(ly)?|every ?day I|trying to be(come)? (a )?(better|kinder|more))\b/i,
    reading:'Character, for Aristotle, is not something you have and then act from — it is laid down by the acts themselves. We become just by doing just things. Your description of a routine is, on this view, a description of who you are currently manufacturing.',
    turn:'What is the habit you are building actually training you to become, as opposed to what you intend it to build?',
    sources:[{work:'Nicomachean Ethics, Book II', author:'Aristotle', note:'Virtue as hexis — a settled disposition formed by repetition.'},
             {work:'Analects', author:'Confucius', note:'Li (ritual propriety) makes a parallel claim: form shapes the inner life, not only the reverse.'}],
    kin:['eudaimonia','ren','wuwei']
  },
  {
    id:'stoic-control', label:'The Dichotomy of Control', tradition:'hellenistic', category:'resonance',
    trigger:/\b(can'?t control|out of my (hands|control)|nothing I can do|powerless|beyond my control|wish (things|it) (were|was) different|shouldn'?t have happened)/i,
    reading:'Epictetus opens by dividing everything into what is up to us and what is not — and insists that nearly all suffering comes from treating the second category as if it were the first. The distress in this passage may be located in the gap, not in the event.',
    turn:'Strip out everything in this situation that was never yours to decide. What remains, and is that the part you have been writing about?',
    sources:[{work:'Enchiridion, §1', author:'Epictetus', note:'The founding division of Stoic practice.'},
             {work:'Meditations', author:'Marcus Aurelius', note:'Applied nightly, by an emperor with more control than most, to little avail.'}],
    kin:['amor-fati','determinism','dukkha']
  },
  {
    id:'amor-fati', label:'Amor Fati', tradition:'modern', category:'resonance',
    trigger:/\b(regrets?|if I could go back|wish I had|should have|done? it differently|take it back|undo)\b/i,
    reading:'Nietzsche set a hard test: not merely to bear what happened but to want it, to find it necessary. Regret, in his frame, is a quiet verdict against your own life — you are saying the whole chain that produced you should have gone otherwise.',
    turn:'If this exact event were required for everything you now value about yourself, would you still call it a mistake?',
    sources:[{work:'Ecce Homo', author:'Friedrich Nietzsche', note:'His formula for greatness in a human being.'},
             {work:'The Gay Science, §341', author:'Friedrich Nietzsche', note:'The eternal recurrence as a thought experiment about affirmation.'}],
    kin:['recurrence','stoic-control','ressentiment']
  },
  {
    id:'recurrence', label:'Eternal Recurrence', tradition:'modern', category:'resonance',
    trigger:/\b(again and again|same (thing|pattern|cycle)|stuck in a (loop|cycle|rut)|repeat(ing)?|over and over)\b/i,
    reading:'Nietzsche proposed the recurrence not as cosmology but as a scale: if a demon told you that you would live this exact day innumerable times more, would you gnash your teeth or call it divine? A repeating pattern is only a trap if you would not choose it.',
    turn:'Would you take this day again, unchanged, forever? If not, which single part is the one you would refuse?',
    sources:[{work:'The Gay Science, §341', author:'Friedrich Nietzsche', note:'"The greatest weight."'},
             {work:'Thus Spoke Zarathustra', author:'Friedrich Nietzsche', note:'The doctrine restaged as the hardest thing to affirm.'}],
    kin:['amor-fati','absurd','samsara']
  },
  {
    id:'dukkha', label:'Dukkha & Impermanence', tradition:'buddhist', category:'lineage',
    trigger:/\b(let(ting)? go|hold(ing)? on|clinging|attach(ed|ment)|grief|grieving|nothing lasts|temporary|impermanen)/i,
    reading:'The first noble truth is usually flattened into "life is suffering," but dukkha is closer to a wheel off its axle — the friction of holding a changing thing still. The pain in what you describe may be located not in the loss but in the grip.',
    turn:'What are you holding as though it were permanent, and what would remain if you stopped insisting on that?',
    sources:[{work:'Dhammapada', author:'Attributed to the Buddha', note:'On craving as the root of the wheel.'},
             {work:'Mūlamadhyamakakārikā', author:'Nāgārjuna', note:'Emptiness (śūnyatā): things lack the fixed essence our grip presumes.'},
             {work:'Meditations, IV', author:'Marcus Aurelius', note:'A Stoic reaching the same conclusion from a different direction.'}],
    kin:['anatta','impermanence-aesthetic','stoic-control']
  },
  {
    id:'anatta', label:'Anattā — No Fixed Self', tradition:'buddhist', category:'clarity',
    trigger:/\b(my (true|real|authentic) self|who I (really )?am|find myself|figure out who|identity|the real me|be myself)/i,
    reading:'You are searching for a self to uncover. The Buddhist analysis denies there is one to find: what we call a self is five aggregates in motion, no more a thing than a chariot is a thing apart from its parts. Hume arrived independently at the same place — introspection turns up perceptions, never a perceiver.',
    turn:'What if there is no true self underneath to discover, only the one you are assembling by writing this?',
    sources:[{work:'Anattalakkhaṇa Sutta', author:'Pāli Canon', note:'The five aggregates argument.'},
             {work:'A Treatise of Human Nature, I.iv.6', author:'David Hume', note:'The bundle theory — he looks for the self and finds only perceptions.'},
             {work:'Reasons and Persons', author:'Derek Parfit', note:'Modern successor: identity is not what matters in survival.'}],
    kin:['ship-of-theseus','double-consciousness','bad-faith']
  },
  {
    id:'bad-faith', label:'Bad Faith', tradition:'existential', category:'tension',
    trigger:/\b(I had no choice|no other option|I have to|forced to|that'?s just (who|how) I am|I'?m just (a|an|not)|can'?t help (it|myself)|it'?s not (my|up to) me)/i,
    reading:'Sartre would name this mauvaise foi: the move where we describe ourselves as a fixed thing — a waiter, a coward, a person who simply is this way — in order to escape the vertigo of having chosen. Even the choice to stay is a choice. "I had to" is almost always a decision wearing a disguise.',
    turn:'Name the alternative you rejected. If you cannot name one, you have not yet described the situation honestly.',
    sources:[{work:'Being and Nothingness, Part I ch.2', author:'Jean-Paul Sartre', note:'The waiter, the woman on the date, the flight from freedom.'},
             {work:'The Ethics of Ambiguity', author:'Simone de Beauvoir', note:'Corrects Sartre: freedom is situated, and some constraints are real.'}],
    kin:['situated-freedom','determinism','angst']
  },
  {
    id:'angst', label:'Angst & Thrownness', tradition:'existential', category:'resonance',
    trigger:/\b(anxious|anxiety|dread|unease|restless|overwhelm(ed|ing)|panic|on edge|can'?t settle)\b/i,
    reading:'Kierkegaard distinguished fear, which has an object, from angst, which does not — it is the dizziness of freedom, the mind registering that it could do anything. Heidegger adds that anxiety is disclosive: it strips the world of its familiar usefulness so that your own existence shows up as a question.',
    turn:'Is this anxiety about a thing, or is it the absence of a thing — the openness itself?',
    sources:[{work:'The Concept of Anxiety', author:'Søren Kierkegaard', note:'Anxiety as the dizziness of freedom.'},
             {work:'Being and Time, §40', author:'Martin Heidegger', note:'Angst individualises Dasein and reveals thrownness.'}],
    kin:['bad-faith','being-toward-death','absurd']
  },
  {
    id:'being-toward-death', label:'Being-Toward-Death', tradition:'existential', category:'resonance',
    trigger:/\b(death|dying|died|mortal(ity)?|funeral|running out of time|not enough time|when I'?m gone|life is short)\b/i,
    reading:'Heidegger argued that we ordinarily hold death at arm’s length as an event that happens to people in general — "one dies." Authentic existence begins when death is taken as my ownmost possibility, non-relational and not to be outstripped. It is the one thing no one can do on your behalf.',
    turn:'What in your current life would not survive contact with the fact that it ends?',
    sources:[{work:'Being and Time, §§46–53', author:'Martin Heidegger', note:'Being-toward-death and the flight into das Man.'},
             {work:'Letters to Menoeceus', author:'Epicurus', note:'The opposing view: where death is, I am not — so it is nothing to me.'},
             {work:'Bardo Thödol', author:'Tibetan tradition', note:'Death as a practised passage rather than a terminus.'}],
    kin:['absurd','dukkha','angst']
  },
  {
    id:'absurd', label:'The Absurd', tradition:'existential', category:'resonance',
    trigger:/\b(pointless|meaningless|no point|why bother|what'?s the point|futile|nothing matters|absurd|going nowhere)\b/i,
    reading:'Camus locates the absurd not in the world and not in you, but in the collision between them: a mind that demands meaning meeting a universe that returns silence. His conclusion is not despair but refusal — one must imagine Sisyphus happy, because the scorn of the rock is itself the victory.',
    turn:'Are you asking the universe for meaning, or asking yourself? The absurd only appears when you confuse the two.',
    sources:[{work:'The Myth of Sisyphus', author:'Albert Camus', note:'Suicide as the one serious philosophical problem, and its refusal.'},
             {work:'Ecclesiastes', author:'Hebrew Bible', note:'Hevel — vapour, breath — the older name for the same vertigo.'}],
    kin:['angst','recurrence','theodicy']
  },
  {
    id:'ren', label:'Ren & Li — Benevolence and Role', tradition:'confucian', category:'lineage',
    trigger:/\b(famil(y|ies)|my (mother|father|mom|dad|parents|son|daughter|brother|sister)|obligations?|duty to|owe (it|them)|elders|expected of me|my role)/i,
    reading:'Confucian ethics starts where Western ethics usually does not: not with the isolated agent choosing, but with the person already inside relations — child, sibling, colleague. Ren (humaneness) is cultivated through li, the forms of those relations. What reads as constraint may be the medium of your moral development rather than an obstacle to it.',
    turn:'Is the obligation you are describing something imposed on who you are, or partly constitutive of it?',
    sources:[{work:'Analects', author:'Confucius', note:'Ren as the achievement of a lifetime, practised in ordinary relations.'},
             {work:'Mencius, 2A:6', author:'Mengzi', note:'The child at the well: moral response as native sprout, needing cultivation.'},
             {work:'African Philosophy Through Ubuntu', author:'Mogobe Ramose', note:'A separate tradition reaching a strikingly similar relational self.'}],
    kin:['ubuntu','care-ethics','virtue']
  },
  {
    id:'wuwei', label:'Wu Wei — Effortless Action', tradition:'daoist', category:'lineage',
    trigger:/\b(forcing|forced? (it|myself)|push(ing)? (through|harder)|grind(ing)?|struggl(e|ing) to|trying so hard|willpower|make it happen)/i,
    reading:'The Daodejing treats striving as often self-defeating: water yields and wears down stone. Wu wei is not passivity but action without friction — the cook in Zhuangzi whose blade never dulls because it moves through the gaps rather than the bone. Effort applied against the grain is still effort, and it is what breaks the knife.',
    turn:'Where is the grain of this situation, and are you cutting with it or across it?',
    sources:[{work:'Daodejing, ch. 8 & 78', author:'Laozi', note:'The water analogy for yielding strength.'},
             {work:'Zhuangzi, "The Dexterous Butcher"', author:'Zhuang Zhou', note:'Skill as attunement rather than mastery.'}],
    kin:['stoic-control','flow','ren']
  },
  {
    id:'ubuntu', label:'Ubuntu — Personhood Through Others', tradition:'african', category:'lineage',
    trigger:/\b(alone|lonel(y|iness)|isolat(ed|ion)|communit(y|ies)|belong(ing)?|my people|no one (understands|gets)|shut out)/i,
    reading:'Umuntu ngumuntu ngabantu — a person is a person through other persons. Southern African philosophy treats personhood as an achievement conferred in relation, not a property you carry into the room. Loneliness on this view is not merely painful; it is ontologically deficient, a subtraction from what you are.',
    turn:'If you become a person through others, what does your current isolation mean you are currently less of?',
    sources:[{work:'African Religions and Philosophy', author:'John Mbiti', note:'"I am because we are; and since we are, therefore I am."'},
             {work:'African Philosophy Through Ubuntu', author:'Mogobe Ramose', note:'Ubuntu as a verb — being-with as ongoing activity.'},
             {work:'An Essay on African Philosophical Thought', author:'Kwame Gyekye', note:'The Akan account: moderate communitarianism, preserving individual rights.'}],
    kin:['ren','levinas-other','care-ethics']
  },
  {
    id:'sankofa', label:'Sankofa — Return and Retrieve', tradition:'african', category:'lineage',
    trigger:/\b(where I came from|my (roots|past|history|childhood|upbringing)|ancestors|grew up|heritage|generations?)\b/i,
    reading:'The Akan symbol shows a bird flying forward with its head turned back, an egg in its beak: se wo were fi na wosankofa a yenkyi — it is not taboo to go back and fetch what you forgot. Retrieval is not regression. The past is treated as a resource to be carried forward, not a place to live.',
    turn:'What are you going back for, and what will you do with it once you have it?',
    sources:[{work:'An Essay on African Philosophical Thought', author:'Kwame Gyekye', note:'Akan proverbs read as a philosophical corpus.'},
             {work:'In Search of Lost Time', author:'Marcel Proust', note:'Involuntary memory: the past retrieved by the body, not the will.'}],
    kin:['ubuntu','ship-of-theseus','recurrence']
  },
  {
    id:'karma-dharma', label:'Karma & Svadharma', tradition:'vedic', category:'lineage',
    trigger:/\b(deserved?|karma|meant to (be|do)|my (purpose|calling|path)|supposed to|destiny|fate|happened for a reason)/i,
    reading:'The Gita’s counsel to Arjuna is precise: you have a right to the action, never to its fruits. Svadharma is your own proper work, and it is better done imperfectly than another’s done well. This severs the link you may be assuming between doing the right thing and being rewarded for it.',
    turn:'Would you still do this if it were guaranteed to go unrecognised and unrewarded?',
    sources:[{work:'Bhagavad Gītā, 2.47 & 3.35', author:'Vyāsa (attrib.)', note:'Nishkama karma — action without attachment to result.'},
             {work:'Enchiridion', author:'Epictetus', note:'The Stoic parallel: act well, release the outcome.'}],
    kin:['stoic-control','telos','samsara']
  },
  {
    id:'maya', label:'Māyā & Non-Duality', tradition:'vedic', category:'lineage',
    trigger:/\b(illusion|not real|unreal|everything is connected|oneness|the universe|bigger than me|dissolve|all one)/i,
    reading:'Advaita Vedānta holds that the multiplicity you perceive is māyā — not a lie, but a partial reading, like the rope taken for a snake. Ātman and Brahman are not two. The felt sense of connection you are describing is, in this frame, not a mood but a momentary accuracy.',
    turn:'Is the separateness you usually feel the true state, and this the exception — or the reverse?',
    sources:[{work:'Chāndogya Upaniṣad, 6.8', author:'Upaniṣads', note:'Tat tvam asi — that thou art.'},
             {work:'Vivekacūḍāmaṇi', author:'Śaṅkara (attrib.)', note:'The rope-and-snake analogy for superimposition.'},
             {work:'Masnavi', author:'Rūmī', note:'Sufi fanā — annihilation of the self — as a parallel dissolution.'}],
    kin:['fana','anatta','flow']
  },
  {
    id:'fana', label:'Fanā & the Polished Heart', tradition:'islamic', category:'lineage',
    trigger:/\b(surrender|humilit(y)?|humbl(e|ed)|my ego|pride|let go of control|submit|awe|reverence)\b/i,
    reading:'Sufi practice treats the self as a mirror clouded by its own insistence. Fanā is the annihilation of that insistence — not self-destruction but the removal of what obscures. Al-Ghazālī came to it only after his certainties collapsed and he abandoned his professorship; the doubt was the method.',
    turn:'What would you have to stop defending in order to see this clearly?',
    sources:[{work:'Deliverance from Error', author:'Al-Ghazālī', note:'A philosopher’s crisis of certainty, resolved by practice rather than proof.'},
             {work:'Masnavi', author:'Jalāl al-Dīn Rūmī', note:'The reed cut from the reed bed — separation as the source of the song.'},
             {work:'The Book of Healing', author:'Ibn Sīnā', note:'The floating man: self-awareness prior to all sensation.'}],
    kin:['maya','anatta','epistemic-humility']
  },
  {
    id:'impermanence-aesthetic', label:'Mono no Aware & Ma', tradition:'japanese', category:'lineage',
    trigger:/\b(beautiful|beauty|quiet|silence|stillness|empty|fleeting|nostalg(ia|ic)|bittersweet|autumn)\b/i,
    reading:'Japanese aesthetics gives a name to the ache you may be circling: mono no aware, the pathos of things — feeling that something is moving precisely because it will not last. Ma, the charged interval, treats what is absent as compositional rather than missing.',
    turn:'Is the sadness here a flaw in the experience, or the part of it that makes it worth having?',
    sources:[{work:'The Structure of Iki', author:'Kuki Shūzō', note:'A philosophical treatment of a native aesthetic category.'},
             {work:'The Book of Tea', author:'Okakura Kakuzō', note:'On the vessel’s usefulness lying in its emptiness.'},
             {work:'Daodejing, ch. 11', author:'Laozi', note:'The wheel is useful because of the hole at the hub.'}],
    kin:['dukkha','flow','absurd']
  },
  {
    id:'categorical-imperative', label:'The Categorical Imperative', tradition:'modern', category:'tension',
    trigger:/\b(everyone should|people should|you should always|it'?s (just )?wrong to|no one should|ought to|nobody should)/i,
    reading:'You are issuing a universal. Kant’s test is to take it seriously: act only on a maxim you could will to become universal law without contradiction. Many rules survive this; some destroy themselves when generalised, and lying is his standard example — universal lying makes lying impossible.',
    turn:'State your rule as a law binding on everyone, including you at your least convenient. Does it still hold?',
    sources:[{work:'Groundwork of the Metaphysics of Morals', author:'Immanuel Kant', note:'The universalisability test and the formula of humanity.'},
             {work:'On a Supposed Right to Lie', author:'Immanuel Kant', note:'Where he follows the principle to its notorious conclusion.'}],
    kin:['utilitarian-calculus','veil-of-ignorance','is-ought']
  },
  {
    id:'utilitarian-calculus', label:'The Greater Good', tradition:'modern', category:'tension',
    trigger:/\b(greater good|net (positive|benefit)|worth it|best (outcome|for everyone)|maximi[sz]e|on balance|cost.{0,10}benefit)/i,
    reading:'You are reasoning consequentially — summing outcomes. Mill would recognise the move and also warn you about it: the calculus is indifferent to how goods are distributed, and will license using a person as a means if the arithmetic clears. That is not an objection others found; it is the one Mill worked hardest to answer.',
    turn:'Who bears the cost in your calculation, and would you accept the result if you were that person?',
    sources:[{work:'Utilitarianism', author:'John Stuart Mill', note:'Higher and lower pleasures, and the defence against "a doctrine worthy of swine."'},
             {work:'The Ones Who Walk Away from Omelas', author:'Ursula K. Le Guin', note:'The distribution objection, staged as fiction.'},
             {work:'Groundwork', author:'Immanuel Kant', note:'The rival principle: never merely as a means.'}],
    kin:['categorical-imperative','veil-of-ignorance','care-ethics']
  },
  {
    id:'veil-of-ignorance', label:'The Veil of Ignorance', tradition:'analytic', category:'resonance',
    trigger:/\b(fair|unfair|justice|deserves?|privilege|inequality|equal|level playing|earned it)\b/i,
    reading:'Rawls offers a procedure rather than a verdict: design the arrangement without knowing which position in it you will occupy. Most claims about desert dissolve under this test, because the talents and starting conditions we take credit for are themselves unchosen — "arbitrary from a moral point of view," in his phrase.',
    turn:'Would you endorse this arrangement if you did not know which side of it you would land on?',
    sources:[{work:'A Theory of Justice', author:'John Rawls', note:'The original position and the difference principle.'},
             {work:'Anarchy, State, and Utopia', author:'Robert Nozick', note:'The strongest reply: entitlement through just acquisition and transfer.'},
             {work:'The Idea of Justice', author:'Amartya Sen', note:'We need not agree on perfect justice to identify clear injustice.'}],
    kin:['utilitarian-calculus','alienation','double-consciousness']
  },
  {
    id:'recognition', label:'Recognition & the Struggle', tradition:'modern', category:'resonance',
    trigger:/\b(recogni[sz]ed|acknowledg(e|ed|ment)|validat(e|ed|ion)|appreciated|credit|no one notices|invisible|taken for granted)/i,
    reading:'Hegel’s master–slave dialectic makes recognition constitutive rather than pleasant: self-consciousness exists only in being acknowledged by another self-consciousness. The master’s tragedy is that he wins recognition from someone he has made incapable of giving it meaningfully. Fanon extended this to the colonial situation, where recognition is withheld structurally.',
    turn:'Whose recognition are you seeking, and have you granted them the standing to give it?',
    sources:[{work:'Phenomenology of Spirit, §§178–196', author:'G.W.F. Hegel', note:'The struggle for recognition.'},
             {work:'Black Skin, White Masks', author:'Frantz Fanon', note:'Recognition denied by structure, not by an individual master.'},
             {work:'The Struggle for Recognition', author:'Axel Honneth', note:'Recognition as the grammar of social conflict.'}],
    kin:['double-consciousness','ressentiment','levinas-other']
  },
  {
    id:'ressentiment', label:'Ressentiment', tradition:'modern', category:'tension',
    trigger:/\b(resent(ful|ment)?|bitter|jealous|envy|they don'?t deserve|unfair that (they|he|she)|why do they get)/i,
    reading:'Nietzsche’s diagnosis is uncomfortable: ressentiment is the creativity of the powerless, which cannot act and so revalues instead — declaring the unreachable grape sour, the strong evil, its own condition virtuous. The tell is that the judgement is reactive: it takes its bearings from the other rather than from anything affirmed.',
    turn:'Strip out every reference to them. Is there anything left that you actually want?',
    sources:[{work:'On the Genealogy of Morals, First Essay', author:'Friedrich Nietzsche', note:'Slave morality as a reactive revaluation.'},
             {work:'Ressentiment', author:'Max Scheler', note:'A sympathetic critic who limits the scope of Nietzsche’s claim.'}],
    kin:['recognition','amor-fati','veil-of-ignorance']
  },
  {
    id:'panopticon', label:'The Disciplinary Gaze', tradition:'critical', category:'resonance',
    trigger:/\b(watch(ed|ing)|judg(ed|ing|ement|ment)|what (they|people) think|performance review|metrics|monitored|reputation|optics)/i,
    reading:'Foucault’s point about Bentham’s panopticon is that the guard need not be present. Visibility is a trap: the inmate who might be watched begins doing the watching himself, and power becomes automatic. Self-surveillance is cheaper than surveillance, and more thorough.',
    turn:'Who is the observer you are performing for, and when did you last check whether they are actually there?',
    sources:[{work:'Discipline and Punish', author:'Michel Foucault', note:'Panopticism: visibility as the mechanism of internalised power.'},
             {work:'The Presentation of Self in Everyday Life', author:'Erving Goffman', note:'Front stage and back stage — the same insight, sociologically.'}],
    kin:['bad-faith','double-consciousness','alienation']
  },
  {
    id:'alienation', label:'Alienated Labour', tradition:'critical', category:'resonance',
    trigger:/\b(my job|work(ing)? (feels|is)|career|productiv(e|ity)|hustle|burn(ed|t)? out|burnout|the grind|9 ?to ?5|my boss|deadlines?)/i,
    reading:'Marx distinguishes four estrangements: from the product, from the act of producing, from our species-being, and from each other. The specific misery he identifies is not being tired — it is that the activity through which humans realise themselves has become the thing they escape from. Weil, working the factory floor herself, confirmed it empirically.',
    turn:'Is the exhaustion here about volume of work, or about the work not being recognisably yours?',
    sources:[{work:'Economic and Philosophic Manuscripts of 1844', author:'Karl Marx', note:'The four forms of estrangement.'},
             {work:'Factory Journal', author:'Simone Weil', note:'A philosopher who took a factory job to test the theory against her body.'},
             {work:'The Human Condition', author:'Hannah Arendt', note:'Labour, work, and action — a rival taxonomy of activity.'}],
    kin:['panopticon','flow','telos']
  },
  {
    id:'care-ethics', label:'The Ethics of Care', tradition:'feminist', category:'lineage',
    trigger:/\b(car(e|ing) for|look(ing)? after|responsib(le|ility) (for|to)|caregiv|my (kids|children|patients?|students)|drain(ed|ing)|nobody else will)/i,
    reading:'Gilligan found that moral reasoning organised around responsibility and relationship was being scored as immature by frameworks built on rights and rules. Noddings pushed further: the caring relation, not the autonomous chooser, is the ethical primitive. Crucially, this tradition also insists the one-caring must be sustained, or the relation collapses.',
    turn:'Does the framework you are judging yourself by have any room in it for the carer’s own needs?',
    sources:[{work:'In a Different Voice', author:'Carol Gilligan', note:'The ethic of care against Kohlberg’s stages.'},
             {work:'Caring: A Relational Approach to Ethics', author:'Nel Noddings', note:'Engrossment, motivational displacement, and the limits of care.'},
             {work:'Love’s Labor', author:'Eva Feder Kittay', note:'Dependency as the unavoidable human condition, not an exception.'}],
    kin:['ubuntu','ren','utilitarian-calculus']
  },
  {
    id:'situated-freedom', label:'Situated Freedom', tradition:'feminist', category:'resonance',
    trigger:/\b(as a (woman|man|mother|father|daughter|son)|expected of me|supposed to be|society (says|expects|wants)|they see me as|how I was raised|stereotype)/i,
    reading:'Beauvoir’s correction to Sartre is the decisive one: freedom is always situated. One is not born but becomes a woman — the category is made, and made real by being made. This means the constraint is neither natural nor imaginary, which is precisely what makes it hard to argue with.',
    turn:'Which part of this expectation is a fact about the world, and which part is a fact about who benefits from you believing it?',
    sources:[{work:'The Second Sex', author:'Simone de Beauvoir', note:'Woman as the Other; becoming rather than being.'},
             {work:'The Ethics of Ambiguity', author:'Simone de Beauvoir', note:'Freedom as situated, and the oppression that removes situations.'},
             {work:'Gender Trouble', author:'Judith Butler', note:'Performativity: the repeated act produces the category it appears to express.'}],
    kin:['bad-faith','double-consciousness','panopticon']
  },
  {
    id:'double-consciousness', label:'Double Consciousness', tradition:'critical', category:'lineage',
    trigger:/\b(how they see me|two (selves|versions)|code ?switch|different (person|version) (at|around|when)|wearing a mask|pretend(ing)? to be|fit in)/i,
    reading:'Du Bois named the sensation of always looking at oneself through the eyes of others, of measuring your soul by the tape of a world that watches in contempt. He called it a second sight — a genuine epistemic advantage bought at genuine cost, since the doubled self never fully closes.',
    turn:'What does the outside view see that the inside view cannot? And what is it wrong about?',
    sources:[{work:'The Souls of Black Folk', author:'W.E.B. Du Bois', note:'Double consciousness, the veil, and second sight.'},
             {work:'Black Skin, White Masks', author:'Frantz Fanon', note:'The phenomenology of being seen as a type.'},
             {work:'The Presentation of Self in Everyday Life', author:'Erving Goffman', note:'On the labour of managing a front.'}],
    kin:['recognition','panopticon','anatta']
  },
  {
    id:'levinas-other', label:'The Face of the Other', tradition:'existential', category:'resonance',
    trigger:/\b(those people|a stranger|the other (person|side)|my opponent|disagrees? with me|the enemy|people like that)/i,
    reading:'Levinas grounds ethics before ontology: the face of the other issues a command prior to any reasoning about it. The Other is precisely what exceeds my concept of them. The moment you can fully summarise a person, you have stopped encountering them.',
    turn:'Could the person you are describing recognise themselves in your description of them?',
    sources:[{work:'Totality and Infinity', author:'Emmanuel Levinas', note:'The face-to-face as the origin of ethics.'},
             {work:'I and Thou', author:'Martin Buber', note:'The difference between addressing someone and describing them.'}],
    kin:['ubuntu','recognition','straw-man']
  },
  {
    id:'epistemic-humility', label:'Socratic Ignorance', tradition:'greek', category:'stance',
    trigger:/\b(obviously|clearly|of course|it'?s (just )?obvious|without a doubt|undeniabl|no question|any(one|body) can see)/i,
    reading:'The oracle called Socrates wisest, and his explanation was deflationary: others think they know what they do not, while he at least knows that he does not. Words like "obviously" mark the places where an argument has been replaced by a tone of voice.',
    turn:'Take your most obvious claim here and state the strongest case against it. If you cannot, you do not yet hold it — it holds you.',
    sources:[{work:'Apology, 21d', author:'Plato', note:'Human wisdom as knowing the extent of one’s ignorance.'},
             {work:'Meno', author:'Plato', note:'Aporia as a productive state, not a failure.'},
             {work:'Deliverance from Error', author:'Al-Ghazālī', note:'Methodical doubt, a century before Descartes was born into it.'}],
    kin:['falsifiability','doxa','aporia']
  },
  {
    id:'falsifiability', label:'Falsifiability', tradition:'analytic', category:'stance',
    trigger:/\b(proves?|proven|the (evidence|data|research) shows|studies show|science says|always been true|it'?s a fact that)/i,
    reading:'Popper’s demarcation: a claim earns scientific standing not by what confirms it but by what could refute it. Theories that explain every outcome explain none. The relevant question about a belief is never "what supports this" — confirmations are cheap — but "what would count against it."',
    turn:'Name the observation that would make you abandon this claim. If nothing would, it is not doing the work you think it is.',
    sources:[{work:'The Logic of Scientific Discovery', author:'Karl Popper', note:'Falsifiability as demarcation criterion.'},
             {work:'The Structure of Scientific Revolutions', author:'Thomas Kuhn', note:'The rival account: paradigms, not falsification, govern change.'},
             {work:'An Enquiry Concerning Human Understanding', author:'David Hume', note:'The problem of induction underneath it all.'}],
    kin:['epistemic-humility','hasty-generalization','doxa']
  },
  {
    id:'doxa', label:'Doxa & Inherited Belief', tradition:'critical', category:'stance',
    trigger:/\b(I'?ve always (thought|believed|felt)|it just makes sense|common sense|the way things are|that'?s how it is|deep down I know)/i,
    reading:'Bourdieu reserved doxa for the beliefs so settled they are not experienced as beliefs at all — the part of the world that appears simply as the world. Bacon called these idols of the tribe and the cave. Their signature is exactly the phrase you used: it goes without saying.',
    turn:'Where did this belief come from? Trace it to a person, a moment, or a source. If you cannot, that is itself informative.',
    sources:[{work:'Outline of a Theory of Practice', author:'Pierre Bourdieu', note:'Doxa, habitus, and the naturalisation of the arbitrary.'},
             {work:'Novum Organum', author:'Francis Bacon', note:'The four idols that distort understanding.'},
             {work:'On Liberty, ch. 2', author:'John Stuart Mill', note:'Held opinions become dead dogma without live challenge.'}],
    kin:['epistemic-humility','falsifiability','panopticon']
  },
  {
    id:'phenomenology', label:'Bracketing the Given', tradition:'existential', category:'resonance',
    trigger:/\b(felt like|it seemed|I experienced|the feeling of|noticed that|struck me|as if)\b/i,
    reading:'You are doing something Husserl asked philosophers to do deliberately: describing the experience as experienced, before ruling on whether the world matches it. The epoché brackets the question of reality so that the structure of appearing becomes visible. This kind of writing is data, not decoration.',
    turn:'Stay in the description one layer longer. What was the experience like before you named what it was about?',
    sources:[{work:'Ideas I', author:'Edmund Husserl', note:'The epoché and the phenomenological reduction.'},
             {work:'Phenomenology of Perception', author:'Maurice Merleau-Ponty', note:'The body as the subject of perception, not its instrument.'},
             {work:'The Poetics of Space', author:'Gaston Bachelard', note:'Phenomenology applied to rooms, corners, and drawers.'}],
    kin:['embodiment','impermanence-aesthetic','flow']
  },
  {
    id:'embodiment', label:'The Lived Body', tradition:'existential', category:'resonance',
    trigger:/\b(my body|tired|exhaust(ed|ion)|pain|aches?|gut (feeling|instinct)|physically|slept|sleep|hungry|breath(e|ing)?|tense)\b/i,
    reading:'Merleau-Ponty refuses the split: you do not have a body that reports to a mind, you are a body that knows the world by inhabiting it. The blind man’s cane stops being an object and becomes an organ. Your fatigue is not noise interfering with the real reflection — it is a mode of understanding your situation.',
    turn:'What is your body currently knowing about this that your reasoning has not caught up to?',
    sources:[{work:'Phenomenology of Perception', author:'Maurice Merleau-Ponty', note:'Motor intentionality and the body schema.'},
             {work:'Gravity and Grace', author:'Simone Weil', note:'Attention as a bodily discipline, close to prayer.'},
             {work:'Zhuangzi', author:'Zhuang Zhou', note:'Skill knowledge that cannot be stated, only performed.'}],
    kin:['phenomenology','flow','wuwei']
  },
  {
    id:'flow', label:'Attention', tradition:'critical', category:'resonance',
    trigger:/\b(distract(ed|ion)|focus|concentrat|scroll(ing)?|my phone|notifications?|attention|multitask|absorbed|lost track of time)/i,
    reading:'Simone Weil treated attention as the rarest and purest form of generosity, and as something closer to waiting than to effort — the opposite of the muscular straining we mean by "concentrating." What fragments attention, in her account, is the self’s constant return to itself.',
    turn:'Is your attention scattered, or is it fully engaged by something you have decided does not count?',
    sources:[{work:'Gravity and Grace', author:'Simone Weil', note:'Attention as receptive rather than effortful.'},
             {work:'Reflections on the Right Use of School Studies', author:'Simone Weil', note:'Study as training for prayer and for love of neighbour.'},
             {work:'Zhuangzi', author:'Zhuang Zhou', note:'Fasting of the mind — emptying as a precondition of skill.'}],
    kin:['embodiment','wuwei','alienation']
  },
  {
    id:'ship-of-theseus', label:'Identity Over Time', tradition:'analytic', category:'clarity',
    trigger:/\b(not the same person|I'?ve changed|used to (be|think|believe)|different person now|years ago I|grown out of)/i,
    reading:'Locke tied identity to continuity of consciousness rather than substance; Parfit argued that identity is not what matters, and that survival admits of degrees. Plutarch got there first with a ship whose planks were replaced one by one. You are describing a self that persists through replacement — exactly the case philosophers cannot agree on.',
    turn:'What is the thread you are claiming connects then to now? Memory, body, commitments, or only the story?',
    sources:[{work:'An Essay Concerning Human Understanding, II.xxvii', author:'John Locke', note:'Memory continuity as the criterion of personal identity.'},
             {work:'Reasons and Persons', author:'Derek Parfit', note:'Teletransportation, degrees of survival, and the deflation of identity.'},
             {work:'Life of Theseus', author:'Plutarch', note:'The original puzzle about the ship.'}],
    kin:['anatta','sankofa','recurrence']
  },
  {
    id:'determinism', label:'Freedom & Necessity', tradition:'modern', category:'tension',
    trigger:/\b(free will|my choice|I chose|decided?|decisions?|had to|no control over|inevitable|couldn'?t have)\b/i,
    reading:'Spinoza’s claim is that we feel free only because we are conscious of our desires and ignorant of their causes — a thrown stone, if conscious, would believe it was flying by choice. Frankfurt’s compatibilist reply: freedom is not the absence of causes but the alignment of your will with what you want to want.',
    turn:'Did you want what you chose, or did you want to be the kind of person who wants it?',
    sources:[{work:'Ethics, Part III', author:'Baruch Spinoza', note:'The conscious stone; freedom as understanding necessity.'},
             {work:'Freedom of the Will and the Concept of a Person', author:'Harry Frankfurt', note:'Second-order desires as the seat of freedom.'},
             {work:'Bhagavad Gītā', author:'Vyāsa (attrib.)', note:'Action as duty within a fated order.'}],
    kin:['bad-faith','karma-dharma','stoic-control']
  },
  {
    id:'theodicy', label:'The Problem of Suffering', tradition:'modern', category:'resonance',
    trigger:/\b(why (did|does) (this|it) happen|suffering|senseless|cruel|unfair (world|life)|why me|tragedy|unjust)/i,
    reading:'The problem is old and unresolved: gratuitous suffering is difficult to square with any benevolent ordering of things. Leibniz answered with the best of all possible worlds; Ivan Karamazov answered by returning his ticket. The Book of Job is notable for refusing to give a reason at all — the whirlwind changes the subject rather than answering.',
    turn:'Are you looking for a reason this happened, or for a way to hold it that does not require one?',
    sources:[{work:'Theodicy', author:'G.W. Leibniz', note:'The best of all possible worlds.'},
             {work:'The Brothers Karamazov, "Rebellion"', author:'Fyodor Dostoevsky', note:'Ivan’s refusal — the suffering of children as non-negotiable.'},
             {work:'Book of Job', author:'Hebrew Bible', note:'A non-answer that has outlasted most of the answers.'}],
    kin:['absurd','dukkha','karma-dharma']
  },
  {
    id:'language-games', label:'Meaning as Use', tradition:'analytic', category:'clarity',
    trigger:/\b(what (does|do) (it|that|they) mean|define|definition|the word|by which I mean|semantics|what I mean by)/i,
    reading:'Wittgenstein abandoned his own earlier picture theory for something looser: the meaning of a word is its use in a form of life. Asking for the essence of a concept often produces confusion where a survey of its uses would produce clarity. Look for family resemblance, not a definition.',
    turn:'Instead of defining the term, list four situations where you would use it. What do they actually share?',
    sources:[{work:'Philosophical Investigations', author:'Ludwig Wittgenstein', note:'Language games, family resemblance, and the private language argument.'},
             {work:'Meno', author:'Plato', note:'The classic demand for a definition, and its failure.'}],
    kin:['aporia','doxa','anatta']
  },
  {
    id:'aporia', label:'Productive Aporia', tradition:'greek', category:'stance',
    trigger:/\b(on the other hand|but (then|maybe|perhaps)|I'?m not sure|torn|conflicted|both (are|seem)|contradiction|don'?t know what to think)/i,
    reading:'Being stuck between two positions you cannot dismiss is not a failure of the thinking; in the Socratic dialogues it is the point. Aporia is the state in which inherited answers have been cleared away and genuine inquiry can start. The dialogues that end here are the honest ones.',
    turn:'Do not resolve it yet. What would have to be true for both of your positions to be right about different things?',
    sources:[{work:'Meno, 80a', author:'Plato', note:'The torpedo fish — Socrates numbs his interlocutor into genuine inquiry.'},
             {work:'Outlines of Pyrrhonism', author:'Sextus Empiricus', note:'Suspension of judgement (epochē) as a route to tranquillity.'},
             {work:'Mūlamadhyamakakārikā', author:'Nāgārjuna', note:'The tetralemma: four options, all refused.'}],
    kin:['epistemic-humility','language-games','telos']
  },
  {
    id:'telos', label:'Ends & Purposes', tradition:'greek', category:'clarity',
    trigger:/\b(my goals?|purpose|the point of|trying to (achieve|get|reach)|aim(ing)?|ambition|what I want)\b/i,
    reading:'Aristotle observes that our ends nest: we pursue one thing for the sake of another, and unless the chain terminates the whole structure is empty. The question worth asking of any goal is what it is for — repeated until the answer is something wanted for its own sake, or until the chain visibly breaks.',
    turn:'Ask "and then what?" of your goal four times. Where does the chain stop, and does that endpoint hold?',
    sources:[{work:'Nicomachean Ethics, Book I', author:'Aristotle', note:'The hierarchy of ends and the final good.'},
             {work:'Bhagavad Gītā, 2.47', author:'Vyāsa (attrib.)', note:'Rejects the fruits of action as the proper end.'},
             {work:'The Myth of Sisyphus', author:'Albert Camus', note:'What remains when the chain of ends is shown to have no terminus.'}],
    kin:['eudaimonia','karma-dharma','absurd']
  },
  {
    id:'samsara', label:'Saṃsāra — the Wheel', tradition:'buddhist', category:'lineage',
    trigger:/\b(same mistake|keep (doing|coming back|falling)|the same pattern|relapse|old habits|here again|never learn)/i,
    reading:'Saṃsāra is the wheel of repeated becoming, turned by craving and ignorance rather than by fate. What binds you to it is not the pattern but the belief that this time the object of craving will finally satisfy. The exit is not more effort inside the loop but a change in what is wanted.',
    turn:'Each time you return to this, what are you expecting will be different? Has it ever been?',
    sources:[{work:'Dhammapada', author:'Attributed to the Buddha', note:'Craving as the builder of the house, again and again.'},
             {work:'The Gay Science, §341', author:'Friedrich Nietzsche', note:'A recurrence you are asked to affirm rather than escape.'}],
    kin:['recurrence','dukkha','determinism']
  }
];

/* --- Logical tension patterns (the "correctness" lane) --- */
const TENSIONS = [
  { id:'hasty-generalization', label:'Hasty Generalisation', category:'tension',
    trigger:/\b(always|never|everyone|no ?one|nobody|everybody|everything|nothing|every time|constantly)\b/gi,
    reading:'Absolute quantifiers are load-bearing and almost never survive inspection. A single counterexample refutes "always"; the sentence usually meant "often," which is defensible.',
    turn:'Find one exception to this. If you can, the claim needs a smaller word.',
    sources:[{work:'An Enquiry Concerning Human Understanding', author:'David Hume', note:'The problem of induction: no number of instances licenses "always."'}] },
  { id:'ad-populum', label:'Appeal to Common Belief', category:'tension',
    trigger:/\b(everyone (knows|thinks|says|agrees)|most people (think|believe|say)|nobody (thinks|believes)|common knowledge|we all know)/gi,
    reading:'The number of people holding a belief is evidence about the people, not about the belief. This is the ad populum move; consensus can be well-founded, but it has to be shown to be, not cited.',
    turn:'Set aside how many people hold this. What is the reason they hold it?',
    sources:[{work:'On Liberty, ch. 2', author:'John Stuart Mill', note:'The tyranny of prevailing opinion, and why dissent is needed even when wrong.'}] },
  { id:'false-dilemma', label:'False Dilemma', category:'tension',
    trigger:/\b(either .{3,60}? or |only two (options|choices)|it'?s (this|that) or|no (other|middle) (way|ground|option))/gi,
    reading:'Two options presented as exhaustive. Genuine dilemmas exist, but most are artefacts of framing — the third option is usually the one that reframes the question rather than answering it.',
    turn:'Write down a third option, even an unacceptable one. What does its existence reveal about the first two?',
    sources:[{work:'Fear and Trembling', author:'Søren Kierkegaard', note:'On dilemmas that cannot be resolved by reason, only by a leap.'}] },
  { id:'slippery-slope', label:'Slippery Slope', category:'tension',
    trigger:/\b(if we (allow|let|start)|next thing|before you know it|where does it end|leads? to|slippery slope|opens? the door)/gi,
    reading:'A chain of consequences asserted rather than argued. Each link needs its own justification; the rhetorical force of the chain comes from the vividness of the endpoint, not from the strength of the connections.',
    turn:'Take the weakest link in your chain. What actually makes step two follow from step one?',
    sources:[{work:'The Logic of Scientific Discovery', author:'Karl Popper', note:'On the burden of specifying a mechanism, not just a trajectory.'}] },
  { id:'is-ought', label:'Is–Ought Gap', category:'tension',
    trigger:/\b(it('?s| is) natural|human nature|naturally|that'?s how (we|people|humans) (are|were)|biolog(y|ically)|evolution (made|designed))/gi,
    reading:'Hume noticed authors slipping from "is" to "ought" without remark, and asked how the new relation could be deduced from the old. Describing something as natural establishes nothing about whether it is good — a gap Moore later called the naturalistic fallacy.',
    turn:'Grant the description entirely. What separate premise gets you from "this is how things are" to "this is how they should be"?',
    sources:[{work:'A Treatise of Human Nature, III.i.1', author:'David Hume', note:'The is–ought passage.'},
             {work:'Principia Ethica', author:'G.E. Moore', note:'The naturalistic fallacy and the open question argument.'}] },
  { id:'straw-man', label:'Uncharitable Reading', category:'tension',
    trigger:/\b(they just want|all they care about|typical of (them|him|her)|obviously (they|he|she)|people like (that|them))/gi,
    reading:'The position being answered here may be weaker than the one actually held. The principle of charity asks you to argue against the strongest available version — partly for fairness, and partly because defeating a weak version teaches you nothing.',
    turn:'State their position in a form they would sign. Then answer that one.',
    sources:[{work:'Totality and Infinity', author:'Emmanuel Levinas', note:'The Other as what exceeds your concept of them.'},
             {work:'On Liberty, ch. 2', author:'John Stuart Mill', note:'He who knows only his own side knows little of that.'}] },
  { id:'self-contradiction', label:'Internal Contradiction', category:'tension',
    trigger:null, custom:'contradiction',
    reading:'Two statements here pull against each other: one describes you as constrained, the other as having chosen. This is not necessarily a fault — Hegel treats contradiction as the engine of thought rather than its failure — but it is worth making explicit rather than leaving to work in the background.',
    turn:'Write both claims side by side. Is one of them false, or are they true of different moments?',
    sources:[{work:'Science of Logic', author:'G.W.F. Hegel', note:'Contradiction as productive, driving thought to a higher determination.'},
             {work:'Being and Nothingness', author:'Jean-Paul Sartre', note:'Bad faith needs both claims at once — that is how it works.'}] },
  { id:'appeal-to-feeling', label:'Feeling as Evidence', category:'tension',
    trigger:/\b(it feels (true|wrong|right)|my gut says|deep down it'?s|I just know it'?s|I feel like it('?s| is) (true|right|wrong))/gi,
    reading:'A feeling is excellent evidence about your state and weak evidence about the world. The Stoics separated the first movement — the involuntary impression — from assent to it, and located freedom entirely in the second.',
    turn:'Separate the two claims: what you felt, and what you take it to prove. Does the second still stand alone?',
    sources:[{work:'Discourses', author:'Epictetus', note:'Impressions and assent: the space between stimulus and judgement.'},
             {work:'Ideas I', author:'Edmund Husserl', note:'Bracketing the existence claim to describe the experience properly.'}] }
];

/* --- Terms carrying unexamined weight (clarity lane) --- */
const LOADED_TERMS = {
  'success':   { contested:'Aristotle, Marx, and the Daodejing each treat success as a different kind of object — completed function, unalienated activity, and non-striving respectively.', ask:'Success by whose measure, and who taught you that measure?' },
  'authentic': { contested:'Heidegger’s Eigentlichkeit means owning your existence, not expressing an inner truth. Sartre denies there is an inner truth to express. Trilling traced the word’s drift away from sincerity.', ask:'Authentic to what — a self you have, or one you are making?' },
  'truth':     { contested:'Correspondence, coherence, pragmatist, and disclosive accounts of truth are genuinely incompatible. Nietzsche called truths worn-out metaphors; Heidegger called truth unconcealment.', ask:'Which sense — matching the world, hanging together, or working?' },
  'freedom':   { contested:'Berlin’s two concepts: freedom from interference and freedom to become. Spinoza offers a third — freedom as understanding necessity.', ask:'Freedom from something, or freedom for something?' },
  'natural':   { contested:'Mill catalogued the ways "natural" smuggles in approval. Nearly everything humans value is unnatural in one sense and inevitable in another.', ask:'Does "natural" here mean common, healthy, or good? They come apart.' },
  'love':      { contested:'Greek splits it into eros, philia, agape, and storge. Fromm treats it as a practised art; bell hooks as an act of will rather than a feeling.', ask:'Which are you naming — desire, friendship, unconditional regard, or familiarity?' },
  'happiness': { contested:'Hedonic pleasure and eudaimonic flourishing routinely come apart; Aristotle would deny that a felt state is the right kind of thing to measure.', ask:'A mood right now, or a life going well?' },
  'meaning':   { contested:'Camus, Frankl, and Nagel disagree on whether meaning is found, made, or a category error applied from too far outside.', ask:'Found, made, or received? Each has different consequences.' },
  'justice':   { contested:'Plato’s harmony of parts, Rawls’s fairness under a veil, Nozick’s entitlement, and Sen’s comparative approach are four different questions.', ask:'Justice as fair procedure, fair outcome, or rightful entitlement?' },
  'power':     { contested:'Foucault treats power as productive and capillary rather than possessed; Arendt distinguishes it sharply from violence and from strength.', ask:'Power over someone, power to do something, or power circulating through both?' },
  'progress':  { contested:'Benjamin’s angel of history sees a single catastrophe piling wreckage, not a march forward. Adorno doubted the direction entirely.', ask:'Progress along which axis, and at whose expense?' },
  'balance':   { contested:'Aristotle’s mean is relative to the person and situation, not a midpoint. Zhuangzi doubts the axis is stable enough to balance on.', ask:'Balance between which two things, and who set the fulcrum?' },
  'growth':    { contested:'Bildung treats growth as formation toward a culture; Dewey as reconstruction of experience; the Daoist tradition is suspicious of the metaphor entirely.', ask:'Growth toward what, and who decided that direction was up?' },
  'closure':   { contested:'A therapeutic term with no philosophical pedigree. Freud’s mourning-work and the Stoic premeditatio malorum both assume grief is metabolised, not concluded.', ask:'What would having it actually consist of, concretely?' }
};

/* --- Stance markers (the "delivery" lane) --- */
const STANCE_MARKERS = [
  { id:'hedging', label:'Heavy Hedging', category:'stance',
    trigger:/\b(maybe|perhaps|sort of|kind of|I guess|I suppose|probably|might be|possibly|somewhat|a (bit|little))\b/gi, threshold:4,
    reading:'The hedges are dense here. Some qualification is intellectual honesty; past a point it becomes a way of not committing to a claim you could then be wrong about — which also means it cannot be examined or improved.',
    turn:'Rewrite your central sentence with every hedge removed. Do you believe the result? If not, what is the honest smaller claim?',
    sources:[{work:'Apology', author:'Plato', note:'Socratic ignorance is a specific claim, stated firmly — not a general vagueness.'}] },
  { id:'passive-agency', label:'Displaced Agency', category:'stance',
    trigger:/\b(made me (feel|do|think)|it happened to me|I (was|got) (made|forced|left)|they made me|caused me to|I ended up)/gi, threshold:2,
    reading:'The grammar places the action outside you. Sartre would read this as the syntax of bad faith; the Stoics would point out that between the event and the response there is an assent that is yours. This is a claim about the sentence, not a denial that things happen to people.',
    turn:'Rewrite one of these sentences with yourself as the subject of the verb. What changes?',
    sources:[{work:'Enchiridion, §5', author:'Epictetus', note:'It is not things that disturb us but our judgements about them.'},
             {work:'Being and Nothingness', author:'Jean-Paul Sartre', note:'On the flight from responsibility through description.'}] },
  { id:'absolutism', label:'Unqualified Certainty', category:'stance',
    trigger:/\b(definitely|absolutely|100%|without question|there'?s no way|I know for (a )?(fact|certain)|guaranteed|impossible that)/gi, threshold:2,
    reading:'The certainty here is stated rather than earned. Descartes reached one indubitable claim after demolishing everything else, and the demolition was the hard part. Certainty is a psychological state; justification is a separate property.',
    turn:'What is the actual evidential base for the strongest of these claims — and would it convince someone who wanted to disagree?',
    sources:[{work:'Meditations on First Philosophy', author:'René Descartes', note:'Methodical doubt: what survives when everything doubtable is discarded.'},
             {work:'On Certainty', author:'Ludwig Wittgenstein', note:'Some certainties are hinges the doubt turns on, not claims within it.'}] },
  { id:'reflexive', label:'Self-Implication', category:'stance', positive:true,
    trigger:/\b(I (wonder|notice|realise|realize|suspect|admit)|I might be wrong|maybe I('?m| am)|part of me|I catch myself)/gi, threshold:2,
    reading:'You are turning the analysis back on yourself rather than only outward. This is the move that distinguishes reflection from complaint, and it is the one most journals never make. Montaigne built an entire genre on it.',
    turn:'Push it one turn further: what would you have to be getting wrong for your reading of this to be mistaken?',
    sources:[{work:'Essays', author:'Michel de Montaigne', note:'"Que sais-je?" — the self as the subject under examination.'},
             {work:'Confessions', author:'Augustine', note:'The interior turn: memory and self-opacity.'}] }
];

if (typeof window !== 'undefined') {
  window.PalinodeCorpus = { CATEGORIES, TRADITIONS, CONCEPTS, TENSIONS, LOADED_TERMS, STANCE_MARKERS };
}
