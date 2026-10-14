import { lines } from './model.js';

const trimDot = (s) => s.replace(/[.\s]+$/, '');

// Template-based draft built from the resume data. No network, no AI.
export function generateLetter(d, { company, manager, role }) {
  const co = company.trim() || 'your company';
  const job = role.trim();
  const name = d.profile.name.trim();

  const summary = lines(d.summary)[0];
  const exp = d.experience.find((e) => e.company || e.bullets);
  const proj = d.projects.find((p) => p.name);
  const skills = d.skills.flatMap((s) => s.items.split(',').map((x) => x.trim()).filter(Boolean)).slice(0, 8);

  const p1 = [
    `I am writing to express my interest in the ${job ? `${job} position` : 'open position'} at ${co}.`,
    summary ? trimDot(summary) + '.' : '',
  ].filter(Boolean).join(' ');

  const highlights = exp ? lines(exp.bullets).slice(0, 2).map(trimDot) : [];
  const p2 = exp && highlights.length
    ? `${exp.role ? `As ${/^[aeiou]/i.test(exp.role) ? 'an' : 'a'} ${exp.role}` : 'In my recent role'}${exp.company ? ` at ${exp.company}` : ''}, my work included: ${highlights.join('; ')}.`
    : '';

  const p3 = [
    skills.length ? `My technical toolkit includes ${skills.join(', ')}.` : '',
    proj ? `Outside of work, I built ${proj.name}${proj.tech ? ` using ${proj.tech}` : ''}, which reflects the way I like to learn and ship.` : '',
  ].filter(Boolean).join(' ');

  const p4 = `I would welcome the opportunity to discuss how my background can contribute to ${co}. Thank you for your time and consideration.`;

  return [
    `Dear ${manager.trim() || 'Hiring Manager'},`,
    p1, p2, p3, p4,
    `Sincerely,\n${name}`,
  ].filter(Boolean).join('\n\n');
}

// Paragraph blocks; single newlines inside a block become line breaks.
export const letterBlocks = (body) =>
  (body || '').split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((b) => b.length);

export const letterDate = () =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
