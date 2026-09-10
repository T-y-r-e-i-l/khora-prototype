/* ============================================================
   Palinode — Marketplace seed data
   Quest = first-class playable unit; Epic = mentor package (questIds[])
   ============================================================ */

(function () {
  const MENTORS = {
    'm-elena': {
      id: 'm-elena',
      name: 'Elena Voss',
      education: 'PhD Philosophy, Cambridge · Stoic practice certificate',
      avatar: 'assets/avatars/elena.jpg',
      rating: 4.8,
      languages: ['English', 'German'],
      bio: 'I help people stop mistaking fortune for character — Stoic practice and existential honesty, grounded in what they already wrote in their journal.',
      traditions: ['Stoicism', 'Existentialism'],
      focusAreas: ['Agency', 'Anxiety', 'Practice'],
      sessionPrice: 95,
      sessionMins: 50,
      khoraActivity: {
        years: 4,
        conceptsTended: 38,
        pathwaysGuided: 12,
        recent: [
          'Tended Dichotomy of Control with three mentees this month',
          'Pathway: Bad faith in scheduling — 6 steps',
          'Note cluster: excuses vs facticity'
        ]
      }
    },
    'm-amir': {
      id: 'm-amir',
      name: 'Amir Okonkwo',
      education: 'MA African Philosophy · Ubuntu facilitation cert.',
      avatar: 'assets/avatars/amir.jpg',
      rating: 4.9,
      languages: ['English', 'Yoruba'],
      bio: 'Guidance through relational selfhood — what you owe, what you ask for, and how repair looks when “I am because we are.”',
      traditions: ['Ubuntu', 'African Philosophy'],
      focusAreas: ['Ethics', 'Community', 'Repair'],
      sessionPrice: 110,
      sessionMins: 50,
      khoraActivity: {
        years: 3,
        conceptsTended: 27,
        pathwaysGuided: 9,
        recent: [
          'Opened Personhood Through Others cohort',
          'Mapped rupture → repair on two shared pathways',
          'Hosted circle on boundaries that still hold'
        ]
      }
    },
    'm-mei': {
      id: 'm-mei',
      name: 'Mei Tanaka',
      education: 'MPhil Kyoto · Japanese aesthetics residency',
      avatar: 'assets/avatars/mei.jpg',
      rating: 4.7,
      languages: ['English', 'Japanese'],
      bio: 'Attention training for impermanence — tea, image, and short essays that refuse to turn feeling into performance.',
      traditions: ['Japanese Aesthetics', 'Buddhist'],
      focusAreas: ['Attention', 'Aesthetics', 'Impermanence'],
      sessionPrice: 85,
      sessionMins: 45,
      khoraActivity: {
        years: 5,
        conceptsTended: 41,
        pathwaysGuided: 7,
        recent: [
          'Season-as-argument walks with four mentees',
          'Tended Ma (interval) as a living concept node',
          'Shared image pathway: three intervals'
        ]
      }
    },
    'm-jonas': {
      id: 'm-jonas',
      name: 'Jonas Bergman',
      education: 'PhD Analytic Philosophy, NYU',
      avatar: 'assets/avatars/jonas.jpg',
      rating: 4.6,
      languages: ['English', 'Swedish'],
      bio: 'I force load-bearing words to declare a definition — freedom, success, fairness — then stress-test them against your own cases.',
      traditions: ['Analytic', 'Political Philosophy'],
      focusAreas: ['Clarity', 'Language', 'Justice'],
      sessionPrice: 100,
      sessionMins: 50,
      khoraActivity: {
        years: 6,
        conceptsTended: 52,
        pathwaysGuided: 14,
        recent: [
          'Fairness Behind the Veil — new epic open',
          'Concept audit: contested terms in mentee notes',
          'Pathway: operational definitions → counterexamples'
        ]
      }
    }
  };

  function courseQuest(partial) {
    return Object.assign({
      type: 'course',
      access: 'epic_required',
      conceptIds: [],
      rewards: { exp: 25 }
    }, partial, {
      objectives: partial.objectives || (partial.description ? [partial.description] : []),
      rewards: partial.rewards || { exp: 25 },
      conceptIds: partial.conceptIds || []
    });
  }

  function freeQuest(partial) {
    return Object.assign({
      epicId: null,
      type: 'elenchos',
      access: 'free',
      conceptIds: [],
      rewards: { exp: 40 }
    }, partial, {
      objectives: partial.objectives || [],
      conceptIds: partial.conceptIds || [],
      rewards: partial.rewards || { exp: 40 }
    });
  }

  const QUESTS = [
    courseQuest({ id: 'q-stoic-l1', epicId: 'e-stoic-control', title: 'What is up to you', description: 'Map one week of distress onto Epictetus’s first division.', conceptIds: ['stoic-control'] }),
    courseQuest({ id: 'q-stoic-l2', epicId: 'e-stoic-control', title: 'Judgement as the lever', description: 'Rewrite three judgements that mistook fortune for failure.', conceptIds: ['stoic-control'] }),
    courseQuest({ id: 'q-stoic-l3', epicId: 'e-stoic-control', title: 'Evening review', description: 'Design a ten-minute review you can keep for a month.', conceptIds: ['stoic-control'] }),
    courseQuest({ id: 'q-stoic-l4', epicId: 'e-stoic-control', title: 'Hard cases', description: 'Bring a situation that seems to break the dichotomy.', conceptIds: ['stoic-control', 'amor-fati'] }),

    courseQuest({ id: 'q-ubuntu-l1', epicId: 'e-ubuntu-self', title: 'The we before the I', description: 'Name the people your current decisions already assume.', conceptIds: ['ubuntu'] }),
    courseQuest({ id: 'q-ubuntu-l2', epicId: 'e-ubuntu-self', title: 'Harm as rupture', description: 'Describe one rupture without collapsing into blame.', conceptIds: ['ubuntu'] }),
    courseQuest({ id: 'q-ubuntu-l3', epicId: 'e-ubuntu-self', title: 'Repair practices', description: 'Draft a repair you can attempt this month.', conceptIds: ['ubuntu'] }),
    courseQuest({ id: 'q-ubuntu-l4', epicId: 'e-ubuntu-self', title: 'Boundaries that still hold', description: 'Where does ubuntu not mean self-erasure?', conceptIds: ['ubuntu', 'care-ethics'] }),
    courseQuest({ id: 'q-ubuntu-l5', epicId: 'e-ubuntu-self', title: 'Closing circle', description: 'Present your repaired relation to the mentor.', conceptIds: ['ubuntu'] }),

    courseQuest({ id: 'q-mono-l1', epicId: 'e-mono-no-aware', title: 'The sigh in the object', description: 'Choose one ordinary object and write its fading.', conceptIds: ['impermanence-aesthetic'] }),
    courseQuest({ id: 'q-mono-l2', epicId: 'e-mono-no-aware', title: 'Ma — the interval', description: 'Photograph three intervals; caption each without metaphor pile-up.', conceptIds: ['impermanence-aesthetic', 'flow'] }),
    courseQuest({ id: 'q-mono-l3', epicId: 'e-mono-no-aware', title: 'Season as argument', description: 'Rewrite a personal conflict as a seasonal change.', conceptIds: ['impermanence-aesthetic', 'dukkha'] }),

    courseQuest({ id: 'q-clarity-l1', epicId: 'e-clarity-terms', title: 'Audit your load-bearing words', description: 'Underline five contested terms in a recent note.', conceptIds: ['language-games'] }),
    courseQuest({ id: 'q-clarity-l2', epicId: 'e-clarity-terms', title: 'Operational definitions', description: 'Replace two terms with testable definitions.', conceptIds: ['language-games', 'falsifiability'] }),
    courseQuest({ id: 'q-clarity-l3', epicId: 'e-clarity-terms', title: 'Counterexamples', description: 'Break each definition with one honest counterexample.', conceptIds: ['language-games', 'aporia'] }),
    courseQuest({ id: 'q-clarity-l4', epicId: 'e-clarity-terms', title: 'Rewrite the claim', description: 'Publish a tighter paragraph to your journal.', conceptIds: ['language-games'] }),

    courseQuest({ id: 'q-badfaith-l1', epicId: 'e-bad-faith', title: 'Facticity vs transcendence', description: 'Split one stuck story into facts and free moves.', conceptIds: ['bad-faith'] }),
    courseQuest({ id: 'q-badfaith-l2', epicId: 'e-bad-faith', title: 'The waiter’s smile', description: 'Find a role you are over-playing this week.', conceptIds: ['bad-faith'] }),
    courseQuest({ id: 'q-badfaith-l3', epicId: 'e-bad-faith', title: 'Excuses inventory', description: 'Catalogue “I had no choice” lines; test each.', conceptIds: ['bad-faith', 'determinism'] }),
    courseQuest({ id: 'q-badfaith-l4', epicId: 'e-bad-faith', title: 'A freer next act', description: 'Commit to one act that your excuses forbade.', conceptIds: ['bad-faith', 'situated-freedom'] }),

    courseQuest({ id: 'q-veil-l1', epicId: 'e-veil', title: 'The arrangement', description: 'Describe a fairness dispute you are inside of.', conceptIds: ['veil-of-ignorance'] }),
    courseQuest({ id: 'q-veil-l2', epicId: 'e-veil', title: 'Behind the veil', description: 'Rewrite the rule without knowing your seat.', conceptIds: ['veil-of-ignorance'] }),
    courseQuest({ id: 'q-veil-l3', epicId: 'e-veil', title: 'Stress test', description: 'Ask who is still worse off under your rule.', conceptIds: ['veil-of-ignorance', 'utilitarian-calculus'] }),

    /* Existing free teasers */
    freeQuest({
      id: 'q-free-dichotomy',
      title: 'Name what is up to you',
      description: 'From one recent note, split control from fortune.',
      conceptIds: ['stoic-control'],
      objectives: [
        'Pick a stuck moment from the last week',
        'List what was yours to move',
        'Write one freer next act'
      ],
      rewards: { exp: 40, unlockLabel: 'Clarity practice mark' }
    }),
    freeQuest({
      id: 'q-free-excuse',
      title: 'Test one excuse',
      description: 'Catch a single “I had no choice” line and pressure it until it breaks or holds.',
      conceptIds: ['bad-faith'],
      objectives: [
        'Write the excuse exactly as you say it',
        'Name one alternative you refused',
        'Decide: keep, revise, or drop the line'
      ],
      rewards: { exp: 35, unlockLabel: 'Honesty mark' }
    }),
    freeQuest({
      id: 'q-free-interval',
      title: 'Three intervals',
      description: 'Notice three pauses in an ordinary day without turning them into performance.',
      type: 'special',
      conceptIds: ['impermanence-aesthetic', 'flow'],
      objectives: [
        'Capture three intervals (notes or images)',
        'Caption each without metaphor pile-up',
        'Mark which interval felt least forced'
      ],
      rewards: { exp: 45, unlockLabel: 'Attention mark' }
    }),

    /* Priority 1 — eight free concept quests from corpus reading/turn */
    freeQuest({
      id: 'q-free-eudaimonia',
      title: 'Activity, not a mood',
      description: 'Treat happiness as something you are doing across an arc, not a feeling you wait for.',
      conceptIds: ['eudaimonia', 'virtue', 'telos'],
      objectives: [
        'If happiness were an activity rather than a state, what would you have to be doing right now to be in it?',
        'Write one paragraph naming that activity without using the word happy',
        'Show Eudaimonia and one kin concept on Explore'
      ],
      rewards: { exp: 40, unlockLabel: 'Flourishing mark' }
    }),
    freeQuest({
      id: 'q-free-recurrence',
      title: 'Would you take this day again?',
      description: 'Nietzsche’s recurrence test applied to a single ordinary day.',
      conceptIds: ['recurrence', 'amor-fati'],
      objectives: [
        'Would you take this day again, unchanged, forever? If not, which single part would you refuse?',
        'Write the refusal as a concrete scene, not a mood',
        'Open Eternal Recurrence on the map and visit one kin node'
      ],
      rewards: { exp: 40, unlockLabel: 'Affirmation mark' }
    }),
    freeQuest({
      id: 'q-free-dukkha',
      title: 'Loosen one grip',
      description: 'Name what you are holding as permanent and what remains if you stop.',
      conceptIds: ['dukkha', 'samsara'],
      objectives: [
        'What are you holding as though it were permanent, and what would remain if you stopped insisting on that?',
        'Write the remainder without consolation language',
        'Show Dukkha & Impermanence on Explore'
      ],
      rewards: { exp: 40, unlockLabel: 'Impermanence mark' }
    }),
    freeQuest({
      id: 'q-free-ren',
      title: 'Role as constitution',
      description: 'Test whether an obligation is imposed on you or partly who you are.',
      conceptIds: ['ren'],
      objectives: [
        'Is the obligation you are describing something imposed on who you are, or partly constitutive of it?',
        'Rewrite the obligation once as burden and once as belonging',
        'Visit Ren & Li on the map'
      ],
      rewards: { exp: 40, unlockLabel: 'Role mark' }
    }),
    freeQuest({
      id: 'q-free-wuwei',
      title: 'Cut with the grain',
      description: 'Find where you are forcing a situation against its grain.',
      conceptIds: ['wuwei'],
      objectives: [
        'Where is the grain of this situation, and are you cutting with it or across it?',
        'Describe one forced move and one easier alignment',
        'Show Wu Wei on Explore'
      ],
      rewards: { exp: 40, unlockLabel: 'Ease mark' }
    }),
    freeQuest({
      id: 'q-free-anatta',
      title: 'No fixed self underneath',
      description: 'Pressure the idea that there is a true self waiting to be discovered.',
      conceptIds: ['anatta', 'ship-of-theseus'],
      objectives: [
        'What if there is no true self underneath to discover, only the one you are assembling by writing this?',
        'Describe yourself in third person for one paragraph; note what you left out',
        'Open Anattā on the map'
      ],
      rewards: { exp: 40, unlockLabel: 'No-self mark' }
    }),
    freeQuest({
      id: 'q-free-ressentiment',
      title: 'Strip the other out',
      description: 'Test whether resentment still has content without the other person.',
      conceptIds: ['ressentiment'],
      objectives: [
        'Strip out every reference to them. Is there anything left that you actually want?',
        'Name the want without blame vocabulary',
        'Show Ressentiment and one kin on Explore'
      ],
      rewards: { exp: 40, unlockLabel: 'Honesty mark' }
    }),
    freeQuest({
      id: 'q-free-care',
      title: 'Room for the carer',
      description: 'Ask whether your moral framework has room for the person doing the caring.',
      conceptIds: ['care-ethics', 'situated-freedom'],
      objectives: [
        'Does the framework you are judging yourself by have any room in it for the carer’s own needs?',
        'Write one need of yours that the framework usually erases',
        'Visit The Ethics of Care on the map'
      ],
      rewards: { exp: 40, unlockLabel: 'Care mark' }
    }),

    /* Priority 2 — twelve high-traffic prompts as free quests */
    freeQuest({
      id: 'q-prompt-telos',
      title: 'And then what?',
      description: 'Take a goal you hold. Ask “and then what?” four times in writing. Where does the chain break?',
      conceptIds: ['telos', 'eudaimonia'],
      promptId: 'p06',
      objectives: [
        'Write the goal and four “and then what?” replies',
        'Mark where the chain breaks or goes empty',
        'Open Ends & Purposes on Explore'
      ],
      rewards: { exp: 35, unlockLabel: 'Ends mark' }
    }),
    freeQuest({
      id: 'q-prompt-panopticon',
      title: 'Whose gaze?',
      description: 'Whose gaze were you performing for today? Check whether they were actually watching.',
      conceptIds: ['panopticon'],
      promptId: 'p08',
      objectives: [
        'Name the observer you were performing for',
        'Check whether they were actually watching; write what changes if not',
        'Show The Disciplinary Gaze on the map'
      ],
      rewards: { exp: 35, unlockLabel: 'Gaze mark' }
    }),
    freeQuest({
      id: 'q-prompt-humility',
      title: 'Strongest case against',
      description: 'Name a claim you would defend hotly. Now write the strongest case against it, in good faith.',
      conceptIds: ['epistemic-humility', 'aporia'],
      promptId: 'p10',
      objectives: [
        'State the claim in one sentence',
        'Write the strongest opposing case you can still respect',
        'Visit Socratic Ignorance on Explore'
      ],
      rewards: { exp: 35, unlockLabel: 'Humility mark' }
    }),
    freeQuest({
      id: 'q-prompt-embodiment',
      title: 'What the body knew',
      description: 'What did your body know today that your reasoning has not caught up to?',
      conceptIds: ['embodiment', 'phenomenology'],
      promptId: 'p11',
      objectives: [
        'Describe the bodily knowing without diagnosing it',
        'Note where reasoning still lags',
        'Open The Lived Body on the map'
      ],
      rewards: { exp: 35, unlockLabel: 'Body mark' }
    }),
    freeQuest({
      id: 'q-prompt-maxim',
      title: 'Law for everyone',
      description: 'Describe a rule you applied today. State it as a law binding on everyone, including you at your least convenient.',
      conceptIds: ['categorical-imperative'],
      promptId: 'p12',
      objectives: [
        'State the rule as a universal law',
        'Test it at your least convenient seat',
        'Show The Categorical Imperative on Explore'
      ],
      rewards: { exp: 40, unlockLabel: 'Maxim mark' }
    }),
    freeQuest({
      id: 'q-prompt-determinism',
      title: 'Pride after causes',
      description: 'Describe a decision you are proud of, then describe the causes that produced it. Does the pride survive?',
      conceptIds: ['determinism'],
      promptId: 'p16',
      objectives: [
        'Write the decision and the pride',
        'List causes; note whether the pride survives',
        'Open Freedom & Necessity on the map'
      ],
      rewards: { exp: 40, unlockLabel: 'Necessity mark' }
    }),
    freeQuest({
      id: 'q-prompt-theseus',
      title: 'Argue against sameness',
      description: 'You are the same person you were ten years ago. Argue against yourself.',
      conceptIds: ['ship-of-theseus', 'anatta'],
      promptId: 'p17',
      objectives: [
        'Write the case that you are the same',
        'Write the case that you are not',
        'Visit Identity Over Time on Explore'
      ],
      rewards: { exp: 40, unlockLabel: 'Identity mark' }
    }),
    freeQuest({
      id: 'q-prompt-veil',
      title: 'Unfair from every seat?',
      description: 'Name something you called unfair today. Would you still call it that from every position in the arrangement?',
      conceptIds: ['veil-of-ignorance'],
      promptId: 'p21',
      objectives: [
        'Name the unfairness claim',
        'Retest it from two seats that are not yours',
        'Show The Veil of Ignorance on the map'
      ],
      rewards: { exp: 40, unlockLabel: 'Fairness mark' }
    }),
    freeQuest({
      id: 'q-prompt-double',
      title: 'Two versions of you',
      description: 'Write about a version of yourself you perform for a specific group. What does that version know that the others do not?',
      conceptIds: ['double-consciousness'],
      promptId: 'p22',
      objectives: [
        'Name the group and the performed version',
        'List what that version knows that others do not',
        'Open Double Consciousness on Explore'
      ],
      rewards: { exp: 40, unlockLabel: 'Double mark' }
    }),
    freeQuest({
      id: 'q-prompt-angst',
      title: 'Anxiety without an object',
      description: 'Describe something you are anxious about. Then check whether it has an object at all.',
      conceptIds: ['angst'],
      promptId: 'p25',
      objectives: [
        'Describe the anxiety as concretely as you can',
        'Check whether it has an object; write what remains if not',
        'Visit Angst & Thrownness on the map'
      ],
      rewards: { exp: 35, unlockLabel: 'Angst mark' }
    }),
    freeQuest({
      id: 'q-prompt-death',
      title: 'What would not survive ending',
      description: 'What in your current life would not survive the fact that it ends?',
      conceptIds: ['being-toward-death'],
      promptId: 'p26',
      objectives: [
        'List what would not survive contact with ending',
        'Mark one item you are postponing as if time were endless',
        'Show Being-Toward-Death on Explore'
      ],
      rewards: { exp: 40, unlockLabel: 'Finitude mark' }
    }),
    freeQuest({
      id: 'q-prompt-samsara',
      title: 'The pattern you return to',
      description: 'Describe a pattern you keep returning to. Each time, what did you expect would be different?',
      conceptIds: ['samsara', 'dukkha'],
      promptId: 'p36',
      objectives: [
        'Name the repeating pattern',
        'For the last two returns, write what you expected to be different',
        'Open Saṃsāra on the map'
      ],
      rewards: { exp: 40, unlockLabel: 'Wheel mark' }
    }),

    /* Priority 3 — belief spectrum quests */
    freeQuest({
      id: 'q-spec-free-will',
      title: 'Freedom under pressure',
      description: 'Place yourself on Free Will vs Determinism, then pressure the lean with one lived case.',
      type: 'special',
      conceptIds: ['determinism', 'bad-faith'],
      spectrumId: 'free-will-determinism',
      objectives: [
        'Open Free Will vs Determinism in your belief profile and place a lean',
        'Write one lived case that either embarrasses or supports that lean',
        'Answer one argument challenge on that spectrum in a short note'
      ],
      rewards: { exp: 45, unlockLabel: 'Agency mark' }
    }),
    freeQuest({
      id: 'q-spec-ethics',
      title: 'Duty or tally?',
      description: 'Stand on Deontology vs Consequentialism using one real decision.',
      type: 'special',
      conceptIds: ['categorical-imperative', 'utilitarian-calculus'],
      spectrumId: 'deontology-consequentialism',
      objectives: [
        'Place a lean on Deontology vs Consequentialism',
        'Rewrite one recent decision once as duty and once as outcome tally',
        'Note which rewrite you could still endorse aloud'
      ],
      rewards: { exp: 45, unlockLabel: 'Ethics mark' }
    }),
    freeQuest({
      id: 'q-spec-meaning',
      title: 'Meaning without the universe',
      description: 'Face Nihilism vs Existentialism without borrowing cosmic reassurance.',
      type: 'special',
      conceptIds: ['absurd', 'recurrence'],
      spectrumId: 'nihilism-existentialism',
      objectives: [
        'Place a lean on Nihilism vs Existentialism',
        'Write what you would still do if the universe offered no answer',
        'Visit The Absurd on Explore and one kin node'
      ],
      rewards: { exp: 45, unlockLabel: 'Meaning mark' }
    })
  ];

  const EPICS = [
    {
      id: 'e-stoic-control',
      mentorId: 'm-elena',
      title: 'The Dichotomy of Control',
      description: 'Six weeks of practice separating what is yours from what is not — with nightly journaling prompts and live review.',
      tags: ['Stoicism', 'Practice', 'Anxiety'],
      price: 180,
      category: 'resonance',
      languages: ['English', 'German'],
      questIds: ['q-stoic-l1', 'q-stoic-l2', 'q-stoic-l3', 'q-stoic-l4']
    },
    {
      id: 'e-ubuntu-self',
      mentorId: 'm-amir',
      title: 'Personhood Through Others',
      description: 'A mentorship on relational selfhood — how “I am because we are” changes what you owe and what you ask for.',
      tags: ['Ubuntu', 'Ethics', 'Community'],
      price: 220,
      category: 'lineage',
      languages: ['English'],
      questIds: ['q-ubuntu-l1', 'q-ubuntu-l2', 'q-ubuntu-l3', 'q-ubuntu-l4', 'q-ubuntu-l5']
    },
    {
      id: 'e-mono-no-aware',
      mentorId: 'm-mei',
      title: 'Mono no Aware & Attention',
      description: 'Train attention on impermanence without turning it into performance — tea, image, and short essays.',
      tags: ['Aesthetics', 'Attention', 'Japan'],
      price: 160,
      category: 'lineage',
      languages: ['English', 'Japanese'],
      questIds: ['q-mono-l1', 'q-mono-l2', 'q-mono-l3']
    },
    {
      id: 'e-clarity-terms',
      mentorId: 'm-jonas',
      title: 'Words Doing Too Much Work',
      description: 'Catch contested terms — freedom, success, authentic — and force them to declare a definition.',
      tags: ['Clarity', 'Language', 'Analytic'],
      price: 140,
      category: 'clarity',
      languages: ['English'],
      questIds: ['q-clarity-l1', 'q-clarity-l2', 'q-clarity-l3', 'q-clarity-l4']
    },
    {
      id: 'e-bad-faith',
      mentorId: 'm-elena',
      title: 'Reading Bad Faith in Daily Life',
      description: 'Sartre’s evasions applied to schedules, relationships, and the stories you tell about “having no choice.”',
      tags: ['Existentialism', 'Honesty', 'Agency'],
      price: 190,
      category: 'tension',
      languages: ['English', 'German'],
      questIds: ['q-badfaith-l1', 'q-badfaith-l2', 'q-badfaith-l3', 'q-badfaith-l4']
    },
    {
      id: 'e-veil',
      mentorId: 'm-jonas',
      title: 'Fairness Behind the Veil',
      description: 'Design a personal decision rule as if you did not know your place in the arrangement.',
      tags: ['Justice', 'Analytic', 'Decision'],
      price: 150,
      category: 'resonance',
      languages: ['English', 'Swedish'],
      questIds: ['q-veil-l1', 'q-veil-l2', 'q-veil-l3']
    }
  ];

  function epicOf(id) { return EPICS.find(e => e.id === id) || null; }
  function mentorOf(id) { return MENTORS[id] || null; }
  function questOf(id) { return QUESTS.find(q => q.id === id) || null; }

  function isMapVisitObjective(text) {
    const t = String(text || '').trim();
    if (!t) return true;
    return /^(show|visit|open|place)\b/i.test(t)
      || /\bon (the )?map\b/i.test(t)
      || /\bon explore\b/i.test(t)
      || /\bin your belief profile\b/i.test(t);
  }

  function isWritingObjective(text) {
    const t = String(text || '').trim();
    if (!t || isMapVisitObjective(t)) return false;
    if (/\?/.test(t)) return true;
    return /^(write|describe|name|rewrite|list|catch|pick|map|treat|notice|capture|caption|mark|decide|test|strip|check|answer|stand|face|pressure|commit|draft|present|underline|replace|break|publish|split|find|catalogue|bring|choose|photograph|design|retell|retest)\b/i.test(t);
  }

  function conceptTurn(conceptId) {
    const list = window.PalinodeCorpus && PalinodeCorpus.CONCEPTS;
    if (!list || !conceptId) return '';
    const c = list.find(x => x.id === conceptId);
    return (c && c.turn) || '';
  }

  function pickQuestPrompt(q, objectives, conceptIds) {
    if (q.prompt && String(q.prompt).trim()) return String(q.prompt).trim();
    const writing = (objectives || []).filter(isWritingObjective);
    const question = writing.find(o => /\?/.test(o));
    if (question) return question;
    // Corpus turns are built as response prompts; prefer them over map leftovers
    // or thin checklist lines like "Name the unfairness claim".
    for (const id of (conceptIds || [])) {
      const turn = conceptTurn(id);
      if (turn) return turn;
    }
    if (writing.length) return writing[0];
    const desc = String(q.description || '').trim();
    if (desc && !isMapVisitObjective(desc)) return desc;
    return 'After visiting these nodes, what claim are you willing to stand behind in your own words?';
  }

  function buildSteps(q) {
    const objectives = (q.objectives && q.objectives.length)
      ? q.objectives
      : (q.description ? [q.description] : []);
    if (q.steps && q.steps.length) {
      return q.steps.map((s, i) => {
        const raw = s.prompt || objectives[i] || null;
        const prompt = raw && !isMapVisitObjective(raw) ? raw : (conceptTurn(s.conceptId) || raw);
        return {
          id: s.id || ('s' + (i + 1)),
          conceptId: s.conceptId,
          prompt
        };
      }).filter(s => s.conceptId);
    }
    const ids = q.conceptIds || [];
    return ids.map((cid, i) => {
      const raw = objectives[i] || null;
      const prompt = raw && !isMapVisitObjective(raw) ? raw : (conceptTurn(cid) || raw);
      return {
        id: 's' + (i + 1),
        conceptId: cid,
        prompt
      };
    });
  }

  function hydrateQuest(q) {
    if (!q) return null;
    const access = q.access || (q.epicId ? 'epic_required' : 'free');
    const conceptIds = q.conceptIds || [];
    const objectives = (q.objectives && q.objectives.length)
      ? q.objectives
      : (q.description ? [q.description] : []);
    const steps = buildSteps(Object.assign({}, q, { conceptIds, objectives }));
    const prompt = pickQuestPrompt(q, objectives, conceptIds);
    return Object.assign({}, q, {
      kind: 'quest',
      type: q.type || (access === 'free' ? 'elenchos' : 'course'),
      access,
      conceptIds,
      objectives,
      steps,
      prompt,
      rewards: q.rewards || { exp: 25 }
    });
  }

  function freeQuests() {
    return QUESTS.map(hydrateQuest).filter(q => q.access === 'free');
  }

  function questsForEpic(epicId) {
    const e = epicOf(epicId);
    if (!e) return [];
    return (e.questIds || []).map(questOf).filter(Boolean).map(hydrateQuest);
  }

  function hydrateEpic(e) {
    if (!e) return null;
    const mentor = mentorOf(e.mentorId);
    const quests = questsForEpic(e.id);
    return Object.assign({}, e, {
      mentor,
      mentorName: mentor ? mentor.name : 'Mentor',
      education: mentor ? mentor.education : '',
      rating: mentor ? mentor.rating : 0,
      quests,
      questCount: quests.length,
      kind: 'epic'
    });
  }

  function hydrateMentor(m) {
    if (!m) return null;
    const epics = EPICS.filter(e => e.mentorId === m.id).map(hydrateEpic);
    return Object.assign({}, m, {
      epics,
      epicCount: epics.length,
      kind: 'mentor',
      tags: [...new Set([...(m.focusAreas || []), ...(m.traditions || [])])]
    });
  }

  function epicsForMentor(mentorId) {
    return EPICS.filter(e => e.mentorId === mentorId).map(hydrateEpic);
  }

  window.PalinodeMarketData = {
    MENTORS,
    EPICS,
    QUESTS,
    epicOf,
    mentorOf,
    questOf,
    hydrateQuest,
    hydrateEpic,
    hydrateMentor,
    questsForEpic,
    freeQuests,
    epicsForMentor,
    allEpics: () => EPICS.map(hydrateEpic),
    allQuests: () => QUESTS.map(hydrateQuest),
    allMentors: () => Object.keys(MENTORS).map(id => hydrateMentor(MENTORS[id]))
  };
})();
