import {
  Document as DocxDocument, Packer, Paragraph, TextRun, ExternalHyperlink, AlignmentType,
} from 'docx';
import { Document, Page, Text, View, Link, StyleSheet, pdf } from '@react-pdf/renderer';
import { getFont } from './fonts.js';
import { contactItems } from './model.js';
import { letterBlocks, letterDate } from './letter.js';
import './exportPdf.jsx'; // registers the PDF fonts

const recipientOf = (l) => [l.manager.trim(), l.company.trim()].filter(Boolean);

export async function buildLetterDocx(d) {
  const font = getFont(d.settings.font).docx;
  const jc = d.settings.justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT;
  const run = (text, o = {}) => new TextRun({ text, font, size: 21, ...o });

  const kids = [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(d.profile.name, { bold: true, size: 40 })] })];
  const parts = [];
  contactItems(d.profile, d.settings.contactShow).forEach((c, i) => {
    if (i > 0) parts.push(run('  |  '));
    parts.push(new ExternalHyperlink({ link: c.href, children: [run(c.text, { color: '0563C1', underline: {} })] }));
  });
  kids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 }, children: parts }));
  kids.push(new Paragraph({ spacing: { after: 200 }, children: [run(letterDate())] }));

  const rec = recipientOf(d.letter);
  if (rec.length) {
    kids.push(new Paragraph({
      spacing: { after: 200 },
      children: rec.map((l, i) => run(l, i > 0 ? { break: 1 } : {})),
    }));
  }
  letterBlocks(d.letter.body).forEach((b) => kids.push(new Paragraph({
    alignment: jc,
    spacing: { after: 200 },
    children: b.map((l, i) => run(l, i > 0 ? { break: 1 } : {})),
  })));

  const doc = new DocxDocument({
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: kids,
    }],
  });
  return Packer.toBlob(doc);
}

function LetterPdf({ d }) {
  const family = getFont(d.settings.font).family;
  const s = StyleSheet.create({
    page: { padding: 56, fontFamily: family, fontSize: 10.5, lineHeight: 1.4 },
    name: { fontSize: 20, fontFamily: family, fontWeight: 700, textAlign: 'center' },
    contact: { flexDirection: 'row', justifyContent: 'center', marginBottom: 22, flexWrap: 'wrap' },
    link: { color: '#0563C1', textDecoration: 'underline' },
    para: { marginBottom: 10, textAlign: d.settings.justify ? 'justify' : 'left' },
  });
  const rec = recipientOf(d.letter);
  return (
    <Document title={`${d.profile.name} - Cover Letter`}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{d.profile.name}</Text>
        <View style={s.contact}>
          {contactItems(d.profile, d.settings.contactShow).map((c, i) => (
            <Text key={i}>{i > 0 ? '  |  ' : ''}<Link src={c.href} style={s.link}>{c.text}</Link></Text>
          ))}
        </View>
        <Text style={{ marginBottom: 10 }}>{letterDate()}</Text>
        {rec.length > 0 && <Text style={{ marginBottom: 10 }}>{rec.join('\n')}</Text>}
        {letterBlocks(d.letter.body).map((b, i) => <Text key={i} style={s.para}>{b.join('\n')}</Text>)}
      </Page>
    </Document>
  );
}

export const buildLetterPdf = (d) => pdf(<LetterPdf d={d} />).toBlob();
