import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { selKey } from '../core/store/selectors';
import { GlobalProps } from './props/GlobalProps';
import { WallProps } from './props/WallProps';
import { OpeningProps } from './props/OpeningProps';
import { ItemProps } from './props/ItemProps';
import { RoomProps } from './props/RoomProps';
import { GroupProps, MultiProps } from './props/GroupProps';

export function PropsPanel() {
  useTick();
  const sel = store.sel;
  return (
    <aside className="props" key={selKey(sel)}>
      <div className="panel-title">{sel ? '属性' : '项目'}</div>
      <div className="props-body">
        {!sel && <GlobalProps />}
        {sel?.kind === 'wall' && <WallProps id={sel.id} />}
        {sel?.kind === 'opening' && <OpeningProps id={sel.id} />}
        {sel?.kind === 'item' && <ItemProps id={sel.id} />}
        {sel?.kind === 'multi' && <MultiProps />}
        {sel?.kind === 'group' && <GroupProps id={sel.id} />}
        {sel?.kind === 'room' && <RoomProps metaId={sel.metaId} />}
      </div>
    </aside>
  );
}
