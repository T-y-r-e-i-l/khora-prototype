# Palinode

A note and journaling app that reads your writing the way Grammarly does — but instead of grammar, it surfaces the philosophical traditions your thinking is already inside, the places where an argument strains, and the words doing more work than they have defined.

Open `index.html` in a browser. No build step, no server, no dependencies — classic `<script>` tags, no ES modules and no `fetch`, so `file://` works completely, media and all.

If you want a server anyway — for editor live preview, or to open the 3D view on a phone on the same wifi — `./serve.sh` prints both URLs and serves the folder.

---

## What it does

**Live philosophical reading.** As you type, the engine underlines spans in the text and raises cards in the right rail. Five lanes, each with its own colour, mapped onto Grammarly's:

| Palinode lane | Grammarly analogue | What it catches |
|---|---|---|
| **Resonance** (amber) | Engagement | A tradition your passage is already speaking to |
| **Tension** (red) | Correctness | Hasty generalisation, false dilemma, is–ought slips, internal contradiction |
| **Clarity** (violet) | Clarity | Contested terms used as though settled — *authentic*, *success*, *freedom* |
| **Stance** (yellow) | Delivery / tone | Hedging density, displaced agency, unearned certainty, and self-implication as a noted strength |
| **Lineage** (teal) | — (Palinode-specific) | A parallel from a tradition other than the one you are writing from |

Every card gives three things: the **reading** (what a philosopher would say about this passage), the **turn** (a question handed back to you), and the **sources** — the works to read against, including the ones that disagree with each other.

**Reflective Depth score.** A 0–100 ring over five sub-metrics — Inquiry, Grounding, Self-implication, Range, Dialectic — the analogue of Grammarly's performance score, measuring thinking rather than prose.

**Readings.** The side panel has two tabs, in the Khora manner. **Insights** is the live reading of your text; **Readings** is the shelf it builds — every work your note has raised, ordered by how many insights point at it, showing which passages raised it and whether the full text is free.

**Reading Room.** Opening a work takes over the centre column with what it argues, where to start, who answers it, why your own note raised it, and links to the actual text. Clicking any "why" entry returns you to the note with that insight open.

**Exploration graph.** The heart of the thing. Your note sits at the centre of a force-directed field; what it touched radiates out labelled, what it did not sits one ring further as an unlabelled orb. Selecting anything expands the field from it and opens a card that leads with the concept's *question* rather than its definition, followed by a "Where this leads" feed. The graph grows as you explore and never dead-ends — when direct neighbours run out, it back-fills from the tradition and the neighbouring shelf.

The field is not only philosophy. **Your attachments are in it** — photographs and video appear as their own thumbnails held inside the glass rim rather than as orbs, links as teal nodes, each edged back to the note holding it. And **your other entries are in it**: any note that arrived at the same concept appears as a ringed amber node, with a panel that names what you arrived at twice and a button to open it. A journal of one note is a wheel; a journal of fifty is a map of your own recurrences.

The load-bearing edge is **work → concept**. Your note reaches a book through one idea, and the book carries you back out to ideas your note never contained. A note about overwork reaches Wu Wei, Wu Wei cites the *Daodejing*, and the *Daodejing* opens onto mono no aware and Kuki Shūzō — two hops from a complaint about a deadline into Japanese aesthetics.

**2D or 3D.** A toggle in the exploring header switches between two readings of the same graph. Both drive one selection through `PalinodeGraph.model`, so switching never loses your place — descend three levels in 3D, flip to 2D, and you are on the same node with the same trail.

The **3D view** follows the Explore view on palinode.org: the node you are in sits at the centre as a lit world with a ring; everything it leads to orbits it on a dotted path, each world carrying a billboarded two-line label. Click a world to centre it, click empty space to go back, drag to orbit, scroll to dolly. Worlds take their category colour from the same palette as the 2D orbs, and an attached photograph is texture-mapped onto its own world.

**Selecting a world centres it and shows its connections.** No flight and no swap choreography: the camera holds whatever angle and distance you left it at, the new centre appears at the middle of the frame, and its connections fade up around it on the dotted path. An earlier version flew the camera out to the clicked world before re-origining the scene; it was more motion than the interaction needed.

**No side sheet in 3D.** What a world is, and what you can do about it, floats on a card beneath the world itself, clearing the sphere by its actual projected radius at any zoom. The card carries identity, one line of substance — for a concept, its question — and its actions. It carries no "where this leads" list, because the orbit already is that list.

Three.js is **vendored locally** (`assets/vendor/three.min.js`, r149 UMD) rather than pulled from a CDN, so the app keeps its no-build, works-offline, open-index.html-and-go property. r149 is the last line with a UMD build, which matters because `file://` blocks ES module scripts.

**Focus.** Opening a node centres it and dims everything it does not touch, so the eye keeps hold of what it just opened while the field grows around it. Three things make the move readable rather than jarring: the node is frozen the instant it is selected, so the camera has a stationary target instead of chasing something the physics is still throwing around; new arrivals are placed on a ring at their resting distance, fanned by angle, so they barely travel once they appear; and the re-settle is a gentle nudge rather than a full reheat. Measured across selections, pre-existing nodes shift 2–6px relative to each other while the camera pans, and the approach to centre never reverses.

**Save to note / Write on this.** Anything found can be saved onto the note that led you to it, or turned straight into a new note seeded with its question. Discoveries belong to the entry that prompted them, so they are still there when you come back to it.

**Constellation.** A miniature of the graph in the side panel, and the door into it.

**Daily prompts.** 60 prompts, each carrying the tradition and text that generated it. **Three skips per day**, tracked by pips; after the third, the prompt stands until tomorrow. "Reset today" in the left rail rolls the day forward for testing.

**The note as a container.** Below the writing surface, each note holds what it gathered: photos, video and audio (drag them in or use Add media), external links as cards, and the concepts and works saved out of the graph. Binaries live in IndexedDB rather than localStorage — a single photograph would exhaust the latter — and survive reloads.

**Notes.** Autosaved, searchable across body text and detected concepts, listed with concept colour dots. Each note records which concepts it touched, which is what lets the graph link entries to each other; notes written before that was recorded are re-read once, on demand.

**Sharing.** Two routes, because they carry different things.

A **share link** encodes the note into the URL fragment: text, external links, and saved concepts and works. Saved items travel as bare ids, since the recipient's copy already has the corpus to resolve them into full cards — a note with a dozen saved items still fits in about a kilobyte. Nothing is uploaded, and the share sheet states exactly what the link carries and how large it is.

**Export with media** writes a single self-contained HTML file with photos, video and audio embedded as data URIs. That file opens in any browser with nothing else present, and is the route to use when the media matters.

### Why media cannot go in the link

A URL cannot carry a photograph. Fragment-encoded sharing is what makes Palinode serverless, and the cost of that is binary attachments: a 2 MB image becomes a 2.7 MB link that no messaging app will paste intact. Rather than silently dropping media or producing an unusable link, the share sheet counts what is being left behind and points at the export. Real public links with media would need hosting — object storage for the binaries and a short id in the URL — which is the one thing here that cannot be done without a server.

---

## Corpus

Cross-traditional by design. 45 concepts spanning Ancient Greek, Hellenistic, Modern European, Existentialist, Analytic, Critical Theory, Buddhist, Daoist, Confucian, Vedic, Islamic & Sufi, African (Akan and Ubuntu), Japanese aesthetics, and feminist / care ethics — plus 8 fallacy and logical-tension patterns, 14 contested terms, and 4 stance markers.

Sources cite real works and deliberately include rival positions: Kant against Mill, Nozick against Rawls, Kuhn against Popper, Beauvoir correcting Sartre.

`library.js` resolves all 131 citations onto 90 distinct works, each with its date, tradition, argument, reading path, principal counter-reading, and rights status.

### On full text

Palinode does not reproduce copyrighted text, and does not ship bootleg translations of anything. Works are marked one of two ways:

- **Full text free** — out of copyright, so the Reading Room links straight to complete texts at Project Gutenberg and the Internet Archive.
- **In copyright** — Palinode carries the argument and the reading path but never the text, and links to library copies and the Stanford Encyclopedia.

Everything you read inside the app is Palinode's own account of a work, not a quotation from it.

---

## Files

```
index.html              markup and layout
assets/css/app.css      visual system (Khora-derived)
assets/js/corpus.js     concepts, fallacies, loaded terms, stance markers
assets/js/library.js    90 works: argument, reading path, rights, links
assets/js/graph.js      exploration graph: model, physics, 2D canvas, discovery loop
assets/js/graph3d.js    3D orbital view over the same model
assets/vendor/three.min.js  three.js r149 (UMD), vendored for offline use
assets/js/prompts.js    60 daily prompts
assets/js/engine.js     analysis engine behind a swappable interface
assets/js/media.js      IndexedDB store for photos, video and audio
assets/js/store.js      persistence, attachments, saved items, share encoding
assets/js/app.js        controller
```

## Swapping in a real model

`engine.js` exposes a single contract:

```js
PalinodeEngine.analyze(text) -> Promise<Analysis>
```

To move from rules to an LLM, implement the same async `analyze`, return the same `Analysis` shape (`insights`, `concepts`, `metrics`, `stats`), and register it:

```js
PalinodeEngine.use(myClaudeBackedProvider);
```

Nothing in the UI reads anything but that contract, so no view code changes. The rule engine stays as the offline fallback.

---

## Visual direction

Taken from the Khora search interface: an ambient dark field of drifting colour under heavy blur, filament-thin rules, glass surfaces at low opacity, Lora for thought and Nunito for interface, uppercase letterspaced micro-controls, and category colour carried by small luminous orbs rather than blocks of fill.

**Orbs** are a CSS reading of MetalForge's `orb-glass-liquid` shader: a pearl core, saturated liquid veins turning slowly inside, and a luminous shell rim that is the brightest part of the sphere. The reference sits on cream, where the body can be nearly white; here it sits on near-black and the hue is load-bearing — colour is how every category is read — so the balance is inverted, with the brand colour carrying the body and the pearl reserved for the core and the rim. Veins are mixed in `oklab` so darkening keeps chroma instead of draining to grey. Below about 10px the layered treatment is dropped for a single gradient and a rim: the detail is invisible at that size, and skipping it keeps a hundred-node field cheap. Layout, the inline-underline mechanic, the right-rail card stack, accept/dismiss, and the score ring come from Grammarly, where Khora has no equivalent.

---

## Known limits

The engine is pattern-based, so it reads surface signals, not arguments — it can pick up "freedom" in a sentence about a parking space. That is the expected cost of a deterministic v1 and the reason the provider interface exists.
