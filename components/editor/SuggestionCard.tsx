'use client';

interface SuggestionCardProps {
  type: string;
  title: string;
  widthClass: string;
  onAdd: (type: string, title: string) => void;
}

export function SuggestionCard({ type, title, widthClass, onAdd }: SuggestionCardProps) {
  return (
    <div
      style={{ width: widthClass.includes('1/3') ? '30%' : '46%', minWidth: '240px' }}
      className="h-[140px] bg-[#fafbfc] border border-dashed border-[#e1e3e5] rounded-3xl p-6 relative flex flex-col justify-center items-center text-center shadow-sm select-none shrink-0 group hover:border-[#191c1e] transition-colors"
    >
      {/* Plus Add icon top right */}
      <button
        onClick={() => onAdd(type, title)}
        className="absolute top-4 right-4 p-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-400 hover:text-black rounded-full transition-colors cursor-pointer"
        title="Add Block"
      >
        <svg
          className="w-4.5 h-4.5"
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

      {/* Placeholder Icon */}
      <div className="flex flex-col items-center justify-center space-y-2 mt-4 text-[#8a9196] group-hover:text-black transition-colors">
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
            className="w-6 h-6"
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
        <span className="font-semibold text-sm">{title}</span>
      </div>
    </div>
  );
}
