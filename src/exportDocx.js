import {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, TabStopType, AlignmentType,
  LevelFormat, BorderStyle,
} from 'docx';
import { getFont } from './fonts.js';
import { TITLES, contactItems, lines, visibleSections } from './model.js';

const BODY = 21; // half-points: 10.5pt
const HEAD = 24; // 12pt
const NAME = 40; // 20pt
const RIGHT_TAB = 10466; // A4 width 11906 - 2 * 720 margin

let FONT = 'Calibri';
const run = (text, o = {}) => new TextRun({ text, font: FONT, size: BODY, ...o });
const tabbed = (children) => new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
  spacing: { before: 60 },
  children,
});

export async function buildDocx(d) {
  FONT = getFont(d.settings.font).docx;
  const jc = d.settings.justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT;
  const kids = [];
  kids.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [run(d.profile.name, { bold: true, size: NAME })],
  }));

  const parts = [];
  contactItems(d.profile, d.settings.contactShow).forEach((c, i) => {
    if (i > 0) parts.push(run('  |  '));
    parts.push(new ExternalHyperlink({
      link: c.href,
      children: [run(c.text, { color: '0563C1', underline: {} })],
    }));
  });
  kids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: parts }));

  const heading = (k) => new Paragraph({
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
    children: [run(TITLES[k].toUpperCase(), { bold: true, size: HEAD })],
  });
  const bullets = (t) => lines(t).map((b) => new Paragraph({
    numbering: { reference: 'bul', level: 0 },
    alignment: jc,
    children: [run(b)],
  }));

  const body = {
    summary: () => [new Paragraph({ alignment: jc, children: [run(lines(d.summary).join(' '))] })],
    skills: () => d.skills.filter((s) => s.category || s.items).map((s) =>
      new Paragraph({ alignment: jc, children: [run(s.category ? `${s.category}: ` : '', { bold: true }), run(s.items)] })),
    experience: () => d.experience.flatMap((e) => [
      tabbed([run(e.company, { bold: true }), run(e.location ? `, ${e.location}` : ''), run('\t'), run(e.dates)]),
      ...(e.role ? [new Paragraph({ children: [run(e.role, { italics: true })] })] : []),
      ...bullets(e.bullets),
    ]),
    projects: () => d.projects.flatMap((p) => [
      tabbed([run(p.name, { bold: true }), run(p.tech ? ' | ' : ''), run(p.tech, { italics: true }), run('\t'), run(p.dates)]),
      ...bullets(p.bullets),
    ]),
    education: () => d.education.flatMap((e) => [
      tabbed([run(e.institution, { bold: true }), run('\t'), run(e.dates)]),
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
        children: [run(e.degree), run('\t'), run(e.score)],
      }),
    ]),
    certifications: () => d.certifications.map((c) =>
      tabbed([run(c.name, { bold: true }), run(c.issuer ? `, ${c.issuer}` : ''), run('\t'), run(c.date)])),
    achievements: () => bullets(d.achievements),
  };

  visibleSections(d).forEach((k) => kids.push(heading(k), ...body[k]()));

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: BODY } } } },
    numbering: {
      config: [{
        reference: 'bul',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 240 } } },
        }],
      }],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: kids,
    }],
  });
  return Packer.toBlob(doc);
}
