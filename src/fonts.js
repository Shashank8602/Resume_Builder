// Resume fonts the user can pick from. `docx` is the name written into the Word file
// (Word renders it natively); `pkg` is the open-source, metric-compatible font that is
// shown in the preview and embedded in the PDF.
export const FONTS = [
  { id: 'calibri', label: 'Calibri', docx: 'Calibri', pkg: 'carlito', family: 'Carlito', feel: 'Modern, ATS standard' },
  { id: 'arial', label: 'Arial', docx: 'Arial', pkg: 'arimo', family: 'Arimo', feel: 'Clean, neutral' },
  { id: 'times', label: 'Times New Roman', docx: 'Times New Roman', pkg: 'tinos', family: 'Tinos', feel: 'Classic, academic' },
  { id: 'georgia', label: 'Georgia', docx: 'Georgia', pkg: 'gelasio', family: 'Gelasio', feel: 'Warm serif' },
  { id: 'cambria', label: 'Cambria', docx: 'Cambria', pkg: 'caladea', family: 'Caladea', feel: 'Elegant serif' },
  { id: 'garamond', label: 'Garamond', docx: 'Garamond', pkg: 'eb-garamond', family: 'EB Garamond', feel: 'Refined, editorial' },
  { id: 'lato', label: 'Lato', docx: 'Lato', pkg: 'lato', family: 'Lato', feel: 'Friendly sans', install: true },
  { id: 'opensans', label: 'Open Sans', docx: 'Open Sans', pkg: 'open-sans', family: 'Open Sans', feel: 'Highly readable', install: true },
  { id: 'roboto', label: 'Roboto', docx: 'Roboto', pkg: 'roboto', family: 'Roboto', feel: 'Tech, contemporary', install: true },
];
export const getFont = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
