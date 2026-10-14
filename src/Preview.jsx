import React from 'react';
import { getFont } from './fonts.js';
import { TITLES, contactItems, lines, visibleSections } from './model.js';

const Row = ({ left, right }) => (
  <div className="row">
    <div className="row-left">{left}</div>
    {right && <div className="row-right">{right}</div>}
  </div>
);
const Bullets = ({ text }) => (
  <ul>{lines(text).map((b, i) => <li key={i}>{b}</li>)}</ul>
);

export default function Preview({ data }) {
  const contacts = contactItems(data.profile, data.settings.contactShow);
  const render = {
    summary: () => <p>{lines(data.summary).join(' ')}</p>,
    skills: () => data.skills.filter((s) => s.category || s.items).map((s, i) => (
      <p key={i} className="skill"><b>{s.category}{s.category && ':'}</b> {s.items}</p>
    )),
    experience: () => data.experience.map((e, i) => (
      <div className="entry" key={i}>
        <Row left={<><b>{e.company}</b>{e.location && `, ${e.location}`}</>} right={e.dates} />
        {e.role && <div><i>{e.role}</i></div>}
        <Bullets text={e.bullets} />
      </div>
    )),
    projects: () => data.projects.map((p, i) => (
      <div className="entry" key={i}>
        <Row left={<><b>{p.name}</b>{p.tech && <> | <i>{p.tech}</i></>}</>} right={p.dates} />
        <Bullets text={p.bullets} />
      </div>
    )),
    education: () => data.education.map((e, i) => (
      <div className="entry" key={i}>
        <div className="row">
          <div className="row-left"><b>{e.institution}</b>{e.degree && <div>{e.degree}</div>}</div>
          <div className="row-right">{e.dates}{e.score && <div>{e.score}</div>}</div>
        </div>
      </div>
    )),
    certifications: () => data.certifications.map((c, i) => (
      <Row key={i} left={<><b>{c.name}</b>{c.issuer && `, ${c.issuer}`}</>} right={c.date} />
    )),
    achievements: () => <Bullets text={data.achievements} />,
  };

  return (
    <div id="resume-page" className={`page${data.settings.justify ? ' justify' : ''}`} style={{ fontFamily: `'${getFont(data.settings.font).family}', Calibri, Arial, sans-serif` }}>
      <h1>{data.profile.name}</h1>
      <div className="contact">
        {contacts.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span> | </span>}
            <a href={c.href} target="_blank" rel="noreferrer">{c.text}</a>
          </React.Fragment>
        ))}
      </div>
      {visibleSections(data).map((k) => (
        <section key={k}><h2>{TITLES[k]}</h2>{render[k]()}</section>
      ))}
    </div>
  );
}
