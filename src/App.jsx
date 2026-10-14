import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Preview from './Preview.jsx';
import LetterPreview from './LetterPreview.jsx';
import DateField from './dates.jsx';
import { BulletEditor, Grip, move, useSortable } from './sortable.jsx';
import { analyze } from './ats.js';
import { generateLetter } from './letter.js';
import { TITLES, ORDER, CONTACT_LABELS, emptyItems, initialData } from './model.js';
import { buildDocx } from './exportDocx.js';
import { FONTS, getFont } from './fonts.js';

const KEY = 'resume-builder-data-v1';
const A4_PX = (297 * 96) / 25.4;

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        ...initialData, ...saved,
        enabled: { ...initialData.enabled, ...saved.enabled },
        letter: { ...initialData.letter, ...saved.letter },
        settings: {
          ...initialData.settings, ...saved.settings,
          contactShow: { ...initialData.settings.contactShow, ...(saved.settings || {}).contactShow },
        },
      };
    }
  } catch { /* ignore */ }
  return initialData;
};

const download = (blob, name) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

const Store = createContext(null);

// App mark: a resume page with a folded corner, text lines and a check.
function Logo() {
  return (
    <svg className="logo" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--accent)" />
      <path d="M12 9h11l6 6v16a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 11 31V10.5A1.5 1.5 0 0 1 12 9z" fill="#fff" />
      <path d="M15 19h10M15 23h7" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
      <path d="M15.5 28l2.4 2.4 5-5.2" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Field({ label, value, onChange, placeholder, multiline, rows = 3 }) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <label className="field">
      <span>{label}</span>
      <Tag value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={multiline ? rows : undefined} />
    </label>
  );
}

function Card({ title, hint, toggle, children }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{title}</h3>
        {toggle}
      </div>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </div>
  );
}

function List({ sec, addLabel, compact = false, children }) {
  const { d, setItem, addItem, removeItem, moveItem } = useContext(Store);
  const sort = useSortable((f, t) => moveItem(sec, f, t));
  return (
    <>
      {d[sec].map((it, i) => {
        const { rowProps, handleProps } = sort(i);
        return (
          compact ? (
            <div className="item compact" key={i} data-row {...rowProps}>
              {d[sec].length > 1 ? <Grip {...handleProps} /> : <span className="grip off" />}
              <div className="compact-body">{children(it, (k, v) => setItem(sec, i, k, v))}</div>
              <button className="x-btn" aria-label="Remove" title="Remove" onClick={() => removeItem(sec, i)}>×</button>
            </div>
          ) : (
          <div className="item" key={i} data-row {...rowProps}>
            <div className="item-bar">
              {d[sec].length > 1 ? <Grip {...handleProps} /> : <span className="grip off" />}
              <span className="item-no">#{i + 1}</span>
            </div>
            {children(it, (k, v) => setItem(sec, i, k, v))}
            <div className="item-foot">
              <button className="remove-btn" onClick={() => removeItem(sec, i)}>Remove</button>
            </div>
          </div>
          )
        );
      })}
      <button className="add" onClick={() => addItem(sec)}>+ {addLabel}</button>
    </>
  );
}

function AtsPanel({ d, set }) {
  const result = useMemo(() => analyze(d.jobDescription, d), [d]);
  return (
    <Card title="ATS keyword match" hint="Paste a job description to see which of its keywords your resume already covers. Runs locally in your browser.">
      <Field multiline rows={5} label="Job description" value={d.jobDescription} onChange={(v) => set({ jobDescription: v })} placeholder="Paste the job description here…" />
      {result && (
        <div className="ats">
          <div className="ats-score">
            <div className="meter"><span style={{ width: `${result.score}%` }} /></div>
            <b>{result.score}%</b>
          </div>
          <p className="ats-note">{result.matched.length} of {result.matched.length + result.missing.length} keywords found</p>
          {result.missing.length > 0 && (
            <>
              <div className="chips-label">Missing - add only what is true for you</div>
              <div className="chips">{result.missing.map((k) => <span className="chip miss" key={k}>{k}</span>)}</div>
            </>
          )}
          {result.matched.length > 0 && (
            <>
              <div className="chips-label">Matched</div>
              <div className="chips">{result.matched.map((k) => <span className="chip hit" key={k}>{k}</span>)}</div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// Small, neutral indicator of how long the resume is, measured from the A4 preview.
function FitBadge({ d }) {
  const [ratio, setRatio] = useState(1);
  useEffect(() => {
    const measure = () => {
      const el = document.getElementById('resume-page');
      if (el) setRatio(el.scrollHeight / A4_PX);
    };
    const id = requestAnimationFrame(measure);
    document.fonts?.ready.then(measure);
    return () => cancelAnimationFrame(id);
  }, [d]);
  const fits = ratio <= 1.005;
  return (
    <span className={`badge ${fits ? 'ok' : 'over'}`} title="Approximate, measured from the A4 preview">
      <i />{fits ? 'Fits 1 page' : `≈ ${ratio.toFixed(1)} pages`}
    </span>
  );
}

function DownloadMenu({ busy, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);
  return (
    <div className="dl" ref={ref}>
      <button className="primary" disabled={!!busy} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {busy ? 'Preparing…' : 'Download'}
        <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="dl-menu" role="menu">
          <button role="menuitem" onClick={() => { setOpen(false); onPick('pdf'); }}><b>PDF</b><small>Best for sharing and printing</small></button>
          <button role="menuitem" onClick={() => { setOpen(false); onPick('docx'); }}><b>DOCX</b><small>Editable in Word</small></button>
        </div>
      )}
    </div>
  );
}

function StyleCard({ d, setSetting }) {
  return (
    <Card title="Style" hint="Font and alignment apply to the preview, DOCX and PDF. Sizes stay fixed to industry standard.">
      <label className="field">
        <span>Font</span>
        <select value={d.settings.font} onChange={(e) => setSetting('font', e.target.value)}>
          {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label} - {f.feel}</option>)}
        </select>
      </label>
      {getFont(d.settings.font).install && (
        <p className="note">Word needs {getFont(d.settings.font).label} installed to show it in the DOCX; the PDF always embeds it.</p>
      )}
      <div className="field"><span>Text alignment</span>
        <div className="seg">
          <button className={!d.settings.justify ? 'on' : ''} onClick={() => setSetting('justify', false)}>Left</button>
          <button className={d.settings.justify ? 'on' : ''} onClick={() => setSetting('justify', true)}>Justified</button>
        </div>
      </div>
    </Card>
  );
}

export default function App() {
  const [d, setD] = useState(load);
  const [busy, setBusy] = useState('');
  const [tab, setTab] = useState('resume');

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ }
  }, [d]);

  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const setSetting = (k, v) => set({ settings: { ...d.settings, [k]: v } });
  const setShow = (k, v) => setSetting('contactShow', { ...d.settings.contactShow, [k]: v });
  const setProfile = (k, v) => set({ profile: { ...d.profile, [k]: v } });
  const setLetter = (k, v) => set({ letter: { ...d.letter, [k]: v } });
  const setItem = (sec, i, k, v) =>
    set({ [sec]: d[sec].map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) });
  const addItem = (sec) => set({ [sec]: [...d[sec], emptyItems[sec]()] });
  const removeItem = (sec, i) => set({ [sec]: d[sec].filter((_, idx) => idx !== i) });
  const moveItem = (sec, from, to) => set({ [sec]: move(d[sec], from, to) });

  const exportAs = async (type) => {
    setBusy(type);
    try {
      const base = (d.profile.name || 'Resume').replace(/\s+/g, '_');
      if (tab === 'resume') {
        if (type === 'docx') download(await buildDocx(d), `${base}_Resume.docx`);
        else download(await (await import('./exportPdf.jsx')).buildPdf(d), `${base}_Resume.pdf`);
      } else {
        const m = await import('./exportLetter.jsx');
        if (type === 'docx') download(await m.buildLetterDocx(d), `${base}_Cover_Letter.docx`);
        else download(await m.buildLetterPdf(d), `${base}_Cover_Letter.pdf`);
      }
    } finally { setBusy(''); }
  };

  const toggle = (k) => (
    <label className="switch">
      <input type="checkbox" checked={d.enabled[k]} onChange={(e) => set({ enabled: { ...d.enabled, [k]: e.target.checked } })} />
      <span>Include</span>
    </label>
  );

  const editors = {
    summary: () => (
      <Card title={TITLES.summary} hint="2–4 lines: who you are, years of experience, strongest skills.">
        <Field multiline rows={4} value={d.summary} onChange={(v) => set({ summary: v })} />
      </Card>
    ),
    skills: () => (
      <Card title={TITLES.skills} hint="Group skills by category, comma separated.">
        <List compact sec="skills" addLabel="Add skill group">
          {(it, up) => (
            <div className="grid2">
              <Field label="Category" value={it.category} onChange={(v) => up('category', v)} placeholder="Cloud & DevOps" />
              <Field label="Skills" value={it.items} onChange={(v) => up('items', v)} placeholder="AWS, Docker, Kubernetes" />
            </div>
          )}
        </List>
      </Card>
    ),
    experience: () => (
      <Card title={TITLES.experience} hint="One bullet per line; pasted text is converted to points. Drag the grip to reorder jobs.">
        <List sec="experience" addLabel="Add role">
          {(it, up) => (
            <>
              <div className="grid2">
                <Field label="Company" value={it.company} onChange={(v) => up('company', v)} />
                <Field label="Role" value={it.role} onChange={(v) => up('role', v)} />
                <Field label="Location" value={it.location} onChange={(v) => up('location', v)} />
              </div>
              <DateField range label="Dates" value={it.dates} onChange={(v) => up('dates', v)} />
              <BulletEditor label="Bullets" value={it.bullets} onChange={(v) => up('bullets', v)} placeholder="Led… Built… Improved… (add numbers)" />
            </>
          )}
        </List>
      </Card>
    ),
    projects: () => (
      <Card title={TITLES.projects} hint="Side projects you built outside of work.">
        <List sec="projects" addLabel="Add project">
          {(it, up) => (
            <>
              <div className="grid2">
                <Field label="Project name" value={it.name} onChange={(v) => up('name', v)} />
                <Field label="Tech stack" value={it.tech} onChange={(v) => up('tech', v)} placeholder="React, Node.js, PostgreSQL" />
              </div>
              <DateField label="Date" value={it.dates} onChange={(v) => up('dates', v)} />
              <BulletEditor label="Bullets" value={it.bullets} onChange={(v) => up('bullets', v)} />
            </>
          )}
        </List>
      </Card>
    ),
    education: () => (
      <Card title={TITLES.education}>
        <List sec="education" addLabel="Add education">
          {(it, up) => (
            <>
              <div className="grid2">
                <Field label="Institution" value={it.institution} onChange={(v) => up('institution', v)} />
                <Field label="Degree" value={it.degree} onChange={(v) => up('degree', v)} placeholder="B.Tech, Computer Science" />
              </div>
              <DateField range label="Dates" value={it.dates} onChange={(v) => up('dates', v)} />
              <Field label="Score (shown under dates)" value={it.score} onChange={(v) => up('score', v)} placeholder="CGPA: 8.7 / 10" />
            </>
          )}
        </List>
      </Card>
    ),
    certifications: () => (
      <Card title={TITLES.certifications} toggle={toggle('certifications')}>
        {d.enabled.certifications && (
          <List sec="certifications" addLabel="Add certification">
            {(it, up) => (
              <>
                <div className="grid2">
                  <Field label="Name" value={it.name} onChange={(v) => up('name', v)} />
                  <Field label="Issuer" value={it.issuer} onChange={(v) => up('issuer', v)} />
                </div>
                <DateField label="Date" value={it.date} onChange={(v) => up('date', v)} />
              </>
            )}
          </List>
        )}
      </Card>
    ),
    achievements: () => (
      <Card title={TITLES.achievements} toggle={toggle('achievements')}>
        {d.enabled.achievements && (
          <BulletEditor label="Achievements" value={d.achievements} onChange={(v) => set({ achievements: v })} />
        )}
      </Card>
    ),
  };

  const resumeEditor = (
    <>
      <Card title="Your Details">
        <Field label="Full name" value={d.profile.name} onChange={(v) => setProfile('name', v)} />
        <div className="grid2">
          {[
            ['phone', 'Phone', '+91 98765 43210'],
            ['email', 'Email', 'you@example.com'],
            ['linkedin', 'LinkedIn URL', 'linkedin.com/in/yourname'],
            ['github', 'GitHub URL', 'github.com/yourname'],
          ].map(([k, label, ph]) => (
            <div key={k}>
              <Field label={label} value={d.profile[k]} onChange={(v) => setProfile(k, v)} placeholder={ph} />
              <div className="show-row">
                <span>Show as</span>
                <div className="seg mini">
                  <button className={d.settings.contactShow[k] !== 'label' ? 'on' : ''} onClick={() => setShow(k, 'value')}>Value</button>
                  <button className={d.settings.contactShow[k] === 'label' ? 'on' : ''} onClick={() => setShow(k, 'label')}>{CONTACT_LABELS[k]}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <StyleCard d={d} setSetting={setSetting} />
      {ORDER.map((k) => <React.Fragment key={k}>{editors[k]()}</React.Fragment>)}
      <AtsPanel d={d} set={set} />
    </>
  );

  const letterEditor = (
    <>
      <Card title="Cover letter details" hint="Header, font and alignment come from your resume settings.">
        <div className="grid2">
          <Field label="Company" value={d.letter.company} onChange={(v) => setLetter('company', v)} />
          <Field label="Role applying for" value={d.letter.role} onChange={(v) => setLetter('role', v)} />
          <Field label="Hiring manager (optional)" value={d.letter.manager} onChange={(v) => setLetter('manager', v)} />
        </div>
        <button
          className="add"
          onClick={() => {
            if (!d.letter.body.trim() || window.confirm('Replace the current letter text with a new draft?')) {
              setLetter('body', generateLetter(d, d.letter));
            }
          }}
        >
          Generate draft from my resume
        </button>
      </Card>
      <Card title="Letter text" hint="Separate paragraphs with a blank line. Edit freely.">
        <Field multiline rows={18} value={d.letter.body} onChange={(v) => setLetter('body', v)} />
      </Card>
    </>
  );

  return (
    <Store.Provider value={{ d, setItem, addItem, removeItem, moveItem }}>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <Logo />
            <b>Resume Builder</b>
          </div>
          <div className="seg tabs">
            <button className={tab === 'resume' ? 'on' : ''} onClick={() => setTab('resume')}>Resume</button>
            <button className={tab === 'letter' ? 'on' : ''} onClick={() => setTab('letter')}>Cover Letter</button>
          </div>
          <div className="actions">
            {tab === 'resume' && <FitBadge d={d} />}
            <DownloadMenu busy={busy} onPick={exportAs} />
          </div>
        </header>
        <main className="split">
          <div className="editor">{tab === 'resume' ? resumeEditor : letterEditor}</div>
          <div className="preview-pane">{tab === 'resume' ? <Preview data={d} /> : <LetterPreview data={d} />}</div>
        </main>
      </div>
    </Store.Provider>
  );
}
