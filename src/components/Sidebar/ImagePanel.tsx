import { useState, type ChangeEvent } from 'react';
import { useEffect } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImagePanelProps {
  onAddImageFromUrl: (url: string) => void;
  onUploadAsset: (file: File) => Promise<string | null>;
  onAddImageFrame: (kind: 'rect' | 'rounded' | 'circle') => void;
}

interface MediaAsset {
  name: string;
  url: string;
}

export default function ImagePanel({ onAddImageFromUrl, onUploadAsset, onAddImageFrame }: ImagePanelProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [assets, setAssets] = useState<MediaAsset[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('infographic-editor:media') || '[]') as MediaAsset[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('infographic-editor:media', JSON.stringify(assets.slice(0, 18)));
  }, [assets]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const localUrl = event.target.result as string;
          void onUploadAsset(file).then((cloudUrl) => {
            const url = cloudUrl ?? localUrl;
            onAddImageFromUrl(url);
            setAssets((current) => [{ name: file.name, url }, ...current.filter((asset) => asset.url !== url)].slice(0, 18));
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addUrlImage = () => {
    if (!imageUrl.trim()) {
      setError('Paste an image URL first.');
      return;
    }
    setError('');
    onAddImageFromUrl(imageUrl.trim());
    setImageUrl('');
  };

  const sources = [
    {
      label: 'Mountain photo',
      url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=900&q=85',
    },
    {
      label: 'Workspace photo',
      url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&q=85',
    },
    {
      label: 'Abstract texture',
      url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=900&q=85',
    },
  ];

  return (
    <div className="p-4 flex flex-col gap-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Upload & Assets
      </h3>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-semibold text-blue-800">Paste directly from your clipboard</p>
        <p className="mt-1 text-[11px] leading-4 text-blue-700">
          Copy an image, then press Ctrl+V or Cmd+V anywhere in the editor. It will become an editable canvas image.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-600">Image URL</label>
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && addUrlImage()}
          placeholder="https://..."
          className="border border-slate-200 rounded px-3 py-2 text-xs outline-none focus:border-blue-500"
        />
        <button onClick={addUrlImage} className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 text-xs font-semibold">
          Add image from URL
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Image frames</p>
        <p className="mb-2 text-[11px] leading-4 text-slate-500">Add a frame, select it, then choose an image to fill it.</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onAddImageFrame('rect')} className="rounded border border-slate-200 bg-slate-50 p-2 text-[10px] text-slate-700 hover:bg-blue-50">Rectangle</button>
          <button onClick={() => onAddImageFrame('rounded')} className="rounded border border-slate-200 bg-slate-50 p-2 text-[10px] text-slate-700 hover:bg-blue-50">Rounded</button>
          <button onClick={() => onAddImageFrame('circle')} className="rounded border border-slate-200 bg-slate-50 p-2 text-[10px] text-slate-700 hover:bg-blue-50">Circle</button>
        </div>
      </div>

      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-slate-50 cursor-pointer transition">
        <Upload className="w-8 h-8 text-slate-400 mb-2" />
        <span className="text-xs font-semibold text-slate-600">Upload Local Image</span>
        <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG up to 10MB</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      <div>
        {assets.length > 0 && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recent assets</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {assets.map((asset) => (
                <button key={asset.url} onClick={() => onAddImageFromUrl(asset.url)} className="overflow-hidden rounded border border-slate-200 bg-slate-50 text-left hover:border-blue-400" title={`Add ${asset.name}`}>
                  <img src={asset.url} alt={asset.name} className="h-16 w-full object-cover" />
                  <span className="block truncate p-1.5 text-[10px] text-slate-600">{asset.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Sample Assets
        </p>
        <div className="grid grid-cols-2 gap-2">
          {sources.map((source) => (
            <button
              key={source.url}
              onClick={() => onAddImageFromUrl(source.url)}
              className="overflow-hidden border border-slate-200 rounded hover:border-blue-400 transition bg-slate-100 text-xs text-slate-600 text-left"
            >
              <img src={source.url} alt="" className="w-full h-16 object-cover" />
              <span className="flex items-center gap-1 p-2"><ImageIcon className="w-3.5 h-3.5" /> {source.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}