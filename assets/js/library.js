/* ============================================================
   Palinode — Library

   Every work the corpus cites, resolved to a single record:
   what it argues, where to start, who answers it, and where the
   full text can actually be read.

   `rights`
     'open'       the work is out of copyright and a complete free
                  text exists — Palinode links straight to it.
     'restricted' still in copyright. Palinode carries the argument
                  and the reading path, never the text, and points
                  to where the book can be found.

   Palinode does not reproduce copyrighted text. What you read in
   the Reading Room is Palinode's own account of the work.
   ============================================================ */

(function () {

  const G = q => 'https://www.gutenberg.org/ebooks/search/?query=' + encodeURIComponent(q);
  const A = q => 'https://archive.org/search?query=' + encodeURIComponent(q);
  const S = q => 'https://plato.stanford.edu/search/searcher.py?query=' + encodeURIComponent(q);

  /* id: [title, author, year, tradition, rights, gist, start, aliases[]] */
  const W = {};
  const def = (id, o) => { W[id] = Object.assign({ id }, o); };

  /* ---------- Ancient Greek & Hellenistic ---------- */
  def('nicomachean', { title:'Nicomachean Ethics', author:'Aristotle', year:'c. 340 BCE', tradition:'greek', rights:'open',
    gist:'Asks what the good for a human being is, and answers it by asking what humans characteristically do. Eudaimonia turns out to be an activity of the soul in accordance with virtue, over a complete life — not a feeling, and not something you can have on a Tuesday.',
    start:'Book I for the function argument and the hierarchy of ends; Book II for virtue as habituation; Book X for the contemplative life.',
    counter:'Epicurus, who puts the good in the absence of disturbance rather than in activity.' });
  def('apology', { title:'Apology', author:'Plato', year:'c. 399 BCE', tradition:'greek', rights:'open',
    gist:'Socrates’ defence at his trial, and the founding statement of philosophical humility: the oracle called him wisest, and he concludes this can only mean he alone knows the extent of his own ignorance.',
    start:'21d, where he works out what the oracle meant. The closing speech on death is the other essential passage.',
    counter:'Nietzsche, who reads Socratic reason as itself a symptom of decline.' });
  def('meno', { title:'Meno', author:'Plato', year:'c. 385 BCE', tradition:'greek', rights:'open',
    gist:'Begins by asking whether virtue can be taught and ends without an answer. Its real subject is aporia — the productive stuckness Socrates induces, which he compares to the numbing of a torpedo fish.',
    start:'80a, the torpedo fish passage, then the slave-boy demonstration that follows.',
    counter:'Wittgenstein, who thinks the demand for a definition is what created the confusion.' });
  def('enchiridion', { title:'Enchiridion', author:'Epictetus', year:'c. 125 CE', tradition:'hellenistic', rights:'open',
    gist:'A handbook compiled by a student, opening with the division that organises all Stoic practice: some things are up to us, most are not, and nearly all suffering comes from confusing the two.',
    start:'§1 for the dichotomy of control; §5 for the claim that it is judgements, not events, that disturb us.',
    counter:'Nussbaum and the modern critics who argue Stoicism asks us to withdraw investment from what makes life worth living.' });
  def('discourses', { title:'Discourses', author:'Epictetus', year:'c. 108 CE', tradition:'hellenistic', rights:'open',
    gist:'The longer record of Epictetus teaching, where the compressed rules of the Enchiridion are argued out. Central to it is the gap between an impression arriving and your assent to it — the only place freedom lives.',
    start:'Book I on what is in our power; Book II on impressions and assent.',
    counter:'Sartre, for whom this gap is not freedom but the site where bad faith operates.' });
  def('meditations', { title:'Meditations', author:'Marcus Aurelius', year:'c. 175 CE', tradition:'hellenistic', rights:'open',
    gist:'Private notebooks, never written for readers, by a man with more power than almost anyone in history — who spends them reminding himself that most of what he wants is not his to control.',
    start:'Book II and Book IV. The repetition is the point: he keeps having to relearn it.',
    counter:'Its own author, on nearly every page.' });
  def('menoeceus', { title:'Letters to Menoeceus', author:'Epicurus', year:'c. 300 BCE', tradition:'hellenistic', rights:'open',
    gist:'A short letter setting out the Epicurean account of the good life: pleasure understood as the absence of bodily pain and mental disturbance, and death as nothing to us, since where death is, we are not.',
    start:'It is a few pages. Read the whole thing.',
    counter:'Heidegger, for whom the argument that death is nothing to us is exactly the evasion to be overcome.' });
  def('pyrrhonism', { title:'Outlines of Pyrrhonism', author:'Sextus Empiricus', year:'c. 200 CE', tradition:'greek', rights:'open',
    gist:'The fullest surviving account of ancient scepticism. Sets opposing arguments against each other until judgement suspends itself, and reports that tranquillity follows the suspension rather than the resolution.',
    start:'Book I, on the aim of scepticism and the modes of suspension.',
    counter:'Descartes, who uses the same doubt as a method rather than a destination.' });
  def('theseus', { title:'Life of Theseus', author:'Plutarch', year:'c. 100 CE', tradition:'greek', rights:'open',
    gist:'A biography that incidentally poses one of philosophy’s longest-running puzzles: the Athenians preserved Theseus’ ship by replacing its planks as they rotted, until scholars could not agree whether it was still the same ship.',
    start:'The ship passage is brief and sits inside an otherwise unrelated life.',
    counter:'Parfit, who argues the question has no answer because identity is not what matters.' });

  /* ---------- Chinese ---------- */
  def('analects', { title:'Analects', author:'Confucius', year:'c. 400 BCE', tradition:'confucian', rights:'open',
    gist:'Fragments of conversation rather than a treatise. Its subject is ren — humaneness — cultivated not by introspection but through li, the concrete forms of ordinary relationships.',
    start:'Books II and IV. It resists sequential reading; take it in short passages.',
    counter:'Zhuangzi, who finds the whole apparatus of ritual and role self-defeating.' });
  def('mencius', { title:'Mencius', author:'Mengzi', year:'c. 300 BCE', tradition:'confucian', rights:'open',
    gist:'Argues human nature contains moral "sprouts" that need cultivation rather than installation. Its famous demonstration: anyone seeing a child about to fall into a well feels alarm before calculating anything.',
    start:'2A:6, the child at the well.',
    counter:'Xunzi, who held that human nature is bad and goodness is entirely the work of deliberate effort.' });
  def('daodejing', { title:'Daodejing', author:'Laozi', year:'c. 400 BCE', tradition:'daoist', rights:'open',
    gist:'Eighty-one short chapters on acting without friction. Water yields and wears down stone; a wheel is useful because of the hole at its hub; the sage accomplishes without striving.',
    start:'Chapters 8, 11 and 78. Any translation will lose something — compare two.',
    counter:'Confucius, for whom deliberate cultivation is precisely what makes a person.' });
  def('zhuangzi', { title:'Zhuangzi', author:'Zhuang Zhou', year:'c. 300 BCE', tradition:'daoist', rights:'open',
    gist:'Stories rather than arguments, and funnier than philosophy usually permits. The cook whose blade never dulls because it moves through the gaps; the butterfly dream; the fasting of the mind.',
    start:'The Inner Chapters — particularly "The Dexterous Butcher" in chapter 3.',
    counter:'The Confucian tradition it spends much of its length teasing.' });

  /* ---------- Indian & Buddhist ---------- */
  def('dhammapada', { title:'Dhammapada', author:'Attributed to the Buddha', year:'c. 300 BCE', tradition:'buddhist', rights:'open',
    gist:'Four hundred and twenty-three verses on craving as the builder of the house that is rebuilt life after life. Compressed to the point of being memorisable, which was the design.',
    start:'The chapters on the mind and on craving.',
    counter:'Nietzsche, who reads the extinction of craving as a will to nothingness.' });
  def('anatta-sutta', { title:'Anattalakkhaṇa Sutta', author:'Pāli Canon', year:'c. 400 BCE', tradition:'buddhist', rights:'open',
    gist:'The discourse on non-self. Takes the five aggregates one at a time and shows that none can be what we mean by "self", since none is under our control and none persists.',
    start:'Short. Read it beside Hume’s bundle theory, which arrives at the same place by other means.',
    counter:'The Advaita tradition, which affirms exactly the self this text denies.' });
  def('mmk', { title:'Mūlamadhyamakakārikā', author:'Nāgārjuna', year:'c. 150 CE', tradition:'buddhist', rights:'open',
    gist:'A systematic dismantling of the idea that anything has fixed essence. Uses the tetralemma — four possible positions, all refused — as its characteristic move. Difficult, and deliberately so.',
    start:'Chapter 24 on emptiness and conventional truth, with a commentary beside you.',
    counter:'Every Buddhist school that thought Nāgārjuna had proved too much.' });
  def('gita', { title:'Bhagavad Gītā', author:'Vyāsa (attrib.)', year:'c. 200 BCE', tradition:'vedic', rights:'open',
    gist:'A conversation on a battlefield, at the moment a warrior refuses to fight. Its answer is that you have a right to the action and never to its fruits, and that your own imperfect work beats another’s done well.',
    start:'2.47 and 3.35 — the two verses that carry the argument.',
    counter:'Gandhi and his critics disagreed sharply over whether it licenses violence or allegorises it.' });
  def('chandogya', { title:'Chāndogya Upaniṣad', author:'Upaniṣads', year:'c. 700 BCE', tradition:'vedic', rights:'open',
    gist:'Contains tat tvam asi — "that thou art" — the identification of the individual self with the ground of everything, taught through a sequence of homely analogies about salt, seeds and rivers.',
    start:'Chapter 6, section 8 onward.',
    counter:'The Buddhist denial that there is any such self to identify with anything.' });
  def('viveka', { title:'Vivekacūḍāmaṇi', author:'Śaṅkara (attrib.)', year:'c. 800 CE', tradition:'vedic', rights:'open',
    gist:'The Advaita case that the world’s multiplicity is māyā — not a lie but a misreading, like taking a rope for a snake in poor light. Discrimination between the real and the apparent is the whole practice.',
    start:'The rope-and-snake passages on superimposition.',
    counter:'Rāmānuja, who argued that a qualified non-dualism preserves what Śaṅkara’s account destroys.' });
  def('bardo', { title:'Bardo Thödol', author:'Tibetan tradition', year:'c. 800 CE', tradition:'buddhist', rights:'open',
    gist:'Read aloud to the dying and the newly dead. Treats death not as a terminus but as a passage with stages that can be prepared for, and the appearances within it as projections of the mind that meets them.',
    start:'The description of the first bardo.',
    counter:'Epicurus, for whom there is nothing there to prepare for.' });

  /* ---------- Islamic & Sufi ---------- */
  def('deliverance', { title:'Deliverance from Error', author:'Al-Ghazālī', year:'c. 1108', tradition:'islamic', rights:'open',
    gist:'An intellectual autobiography written after a breakdown that cost him his speech and his professorship. He doubts every source of knowledge in turn, and finds his way out through practice rather than proof.',
    start:'The account of the crisis itself, and the turn to the Sufi path that follows it.',
    counter:'Ibn Rushd (Averroes), who wrote a book-length reply defending the philosophers Al-Ghazālī had attacked.' });
  def('masnavi', { title:'Masnavi', author:'Jalāl al-Dīn Rūmī', year:'c. 1270', tradition:'islamic', rights:'open',
    gist:'Six books of verse opening with a reed cut from the reed bed, crying for the place it was severed from. Separation is the source of the song — the condition to be understood rather than escaped.',
    start:'The opening lines of Book I. Read in any order after that.',
    counter:'The jurists of his own tradition who distrusted where the poetry led.' });
  def('healing', { title:'The Book of Healing', author:'Ibn Sīnā', year:'c. 1027', tradition:'islamic', rights:'open',
    gist:'An encyclopaedia of philosophy and science containing the "floating man" thought experiment: suspended in void with no sensation at all, you would still be aware that you exist. Self-awareness precedes sensation.',
    start:'The floating man passage, in the psychology section.',
    counter:'Descartes reaches a comparable conclusion six centuries later, apparently independently.' });

  /* ---------- African ---------- */
  def('mbiti', { title:'African Religions and Philosophy', author:'John Mbiti', year:'1969', tradition:'african', rights:'restricted',
    gist:'The book that put "I am because we are; and since we are, therefore I am" into wide circulation, arguing that African thought treats personhood as conferred in relation rather than possessed individually.',
    start:'The chapters on the individual and the community.',
    counter:'Kwame Gyekye, who argues Mbiti overstates the communal claim at the expense of individual rights.' });
  def('ramose', { title:'African Philosophy Through Ubuntu', author:'Mogobe Ramose', year:'1999', tradition:'african', rights:'restricted',
    gist:'Reads ubuntu as a verb rather than a noun — being-with as ongoing activity, not a property. Also a sustained argument that African philosophy has been read through categories designed elsewhere.',
    start:'The chapters on ubuntu as ontology.',
    counter:'Critics who read ubuntu discourse as post-apartheid political rhetoric rather than philosophy.' });
  def('gyekye', { title:'An Essay on African Philosophical Thought', author:'Kwame Gyekye', year:'1987', tradition:'african', rights:'restricted',
    gist:'Reconstructs Akan philosophy from proverbs and conceptual practice, and defends a moderate communitarianism: the person is constituted socially but retains rights the community cannot override.',
    start:'The chapters on personhood and on the Akan conceptual scheme.',
    counter:'Ramose and Menkiti, who take the stronger communitarian line Gyekye is arguing against.' });

  /* ---------- Early modern ---------- */
  def('confessions', { title:'Confessions', author:'Augustine', year:'c. 400', tradition:'modern', rights:'open',
    gist:'The first Western autobiography, and the text that invented the interior life as a subject. Its recurring discovery is that the self is not transparent to itself — memory is a vast room he cannot see the end of.',
    start:'Book X on memory; Book XI on time.',
    counter:'Montaigne, who examines himself with none of the theology and arrives somewhere far less certain.' });
  def('essays', { title:'Essays', author:'Michel de Montaigne', year:'1580', tradition:'modern', rights:'open',
    gist:'Invented the essay as a form in order to have somewhere to put a mind changing its own mind. "Que sais-je?" — what do I know? — is the motto, and the method is to keep looking without concluding.',
    start:'"Of Experience", "Of Repentance", "On Some Verses of Virgil". Anywhere, really.',
    counter:'Pascal, who thought Montaigne’s comfort with uncertainty was itself a kind of cowardice.' });
  def('novum', { title:'Novum Organum', author:'Francis Bacon', year:'1620', tradition:'modern', rights:'open',
    gist:'A programme for rebuilding knowledge from observation, prefaced by a catalogue of the "idols" that distort understanding — of the tribe, the cave, the marketplace and the theatre. The list has aged remarkably well.',
    start:'Book I, aphorisms 38–68, on the four idols.',
    counter:'Popper, who argued that accumulating observations is not how science actually works.' });
  def('descartes-med', { title:'Meditations on First Philosophy', author:'René Descartes', year:'1641', tradition:'modern', rights:'open',
    gist:'Demolishes everything doubtable in order to see what survives. What survives is that there is a doubting. The demolition is the difficult and interesting part; the rebuilding convinces almost no one now.',
    start:'Meditations I and II. Read the Objections and Replies afterwards.',
    counter:'Hume, who looks for the self Descartes found and reports finding only perceptions.' });
  def('spinoza-ethics', { title:'Ethics', author:'Baruch Spinoza', year:'1677', tradition:'modern', rights:'open',
    gist:'Written in geometrical form, definitions through to theorems. Its hardest claim: we believe ourselves free only because we are conscious of our desires and ignorant of their causes. A thrown stone would think the same.',
    start:'Part III on the emotions; Part V on freedom as understanding necessity.',
    counter:'Sartre, for whom this is the most complete possible denial of what he means by freedom.' });
  def('locke-essay', { title:'An Essay Concerning Human Understanding', author:'John Locke', year:'1689', tradition:'modern', rights:'open',
    gist:'Among much else, ties personal identity to continuity of consciousness rather than to soul or body — which means the prince and the cobbler swap persons if they swap memories.',
    start:'Book II, chapter xxvii, on identity and diversity.',
    counter:'Reid’s brave officer objection, and Parfit’s deflation of the whole question.' });
  def('theodicy', { title:'Theodicy', author:'G.W. Leibniz', year:'1710', tradition:'modern', rights:'open',
    gist:'The attempt to reconcile evil with a benevolent creator by arguing this is the best of all possible worlds — not a world without evil, but the one whose overall composition could not be improved.',
    start:'The opening essay on the conformity of faith with reason.',
    counter:'Voltaire’s Candide, which is a book-length joke at its expense, and Ivan Karamazov, who is not joking.' });
  def('hume-treatise', { title:'A Treatise of Human Nature', author:'David Hume', year:'1739', tradition:'modern', rights:'open',
    gist:'Two things matter here. Looking inward for the self, Hume finds only a bundle of perceptions. Reading other moralists, he notices they slip from "is" to "ought" without ever explaining how.',
    start:'I.iv.6 for the bundle theory; III.i.1 for the is–ought passage.',
    counter:'Kant, who said Hume woke him from dogmatic slumber and then spent a career answering him.' });
  def('hume-enquiry', { title:'An Enquiry Concerning Human Understanding', author:'David Hume', year:'1748', tradition:'modern', rights:'open',
    gist:'The shorter, sharper restatement. Its centre is the problem of induction: no number of observed instances licenses a claim about the next one, and no argument for induction avoids assuming it.',
    start:'Sections IV and V, on the sceptical doubts and the sceptical solution.',
    counter:'Popper, who accepted the problem and rebuilt scientific method to avoid needing induction.' });
  def('groundwork', { title:'Groundwork of the Metaphysics of Morals', author:'Immanuel Kant', year:'1785', tradition:'modern', rights:'open',
    gist:'Locates moral worth in the maxim rather than the outcome, and offers a test: act only on a principle you could will to be universal law. A second formulation forbids treating anyone merely as a means.',
    start:'Section II, where both formulations are developed.',
    counter:'Mill, for whom Kant smuggles consequences back in the moment he asks what universalising would produce.' });
  def('kant-lie', { title:'On a Supposed Right to Lie', author:'Immanuel Kant', year:'1797', tradition:'modern', rights:'open',
    gist:'A short and notorious essay in which Kant refuses to allow a lie even to a murderer asking where your friend is hiding. Worth reading precisely because it shows where the principle leads when nothing softens it.',
    start:'It is a few pages.',
    counter:'Constant, the essay Kant was answering, and most readers since.' });
  def('hegel-phen', { title:'Phenomenology of Spirit', author:'G.W.F. Hegel', year:'1807', tradition:'modern', rights:'open',
    gist:'Contains the master–slave dialectic: self-consciousness exists only in being recognised by another self-consciousness, and the master’s victory is self-defeating, since he has made his recogniser worthless.',
    start:'§§178–196. Use a commentary; this is not a book to enter unaccompanied.',
    counter:'Fanon, who shows what happens when recognition is withheld structurally rather than won in a duel.' });
  def('hegel-logic', { title:'Science of Logic', author:'G.W.F. Hegel', year:'1812', tradition:'modern', rights:'open',
    gist:'Treats contradiction as productive rather than fatal — the pressure that drives a thought to a more adequate form. The claim that most divides Hegel’s readers from his critics.',
    start:'The doctrine of essence, on identity, difference and contradiction.',
    counter:'The entire analytic tradition, more or less by founding gesture.' });
  def('kierkegaard-anxiety', { title:'The Concept of Anxiety', author:'Søren Kierkegaard', year:'1844', tradition:'existential', rights:'open',
    gist:'Separates fear, which has an object, from anxiety, which does not. Anxiety is the dizziness of freedom — the vertigo of a creature registering that it could do anything at all.',
    start:'Chapter I, and the passage on the dizziness of freedom.',
    counter:'Heidegger reworks it without much acknowledgement; Kierkegaard’s theological frame is what he drops.' });
  def('fear-trembling', { title:'Fear and Trembling', author:'Søren Kierkegaard', year:'1843', tradition:'existential', rights:'open',
    gist:'On Abraham at Moriah, and on the possibility that faith requires a suspension of the ethical which no argument can license or excuse. Written under a pseudonym, and against system-building.',
    start:'The Preamble and the Problemata.',
    counter:'Kant, for whom Abraham should simply have concluded the voice was not God’s.' });
  def('marx-1844', { title:'Economic and Philosophic Manuscripts of 1844', author:'Karl Marx', year:'1844', tradition:'critical', rights:'open',
    gist:'The young Marx on alienation: estrangement from the product, from the act of producing, from our species-being, and from each other. Written before the economics hardened, and more useful for it.',
    start:'The section on estranged labour.',
    counter:'Arendt, whose Human Condition offers a rival taxonomy in which labour is not the site of self-realisation at all.' });
  def('on-liberty', { title:'On Liberty', author:'John Stuart Mill', year:'1859', tradition:'modern', rights:'open',
    gist:'Argues that even a true opinion held without live challenge decays into dead dogma, so dissent is necessary to the truth’s own health — not merely tolerable. The harm principle is the other half.',
    start:'Chapter 2, on liberty of thought and discussion.',
    counter:'Communitarian critics who deny that the individual can be prised so cleanly from the community.' });
  def('utilitarianism', { title:'Utilitarianism', author:'John Stuart Mill', year:'1861', tradition:'modern', rights:'open',
    gist:'Defends the greatest happiness principle against the charge that it is a doctrine worthy of swine, by distinguishing higher from lower pleasures — a move that arguably concedes the objection.',
    start:'Chapters 2 and 4.',
    counter:'Kant on using persons as means; Le Guin’s Omelas on how the total is distributed.' });
  def('genealogy', { title:'On the Genealogy of Morals', author:'Friedrich Nietzsche', year:'1887', tradition:'modern', rights:'open',
    gist:'Asks where our moral values came from rather than whether they are true. The first essay diagnoses ressentiment: the creativity of those who cannot act, who revalue instead and call their condition virtue.',
    start:'The First Essay. The Second, on guilt and bad conscience, is the harder and better one.',
    counter:'Max Scheler, sympathetic but convinced Nietzsche overextends the diagnosis.' });
  def('gay-science', { title:'The Gay Science', author:'Friedrich Nietzsche', year:'1882', tradition:'modern', rights:'open',
    gist:'Contains §341, "the greatest weight": a demon tells you that you will live this life again innumerable times, unchanged. Would you gnash your teeth, or call it divine? A scale, not a cosmology.',
    start:'§341, then §125 for the death of God.',
    counter:'Any reader who thinks affirmation of everything is indistinguishable from indifference to anything.' });
  def('zarathustra', { title:'Thus Spoke Zarathustra', author:'Friedrich Nietzsche', year:'1883', tradition:'modern', rights:'open',
    gist:'The recurrence restaged as narrative, and as the hardest thing Zarathustra has to bring himself to affirm. Written in a mock-scriptural register that some readers find unbearable and others find the point.',
    start:'"On the Vision and the Riddle" and "The Convalescent".',
    counter:'Nietzsche’s own later notebooks, which keep circling the doctrine without settling it.' });
  def('ecce-homo', { title:'Ecce Homo', author:'Friedrich Nietzsche', year:'1888', tradition:'modern', rights:'open',
    gist:'Written months before his collapse, and containing his formula for greatness: amor fati — to want nothing to be other than it is, forward, backward, in all eternity. Not merely to bear it, but to love it.',
    start:'"Why I Am So Clever", where the formula appears.',
    counter:'Read it beside the letters from the same period, and decide what you are reading.' });
  def('karamazov', { title:'The Brothers Karamazov', author:'Fyodor Dostoevsky', year:'1880', tradition:'modern', rights:'open',
    gist:'Its "Rebellion" chapter is the sharpest statement of the problem of evil in any language: Ivan does not deny God, he returns his ticket, because no future harmony can be worth one child’s suffering.',
    start:'"Rebellion", then "The Grand Inquisitor" immediately after.',
    counter:'The rest of the novel, which is Dostoevsky’s attempt to answer Ivan and does not obviously succeed.' });
  def('souls', { title:'The Souls of Black Folk', author:'W.E.B. Du Bois', year:'1903', tradition:'critical', rights:'open',
    gist:'Names double consciousness — the sense of always seeing yourself through the eyes of a world that looks on with contempt — and calls the resulting doubled sight a genuine gift bought at genuine cost.',
    start:'Chapter I, "Of Our Spiritual Strivings".',
    counter:'Fanon, who takes the same structure into the colonial situation and finds less to redeem in it.' });
  def('principia-ethica', { title:'Principia Ethica', author:'G.E. Moore', year:'1903', tradition:'analytic', rights:'open',
    gist:'Argues that "good" cannot be defined in natural terms — the naturalistic fallacy — and offers the open question argument as proof: of any proposed definition, it remains sensible to ask whether it really is good.',
    start:'Chapter 1.',
    counter:'Naturalists ever since, who think the open question begs the question.' });
  def('husserl-ideas', { title:'Ideas I', author:'Edmund Husserl', year:'1913', tradition:'existential', rights:'open',
    gist:'Sets out the epoché: bracket the question of whether the world is as it appears, so that the structure of appearing itself becomes describable. The founding method of phenomenology.',
    start:'The sections on the natural attitude and its suspension.',
    counter:'His own student Heidegger, who thought the bracketing lost exactly what mattered.' });
  def('book-of-tea', { title:'The Book of Tea', author:'Okakura Kakuzō', year:'1906', tradition:'japanese', rights:'open',
    gist:'A short book on the tea ceremony that is really about an aesthetics of imperfection, emptiness and the charged interval — written for Western readers, and quietly polemical about them.',
    start:'The chapters on the tea room and on flowers.',
    counter:'Later scholars who read it as inventing the tradition it claims to describe.' });
  def('scheler-ress', { title:'Ressentiment', author:'Max Scheler', year:'1912', tradition:'modern', rights:'open',
    gist:'Accepts Nietzsche’s psychological description while rejecting his conclusion that Christian morality is its product. The most useful sympathetic critique of the Genealogy.',
    start:'The opening chapters on the phenomenon itself.',
    counter:'Nietzsche, obviously.' });
  def('ecclesiastes', { title:'Ecclesiastes', author:'Hebrew Bible', year:'c. 250 BCE', tradition:'modern', rights:'open',
    gist:'Hevel — vapour, breath, the thing you cannot hold — usually rendered "vanity". The oldest sustained statement of the absurd, and it does not resolve so much as recommend eating your bread.',
    start:'It is short. Read it whole, in one sitting.',
    counter:'Camus arrives at nearly the same place and refuses the consolation.' });
  def('job', { title:'Book of Job', author:'Hebrew Bible', year:'c. 500 BCE', tradition:'modern', rights:'open',
    gist:'Remarkable for refusing to answer its own question. Job’s comforters supply every available theodicy and are rebuked for it; the whirlwind changes the subject rather than justifying anything.',
    start:'Chapters 38–42, the voice from the whirlwind.',
    counter:'Leibniz, who supplies exactly the reason the text withholds.' });
  def('proust', { title:'In Search of Lost Time', author:'Marcel Proust', year:'1913', tradition:'modern', rights:'open',
    gist:'Its philosophical claim is that the past is not recovered by willing it but arrives unbidden through the body — a taste, a paving stone, an unevenness underfoot — and that voluntary memory returns only a husk.',
    start:'The madeleine passage in Swann’s Way; the paving stones near the end of Time Regained.',
    counter:'Bergson, whose account of duration Proust knew and diverges from more than is often noticed.' });

  /* ---------- Twentieth century, in copyright ---------- */
  def('being-time', { title:'Being and Time', author:'Martin Heidegger', year:'1927', tradition:'existential', rights:'restricted',
    gist:'Anxiety is disclosive: it strips the world of familiar usefulness so that your own existence shows up as a question. Death is your ownmost possibility, and authentic existence begins in taking it as yours.',
    start:'§40 on anxiety; §§46–53 on being-toward-death. Not a book to start at page one.',
    counter:'Levinas, who argues the whole structure is self-enclosed and misses the ethical claim of the other.' });
  def('being-nothingness', { title:'Being and Nothingness', author:'Jean-Paul Sartre', year:'1943', tradition:'existential', rights:'restricted',
    gist:'Bad faith is the manoeuvre by which we describe ourselves as fixed things in order to escape having chosen. The waiter playing at being a waiter is the famous case; "I had to" is the everyday one.',
    start:'Part I, chapter 2, on bad faith.',
    counter:'Beauvoir, who accepts the analysis and insists that freedom is always situated.' });
  def('ethics-ambiguity', { title:'The Ethics of Ambiguity', author:'Simone de Beauvoir', year:'1947', tradition:'feminist', rights:'restricted',
    gist:'The ethics Sartre promised and never wrote. Freedom is real and situated at once, and oppression is precisely the removal of situations in which freedom could be exercised.',
    start:'Part II, on the ambiguity of the human condition.',
    counter:'Sartre’s own later Marxist turn, which addresses the same gap differently.' });
  def('second-sex', { title:'The Second Sex', author:'Simone de Beauvoir', year:'1949', tradition:'feminist', rights:'restricted',
    gist:'One is not born but becomes a woman. The category is made — and made real by being made — which is why the constraint is neither natural nor imaginary, and why it is so hard to argue with.',
    start:'The introduction, and Book II’s opening.',
    counter:'Butler, who argues Beauvoir still leaves a pre-social body doing too much work.' });
  def('sisyphus', { title:'The Myth of Sisyphus', author:'Albert Camus', year:'1942', tradition:'existential', rights:'restricted',
    gist:'The absurd is not in the world and not in you but in the collision: a mind demanding meaning meets a universe returning silence. The conclusion is refusal rather than despair.',
    start:'The opening essay on the absurd reasoning, then the closing pages on Sisyphus.',
    counter:'Nagel, who thinks Camus dramatises what is merely a mild and manageable incongruity.' });
  def('merleau', { title:'Phenomenology of Perception', author:'Maurice Merleau-Ponty', year:'1945', tradition:'existential', rights:'restricted',
    gist:'You do not have a body that reports to a mind; you are a body that knows the world by inhabiting it. The blind man’s cane stops being an object and becomes an organ.',
    start:'The chapters on the body as object and on motor intentionality.',
    counter:'Cognitive science took decades to arrive here and still argues about how much it concedes.' });
  def('gravity-grace', { title:'Gravity and Grace', author:'Simone Weil', year:'1947', tradition:'critical', rights:'restricted',
    gist:'Attention is the rarest and purest form of generosity, and it is closer to waiting than to effort. What fragments it, in her account, is the self’s constant return to itself.',
    start:'The sections on attention and on decreation.',
    counter:'Readers who find the ascetic demand indistinguishable from self-erasure.' });
  def('weil-factory', { title:'Factory Journal', author:'Simone Weil', year:'1936', tradition:'critical', rights:'restricted',
    gist:'She took a year of factory work to test the theory of alienation against her own body, and recorded what happened. The result reads less like philosophy than like evidence.',
    start:'Any twenty pages.',
    counter:'Marx, whom she is confirming and complicating at once.' });
  def('weil-school', { title:'Reflections on the Right Use of School Studies', author:'Simone Weil', year:'1942', tradition:'critical', rights:'restricted',
    gist:'A short essay arguing that the point of studying geometry is not geometry — it is training the faculty of attention, which is the same faculty love of one’s neighbour requires.',
    start:'It is a dozen pages.',
    counter:'Anyone who thinks education has more mundane purposes.' });
  def('human-condition', { title:'The Human Condition', author:'Hannah Arendt', year:'1958', tradition:'critical', rights:'restricted',
    gist:'Distinguishes labour (which sustains life and vanishes), work (which builds a durable world) and action (which appears among others and starts something new). A rival to Marx’s single category of production.',
    start:'The chapters on labour and on action.',
    counter:'Marx, whose account of self-realisation through labour she is deliberately refusing.' });
  def('discipline-punish', { title:'Discipline and Punish', author:'Michel Foucault', year:'1975', tradition:'critical', rights:'restricted',
    gist:'The point about the panopticon is that the guard need not be there. Visibility is a trap: the inmate who might be watched starts doing the watching, and power becomes automatic and cheap.',
    start:'Part III, "Panopticism".',
    counter:'Historians who dispute nearly every empirical claim in it, and readers who find it explains too much.' });
  def('bourdieu', { title:'Outline of a Theory of Practice', author:'Pierre Bourdieu', year:'1972', tradition:'critical', rights:'restricted',
    gist:'Doxa names beliefs so settled they are not experienced as beliefs — the part of the world that shows up simply as the world. Habitus names the dispositions that reproduce it without anyone intending to.',
    start:'The sections on doxa, orthodoxy and heterodoxy.',
    counter:'Critics who find the framework leaves no room for anyone to change anything.' });
  def('totality-infinity', { title:'Totality and Infinity', author:'Emmanuel Levinas', year:'1961', tradition:'existential', rights:'restricted',
    gist:'Ethics comes before ontology. The face of the other issues a command prior to any reasoning about it, and the Other is precisely what exceeds your concept of them.',
    start:'Section III, on the face.',
    counter:'Derrida’s "Violence and Metaphysics", which is the essential critical reading.' });
  def('i-and-thou', { title:'I and Thou', author:'Martin Buber', year:'1923', tradition:'existential', rights:'restricted',
    gist:'Two basic words: I–It, which describes and uses, and I–Thou, which addresses. The same person can be either, and the difference is not in them but in how you stand.',
    start:'Part One. It is short and written to be read aloud.',
    counter:'Levinas, who thought the reciprocity of I–Thou softens the asymmetry ethics actually has.' });
  def('black-skin', { title:'Black Skin, White Masks', author:'Frantz Fanon', year:'1952', tradition:'critical', rights:'restricted',
    gist:'The phenomenology of being seen as a type. Takes Hegel’s struggle for recognition into a situation where recognition is withheld by structure, so the dialectic cannot complete.',
    start:'Chapter 5, "The Fact of Blackness".',
    counter:'His own later Wretched of the Earth, which draws harder political conclusions.' });
  def('theory-justice', { title:'A Theory of Justice', author:'John Rawls', year:'1971', tradition:'analytic', rights:'restricted',
    gist:'Design the arrangement without knowing which position in it you will occupy. Most claims about desert dissolve, because the talents we take credit for are themselves arbitrary from a moral point of view.',
    start:'The first three chapters. §§1–4 and §24 carry the argument.',
    counter:'Nozick’s Anarchy, State, and Utopia, written partly as a reply.' });
  def('anarchy-state', { title:'Anarchy, State, and Utopia', author:'Robert Nozick', year:'1974', tradition:'analytic', rights:'restricted',
    gist:'The strongest reply to Rawls: justice is historical, not patterned. If holdings were justly acquired and justly transferred, the resulting distribution is just however unequal it looks.',
    start:'Chapter 7, on distributive justice and the Wilt Chamberlain argument.',
    counter:'Rawls, and Cohen’s Self-Ownership, Freedom and Equality.' });
  def('idea-justice', { title:'The Idea of Justice', author:'Amartya Sen', year:'2009', tradition:'analytic', rights:'restricted',
    gist:'Argues we do not need agreement on perfect justice to identify and remove clear injustice — and that Rawls’s search for ideal institutions was the wrong shape of question.',
    start:'The introduction and Part I.',
    counter:'Rawlsians, who deny you can rank options without a standard.' });
  def('reasons-persons', { title:'Reasons and Persons', author:'Derek Parfit', year:'1984', tradition:'analytic', rights:'restricted',
    gist:'Identity is not what matters in survival. Through teletransportation and gradual replacement cases, Parfit argues that what we care about admits of degrees, and that this is liberating rather than bleak.',
    start:'Part III, on personal identity.',
    counter:'Everyone who thinks the thought experiments prove only that intuitions break under strain.' });
  def('frankfurt', { title:'Freedom of the Will and the Concept of a Person', author:'Harry Frankfurt', year:'1971', tradition:'analytic', rights:'restricted',
    gist:'Freedom is not the absence of causes but the alignment of your will with what you want to want. The unwilling addict and the willing addict differ in nothing except this second-order structure.',
    start:'It is a single paper, around twenty pages.',
    counter:'Watson and Wolf, who argue second-order desires are no more authoritative than first-order ones.' });
  def('phil-investigations', { title:'Philosophical Investigations', author:'Ludwig Wittgenstein', year:'1953', tradition:'analytic', rights:'restricted',
    gist:'Abandons his own earlier picture theory. Meaning is use in a form of life; concepts have family resemblance rather than essence; asking for a definition often manufactures the confusion it means to clear.',
    start:'§§1–80. Read slowly and out of order.',
    counter:'His own Tractatus, which the book is largely written against.' });
  def('on-certainty', { title:'On Certainty', author:'Ludwig Wittgenstein', year:'1969', tradition:'analytic', rights:'restricted',
    gist:'Written in his last months. Some certainties are not claims within our practice of doubting but hinges on which the doubting turns — you cannot doubt them without dismantling what doubt would mean.',
    start:'The opening hundred remarks.',
    counter:'Sceptics who read the hinge metaphor as a refusal to answer rather than an answer.' });
  def('kuhn', { title:'The Structure of Scientific Revolutions', author:'Thomas Kuhn', year:'1962', tradition:'analytic', rights:'restricted',
    gist:'Science does not advance by falsification but by long periods of puzzle-solving inside a paradigm, punctuated by crises in which the paradigm is replaced and the terms change meaning.',
    start:'Chapters IX and X, on revolutions and world changes.',
    counter:'Popper, whose account it was written against, and Lakatos, who tried to reconcile them.' });
  def('popper-logic', { title:'The Logic of Scientific Discovery', author:'Karl Popper', year:'1934', tradition:'analytic', rights:'restricted',
    gist:'A claim earns scientific standing by what could refute it, not by what confirms it. Theories that explain every outcome explain none — which is the charge he levels at psychoanalysis and Marxism.',
    start:'Chapters I and IV, on the problem of demarcation and falsifiability.',
    counter:'Kuhn, and the Duhem–Quine point that no hypothesis is ever falsified alone.' });
  def('goffman', { title:'The Presentation of Self in Everyday Life', author:'Erving Goffman', year:'1956', tradition:'critical', rights:'restricted',
    gist:'Social life read as staged performance, with a front region where the show runs and a back region where it is prepared. Not a cynical book, though it is constantly mistaken for one.',
    start:'The chapters on performances and on regions.',
    counter:'Critics who say the theatrical metaphor implies a real self backstage that Goffman never locates.' });
  def('gilligan', { title:'In a Different Voice', author:'Carol Gilligan', year:'1982', tradition:'feminist', rights:'restricted',
    gist:'Found that moral reasoning organised around responsibility and relationship was being scored as immature by frameworks built on rights and rules — and argued the frameworks, not the reasoners, were incomplete.',
    start:'Chapters 1 and 2.',
    counter:'Empirical critics who dispute the gender difference, and feminists wary of essentialising care.' });
  def('noddings', { title:'Caring: A Relational Approach to Ethics', author:'Nel Noddings', year:'1984', tradition:'feminist', rights:'restricted',
    gist:'Makes the caring relation, not the autonomous chooser, the ethical primitive — and insists the one-caring must herself be sustained, or the relation collapses.',
    start:'The chapters on engrossment and on the ethical ideal.',
    counter:'Critics who ask what the theory says about strangers you will never meet.' });
  def('kittay', { title:'Love’s Labor', author:'Eva Feder Kittay', year:'1999', tradition:'feminist', rights:'restricted',
    gist:'Dependency is the unavoidable human condition, not an exception to it — and any theory of justice that begins from independent contracting equals has abstracted away most of a life.',
    start:'The chapters on dependency work and on the doulia principle.',
    counter:'Rawls, whose framework she is arguing cannot accommodate this.' });
  def('gender-trouble', { title:'Gender Trouble', author:'Judith Butler', year:'1990', tradition:'feminist', rights:'restricted',
    gist:'Gender is performative: the repeated acts produce the category they appear to express. There is no doer behind the deed waiting to be expressed.',
    start:'Chapter 1 and the conclusion.',
    counter:'Nussbaum’s hostile review, and material feminists who think the body has gone missing.' });
  def('honneth', { title:'The Struggle for Recognition', author:'Axel Honneth', year:'1992', tradition:'critical', rights:'restricted',
    gist:'Rebuilds Hegel’s recognition as the grammar of social conflict: love, rights and solidarity are three forms of recognition, and their denial is what social struggles are actually about.',
    start:'Chapters 5 and 6.',
    counter:'Fraser, who argues recognition has crowded out redistribution.' });
  def('poetics-space', { title:'The Poetics of Space', author:'Gaston Bachelard', year:'1958', tradition:'existential', rights:'restricted',
    gist:'Phenomenology applied to houses, corners, drawers and shells — the spaces we inhabit imaginatively rather than measure. Closer to criticism than to argument, deliberately.',
    start:'The chapters on the house and on nests.',
    counter:'Anyone who wants a method rather than a sensibility.' });
  def('iki', { title:'The Structure of Iki', author:'Kuki Shūzō', year:'1930', tradition:'japanese', rights:'restricted',
    gist:'Takes a native aesthetic category — iki, roughly a poised and knowing style — and gives it rigorous phenomenological treatment, arguing some concepts cannot survive translation.',
    start:'The opening chapters on method.',
    counter:'Critics who read it as cultural nationalism in phenomenological dress.' });
  def('omelas', { title:'The Ones Who Walk Away from Omelas', author:'Ursula K. Le Guin', year:'1973', tradition:'analytic', rights:'restricted',
    gist:'A short story that is also the cleanest statement of the distribution objection to utilitarianism: a city of perfect happiness whose condition is one child kept in a basement.',
    start:'Ten pages. Read it in one sitting.',
    counter:'It is a story, not an argument — which is either its weakness or exactly its force.' });

  /* ---------- resolution ---------- */

  const norm = s => s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

  // A citation like "Enchiridion, §1" or "Being and Time, §§46–53" resolves
  // to the work; the remainder is kept as the cited section. Titles that
  // contain their own comma ("Anarchy, State, and Utopia") match whole first.
  function splitCitation(work, index) {
    const whole = work.trim();
    if (index[norm(whole)]) return { stem: whole, section: null };
    const at = whole.indexOf(',');
    if (at < 0) return { stem: whole, section: null };
    return { stem: whole.slice(0, at).trim(), section: whole.slice(at + 1).trim() };
  }

  const INDEX = {};
  Object.values(W).forEach(w => { INDEX[norm(w.title)] = w; });
  // shorthand and variant titles used inside the corpus
  const ALIAS = {
    'groundwork': 'groundwork',
    'nicomachean ethics': 'nicomachean',
    'meditations': 'meditations',
    'a treatise of human nature': 'hume-treatise',
    'daodejing': 'daodejing',
    'bhagavad gita': 'gita',
    'chandogya upanisad': 'chandogya',
    'ethics': 'spinoza-ethics',
    'phenomenology of spirit': 'hegel-phen',
    'being and time': 'being-time',
    'being and nothingness': 'being-nothingness',
    'on the genealogy of morals': 'genealogy',
    'the gay science': 'gay-science',
    'apology': 'apology',
    'meno': 'meno',
    'zhuangzi': 'zhuangzi',
    'mencius': 'mencius',
    'an essay concerning human understanding': 'locke-essay',
    'the brothers karamazov': 'karamazov',
    'caring: a feminine approach to ethics': 'noddings',
    'outlines of pyrrhonism': 'pyrrhonism',
    'pyrrhonian sketches': 'pyrrhonism',
    'on liberty': 'on-liberty',
    'discourses': 'discourses',
    'enchiridion': 'enchiridion',
    'masnavi': 'masnavi',
    'essays': 'essays',
    'confessions': 'confessions'
  };
  Object.entries(ALIAS).forEach(([k, v]) => { if (W[v]) INDEX[k] = W[v]; });

  function resolve(source) {
    const { stem, section } = splitCitation(source.work, INDEX);
    const w = INDEX[norm(stem)];
    if (w) return Object.assign({}, w, { section, cited: source.work, note: source.note });
    // Unregistered citation — still readable, just without the apparatus.
    return {
      id: 'x:' + norm(stem).replace(/[^a-z0-9]+/g, '-'),
      title: stem, author: source.author, year: '', tradition: '',
      rights: 'unknown', gist: '', start: '', counter: '',
      section, cited: source.work, note: source.note
    };
  }

  function links(w) {
    const q = w.title + ' ' + (w.author || '');
    const out = [];
    if (w.rights === 'open') {
      out.push({ label: 'Full text · Project Gutenberg', href: G(q), primary: true });
      out.push({ label: 'Full text · Internet Archive', href: A(q) });
    } else {
      out.push({ label: 'Find a copy · Internet Archive', href: A(q), primary: true });
    }
    out.push({ label: 'Stanford Encyclopedia', href: S(w.author || w.title) });
    return out;
  }

  // Every distinct work raised by an analysis, ordered by how many
  // insights point at it, then alphabetically by author.
  function shelf(insights) {
    const by = new Map();
    insights.forEach(ins => {
      (ins.sources || []).forEach(src => {
        const w = resolve(src);
        if (!by.has(w.id)) by.set(w.id, Object.assign({}, w, { raisedBy: [], sections: new Set() }));
        const rec = by.get(w.id);
        rec.raisedBy.push({ key: ins.key, label: ins.label, category: ins.category, note: src.note });
        if (w.section) rec.sections.add(w.section);
      });
    });
    return [...by.values()]
      .map(r => Object.assign(r, { sections: [...r.sections] }))
      .sort((a, b) => b.raisedBy.length - a.raisedBy.length ||
                      (a.author || '').localeCompare(b.author || ''));
  }

  window.PalinodeLibrary = { works: W, resolve, links, shelf, count: Object.keys(W).length };
})();
