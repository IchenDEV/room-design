import { store } from '../../core/store/store';
import { deleteSelection } from '../../core/store/actions';
import {
  createGroupFromSelection, duplicateGroup, groupItems, groupOf,
  idsFromSelection, setGroupName, ungroupSelection,
} from '../../core/store/item-groups';
import { ActionBtn, BtnRow, KV, Section } from './widgets';

export function GroupProps({ id }: { id: string }) {
  const g = groupOf(store, id);
  const items = groupItems(store, id);
  if (!g) return null;
  return (
    <>
      <Section title="组合属性">
        <input className="text-input" key={g.name} defaultValue={g.name} placeholder="组合名称"
          onBlur={(e) => setGroupName(store, id, e.target.value.trim() || '组合')}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        <KV k="成员" v={`${items.length} 件家具`} />
      </Section>
      <BtnRow>
        <ActionBtn icon="copy" onClick={() => duplicateGroup(store, id)}>复制</ActionBtn>
        <ActionBtn icon="ungroup" onClick={() => ungroupSelection(store)}>解组</ActionBtn>
        <ActionBtn icon="trash" danger onClick={() => deleteSelection(store)}>删除</ActionBtn>
      </BtnRow>
    </>
  );
}

export function MultiProps() {
  const n = idsFromSelection(store).length;
  return (
    <>
      <Section title="多选家具">
        <KV k="已选" v={`${n} 件家具`} />
      </Section>
      <BtnRow>
        <ActionBtn icon="group" disabled={n < 2} onClick={() => createGroupFromSelection(store)}>创建组合</ActionBtn>
        <ActionBtn icon="trash" danger onClick={() => deleteSelection(store)}>删除</ActionBtn>
      </BtnRow>
    </>
  );
}
