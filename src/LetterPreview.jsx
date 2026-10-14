import React from 'react';
import { getFont } from './fonts.js';
import { contactItems } from './model.js';
import { letterBlocks, letterDate } from './letter.js';

export default function LetterPreview({ data }) {
  const { letter, settings, profile } = data;
  const contacts = contactItems(profile, settings.contactShow);
  const recipient = [letter.manager.trim(), letter.company.trim()].filter(Boolean);
  return (
    <div
      className={`page letter${settings.justify ? ' justify' : ''}`}
      style={{ fontFamily: `'${getFont(settings.font).family}', Calibri, Arial, sans-serif` }}
    >
      <h1>{profile.name}</h1>
      <div className="contact">
        {contacts.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span> | </span>}
            <a href={c.href} target="_blank" rel="noreferrer">{c.text}</a>
          </React.Fragment>
        ))}
      </div>
      <p className="l-date">{letterDate()}</p>
      {recipient.length > 0 && <p>{recipient.map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</p>}
      {letterBlocks(letter.body).map((b, i) => (
        <p key={i} className="l-para">{b.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{l}</React.Fragment>)}</p>
      ))}
    </div>
  );
}
