'use client';

import { getBoxDimensions } from '../../lib/utils/dimensions';

interface SuggestionCardProps {
  type: string;
  title: string;
  colSpan: string;
  onAdd: (type: string, title: string) => void;
}

export function SuggestionCard({ type, title, colSpan, onAdd }: SuggestionCardProps) {
  // Extract width/height unit configuration from the colSpan class (e.g. col-span-1 = 1 unit width)
  const cols = colSpan.includes('col-span-1') ? 1 :
               colSpan.includes('col-span-2') ? 2 :
               colSpan.includes('col-span-3') ? 3 : 4;

  // Defaults: suggestions use h=2 height tracks except title suggestion which uses h=1
  const h = type === 'title' ? 1 : 2;

  // Resolve pixel boundaries from dimensions utility
  const dims = getBoxDimensions(cols, h);

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
      className={`relative ${colSpan} group w-full flex items-center justify-center`}
    >
      {/* Inner Div with dynamic bounds */}
      <div
        style={innerStyle}
        className="bg-[#fafbfc] border border-dashed border-[#e1e3e5] rounded-[20px] p-0 relative flex items-center justify-center shadow-sm select-none hover:border-[#191c1e] transition-colors"
      >
        {/* Plus Add Button (Placed inside Inner Div, relative to it) */}
        <button
          onClick={() => onAdd(type, title)}
          className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-400 hover:text-black rounded-full transition-colors cursor-pointer z-10"
          title="Add Block"
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>

        {/* Suggestion Content (Centered inside Inner Div) */}
        <div className="flex items-center space-x-2 px-3 py-1 w-full justify-start overflow-hidden text-[#8a9196] group-hover:text-black transition-colors">
          <div className="shrink-0">
            {type === 'link' && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            )}
            {type === 'image' && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            )}
            {type === 'spotify' && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9l10.5-3m0 0v5.625M19 6v12a3 3 0 11-6-0M9 9v12a3 3 0 11-6-0m6-12V6a3 3 0 013-3h7a3 3 0 013 3v3"
                />
              </svg>
            )}
            {type === 'youtube' && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
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
          <span className="font-semibold text-xs truncate">{title}</span>
        </div>
      </div>
    </div>
  );
}
