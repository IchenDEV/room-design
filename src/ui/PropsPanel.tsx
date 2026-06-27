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
import { AiPanel } from './ai/AiPanel';
import { TemplatesPanel } from './templates/TemplatesPanel';

export function PropsPanel() {
  useTick();
  const sel = store.sel;
  const open = store.ui.panelR;
  const view = store.ui.panelView;
  const toggle = () => store.patchUI({ panelR: !open });

  if (!open) return (
    <aside className="props collapsed">
      <button className="panel-edge" title="展开属性面板" onClick={toggle}>
        <Ic n="chev" size={14} />
      </button>
    </aside>
  );

  const showProps = () => store.patchUI({ panelView: 'props' });
  const showTemplates = () => store.patchUI({ panelView: 'templates', panelR: true });
  const title = view === 'ai' ? 'AI 设计' : view === 'templates' ? '模板' : sel ? '属性' : '项目';

  return (
    <aside className={`props ${view === 'ai' ? 'ai-props' : view === 'templates' ? 'template-props' : ''}`}
      key={view === 'props' ? selKey(sel) : view}>
      <div className="panel-head">
        <span className="panel-title">{title}</span>
        <div className="panel-actions">
          {view !== 'props' ? (
            <button className="panel-link" onClick={showProps}>属性</button>
          ) : (
            <button className="panel-icon-btn" title="模板方案" aria-label="模板方案" onClick={showTemplates}>
              <Ic n="template" size={14} />
            </button>
          )}
          <button className="panel-collapse" title="收起属性面板" onClick={toggle}>
            <Ic n="chev" size={14} />
          </button>
        </div>
      </div>
      <div className="props-body">
        {view === 'ai' ? <AiPanel /> : view === 'templates' ? <TemplatesPanel /> : (
          <>
            {!sel && <GlobalProps />}
            {sel?.kind === 'wall' && <WallProps id={sel.id} />}
            {sel?.kind === 'opening' && <OpeningProps id={sel.id} />}
            {sel?.kind === 'item' && <ItemProps id={sel.id} />}
            {sel?.kind === 'multi' && <MultiProps />}
            {sel?.kind === 'group' && <GroupProps id={sel.id} />}
            {sel?.kind === 'measure' && <MeasureProps id={sel.id} />}
            {sel?.kind === 'room' && <RoomProps metaId={sel.metaId} />}
          </>
        )}
      </div>
    </aside>
  );
}
