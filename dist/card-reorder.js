let draggedIndex = null;
let highlightedEntry = null;

function clearHighlight() {
  highlightedEntry?.classList.remove('drag-over');
  highlightedEntry = null;
}

export function installCardReorder(entry, index, onMove) {
  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'card-drag-handle';
  handle.title = 'Drag to reorder card';
  handle.setAttribute('aria-label', 'Drag to reorder card; use arrow keys to move');
  handle.draggable = true;
  const icon = document.createElement('ha-icon');
  icon.icon = 'mdi:drag-horizontal';
  handle.append(icon);

  handle.addEventListener('dragstart', event => {
    draggedIndex = index;
    event.dataTransfer.setData('text/plain', String(index));
    event.dataTransfer.effectAllowed = 'move';
  });
  handle.addEventListener('dragend', () => {
    draggedIndex = null;
    clearHighlight();
  });
  handle.addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    event.stopPropagation();
    onMove(index, index + (event.key === 'ArrowUp' ? -1 : 1));
  });
  entry.addEventListener('dragover', event => {
    if (draggedIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (highlightedEntry !== entry) {
      clearHighlight();
      highlightedEntry = entry;
      entry.classList.add('drag-over');
    }
  });
  entry.addEventListener('dragleave', event => {
    if (!entry.contains(event.relatedTarget) && highlightedEntry === entry) clearHighlight();
  });
  entry.addEventListener('drop', event => {
    if (draggedIndex === null) return;
    event.preventDefault();
    event.stopPropagation();
    const from = draggedIndex;
    draggedIndex = null;
    clearHighlight();
    if (from !== index) onMove(from, index);
  });
  return handle;
}
