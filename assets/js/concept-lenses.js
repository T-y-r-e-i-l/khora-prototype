/* ============================================================
   Palinode — Concept lenses (Explore panel contextual views)
   Cultural / Opposing / Analyze / Contemporary — seeded from
   corpus, belief spectra, and marketplace quests. No external APIs.
   ============================================================ */

(function () {
  const CORPUS = () => window.PalinodeCorpus;
  const BEL = () => window.PalinodeBeliefs;
  const LIB = () => window.PalinodeLibrary;
  const MARKET = () => window.PalinodeMarketData;

  /* High-traffic local concepts → contemporary issue seeds */
  const CONTEMPORARY = {
    'stoic-control': {
      issues: [
        {
          label: 'Always-on work',
          prompt: 'What in this situation was never yours to decide — and what have you been treating as if it were?'
        },
        {
          label: 'Public outrage cycles',
          prompt: 'Strip the feed to what you can actually revise. What remains, and is that what you have been writing about?'
        }
      ]
    },
    'veil-of-ignorance': {
      issues: [
        {
          label: 'Algorithmic fairness',
          prompt: 'Would you endorse this ranking or policy if you did not know which side of it you would land on?'
        },
        {
          label: 'Climate burden-sharing',
          prompt: 'Design the rule first, then ask whether you would accept it without knowing your country’s place in the arrangement.'
        }
      ]
    },
    'bad-faith': {
      issues: [
        {
          label: 'Career lock-in',
          prompt: 'Where are you saying “I had to” when a quieter choice is still available?'
        },
        {
          label: 'Platform incentives',
          prompt: 'What role are you performing for the feed that lets you avoid owning the choice?'
        }
      ]
    },
    ubuntu: {
      issues: [
        {
          label: 'Remote isolation',
          prompt: 'Which people does your current decision already assume — and who has gone missing from that we?'
        },
        {
          label: 'Community repair',
          prompt: 'Describe one rupture without collapsing into blame. What would repair look like this month?'
        }
      ]
    },
    wuwei: {
      issues: [
        {
          label: 'Productivity culture',
          prompt: 'Where is force making the situation worse — and what would following the grain look like instead?'
        },
        {
          label: 'Creative block',
          prompt: 'Name the effort that is fighting the medium. What happens if you stop pushing for one day?'
        }
      ]
    },
    anatta: {
      issues: [
        {
          label: 'Identity online',
          prompt: 'Which fixed self are you defending in this thread — and what aggregates is it made of?'
        },
        {
          label: 'Career narrative',
          prompt: 'If there is no enduring self beneath the roles, what are you actually protecting?'
        }
      ]
    },
    eudaimonia: {
      issues: [
        {
          label: 'Wellness metrics',
          prompt: 'If flourishing were an activity over a life rather than a mood score, what would you have to be doing now?'
        },
        {
          label: 'Burnout culture',
          prompt: 'Are you asking whether you are happy today — or whether the life you are building can go well?'
        }
      ]
    },
    'amor-fati': {
      issues: [
        {
          label: 'Career regret',
          prompt: 'If this exact path were required for what you now value, would you still call it a mistake?'
        }
      ]
    },
    panopticon: {
      issues: [
        {
          label: 'Surveillance capitalism',
          prompt: 'Where have you begun doing the watching yourself — and what cheaper power does that serve?'
        }
      ]
    },
    dukkha: {
      issues: [
        {
          label: 'Doomscrolling',
          prompt: 'What grip are you treating as fixed that is already in motion?'
        }
      ]
    }
  };

  function conceptOf(id) {
    if (!id) return null;
    const list = (CORPUS() && CORPUS().CONCEPTS) || [];
    const local = list.find(c => c.id === id);
    if (local) return local;
    if (window.PalinodeKhora && typeof PalinodeKhora.getConcept === 'function') {
      return PalinodeKhora.getConcept(id) || null;
    }
    return null;
  }

  function traditionLabel(key) {
    const map = CORPUS() && CORPUS().TRADITIONS;
    if (!key) return '';
    return (map && map[key]) || key;
  }

  function byTraditionMap() {
    const map = {};
    ((CORPUS() && CORPUS().CONCEPTS) || []).forEach(c => {
      if (!c.tradition) return;
      (map[c.tradition] = map[c.tradition] || []).push(c);
    });
    return map;
  }

  function spectrumOf(axisId) {
    const spectra = (BEL() && BEL().SPECTRA) || [];
    return spectra.find(s => s.id === axisId) || null;
  }

  function resolveSource(src) {
    if (!src || !LIB() || typeof LIB().resolve !== 'function') return null;
    try { return LIB().resolve(src); }
    catch (e) { return null; }
  }

  function questsForConcept(conceptId) {
    if (!MARKET() || typeof MARKET().freeQuests !== 'function') return [];
    return MARKET().freeQuests().filter(q =>
      (q.conceptIds || []).includes(conceptId)
    ).slice(0, 4);
  }

  function cultural(conceptId) {
    const c = conceptOf(conceptId);
    if (!c) return null;
    const byTrad = byTraditionMap();
    const homeKey = c.tradition || '';
    const same = (byTrad[homeKey] || [])
      .filter(x => x.id !== c.id)
      .slice(0, 5)
      .map(x => ({
        id: x.id,
        label: x.label,
        tradition: traditionLabel(x.tradition),
        category: x.category,
        reading: x.reading || ''
      }));

    const other = [];
    const seen = new Set([c.id, ...same.map(x => x.id)]);
    (c.kin || []).forEach(kid => {
      const k = conceptOf(kid);
      if (!k || seen.has(k.id) || k.tradition === homeKey) return;
      seen.add(k.id);
      other.push({
        id: k.id,
        label: k.label,
        tradition: traditionLabel(k.tradition),
        category: k.category,
        reading: k.reading || ''
      });
    });
    if (other.length < 4) {
      ((CORPUS() && CORPUS().CONCEPTS) || []).forEach(x => {
        if (other.length >= 4) return;
        if (seen.has(x.id) || x.tradition === homeKey) return;
        if (c.category && x.category !== c.category && x.category !== 'lineage') return;
        seen.add(x.id);
        other.push({
          id: x.id,
          label: x.label,
          tradition: traditionLabel(x.tradition),
          category: x.category,
          reading: x.reading || ''
        });
      });
    }

    return {
      conceptId: c.id,
      label: c.label,
      traditionKey: homeKey,
      tradition: traditionLabel(homeKey),
      reading: c.reading || '',
      sameTradition: same,
      otherTraditions: other.slice(0, 4)
    };
  }

  function opposing(conceptId) {
    const c = conceptOf(conceptId);
    if (!c) return null;
    const againstKin = [];
    const seen = new Set();
    (c.kin || []).forEach(kid => {
      const k = conceptOf(kid);
      if (!k || seen.has(k.id)) return;
      if (k.category !== 'tension' && k.category !== 'stance') return;
      seen.add(k.id);
      againstKin.push({
        id: k.id,
        label: k.label,
        tradition: traditionLabel(k.tradition),
        category: k.category,
        reading: k.reading || ''
      });
    });

    const axes = [];
    const links = (BEL() && typeof BEL().axesForConcept === 'function')
      ? BEL().axesForConcept(c.id) : [];
    links.forEach(link => {
      const spec = spectrumOf(link.id);
      if (!spec) return;
      const lean = typeof link.lean === 'number' ? link.lean : 0;
      const opp = (BEL() && typeof BEL().opposing === 'function')
        ? BEL().opposing(link.id, lean) : null;
      axes.push({
        id: link.id,
        title: spec.title,
        left: spec.left,
        right: spec.right,
        note: link.note || '',
        against: opp ? { name: opp.name, capsule: opp.capsule || '' } : null
      });
    });

    const counters = [];
    (c.sources || []).forEach(src => {
      const w = resolveSource(src);
      if (!w || !w.counter) return;
      counters.push({
        workId: w.id,
        title: w.title,
        author: w.author || '',
        counter: w.counter,
        note: src.note || w.note || ''
      });
    });

    return {
      conceptId: c.id,
      label: c.label,
      againstKin,
      axes,
      counters
    };
  }

  function analyze(conceptId) {
    const c = conceptOf(conceptId);
    if (!c) return null;
    const evidence = (c.sources || []).map(src => {
      const w = resolveSource(src);
      return {
        workId: w ? w.id : null,
        title: (w && w.title) || src.work || 'Source',
        author: (w && w.author) || src.author || '',
        note: src.note || ''
      };
    });
    const moves = (c.kin || []).map(kid => {
      const k = conceptOf(kid);
      if (!k) return null;
      return {
        id: k.id,
        label: k.label,
        tradition: traditionLabel(k.tradition),
        category: k.category
      };
    }).filter(Boolean);

    return {
      conceptId: c.id,
      label: c.label,
      claim: c.reading || '',
      turn: c.turn || '',
      evidence,
      moves
    };
  }

  function contemporary(conceptId) {
    const c = conceptOf(conceptId);
    if (!c) return null;
    const seeded = CONTEMPORARY[conceptId];
    const issues = (seeded && seeded.issues)
      ? seeded.issues.slice()
      : (c.turn ? [{ label: 'From this concept', prompt: c.turn }] : []);
    const quests = questsForConcept(conceptId).map(q => ({
      id: q.id,
      title: q.title,
      description: q.description || ''
    }));
    return {
      conceptId: c.id,
      label: c.label,
      issues,
      quests,
      fallbackTurn: c.turn || ''
    };
  }

  window.PalinodeConceptLenses = {
    CONTEMPORARY,
    cultural,
    opposing,
    analyze,
    contemporary,
    conceptOf,
    traditionLabel
  };
})();
