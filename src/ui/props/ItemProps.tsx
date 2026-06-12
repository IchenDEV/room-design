import { store } from '../../core/store/store';
import { itemOf } from '../../core/store/selectors';
import { deleteSelection, duplicateItem, rotateItem } from '../../core/store/actions';
import { defaultTexture, defOf, ITEM_COLORS, TEXTURES } from '../../core/catalog/catalog';
import { ActionBtn, BtnRow, Check, ChoiceGrid, NumField, Section, SliderNum, Swatches } from './widgets';
import type { Item } from '../../core/types';

export function ItemProps({ id }: { id: string }) {
  const it = itemOf(store, id);
  if (!it) return null;
  const def = defOf(it.defId);

  const mut = (fn: (x: Item) => void, commit: boolean) => {
    store.begin();
    store.update((p) => { const t = p.items.find((x) => x.id === id); if (t) fn(t); });
    if (commit) store.end();
  };
  const setNum = (k: 'x' | 'y' | 'w' | 'd' | 'h') => (v: number) =>
    store.commit((p) => { const t = p.items.find((x) => x.id === id); if (t) t[k] = v; });

  return (
    <>
      <Section title={`${def.name}`}>
        <NumField label="位置 X" value={it.x} onCommit={setNum('x')} />
        <NumField label="位置 Y" value={it.y} onCommit={setNum('y')} />
        <SliderNum label="旋转" min={0} max={359} value={it.rot} unit="°"
          onPreview={(v) => mut((x) => { x.rot = v; }, false)} onCommit={(v) => mut((x) => { x.rot = v; }, true)} />
      </Section>
      <Section title="尺寸（精确输入）">
        <SliderNum label="宽" min={20} max={400} value={it.w}
          onPreview={(v) => mut((x) => { x.w = v; }, false)} onCommit={(v) => mut((x) => { x.w = v; }, true)} />
        <SliderNum label="深" min={10} max={400} value={it.d}
          onPreview={(v) => mut((x) => { x.d = v; }, false)} onCommit={(v) => mut((x) => { x.d = v; }, true)} />
        <SliderNum label="高" min={2} max={300} value={it.h}
          onPreview={(v) => mut((x) => { x.h = v; }, false)} onCommit={(v) => mut((x) => { x.h = v; }, true)} />
      </Section>
      <Section title="配色">
        <Swatches colors={ITEM_COLORS} value={it.color ?? def.color}
          onPick={(c) => store.commit((p) => { const t = p.items.find((x) => x.id === id); if (t) t.color = c; })} />
      </Section>
      <Section title="材质">
        <ChoiceGrid options={TEXTURES} value={it.texture ?? defaultTexture(def)}
          onPick={(v) => store.commit((p) => { const t = p.items.find((x) => x.id === id); if (t) t.texture = v; })} />
        <Check label="左右翻转家具" checked={!!it.flipX}
          onChange={(v) => store.commit((p) => { const t = p.items.find((x) => x.id === id); if (t) t.flipX = v; })} />
      </Section>
      <BtnRow>
        <ActionBtn icon="rotate" onClick={() => rotateItem(store, id)}>旋转 90°</ActionBtn>
        <ActionBtn icon="copy" onClick={() => duplicateItem(store, id)}>复制</ActionBtn>
        <ActionBtn icon="trash" danger onClick={() => deleteSelection(store)}>删除</ActionBtn>
      </BtnRow>
    </>
  );
}
