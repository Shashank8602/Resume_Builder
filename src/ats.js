// Local, rule-based keyword matching between a job description and the resume. No network calls.
const STOP = new Set(`a an the and or but if then else of to in on at by for with from as is are was were be been being this that these those it its
you your we our they their will would can could should may might must shall do does did have has had not no yes so than too very also into over under
about across after before between during through up down out off per via etc including include includes etc able ability strong excellent good great
experience experienced years year work working works team teams role roles job position candidate candidates looking seeking required requirements
requirement preferred plus bonus responsibilities responsibility duties skills skill knowledge understanding using use used based new
company business opportunity environment passion passionate ideal join help helping within who what when where why how all any each both more most
other such own same only just well etc related relevant proven demonstrated familiarity familiar hands strong deep solid minimum least need needs needed ensure strive collaborate collaborating`.split(/\s+/));

// Multi-word terms worth matching as a unit.
const PHRASES = [
  'machine learning', 'deep learning', 'data science', 'data engineering', 'rest api', 'ci/cd', 'unit testing', 'test driven',
  'object oriented', 'design patterns', 'system design', 'microservices', 'cloud computing', 'project management', 'agile', 'scrum',
  'natural language processing', 'computer vision', 'version control', 'problem solving', 'cross functional', 'stakeholder management',
  'data structures', 'full stack', 'front end', 'back end', 'ui/ux', 'code review', 'big data', 'data analysis', 'data visualization',
];

const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9+#./\s-]/g, ' ');
const tokens = (s) => (norm(s).match(/[a-z][a-z0-9+#./-]*[a-z0-9+#]|[a-z]/g) || []).map((t) => t.replace(/^[./-]+|[./-]+$/g, ''));
const stem = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

function resumeText(d) {
  const p = d.profile;
  return [
    d.summary,
    ...d.skills.map((s) => `${s.category} ${s.items}`),
    ...d.experience.map((e) => `${e.company} ${e.role} ${e.bullets}`),
    ...d.projects.map((x) => `${x.name} ${x.tech} ${x.bullets}`),
    ...d.education.map((e) => `${e.institution} ${e.degree}`),
    ...(d.enabled.certifications ? d.certifications.map((c) => `${c.name} ${c.issuer}`) : []),
    d.enabled.achievements ? d.achievements : '',
    p.name,
  ].join('\n');
}

export function analyze(jd, d) {
  if (!jd.trim()) return null;
  const jdNorm = norm(jd);
  const counts = new Map();
  const display = new Map(); // stem -> first form seen, so "kubernetes" is not shown as "kubernete"
  const phraseWords = new Set();
  PHRASES.forEach((ph) => {
    const n = jdNorm.split(ph).length - 1;
    if (n > 0) {
      counts.set(ph, n + 1); // small boost so phrases rank high
      ph.split(' ').forEach((w) => phraseWords.add(stem(w)));
    }
  });
  tokens(jd).forEach((t) => {
    if (t.length < 2 || STOP.has(t) || /^\d+$/.test(t)) return;
    const k = stem(t);
    if (phraseWords.has(k)) return;
    if (!display.has(k)) display.set(k, t);
    counts.set(k, (counts.get(k) || 0) + 1);
  });

  const keywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([k]) => k);

  const rText = norm(resumeText(d));
  const rTokens = new Set(tokens(resumeText(d)).map(stem));
  const has = (k) => (k.includes(' ') ? rText.includes(k) : rTokens.has(k));

  const show = (k) => display.get(k) || k;
  const matched = keywords.filter(has).map(show);
  const missing = keywords.filter((k) => !has(k)).map(show);
  return { score: Math.round((matched.length / Math.max(keywords.length, 1)) * 100), matched, missing };
}
