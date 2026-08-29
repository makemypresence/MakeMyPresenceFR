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
        className="bg-[#f1f3f5] group-hover:bg-[#f8f9fa] rounded-[20px] p-0 relative flex items-center justify-center select-none transition-colors duration-200 w-full h-full max-[425px]:!w-full"
      >
        {/* Custom dashed border overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="1"
            y="1"
            className="w-[calc(100%-2px)] h-[calc(100%-2px)] stroke-[#e1e3e5] group-hover:stroke-[#eceef0] group-hover:stroke-[3px] transition-all duration-200"
            rx="19"
            ry="19"
            fill="none"
            strokeWidth="2"
            strokeDasharray="6, 4"
          />
        </svg>
        {/* Plus Add Button (Placed inside Inner Div, relative to it) */}
        <button
          onClick={() => onAdd(type, title)}
          className="absolute top-3.5 right-3.5 text-[#8a9196] transition-colors cursor-pointer z-10"
          title="Add Block"
        >
          <svg
            className="w-7 h-7"
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
        <div className="flex flex-col items-center justify-center space-y-1 px-3 py-1 w-full overflow-hidden text-[#8a9196] transition-colors">
          <div className="shrink-0">
            {type === 'link' && (
              <svg
                className="w-6 h-6"
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
                className="w-6 h-6"
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
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M215.38,14.54a12,12,0,0,0-10.29-2.18l-128,32A12,12,0,0,0,68,56V159.35A40,40,0,1,0,92,196V113.37l104-26v40A40,40,0,1,0,220,164V24A12,12,0,0,0,215.38,14.54ZM52,212a16,16,0,1,1,16-16A16,16,0,0,1,52,212ZM92,88.63V65.37l104-26V62.63ZM180,180a16,16,0,1,1,16-16A16,16,0,0,1,180,180Z" />
              </svg>
            )}
            {type === 'youtube' && (
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M170.49,117.91l-56-36A12,12,0,0,0,96,92v72a12,12,0,0,0,18.49,10.09l56-36a12,12,0,0,0,0-20.18ZM120,142V114l21.81,14Zm118.21-73.5a28.05,28.05,0,0,0-16.93-19.14C186.4,35.91,131.29,36,128,36s-58.4-.09-93.28,13.38A28.05,28.05,0,0,0,17.79,68.52C15.15,78.72,12,97.32,12,128s3.15,49.28,5.79,59.48a28.05,28.05,0,0,0,16.93,19.14C68.21,219.55,120.36,220,127.37,220h1.26c7,0,59.16-.45,92.65-13.38a28.05,28.05,0,0,0,16.93-19.14c2.64-10.2,5.79-28.8,5.79-59.48S240.85,78.72,238.21,68.52ZM215,181.46a4,4,0,0,1-2.34,2.77C182.78,195.76,132.27,196,128.32,196h-.39c-.53,0-53.64.17-84.56-11.77A4,4,0,0,1,41,181.46c-1.88-7.24-5-23.82-5-53.46s3.15-46.22,5-53.46a4,4,0,0,1,2.34-2.77C74.29,59.83,127.39,60,127.92,60h.15c.54,0,53.64-.17,84.56,11.77A4,4,0,0,1,215,74.54c1.88,7.24,5,23.82,5,53.46S216.85,174.22,215,181.46Z" />
              </svg>
            )}
          </div>
          <span className="font-semibold text-base truncate">{title}</span>
        </div>
      </div>
    </div>
  );
}
