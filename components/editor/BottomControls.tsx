'use client';

interface BottomControlsProps {
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
}

export function BottomControls({ showSuggestions, onToggleSuggestions }: BottomControlsProps) {
  return (
    <footer className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
      {/* Bottom Left controls */}
      <div className="flex items-center space-x-3 pointer-events-auto">
        {/* Share Link */}
        <button className="flex items-center space-x-2.5 px-6 py-3.5 bg-white hover:bg-zinc-50 border border-[#e1e3e5] rounded-2xl shadow-md cursor-pointer transition-colors text-base font-semibold text-[#191c1e]">
          <img
            src="/images/svg/icons/share.svg"
            alt="Share"
            className="w-5 h-5"
          />
          <span>Share my page</span>
        </button>
      </div>

      {/* Bottom Center Float Controls */}
      <div className="bg-white/95 backdrop-blur border border-[#e1e3e5] rounded-3xl p-2 flex items-center space-x-2 shadow-2xl pointer-events-auto">
        {/* 1. Add Link */}
        <button
          className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
          title="Add Link"
        >
          <img
            src="/images/svg/icons/add-link.svg"
            alt="Add Link"
            className="w-6 h-6"
          />
        </button>

        {/* 2. Section Title */}
        <button
          className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
          title="Section Title"
        >
          <img
            src="/images/svg/icons/section-text.svg"
            alt="Section Title"
            className="w-6 h-6"
          />
        </button>

        {/* 3. Text */}
        <button
          className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
          title="Text"
        >
          <img
            src="/images/svg/icons/text.svg"
            alt="Text"
            className="w-6 h-6"
          />
        </button>

        {/* 4. Add Image/Video */}
        <button
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
          className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
          title="Add Tiles"
        >
          <img
            src="/images/svg/icons/add-tiles.svg"
            alt="Add Tiles"
            className="w-6 h-6"
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[#e1e3e5] my-auto" />

        {/* 6. Switch to Phone */}
        <button
          className="p-3 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer"
          title="Switch to Phone"
        >
          <img
            src="/images/svg/icons/mobile.svg"
            alt="Switch to Phone"
            className="w-6 h-6"
          />
        </button>
      </div>

      {/* Bottom Right controls */}
      <div className="flex items-center space-x-3 pointer-events-auto">
        {/* Hide suggestions button */}
        <button
          onClick={onToggleSuggestions}
          className="flex items-center space-x-2.5 px-6 py-3.5 bg-white hover:bg-zinc-50 border border-[#e1e3e5] rounded-2xl shadow-md cursor-pointer transition-colors text-base font-semibold text-[#5a626a] hover:text-black"
        >
          <img
            src="/images/svg/icons/trash.svg"
            alt="Toggle Suggestions"
            className="w-5 h-5 mr-1"
          />
          <span>{showSuggestions ? 'Remove Suggestions' : 'Show Suggestions'}</span>
        </button>
      </div>
    </footer>
  );
}
