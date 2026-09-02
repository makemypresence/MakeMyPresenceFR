import { BlockDetails } from '../services/block';
import { DEFAULT_BLOCK_DIMENSIONS } from './dimensions';

export const removeEmptyRows = (allBlocks: BlockDetails[], cols = 4): BlockDetails[] => {
  const result: BlockDetails[] = [];
  let currentRow: BlockDetails[] = [];
  let currentColumn = 0;

  allBlocks.forEach((block) => {
    const rawW = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
    // For mobile (cols = 2), constraint width to maximum of 2 units
    const w = block.type === 'spacer' ? 1 : cols === 2 ? Math.min(2, rawW) : rawW;

    if (currentColumn + w > cols) {
      const hasRealBlock = currentRow.some((b) => b.type !== 'spacer');
      if (hasRealBlock) {
        result.push(...currentRow);
      }
      currentRow = [];
      currentColumn = 0;
    }

    currentRow.push(block);
    currentColumn += w;
    if (currentColumn === cols) {
      const hasRealBlock = currentRow.some((b) => b.type !== 'spacer');
      if (hasRealBlock) {
        result.push(...currentRow);
      }
      currentRow = [];
      currentColumn = 0;
    }
  });

  if (currentRow.length > 0) {
    const hasRealBlock = currentRow.some((b) => b.type !== 'spacer');
    if (hasRealBlock) {
      result.push(...currentRow);
    }
  }

  return result;
};

export const fillSpacers = (existingBlocks: BlockDetails[], cols = 4): BlockDetails[] => {
  const realBlocks = existingBlocks.filter((b) => b.type !== 'spacer');
  if (realBlocks.length === 0) return [];

  // Sort real blocks by position
  const sortedRealBlocks = [...realBlocks].sort((a, b) => (a.position || 0) - (b.position || 0));

  // Reconstruct layout slots based on position
  const maxPos = Math.max(...sortedRealBlocks.map((b) => b.position || 1));
  const list: (BlockDetails | null)[] = Array(maxPos).fill(null);

  sortedRealBlocks.forEach((block) => {
    const pos = block.position || 1;
    list[pos - 1] = block;
  });

  const reconstructed: BlockDetails[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item) {
      reconstructed.push(item);
    } else {
      reconstructed.push({
        id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-reconstruct-${i}`,
        profile_id: sortedRealBlocks[0]?.profile_id || '',
        type: 'spacer',
        position: i + 1,
        layout: {
          desktop: { w: 1, h: 2 },
          mobile: { w: 1, h: 2 },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  const result: BlockDetails[] = [];
  let currentColumn = 0;

  reconstructed.forEach((block) => {
    const rawW = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
    const w = block.type === 'spacer' ? 1 : cols === 2 ? Math.min(2, rawW) : rawW;

    // If it doesn't fit in the current row:
    if (currentColumn + w > cols) {
      const remainingSpace = cols - currentColumn;
      for (let k = 0; k < remainingSpace; k++) {
        result.push({
          id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${k}`,
          profile_id: block.profile_id || '',
          type: 'spacer',
          position: result.length + 1,
          layout: {
            desktop: { w: 1, h: 2 },
            mobile: { w: 1, h: 2 },
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      currentColumn = 0;
    }

    result.push(block);
    currentColumn += w;
    if (currentColumn === cols) {
      currentColumn = 0;
    }
  });

  // Fill the remaining space of the last row
  if (currentColumn > 0) {
    const remainingSpace = cols - currentColumn;
    for (let k = 0; k < remainingSpace; k++) {
      result.push({
        id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-end-${k}`,
        profile_id: sortedRealBlocks[0]?.profile_id || '',
        type: 'spacer',
        position: result.length + 1,
        layout: {
          desktop: { w: 1, h: 2 },
          mobile: { w: 1, h: 2 },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return removeEmptyRows(result, cols);
};

// Append a new block to the end of the layout, preserving existing positions (drag gaps).
// Strips trailing spacers from the last row, checks if the new block fits in the remaining
// space. If not, pads the row and starts a new one.
export const appendBlock = (
  existingBlocks: BlockDetails[],
  newBlock: BlockDetails,
  cols = 4,
): BlockDetails[] => {
  const makeSpacer = () => ({
    id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    profile_id: '',
    type: 'spacer',
    position: 0,
    layout: { desktop: { w: 1, h: 2 }, mobile: { w: 1, h: 2 } },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // 1. Remove trailing spacers from end
  const blocks = [...existingBlocks];
  while (blocks.length > 0 && blocks[blocks.length - 1].type === 'spacer') {
    blocks.pop();
  }

  // 2. Calculate current column position after all existing blocks
  let currentColumn = 0;
  blocks.forEach((block) => {
    const rawW = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
    const w = block.type === 'spacer' ? 1 : cols === 2 ? Math.min(2, rawW) : rawW;
    currentColumn += w;
    if (currentColumn >= cols) currentColumn = 0;
  });

  // 3. Check if new block fits in remaining space of the current row
  const rawNewW = newBlock.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[newBlock.type]?.w || 2;
  const newW = cols === 2 ? Math.min(2, rawNewW) : rawNewW;

  if (currentColumn > 0 && currentColumn + newW > cols) {
    // Doesn't fit — pad the current row and start a new one
    const remaining = cols - currentColumn;
    for (let k = 0; k < remaining; k++) {
      blocks.push(makeSpacer());
    }
    currentColumn = 0;
  }

  // 4. Append the new block
  blocks.push(newBlock);
  currentColumn += newW;

  // 5. Pad the final row with trailing spacers
  if (currentColumn > 0 && currentColumn < cols) {
    const remaining = cols - currentColumn;
    for (let k = 0; k < remaining; k++) {
      blocks.push(makeSpacer());
    }
  }

  return blocks;
};
