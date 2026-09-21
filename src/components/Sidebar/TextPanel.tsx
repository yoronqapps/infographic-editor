import { useEffect, useState, type ChangeEvent } from 'react';
import { Heading1, Heading2, AlignLeft, Quote } from 'lucide-react';
import { fontCatalog } from '../../lib/fontCatalog';

interface TextPanelProps {
  onAddText: (text: string, options?: any) => void;
}

export default function TextPanel({ onAddText }: TextPanelProps) {
  const [customFonts, setCustomFonts] = useState<string[]>([]);

  const handleFontUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fontName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 ]/g, ' ').trim() || 'Custom font';
    const fontFace = new FontFace(fontName, `url(${URL.createObjectURL(file)})`);
    fontFace.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
      const storedFonts = JSON.parse(localStorage.getItem('infographic-editor:fonts') || '[]') as string[];
      if (!storedFonts.includes(fontName)) localStorage.setItem('infographic-editor:fonts', JSON.stringify([...storedFonts, fontName]));
      setCustomFonts((fonts) => fonts.includes(fontName) ? fonts : [...fonts, fontName]);
    }).catch(() => undefined);
  };

  useEffect(() => {
    const storedFonts = JSON.parse(localStorage.getItem('infographic-editor:fonts') || '[]') as string[];
    setCustomFonts(storedFonts);
  }, []);

  return (
    <div className="p-4 flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Text Elements
      </h3>
      <div className="rounded border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Font library</p>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {fontCatalog.map((font) => (
            <button
              key={font.name}
              onClick={() => onAddText(font.name, { fontFamily: font.family, fontSize: 24 })}
              className="truncate rounded border border-slate-200 bg-white px-2 py-1.5 text-left text-[11px] text-slate-700 hover:bg-blue-50"
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </button>
          ))}
        </div>
        <label className="mt-2 block cursor-pointer rounded border border-dashed border-slate-300 bg-white px-2 py-2 text-center text-[11px] text-slate-600 hover:bg-blue-50">
          Load custom font
          <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} className="hidden" />
        </label>
        {customFonts.length > 0 && <div className="mt-2 grid grid-cols-2 gap-1">
          {customFonts.map((font) => <button key={font} onClick={() => onAddText(font, { fontFamily: font, fontSize: 24 })} className="truncate rounded border border-slate-200 bg-white px-2 py-1.5 text-left text-[11px] text-slate-700" style={{ fontFamily: font }}>{font}</button>)}
        </div>}
      </div>
      <button
        onClick={() => onAddText('Heading', { fontSize: 36, fontWeight: 'bold', fontFamily: 'Georgia' })}
        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition text-left"
      >
        <Heading1 className="w-5 h-5 text-slate-500" />
        <div>
          <p className="font-bold text-sm">Add Heading</p>
          <p className="text-xs text-slate-400">Large title text</p>
        </div>
      </button>

      <button
        onClick={() => onAddText('Subheading', { fontSize: 24, fontWeight: 'bold', fontFamily: 'Trebuchet MS' })}
        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition text-left"
      >
        <Heading2 className="w-5 h-5 text-slate-500" />
        <div>
          <p className="font-semibold text-sm">Add Subheading</p>
          <p className="text-xs text-slate-400">Medium section text</p>
        </div>
      </button>

      <button
        onClick={() => onAddText('Make it memorable', { fontSize: 28, fontStyle: 'italic', fontFamily: 'Georgia', fill: '#2563eb' })}
        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition text-left"
      >
        <Quote className="w-5 h-5 text-blue-500" />
        <div>
          <p className="font-bold text-sm">Add Quote</p>
          <p className="text-xs text-slate-400">Editorial callout text</p>
        </div>
      </button>

      <button
        onClick={() => onAddText('Body text goes here...', { fontSize: 16 })}
        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition text-left"
      >
        <AlignLeft className="w-5 h-5 text-slate-500" />
        <div>
          <p className="font-normal text-sm">Add Body Text</p>
          <p className="text-xs text-slate-400">Standard paragraph block</p>
        </div>
      </button>
    </div>
  );
}