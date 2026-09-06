import assert from 'node:assert';
import { compute2DGridPositions } from '../lib/utils/layout';
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

console.log('Running compute2DGridPositions unit tests...\n');

// 1. Empty array
{
  const res = compute2DGridPositions([], 4);
  assert.strictEqual(res.length, 0, 'Empty array should return empty array');
  console.log('✓ Test 1 Passed: Empty array returns empty array');
}

// 2. Single card
{
  const b1 = createMockBlock('1', 'link', 2, 2);
  const res = compute2DGridPositions([b1], 4);
  assert.strictEqual(res.length, 1);
  assert.deepStrictEqual(res[0], {
    id: '1',
    block: b1,
    colStart: 1,
    rowStart: 1,
    colSpan: 2,
    rowSpan: 2,
  });
  console.log('✓ Test 2 Passed: Single card placed at (1,1)');
}

// 3. Cards with h > 1 (e.g. 2x2 title and 1x2 link)
{
  const title = createMockBlock('t1', 'title', 4, 1);
  const cardA = createMockBlock('c1', 'spotify', 2, 2);
  const cardB = createMockBlock('c2', 'spotify', 2, 2);
  const cardC = createMockBlock('c3', 'link', 1, 2);

  const res = compute2DGridPositions([title, cardA, cardB, cardC], 4);
  assert.strictEqual(res.length, 4);

  // Title: row 1, cols 1..4
  assert.strictEqual(res[0].rowStart, 1);
  assert.strictEqual(res[0].colStart, 1);

  // Card A (2x2): row 2, cols 1..2
  assert.strictEqual(res[1].rowStart, 2);
  assert.strictEqual(res[1].colStart, 1);
  assert.strictEqual(res[1].rowSpan, 2);

  // Card B (2x2): row 2, cols 3..4
  assert.strictEqual(res[2].rowStart, 2);
  assert.strictEqual(res[2].colStart, 3);
  assert.strictEqual(res[2].rowSpan, 2);

  // Card C (1x2): row 4 (since row 2 and 3 are occupied by A & B), col 1
  assert.strictEqual(res[3].rowStart, 4);
  assert.strictEqual(res[3].colStart, 1);

  console.log('✓ Test 3 Passed: Cards with h > 1 stack and pack correctly');
}

// 4. Cards wider than remaining row space (wraps to next row)
{
  const b1 = createMockBlock('1', 'link', 3, 1); // Row 1, cols 1..3
  const b2 = createMockBlock('2', 'spotify', 2, 1); // Needs 2 cols, only 1 left in row 1 -> wraps to row 2
  const res = compute2DGridPositions([b1, b2], 4);

  assert.strictEqual(res[0].rowStart, 1);
  assert.strictEqual(res[0].colStart, 1);
  assert.strictEqual(res[1].rowStart, 2);
  assert.strictEqual(res[1].colStart, 1);

  console.log('✓ Test 4 Passed: Card wider than remaining space wraps to next row');
}

// 5. Full row exactly filled
{
  const b1 = createMockBlock('1', 'link', 2, 1);
  const b2 = createMockBlock('2', 'link', 2, 1);
  const b3 = createMockBlock('3', 'link', 4, 1);
  const res = compute2DGridPositions([b1, b2, b3], 4);

  assert.strictEqual(res[0].rowStart, 1);
  assert.strictEqual(res[0].colStart, 1);
  assert.strictEqual(res[1].rowStart, 1);
  assert.strictEqual(res[1].colStart, 3);
  assert.strictEqual(res[2].rowStart, 2);
  assert.strictEqual(res[2].colStart, 1);

  console.log('✓ Test 5 Passed: Full row exactly filled');
}

// 6. Mobile cols=2 vs Desktop cols=4 with the same block list
{
  const b1 = createMockBlock('1', 'title', 4, 1);
  const b2 = createMockBlock('2', 'spotify', 2, 2);
  const b3 = createMockBlock('3', 'link', 1, 2);

  // Desktop (cols = 4)
  const deskRes = compute2DGridPositions([b1, b2, b3], 4);
  assert.strictEqual(deskRes[0].colSpan, 4); // title spans 4
  assert.strictEqual(deskRes[1].colStart, 1); // spotify cols 1..2
  assert.strictEqual(deskRes[2].colStart, 3); // link fits in col 3 on row 2

  // Mobile (cols = 2)
  const mobRes = compute2DGridPositions([b1, b2, b3], 2);
  assert.strictEqual(mobRes[0].colSpan, 2); // title clamped to 2 cols
  assert.strictEqual(mobRes[1].rowStart, 2); // spotify row 2
  assert.strictEqual(mobRes[2].rowStart, 4); // link pushed to row 4 because spotify takes rows 2-3 cols 1-2

  console.log('✓ Test 6 Passed: Mobile (cols=2) vs Desktop (cols=4) packing behaves correctly');
}

console.log('\nALL 6 UNIT TESTS PASSED SUCCESSFULLY!');
