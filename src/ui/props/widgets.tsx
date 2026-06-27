import type { ReactNode } from 'react';
import { Ic, sectionIcon } from '../icons';

export const Section = ({ title, icon, children }: { title: string; icon?: string; children: ReactNode }) => (
  <div className="prop-section">
    <div className="prop-title"><Ic n={icon ?? sectionIcon(title)} size={14} />{title}</div>
    {children}
  </div>
);

export const KV = ({ k, v }: { k: string; v: string }) => (
  <div className="kv"><span>{k}</span><b>{v}</b></div>
);

interface SliderNumProps {
  label: string; min: number; max: number; value: number;
  step?: number; unit?: string;
  onPreview: (v: number) => void;
  onCommit: (v: number) => void;
}

/** 滑杆 + 数字输入：支持拖动粗调与键入精确值（需求 4） */
export function SliderNum({ label, min, max, value, step = 1, unit = 'cm', onPreview, onCommit }: SliderNumProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const commitText = (el: HTMLInputElement) => {
    const v = parseFloat(el.value);
    if (!Number.isNaN(v)) onCommit(clamp(v));
    else el.value = String(Math.round(value));
  };
  return (
    <div className="slider-row">
      <label>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onPreview(clamp(parseFloat(e.target.value)))}
        onPointerUp={(e) => onCommit(clamp(parseFloat((e.target as HTMLInputElement).value)))} />
      <span className="num-wrap">
        <input className="num" type="number" key={Math.round(value * 100)} defaultValue={Math.round(value)}
          min={min} max={max} step={step}
          onBlur={(e) => commitText(e.target)}
          onKeyDown={(e) => { if (e.key === 'Enter') commitText(e.target as HTMLInputElement); }} />
        <i>{unit}</i>
      </span>
    </div>
  );
}

interface NumFieldProps {
  label: string; value: number; min?: number; max?: number; unit?: string;
  onCommit: (v: number) => void;
}

/** 纯数字输入（精确设定，如墙长/坐标） */
export function NumField({ label, value, min = -1e6, max = 1e6, unit = 'cm', onCommit }: NumFieldProps) {
  const commit = (el: HTMLInputElement) => {
    const v = parseFloat(el.value);
    if (!Number.isNaN(v)) onCommit(Math.max(min, Math.min(max, v)));
    else el.value = String(Math.round(value));
  };
  return (
    <div className="numfield-row">
      <label>{label}</label>
      <span className="num-wrap">
        <input className="num" type="number" key={Math.round(value * 100)} defaultValue={Math.round(value)}
          onBlur={(e) => commit(e.target)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(e.target as HTMLInputElement); }} />
        <i>{unit}</i>
      </span>
    </div>
  );
}

export function Swatches({ colors, value, onPick }: { colors: string[]; value?: string; onPick: (c: string) => void }) {
  return (
    <div className="swatches">
      {colors.map((c) => (
        <button key={c} className={`swatch ${value === c ? 'on' : ''}`} style={{ background: c }}
          aria-label={`选择颜色 ${c}`} aria-pressed={value === c}
          title={c} onClick={() => onPick(c)} />
      ))}
    </div>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function ChoiceGrid<T extends string>({
  options, value, onPick,
}: { options: readonly { id: T; name: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="seg-row wrap">
      {options.map((o) => (
        <button key={o.id} className={`seg-btn ${value === o.id ? 'on' : ''}`}
          aria-pressed={value === o.id} onClick={() => onPick(o.id)}>
          {o.name}
        </button>
      ))}
    </div>
  );
}

export const BtnRow = ({ children }: { children: ReactNode }) => <div className="btn-row">{children}</div>;

export function ActionBtn({
  icon, children, danger, disabled, onClick, title,
}: { icon: string; children: ReactNode; danger?: boolean; disabled?: boolean; onClick?: () => void; title?: string }) {
  return (
    <button className={`btn icon-btn ${danger ? 'danger' : ''}`} disabled={disabled} title={title} onClick={onClick}>
      <Ic n={icon} size={15} /><span>{children}</span>
    </button>
  );
}
