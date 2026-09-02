'use client';

import { BlockDetails } from '../../../lib/services/block';
import { BoxDimensions } from '../../../lib/utils/dimensions';

interface TextBlockProps {
  block: BlockDetails;
  dims: BoxDimensions;
  onUpdate?: (id: string, updates: Partial<BlockDetails>) => void;
}

export function TextBlock({ block, dims, onUpdate }: TextBlockProps) {
  return (
    <div className="flex items-center px-[10px] py-[8px] w-full h-full overflow-hidden">
      <textarea
        value={block.title || ''}
        onChange={(e) => onUpdate?.(block.id, { title: e.target.value })}
        placeholder="Add Text"
        className="w-full h-full bg-transparent group-hover:bg-zinc-100 focus:bg-zinc-100 text-[#191c1e] rounded-[14px] p-4 text-[20px] font-semibold border-none outline-none resize-none transition-colors duration-200"
      />
    </div>
  );
}
