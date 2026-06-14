import { store } from '../../core/store/store';
import { fmtLen, deleteSelection } from '../../core/store/actions';
import { measureOf } from '../../core/store/selectors';
import { ActionBtn, BtnRow, KV, Section } from './widgets';

export function MeasureProps({ id }: { id: string }) {
  const m = measureOf(store, id);
  if (!m) return null;
  const dx = m.b.x - m.a.x, dy = m.b.y - m.a.y;
  const len = Math.hypot(dx, dy);
  return (
    <>
      <Section title="距离标注">
        <KV k="长度" v={fmtLen(len)} />
        <KV k="水平" v={fmtLen(Math.abs(dx))} />
        <KV k="垂直" v={fmtLen(Math.abs(dy))} />
      </Section>
      <Section title="端点坐标">
        <KV k="起点" v={`${Math.round(m.a.x)}, ${Math.round(m.a.y)} cm`} />
        <KV k="终点" v={`${Math.round(m.b.x)}, ${Math.round(m.b.y)} cm`} />
      </Section>
      <BtnRow>
        <ActionBtn icon="trash" danger onClick={() => deleteSelection(store)}>删除标注</ActionBtn>
      </BtnRow>
    </>
  );
}
