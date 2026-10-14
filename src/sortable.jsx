import { useRef } from 'react';

export const move = (arr, from, to) => {
  const a = [...arr];
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
};

// Drag-and-drop reordering using native HTML5 drag events; only the handle is draggable.
export function useSortable(onMove) {
  const from = useRef(null);
  return (i) => ({
    rowProps: {
      onDragOver: (e) => { if (from.current !== null) e.preventDefault(); },
      onDrop: (e) => {
        e.preventDefault();
        if (from.current !== null && from.current !== i) onMove(from.current, i);
        from.current = null;
      },
    },
    handleProps: {
      draggable: true,
      title: 'Drag to reorder',
      onDragStart: (e) => {
        from.current = i;
        e.dataTransfer.effectAllowed = 'move';
        const row = e.currentTarget.closest('[data-row]');
        if (row) e.dataTransfer.setDragImage(row, 12, 12);
      },
      onDragEnd: () => { from.current = null; },
    },
  });
}

export const Grip = (props) => (
  <span className="grip" aria-label="Drag to reorder" {...props}>
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1.4" /><circle cx="9" cy="3" r="1.4" />
      <circle cx="3" cy="8" r="1.4" /><circle cx="9" cy="8" r="1.4" />
      <circle cx="3" cy="13" r="1.4" /><circle cx="9" cy="13" r="1.4" />
    </svg>
  </span>
);

// Single textarea: paste or type one bullet per line; bullet characters are stripped
// when rendered (see `lines` in model.js).
export function BulletEditor({ label, value, onChange, placeholder, rows = 5 }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={value} placeholder={placeholder || 'One bullet per line - paste your text and it becomes points'} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
