'use client';

import { BlockDetails } from '../../../lib/services/block';
import { BoxDimensions } from '../../../lib/utils/dimensions';
import { getNormalizedLinkMetadata } from '../../../lib/data/linkData';

interface LinkBlockProps {
  block: BlockDetails;
  dims: BoxDimensions;
  onUpdate?: (id: string, updates: Partial<BlockDetails>) => void;
  onClick?: () => void;
}

export function LinkBlock({ block, dims, onUpdate, onClick }: LinkBlockProps) {
  const desktopLayout = block.layout?.desktop;
  const w = desktopLayout?.w ?? 1;
  const h = desktopLayout?.h ?? 2;

  const { title, domain, icon_url: iconUrl, preview_url: previewUrl, preview_large_url: previewLargeUrl } =
    getNormalizedLinkMetadata(block);

  // Layout 1: Any Width & Min Height (h === 1) -> Icon leftmost, Title right of icon
  if (h === 1) {
    return (
      <div
        onClick={onClick}
        className="w-full h-full px-4 py-2 flex flex-row items-center space-x-3 overflow-hidden bg-[#e8ecef] rounded-[14px] cursor-pointer group transition-colors select-none"
      >
        <div className="shrink-0">
          <img
            src={iconUrl}
            alt={title}
            className="w-[34px] h-[34px] rounded-xl object-cover shadow-sm border border-black/5"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#191c1e] text-[14px] md:text-[15px] truncate leading-tight">
            {title}
          </p>
        </div>
      </div>
    );
  }

  // Layout 1b: 1 Width & Square/Tall Height (w === 1 && h >= 2) -> 2.png
  if (w === 1) {
    return (
      <div
        onClick={onClick}
        className="w-full h-full p-4 flex flex-col justify-between overflow-hidden bg-[#e8ecef] rounded-[14px] cursor-pointer group transition-colors select-none"
      >
        <div className="shrink-0">
          <img
            src={iconUrl}
            alt={title}
            className="w-[38px] h-[38px] rounded-xl object-cover shadow-sm border border-black/5"
          />
        </div>
        <div className="flex flex-col space-y-0.5 mt-2">
          <p className="font-semibold text-[#191c1e] text-[14px] leading-[1.3] line-clamp-3">
            {title}
          </p>
          <p className="text-[13px] text-[#70757a] font-normal truncate mt-1">{domain}</p>
        </div>
      </div>
    );
  }

  // Layout 4: Large / Tall block (h >= 3) -> 5.png
  if (h >= 3) {
    return (
      <div
        onClick={onClick}
        className="w-full h-full p-5 flex flex-col justify-between overflow-hidden bg-[#e8ecef] rounded-[14px] cursor-pointer group transition-colors select-none gap-3"
      >
        <div className="flex flex-col shrink-0">
          <img
            src={iconUrl}
            alt={title}
            className="w-[40px] h-[40px] rounded-xl object-cover shadow-sm border border-black/5 mb-2"
          />
          <p className="font-semibold text-[#191c1e] text-[16px] md:text-[17px] leading-snug line-clamp-2">
            {title}
          </p>
          <p className="text-[14px] text-[#70757a] font-normal truncate mt-0.5">{domain}</p>
        </div>

        <div className="flex-1 w-full min-h-0 overflow-hidden rounded-xl border border-black/5 shadow-sm mt-1">
          <img
            src={previewLargeUrl}
            alt="Preview"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>
    );
  }

  // Layout for Horizontal block (w > 1 && h <= 2) -> 50% content, 50% image
  return (
    <div
      onClick={onClick}
      className="w-full h-full p-4 flex flex-row items-center justify-between gap-4 overflow-hidden bg-[#e8ecef] rounded-[14px] cursor-pointer group transition-colors select-none"
    >
      {/* 50% Content Column */}
      <div className="w-1/2 flex flex-col justify-between h-full py-0.5 min-w-0 pr-1">
        <div className="shrink-0">
          <img
            src={iconUrl}
            alt={title}
            className="w-[38px] h-[38px] rounded-xl object-cover shadow-sm border border-black/5"
          />
        </div>
        <div className="flex flex-col mt-1">
          <p className="font-semibold text-[#191c1e] text-[14.5px] leading-[1.3] line-clamp-3">
            {title}
          </p>
          <p className="text-[13px] text-[#70757a] font-normal truncate mt-0.5">{domain}</p>
        </div>
      </div>

      {/* 50% Image Column */}
      <div className="w-1/2 h-full shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-black/5 shadow-sm">
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-full object-cover object-top"
        />
      </div>
    </div>
  );
}
