export interface BoxDimensions {
  outerWidth: number;
  outerHeight: number | 'infinite';
  innerWidth: number;
  innerHeight: number | 'infinite';
}

// Base grid cell constants in pixels
export const GRID_CELL_WIDTH = 215;
export const GRID_CELL_HEIGHT = 107.5;
export const INNER_PADDING = 40; // 20px on each side (x and y)

// Constrain ranges
export const MIN_WIDTH_UNITS = 1;
export const MAX_WIDTH_UNITS = 4;
export const MIN_HEIGHT_UNITS = 1;

/**
 * Calculates pixel dimensions (outer and inner) based on unit count (W x H)
 */
export function getBoxDimensions(w: number, h: number | 'infinite'): BoxDimensions {
  // Enforce width bounds (min 1, max 4)
  const widthUnits = Math.min(MAX_WIDTH_UNITS, Math.max(MIN_WIDTH_UNITS, w));
  
  const outerWidth = widthUnits * GRID_CELL_WIDTH;
  const innerWidth = outerWidth - INNER_PADDING;

  if (h === 'infinite') {
    return {
      outerWidth,
      outerHeight: 'infinite',
      innerWidth,
      innerHeight: 'infinite',
    };
  }

  // Enforce height bounds (min 1)
  const heightUnits = Math.max(MIN_HEIGHT_UNITS, h);
  const outerHeight = heightUnits * GRID_CELL_HEIGHT;
  const innerHeight = outerHeight - INNER_PADDING;

  return {
    outerWidth,
    outerHeight,
    innerWidth,
    innerHeight,
  };
}

/**
 * Default dimensions configuration for all block types
 */
export const DEFAULT_BLOCK_DIMENSIONS: Record<
  string,
  { w: number; h: number | 'infinite' }
> = {
  link: { w: 1, h: 2 },
  image: { w: 2, h: 2 },
  spotify: { w: 2, h: 2 },
  youtube: { w: 2, h: 2 },
  title: { w: 4, h: 1 },
  text: { w: 2, h: 2 },
  tile: { w: 1, h: 2 },
};
