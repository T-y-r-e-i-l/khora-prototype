/* Inject shared left nav. Set data-section + data-page on <body>. */
(function () {
  const prefix = document.body.dataset.prefix || '.';
  const section = document.body.dataset.section || 'home';
  const page = document.body.dataset.page || 'index';

  const foundations = [
    ['tokens', 'Tokens'],
    ['color', 'Color'],
    ['typography', 'Typography'],
    ['spacing', 'Spacing'],
    ['layout', 'Layout'],
    ['elevation', 'Elevation'],
    ['motion', 'Motion'],
    ['icons', 'Icons'],
    ['accessibility', 'Accessibility'],
    ['voice-and-tone', 'Voice & tone'],
  ];

  const components = [
    ['index', 'Overview'],
    ['button', 'Button'],
    ['text-field', 'Text field'],
    ['chip', 'Chip'],
    ['orb', 'Orb'],
    ['segmented-control', 'Segmented control'],
    ['modal', 'Modal'],
    ['toast', 'Toast'],
    ['tooltip', 'Tooltip'],
    ['empty-state', 'Empty state'],
    ['sidenav', 'Sidenav'],
    ['fab', 'FAB'],
    ['insight-side-sheet', 'Insight side sheet'],
    ['insight-card', 'Insight card'],
    ['note-item', 'Note item'],
    ['select', 'Select'],
    ['progress', 'Progress'],
    ['profile', 'Profile'],
    ['profile-radar', 'Profile radar'],
    ['profile-axis', 'Profile axis'],
    ['spectrum-track', 'Spectrum track'],
  ];

  const patterns = [
    ['app-shell', 'App shell'],
    ['explore-graph', 'Explore graph'],
  ];

  function link(href, label, on) {
    return `<a class="ds-link${on ? ' on' : ''}" href="${href}">${label}</a>`;
  }

  function block(title, items, folder) {
    const links = items.map(([id, label]) => {
      const href = `${prefix}${folder}/${id}.html`;
      const isOn = section === folder && page === id;
      return link(href, label, isOn);
    }).join('');
    return `<div class="ds-sec">${title}</div>${links}`;
  }

  const homeOn = section === 'home';
  const nav = document.createElement('nav');
  nav.className = 'ds-nav';
  nav.setAttribute('aria-label', 'Design system');
  nav.innerHTML = `
    <a class="ds-brand" href="${prefix}index.html">
      <strong>Khora</strong>
      <span>DS</span>
    </a>
    <p class="ds-tagline">Foundations and components that already ship in the product.</p>
    ${link(prefix + 'index.html', 'Home', homeOn)}
    ${block('Foundations', foundations, 'foundations')}
    ${block('Components', components, 'components')}
    ${block('Patterns', patterns, 'patterns')}
  `;

  document.body.prepend(nav);
})();
