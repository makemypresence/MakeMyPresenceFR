'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockDetails } from '../../lib/services/block';
import { getBoxDimensions, DEFAULT_BLOCK_DIMENSIONS } from '../../lib/utils/dimensions';
import { TitleBlock } from './Blocks/TitleBlock';
import { LinkBlock } from './Blocks/LinkBlock';
import { TextBlock } from './Blocks/TextBlock';
import { ImageBlock } from './Blocks/ImageBlock';
import { TileBlock } from './Blocks/TileBlock';

interface BlockCardProps {
  block: BlockDetails;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<BlockDetails>) => void;
  onDuplicate?: (block: BlockDetails) => void;
  isOverlay?: boolean;
  viewMode?: 'desktop' | 'mobile';
}

export function BlockCard({
  block,
  onDelete,
  onUpdate,
  onDuplicate,
  isOverlay = false,
  viewMode = 'desktop',
}: BlockCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over,
  } = useSortable({
    id: block.id,
    disabled: isOverlay,
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    },
  });

  const isOver = over && over.id === block.id;

  const rawW = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
  const w = viewMode === 'mobile' ? Math.min(2, rawW) : rawW;
  const h = block.layout?.desktop?.h || DEFAULT_BLOCK_DIMENSIONS[block.type]?.h || 2;
  const isInputBlock = block.type === 'title' || block.type === 'text' || block.type === 'link' || block.type === 'image';

  // Resolve pixel boundaries from dimensions utility
  const dims = getBoxDimensions(w, h);
  const colSpanMap: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
  };
  const colSpan = colSpanMap[w] || 'col-span-2';

  // Configure inline styling rules to support 'infinite' (auto-grow) layouts
  const outerStyle = {
    height: dims.outerHeight === 'infinite' ? 'auto' : `${dims.outerHeight}px`,
    minHeight: dims.outerHeight === 'infinite' ? '107.5px' : undefined,
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
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

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdate) return;
    const currentW = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
    const currentH = block.layout?.desktop?.h || DEFAULT_BLOCK_DIMENSIONS[block.type]?.h || 2;
    const hVal = typeof currentH === 'string' ? 2 : currentH;
    let nextW = currentW;
    if (block.type === 'link') {
      nextW = currentW === 1 ? 2 : (currentW === 2 ? 4 : 1);
    } else if (block.type === 'text' || block.type === 'image') {
      nextW = currentW === 2 ? 4 : 2;
    } else if (block.type === 'tile') {
      nextW = currentW === 1 ? 2 : 1;
    }
    onUpdate(block.id, {
      layout: {
        desktop: { w: nextW, h: hVal },
        mobile: { w: nextW, h: hVal },
      },
    });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(block);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fileInput = document.getElementById(`file-input-${block.id}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const showPlaceholder = isDragging;

  if (block.type === 'spacer') {
    return (
      <div
        ref={setNodeRef}
        style={outerStyle}
        className={`relative ${colSpan} group w-full flex items-center justify-center transition-all duration-200 ${
          isDragging ? 'scale-95 z-20 opacity-50' : ''
        }`}
      >
        <div
          style={innerStyle}
          className={`rounded-[14px] p-0 relative flex items-center justify-center transition-all duration-200 w-full h-full max-[425px]:!w-full ${
            isOver
              ? 'bg-zinc-100/50'
              : 'bg-white'
          }`}
        />
      </div>
    );
  }

  return (
    // Outer Div (flex centered)
    <div
      ref={setNodeRef}
      style={outerStyle}
      className={`relative ${colSpan} group w-full flex items-center justify-center transition-all duration-200 ${
        isDragging ? 'scale-95 z-20 opacity-50' : ''
      }`}
    >
      <div
        style={innerStyle}
        className={`rounded-[14px] p-0 relative flex items-center justify-center transition-all duration-200 border w-full h-full max-[425px]:!w-full ${
          isDragging
            ? 'bg-zinc-100/50 border-transparent shadow-[inset_0_2px_5px_rgba(0,0,0,0.08)]'
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

            {/* Drag Handle Grip (Placed inside Inner Div, top-right overlay) */}
            <div
              {...attributes}
              {...listeners}
              className="absolute -top-2.5 -right-2.5 p-[10px] bg-white hover:bg-zinc-50 text-zinc-400 hover:text-black rounded-full border border-zinc-200 shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center w-[42px] h-[42px]"
              title="Drag to Reorder"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="9" cy="6" r="1.25" fill="currentColor" />
                <circle cx="9" cy="12" r="1.25" fill="currentColor" />
                <circle cx="9" cy="18" r="1.25" fill="currentColor" />
                <circle cx="15" cy="6" r="1.25" fill="currentColor" />
                <circle cx="15" cy="12" r="1.25" fill="currentColor" />
                <circle cx="15" cy="18" r="1.25" fill="currentColor" />
              </svg>
            </div>

            {/* Block Content (Centered inside Inner Div) */}
            {block.type === 'title' ? (
              <TitleBlock block={block} dims={dims} onUpdate={onUpdate} />
            ) : block.type === 'link' ? (
              <LinkBlock block={block} dims={dims} onUpdate={onUpdate} />
            ) : block.type === 'text' ? (
              <TextBlock block={block} onUpdate={onUpdate} />
            ) : block.type === 'image' ? (
              <ImageBlock block={block} dims={dims} onUpdate={onUpdate} />
            ) : (
              <TileBlock block={block} dims={dims} />
            )}

            {/* Floating Options Toolbar (bottom centered) */}
            {block.type === 'title' ? (
              <button
                onClick={handleDuplicate}
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 rounded-xl w-[42px] h-[42px] flex items-center justify-center shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-20 cursor-pointer hover:bg-zinc-50"
                title="Duplicate Block"
              >
                <img
                  src="/images/svg/icons/duplicate.svg"
                  alt="Duplicate"
                  className="w-5 h-5"
                />
              </button>
            ) : (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 rounded-2xl px-3 py-1.5 shadow-sm flex flex-row flex-nowrap items-center space-x-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-20 whitespace-nowrap w-max min-w-max">
                {block.type === 'image' && (
                  <button
                    onClick={handleEditClick}
                    className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-black cursor-pointer transition-colors"
                    title="Edit Image"
                  >
                    <img
                      src="/images/svg/icons/edit.svg"
                      alt="Edit"
                      className="w-5 h-5"
                    />
                  </button>
                )}
                <button
                  onClick={handleResize}
                  className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-black cursor-pointer transition-colors"
                  title="Resize Block"
                >
                  <img
                    src="/images/svg/icons/resize.svg"
                    alt="Resize"
                    className="w-5 h-5"
                  />
                </button>
                <button
                  onClick={handleDuplicate}
                  className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-black cursor-pointer transition-colors"
                  title="Duplicate Block"
                >
                  <img
                    src="/images/svg/icons/duplicate.svg"
                    alt="Duplicate"
                    className="w-5 h-5"
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
