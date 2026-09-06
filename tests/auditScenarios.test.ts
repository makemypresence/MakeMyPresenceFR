import assert from 'node:assert';
import { compute2DGridPositions, reorderBlocksList } from '../lib/utils/layout';
import { BlockDetails } from '../lib/services/block';

function createMockBlock(id: string, type: string, w: number, h: number): BlockDetails {
  return {
    id,
    profile_id: 'p1',
    type,
    created_at: '',
    updated_at: '',
    layout: {
      desktop: { w, h },
      mobile: { w, h },
    },
  };
}

console.log('Running Audit Crash Scenario Verifications...\n');

// Scenario 1: Drag-and-drop reorder with cards of mixed h (1 and 2)
{
  const title = createMockBlock('title', 'title', 4, 1);
  const cardA = createMockBlock('cardA', 'spotify', 2, 2);
  const cardB = createMockBlock('cardB', 'link', 1, 2);
  const cardC = createMockBlock('cardC', 'text', 2, 1);

  const initial = [title, cardA, cardB, cardC];
  // Move cardC to position after title
  const reordered = reorderBlocksList(initial, 'cardC', 'cardA');
  const positioned = compute2DGridPositions(reordered, 4);

  assert.strictEqual(positioned.length, 4);
  assert.strictEqual(positioned[0].id, 'title');
  assert.strictEqual(positioned[1].id, 'cardC'); // row 2, cols 1..2
  assert.strictEqual(positioned[2].id, 'cardA'); // row 2, cols 3..4
  assert.strictEqual(positioned[3].id, 'cardB'); // row 4 (since cardA and cardC take rows 2-3)
  console.log('✓ Scenario 1 Verified: Drag-and-drop reorder with mixed h packs without collision');
}

// Scenario 2: Resize a card's w or h, layout repacks cleanly, no stale gaps
{
  const cardA = createMockBlock('cardA', 'link', 1, 1);
  const cardB = createMockBlock('cardB', 'link', 1, 1);
  let blocks = [cardA, cardB];

  // Resize cardA to 3x2
  blocks = blocks.map((b) =>
    b.id === 'cardA'
      ? { ...b, layout: { desktop: { w: 3, h: 2 }, mobile: { w: 3, h: 2 } } }
      : b,
  );

  const positioned = compute2DGridPositions(blocks, 4);
  assert.strictEqual(positioned[0].colSpan, 3);
  assert.strictEqual(positioned[0].rowSpan, 2);
  assert.strictEqual(positioned[1].colStart, 4); // cardB fits in remaining 4th column of row 1!
  console.log('✓ Scenario 2 Verified: Resizing w/h repacks cleanly without stale gaps');
}

// Scenario 3: Delete a card, including the title block, without TypeError
{
  const title = createMockBlock('title', 'title', 4, 1);
  const cardA = createMockBlock('cardA', 'spotify', 2, 2);
  let blocks = [title, cardA];

  // Delete title block
  blocks = blocks.filter((b) => b.id !== 'title');

  assert.doesNotThrow(() => {
    const positioned = compute2DGridPositions(blocks, 4);
    assert.strictEqual(positioned.length, 1);
    assert.strictEqual(positioned[0].id, 'cardA');
    assert.strictEqual(positioned[0].rowStart, 1);
  }, 'Deleting title block should not throw TypeError');

  console.log('✓ Scenario 3 Verified: Deleting title block handles gracefully without error');
}

// Scenario 4: Delete all cards → empty state renders without crashing
{
  const blocks: BlockDetails[] = [];
  assert.doesNotThrow(() => {
    const positioned = compute2DGridPositions(blocks, 4);
    assert.strictEqual(positioned.length, 0);
  }, 'Empty card array should render without crashing');

  console.log('✓ Scenario 4 Verified: Empty card list returns empty layout without crash');
}

// Scenario 5: Switch desktop (cols=4) to mobile (cols=2) → layout recomputes correctly
{
  const title = createMockBlock('title', 'title', 4, 1);
  const cardA = createMockBlock('cardA', 'spotify', 2, 2);
  const cardB = createMockBlock('cardB', 'link', 1, 2);
  const blocks = [title, cardA, cardB];

  const desktopPos = compute2DGridPositions(blocks, 4);
  assert.strictEqual(desktopPos[0].colSpan, 4);
  assert.strictEqual(desktopPos[1].colStart, 1);
  assert.strictEqual(desktopPos[2].colStart, 3);

  const mobilePos = compute2DGridPositions(blocks, 2);
  assert.strictEqual(mobilePos[0].colSpan, 2); // Title clamped to 2 cols
  assert.strictEqual(mobilePos[1].colSpan, 2); // CardA takes 2 cols
  assert.strictEqual(mobilePos[2].rowStart, 4); // CardB pushed to row 4 cleanly

  console.log('✓ Scenario 5 Verified: Switching between 4 cols and 2 cols recomputes layout dynamically');
}

// Scenario 6: Duplicate a card → new card appears in a sane position, no overlap
{
  const cardA = createMockBlock('cardA', 'spotify', 2, 2);
  const cardA_copy = createMockBlock('cardA_copy', 'spotify', 2, 2);
  const blocks = [cardA, cardA_copy];

  const positioned = compute2DGridPositions(blocks, 4);
  assert.strictEqual(positioned.length, 2);
  assert.strictEqual(positioned[0].colStart, 1);
  assert.strictEqual(positioned[0].rowStart, 1);
  assert.strictEqual(positioned[1].colStart, 3);
  assert.strictEqual(positioned[1].rowStart, 1);

  console.log('✓ Scenario 6 Verified: Duplicated card packs beside original without overlap');
}

console.log('\nALL 6 AUDIT CRASH SCENARIOS VERIFIED AND PASSED!');
