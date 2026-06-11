import type { Store } from '../core/store';
import { CATS, CATALOG } from '../core/catalog';
import { drawThumb } from '../editor2d/glyphs';

export function initCatalog(store: Store) {
  const tabs = document.getElementById('catTabs')!;
  const grid = document.getElementById('catGrid')!;
  let cat: string = CATS[0].id;

  for (const c of CATS) {
    const b = document.createElement('button');
    b.className = 'cat-tab';
    b.textContent = c.name;
    b.dataset.cat = c.id;
    b.addEventListener('click', () => { cat = c.id; render(); });
    tabs.appendChild(b);
  }

  function render() {
    tabs.querySelectorAll('.cat-tab').forEach(b =>
      b.classList.toggle('active', (b as HTMLElement).dataset.cat === cat));
    grid.innerHTML = '';
    for (const def of CATALOG.filter(d => d.cat === cat)) {
      const card = document.createElement('div');
      card.className = 'cat-card';
      card.dataset.defId = def.id;
      card.title = `点击后在画布上单击放置「${def.name}」`;

      const cv = document.createElement('canvas');
      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = def.name;
      const dim = document.createElement('div');
      dim.className = 'dim';
      dim.textContent = `${def.w}×${def.d}×${def.h} cm`;
      card.append(cv, nm, dim);

      card.addEventListener('click', () => {
        if (store.ui.mode === '3d') store.setMode('2d');
        store.setTool({ type: 'place', defId: def.id });
      });
      grid.appendChild(card);
      requestAnimationFrame(() => drawThumb(cv, def));
    }
    syncActive();
  }

  function syncActive() {
    const tool = store.ui.tool;
    grid.querySelectorAll<HTMLElement>('.cat-card').forEach(c =>
      c.classList.toggle('active', tool.type === 'place' && tool.defId === c.dataset.defId));
  }

  store.on('ui', syncActive);
  render();
}
