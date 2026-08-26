'use client';

import { BlockDetails } from '../../lib/services/block';
import { getBoxDimensions, DEFAULT_BLOCK_DIMENSIONS } from '../../lib/utils/dimensions';

interface BlockCardProps {
  block: BlockDetails;
  onDelete: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function BlockCard({
  block,
  onDelete,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: BlockCardProps) {
  // Get width/height unit configuration from layout metadata or fall back to defaults
  const w = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
  const h = block.layout?.desktop?.h || DEFAULT_BLOCK_DIMENSIONS[block.type]?.h || 2;

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

  return (
    // Outer Div (flex centered)
    <div
      style={outerStyle}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`relative ${colSpan} group w-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-95' : ''
      }`}
    >
      {/* Inner Div with dynamic bounds */}
      <div
        style={innerStyle}
        className="bg-white border border-[#e1e3e5] rounded-[20px] p-0 relative flex items-center justify-center shadow-sm hover:border-[#191c1e] transition-colors"
      >
        {/* Delete Button (Placed inside Inner Div, relative to it) */}
        <button
          onClick={() => onDelete(block.id)}
          className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-full border border-zinc-200 shadow-sm transition-colors cursor-pointer z-10"
          title="Delete Block"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>

        {/* Block Content (Centered inside Inner Div) */}
        <div className="flex items-center space-x-2 px-3 py-1 w-full justify-start overflow-hidden">
          <div className="p-1.5 bg-zinc-50 rounded-lg border border-zinc-100 shrink-0">
            {/* Render dynamic icon per type */}
            {block.type === 'link' && (
              <svg
                className="w-4 h-4 text-[#5a626a]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            )}
            {block.type === 'image' && (
              <svg
                className="w-4 h-4 text-[#5a626a]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            )}
            {block.type === 'spotify' && (
              <svg
                className="w-4 h-4 text-[#5a626a]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9l10.5-3m0 0v5.625M19 6v12a3 3 0 11-6-0M9 9v12a3 3 0 11-6-0m6-12V6a3 3 0 013-3h7a3 3 0 013 3v3"
                />
              </svg>
            )}
            {block.type === 'youtube' && (
              <svg
                className="w-4 h-4 text-[#5a626a]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                />
              </svg>
            )}
          </div>
          <span className="font-semibold text-[#191c1e] text-xs truncate">{block.title}</span>
        </div>
      </div>
    </div>
  );
}
