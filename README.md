# Resume Builder

An ATS-friendly resume builder that runs entirely in your browser. Edit your content, preview it live on an A4 page, and download it as **PDF** or **DOCX** with clickable email, phone, LinkedIn and GitHub links.

## Features

- Fixed, ATS-friendly sections in a single column: Professional Summary, Technical Skills, Professional Experience, Technical Projects, Education, Certifications (optional), Achievements (optional). Section names can't be renamed.
- Dates sit at the right end of each heading line; education scores appear directly under the date.
- Fixed industry-standard sizes (name 20pt, headings 12pt, body 10.5pt) with a choice of fonts and left/justified text.
- Show phone, email, LinkedIn and GitHub as real values or as fixed labels (still hyperlinked).
- Drag-to-reorder for skills, jobs, projects, education and certifications.
- Month/year date pickers with a "Present" option.
- ATS keyword match against a pasted job description, and a page-fit badge.
- Cover letter generator that reuses your header and style.
- Autosaves in your browser. No accounts, no network calls, no AI services.

## Run locally

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Open the address shown in the terminal (usually http://localhost:5173).

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the built app
```

## Notes

- Data is stored in your browser's local storage for the exact address you use; clearing site data erases it.
- The PDF embeds open-source, metric-compatible fonts (e.g. Carlito for Calibri). The DOCX uses the named font, which Word renders natively.
