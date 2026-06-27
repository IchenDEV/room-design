import { useRef, type Dispatch, type SetStateAction } from 'react';
import { imageLimitText, readAiImages, type AiReferenceImage } from '../../core/ai/images';
import { toastErr } from '../toast';
import { Ic } from '../icons';

const SUGGESTIONS = [
  '把当前方案改成适合两人居住的温馨小家，补齐收纳和灯光',
  '在刚才方案基础上减少家具，让空间更通透',
  '保留风格，把最大的房间改成居家办公+会客复合空间',
];

interface Props {
  prompt: string;
  images: AiReferenceImage[];
  busy: boolean;
  setPrompt: Dispatch<SetStateAction<string>>;
  setImages: Dispatch<SetStateAction<AiReferenceImage[]>>;
  onSubmit: () => void;
}

export function AiComposer({ prompt, setPrompt, images, setImages, busy, onSubmit }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const picked = await readAiImages(files, images.length);
      if (!picked.length) { toastErr('参考图最多上传 4 张'); return; }
      setImages((prev) => [...prev, ...picked]);
    } catch (e) {
      toastErr(e instanceof Error ? e.message : String(e));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <form className="ai-block" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <label id="ai-prompt-title" className="ai-label" htmlFor="ai-prompt">
        <Ic n="sparkle" size={14} />设计需求
      </label>
      <textarea id="ai-prompt" className="ai-prompt" value={prompt} rows={5}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="继续说你的风格、功能和限制" />
      <div className="ai-upload-head">
        <button type="button" className="ai-upload" onClick={() => fileRef.current?.click()}>
          <Ic n="upload" size={14} /><span>上传参考图</span>
        </button>
        <span>{imageLimitText}</span>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden
          onChange={(e) => addImages(e.target.files)} />
      </div>
      {!!images.length && <ReferenceImages images={images} setImages={setImages} />}
      <div className="ai-suggestions">
        {SUGGESTIONS.map((q) => <button type="button" key={q} onClick={() => setPrompt(q)}>{q}</button>)}
      </div>
      <button className="ai-generate" aria-busy={busy} type="submit">
        <Ic n="sparkle" size={15} /><span>{busy ? '生成中...' : '发送并应用'}</span>
      </button>
    </form>
  );
}

function ReferenceImages({ images, setImages }: Pick<Props, 'images' | 'setImages'>) {
  return (
    <div className="ai-image-grid" aria-label="参考图">
      {images.map((img) => (
        <figure key={img.id} className="ai-image">
          <img src={img.dataUrl} alt={`参考图 ${img.name}`} />
          <figcaption title={img.name}>{img.name}</figcaption>
          <button type="button" aria-label={`移除参考图 ${img.name}`}
            onClick={() => setImages((list) => list.filter((x) => x.id !== img.id))}>
            <Ic n="close" size={13} />
          </button>
        </figure>
      ))}
    </div>
  );
}
