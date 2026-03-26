// ============================================================
// Grid Engine — Main Entry Point
// ============================================================

export type { LayoutDefinition, Slot, ResolvedSlot, GridRenderOptions, ChromeLevel, ModuleType } from './types.js';
export { layoutRegistry } from './definitions.js';
export { renderGrid, generateGridCSS } from './grid.js';
export { resolveSlide } from './slot-resolver.js';

import type { Slide, GlobalConfig, RenderContext } from '../types/index.js';
import { resolveSlide } from './slot-resolver.js';
import { renderGrid } from './grid.js';

/**
 * Render a single slide using the grid engine.
 * This is the new unified entry point that replaces per-layout renderers.
 */
export function renderSlideV2(slide: Slide, config: GlobalConfig, context: RenderContext): string {
  const { layout, slots, containerStyle, slideOptions } = resolveSlide(slide, config, context);
  return renderGrid({ layout, slots, containerStyle, slideOptions }, config, context);
}
