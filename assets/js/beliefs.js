/* ============================================================
   Palinode — Belief Spectra (the authored instrument)

   Twenty-seven canonical dichotomies, the named positions that
   sit on them, and the multiple-choice items that place a person.

   Two rules govern this file, both inherited from Khora:

     1. Placement is CURATED. Every option carries an authored
        { axisId, delta }. Nothing here classifies prose.
     2. `left` poles score NEGATIVE, `right` poles score POSITIVE,
        and every delta lives in [-1, 1].

   Items are written as scenarios — "someone says their life has
   meaning because of their family" — never as "are you a dualist?".

   CONCEPT_AXES is the one bridge to the live reader: it says which
   axes a Palinode concept is in the neighbourhood of, so a note can
   offer a *tentative* lean. A tentative lean never scores.
   ============================================================ */

(function () {

  /* ================= spectra ================= */

  const SPECTRA = [

    /* ---------- Epistemology ---------- */
    {
      id: 'rationalism-empiricism', branch: 'Epistemology',
      title: 'Rationalism vs Empiricism',
      left: 'Rationalism', right: 'Empiricism',
      question: 'When you finally understand something, where did the understanding come from?',
      summary: 'Whether the mind brings structure to experience or draws everything it has from experience. The dispute is not about whether we use our senses, but about whether the senses could be enough on their own.',
      tags: ['rationalism', 'empiricism', 'knowledge', 'reason', 'experience', 'evidence'],
      arguments: [
        { id: 'descartes', name: 'René Descartes', position: -0.85,
          capsule: 'The senses deceive; what survives methodical doubt is reached by reason alone. Mathematics is the model for knowledge, not observation.',
          challenge: 'You trust your senses in every practical matter of your life. On what grounds do you demote them the moment the question becomes philosophical?' },
        { id: 'kant', name: 'Immanuel Kant', position: -0.3,
          capsule: 'Both, structurally: concepts without intuitions are empty, intuitions without concepts are blind. Experience is real but arrives already shaped by the mind that receives it.',
          challenge: 'If the mind supplies the structure, you can never check the structure against anything. How would you ever discover that it was wrong?' },
        { id: 'hume', name: 'David Hume', position: 0.8,
          capsule: 'Every idea traces back to an impression. Where you cannot find the impression, you have found a word doing no work — including "necessity" and "self".',
          challenge: 'No accumulation of impressions gives you the rule that the next case will resemble them. You use induction constantly and cannot derive it from experience.' },
        { id: 'locke', name: 'John Locke', position: 0.6,
          capsule: 'The mind starts as white paper. Whatever is written on it was written by sensation and reflection on sensation.',
          challenge: 'A blank page cannot notice that it is being written on. Something must already be in place for experience to register as experience at all.' }
      ]
    },
    {
      id: 'skepticism-dogmatism', branch: 'Epistemology',
      title: 'Skepticism vs Dogmatism',
      left: 'Skepticism', right: 'Dogmatism',
      question: 'How much of what you believe would you be willing to state without qualification?',
      summary: 'Whether the honest position is suspended judgement or committed assertion. Both poles claim to be the intellectually serious one, and both accuse the other of hiding.',
      tags: ['skepticism', 'dogmatism', 'doubt', 'certainty', 'knowledge', 'confidence'],
      arguments: [
        { id: 'sextus', name: 'Sextus Empiricus', position: -0.9,
          capsule: 'For every argument there is an equal argument opposed. Suspension of judgement is not a failure to decide; it is what tranquillity actually consists of.',
          challenge: 'You suspended judgement on the strength of an argument. Why did that argument escape the suspension?' },
        { id: 'socrates', name: 'Socrates', position: -0.5,
          capsule: 'Human wisdom is knowing the extent of your ignorance. Others think they know what they do not; that is the whole of the difference.',
          challenge: 'You state your ignorance very firmly. That is itself a confident claim about the limits of what can be known.' },
        { id: 'moore', name: 'G.E. Moore', position: 0.75,
          capsule: 'Here is one hand. The certainty that I have hands is better grounded than any argument a skeptic can construct against it, so the argument is what goes.',
          challenge: 'That reverses the burden by force. You have not answered the doubt, you have declined it.' },
        { id: 'peirce', name: 'C.S. Peirce', position: 0.35,
          capsule: 'Doubt is a real irritation of the nerves, not a philosophical exercise. You cannot begin inquiry by pretending to doubt what you do not doubt.',
          challenge: 'Plenty of settled beliefs were comfortable and wrong. Comfort is not a mark of truth.' }
      ]
    },
    {
      id: 'foundationalism-coherentism', branch: 'Epistemology',
      title: 'Foundationalism vs Coherentism',
      left: 'Foundationalism', right: 'Coherentism',
      question: 'When you justify a belief, does the chain stop somewhere, or does it close into a circle?',
      summary: 'Whether knowledge rests on basic beliefs that need no support, or holds together like a raft whose planks support each other with no seabed underneath.',
      tags: ['foundationalism', 'coherentism', 'justification', 'basic beliefs', 'evidence'],
      arguments: [
        { id: 'aristotle-found', name: 'Aristotle', position: -0.7,
          capsule: 'Demonstration cannot go on forever. There must be first principles known in another way, or nothing is known at all.',
          challenge: 'A principle known "in another way" is a principle exempt from your own standard of justification.' },
        { id: 'neurath', name: 'Otto Neurath', position: 0.85,
          capsule: 'We are sailors who must rebuild the ship on open sea, never able to dismantle it in dry dock. There is no plank that is not replaceable.',
          challenge: 'A perfectly coherent story can be a perfectly consistent fiction. Coherence alone never touches the world.' },
        { id: 'quine', name: 'W.V.O. Quine', position: 0.6,
          capsule: 'Our statements face the tribunal of experience as a corporate body. Any one of them can be saved by adjusting another.',
          challenge: 'If any belief can be saved by adjusting the rest, no experience ever refutes anything in particular.' }
      ]
    },
    {
      id: 'internalism-externalism', branch: 'Epistemology',
      title: 'Internalism vs Externalism',
      left: 'Internalism', right: 'Externalism',
      question: 'Can you tell, from the inside, whether you know something?',
      summary: 'Whether what justifies a belief must be accessible to the believer, or whether reliable connection to the world can do the work whether or not you can see it.',
      tags: ['internalism', 'externalism', 'justification', 'reliability', 'mind', 'access'],
      arguments: [
        { id: 'chisholm', name: 'Roderick Chisholm', position: -0.8,
          capsule: 'Justification is something you can determine by reflection. If it were outside your view, calling it *your* justification would be strange.',
          challenge: 'Reflection is itself unreliable, and you cannot check it by more reflection without circling.' },
        { id: 'goldman', name: 'Alvin Goldman', position: 0.85,
          capsule: 'A belief is justified when produced by a reliable process. The chicken-sexer who cannot say how they know still knows.',
          challenge: 'Then a person could be justified while having no reason at all available to them. That is not what we normally mean by a reason.' },
        { id: 'burge', name: 'Tyler Burge', position: 0.5,
          capsule: 'Even the contents of your thoughts depend on your environment and community. What you are thinking is not settled by what is in your head.',
          challenge: 'If my own thought contents are not mine to survey, self-knowledge becomes a kind of guesswork.' }
      ]
    },

    /* ---------- Ethics ---------- */
    {
      id: 'deontology-consequentialism', branch: 'Ethics',
      title: 'Deontology vs Consequentialism',
      left: 'Deontology', right: 'Consequentialism',
      question: 'Is an act wrong because of what it is, or because of what it brings about?',
      summary: 'Whether some acts are ruled out whatever the arithmetic says, or whether the arithmetic is the whole of the question.',
      tags: ['deontology', 'consequentialism', 'duty', 'outcomes', 'ethics', 'greater good', 'rules'],
      arguments: [
        { id: 'kant-deont', name: 'Immanuel Kant', position: -0.9,
          capsule: 'Act only on a maxim you could will as universal law, and never treat a person merely as a means. Consequences are not the measure of duty.',
          challenge: 'You would refuse to lie to a murderer at the door. Most people read that as a reductio of your principle, not a demonstration of it.' },
        { id: 'anscombe', name: 'Elizabeth Anscombe', position: -0.55,
          capsule: 'Anyone who thinks in advance that some acts are open to calculation has a corrupt mind. Certain things are simply not to be done.',
          challenge: 'Refusing to calculate is also a decision, and it has consequences you are declining to look at.' },
        { id: 'mill-conseq', name: 'John Stuart Mill', position: 0.85,
          capsule: 'Actions are right in proportion as they promote happiness. Rules are useful summaries of experience, not commands from outside it.',
          challenge: 'Your calculus is indifferent to distribution. It will license sacrificing one person for a sufficiently large sum of small benefits.' },
        { id: 'singer', name: 'Peter Singer', position: 0.9,
          capsule: 'If you can prevent something bad without sacrificing anything of comparable importance, you ought to. Distance and relationship do not change the arithmetic.',
          challenge: 'A morality with no special weight for your own children is one almost no one can live inside, including you.' }
      ]
    },
    {
      id: 'absolutism-relativism', branch: 'Ethics',
      title: 'Absolutism vs Relativism',
      left: 'Absolutism', right: 'Relativism',
      question: 'When two cultures disagree about a moral question, is one of them wrong?',
      summary: 'Whether moral claims hold everywhere or hold within a form of life. The stakes are practical: whether criticism across a border is insight or imposition.',
      tags: ['absolutism', 'relativism', 'morality', 'culture', 'universal', 'ethics'],
      arguments: [
        { id: 'plato-abs', name: 'Plato', position: -0.85,
          capsule: 'The good is not a local custom. If justice varied by city, Socrates was merely unfashionable rather than wronged.',
          challenge: 'Every claimant to the universal has spoken from somewhere in particular, usually somewhere powerful.' },
        { id: 'benedict', name: 'Ruth Benedict', position: 0.8,
          capsule: 'Morality differs in every society, and is a convenient term for socially approved habits. Normality is culturally defined.',
          challenge: 'Then reformers inside a culture are always wrong by definition, since they contradict its approved habits.' },
        { id: 'williams-rel', name: 'Bernard Williams', position: 0.4,
          capsule: 'Some disagreements are real confrontations; many are notional, between ways of life that are not live options for each other.',
          challenge: 'You still need to say which is which, and that judgement cannot itself be relative without collapsing.' }
      ]
    },

    /* ---------- Meta-Ethics ---------- */
    {
      id: 'cognitivism-noncognitivism', branch: 'Meta-Ethics',
      title: 'Cognitivism vs Non-Cognitivism',
      left: 'Cognitivism', right: 'Non-Cognitivism',
      question: 'When you say cruelty is wrong, are you describing something or expressing something?',
      summary: 'Whether moral statements are the kind of thing that can be true or false at all, or whether they are attitudes in the grammar of assertion.',
      tags: ['cognitivism', 'non-cognitivism', 'moral truth', 'emotivism', 'metaethics'],
      arguments: [
        { id: 'moore-cog', name: 'G.E. Moore', position: -0.8,
          capsule: 'Good is a genuine property, simple and unanalysable. "Is that which we desire good?" remains an open question, which shows the two are not the same.',
          challenge: 'A property that explains nothing causal and is known by no sense is a strange thing to add to the world.' },
        { id: 'ayer', name: 'A.J. Ayer', position: 0.9,
          capsule: 'To say stealing is wrong adds no factual content; it expresses disapproval, as a tone of voice would. There is nothing there to be true.',
          challenge: 'People reason from moral premises to moral conclusions all day. Expressions of feeling do not enter into valid inference.' },
        { id: 'blackburn', name: 'Simon Blackburn', position: 0.5,
          capsule: 'Attitudes can be projected onto the world and then talked about as if they were features of it. That is a real practice, and it is not error.',
          challenge: 'Once you allow the projection to behave in every way like a truth claim, the disagreement with cognitivism may be verbal.' }
      ]
    },

    /* ---------- Metaphysics ---------- */
    {
      id: 'free-will-determinism', branch: 'Metaphysics',
      title: 'Free Will vs Determinism',
      left: 'Free Will', right: 'Determinism',
      question: 'Looking back at a decision you regret, could you have done otherwise?',
      summary: 'Whether choice is a genuine fork in the road or the felt surface of a process already underway. Responsibility, regret and praise all sit on the answer.',
      tags: ['free will', 'determinism', 'choice', 'fate', 'responsibility', 'regret', 'agency'],
      arguments: [
        { id: 'sartre-fw', name: 'Jean-Paul Sartre', position: -0.95,
          capsule: 'We are condemned to be free. Even the refusal to choose is a choice, and "I had to" is almost always a decision wearing a disguise.',
          challenge: 'Beauvoir, working from the same premises, showed that freedom is situated. Some constraints are not stories people tell themselves.' },
        { id: 'kant-fw', name: 'Immanuel Kant', position: -0.5,
          capsule: 'As appearances we are caused; as agents under moral law we must be taken as free. Both are required and neither can be dropped.',
          challenge: 'Holding both at once looks less like a solution than a division of labour between two descriptions that never meet.' },
        { id: 'spinoza', name: 'Baruch Spinoza', position: 0.9,
          capsule: 'We think ourselves free because we are conscious of our desires and ignorant of their causes. A thrown stone, if conscious, would believe it was flying by choice.',
          challenge: 'You argued for that conclusion in order to change minds — which presumes minds can be moved by reasons rather than merely pushed.' },
        { id: 'frankfurt', name: 'Harry Frankfurt', position: 0.35,
          capsule: 'Freedom is not the absence of causes but the alignment of your will with the will you want to have. Determinism leaves that intact.',
          challenge: 'Where did the second-order desire come from? If it was caused too, the alignment is just a longer chain.' }
      ]
    },
    {
      id: 'idealism-materialism', branch: 'Metaphysics',
      title: 'Idealism vs Materialism',
      left: 'Idealism', right: 'Materialism',
      question: 'If every mind vanished tonight, what would be left?',
      summary: 'Whether reality is fundamentally mental or fundamentally physical. The question is not whether matter exists but whether it is the bottom layer.',
      tags: ['idealism', 'materialism', 'reality', 'mind', 'matter', 'metaphysics'],
      arguments: [
        { id: 'berkeley', name: 'George Berkeley', position: -0.9,
          capsule: 'To be is to be perceived. Matter as an unperceived substrate is a hypothesis doing no work that ideas do not already do.',
          challenge: 'The world behaves with a stubbornness that does not track anyone perceiving it, which is exactly what a substrate would explain.' },
        { id: 'shankara', name: 'Śaṅkara', position: -0.6,
          capsule: 'Multiplicity is māyā — not a lie, but a partial reading, like the rope taken for a snake. Ātman and Brahman are not two.',
          challenge: 'A partial reading still needs something to be partial about, and that something starts to look like an independent world.' },
        { id: 'lucretius', name: 'Lucretius', position: 0.85,
          capsule: 'Atoms and void, and everything else is arrangement. Mind included, which is why it ends when the arrangement does.',
          challenge: 'Arrangements of atoms are not obviously the sort of thing that feels like anything from the inside.' }
      ]
    },
    {
      id: 'realism-nominalism', branch: 'Metaphysics',
      title: 'Realism vs Anti-Realism / Nominalism',
      left: 'Realism', right: 'Nominalism',
      question: 'Do categories like "courage" or "chair" exist, or are they useful names we agree on?',
      summary: 'Whether the joints we carve the world at are found or made. Nominalism does not deny that things exist, only that the kinds do.',
      tags: ['realism', 'nominalism', 'anti-realism', 'universals', 'categories', 'language'],
      arguments: [
        { id: 'plato-forms', name: 'Plato', position: -0.9,
          capsule: 'Particular just acts are just by participating in justice itself. Without the Form, the word names nothing stable across cases.',
          challenge: 'Nothing has ever been observed participating in anything. The relation is doing all the work and cannot be described.' },
        { id: 'ockham', name: 'William of Ockham', position: 0.8,
          capsule: 'Only individuals exist. Universals are signs — economical habits of naming, not residents of a second world.',
          challenge: 'Naming habits that let us predict the unobserved are unusually lucky if they answer to nothing.' },
        { id: 'nagarjuna', name: 'Nāgārjuna', position: 0.65,
          capsule: 'Things lack the fixed essence our grip presumes. Emptiness is not nothingness; it is dependence all the way down.',
          challenge: 'If everything is empty, so is the doctrine of emptiness — a point you accept, but which leaves nothing to assert.' }
      ]
    },
    {
      id: 'reductionism-emergentism', branch: 'Metaphysics',
      title: 'Reductionism vs Emergentism',
      left: 'Reductionism', right: 'Emergentism',
      question: 'Is a full account of the parts a full account of the thing?',
      summary: 'Whether higher-level facts are shorthand for lower-level ones, or whether wholes acquire properties that no description of parts contains.',
      tags: ['reductionism', 'emergentism', 'explanation', 'parts', 'wholes', 'science'],
      arguments: [
        { id: 'laplace', name: 'Pierre-Simon Laplace', position: -0.85,
          capsule: 'An intellect knowing all positions and forces would find nothing uncertain. Everything above physics is a convenience of ignorance.',
          challenge: 'No such calculation has ever been carried out, and the sciences that work do not proceed as if it could be.' },
        { id: 'mill-emerg', name: 'John Stuart Mill', position: 0.7,
          capsule: 'Some effects are heteropathic: the joint action is not the sum of the separate actions. Chemistry is not mechanics with more steps.',
          challenge: 'Every case once called emergent that we later understood turned out to be composition after all.' },
        { id: 'anderson', name: 'Philip Anderson', position: 0.8,
          capsule: 'More is different. At each level of complexity new properties appear, and the reduction to the level below does not reconstruct them.',
          challenge: 'Novel behaviour of aggregates is still behaviour of the parts arranged that way. Nothing new was added.' }
      ]
    },

    /* ---------- Meaning of Life ---------- */
    {
      id: 'nihilism-existentialism', branch: 'Meaning of Life',
      title: 'Nihilism vs Existentialism',
      left: 'Nihilism', right: 'Existentialism',
      question: 'If no meaning is given to you, is there any to be had?',
      summary: 'Both poles agree the universe hands over nothing. They part on what follows: that meaning is therefore absent, or that it is therefore yours to make.',
      tags: ['nihilism', 'existentialism', 'meaning', 'purpose', 'absurd', 'pointless'],
      arguments: [
        { id: 'schopenhauer', name: 'Arthur Schopenhauer', position: -0.85,
          capsule: 'Life swings between pain and boredom, driven by a will that has no object beyond continuing. Meaning is what we invent to avoid seeing this.',
          challenge: 'You wrote at length, in beautiful prose, to persuade others. That is a great deal of effort for a meaningless universe.' },
        { id: 'ligotti', name: 'Thomas Ligotti', position: -0.6,
          capsule: 'Consciousness is a mistake of nature that makes us aware of what we would be better off not knowing. Meaning is a coping mechanism.',
          challenge: 'Calling something a coping mechanism does not show it is false, only that it helps.' },
        { id: 'camus', name: 'Albert Camus', position: 0.55,
          capsule: 'The absurd is the collision between a mind demanding meaning and a silent universe. The answer is not despair but refusal: one must imagine Sisyphus happy.',
          challenge: 'Scorn of the rock is still a relation to the rock. You may have smuggled meaning back in under the name of defiance.' },
        { id: 'frankl', name: 'Viktor Frankl', position: 0.9,
          capsule: 'Meaning is not received but found in a specific situation — in work, in love, in the attitude taken toward unavoidable suffering.',
          challenge: 'If it can be found in any circumstance whatsoever, it is unclear whether it is being found or supplied.' }
      ]
    },

    /* ---------- Philosophy of Mind ---------- */
    {
      id: 'dualism-physicalism', branch: 'Philosophy of Mind',
      title: 'Dualism vs Physicalism / Monism',
      left: 'Dualism', right: 'Physicalism',
      question: 'Is your experience of this moment the same kind of thing as the activity in your brain?',
      summary: 'Whether mind is a second kind of thing or the brain described in another vocabulary. The hard part is that both poles have an unpaid bill.',
      tags: ['dualism', 'physicalism', 'mind', 'consciousness', 'brain', 'soul', 'body'],
      arguments: [
        { id: 'descartes-dual', name: 'René Descartes', position: -0.9,
          capsule: 'I can doubt that I have a body but not that I think. Whatever the mind is, it is not the sort of thing that has extension.',
          challenge: 'An unextended thing cannot push an extended one, yet decisions move arms. The interaction has never been described.' },
        { id: 'chalmers', name: 'David Chalmers', position: -0.4,
          capsule: 'Explaining every function still leaves the question of why any of it is experienced. That gap is not a gap in current science but in the shape of the explanation.',
          challenge: 'Every previous "in principle" gap in science closed. Confidence that this one is different is a prediction, not an argument.' },
        { id: 'ryle', name: 'Gilbert Ryle', position: 0.8,
          capsule: 'The ghost in the machine is a category mistake — like looking for the university after being shown every building.',
          challenge: 'Diagnosing a confusion is not the same as accounting for the experience that prompted it.' },
        { id: 'buddhist-anatta', name: 'Anattā doctrine', position: 0.6,
          capsule: 'What we call a self is aggregates in motion, no more a thing apart from its parts than a chariot is. Hume arrived at the same place independently.',
          challenge: 'Something is undergoing the aggregation and noticing it, and that is what was to be explained.' }
      ]
    },

    /* ---------- Philosophy of Religion ---------- */
    {
      id: 'theism-atheism', branch: 'Philosophy of Religion',
      title: 'Theism vs Atheism',
      left: 'Theism', right: 'Atheism',
      question: 'Does the order you find in the world point to anything beyond it?',
      summary: 'Whether existence is grounded in something that intends, or in nothing that intends. Both poles must account for suffering and for order.',
      tags: ['theism', 'atheism', 'god', 'religion', 'faith', 'suffering', 'prayer'],
      arguments: [
        { id: 'aquinas', name: 'Thomas Aquinas', position: -0.9,
          capsule: 'Contingent things do not explain themselves. The series of dependent causes requires something whose existence is not borrowed.',
          challenge: 'Exempting one being from the demand for explanation is the same move you refused to allow the universe.' },
        { id: 'pascal', name: 'Blaise Pascal', position: -0.5,
          capsule: 'Reason cannot settle it, so the question becomes a wager under uncertainty — and the stakes are not symmetric.',
          challenge: 'Belief adopted for its payoff is not belief in the thing, and a god worth the name would notice.' },
        { id: 'hume-religion', name: 'David Hume', position: 0.7,
          capsule: 'The world resembles a machine only faintly, and the inference from a part we have seen to a whole we have not is weak.',
          challenge: 'Weak inference is not no inference. You have argued for restraint, not for absence.' },
        { id: 'ivan', name: 'Ivan Karamazov', position: 0.85,
          capsule: 'Any harmony purchased with the suffering of one child is a ticket he returns. The problem is not the existence of a god but the acceptance of the price.',
          challenge: 'Moral outrage that deep sits oddly in a universe you also describe as indifferent.' }
      ]
    },

    /* ---------- Philosophy of Science ---------- */
    {
      id: 'scientific-realism-instrumentalism', branch: 'Philosophy of Science',
      title: 'Scientific Realism vs Instrumentalism',
      left: 'Scientific Realism', right: 'Instrumentalism',
      question: 'When a theory works, does that mean its unobservable parts are real?',
      summary: 'Whether the entities in our best theories exist, or whether theories are instruments for prediction that need not be pictures of anything.',
      tags: ['scientific realism', 'instrumentalism', 'science', 'theory', 'truth', 'models'],
      arguments: [
        { id: 'putnam', name: 'Hilary Putnam', position: -0.85,
          capsule: 'Realism is the only philosophy that does not make the success of science a miracle. Electrons work because there are electrons.',
          challenge: 'Discarded theories were successful too. Their success did not make the ether real.' },
        { id: 'duhem', name: 'Pierre Duhem', position: 0.75,
          capsule: 'A physical theory is a system of propositions whose aim is to represent laws economically, not to explain what lies beneath them.',
          challenge: 'Scientists design experiments to find new entities, not to tidy their bookkeeping. Instrumentalism misdescribes the practice.' },
        { id: 'van-fraassen', name: 'Bas van Fraassen', position: 0.6,
          capsule: 'Accepting a theory means believing it empirically adequate. Everything beyond the observable is a step you can decline without loss.',
          challenge: 'The line between observable and unobservable moves with instruments, so it cannot bear that much weight.' }
      ]
    },
    {
      id: 'verificationism-falsificationism', branch: 'Philosophy of Science',
      title: 'Verificationism vs Falsificationism',
      left: 'Verificationism', right: 'Falsificationism',
      question: 'What makes a claim worth taking seriously — what could confirm it, or what could refute it?',
      summary: 'Whether meaning and standing come from conditions of confirmation or from exposure to refutation. Both are attempts to keep the unfalsifiable out.',
      tags: ['verificationism', 'falsificationism', 'evidence', 'proof', 'science', 'testable'],
      arguments: [
        { id: 'schlick', name: 'Moritz Schlick', position: -0.8,
          capsule: 'The meaning of a statement is its method of verification. Where no observation could confirm it, there is nothing being said.',
          challenge: 'Universal laws can never be conclusively verified, and your own criterion cannot be verified either.' },
        { id: 'popper', name: 'Karl Popper', position: 0.9,
          capsule: 'A claim earns scientific standing by what could refute it. Theories that explain every outcome explain none.',
          challenge: 'No observation refutes a theory alone; you can always adjust an auxiliary assumption instead.' },
        { id: 'kuhn', name: 'Thomas Kuhn', position: 0.2,
          capsule: 'Scientists do not abandon a paradigm on a failed prediction. Anomalies accumulate until a rival makes them intelligible.',
          challenge: 'That describes how scientists behave. It does not tell us when they were right to hold on.' }
      ]
    },

    /* ---------- Philosophy of Logic ---------- */
    {
      id: 'classical-paraconsistent', branch: 'Philosophy of Logic',
      title: 'Classical vs Paraconsistent Logic',
      left: 'Classical Logic', right: 'Paraconsistent Logic',
      question: 'If you find yourself holding two beliefs that contradict, has something broken?',
      summary: 'Whether a contradiction is a fatal fault that must be removed, or a state that can be reasoned inside without everything collapsing.',
      tags: ['logic', 'contradiction', 'paraconsistent', 'consistency', 'conflicted', 'torn'],
      arguments: [
        { id: 'aristotle-logic', name: 'Aristotle', position: -0.9,
          capsule: 'The same attribute cannot at once belong and not belong to the same subject. Deny this and you can say anything, which is to say nothing.',
          challenge: 'People reason well from inconsistent bodies of belief every day, including scientists working with incompatible models.' },
        { id: 'priest', name: 'Graham Priest', position: 0.9,
          capsule: 'Some contradictions are true, and logic can be built so that one does not license every conclusion. Explosion is a feature we chose, not a discovery.',
          challenge: 'Once contradictions are permitted, it becomes unclear what disagreement consists of, since both sides can be right.' },
        { id: 'hegel-logic', name: 'G.W.F. Hegel', position: 0.6,
          capsule: 'Contradiction is the engine of thought, not its failure. It drives a concept to a higher determination rather than destroying it.',
          challenge: 'That treats logic as a history of ideas. It does not tell you which of two inconsistent claims to act on tonight.' }
      ]
    },

    /* ---------- Philosophy of Time ---------- */
    {
      id: 'presentism-eternalism', branch: 'Philosophy of Time',
      title: 'Presentism vs Eternalism',
      left: 'Presentism', right: 'Eternalism',
      question: 'Is last Tuesday still out there somewhere, or is it gone?',
      summary: 'Whether only the present moment exists, or whether all times are equally real and "now" is like "here" — a position, not a privilege.',
      tags: ['time', 'presentism', 'eternalism', 'past', 'future', 'memory', 'block universe'],
      arguments: [
        { id: 'augustine-time', name: 'Augustine', position: -0.7,
          capsule: 'Past and future exist only as memory and expectation in a present mind. What is not now is not.',
          challenge: 'Statements about the past are true or false. Something must make them so, and memory is not enough.' },
        { id: 'prior', name: 'A.N. Prior', position: -0.85,
          capsule: 'Thank goodness that is over — a thought that makes no sense if the ordeal is as real as the relief.',
          challenge: 'Physics finds no privileged present, and relativity denies that distant observers can agree on one.' },
        { id: 'einstein-time', name: 'Hermann Minkowski', position: 0.85,
          capsule: 'Space and time form one four-dimensional manifold. Slicing it into a moving "now" is an observer\'s convenience.',
          challenge: 'Then nothing ever happens, and the passage that every conscious being reports is an illusion in need of explanation.' },
        { id: 'mctaggart', name: 'J.M.E. McTaggart', position: 0.5,
          capsule: 'The tensed series generates contradiction: every event must be past, present and future. So tense cannot be fundamental.',
          challenge: 'The contradiction only appears if tenses are treated as properties held all at once, which is not how tense works.' }
      ]
    },
    {
      id: 'endurantism-perdurantism', branch: 'Philosophy of Time',
      title: 'Endurantism vs Perdurantism',
      left: 'Endurantism', right: 'Perdurantism',
      question: 'Are you the same person as the child in your earliest photograph, or a later part of one long thing?',
      summary: 'Whether objects are wholly present at each moment they exist, or extended through time in stages the way they are extended through space in parts.',
      tags: ['identity', 'persistence', 'change', 'self', 'time', 'ship of theseus'],
      arguments: [
        { id: 'locke-endure', name: 'John Locke', position: -0.6,
          capsule: 'A person is the same person through continuity of consciousness. What persists is one thing, remembering itself forward.',
          challenge: 'Memory is patchy, reconstructive and sometimes false. A thread that thin cannot carry identity.' },
        { id: 'lewis-perdure', name: 'David Lewis', position: 0.9,
          capsule: 'Persisting things have temporal parts, as roads have spatial ones. Change is difference between stages, not a puzzle about one thing having both properties.',
          challenge: 'Nobody grieves a stage. The thing we love and lose is not a segment of a worm.' },
        { id: 'parfit', name: 'Derek Parfit', position: 0.7,
          capsule: 'Identity is not what matters. What matters is psychological continuity, and that admits of degrees rather than a yes or no.',
          challenge: 'Degrees are fine until someone must be held responsible, or paid, or forgiven. Then a yes or no is required.' }
      ]
    },

    /* ---------- Philosophy of Art ---------- */
    {
      id: 'aesthetic-objectivism-subjectivism', branch: 'Philosophy of Art',
      title: 'Aesthetic Objectivism vs Subjectivism',
      left: 'Aesthetic Objectivism', right: 'Aesthetic Subjectivism',
      question: 'When you call something beautiful, are you reporting a property or a response?',
      summary: 'Whether taste can be mistaken. Objectivism must locate beauty in the object; subjectivism must explain why we argue about it as if we could be wrong.',
      tags: ['beauty', 'aesthetics', 'taste', 'art', 'beautiful', 'objectivism', 'subjectivism'],
      arguments: [
        { id: 'plato-beauty', name: 'Plato', position: -0.85,
          capsule: 'Beautiful things are beautiful by participating in beauty itself. Otherwise the ladder of love has no top rung.',
          challenge: 'Judgements of beauty have varied enormously by era and place, which is odd for contact with an eternal form.' },
        { id: 'kant-beauty', name: 'Immanuel Kant', position: -0.2,
          capsule: 'The judgement of taste is subjective yet claims universal assent — a demand on others made without a concept to enforce it.',
          challenge: 'A demand for agreement that cannot be backed by any reason is hard to distinguish from a strong preference.' },
        { id: 'hume-taste', name: 'David Hume', position: 0.6,
          capsule: 'Beauty is no quality in things themselves; it exists in the mind that contemplates them. But some critics are better trained than others.',
          challenge: 'If it is only in the mind, deference to trained critics is a social habit rather than a route to being right.' },
        { id: 'kuki', name: 'Kuki Shūzō', position: 0.45,
          capsule: 'Aesthetic categories like iki and mono no aware are culturally specific and philosophically serious at once. The feeling is not universal, and not arbitrary.',
          challenge: 'If categories are culture-bound, cross-cultural aesthetic conversation becomes translation rather than agreement.' }
      ]
    },

    /* ---------- Philosophy of Law ---------- */
    {
      id: 'legal-positivism-natural-law', branch: 'Philosophy of Law',
      title: 'Legal Positivism vs Natural Law',
      left: 'Legal Positivism', right: 'Natural Law',
      question: 'Can a properly enacted law be so unjust that it is not law at all?',
      summary: 'Whether legal validity depends only on the pedigree of a rule, or whether a minimal moral content is part of what makes something law.',
      tags: ['law', 'justice', 'legal positivism', 'natural law', 'rules', 'unjust'],
      arguments: [
        { id: 'hart', name: 'H.L.A. Hart', position: -0.85,
          capsule: 'Law and morality are distinct. Calling an unjust statute invalid confuses the question of what the law is with what it should be — and blunts criticism.',
          challenge: 'Officials under an evil regime used exactly that separation to describe themselves as merely applying the law.' },
        { id: 'aquinas-law', name: 'Thomas Aquinas', position: 0.85,
          capsule: 'An unjust law is a corruption of law, binding at best by prudence. Legal authority derives from participation in a rational order.',
          challenge: 'Everyone claims their preferred order is the rational one, and a legal system needs to settle disputes among those claims.' },
        { id: 'king', name: 'Martin Luther King Jr.', position: 0.7,
          capsule: 'One has a moral responsibility to disobey unjust laws — a law that degrades personality is out of harmony with the moral law.',
          challenge: 'Conscientious disobedience already concedes there was a law to break, which is the positivist point.' }
      ]
    },

    /* ---------- Philosophy of Progress ---------- */
    {
      id: 'pessimism-meliorism', branch: 'Philosophy of Progress',
      title: 'Pessimism vs Meliorism',
      left: 'Pessimism', right: 'Meliorism',
      question: 'Do deliberate efforts to improve things generally work?',
      summary: 'Not optimism about today but a judgement about direction: whether conditions can be improved by intention, or whether improvement is local and temporary.',
      tags: ['pessimism', 'meliorism', 'progress', 'hope', 'improvement', 'change', 'better'],
      arguments: [
        { id: 'benjamin', name: 'Walter Benjamin', position: -0.85,
          capsule: 'The angel of history sees one single catastrophe piling wreckage, while the storm we call progress drives him backwards into the future.',
          challenge: 'The wreckage is real and so is the anaesthetic. Both were produced by the same century.' },
        { id: 'schopenhauer-pess', name: 'Arthur Schopenhauer', position: -0.7,
          capsule: 'Satisfaction is only the brief absence of want. Effort rearranges suffering rather than reducing it.',
          challenge: 'Some sufferings have been abolished outright. That is not a rearrangement.' },
        { id: 'dewey', name: 'John Dewey', position: 0.85,
          capsule: 'Meliorism holds that specific conditions can be bettered by intelligent effort. It promises no destination, only that the work is not futile.',
          challenge: 'Intelligent effort produced the administrative machinery of the worst events of the modern era.' }
      ]
    },

    /* ---------- Political Philosophy ---------- */
    {
      id: 'individualism-collectivism', branch: 'Political Philosophy',
      title: 'Individualism vs Collectivism',
      left: 'Individualism', right: 'Collectivism',
      question: 'When your good and your community\'s good diverge, which has the prior claim?',
      summary: 'Whether the individual is the basic unit and groups are formed from individuals, or whether persons are constituted by the relations they stand in.',
      tags: ['individualism', 'collectivism', 'community', 'freedom', 'society', 'belonging', 'alone'],
      arguments: [
        { id: 'mill-ind', name: 'John Stuart Mill', position: -0.85,
          capsule: 'Over himself the individual is sovereign. Society may interfere only to prevent harm to others, and the majority is no better an authority for that.',
          challenge: 'The sovereign individual of your account was raised, fed and educated by others before ever exercising sovereignty.' },
        { id: 'nozick-ind', name: 'Robert Nozick', position: -0.7,
          capsule: 'There are only individual people with their own lives. Talk of the social good using one person for another treats him as a resource.',
          challenge: 'Entitlements are enforced by institutions that no individual could build, and those institutions have claims too.' },
        { id: 'ubuntu-arg', name: 'Ubuntu tradition', position: 0.85,
          capsule: 'Umuntu ngumuntu ngabantu — a person is a person through other persons. Personhood is an achievement conferred in relation, not a property carried into the room.',
          challenge: 'If persons are conferred by community, communities that withhold recognition define who counts, which is exactly the danger.' },
        { id: 'gyekye', name: 'Kwame Gyekye', position: 0.4,
          capsule: 'Moderate communitarianism: the person is intrinsically communal, yet holds rights the community cannot dissolve.',
          challenge: 'The moderate position must say which claims win when the two sides conflict, and that is the whole difficulty.' }
      ]
    },

    /* ---------- Global Ethics ---------- */
    {
      id: 'communitarianism-cosmopolitanism', branch: 'Global Ethics',
      title: 'Communitarianism vs Cosmopolitanism',
      left: 'Communitarianism', right: 'Cosmopolitanism',
      question: 'Do you owe more to the people near you than to strangers?',
      summary: 'Whether obligation radiates outward from particular attachments, or whether distance and kinship are morally arbitrary features of where you happened to be born.',
      tags: ['communitarianism', 'cosmopolitanism', 'duty', 'strangers', 'family', 'obligation', 'global'],
      arguments: [
        { id: 'macintyre', name: 'Alasdair MacIntyre', position: -0.85,
          capsule: 'I inherit from the past of my family, my city, my tribe a variety of debts and expectations. These constitute the given of my moral starting point.',
          challenge: 'Inherited debts have justified a great deal of harm to those outside the inheritance.' },
        { id: 'confucius-comm', name: 'Confucius', position: -0.6,
          capsule: 'Ren is cultivated in the concrete relations one is already inside — child, sibling, colleague — through li. Universal love without those forms is empty.',
          challenge: 'Graded concern reliably produces indifference at the outer edge, where the need is often greatest.' },
        { id: 'diogenes', name: 'Diogenes of Sinope', position: 0.8,
          capsule: 'Asked where he came from, he said: I am a citizen of the world. The city that claims you is an accident of birth.',
          challenge: 'A citizen of the world has no particular obligations, and it is particular obligations that actually get discharged.' },
        { id: 'appiah', name: 'Kwame Anthony Appiah', position: 0.5,
          capsule: 'Rooted cosmopolitanism: obligations to all, and a right to the partiality that makes a life one\'s own.',
          challenge: 'Naming both sides is not yet a rule for the cases where they conflict.' }
      ]
    },

    /* ---------- Human Nature ---------- */
    {
      id: 'essentialism-constructionism', branch: 'Human Nature',
      title: 'Essentialism vs Social Constructionism',
      left: 'Essentialism', right: 'Social Constructionism',
      question: 'Is there something you are underneath your circumstances?',
      summary: 'Whether human categories track a fixed nature or are produced and maintained by social practice. Constructed does not mean unreal — it means made, and therefore alterable.',
      tags: ['essentialism', 'constructionism', 'human nature', 'identity', 'gender', 'authentic', 'true self'],
      arguments: [
        { id: 'aristotle-ess', name: 'Aristotle', position: -0.85,
          capsule: 'A thing has a characteristic activity, and the good for it follows from that. Without a nature there is nothing for flourishing to be flourishing of.',
          challenge: 'Every historical account of human nature has ratified the arrangements of the society that produced it.' },
        { id: 'mencius', name: 'Mengzi', position: -0.5,
          capsule: 'The child at the well shows moral response as a native sprout. Cultivation is required, but there must be something to cultivate.',
          challenge: 'Sprouts that only grow in certain soils are hard to distinguish from the soil.' },
        { id: 'beauvoir-const', name: 'Simone de Beauvoir', position: 0.85,
          capsule: 'One is not born but becomes a woman. The category is made, and made real by being made — which is why it is so hard to argue with.',
          challenge: 'If the category is made, appeals to women\'s liberation need a subject that persists through the unmaking.' },
        { id: 'butler', name: 'Judith Butler', position: 0.9,
          capsule: 'Performativity: the repeated act produces the category it appears to express. There is no doer behind the deed.',
          challenge: 'Repetition needs something that repeats, and resistance needs someone who can refuse the script.' }
      ]
    },

    /* ---------- Human Motivation ---------- */
    {
      id: 'egoism-altruism', branch: 'Human Motivation',
      title: 'Psychological Egoism vs Altruism',
      left: 'Psychological Egoism', right: 'Altruism',
      question: 'When you help someone at real cost to yourself, what is actually moving you?',
      summary: 'Whether every motive reduces to self-interest under description, or whether concern for another can be a terminal motive rather than an instrument.',
      tags: ['egoism', 'altruism', 'selfish', 'kindness', 'care', 'motivation', 'sacrifice'],
      arguments: [
        { id: 'hobbes', name: 'Thomas Hobbes', position: -0.85,
          capsule: 'Pity is grief for the calamity of another arising from imagination of the like calamity befalling oneself. The reference is always back to the self.',
          challenge: 'Redescribing every motive as self-interested makes the claim unfalsifiable, which is a weakness rather than a strength.' },
        { id: 'butler-bishop', name: 'Joseph Butler', position: 0.75,
          capsule: 'That I take satisfaction in another\'s good presupposes that I wanted their good. The pleasure is evidence of the desire, not its object.',
          challenge: 'The satisfaction may still be what sustains the behaviour, whatever the logical order of the desire.' },
        { id: 'noddings', name: 'Nel Noddings', position: 0.85,
          capsule: 'The caring relation is the ethical primitive, not the autonomous chooser. And the one-caring must be sustained, or the relation collapses.',
          challenge: 'A relation that must sustain the carer has self-interest built into its foundation.' }
      ]
    },

    /* ---------- Environmental Ethics ---------- */
    {
      id: 'anthropocentrism-ecocentrism', branch: 'Environmental Ethics',
      title: 'Anthropocentrism vs Ecocentrism',
      left: 'Anthropocentrism', right: 'Ecocentrism',
      question: 'Would the loss of a forest matter if no person ever missed it?',
      summary: 'Whether value enters the world with valuers, or whether ecosystems and species hold standing independent of any use or appreciation.',
      tags: ['environment', 'nature', 'ecocentrism', 'anthropocentrism', 'animals', 'climate', 'living world'],
      arguments: [
        { id: 'kant-anthro', name: 'Immanuel Kant', position: -0.8,
          capsule: 'Only rational beings are ends in themselves. Duties regarding nature are indirect — they concern what cruelty does to the person who practises it.',
          challenge: 'Indirect duties give the wrong reason for the right act, and collapse when no witness is corrupted.' },
        { id: 'passmore', name: 'John Passmore', position: -0.5,
          capsule: 'Stewardship is enough. Human interests, taken over a long horizon and including descendants, already require protecting the biosphere.',
          challenge: 'A long horizon of human interest still permits eliminating anything with no eventual use to us.' },
        { id: 'leopold', name: 'Aldo Leopold', position: 0.85,
          capsule: 'A thing is right when it tends to preserve the integrity, stability and beauty of the biotic community. The land is a community to which we belong.',
          challenge: 'Integrity and stability describe no single state — ecosystems have always been in flux, including without us.' },
        { id: 'naess', name: 'Arne Næss', position: 0.9,
          capsule: 'Deep ecology: the flourishing of nonhuman life has value in itself, independent of its usefulness for human purposes.',
          challenge: 'Value in itself, with no valuer, is precisely the notion that needs an account.' }
      ]
    }
  ];

  /* ================= items =================
     Four per axis. Options carry signed deltas, usually on one axis.
     `problem` links an item to the pedagogical frame that bundles it. */

  const ITEMS = [

    /* ---------- Rationalism vs Empiricism ---------- */
    { id:'re-1', axisId:'rationalism-empiricism', problem:'knowledge',
      prompt:'You are convinced a plan will fail. Pressed for why, you find you cannot point to anything that happened — the conclusion came from thinking it through.',
      options:[
        { id:'a', label:'That is a real reason. Working it through is how you find out what follows.', deltas:[{ axisId:'rationalism-empiricism', delta:-0.8 }] },
        { id:'b', label:'Then you do not have a reason yet. Until something has happened, it is a hunch with a diagram.', deltas:[{ axisId:'rationalism-empiricism', delta:0.8 }] },
        { id:'c', label:'The reasoning is worth something, but only because past cases trained it.', deltas:[{ axisId:'rationalism-empiricism', delta:0.35 }] }
      ] },
    { id:'re-2', axisId:'rationalism-empiricism', problem:'knowledge',
      prompt:'A friend says they know their partner is lying, though every piece of evidence points the other way.',
      options:[
        { id:'a', label:'Evidence wins. A conviction that survives contrary evidence is about them, not their partner.', deltas:[{ axisId:'rationalism-empiricism', delta:0.85 }] },
        { id:'b', label:'They may be tracking something the evidence has not registered yet.', deltas:[{ axisId:'rationalism-empiricism', delta:-0.6 }] },
        { id:'c', label:'Both matter, but the feeling has to name what would change its mind.', deltas:[{ axisId:'rationalism-empiricism', delta:0.3 }, { axisId:'verificationism-falsificationism', delta:0.4 }] }
      ] },
    { id:'re-3', axisId:'rationalism-empiricism', problem:'knowledge',
      prompt:'Someone claims that two and two make four is a different kind of certainty from the sun rising tomorrow.',
      options:[
        { id:'a', label:'Yes — the first cannot fail, the second has only ever held so far.', deltas:[{ axisId:'rationalism-empiricism', delta:-0.7 }] },
        { id:'b', label:'No — both are habits of expectation, one just older and better drilled.', deltas:[{ axisId:'rationalism-empiricism', delta:0.75 }] },
        { id:'c', label:'The first is certain because we built the rules; that is not the same as being about the world.', deltas:[{ axisId:'rationalism-empiricism', delta:0.2 }, { axisId:'realism-nominalism', delta:0.4 }] }
      ] },
    { id:'re-4', axisId:'rationalism-empiricism', problem:'knowledge',
      prompt:'You are teaching someone a skill. They keep asking for the principle; you keep telling them to try it and watch what happens.',
      options:[
        { id:'a', label:'Give them the principle. Understanding first makes the practice intelligible.', deltas:[{ axisId:'rationalism-empiricism', delta:-0.7 }] },
        { id:'b', label:'Make them do it. The principle is a summary they will only understand afterwards.', deltas:[{ axisId:'rationalism-empiricism', delta:0.8 }] },
        { id:'c', label:'Some knowledge cannot be stated at all, only performed.', deltas:[{ axisId:'rationalism-empiricism', delta:0.5 }, { axisId:'internalism-externalism', delta:0.3 }] }
      ] },

    /* ---------- Skepticism vs Dogmatism ---------- */
    { id:'sd-1', axisId:'skepticism-dogmatism', problem:'knowledge',
      prompt:'In an argument you notice yourself saying "obviously" about the one claim you have never actually examined.',
      options:[
        { id:'a', label:'That is a warning. The word marks where an argument was replaced by a tone of voice.', deltas:[{ axisId:'skepticism-dogmatism', delta:-0.75 }] },
        { id:'b', label:'Some things really are obvious, and demanding a proof for each would end all conversation.', deltas:[{ axisId:'skepticism-dogmatism', delta:0.75 }] },
        { id:'c', label:'It depends whether anyone competent actually disputes it.', deltas:[{ axisId:'skepticism-dogmatism', delta:0.25 }] }
      ] },
    { id:'sd-2', axisId:'skepticism-dogmatism', problem:'knowledge',
      prompt:'A clever argument concludes that you cannot know you are not dreaming.',
      options:[
        { id:'a', label:'Follow it. If the argument is sound, the conclusion is where you live now.', deltas:[{ axisId:'skepticism-dogmatism', delta:-0.85 }] },
        { id:'b', label:'Here is one hand. My certainty about that is better grounded than the argument, so the argument goes.', deltas:[{ axisId:'skepticism-dogmatism', delta:0.8 }] },
        { id:'c', label:'Take it seriously in the study and ignore it in the street. Both are appropriate.', deltas:[{ axisId:'skepticism-dogmatism', delta:0.2 }] }
      ] },
    { id:'sd-3', axisId:'skepticism-dogmatism', problem:'knowledge',
      prompt:'You have held a political view for fifteen years and have never seriously constructed the case against it.',
      options:[
        { id:'a', label:'Then you do not hold it — it holds you. Build the other case before claiming the view.', deltas:[{ axisId:'skepticism-dogmatism', delta:-0.7 }] },
        { id:'b', label:'Fifteen years of living with a view is itself a kind of testing.', deltas:[{ axisId:'skepticism-dogmatism', delta:0.65 }] },
        { id:'c', label:'You need not rehearse the opposition to be entitled, but you should know it exists.', deltas:[{ axisId:'skepticism-dogmatism', delta:0.15 }] }
      ] },
    { id:'sd-4', axisId:'skepticism-dogmatism', problem:'knowledge',
      prompt:'Someone answers every question with "we can never really know".',
      options:[
        { id:'a', label:'That is honest about our situation, and most confident answers are worse.', deltas:[{ axisId:'skepticism-dogmatism', delta:-0.6 }] },
        { id:'b', label:'It is a way of never being wrong, which is not the same as being right.', deltas:[{ axisId:'skepticism-dogmatism', delta:0.7 }] },
        { id:'c', label:'Doubt has to be about something specific to be worth anything.', deltas:[{ axisId:'skepticism-dogmatism', delta:0.4 }] }
      ] },

    /* ---------- Foundationalism vs Coherentism ---------- */
    { id:'fc-1', axisId:'foundationalism-coherentism', problem:'knowledge',
      prompt:'A child asks why, and you answer, and they ask why again. Eventually you say: it just is.',
      options:[
        { id:'a', label:'You have hit bedrock. Some things are known without resting on anything else.', deltas:[{ axisId:'foundationalism-coherentism', delta:-0.8 }] },
        { id:'b', label:'You have run out of patience, not out of reasons. The chain closes into a web instead.', deltas:[{ axisId:'foundationalism-coherentism', delta:0.8 }] },
        { id:'c', label:'The stopping point is a habit of our practice, which is different from a foundation.', deltas:[{ axisId:'foundationalism-coherentism', delta:0.5 }] }
      ] },
    { id:'fc-2', axisId:'foundationalism-coherentism', problem:'knowledge',
      prompt:'An experiment contradicts a theory you have every other reason to trust.',
      options:[
        { id:'a', label:'The observation is basic. The theory must yield to it.', deltas:[{ axisId:'foundationalism-coherentism', delta:-0.7 }] },
        { id:'b', label:'Check the apparatus and the assumptions first. Any one claim can be saved by adjusting another.', deltas:[{ axisId:'foundationalism-coherentism', delta:0.8 }] },
        { id:'c', label:'Suspend both until a third result arrives.', deltas:[{ axisId:'foundationalism-coherentism', delta:0.2 }, { axisId:'skepticism-dogmatism', delta:-0.3 }] }
      ] },
    { id:'fc-3', axisId:'foundationalism-coherentism', problem:'knowledge',
      prompt:'You discover that a belief you built a lot on was learned from a single unreliable person.',
      options:[
        { id:'a', label:'Pull it out and see what falls. Anything resting on a bad foundation is suspect.', deltas:[{ axisId:'foundationalism-coherentism', delta:-0.65 }] },
        { id:'b', label:'It may hold anyway, supported by everything that grew up around it.', deltas:[{ axisId:'foundationalism-coherentism', delta:0.75 }] },
        { id:'c', label:'Source matters less than whether it still does honest work.', deltas:[{ axisId:'foundationalism-coherentism', delta:0.5 }] }
      ] },
    { id:'fc-4', axisId:'foundationalism-coherentism', problem:'knowledge',
      prompt:'Two accounts of your childhood are internally consistent, mutually incompatible, and equally well remembered.',
      options:[
        { id:'a', label:'One of them matches what happened. Consistency is not the test.', deltas:[{ axisId:'foundationalism-coherentism', delta:-0.7 }] },
        { id:'b', label:'With nothing outside the accounts to check against, coherence is the only test available.', deltas:[{ axisId:'foundationalism-coherentism', delta:0.7 }] },
        { id:'c', label:'Both are stages of a self that changed, not rival reports of one fact.', deltas:[{ axisId:'foundationalism-coherentism', delta:0.3 }, { axisId:'endurantism-perdurantism', delta:0.4 }] }
      ] },

    /* ---------- Internalism vs Externalism ---------- */
    { id:'ie-1', axisId:'internalism-externalism', problem:'mind',
      prompt:'Someone consistently reads a room correctly and cannot say how.',
      options:[
        { id:'a', label:'Without a reason available to them, they do not yet know — they are lucky.', deltas:[{ axisId:'internalism-externalism', delta:-0.8 }] },
        { id:'b', label:'The process is reliable, so they know. Being able to narrate it is a separate skill.', deltas:[{ axisId:'internalism-externalism', delta:0.85 }] },
        { id:'c', label:'They know in the way a practised body knows, which reflection would only disturb.', deltas:[{ axisId:'internalism-externalism', delta:0.5 }, { axisId:'dualism-physicalism', delta:0.3 }] }
      ] },
    { id:'ie-2', axisId:'internalism-externalism', problem:'mind',
      prompt:'You realise a belief you thought you had reasoned your way to was absorbed from the people around you.',
      options:[
        { id:'a', label:'Then it was never justified for you, whatever its accuracy.', deltas:[{ axisId:'internalism-externalism', delta:-0.7 }] },
        { id:'b', label:'If those people were reliable, the belief was in good standing all along.', deltas:[{ axisId:'internalism-externalism', delta:0.8 }] },
        { id:'c', label:'What you can no longer see is where the real work is happening.', deltas:[{ axisId:'internalism-externalism', delta:0.4 }, { axisId:'essentialism-constructionism', delta:0.3 }] }
      ] },
    { id:'ie-3', axisId:'internalism-externalism', problem:'mind',
      prompt:'You keep your calendar, your notes and half your memory in your phone.',
      options:[
        { id:'a', label:'Those are tools you consult. What you know is what is in your head.', deltas:[{ axisId:'internalism-externalism', delta:-0.75 }] },
        { id:'b', label:'The system that remembers includes the device. Where the boundary falls is a convention.', deltas:[{ axisId:'internalism-externalism', delta:0.85 }] },
        { id:'c', label:'It changes what you know how to do more than what you know.', deltas:[{ axisId:'internalism-externalism', delta:0.3 }] }
      ] },
    { id:'ie-4', axisId:'internalism-externalism', problem:'mind',
      prompt:'You are asked what you meant by a word and find you cannot fully say — though everyone understood you.',
      options:[
        { id:'a', label:'Then you did know your meaning, and the difficulty is only in reporting it.', deltas:[{ axisId:'internalism-externalism', delta:-0.6 }] },
        { id:'b', label:'The meaning was never only yours. It lives in the practice you were speaking inside.', deltas:[{ axisId:'internalism-externalism', delta:0.8 }, { axisId:'realism-nominalism', delta:0.3 }] },
        { id:'c', label:'You meant something vaguer than you assumed, and the room filled it in.', deltas:[{ axisId:'internalism-externalism', delta:0.35 }] }
      ] },

    /* ---------- Deontology vs Consequentialism ---------- */
    { id:'dc-1', axisId:'deontology-consequentialism', problem:'morality',
      prompt:'A small lie would spare three people real distress and cost nothing you can identify.',
      options:[
        { id:'a', label:'Do not lie. What makes it wrong is not the tally afterwards.', deltas:[{ axisId:'deontology-consequentialism', delta:-0.85 }] },
        { id:'b', label:'Tell it. Less suffering and no harm is the whole of the question.', deltas:[{ axisId:'deontology-consequentialism', delta:0.85 }] },
        { id:'c', label:'Honesty is a rule worth keeping precisely because the tally usually favours it.', deltas:[{ axisId:'deontology-consequentialism', delta:0.4 }] }
      ] },
    { id:'dc-2', axisId:'deontology-consequentialism', problem:'responsibility',
      prompt:'A hospital could save five patients by using one healthy person\'s organs. Everyone would be better off on the arithmetic.',
      options:[
        { id:'a', label:'Unthinkable. There are things not to be done however the sum comes out.', deltas:[{ axisId:'deontology-consequentialism', delta:-0.9 }] },
        { id:'b', label:'Horrifying, but the objection is about our squeamishness rather than the outcome.', deltas:[{ axisId:'deontology-consequentialism', delta:0.7 }] },
        { id:'c', label:'A society that permitted it would be worse off overall, so consequentialism forbids it too.', deltas:[{ axisId:'deontology-consequentialism', delta:0.35 }] }
      ] },
    { id:'dc-3', axisId:'deontology-consequentialism', problem:'living-world',
      prompt:'A policy would cut emissions sharply while putting a specific town out of work.',
      options:[
        { id:'a', label:'The town cannot simply be spent for the aggregate. They are owed something first.', deltas:[{ axisId:'deontology-consequentialism', delta:-0.6 }] },
        { id:'b', label:'If the totals are that lopsided, the policy is right and the town needs compensating.', deltas:[{ axisId:'deontology-consequentialism', delta:0.75 }] },
        { id:'c', label:'Whether it is right depends entirely on who was at the table when it was designed.', deltas:[{ axisId:'deontology-consequentialism', delta:0.1 }, { axisId:'individualism-collectivism', delta:0.4 }] }
      ] },
    { id:'dc-4', axisId:'deontology-consequentialism', problem:'morality',
      prompt:'You promised to help a friend move. That morning a stranger nearby needs help far more urgently.',
      options:[
        { id:'a', label:'The promise binds. That is what promising is.', deltas:[{ axisId:'deontology-consequentialism', delta:-0.75 }] },
        { id:'b', label:'Go where the need is greater and apologise afterwards.', deltas:[{ axisId:'deontology-consequentialism', delta:0.8 }] },
        { id:'c', label:'The relationship, not the rule or the sum, is what tells you where to be.', deltas:[{ axisId:'deontology-consequentialism', delta:-0.2 }, { axisId:'egoism-altruism', delta:0.4 }] }
      ] },

    /* ---------- Absolutism vs Relativism ---------- */
    { id:'ar-1', axisId:'absolutism-relativism', problem:'morality',
      prompt:'A practice you find clearly wrong is longstanding and widely endorsed somewhere else.',
      options:[
        { id:'a', label:'Then they are wrong. Endorsement is not what makes something right.', deltas:[{ axisId:'absolutism-relativism', delta:-0.85 }] },
        { id:'b', label:'You are applying a standard from your own form of life to theirs.', deltas:[{ axisId:'absolutism-relativism', delta:0.85 }] },
        { id:'c', label:'Judge, but expect the same scrutiny back, and answer it.', deltas:[{ axisId:'absolutism-relativism', delta:-0.25 }] }
      ] },
    { id:'ar-2', axisId:'absolutism-relativism', problem:'morality',
      prompt:'Your own culture reversed itself on a moral question within your lifetime.',
      options:[
        { id:'a', label:'That is moral progress — it moved closer to something that was always true.', deltas:[{ axisId:'absolutism-relativism', delta:-0.7 }] },
        { id:'b', label:'That is change, and reading it as progress assumes the destination.', deltas:[{ axisId:'absolutism-relativism', delta:0.7 }] },
        { id:'c', label:'The reformers were right before the culture agreed, which needs explaining either way.', deltas:[{ axisId:'absolutism-relativism', delta:-0.4 }] }
      ] },
    { id:'ar-3', axisId:'absolutism-relativism', problem:'person-people',
      prompt:'Two communities in one city hold incompatible views on how children should be raised.',
      options:[
        { id:'a', label:'One arrangement serves children better, and that is discoverable.', deltas:[{ axisId:'absolutism-relativism', delta:-0.7 }] },
        { id:'b', label:'Each is coherent within its own life, and neither needs the other\'s permission.', deltas:[{ axisId:'absolutism-relativism', delta:0.8 }] },
        { id:'c', label:'Tolerate broadly and draw one hard line at serious harm.', deltas:[{ axisId:'absolutism-relativism', delta:0.3 }] }
      ] },
    { id:'ar-4', axisId:'absolutism-relativism', problem:'beauty',
      prompt:'A critic says a work is objectively better than the one you love.',
      options:[
        { id:'a', label:'In art as in ethics there are standards, and training reveals them.', deltas:[{ axisId:'absolutism-relativism', delta:-0.5 }, { axisId:'aesthetic-objectivism-subjectivism', delta:-0.6 }] },
        { id:'b', label:'They are reporting a well-trained response, not a property of the work.', deltas:[{ axisId:'absolutism-relativism', delta:0.5 }, { axisId:'aesthetic-objectivism-subjectivism', delta:0.6 }] },
        { id:'c', label:'They may be right about craft and wrong about worth.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.2 }] }
      ] },

    /* ---------- Cognitivism vs Non-Cognitivism ---------- */
    { id:'cn-1', axisId:'cognitivism-noncognitivism', problem:'morality',
      prompt:'You say that what was done to that child was wrong.',
      options:[
        { id:'a', label:'That statement is true, in the way ordinary statements are true.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:-0.85 }] },
        { id:'b', label:'It expresses a refusal as deep as anything you have. But it is not a report.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:0.85 }] },
        { id:'c', label:'It behaves exactly like a truth claim, which may be all that being one requires.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:0.35 }] }
      ] },
    { id:'cn-2', axisId:'cognitivism-noncognitivism', problem:'morality',
      prompt:'Two people argue about a moral question for an hour and one changes their mind.',
      options:[
        { id:'a', label:'They were persuaded of something. That means there was something to get right.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:-0.7 }] },
        { id:'b', label:'Their attitudes were rearranged by argument, which attitudes can be.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:0.7 }] },
        { id:'c', label:'They found an inconsistency among commitments they already had.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:0.2 }, { axisId:'foundationalism-coherentism', delta:0.4 }] }
      ] },
    { id:'cn-3', axisId:'cognitivism-noncognitivism', problem:'morality',
      prompt:'You feel strongly that something is wrong and cannot construct any argument for it.',
      options:[
        { id:'a', label:'The feeling may be tracking a fact you have not articulated.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:-0.6 }] },
        { id:'b', label:'The feeling is the moral judgement. There was never a further fact underneath.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:0.8 }] },
        { id:'c', label:'A feeling is good evidence about you and weak evidence about the world.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:-0.3 }, { axisId:'skepticism-dogmatism', delta:-0.3 }] }
      ] },
    { id:'cn-4', axisId:'cognitivism-noncognitivism', problem:'morality',
      prompt:'Someone says moral facts would be strange additions to a world otherwise made of physics.',
      options:[
        { id:'a', label:'Strange, and still there. Not everything real is causal.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:-0.75 }, { axisId:'reductionism-emergentism', delta:0.3 }] },
        { id:'b', label:'Exactly. Which is why moral talk should be understood as doing something else.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:0.8 }] },
        { id:'c', label:'They are real the way institutions are real: made by us, and binding anyway.', deltas:[{ axisId:'cognitivism-noncognitivism', delta:0.3 }, { axisId:'essentialism-constructionism', delta:0.4 }] }
      ] },

    /* ---------- Free Will vs Determinism ---------- */
    { id:'fw-1', axisId:'free-will-determinism', problem:'responsibility',
      prompt:'A friend keeps returning to the same kind of relationship. Of the last one they say: I could not have done otherwise.',
      options:[
        { id:'a', label:'They could have left at any point. The pattern is a series of choices.', deltas:[{ axisId:'free-will-determinism', delta:-0.85 }] },
        { id:'b', label:'Given their history and what they wanted, that ending was already in motion.', deltas:[{ axisId:'free-will-determinism', delta:0.85 }] },
        { id:'c', label:'They chose freely, inside a set of options they did not choose.', deltas:[{ axisId:'free-will-determinism', delta:0.3 }] }
      ] },
    { id:'fw-2', axisId:'free-will-determinism', problem:'responsibility',
      prompt:'A man commits a crime. We learn about the upbringing, the injury, the sleepless months before.',
      options:[
        { id:'a', label:'Explanation is not excuse. He is the one who acted.', deltas:[{ axisId:'free-will-determinism', delta:-0.75 }] },
        { id:'b', label:'The more we learn, the less room is left for the choice we wanted to blame.', deltas:[{ axisId:'free-will-determinism', delta:0.8 }] },
        { id:'c', label:'Hold him responsible because holding people responsible works, not because he was uncaused.', deltas:[{ axisId:'free-will-determinism', delta:0.4 }, { axisId:'deontology-consequentialism', delta:0.4 }] }
      ] },
    { id:'fw-3', axisId:'free-will-determinism', problem:'time',
      prompt:'You are about to pick one of two restaurants. Someone says the outcome is already fixed by the state of your brain.',
      options:[
        { id:'a', label:'Nothing is fixed until I decide. That is what deciding is.', deltas:[{ axisId:'free-will-determinism', delta:-0.8 }] },
        { id:'b', label:'It is fixed, and the deliberation is how it feels from the inside.', deltas:[{ axisId:'free-will-determinism', delta:0.85 }] },
        { id:'c', label:'Fixed and mine are not opposites — the state of my brain is not something separate from me.', deltas:[{ axisId:'free-will-determinism', delta:0.35 }, { axisId:'dualism-physicalism', delta:0.4 }] }
      ] },
    { id:'fw-4', axisId:'free-will-determinism', problem:'responsibility',
      prompt:'You wanted to stop a habit for a year, then one morning you stopped.',
      options:[
        { id:'a', label:'That was an act of will. The year of failing does not change what finally happened.', deltas:[{ axisId:'free-will-determinism', delta:-0.7 }] },
        { id:'b', label:'Something shifted in the conditions and the behaviour followed. The willing was along for the ride.', deltas:[{ axisId:'free-will-determinism', delta:0.75 }] },
        { id:'c', label:'You finally wanted to want it, and that alignment is what freedom is.', deltas:[{ axisId:'free-will-determinism', delta:0.3 }] }
      ] },

    /* ---------- Idealism vs Materialism ---------- */
    { id:'im-1', axisId:'idealism-materialism', problem:'mind',
      prompt:'Every mind in the universe ends tonight. Ask what remains.',
      options:[
        { id:'a', label:'Nothing recognisable. Without perceivers there is no world in any sense we can mean.', deltas:[{ axisId:'idealism-materialism', delta:-0.85 }] },
        { id:'b', label:'Everything remains, minus the noticing. Matter never needed an audience.', deltas:[{ axisId:'idealism-materialism', delta:0.85 }] },
        { id:'c', label:'The question may be malformed: existing and being-for-someone are not cleanly separable.', deltas:[{ axisId:'idealism-materialism', delta:-0.3 }, { axisId:'realism-nominalism', delta:0.4 }] }
      ] },
    { id:'im-2', axisId:'idealism-materialism', problem:'mind',
      prompt:'You have a moment where the separation between you and everything else seems to drop away.',
      options:[
        { id:'a', label:'That was a moment of accuracy. The usual separateness is the partial reading.', deltas:[{ axisId:'idealism-materialism', delta:-0.7 }] },
        { id:'b', label:'That was a brain state, and it was beautiful, and it was a brain state.', deltas:[{ axisId:'idealism-materialism', delta:0.8 }] },
        { id:'c', label:'It says something true about connection and nothing about what things are made of.', deltas:[{ axisId:'idealism-materialism', delta:0.2 }] }
      ] },
    { id:'im-3', axisId:'idealism-materialism', problem:'science',
      prompt:'Physics describes the world in mathematics, with no mention of colour or sound as we know them.',
      options:[
        { id:'a', label:'Which suggests the qualities we actually live among belong to mind, not to matter.', deltas:[{ axisId:'idealism-materialism', delta:-0.7 }] },
        { id:'b', label:'Which suggests our senses give a useful cartoon of what physics describes properly.', deltas:[{ axisId:'idealism-materialism', delta:0.8 }, { axisId:'scientific-realism-instrumentalism', delta:-0.4 }] },
        { id:'c', label:'Which shows physics has a job, and it is not describing everything there is.', deltas:[{ axisId:'idealism-materialism', delta:-0.2 }, { axisId:'reductionism-emergentism', delta:0.5 }] }
      ] },
    { id:'im-4', axisId:'idealism-materialism', problem:'afterlife',
      prompt:'A person dies. Someone says the atoms disperse and that is the whole story.',
      options:[
        { id:'a', label:'The atoms were never the story. What dispersed was the least of it.', deltas:[{ axisId:'idealism-materialism', delta:-0.6 }, { axisId:'dualism-physicalism', delta:-0.5 }] },
        { id:'b', label:'That is the whole story, and it is enough to be worth grieving.', deltas:[{ axisId:'idealism-materialism', delta:0.8 }, { axisId:'dualism-physicalism', delta:0.5 }] },
        { id:'c', label:'What they were was a pattern, and patterns are not atoms.', deltas:[{ axisId:'idealism-materialism', delta:0.2 }, { axisId:'reductionism-emergentism', delta:0.5 }] }
      ] },

    /* ---------- Realism vs Nominalism ---------- */
    { id:'rn-1', axisId:'realism-nominalism', problem:'human-nature',
      prompt:'You call several very different acts courageous.',
      options:[
        { id:'a', label:'Because they share something real that the word names.', deltas:[{ axisId:'realism-nominalism', delta:-0.8 }] },
        { id:'b', label:'Because we group them usefully. The family resemblance is the whole of it.', deltas:[{ axisId:'realism-nominalism', delta:0.8 }] },
        { id:'c', label:'Survey the cases before demanding the essence. The list may be all there is.', deltas:[{ axisId:'realism-nominalism', delta:0.6 }] }
      ] },
    { id:'rn-2', axisId:'realism-nominalism', problem:'science',
      prompt:'Biologists disagree about where one species ends and another begins.',
      options:[
        { id:'a', label:'The boundary is out there and hard to find.', deltas:[{ axisId:'realism-nominalism', delta:-0.75 }] },
        { id:'b', label:'The boundary is a decision we make for reasons, and different reasons draw it differently.', deltas:[{ axisId:'realism-nominalism', delta:0.8 }] },
        { id:'c', label:'Nature has joints, and several places to cut between them.', deltas:[{ axisId:'realism-nominalism', delta:0.2 }] }
      ] },
    { id:'rn-3', axisId:'realism-nominalism', problem:'beauty',
      prompt:'Someone asks what all beautiful things have in common.',
      options:[
        { id:'a', label:'Something, or the word would not work as it does.', deltas:[{ axisId:'realism-nominalism', delta:-0.7 }, { axisId:'aesthetic-objectivism-subjectivism', delta:-0.5 }] },
        { id:'b', label:'Nothing but our calling them that, and the history of why we do.', deltas:[{ axisId:'realism-nominalism', delta:0.8 }, { axisId:'aesthetic-objectivism-subjectivism', delta:0.4 }] },
        { id:'c', label:'They hold us in a particular way. That is a fact about the encounter, not the object.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.6 }] }
      ] },
    { id:'rn-4', axisId:'realism-nominalism', problem:'morality',
      prompt:'A category you were raised with — a kind of person, a kind of work — turns out to have been invented in the last century.',
      options:[
        { id:'a', label:'Recently named, but it was tracking something that was already there.', deltas:[{ axisId:'realism-nominalism', delta:-0.6 }] },
        { id:'b', label:'It was made, and then it became real by being used.', deltas:[{ axisId:'realism-nominalism', delta:0.75 }, { axisId:'essentialism-constructionism', delta:0.6 }] },
        { id:'c', label:'Invented categories can still be the best available description.', deltas:[{ axisId:'realism-nominalism', delta:0.3 }] }
      ] },

    /* ---------- Reductionism vs Emergentism ---------- */
    { id:'rm-1', axisId:'reductionism-emergentism', problem:'mind',
      prompt:'Someone offers to explain your grief entirely in terms of neurotransmitters.',
      options:[
        { id:'a', label:'That is the underlying account. Everything else is a convenient summary.', deltas:[{ axisId:'reductionism-emergentism', delta:-0.8 }] },
        { id:'b', label:'That is a description of the substrate and misses what grief is about.', deltas:[{ axisId:'reductionism-emergentism', delta:0.8 }] },
        { id:'c', label:'Both accounts are complete for different questions.', deltas:[{ axisId:'reductionism-emergentism', delta:0.3 }] }
      ] },
    { id:'rm-2', axisId:'reductionism-emergentism', problem:'science',
      prompt:'A crowd behaves in a way no individual in it intended or would recognise.',
      options:[
        { id:'a', label:'It is still only individuals acting. The crowd is a way of talking.', deltas:[{ axisId:'reductionism-emergentism', delta:-0.75 }, { axisId:'individualism-collectivism', delta:-0.4 }] },
        { id:'b', label:'The crowd has properties none of its members have. That is a real level.', deltas:[{ axisId:'reductionism-emergentism', delta:0.85 }, { axisId:'individualism-collectivism', delta:0.4 }] },
        { id:'c', label:'It is individuals, arranged — and the arrangement does explanatory work.', deltas:[{ axisId:'reductionism-emergentism', delta:0.35 }] }
      ] },
    { id:'rm-3', axisId:'reductionism-emergentism', problem:'responsibility',
      prompt:'If a full physical account of a decision existed, would anything be missing?',
      options:[
        { id:'a', label:'No. Nothing is left over once the physics is in.', deltas:[{ axisId:'reductionism-emergentism', delta:-0.85 }, { axisId:'free-will-determinism', delta:0.4 }] },
        { id:'b', label:'Yes — the reasons, which are not a further physical fact.', deltas:[{ axisId:'reductionism-emergentism', delta:0.8 }] },
        { id:'c', label:'Nothing is missing from the world, and something is missing from the explanation.', deltas:[{ axisId:'reductionism-emergentism', delta:0.4 }] }
      ] },
    { id:'rm-4', axisId:'reductionism-emergentism', problem:'living-world',
      prompt:'An ecosystem recovers in a way no study of its species predicted.',
      options:[
        { id:'a', label:'The prediction failed because the models were coarse, not because ecosystems are special.', deltas:[{ axisId:'reductionism-emergentism', delta:-0.7 }] },
        { id:'b', label:'Systems at that scale have behaviour that species-level accounts cannot contain.', deltas:[{ axisId:'reductionism-emergentism', delta:0.8 }, { axisId:'anthropocentrism-ecocentrism', delta:0.3 }] },
        { id:'c', label:'More is different, and we keep having to learn it again.', deltas:[{ axisId:'reductionism-emergentism', delta:0.6 }] }
      ] },

    /* ---------- Nihilism vs Existentialism ---------- */
    { id:'ne-1', axisId:'nihilism-existentialism', problem:'meaning',
      prompt:'Someone says their life has meaning because of their family and their work.',
      options:[
        { id:'a', label:'They have named what they care about, which is what meaning was ever going to be.', deltas:[{ axisId:'nihilism-existentialism', delta:0.85 }] },
        { id:'b', label:'They have named comforts. Neither would matter to a universe that will erase both.', deltas:[{ axisId:'nihilism-existentialism', delta:-0.85 }] },
        { id:'c', label:'Meaning like that is real while it lasts, and it does not last.', deltas:[{ axisId:'nihilism-existentialism', delta:-0.25 }] }
      ] },
    { id:'ne-2', axisId:'nihilism-existentialism', problem:'meaning',
      prompt:'On a bad night the whole structure of your life looks arbitrary.',
      options:[
        { id:'a', label:'That is clarity, and the daylight version is the anaesthetic.', deltas:[{ axisId:'nihilism-existentialism', delta:-0.8 }] },
        { id:'b', label:'Arbitrary in origin, chosen now. That is the only kind of foundation available.', deltas:[{ axisId:'nihilism-existentialism', delta:0.85 }] },
        { id:'c', label:'The view from that far out is not more accurate, only colder.', deltas:[{ axisId:'nihilism-existentialism', delta:0.4 }] }
      ] },
    { id:'ne-3', axisId:'nihilism-existentialism', problem:'afterlife',
      prompt:'You are told with certainty that nothing follows death.',
      options:[
        { id:'a', label:'Then this is the whole of it, which makes it matter more rather than less.', deltas:[{ axisId:'nihilism-existentialism', delta:0.8 }] },
        { id:'b', label:'Then the projects were always going to end in the same silence.', deltas:[{ axisId:'nihilism-existentialism', delta:-0.8 }] },
        { id:'c', label:'It changes nothing about today, which was never justified by what comes after.', deltas:[{ axisId:'nihilism-existentialism', delta:0.4 }, { axisId:'theism-atheism', delta:0.4 }] }
      ] },
    { id:'ne-4', axisId:'nihilism-existentialism', problem:'meaning',
      prompt:'A person in a genuinely constrained life describes their days as meaningful.',
      options:[
        { id:'a', label:'Meaning can be found in any situation, including the ones nobody would choose.', deltas:[{ axisId:'nihilism-existentialism', delta:0.85 }] },
        { id:'b', label:'If it can be found anywhere at all, it is being supplied rather than found.', deltas:[{ axisId:'nihilism-existentialism', delta:-0.7 }] },
        { id:'c', label:'They are right about their life, and their being right is not a general result.', deltas:[{ axisId:'nihilism-existentialism', delta:0.3 }, { axisId:'absolutism-relativism', delta:0.3 }] }
      ] },

    /* ---------- Dualism vs Physicalism ---------- */
    { id:'dp-1', axisId:'dualism-physicalism', problem:'mind',
      prompt:'A machine one day reports being in pain, consistently and unprompted.',
      options:[
        { id:'a', label:'Reporting is not having. Something is missing that no behaviour would supply.', deltas:[{ axisId:'dualism-physicalism', delta:-0.8 }] },
        { id:'b', label:'If the organisation is right, there is nothing further to withhold.', deltas:[{ axisId:'dualism-physicalism', delta:0.85 }] },
        { id:'c', label:'We would have no way to tell, which is itself the interesting part.', deltas:[{ axisId:'dualism-physicalism', delta:-0.25 }, { axisId:'internalism-externalism', delta:-0.3 }] }
      ] },
    { id:'dp-2', axisId:'dualism-physicalism', problem:'mind',
      prompt:'Someone knows every physical fact about seeing red but has never seen it.',
      options:[
        { id:'a', label:'They would learn something new on first seeing it, so the physical facts were not all of them.', deltas:[{ axisId:'dualism-physicalism', delta:-0.7 }] },
        { id:'b', label:'They would gain an ability, not a fact. Nothing was left out of the world.', deltas:[{ axisId:'dualism-physicalism', delta:0.8 }] },
        { id:'c', label:'The thought experiment is too strange to settle anything.', deltas:[{ axisId:'dualism-physicalism', delta:0.2 }, { axisId:'skepticism-dogmatism', delta:-0.3 }] }
      ] },
    { id:'dp-3', axisId:'dualism-physicalism', problem:'afterlife',
      prompt:'A friend hopes to see a dead parent again.',
      options:[
        { id:'a', label:'That hope requires a person who is not identical to a body, and there may be one.', deltas:[{ axisId:'dualism-physicalism', delta:-0.85 }, { axisId:'theism-atheism', delta:-0.4 }] },
        { id:'b', label:'The person was the living body. There is no one left to meet.', deltas:[{ axisId:'dualism-physicalism', delta:0.85 }, { axisId:'theism-atheism', delta:0.4 }] },
        { id:'c', label:'What continues is what they made of the people around them.', deltas:[{ axisId:'dualism-physicalism', delta:0.4 }, { axisId:'individualism-collectivism', delta:0.4 }] }
      ] },
    { id:'dp-4', axisId:'dualism-physicalism', problem:'mind',
      prompt:'Exhaustion changes what you believe about your own life. In the morning the beliefs change back.',
      options:[
        { id:'a', label:'The body interfered with a judgement that belongs to the mind.', deltas:[{ axisId:'dualism-physicalism', delta:-0.7 }] },
        { id:'b', label:'The judgement was a state of the body throughout. There was no separate court.', deltas:[{ axisId:'dualism-physicalism', delta:0.85 }] },
        { id:'c', label:'The tiredness was a way of understanding your situation, not noise over it.', deltas:[{ axisId:'dualism-physicalism', delta:0.5 }, { axisId:'internalism-externalism', delta:0.3 }] }
      ] },

    /* ---------- Theism vs Atheism ---------- */
    { id:'ta-1', axisId:'theism-atheism', problem:'afterlife',
      prompt:'Asked why there is anything at all, someone answers: there just is.',
      options:[
        { id:'a', label:'That is where explanation stops, and stopping there is arbitrary.', deltas:[{ axisId:'theism-atheism', delta:-0.8 }] },
        { id:'b', label:'That is where explanation stops, and adding a being does not move it.', deltas:[{ axisId:'theism-atheism', delta:0.8 }] },
        { id:'c', label:'The question may not be the kind that has an answer.', deltas:[{ axisId:'theism-atheism', delta:0.3 }, { axisId:'verificationism-falsificationism', delta:-0.3 }] }
      ] },
    { id:'ta-2', axisId:'theism-atheism', problem:'meaning',
      prompt:'A child dies for no reason anyone can identify.',
      options:[
        { id:'a', label:'There may be a reason not available to us, and holding that is not dishonest.', deltas:[{ axisId:'theism-atheism', delta:-0.7 }] },
        { id:'b', label:'Any harmony purchased at that price is one I return.', deltas:[{ axisId:'theism-atheism', delta:0.85 }, { axisId:'pessimism-meliorism', delta:-0.3 }] },
        { id:'c', label:'I am not looking for a reason but for a way to hold it that does not need one.', deltas:[{ axisId:'theism-atheism', delta:0.3 }, { axisId:'nihilism-existentialism', delta:0.4 }] }
      ] },
    { id:'ta-3', axisId:'theism-atheism', problem:'meaning',
      prompt:'You find yourself moved in a way you would call reverence, without believing anything in particular.',
      options:[
        { id:'a', label:'That response is tracking something real that the beliefs were trying to name.', deltas:[{ axisId:'theism-atheism', delta:-0.6 }] },
        { id:'b', label:'It is a human capacity that needs no object beyond the world.', deltas:[{ axisId:'theism-atheism', delta:0.7 }] },
        { id:'c', label:'It is the most interesting evidence available and it settles nothing.', deltas:[{ axisId:'theism-atheism', delta:0.2 }, { axisId:'skepticism-dogmatism', delta:-0.4 }] }
      ] },
    { id:'ta-4', axisId:'theism-atheism', problem:'afterlife',
      prompt:'Someone argues you should believe because of what is at stake if you are wrong.',
      options:[
        { id:'a', label:'Under real uncertainty, asymmetric stakes are a legitimate consideration.', deltas:[{ axisId:'theism-atheism', delta:-0.5 }] },
        { id:'b', label:'Belief adopted for its payoff is not belief in the thing.', deltas:[{ axisId:'theism-atheism', delta:0.5 }, { axisId:'cognitivism-noncognitivism', delta:-0.3 }] },
        { id:'c', label:'You cannot decide to believe something by wanting the consequences.', deltas:[{ axisId:'theism-atheism', delta:0.3 }, { axisId:'free-will-determinism', delta:0.3 }] }
      ] },

    /* ---------- Scientific Realism vs Instrumentalism ---------- */
    { id:'sr-1', axisId:'scientific-realism-instrumentalism', problem:'science',
      prompt:'A model predicts beautifully using an entity nobody has ever observed.',
      options:[
        { id:'a', label:'The prediction is evidence that the entity is there.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:-0.85 }] },
        { id:'b', label:'The prediction is evidence that the model works. Those are different claims.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:0.85 }] },
        { id:'c', label:'Believe it works; hold the ontology loosely until something forces it.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:0.5 }] }
      ] },
    { id:'sr-2', axisId:'scientific-realism-instrumentalism', problem:'science',
      prompt:'The ether was central to successful physics and turned out not to exist.',
      options:[
        { id:'a', label:'Which shows science self-corrects toward what is really there.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:-0.6 }] },
        { id:'b', label:'Which shows success does not license belief in the machinery.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:0.85 }] },
        { id:'c', label:'Which shows the mathematical structure survived while the picture did not.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:0.3 }] }
      ] },
    { id:'sr-3', axisId:'scientific-realism-instrumentalism', problem:'science',
      prompt:'Two incompatible models are used side by side because each works in its own domain.',
      options:[
        { id:'a', label:'A sign that neither is finished. Only one can describe what is there.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:-0.7 }, { axisId:'classical-paraconsistent', delta:-0.4 }] },
        { id:'b', label:'Entirely normal. Models are instruments, and instruments have ranges.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:0.8 }, { axisId:'classical-paraconsistent', delta:0.4 }] },
        { id:'c', label:'Working inside an inconsistency is a skill, not a scandal.', deltas:[{ axisId:'classical-paraconsistent', delta:0.7 }] }
      ] },
    { id:'sr-4', axisId:'scientific-realism-instrumentalism', problem:'science',
      prompt:'A statistical model of human behaviour predicts well and explains nothing.',
      options:[
        { id:'a', label:'Then it is incomplete. Prediction without mechanism is not understanding.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:-0.7 }] },
        { id:'b', label:'Then it is doing the job. Understanding was an extra we wanted, not a requirement.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:0.8 }] },
        { id:'c', label:'Useful and dangerous: it will be read as explanation whatever we say.', deltas:[{ axisId:'scientific-realism-instrumentalism', delta:0.3 }, { axisId:'essentialism-constructionism', delta:0.3 }] }
      ] },

    /* ---------- Verificationism vs Falsificationism ---------- */
    { id:'vf-1', axisId:'verificationism-falsificationism', problem:'science',
      prompt:'A theory of personality explains every outcome after the fact.',
      options:[
        { id:'a', label:'The trouble is that nothing could confirm it specifically — it is compatible with everything.', deltas:[{ axisId:'verificationism-falsificationism', delta:-0.6 }] },
        { id:'b', label:'The trouble is that nothing could refute it. Name the observation that would.', deltas:[{ axisId:'verificationism-falsificationism', delta:0.85 }] },
        { id:'c', label:'It may be a useful vocabulary that was never a theory.', deltas:[{ axisId:'verificationism-falsificationism', delta:0.3 }, { axisId:'scientific-realism-instrumentalism', delta:0.4 }] }
      ] },
    { id:'vf-2', axisId:'verificationism-falsificationism', problem:'knowledge',
      prompt:'Someone asks what would change your mind, and you cannot answer.',
      options:[
        { id:'a', label:'A serious problem. A belief immune to refutation is not doing the work you think.', deltas:[{ axisId:'verificationism-falsificationism', delta:0.85 }] },
        { id:'b', label:'Some commitments are the hinges the doubt turns on, not claims within it.', deltas:[{ axisId:'verificationism-falsificationism', delta:-0.5 }, { axisId:'foundationalism-coherentism', delta:-0.4 }] },
        { id:'c', label:'It shows the belief needs restating as something checkable.', deltas:[{ axisId:'verificationism-falsificationism', delta:-0.3 }] }
      ] },
    { id:'vf-3', axisId:'verificationism-falsificationism', problem:'science',
      prompt:'A prediction fails. The researchers keep the theory and revise an assumption instead.',
      options:[
        { id:'a', label:'Evasion. A failed prediction should count against the theory.', deltas:[{ axisId:'verificationism-falsificationism', delta:0.7 }] },
        { id:'b', label:'Ordinary practice. No observation ever refutes one claim on its own.', deltas:[{ axisId:'verificationism-falsificationism', delta:-0.4 }, { axisId:'foundationalism-coherentism', delta:0.6 }] },
        { id:'c', label:'Legitimate once; a habit of it is how a field goes bad.', deltas:[{ axisId:'verificationism-falsificationism', delta:0.4 }] }
      ] },
    { id:'vf-4', axisId:'verificationism-falsificationism', problem:'knowledge',
      prompt:'A claim can neither be confirmed nor refuted by any possible observation.',
      options:[
        { id:'a', label:'Then nothing is being said. Meaning runs out with verification.', deltas:[{ axisId:'verificationism-falsificationism', delta:-0.85 }] },
        { id:'b', label:'Then it is not science, which is not the same as being meaningless.', deltas:[{ axisId:'verificationism-falsificationism', delta:0.8 }] },
        { id:'c', label:'Much of what matters most sits there, and we should say so plainly.', deltas:[{ axisId:'verificationism-falsificationism', delta:0.4 }, { axisId:'cognitivism-noncognitivism', delta:0.3 }] }
      ] },

    /* ---------- Classical vs Paraconsistent Logic ---------- */
    { id:'cp-1', axisId:'classical-paraconsistent', problem:'time',
      prompt:'You believe you should leave a job and that you should stay, and both feel fully supported.',
      options:[
        { id:'a', label:'One of them is false. The work is finding out which.', deltas:[{ axisId:'classical-paraconsistent', delta:-0.8 }] },
        { id:'b', label:'They can both hold. Living inside the tension is not a logical failure.', deltas:[{ axisId:'classical-paraconsistent', delta:0.85 }] },
        { id:'c', label:'They are true of different moments, and naming which dissolves it.', deltas:[{ axisId:'classical-paraconsistent', delta:-0.2 }, { axisId:'presentism-eternalism', delta:-0.3 }] }
      ] },
    { id:'cp-2', axisId:'classical-paraconsistent', problem:'knowledge',
      prompt:'A body of belief you rely on is shown to contain a contradiction somewhere.',
      options:[
        { id:'a', label:'Everything in it is now unsafe until the contradiction is located.', deltas:[{ axisId:'classical-paraconsistent', delta:-0.75 }] },
        { id:'b', label:'You go on using the parts that work. A contradiction does not spread to everything.', deltas:[{ axisId:'classical-paraconsistent', delta:0.85 }] },
        { id:'c', label:'Quarantine the area and carry on. That is what everyone actually does.', deltas:[{ axisId:'classical-paraconsistent', delta:0.6 }] }
      ] },
    { id:'cp-3', axisId:'classical-paraconsistent', problem:'time',
      prompt:'Someone says being torn is the honest state and resolving it too early is the mistake.',
      options:[
        { id:'a', label:'Being torn is a stage. The point is still to get through it to a view.', deltas:[{ axisId:'classical-paraconsistent', delta:-0.6 }, { axisId:'skepticism-dogmatism', delta:0.3 }] },
        { id:'b', label:'Aporia is where inquiry starts, and the dialogues that end there are the honest ones.', deltas:[{ axisId:'classical-paraconsistent', delta:0.6 }, { axisId:'skepticism-dogmatism', delta:-0.4 }] },
        { id:'c', label:'Contradiction drives thought upward rather than destroying it.', deltas:[{ axisId:'classical-paraconsistent', delta:0.7 }] }
      ] },
    { id:'cp-4', axisId:'classical-paraconsistent', problem:'morality',
      prompt:'Two obligations you accept cannot both be met tonight.',
      options:[
        { id:'a', label:'Then one of them was not a real obligation.', deltas:[{ axisId:'classical-paraconsistent', delta:-0.7 }, { axisId:'deontology-consequentialism', delta:-0.3 }] },
        { id:'b', label:'Both are real, you will fail one, and the failure is not a mistake in reasoning.', deltas:[{ axisId:'classical-paraconsistent', delta:0.8 }] },
        { id:'c', label:'Weigh them and act. The remainder is regret, not incoherence.', deltas:[{ axisId:'classical-paraconsistent', delta:0.2 }, { axisId:'deontology-consequentialism', delta:0.4 }] }
      ] },

    /* ---------- Presentism vs Eternalism ---------- */
    { id:'pe-1', axisId:'presentism-eternalism', problem:'time',
      prompt:'A hard year is over. You catch yourself thinking: thank goodness that is past.',
      options:[
        { id:'a', label:'The relief makes sense because the year is genuinely gone. Only now exists.', deltas:[{ axisId:'presentism-eternalism', delta:-0.85 }] },
        { id:'b', label:'The year is as real as this moment. Your relief is about where you are, not what exists.', deltas:[{ axisId:'presentism-eternalism', delta:0.85 }] },
        { id:'c', label:'It exists as something that happened, which is a real status and not the present one.', deltas:[{ axisId:'presentism-eternalism', delta:0.3 }] }
      ] },
    { id:'pe-2', axisId:'presentism-eternalism', problem:'time',
      prompt:'You are asked whether a person who died is still someone or merely was someone.',
      options:[
        { id:'a', label:'Was. That is the whole grief.', deltas:[{ axisId:'presentism-eternalism', delta:-0.8 }] },
        { id:'b', label:'Is, at their time. Nothing that happened is undone by no longer happening.', deltas:[{ axisId:'presentism-eternalism', delta:0.8 }] },
        { id:'c', label:'Both, and the equivocation is where the comfort lives.', deltas:[{ axisId:'presentism-eternalism', delta:0.2 }] }
      ] },
    { id:'pe-3', axisId:'presentism-eternalism', problem:'time',
      prompt:'Physics finds no privileged present moment anywhere in its equations.',
      options:[
        { id:'a', label:'Then physics is leaving out the most obvious feature of existence.', deltas:[{ axisId:'presentism-eternalism', delta:-0.75 }, { axisId:'scientific-realism-instrumentalism', delta:0.4 }] },
        { id:'b', label:'Then passage is how a four-dimensional structure looks from inside it.', deltas:[{ axisId:'presentism-eternalism', delta:0.85 }, { axisId:'scientific-realism-instrumentalism', delta:-0.4 }] },
        { id:'c', label:'Then two true descriptions have not been reconciled yet.', deltas:[{ axisId:'presentism-eternalism', delta:0.2 }, { axisId:'reductionism-emergentism', delta:0.4 }] }
      ] },
    { id:'pe-4', axisId:'presentism-eternalism', problem:'responsibility',
      prompt:'You are told the future is as fixed as the past.',
      options:[
        { id:'a', label:'It cannot be. Nothing is there yet to be fixed.', deltas:[{ axisId:'presentism-eternalism', delta:-0.8 }, { axisId:'free-will-determinism', delta:-0.4 }] },
        { id:'b', label:'It is, and my deliberating is part of what makes it what it is.', deltas:[{ axisId:'presentism-eternalism', delta:0.8 }, { axisId:'free-will-determinism', delta:0.4 }] },
        { id:'c', label:'Fixed is not the same as known, and living forward is unaffected.', deltas:[{ axisId:'presentism-eternalism', delta:0.4 }] }
      ] },

    /* ---------- Endurantism vs Perdurantism ---------- */
    { id:'ep-1', axisId:'endurantism-perdurantism', problem:'time',
      prompt:'You look at a photograph of yourself at six.',
      options:[
        { id:'a', label:'That is me, wholly present then and wholly present now.', deltas:[{ axisId:'endurantism-perdurantism', delta:-0.8 }] },
        { id:'b', label:'That is an earlier part of one long thing I am also a part of.', deltas:[{ axisId:'endurantism-perdurantism', delta:0.85 }] },
        { id:'c', label:'Connected by memory and little else, which may be enough or may not.', deltas:[{ axisId:'endurantism-perdurantism', delta:0.4 }] }
      ] },
    { id:'ep-2', axisId:'endurantism-perdurantism', problem:'time',
      prompt:'Every plank of a ship has been replaced one at a time.',
      options:[
        { id:'a', label:'Same ship. Continuity of the thing survives replacement of the stuff.', deltas:[{ axisId:'endurantism-perdurantism', delta:-0.7 }] },
        { id:'b', label:'A sequence of ship-stages we find it convenient to call one ship.', deltas:[{ axisId:'endurantism-perdurantism', delta:0.8 }, { axisId:'realism-nominalism', delta:0.4 }] },
        { id:'c', label:'The question has no answer because "same" was never that precise.', deltas:[{ axisId:'endurantism-perdurantism', delta:0.4 }, { axisId:'realism-nominalism', delta:0.5 }] }
      ] },
    { id:'ep-3', axisId:'endurantism-perdurantism', problem:'responsibility',
      prompt:'Someone is held to account for something done twenty years ago.',
      options:[
        { id:'a', label:'Rightly. It is the same person, and time does not dilute that.', deltas:[{ axisId:'endurantism-perdurantism', delta:-0.75 }] },
        { id:'b', label:'The connection has thinned. Responsibility should thin with it.', deltas:[{ axisId:'endurantism-perdurantism', delta:0.8 }] },
        { id:'c', label:'We hold them because the practice requires a continuous person, whether or not metaphysics supplies one.', deltas:[{ axisId:'endurantism-perdurantism', delta:0.3 }, { axisId:'essentialism-constructionism', delta:0.4 }] }
      ] },
    { id:'ep-4', axisId:'endurantism-perdurantism', problem:'human-nature',
      prompt:'A friend says they are simply not the person they were before an illness.',
      options:[
        { id:'a', label:'Figuratively. They changed a great deal and remained themselves.', deltas:[{ axisId:'endurantism-perdurantism', delta:-0.7 }, { axisId:'essentialism-constructionism', delta:-0.3 }] },
        { id:'b', label:'Literally enough. What matters is continuity, and it broke.', deltas:[{ axisId:'endurantism-perdurantism', delta:0.8 }] },
        { id:'c', label:'There was never a fixed self for the illness to interrupt.', deltas:[{ axisId:'endurantism-perdurantism', delta:0.5 }, { axisId:'essentialism-constructionism', delta:0.5 }] }
      ] },

    /* ---------- Aesthetic Objectivism vs Subjectivism ---------- */
    { id:'ao-1', axisId:'aesthetic-objectivism-subjectivism', problem:'beauty',
      prompt:'You love a song that a musician you respect says is badly made.',
      options:[
        { id:'a', label:'They may be right, and my liking it does not make it good.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:-0.8 }] },
        { id:'b', label:'They are describing their trained response. Mine is not less real.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.8 }] },
        { id:'c', label:'Craft can be assessed; whether it is worth hearing cannot.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.4 }] }
      ] },
    { id:'ao-2', axisId:'aesthetic-objectivism-subjectivism', problem:'beauty',
      prompt:'A landscape strikes you as beautiful and you assume anyone standing there would agree.',
      options:[
        { id:'a', label:'Because they would. The beauty is in what is in front of you.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:-0.75 }] },
        { id:'b', label:'You are demanding agreement you cannot back with a reason, and doing it anyway.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:-0.1 }] },
        { id:'c', label:'They might not, and the assumption says more about you than the valley.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.8 }] }
      ] },
    { id:'ao-3', axisId:'aesthetic-objectivism-subjectivism', problem:'beauty',
      prompt:'What people find beautiful has changed enormously across centuries.',
      options:[
        { id:'a', label:'Fashions changed. What is actually good outlasts them, which is why some works survive.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:-0.7 }] },
        { id:'b', label:'The variation is the evidence. Beauty is in the beholder, and beholders are made by their era.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.85 }, { axisId:'essentialism-constructionism', delta:0.4 }] },
        { id:'c', label:'Categories like mono no aware are culture-bound and philosophically serious at once.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.45 }, { axisId:'absolutism-relativism', delta:0.4 }] }
      ] },
    { id:'ao-4', axisId:'aesthetic-objectivism-subjectivism', problem:'beauty',
      prompt:'A thing is moving to you precisely because it will not last.',
      options:[
        { id:'a', label:'Then the impermanence is a real feature contributing to its worth.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:-0.4 }, { axisId:'realism-nominalism', delta:-0.3 }] },
        { id:'b', label:'Then the worth is in the encounter between a mortal thing and a mortal viewer.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.7 }] },
        { id:'c', label:'The sadness is not a flaw in the experience but the part that makes it worth having.', deltas:[{ axisId:'aesthetic-objectivism-subjectivism', delta:0.3 }, { axisId:'nihilism-existentialism', delta:0.3 }] }
      ] },

    /* ---------- Legal Positivism vs Natural Law ---------- */
    { id:'lp-1', axisId:'legal-positivism-natural-law', problem:'person-people',
      prompt:'A law is properly enacted by a legitimate body and is grossly unjust.',
      options:[
        { id:'a', label:'It is law, and it should be disobeyed and repealed. Calling it invalid muddles the criticism.', deltas:[{ axisId:'legal-positivism-natural-law', delta:-0.85 }] },
        { id:'b', label:'It is not law in the full sense. Authority that violates the moral order forfeits it.', deltas:[{ axisId:'legal-positivism-natural-law', delta:0.85 }] },
        { id:'c', label:'It binds officials and not consciences, which is a real distinction.', deltas:[{ axisId:'legal-positivism-natural-law', delta:0.3 }] }
      ] },
    { id:'lp-2', axisId:'legal-positivism-natural-law', problem:'person-people',
      prompt:'A judge must apply a rule they believe to be wrong.',
      options:[
        { id:'a', label:'Apply it and say publicly that it is wrong. That is the office.', deltas:[{ axisId:'legal-positivism-natural-law', delta:-0.75 }] },
        { id:'b', label:'Refuse. A judge is not a mechanism, and the rule was never binding.', deltas:[{ axisId:'legal-positivism-natural-law', delta:0.8 }] },
        { id:'c', label:'Read it as narrowly as the text honestly allows.', deltas:[{ axisId:'legal-positivism-natural-law', delta:0.35 }] }
      ] },
    { id:'lp-3', axisId:'legal-positivism-natural-law', problem:'morality',
      prompt:'Someone defends a practice on the grounds that it is legal.',
      options:[
        { id:'a', label:'Legal settles what the state will do, and nothing about whether it is right.', deltas:[{ axisId:'legal-positivism-natural-law', delta:-0.6 }] },
        { id:'b', label:'A legal system that permits it has already failed as law.', deltas:[{ axisId:'legal-positivism-natural-law', delta:0.75 }] },
        { id:'c', label:'Legality carries some moral weight, because settled rules are themselves a good.', deltas:[{ axisId:'legal-positivism-natural-law', delta:0.2 }] }
      ] },
    { id:'lp-4', axisId:'legal-positivism-natural-law', problem:'living-world',
      prompt:'A river is granted legal personhood.',
      options:[
        { id:'a', label:'A useful fiction. Personhood is whatever the rules say it is.', deltas:[{ axisId:'legal-positivism-natural-law', delta:-0.7 }, { axisId:'realism-nominalism', delta:0.4 }] },
        { id:'b', label:'The law catching up to standing the river already had.', deltas:[{ axisId:'legal-positivism-natural-law', delta:0.8 }, { axisId:'anthropocentrism-ecocentrism', delta:0.6 }] },
        { id:'c', label:'A device for protecting human interests in the river.', deltas:[{ axisId:'legal-positivism-natural-law', delta:-0.3 }, { axisId:'anthropocentrism-ecocentrism', delta:-0.6 }] }
      ] },

    /* ---------- Pessimism vs Meliorism ---------- */
    { id:'pm-1', axisId:'pessimism-meliorism', problem:'meaning',
      prompt:'A problem you worked on for years is a little better and not solved.',
      options:[
        { id:'a', label:'Which is what effort mostly buys: rearrangement, not repair.', deltas:[{ axisId:'pessimism-meliorism', delta:-0.75 }] },
        { id:'b', label:'A little better is the shape all real improvement takes.', deltas:[{ axisId:'pessimism-meliorism', delta:0.85 }] },
        { id:'c', label:'Depends entirely on whether the gain holds when you stop.', deltas:[{ axisId:'pessimism-meliorism', delta:0.2 }] }
      ] },
    { id:'pm-2', axisId:'pessimism-meliorism', problem:'living-world',
      prompt:'Asked whether things are getting better, you consider the last two centuries.',
      options:[
        { id:'a', label:'One catastrophe piling wreckage, with better anaesthetic.', deltas:[{ axisId:'pessimism-meliorism', delta:-0.85 }] },
        { id:'b', label:'Specific conditions were bettered by intelligent effort, and that is the only claim needed.', deltas:[{ axisId:'pessimism-meliorism', delta:0.85 }] },
        { id:'c', label:'Both, and which you see depends on which axis you measure.', deltas:[{ axisId:'pessimism-meliorism', delta:0.2 }, { axisId:'absolutism-relativism', delta:0.3 }] }
      ] },
    { id:'pm-3', axisId:'pessimism-meliorism', problem:'meaning',
      prompt:'Satisfaction after getting something you wanted lasts about a week.',
      options:[
        { id:'a', label:'As it always does. Satisfaction is the brief absence of want.', deltas:[{ axisId:'pessimism-meliorism', delta:-0.8 }] },
        { id:'b', label:'Then aim at activity rather than acquisition. The mistake was in the target.', deltas:[{ axisId:'pessimism-meliorism', delta:0.7 }, { axisId:'nihilism-existentialism', delta:0.4 }] },
        { id:'c', label:'Each time you return to this, ask what you expected to be different.', deltas:[{ axisId:'pessimism-meliorism', delta:-0.2 }] }
      ] },
    { id:'pm-4', axisId:'pessimism-meliorism', problem:'person-people',
      prompt:'A reform reduces one harm and creates a new administrative one.',
      options:[
        { id:'a', label:'Typical. Interventions relocate harm and add machinery.', deltas:[{ axisId:'pessimism-meliorism', delta:-0.7 }] },
        { id:'b', label:'Net better, so do it and then fix the new problem.', deltas:[{ axisId:'pessimism-meliorism', delta:0.8 }, { axisId:'deontology-consequentialism', delta:0.4 }] },
        { id:'c', label:'Worth doing only if the people carrying the new burden agreed to it.', deltas:[{ axisId:'pessimism-meliorism', delta:0.3 }, { axisId:'deontology-consequentialism', delta:-0.4 }] }
      ] },

    /* ---------- Individualism vs Collectivism ---------- */
    { id:'ic-1', axisId:'individualism-collectivism', problem:'person-people',
      prompt:'A career move is right for you and costly for the people who depend on you.',
      options:[
        { id:'a', label:'It is your life. Over yourself you are sovereign.', deltas:[{ axisId:'individualism-collectivism', delta:-0.85 }] },
        { id:'b', label:'You are partly made of those dependencies. Discounting them subtracts from you too.', deltas:[{ axisId:'individualism-collectivism', delta:0.85 }] },
        { id:'c', label:'Go, and carry the obligations with you rather than discharging them.', deltas:[{ axisId:'individualism-collectivism', delta:0.3 }] }
      ] },
    { id:'ic-2', axisId:'individualism-collectivism', problem:'person-people',
      prompt:'A group asks a member to hold back for the sake of the whole.',
      options:[
        { id:'a', label:'The group cannot spend a person for its own benefit.', deltas:[{ axisId:'individualism-collectivism', delta:-0.8 }, { axisId:'deontology-consequentialism', delta:-0.3 }] },
        { id:'b', label:'Reasonable. The group is not an aggregate of strangers but the medium they live in.', deltas:[{ axisId:'individualism-collectivism', delta:0.85 }] },
        { id:'c', label:'Communal by nature, and holding rights the group cannot dissolve.', deltas:[{ axisId:'individualism-collectivism', delta:0.4 }] }
      ] },
    { id:'ic-3', axisId:'individualism-collectivism', problem:'human-nature',
      prompt:'You describe a long stretch of loneliness.',
      options:[
        { id:'a', label:'Painful, and it does not make you less of a person.', deltas:[{ axisId:'individualism-collectivism', delta:-0.7 }] },
        { id:'b', label:'A person is a person through other persons, so it is a subtraction from what you are.', deltas:[{ axisId:'individualism-collectivism', delta:0.85 }] },
        { id:'c', label:'Solitude and isolation are different, and only one of them costs you something.', deltas:[{ axisId:'individualism-collectivism', delta:-0.2 }] }
      ] },
    { id:'ic-4', axisId:'individualism-collectivism', problem:'person-people',
      prompt:'A benefit is proposed that would go to everyone, funded by everyone.',
      options:[
        { id:'a', label:'Ask first what it takes from particular people who did not consent.', deltas:[{ axisId:'individualism-collectivism', delta:-0.75 }] },
        { id:'b', label:'Ask what kind of common life it makes possible.', deltas:[{ axisId:'individualism-collectivism', delta:0.8 }] },
        { id:'c', label:'Ask whether you would endorse it not knowing your position in it.', deltas:[{ axisId:'individualism-collectivism', delta:0.3 }, { axisId:'communitarianism-cosmopolitanism', delta:0.4 }] }
      ] },

    /* ---------- Communitarianism vs Cosmopolitanism ---------- */
    { id:'cc-1', axisId:'communitarianism-cosmopolitanism', problem:'person-people',
      prompt:'The same money would help your neighbour a little or a stranger abroad a great deal.',
      options:[
        { id:'a', label:'The neighbour. Proximity and relationship are not moral noise.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:-0.85 }] },
        { id:'b', label:'The stranger. Where someone was born is arbitrary from a moral point of view.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:0.85 }] },
        { id:'c', label:'Obligations to all, and a right to the partiality that makes a life your own.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:0.45 }] }
      ] },
    { id:'cc-2', axisId:'communitarianism-cosmopolitanism', problem:'person-people',
      prompt:'You inherit debts and expectations from a family and a place you did not choose.',
      options:[
        { id:'a', label:'That inheritance is where your moral life actually starts.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:-0.8 }, { axisId:'essentialism-constructionism', delta:-0.2 }] },
        { id:'b', label:'An accident of birth, and no accident generates obligations.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:0.8 }] },
        { id:'c', label:'Go back and fetch what is worth carrying, and leave the rest.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:-0.2 }] }
      ] },
    { id:'cc-3', axisId:'communitarianism-cosmopolitanism', problem:'living-world',
      prompt:'A climate measure costs your country and benefits people elsewhere and later.',
      options:[
        { id:'a', label:'Governments answer to the people who authorised them.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:-0.75 }] },
        { id:'b', label:'The atmosphere does not recognise the border, and neither should the accounting.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:0.85 }, { axisId:'anthropocentrism-ecocentrism', delta:0.3 }] },
        { id:'c', label:'Do it, and be honest that a specific group is being asked to pay.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:0.4 }] }
      ] },
    { id:'cc-4', axisId:'communitarianism-cosmopolitanism', problem:'morality',
      prompt:'You feel far more for a local story than for a distant catastrophe a thousand times larger.',
      options:[
        { id:'a', label:'As you should. Moral life is built out of the particular.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:-0.7 }] },
        { id:'b', label:'A limitation to correct, not a principle to follow.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:0.8 }] },
        { id:'c', label:'Feeling is a bad guide to obligation in either direction.', deltas:[{ axisId:'communitarianism-cosmopolitanism', delta:0.3 }, { axisId:'cognitivism-noncognitivism', delta:-0.3 }] }
      ] },

    /* ---------- Essentialism vs Constructionism ---------- */
    { id:'ec-1', axisId:'essentialism-constructionism', problem:'human-nature',
      prompt:'You say you are looking for your real self underneath the roles.',
      options:[
        { id:'a', label:'There is one, and the roles obscure it.', deltas:[{ axisId:'essentialism-constructionism', delta:-0.85 }] },
        { id:'b', label:'There is no self underneath — only the one being assembled by acting.', deltas:[{ axisId:'essentialism-constructionism', delta:0.85 }] },
        { id:'c', label:'Something native is being cultivated, and the cultivation is not optional.', deltas:[{ axisId:'essentialism-constructionism', delta:-0.4 }] }
      ] },
    { id:'ec-2', axisId:'essentialism-constructionism', problem:'human-nature',
      prompt:'Someone explains a social arrangement by appeal to human nature.',
      options:[
        { id:'a', label:'Often correct. There is a nature, and arrangements that ignore it fail.', deltas:[{ axisId:'essentialism-constructionism', delta:-0.8 }] },
        { id:'b', label:'Every account of human nature has ratified the society that produced it.', deltas:[{ axisId:'essentialism-constructionism', delta:0.85 }] },
        { id:'c', label:'Grant the description entirely. It still yields no conclusion about what should be.', deltas:[{ axisId:'essentialism-constructionism', delta:0.3 }, { axisId:'cognitivism-noncognitivism', delta:-0.3 }] }
      ] },
    { id:'ec-3', axisId:'essentialism-constructionism', problem:'human-nature',
      prompt:'A category applied to you feels both imposed from outside and completely real.',
      options:[
        { id:'a', label:'Real because it names something you actually are.', deltas:[{ axisId:'essentialism-constructionism', delta:-0.7 }] },
        { id:'b', label:'Made, and made real by being made — which is what makes it hard to argue with.', deltas:[{ axisId:'essentialism-constructionism', delta:0.85 }] },
        { id:'c', label:'The repetition produces the category it appears to express.', deltas:[{ axisId:'essentialism-constructionism', delta:0.9 }] }
      ] },
    { id:'ec-4', axisId:'essentialism-constructionism', problem:'morality',
      prompt:'A trait you disliked in yourself for years turns out to be something you learned at eleven.',
      options:[
        { id:'a', label:'Learned or not, it is now part of your character.', deltas:[{ axisId:'essentialism-constructionism', delta:-0.5 }] },
        { id:'b', label:'Made means alterable, which is the good news in constructionism.', deltas:[{ axisId:'essentialism-constructionism', delta:0.8 }, { axisId:'pessimism-meliorism', delta:0.4 }] },
        { id:'c', label:'You become what you repeatedly do, so the work is in the doing.', deltas:[{ axisId:'essentialism-constructionism', delta:0.3 }, { axisId:'free-will-determinism', delta:-0.4 }] }
      ] },

    /* ---------- Egoism vs Altruism ---------- */
    { id:'ea-1', axisId:'egoism-altruism', problem:'human-nature',
      prompt:'You help someone at real cost and feel good afterwards.',
      options:[
        { id:'a', label:'The feeling was the point, whether or not you noticed.', deltas:[{ axisId:'egoism-altruism', delta:-0.85 }] },
        { id:'b', label:'The feeling came because you wanted their good. It is evidence of the desire, not its object.', deltas:[{ axisId:'egoism-altruism', delta:0.85 }] },
        { id:'c', label:'Both are true and the question may not be answerable from inside.', deltas:[{ axisId:'egoism-altruism', delta:0.2 }, { axisId:'internalism-externalism', delta:0.3 }] }
      ] },
    { id:'ea-2', axisId:'egoism-altruism', problem:'human-nature',
      prompt:'Someone insists every act is ultimately self-interested.',
      options:[
        { id:'a', label:'Broadly right, and the honesty is worth more than the flattery.', deltas:[{ axisId:'egoism-altruism', delta:-0.8 }] },
        { id:'b', label:'Unfalsifiable. A claim no evidence could touch is not a discovery.', deltas:[{ axisId:'egoism-altruism', delta:0.7 }, { axisId:'verificationism-falsificationism', delta:0.5 }] },
        { id:'c', label:'True of motives and useless for deciding what to do.', deltas:[{ axisId:'egoism-altruism', delta:0.2 }] }
      ] },
    { id:'ea-3', axisId:'egoism-altruism', problem:'responsibility',
      prompt:'A carer is exhausted and keeps going because nobody else will.',
      options:[
        { id:'a', label:'They are getting something from being the one who does it.', deltas:[{ axisId:'egoism-altruism', delta:-0.6 }] },
        { id:'b', label:'The relation is the ethical primitive here, and the one caring must also be sustained.', deltas:[{ axisId:'egoism-altruism', delta:0.85 }, { axisId:'deontology-consequentialism', delta:-0.2 }] },
        { id:'c', label:'Any framework that leaves no room for the carer\'s needs is the wrong framework.', deltas:[{ axisId:'egoism-altruism', delta:0.5 }] }
      ] },
    { id:'ea-4', axisId:'egoism-altruism', problem:'living-world',
      prompt:'Someone gives anonymously, at cost, with no possibility of recognition.',
      options:[
        { id:'a', label:'They still get the private satisfaction, which is the mechanism.', deltas:[{ axisId:'egoism-altruism', delta:-0.7 }] },
        { id:'b', label:'This is the case egoism cannot describe without straining.', deltas:[{ axisId:'egoism-altruism', delta:0.85 }] },
        { id:'c', label:'You have a right to the action, never to its fruits — recognition was never part of it.', deltas:[{ axisId:'egoism-altruism', delta:0.5 }, { axisId:'deontology-consequentialism', delta:-0.4 }] }
      ] },

    /* ---------- Anthropocentrism vs Ecocentrism ---------- */
    { id:'ae-1', axisId:'anthropocentrism-ecocentrism', problem:'living-world',
      prompt:'A forest would be lost, and no person would ever notice or need it.',
      options:[
        { id:'a', label:'Then nothing of value was lost. Value arrives with valuers.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:-0.85 }] },
        { id:'b', label:'Something of value was lost regardless of any witness.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:0.85 }] },
        { id:'c', label:'Value with no valuer is exactly the notion that needs explaining.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:-0.4 }, { axisId:'realism-nominalism', delta:0.3 }] }
      ] },
    { id:'ae-2', axisId:'anthropocentrism-ecocentrism', problem:'living-world',
      prompt:'A conservation plan protects a species with no use to anyone.',
      options:[
        { id:'a', label:'Justify it by long-horizon human interest, or not at all.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:-0.7 }] },
        { id:'b', label:'Its flourishing has value in itself. No further justification is owed.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:0.85 }] },
        { id:'c', label:'Right when it preserves the integrity of the community we belong to.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:0.6 }, { axisId:'individualism-collectivism', delta:0.3 }] }
      ] },
    { id:'ae-3', axisId:'anthropocentrism-ecocentrism', problem:'living-world',
      prompt:'Cruelty to an animal with no owner and no witness.',
      options:[
        { id:'a', label:'Wrong because of what it does to the person who practises it.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:-0.8 }] },
        { id:'b', label:'Wrong because of what it does to the animal, which is the whole of it.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:0.85 }] },
        { id:'c', label:'Wrong on both counts, and the second is the reason that carries.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:0.5 }] }
      ] },
    { id:'ae-4', axisId:'anthropocentrism-ecocentrism', problem:'living-world',
      prompt:'A river valley must flood a town or a wetland.',
      options:[
        { id:'a', label:'The town. People come first and it is not close.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:-0.8 }] },
        { id:'b', label:'A genuine conflict of standing, not a calculation with an obvious winner.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:0.7 }] },
        { id:'c', label:'The wetland, if what we owe the living world is anything more than sentiment.', deltas:[{ axisId:'anthropocentrism-ecocentrism', delta:0.85 }] }
      ] }
  ];

  /* ================= problems =================
     A pedagogical frame that bundles items across related axes.
     Completing one problem therefore moves more than one spectrum. */

  const PROBLEMS = [
    { id:'afterlife', title:'What is the afterlife?',
      briefing:'The question is rarely only about survival. It carries assumptions about what a person is, and about whether the universe is the kind of thing that keeps anything.',
      tags:['afterlife','death','soul','dying','heaven','eternity'] },
    { id:'meaning', title:'Is life inherently meaningful?',
      briefing:'Whether meaning is found, made, or a category error applied from too far outside. Everyone answers this in practice long before they answer it in words.',
      tags:['meaning','purpose','pointless','nihilism','absurd','why bother'] },
    { id:'knowledge', title:'How much can we actually know?',
      briefing:'Where justification comes from, where it stops, and whether you can tell from the inside that you have any.',
      tags:['knowledge','certainty','doubt','evidence','proof','justification'] },
    { id:'morality', title:'Is morality discovered or invented?',
      briefing:'Whether moral claims are the kind of thing that can be true, whether they hold across borders, and what makes an act wrong.',
      tags:['morality','ethics','right','wrong','values','culture'] },
    { id:'responsibility', title:'Are we responsible for what we do?',
      briefing:'Freedom, causation, and blame. Every account of responsibility takes a position on what a decision is.',
      tags:['responsibility','blame','free will','choice','guilt','regret'] },
    { id:'mind', title:'What is a mind?',
      briefing:'Whether experience is a second kind of thing, whether the parts explain the whole, and whether knowing is something you can see yourself doing.',
      tags:['mind','consciousness','brain','experience','self','thinking'] },
    { id:'person-people', title:'Who comes first — the person or the people?',
      briefing:'Whether the individual is the basic unit, how far obligation travels, and what makes a law binding.',
      tags:['community','individual','society','law','obligation','belonging'] },
    { id:'science', title:'What does science tell us about reality?',
      briefing:'Whether our best theories are pictures or instruments, and what makes a claim testable at all.',
      tags:['science','theory','evidence','models','physics','research'] },
    { id:'time', title:'Does time pass?',
      briefing:'Whether the past is gone, whether the future is fixed, and whether you are one thing over time or a series of them.',
      tags:['time','past','future','memory','change','persistence'] },
    { id:'beauty', title:'Is beauty real?',
      briefing:'Whether taste can be mistaken, and whether the categories we judge with are found or made.',
      tags:['beauty','art','taste','aesthetics','beautiful','music'] },
    { id:'living-world', title:'What do we owe the living world?',
      briefing:'Whether value requires a valuer, how to weigh a specific cost against a diffuse benefit, and whether improvement is possible at all.',
      tags:['nature','environment','climate','animals','forest','earth'] },
    { id:'human-nature', title:'Is there a human nature?',
      briefing:'Whether there is something you are underneath your circumstances, and what moves people when they act well.',
      tags:['human nature','identity','self','character','motivation','selfish'] }
  ];

  /* ================= the bridge to the live reader =================
     Which axes a Palinode concept is in the NEIGHBOURHOOD of, and the
     direction the passage tends to lean when that concept surfaces.

     These leans are for display only. They are labelled tentative in the
     UI and never enter the standing profile — that is what items are for.
     `note` is the one line the tab shows under the tentative tick.      */

  const CONCEPT_AXES = {
    eudaimonia: [
      { id:'essentialism-constructionism', lean:-0.5, note:'Reaching for flourishing assumes there is something a human characteristically is.' },
      { id:'nihilism-existentialism', lean:0.3, note:'The passage treats a life as the kind of thing that can go well.' }
    ],
    virtue: [
      { id:'essentialism-constructionism', lean:-0.3, note:'Character is being treated as something with a grain to work along.' },
      { id:'free-will-determinism', lean:-0.35, note:'Habit-building assumes you can act on what you will become.' }
    ],
    'stoic-control': [
      { id:'free-will-determinism', lean:0.6, note:'Most of what matters here is described as outside your decision.' }
    ],
    'amor-fati': [
      { id:'free-will-determinism', lean:0.4, note:'Regret takes the chain that produced you as fixed.' },
      { id:'pessimism-meliorism', lean:0.3, note:'Affirming what happened is a stance about direction, not only mood.' }
    ],
    recurrence: [
      { id:'presentism-eternalism', lean:0.4, note:'A repeating day is being treated as something that stands.' },
      { id:'nihilism-existentialism', lean:0.3, note:'The test is whether you would choose this life as it is.' }
    ],
    dukkha: [
      { id:'realism-nominalism', lean:0.45, note:'The grip assumes a fixed essence the passage is questioning.' },
      { id:'endurantism-perdurantism', lean:0.3, note:'What is held still is being described as already in motion.' }
    ],
    anatta: [
      { id:'essentialism-constructionism', lean:0.45, note:'A self is being searched for rather than assembled.' },
      { id:'endurantism-perdurantism', lean:0.5, note:'Identity here looks like aggregates in sequence.' },
      { id:'dualism-physicalism', lean:0.35, note:'No separate perceiver is turning up under inspection.' }
    ],
    'bad-faith': [
      { id:'free-will-determinism', lean:-0.8, note:'"I had to" is being read as a decision in disguise.' }
    ],
    angst: [
      { id:'nihilism-existentialism', lean:0.4, note:'The dread has no object, which is the dizziness of open choice.' }
    ],
    'being-toward-death': [
      { id:'nihilism-existentialism', lean:0.4, note:'Mortality is being used to sort what actually matters.' },
      { id:'theism-atheism', lean:0.3, note:'The end is treated as an end rather than a passage.' }
    ],
    absurd: [
      { id:'nihilism-existentialism', lean:-0.5, note:'The passage is asking the universe for meaning and hearing silence.' }
    ],
    ren: [
      { id:'individualism-collectivism', lean:0.6, note:'You are described from inside relations rather than before them.' },
      { id:'communitarianism-cosmopolitanism', lean:-0.5, note:'Obligation here radiates from particular attachments.' },
      { id:'deontology-consequentialism', lean:-0.3, note:'The duty is treated as belonging to the role, not the outcome.' }
    ],
    wuwei: [
      { id:'free-will-determinism', lean:0.4, note:'Effort against the grain is being described as the problem.' },
      { id:'pessimism-meliorism', lean:-0.3, note:'Striving is treated as often self-defeating.' }
    ],
    ubuntu: [
      { id:'individualism-collectivism', lean:0.7, note:'Personhood is being conferred in relation rather than carried in.' },
      { id:'egoism-altruism', lean:0.4, note:'Another\'s good appears here as part of your own.' },
      { id:'communitarianism-cosmopolitanism', lean:-0.4, note:'The people who make you a person are particular ones.' }
    ],
    sankofa: [
      { id:'communitarianism-cosmopolitanism', lean:-0.35, note:'The past being retrieved is a specific inheritance.' },
      { id:'presentism-eternalism', lean:0.3, note:'What is behind you is treated as still available.' }
    ],
    'karma-dharma': [
      { id:'free-will-determinism', lean:0.5, note:'The order of things is doing the arranging here.' },
      { id:'theism-atheism', lean:-0.4, note:'Events are described as answering to something.' },
      { id:'legal-positivism-natural-law', lean:0.4, note:'Duty is derived from a rational order rather than a rule.' }
    ],
    maya: [
      { id:'idealism-materialism', lean:-0.7, note:'Multiplicity is being read as a partial appearance.' },
      { id:'realism-nominalism', lean:0.4, note:'The separateness of things is treated as superimposed.' }
    ],
    fana: [
      { id:'theism-atheism', lean:-0.5, note:'Surrender here has something to surrender to.' },
      { id:'egoism-altruism', lean:0.3, note:'The self\'s insistence is what is being set aside.' }
    ],
    'impermanence-aesthetic': [
      { id:'aesthetic-objectivism-subjectivism', lean:0.35, note:'The beauty is in the encounter with something passing.' },
      { id:'endurantism-perdurantism', lean:0.3, note:'What moves you is described as not staying.' }
    ],
    'categorical-imperative': [
      { id:'deontology-consequentialism', lean:-0.8, note:'A universal rule is being issued without reference to outcome.' },
      { id:'absolutism-relativism', lean:-0.5, note:'The rule is stated as binding on everyone.' }
    ],
    'utilitarian-calculus': [
      { id:'deontology-consequentialism', lean:0.8, note:'The passage is summing outcomes.' }
    ],
    'veil-of-ignorance': [
      { id:'communitarianism-cosmopolitanism', lean:0.4, note:'Position and birth are being treated as morally arbitrary.' },
      { id:'deontology-consequentialism', lean:-0.3, note:'Fairness of procedure is doing the work, not the total.' }
    ],
    recognition: [
      { id:'individualism-collectivism', lean:0.4, note:'Your standing is described as granted by another.' },
      { id:'essentialism-constructionism', lean:0.4, note:'Who you are is being settled in the social encounter.' }
    ],
    ressentiment: [
      { id:'egoism-altruism', lean:-0.4, note:'The judgement takes its bearings from what another has.' },
      { id:'pessimism-meliorism', lean:-0.3, note:'The reactive stance forecloses acting on it.' }
    ],
    panopticon: [
      { id:'essentialism-constructionism', lean:0.5, note:'You are described as produced by being watched.' },
      { id:'free-will-determinism', lean:0.4, note:'The observer is doing the deciding in this passage.' }
    ],
    alienation: [
      { id:'essentialism-constructionism', lean:-0.3, note:'The complaint assumes an activity that would be recognisably yours.' },
      { id:'pessimism-meliorism', lean:0.3, note:'The conditions are described as alterable.' },
      { id:'individualism-collectivism', lean:0.3, note:'The estrangement is from others as much as from work.' }
    ],
    'care-ethics': [
      { id:'egoism-altruism', lean:0.6, note:'The relation, not the chooser, is the unit here.' },
      { id:'individualism-collectivism', lean:0.5, note:'Responsibility is described as running through dependence.' }
    ],
    'situated-freedom': [
      { id:'essentialism-constructionism', lean:0.8, note:'The category is being described as made, and real because made.' },
      { id:'free-will-determinism', lean:0.3, note:'Freedom appears here as situated rather than absolute.' }
    ],
    'double-consciousness': [
      { id:'essentialism-constructionism', lean:0.5, note:'The self is doubled by how it is seen.' },
      { id:'internalism-externalism', lean:0.4, note:'The outside view is credited with knowing something.' }
    ],
    'levinas-other': [
      { id:'egoism-altruism', lean:0.5, note:'The other issues a claim prior to your reasoning about them.' },
      { id:'deontology-consequentialism', lean:-0.4, note:'The obligation is not being calculated.' }
    ],
    'epistemic-humility': [
      { id:'skepticism-dogmatism', lean:-0.7, note:'The passage marks the limits of what it claims to know.' }
    ],
    falsifiability: [
      { id:'verificationism-falsificationism', lean:0.65, note:'Evidence is being asked to be able to cut both ways.' },
      { id:'scientific-realism-instrumentalism', lean:0.3, note:'Standing is tied to testability rather than picture.' }
    ],
    doxa: [
      { id:'skepticism-dogmatism', lean:0.4, note:'A belief is being held as simply the way things are.' },
      { id:'essentialism-constructionism', lean:0.4, note:'What goes without saying was put there by someone.' }
    ],
    phenomenology: [
      { id:'internalism-externalism', lean:-0.5, note:'The description is staying inside what is available to you.' },
      { id:'idealism-materialism', lean:-0.3, note:'The experience is being described before the world is ruled on.' }
    ],
    embodiment: [
      { id:'dualism-physicalism', lean:0.5, note:'The body is understanding the situation, not reporting to a mind.' },
      { id:'reductionism-emergentism', lean:0.35, note:'Knowing is described at the level of the whole animal.' }
    ],
    flow: [
      { id:'internalism-externalism', lean:-0.3, note:'Attention is being examined from the inside.' }
    ],
    'ship-of-theseus': [
      { id:'endurantism-perdurantism', lean:0.5, note:'A self is being described as persisting through replacement.' },
      { id:'realism-nominalism', lean:0.3, note:'Whether it is the "same" turns on how we use the word.' }
    ],
    determinism: [
      { id:'free-will-determinism', lean:0.3, note:'The passage is working the free-will question directly, from both sides.' }
    ],
    theodicy: [
      { id:'theism-atheism', lean:0.4, note:'Suffering is being asked to answer to something.' },
      { id:'pessimism-meliorism', lean:-0.4, note:'The harm is described as unredeemed.' }
    ],
    'language-games': [
      { id:'realism-nominalism', lean:0.6, note:'Meaning is being located in use rather than essence.' },
      { id:'cognitivism-noncognitivism', lean:0.35, note:'What a word does is treated as prior to what it names.' }
    ],
    aporia: [
      { id:'classical-paraconsistent', lean:0.5, note:'Two positions are being held at once without collapse.' },
      { id:'skepticism-dogmatism', lean:-0.4, note:'Judgement is being suspended on purpose.' }
    ],
    telos: [
      { id:'essentialism-constructionism', lean:-0.4, note:'The goal is being asked what it is ultimately for.' },
      { id:'nihilism-existentialism', lean:0.3, note:'Ends are treated as something a life can have.' }
    ],
    samsara: [
      { id:'free-will-determinism', lean:0.4, note:'The loop is described as turning by itself.' },
      { id:'pessimism-meliorism', lean:-0.3, note:'Effort inside the pattern is treated as no exit.' }
    ]
  };

  /* Tensions, stance markers and contested terms lean too — the
     constraint/agency contradiction in particular is the reader's most
     direct contact with the free-will axis. Keyed by insight key. */

  const KEY_AXES = {
    'tension:self-contradiction': [
      { id:'free-will-determinism', lean:0.2, note:'The passage claims constraint and choice at once, which is where this axis is decided.' },
      { id:'classical-paraconsistent', lean:0.45, note:'Two claims are running side by side without either being dropped.' }
    ],
    'tension:is-ought': [
      { id:'essentialism-constructionism', lean:-0.45, note:'Human nature is being asked to settle a question about value.' },
      { id:'cognitivism-noncognitivism', lean:-0.3, note:'A moral conclusion is being drawn from a description.' }
    ],
    'tension:hasty-generalization': [
      { id:'skepticism-dogmatism', lean:0.3, note:'Absolute quantifiers are carrying the claim.' }
    ],
    'tension:ad-populum': [
      { id:'absolutism-relativism', lean:0.3, note:'How many people hold the belief is doing the work.' }
    ],
    'tension:appeal-to-feeling': [
      { id:'cognitivism-noncognitivism', lean:0.4, note:'A feeling is standing in for the truth of the claim.' }
    ],
    'stance:absolutism': [
      { id:'skepticism-dogmatism', lean:0.5, note:'The certainty is stated rather than argued.' }
    ],
    'stance:hedging': [
      { id:'skepticism-dogmatism', lean:-0.35, note:'The claim is being kept unfalsifiable by qualification.' }
    ],
    'stance:reflexive': [
      { id:'skepticism-dogmatism', lean:-0.25, note:'You are holding your own reading open to being wrong.' }
    ],
    'stance:passive-agency': [
      { id:'free-will-determinism', lean:0.5, note:'The grammar places the action outside you.' }
    ],
    'term:natural': [
      { id:'essentialism-constructionism', lean:-0.35, note:'"Natural" is being used to settle what should be.' },
      { id:'legal-positivism-natural-law', lean:0.3, note:'A norm is being read off an order rather than a rule.' }
    ],
    'term:meaning': [
      { id:'nihilism-existentialism', lean:0.2, note:'Whether meaning is found or made is live in this passage.' }
    ],
    'term:freedom': [
      { id:'free-will-determinism', lean:-0.2, note:'Which freedom you mean decides most of this axis.' }
    ],
    'term:justice': [
      { id:'individualism-collectivism', lean:0.2, note:'Justice as procedure or as outcome pulls this axis in opposite directions.' }
    ]
  };

  /* ================= lookups ================= */

  const byId = {};
  SPECTRA.forEach(s => { byId[s.id] = s; });

  const itemsByAxis = {};
  const itemById = {};
  ITEMS.forEach(it => {
    itemById[it.id] = it;
    (itemsByAxis[it.axisId] = itemsByAxis[it.axisId] || []).push(it);
  });

  const problemById = {};
  PROBLEMS.forEach(p => { problemById[p.id] = p; });

  // Which axes an item can move at all — its own axis plus any axis a
  // secondary delta touches. Used to know what a problem covers.
  function axesTouchedBy(item) {
    const out = new Set([item.axisId]);
    item.options.forEach(o => (o.deltas || []).forEach(d => out.add(d.axisId)));
    return [...out];
  }

  const argumentCount = SPECTRA.reduce((n, s) => n + s.arguments.length, 0);

  window.PalinodeBeliefs = {
    SPECTRA, ITEMS, PROBLEMS, CONCEPT_AXES, KEY_AXES,

    all: () => SPECTRA,
    spectrum: id => byId[id] || null,
    item: id => itemById[id] || null,
    itemsFor: axisId => (itemsByAxis[axisId] || []).slice(),
    problem: id => problemById[id] || null,
    problemsFor: axisId => PROBLEMS.filter(p =>
      ITEMS.some(it => it.problem === p.id && axesTouchedBy(it).indexOf(axisId) >= 0)),
    axesTouchedBy,

    // The bridge. Accepts a concept id or a full insight key.
    axesForConcept: id => (CONCEPT_AXES[id] || []).slice(),
    axesForKey(key) {
      if (!key) return [];
      if (KEY_AXES[key]) return KEY_AXES[key].slice();
      if (key.indexOf('concept:') === 0) return (CONCEPT_AXES[key.slice(8)] || []).slice();
      return [];
    },

    // Named company: the arguments nearest a position, and the strongest
    // one from the opposite pole (the challenge Khora insists on showing).
    argumentsNear(axisId, score, cap) {
      const s = byId[axisId];
      if (!s || typeof score !== 'number') return [];
      return s.arguments.slice()
        .sort((a, b) => Math.abs(a.position - score) - Math.abs(b.position - score))
        .slice(0, cap || 2);
    },
    opposing(axisId, score) {
      const s = byId[axisId];
      if (!s || typeof score !== 'number') return null;
      const away = score >= 0 ? -1 : 1;
      const other = s.arguments.filter(a => Math.sign(a.position) === away);
      if (!other.length) return null;
      return other.reduce((best, a) =>
        Math.abs(a.position) > Math.abs(best.position) ? a : best, other[0]);
    },
    poleLabel(axisId, side) {
      const s = byId[axisId];
      if (!s) return '';
      return side < 0 ? s.left : s.right;
    },

    count: { spectra: SPECTRA.length, items: ITEMS.length, arguments: argumentCount,
             problems: PROBLEMS.length }
  };
})();
