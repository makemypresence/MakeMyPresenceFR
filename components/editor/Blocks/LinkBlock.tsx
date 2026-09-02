'use client';

import { BlockDetails } from '../../../lib/services/block';
import { BoxDimensions } from '../../../lib/utils/dimensions';

interface LinkBlockProps {
  block: BlockDetails;
  dims: BoxDimensions;
  onUpdate?: (id: string, updates: Partial<BlockDetails>) => void;
}

export function LinkBlock({ block, dims, onUpdate }: LinkBlockProps) {
  return (
    <div className="flex items-center px-[10px] py-[8px] w-full h-full justify-start overflow-hidden">
      <input
        type="text"
        value={block.title || ''}
        onChange={(e) => onUpdate?.(block.id, { title: e.target.value })}
        placeholder="Add Link"
        className="w-full h-full bg-transparent group-hover:bg-zinc-100 focus:bg-zinc-100 text-[#191c1e] rounded-[14px] px-4 text-[20px] font-semibold border-none outline-none transition-colors duration-200"
      />
    </div>
  );
}
