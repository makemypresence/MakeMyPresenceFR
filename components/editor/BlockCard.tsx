'use client';

import { BlockDetails } from '../../lib/services/block';
import { getBoxDimensions, DEFAULT_BLOCK_DIMENSIONS } from '../../lib/utils/dimensions';

interface BlockCardProps {
  block: BlockDetails;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<BlockDetails>) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function BlockCard({
  block,
  onDelete,
  onUpdate,
  draggable,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: BlockCardProps) {
  const w = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
  const h = block.layout?.desktop?.h || DEFAULT_BLOCK_DIMENSIONS[block.type]?.h || 2;
  const isInputBlock = block.type === 'title' || block.type === 'text' || block.type === 'link' || block.type === 'image';

  // Resolve pixel boundaries from dimensions utility
  const dims = getBoxDimensions(w, h);
  const colSpan = `col-span-${w}`;

  // Configure inline styling rules to support 'infinite' (auto-grow) layouts
  const outerStyle = {
    height: dims.outerHeight === 'infinite' ? 'auto' : `${dims.outerHeight}px`,
    minHeight: dims.outerHeight === 'infinite' ? '107.5px' : undefined,
  };

  const innerStyle = {
    width: `${dims.innerWidth}px`,
    height: dims.innerHeight === 'infinite' ? 'auto' : `${dims.innerHeight}px`,
    minHeight: dims.innerHeight === 'infinite' ? '67.5px' : undefined,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      onUpdate?.(block.id, { image_url: localUrl, title: file.name });
    }
  };

  const showPlaceholder = isDragging;

  return (
    // Outer Div (flex centered)
    <div
      style={outerStyle}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`relative ${colSpan} group w-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'scale-95 z-20' : ''
      }`}
    >
      {/* Inner Div with dynamic bounds */}
      <div
        style={innerStyle}
        className={`rounded-[14px] p-0 relative flex items-center justify-center transition-all duration-200 border w-full h-full ${
          isDragging
            ? 'bg-zinc-100/50 border-transparent shadow-[inset_0_2px_5px_rgba(0,0,0,0.08)]'
            : isDragOver
            ? 'bg-white border-zinc-400 shadow-md scale-[1.02] z-10'
            : 'bg-white border-[#e1e3e5] shadow-sm'
        }`}
      >
        {!showPlaceholder && (
          <>
            {/* Delete Button (Placed inside Inner Div, relative to it) */}
            <button
              onClick={() => onDelete(block.id)}
              className="absolute -top-2.5 -left-2.5 p-[10px] bg-white hover:bg-zinc-50 text-zinc-400 hover:text-black rounded-full border border-zinc-200 shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-200 cursor-pointer z-10"
              title="Delete Block"
            >
              <img
                src="/images/svg/icons/trash.svg"
                alt="Delete Block"
                className="w-5 h-5"
              />
            </button>

            {/* Block Content (Centered inside Inner Div) */}
            {block.type === 'title' || block.type === 'link' ? (
              <div className="flex items-center px-[10px] w-full justify-start overflow-hidden">
                <input
                  type="text"
                  value={block.title || ''}
                  onChange={(e) => onUpdate?.(block.id, { title: e.target.value })}
                  placeholder={block.type === 'title' ? 'Add Title' : 'New Link'}
                  style={{
                    height:
                      dims.innerHeight === 'infinite'
                        ? 'auto'
                        : `${dims.innerHeight - 16}px`,
                  }}
                  className="w-full bg-transparent group-hover:bg-zinc-100 focus:bg-zinc-100 text-[#191c1e] rounded-[14px] px-4 text-[20px] font-semibold border-none outline-none transition-colors duration-200"
                />
              </div>
            ) : block.type === 'text' ? (
              <div className="flex items-center px-[10px] py-[8px] w-full h-full overflow-hidden">
                <textarea
                  value={block.title || ''}
                  onChange={(e) => onUpdate?.(block.id, { title: e.target.value })}
                  placeholder="New Text"
                  style={{ height: '159px' }}
                  className="w-full bg-transparent group-hover:bg-zinc-100 focus:bg-zinc-100 text-[#191c1e] rounded-[14px] p-4 text-[20px] font-semibold border-none outline-none resize-none transition-colors duration-200"
                />
              </div>
            ) : block.type === 'image' ? (
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
                        alt="Upload"
                        className="w-8 h-8 opacity-60"
                      />
                      <span className="text-[20px] font-semibold text-[#8a9196] text-center">
                        Upload Image
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
            ) : (
              <div className="flex items-center px-[10px] w-full justify-start overflow-hidden">
                <div
                  style={{
                    height:
                      dims.innerHeight === 'infinite'
                        ? 'auto'
                        : `${dims.innerHeight - 16}px`,
                  }}
                  className="w-full bg-transparent group-hover:bg-zinc-100 flex items-center px-4 rounded-[14px] transition-colors duration-200"
                >
                  <span className={`font-semibold text-[20px] truncate ${block.title ? 'text-[#191c1e]' : 'text-[#8a9196]'}`}>
                    {block.title || 'New Tile'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
