'use client';

import { BlockDetails } from '../../../lib/services/block';

interface ImageBlockProps {
  block: BlockDetails;
  onUpdate?: (id: string, updates: Partial<BlockDetails>) => void;
}

export function ImageBlock({ block, onUpdate }: ImageBlockProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      onUpdate?.(block.id, { image_url: localUrl, title: file.name });
    }
  };

  return (
    <div className="flex items-center justify-center p-[10px] w-full h-full overflow-hidden">
      {block.image_url ? (
        <div className="relative w-full h-full rounded-[10px] overflow-hidden group/img">
          <img
            src={block.image_url}
            alt={block.title || 'Uploaded Image'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center space-x-2 transition-opacity duration-200 rounded-[10px]">
            <label className="text-white text-xs font-semibold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur cursor-pointer">
              Change Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button
              onClick={() => onUpdate?.(block.id, { image_url: '', title: '' })}
              className="text-white text-xs font-semibold px-3 py-1.5 bg-white/20 hover:bg-red-500/80 rounded-xl backdrop-blur cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full bg-transparent group-hover:bg-zinc-100 rounded-[10px] cursor-pointer transition-colors duration-200 px-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <img
              src="/images/svg/icons/upload.svg"
              alt="Add Image"
              className="w-8 h-8 opacity-60"
            />
            <span className="text-[20px] font-semibold text-[#8a9196] text-center">
              Add Image
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
