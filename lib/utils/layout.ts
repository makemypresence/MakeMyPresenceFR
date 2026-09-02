import { BlockDetails } from '../services/block';
import { arrayMove } from '@dnd-kit/sortable';
import { DEFAULT_BLOCK_DIMENSIONS } from './dimensions';
import React from 'react';

export const reorderBlocksList = (
  blocks: BlockDetails[],
  activeId: string | null,
  overId: string | null,
): BlockDetails[] => {
  if (!activeId || !overId || activeId === overId) return blocks;

  const oldIndex = blocks.findIndex((item) => item.id === activeId);
  const newIndex = blocks.findIndex((item) => item.id === overId);

  if (oldIndex !== -1 && newIndex !== -1) {
    const reordered = arrayMove(blocks, oldIndex, newIndex);
    return reordered.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
  }

  return blocks;
};

export const getActiveDraggedBlock = (
  blocks: BlockDetails[],
  activeId: string | null,
): BlockDetails | null => {
  if (!activeId) return null;
  return blocks.find((b) => b.id === activeId) || null;
};

export interface PositionedBlock {
  id: string;
  block: BlockDetails;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
}

export function compute2DGridPositions(
  blocks: BlockDetails[],
  cols: number = 4
): PositionedBlock[] {
  if (!blocks || blocks.length === 0) return [];

  const occupied = new Set<string>();
  const positioned: PositionedBlock[] = [];

  for (const block of blocks) {
    // Spacer blocks are ignored if any remain
    if (block.type === 'spacer') continue;

    const isMobile = cols === 2;
    const layoutObj = isMobile
      ? block.layout?.mobile || block.layout?.desktop
      : block.layout?.desktop;

    const rawW = layoutObj?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
    const rawH = layoutObj?.h || DEFAULT_BLOCK_DIMENSIONS[block.type]?.h || 2;

    const hVal = typeof rawH === 'number' ? rawH : 2;
    const colSpan = Math.min(cols, Math.max(1, typeof rawW === 'number' ? rawW : 2));
    const rowSpan = Math.max(1, hVal);

    let placed = false;
    let r = 1;
    while (!placed) {
      for (let c = 1; c <= cols - colSpan + 1; c++) {
        let fits = true;

        for (let dr = 0; dr < rowSpan; dr++) {
          for (let dc = 0; dc < colSpan; dc++) {
            if (occupied.has(`${r + dr},${c + dc}`)) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }

        if (fits) {
          for (let dr = 0; dr < rowSpan; dr++) {
            for (let dc = 0; dc < colSpan; dc++) {
              occupied.add(`${r + dr},${c + dc}`);
            }
          }

          positioned.push({
            id: block.id,
            block,
            colStart: c,
            rowStart: r,
            colSpan,
            rowSpan,
          });

          placed = true;
          break;
        }
      }
      r++;
    }
  }

  return positioned;
}

export function gridPositionToCSS(pos: PositionedBlock): React.CSSProperties {
  return {
    gridColumnStart: pos.colStart,
    gridColumnEnd: `span ${pos.colSpan}`,
    gridRowStart: pos.rowStart,
    gridRowEnd: `span ${pos.rowSpan}`,
  };
}
