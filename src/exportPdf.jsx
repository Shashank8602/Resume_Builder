import { Document, Page, Text, View, Link, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { FONT_FILES } from './fontFiles.js';
import { FONTS, getFont } from './fonts.js';
import { TITLES, contactItems, lines, visibleSections } from './model.js';

// Open-source, metric-compatible fonts are embedded so the PDF looks the same anywhere.
// Sizes match the DOCX: name 20pt, headings 12pt, body 10.5pt.
FONTS.forEach((f) => {
  const u = FONT_FILES[f.pkg];
  Font.register({
    family: f.family,
    fonts: [
      { src: u.regular },
      { src: u.bold, fontWeight: 700 },
      { src: u.italic, fontStyle: 'italic' },
      { src: u.boldItalic, fontWeight: 700, fontStyle: 'italic' },
    ],
  });
});
Font.registerHyphenationCallback((w) => [w]);

const makeStyles = (family, justify) => StyleSheet.create({
  page: { padding: 36, fontFamily: family, fontSize: 10.5, lineHeight: 1.3 },
  name: { fontSize: 20, fontFamily: family, fontWeight: 700, textAlign: 'center' },
  contact: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6, flexWrap: 'wrap' },
  link: { color: '#0563C1', textDecoration: 'underline' },
  h2: {
    fontSize: 12, fontFamily: family, fontWeight: 700, textTransform: 'uppercase',
    borderBottomWidth: 1, borderBottomColor: '#000', marginTop: 10, marginBottom: 4, paddingBottom: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  right: { textAlign: 'right' },
  bold: { fontFamily: family, fontWeight: 700 },
  ital: { fontFamily: family, fontStyle: 'italic' },
  bullet: { flexDirection: 'row', paddingLeft: 12 },
  dot: { width: 10 },
  para: { textAlign: justify ? 'justify' : 'left' },
});

const Bullets = ({ text, s }) => lines(text).map((b, i) => (
  <View style={s.bullet} key={i} wrap={false}>
    <Text style={s.dot}>•</Text>
    <Text style={[{ flex: 1 }, s.para]}>{b}</Text>
  </View>
));

function ResumePdf({ d }) {
  const s = makeStyles(getFont(d.settings.font).family, d.settings.justify);
  const contacts = contactItems(d.profile, d.settings.contactShow);
  const body = {
    summary: () => <Text style={s.para}>{lines(d.summary).join(' ')}</Text>,
    skills: () => d.skills.filter((x) => x.category || x.items).map((x, i) => (
      <Text key={i} style={s.para}><Text style={s.bold}>{x.category ? `${x.category}: ` : ''}</Text>{x.items}</Text>
    )),
    experience: () => d.experience.map((e, i) => (
      <View key={i}>
        <View style={s.row}>
          <Text><Text style={s.bold}>{e.company}</Text>{e.location ? `, ${e.location}` : ''}</Text>
          <Text style={s.right}>{e.dates}</Text>
        </View>
        {e.role ? <Text style={s.ital}>{e.role}</Text> : null}
        <Bullets s={s} text={e.bullets} />
      </View>
    )),
    projects: () => d.projects.map((p, i) => (
      <View key={i}>
        <View style={s.row}>
          <Text><Text style={s.bold}>{p.name}</Text>{p.tech ? ' | ' : ''}<Text style={s.ital}>{p.tech}</Text></Text>
          <Text style={s.right}>{p.dates}</Text>
        </View>
        <Bullets s={s} text={p.bullets} />
      </View>
    )),
    education: () => d.education.map((e, i) => (
      <View key={i} style={s.row} wrap={false}>
        <View style={{ flexShrink: 1 }}>
          <Text style={s.bold}>{e.institution}</Text>
          <Text>{e.degree}</Text>
        </View>
        <View>
          <Text style={s.right}>{e.dates}</Text>
          <Text style={s.right}>{e.score}</Text>
        </View>
      </View>
    )),
    certifications: () => d.certifications.map((c, i) => (
      <View key={i} style={s.row}>
        <Text><Text style={s.bold}>{c.name}</Text>{c.issuer ? `, ${c.issuer}` : ''}</Text>
        <Text style={s.right}>{c.date}</Text>
      </View>
    )),
    achievements: () => <Bullets s={s} text={d.achievements} />,
  };

  return (
    <Document title={`${d.profile.name} - Resume`}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{d.profile.name}</Text>
        <View style={s.contact}>
          {contacts.map((c, i) => (
            <Text key={i}>{i > 0 ? '  |  ' : ''}<Link src={c.href} style={s.link}>{c.text}</Link></Text>
          ))}
        </View>
        {visibleSections(d).map((k) => (
          <View key={k}><Text style={s.h2}>{TITLES[k]}</Text>{body[k]()}</View>
        ))}
      </Page>
    </Document>
  );
}

export const buildPdf = (d) => pdf(<ResumePdf d={d} />).toBlob();
