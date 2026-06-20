import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { selKey } from '../core/store/selectors';
import { GlobalProps } from './props/GlobalProps';
import { WallProps } from './props/WallProps';
import { OpeningProps } from './props/OpeningProps';
import { ItemProps } from './props/ItemProps';
import { RoomProps } from './props/RoomProps';
import { GroupProps, MultiProps } from './props/GroupProps';
import { MeasureProps } from './props/MeasureProps';
import { Ic } from './icons';

export function PropsPanel() {
  useTick();
  const sel = store.sel;
  const open = store.ui.panelR;
  const toggle = () => store.patchUI({ panelR: !open });

  if (!open) return (
    <aside className="props collapsed">
      <button className="panel-edge" title="展开属性面板" onClick={toggle}>
        <Ic n="chev" size={14} />
      </button>
    </aside>
  );

  return (
    <aside className="props" key={selKey(sel)}>
      <div className="panel-head">
        <span className="panel-title">{sel ? '属性' : '项目'}</span>
        <button className="panel-collapse" title="收起属性面板" onClick={toggle}>
          <Ic n="chev" size={14} />
        </button>
      </div>
      <div className="props-body">
        {!sel && <GlobalProps />}
        {sel?.kind === 'wall' && <WallProps id={sel.id} />}
        {sel?.kind === 'opening' && <OpeningProps id={sel.id} />}
        {sel?.kind === 'item' && <ItemProps id={sel.id} />}
        {sel?.kind === 'multi' && <MultiProps />}
        {sel?.kind === 'group' && <GroupProps id={sel.id} />}
        {sel?.kind === 'measure' && <MeasureProps id={sel.id} />}
        {sel?.kind === 'room' && <RoomProps metaId={sel.metaId} />}
      </div>
    </aside>
  );
}
