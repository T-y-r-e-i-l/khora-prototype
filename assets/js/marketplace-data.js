/* ============================================================
   Palinode — Marketplace seed data (mentors + enrollable epics)
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
      lessons: [
        { id: 'l1', name: 'What is up to you', description: 'Map one week of distress onto Epictetus’s first division.' },
        { id: 'l2', name: 'Judgement as the lever', description: 'Rewrite three judgements that mistook fortune for failure.' },
        { id: 'l3', name: 'Evening review', description: 'Design a ten-minute review you can keep for a month.' },
        { id: 'l4', name: 'Hard cases', description: 'Bring a situation that seems to break the dichotomy.' }
      ]
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
      lessons: [
        { id: 'l1', name: 'The we before the I', description: 'Name the people your current decisions already assume.' },
        { id: 'l2', name: 'Harm as rupture', description: 'Describe one rupture without collapsing into blame.' },
        { id: 'l3', name: 'Repair practices', description: 'Draft a repair you can attempt this month.' },
        { id: 'l4', name: 'Boundaries that still hold', description: 'Where does ubuntu not mean self-erasure?' },
        { id: 'l5', name: 'Closing circle', description: 'Present your repaired relation to the mentor.' }
      ]
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
      lessons: [
        { id: 'l1', name: 'The sigh in the object', description: 'Choose one ordinary object and write its fading.' },
        { id: 'l2', name: 'Ma — the interval', description: 'Photograph three intervals; caption each without metaphor pile-up.' },
        { id: 'l3', name: 'Season as argument', description: 'Rewrite a personal conflict as a seasonal change.' }
      ]
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
      lessons: [
        { id: 'l1', name: 'Audit your load-bearing words', description: 'Underline five contested terms in a recent note.' },
        { id: 'l2', name: 'Operational definitions', description: 'Replace two terms with testable definitions.' },
        { id: 'l3', name: 'Counterexamples', description: 'Break each definition with one honest counterexample.' },
        { id: 'l4', name: 'Rewrite the claim', description: 'Publish a tighter paragraph to your journal.' }
      ]
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
      lessons: [
        { id: 'l1', name: 'Facticity vs transcendence', description: 'Split one stuck story into facts and free moves.' },
        { id: 'l2', name: 'The waiter’s smile', description: 'Find a role you are over-playing this week.' },
        { id: 'l3', name: 'Excuses inventory', description: 'Catalogue “I had no choice” lines; test each.' },
        { id: 'l4', name: 'A freer next act', description: 'Commit to one act that your excuses forbade.' }
      ]
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
      lessons: [
        { id: 'l1', name: 'The arrangement', description: 'Describe a fairness dispute you are inside of.' },
        { id: 'l2', name: 'Behind the veil', description: 'Rewrite the rule without knowing your seat.' },
        { id: 'l3', name: 'Stress test', description: 'Ask who is still worse off under your rule.' }
      ]
    }
  ];

  function epicOf(id) { return EPICS.find(e => e.id === id) || null; }
  function mentorOf(id) { return MENTORS[id] || null; }

  function hydrateEpic(e) {
    if (!e) return null;
    const mentor = mentorOf(e.mentorId);
    return Object.assign({}, e, {
      mentor,
      mentorName: mentor ? mentor.name : 'Mentor',
      education: mentor ? mentor.education : '',
      rating: mentor ? mentor.rating : 0,
      moduleCount: (e.lessons || []).length,
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
    epicOf,
    mentorOf,
    hydrateEpic,
    hydrateMentor,
    epicsForMentor,
    allEpics: () => EPICS.map(hydrateEpic),
    allMentors: () => Object.keys(MENTORS).map(id => hydrateMentor(MENTORS[id]))
  };
})();
