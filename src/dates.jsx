
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR + 7 - 1970 }, (_, i) => String(THIS_YEAR + 6 - i));

// "June, 2026" / "June 2026" / "2026"  ->  { m, y }
function parsePart(s) {
  const t = (s || '').trim();
  const y = (t.match(/\d{4}/) || [''])[0];
  const m = MONTHS.find((n) => t.toLowerCase().startsWith(n.toLowerCase())) || '';
  return { m, y };
}

function parse(value, range) {
  const v = (value || '').trim();
  if (!range) return { start: parsePart(v), end: { m: '', y: '' }, present: false };
  const [a = '', b = ''] = v.split(/\s+[–—-]\s+/);
  return { start: parsePart(a), end: parsePart(b), present: /present/i.test(b) };
}

const fmt = ({ m, y }) => (y ? (m ? `${m}, ${y}` : y) : '');

function compose(st, range) {
  if (!range) return fmt(st.start);
  const a = fmt(st.start);
  const b = st.present ? 'Present' : fmt(st.end);
  return a && b ? `${a} – ${b}` : a || b;
}

function MonthYear({ part, onChange, label, disabled }) {
  return (
    <>
      <select aria-label={`${label} month`} value={part.m} disabled={disabled} onChange={(e) => onChange({ ...part, m: e.target.value })}>
        <option value="">Month</option>
        {MONTHS.map((m) => <option key={m}>{m}</option>)}
      </select>
      <select aria-label={`${label} year`} value={part.y} disabled={disabled} onChange={(e) => onChange({ ...part, y: e.target.value })}>
        <option value="">Year</option>
        {YEARS.map((y) => <option key={y}>{y}</option>)}
      </select>
    </>
  );
}

// Month/year pickers that write a consistently formatted string, with a "Present" shortcut.
export default function DateField({ label, value, onChange, range = false }) {
  const st = parse(value, range);
  const update = (patch) => onChange(compose({ ...st, ...patch }, range));
  return (
    <div className="field">
      <span>{label}</span>
      <div className="date-row">
        <MonthYear part={st.start} onChange={(start) => update({ start })} label="Start" />
        {range && (
          <>
            <em>to</em>
            <MonthYear part={st.present ? { m: '', y: '' } : st.end} disabled={st.present} onChange={(end) => update({ end })} label="End" />
          </>
        )}
      </div>
      {range && (
        <label className="check">
          <input type="checkbox" checked={st.present} onChange={(e) => update({ present: e.target.checked })} />
          I currently work / study here (Present)
        </label>
      )}
    </div>
  );
}
