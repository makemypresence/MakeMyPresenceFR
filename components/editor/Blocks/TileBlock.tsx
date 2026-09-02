'use client';

import { BlockDetails } from '../../../lib/services/block';
import { BoxDimensions } from '../../../lib/utils/dimensions';

interface TileBlockProps {
  block: BlockDetails;
  dims: BoxDimensions;
}

export function TileBlock({ block, dims }: TileBlockProps) {
  return (
    <div className="flex items-center px-[10px] py-[8px] w-full h-full justify-start overflow-hidden">
      <div className="w-full h-full bg-transparent group-hover:bg-zinc-100 flex items-center px-4 rounded-[14px] transition-colors duration-200">
        <span
          className={`font-semibold text-[20px] truncate ${block.title ? 'text-[#191c1e]' : 'text-[#8a9196]'}`}
        >
          {block.title || 'Add Tile'}
        </span>
      </div>
    </div>
  );
}
