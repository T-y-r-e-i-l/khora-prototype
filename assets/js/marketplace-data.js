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

  const QUESTS = [
    courseQuest({ id: 'q-stoic-l1', epicId: 'e-stoic-control', title: 'What is up to you', description: 'Map one week of distress onto Epictetus’s first division.' }),
    courseQuest({ id: 'q-stoic-l2', epicId: 'e-stoic-control', title: 'Judgement as the lever', description: 'Rewrite three judgements that mistook fortune for failure.' }),
    courseQuest({ id: 'q-stoic-l3', epicId: 'e-stoic-control', title: 'Evening review', description: 'Design a ten-minute review you can keep for a month.' }),
    courseQuest({ id: 'q-stoic-l4', epicId: 'e-stoic-control', title: 'Hard cases', description: 'Bring a situation that seems to break the dichotomy.' }),

    courseQuest({ id: 'q-ubuntu-l1', epicId: 'e-ubuntu-self', title: 'The we before the I', description: 'Name the people your current decisions already assume.' }),
    courseQuest({ id: 'q-ubuntu-l2', epicId: 'e-ubuntu-self', title: 'Harm as rupture', description: 'Describe one rupture without collapsing into blame.' }),
    courseQuest({ id: 'q-ubuntu-l3', epicId: 'e-ubuntu-self', title: 'Repair practices', description: 'Draft a repair you can attempt this month.' }),
    courseQuest({ id: 'q-ubuntu-l4', epicId: 'e-ubuntu-self', title: 'Boundaries that still hold', description: 'Where does ubuntu not mean self-erasure?' }),
    courseQuest({ id: 'q-ubuntu-l5', epicId: 'e-ubuntu-self', title: 'Closing circle', description: 'Present your repaired relation to the mentor.' }),

    courseQuest({ id: 'q-mono-l1', epicId: 'e-mono-no-aware', title: 'The sigh in the object', description: 'Choose one ordinary object and write its fading.' }),
    courseQuest({ id: 'q-mono-l2', epicId: 'e-mono-no-aware', title: 'Ma — the interval', description: 'Photograph three intervals; caption each without metaphor pile-up.' }),
    courseQuest({ id: 'q-mono-l3', epicId: 'e-mono-no-aware', title: 'Season as argument', description: 'Rewrite a personal conflict as a seasonal change.' }),

    courseQuest({ id: 'q-clarity-l1', epicId: 'e-clarity-terms', title: 'Audit your load-bearing words', description: 'Underline five contested terms in a recent note.' }),
    courseQuest({ id: 'q-clarity-l2', epicId: 'e-clarity-terms', title: 'Operational definitions', description: 'Replace two terms with testable definitions.' }),
    courseQuest({ id: 'q-clarity-l3', epicId: 'e-clarity-terms', title: 'Counterexamples', description: 'Break each definition with one honest counterexample.' }),
    courseQuest({ id: 'q-clarity-l4', epicId: 'e-clarity-terms', title: 'Rewrite the claim', description: 'Publish a tighter paragraph to your journal.' }),

    courseQuest({ id: 'q-badfaith-l1', epicId: 'e-bad-faith', title: 'Facticity vs transcendence', description: 'Split one stuck story into facts and free moves.' }),
    courseQuest({ id: 'q-badfaith-l2', epicId: 'e-bad-faith', title: 'The waiter’s smile', description: 'Find a role you are over-playing this week.' }),
    courseQuest({ id: 'q-badfaith-l3', epicId: 'e-bad-faith', title: 'Excuses inventory', description: 'Catalogue “I had no choice” lines; test each.' }),
    courseQuest({ id: 'q-badfaith-l4', epicId: 'e-bad-faith', title: 'A freer next act', description: 'Commit to one act that your excuses forbade.' }),

    courseQuest({ id: 'q-veil-l1', epicId: 'e-veil', title: 'The arrangement', description: 'Describe a fairness dispute you are inside of.' }),
    courseQuest({ id: 'q-veil-l2', epicId: 'e-veil', title: 'Behind the veil', description: 'Rewrite the rule without knowing your seat.' }),
    courseQuest({ id: 'q-veil-l3', epicId: 'e-veil', title: 'Stress test', description: 'Ask who is still worse off under your rule.' }),

    {
      id: 'q-free-dichotomy',
      epicId: null,
      title: 'Name what is up to you',
      description: 'From one recent note, split control from fortune.',
      type: 'elenchos',
      access: 'free',
      conceptIds: [],
      objectives: [
        'Pick a stuck moment from the last week',
        'List what was yours to move',
        'Write one freer next act'
      ],
      rewards: { exp: 40, unlockLabel: 'Clarity practice mark' }
    },
    {
      id: 'q-free-excuse',
      epicId: null,
      title: 'Test one excuse',
      description: 'Catch a single “I had no choice” line and pressure it until it breaks or holds.',
      type: 'elenchos',
      access: 'free',
      conceptIds: [],
      objectives: [
        'Write the excuse exactly as you say it',
        'Name one alternative you refused',
        'Decide: keep, revise, or drop the line'
      ],
      rewards: { exp: 35, unlockLabel: 'Honesty mark' }
    },
    {
      id: 'q-free-interval',
      epicId: null,
      title: 'Three intervals',
      description: 'Notice three pauses in an ordinary day without turning them into performance.',
      type: 'special',
      access: 'free',
      conceptIds: [],
      objectives: [
        'Capture three intervals (notes or images)',
        'Caption each without metaphor pile-up',
        'Mark which interval felt least forced'
      ],
      rewards: { exp: 45, unlockLabel: 'Attention mark' }
    }
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

  function hydrateQuest(q) {
    if (!q) return null;
    const access = q.access || (q.epicId ? 'epic_required' : 'free');
    return Object.assign({}, q, {
      kind: 'quest',
      type: q.type || (access === 'free' ? 'elenchos' : 'course'),
      access,
      conceptIds: q.conceptIds || [],
      objectives: (q.objectives && q.objectives.length) ? q.objectives : (q.description ? [q.description] : []),
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
