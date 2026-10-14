// Section titles are fixed on purpose: users edit content, never headings.
export const TITLES = {
  summary: 'Professional Summary',
  skills: 'Technical Skills',
  experience: 'Professional Experience',
  projects: 'Technical Projects',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements',
};

// Industry-standard, ATS-friendly order.
export const ORDER = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'];
const OPTIONAL = ['certifications', 'achievements'];

export const emptyItems = {
  skills: () => ({ category: '', items: '' }),
  experience: () => ({ company: '', role: '', location: '', dates: '', bullets: '' }),
  projects: () => ({ name: '', tech: '', dates: '', bullets: '' }),
  education: () => ({ institution: '', degree: '', dates: '', score: '' }),
  certifications: () => ({ name: '', issuer: '', date: '' }),
};

export const initialData = {
  profile: { name: 'Your Name', phone: '', email: '', linkedin: '', github: '' },
  summary: '',
  skills: [{ category: 'Languages', items: '' }],
  experience: [emptyItems.experience()],
  projects: [emptyItems.projects()],
  education: [emptyItems.education()],
  certifications: [emptyItems.certifications()],
  achievements: '',
  enabled: { certifications: false, achievements: false },
  letter: { company: '', manager: '', role: '', body: '' },
  jobDescription: '',
  settings: { font: 'calibri', justify: false, contactShow: { phone: 'value', email: 'value', linkedin: 'value', github: 'value' } },
};

export const lines = (s) =>
  (s || '').split('\n').map((l) => l.replace(/^[\s•\-*]+/, '').trim()).filter(Boolean);

const withProtocol = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
const stripProtocol = (u) => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

export const CONTACT_LABELS = { phone: 'Phone', email: 'Email', linkedin: 'LinkedIn', github: 'GitHub' };

// Header contact items. Each field is shown either as its real value or a fixed label;
// the hyperlink always points at the real value.
export function contactItems(p, show = {}) {
  const shown = (k, value) => (show[k] === 'label' ? CONTACT_LABELS[k] : value);
  const out = [];
  if (p.phone) out.push({ text: shown('phone', p.phone), href: `tel:${p.phone.replace(/[^\d+]/g, '')}` });
  if (p.email) out.push({ text: shown('email', p.email), href: `mailto:${p.email}` });
  if (p.linkedin) out.push({ text: shown('linkedin', stripProtocol(p.linkedin)), href: withProtocol(p.linkedin) });
  if (p.github) out.push({ text: shown('github', stripProtocol(p.github)), href: withProtocol(p.github) });
  return out;
}

// Sections that should appear, in order.
export function visibleSections(d) {
  return ORDER.filter((k) => {
    if (OPTIONAL.includes(k) && !d.enabled[k]) return false;
    if (k === 'summary' || k === 'achievements') return lines(d[k]).length > 0;
    return d[k].length > 0;
  });
}
