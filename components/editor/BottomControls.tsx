'use client';

import { useRef, useEffect } from 'react';

interface BottomControlsProps {
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
  onAddBlock: (type: string, title: string) => void;
  viewMode: 'desktop' | 'mobile';
  onToggleViewMode: () => void;
  isLinkInputOpen?: boolean;
  onToggleLinkInput?: () => void;
  onSubmitLink?: (url: string) => void;
  linkInputValue?: string;
  onLinkInputChange?: (url: string) => void;
}

export function BottomControls({
  showSuggestions,
  onToggleSuggestions,
  onAddBlock,
  viewMode,
  onToggleViewMode,
  isLinkInputOpen = false,
  onToggleLinkInput,
  onSubmitLink,
  linkInputValue = '',
  onLinkInputChange,
}: BottomControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLinkInputOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isLinkInputOpen]);

  const handlePasteClick = async () => {
    let pastedText = '';
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        pastedText = await navigator.clipboard.readText();
      }
    } catch (err) {
      console.log('Clipboard access denied or unavailable:', err);
    }
    const finalUrl = pastedText.trim() || linkInputValue.trim() || 'https://hoppscotch.io';
    onLinkInputChange?.(finalUrl);
    onSubmitLink?.(finalUrl);
  };

  return (
    <footer className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
      {/* Bottom Left controls */}
      <div className="flex items-center space-x-3 pointer-events-auto max-[425px]:hidden">
        {/* Share Link */}
        <button className="flex items-center space-x-2.5 max-[1025px]:p-3.5 px-6 py-3.5 bg-white hover:bg-zinc-50 border border-[#e1e3e5] rounded-2xl shadow-md cursor-pointer transition-colors text-base font-semibold text-[#191c1e]">
          <img src="/images/svg/icons/share.svg" alt="Share" className="w-5 h-5" />
          <span className="max-[1025px]:hidden">Share my page</span>
        </button>
      </div>

      {/* Bottom Center Controls Container */}
      <div className="relative flex flex-col items-center pointer-events-auto">
        {/* Link Adding Section Above Central Control Panel (1.png) */}
        {isLinkInputOpen && (
          <div className="absolute bottom-full mb-3 flex items-center bg-white border border-[#e1e3e5] rounded-[20px] shadow-xl p-2 px-3 space-x-2 w-[340px] sm:w-[380px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <input
              ref={inputRef}
              type="text"
              value={linkInputValue}
              onChange={(e) => onLinkInputChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmitLink?.(linkInputValue);
                }
              }}
              placeholder="Enter link"
              className="flex-1 bg-transparent px-3 py-1.5 text-[15px] text-[#191c1e] placeholder:text-[#9ea5ad] outline-none border-none font-normal"
            />
            <button
              type="button"
              onClick={handlePasteClick}
              className="px-4 py-1.5 bg-[#f0f2f5] hover:bg-[#e4e6ea] active:bg-[#dbdde1] text-[#191c1e] text-sm font-medium rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Paste
            </button>
          </div>
        )}

        {/* Bottom Center Float Controls Bar */}
        <div className="bg-white/95 backdrop-blur border border-[#e1e3e5] rounded-3xl p-2 flex items-center space-x-2 shadow-2xl">
          {/* 1. Add Link */}
          <button
            onClick={() => {
              if (onToggleLinkInput) {
                onToggleLinkInput();
              } else {
                onAddBlock('link', 'Add Link');
              }
            }}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              isLinkInputOpen ? 'bg-[#e2e2e2] shadow-inner' : 'hover:bg-zinc-100'
            }`}
            title="Add Link"
          >
            <img src="/images/svg/icons/add-link.svg" alt="Add Link" className="w-6 h-6" />
          </button>

          {/* 2. Section Title */}
          <button
            onClick={() => onAddBlock('title', 'Add Title')}
            className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
            title="Section Title"
          >
            <img src="/images/svg/icons/section-text.svg" alt="Section Title" className="w-6 h-6" />
          </button>

          {/* 3. Text */}
          <button
            onClick={() => onAddBlock('text', 'Add Text')}
            className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
            title="Text"
          >
            <img src="/images/svg/icons/text.svg" alt="Text" className="w-6 h-6" />
          </button>

          {/* 4. Add Image/Video */}
          <button
            onClick={() => onAddBlock('image', 'Add Image')}
            className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
            title="Add Image/Video"
          >
            <img
              src="/images/svg/icons/add-image-video.svg"
              alt="Add Image/Video"
              className="w-6 h-6"
            />
          </button>

          {/* 5. Add Tiles */}
          <button
            onClick={() => onAddBlock('tile', 'Add Tile')}
            className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
            title="Add Tiles"
          >
            <img src="/images/svg/icons/add-tiles.svg" alt="Add Tiles" className="w-6 h-6" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[#e1e3e5] my-auto max-[1025px]:hidden" />

          {/* 6. Switch to Phone/Desktop */}
          <button
            onClick={onToggleViewMode}
            className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer max-[1025px]:hidden"
            title={viewMode === 'desktop' ? 'Switch to Phone' : 'Switch to Desktop'}
          >
            <img
              src={
                viewMode === 'desktop'
                  ? '/images/svg/icons/mobile.svg'
                  : '/images/svg/icons/desktop.svg'
              }
              alt={viewMode === 'desktop' ? 'Switch to Phone' : 'Switch to Desktop'}
              className="w-6 h-6"
            />
          </button>
        </div>
      </div>

      {/* Bottom Right controls */}
      <div className="flex items-center space-x-3 pointer-events-auto max-[425px]:hidden">
        {/* Hide suggestions button */}
        <button
          onClick={onToggleSuggestions}
          className="flex items-center space-x-2.5 max-[1025px]:p-3.5 px-6 py-3.5 bg-white hover:bg-zinc-50 border border-[#e1e3e5] rounded-2xl shadow-md cursor-pointer transition-colors text-base font-semibold text-[#5a626a] hover:text-black"
        >
          <img
            src="/images/svg/icons/trash.svg"
            alt="Toggle Suggestions"
            className="w-5 h-5 max-[1025px]:mr-0 mr-1"
          />
          <span className="max-[1025px]:hidden">
            {showSuggestions ? 'Remove Suggestions' : 'Show Suggestions'}
          </span>
        </button>
      </div>
    </footer>
  );
}

