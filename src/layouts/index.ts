import type { Slide, GlobalConfig, RenderContext } from '../types/index.js';
import { renderSlideV2 } from '../engine/index.js';

/**
 * Render a single slide.
 *
 * As of v0.2, all layouts are driven by the unified Grid Engine.
 * The old per-layout renderers in this directory are kept for reference
 * but are no longer called.
 */
export function renderSlide(slide: Slide, config: GlobalConfig, context?: RenderContext): string {
  const ctx: RenderContext = context ?? {
    slideIndex: 0,
    totalSlides: 1,
    budget: {
      canvasWidth: 1920,
      canvasHeight: 1080,
      contentWidth: 1760,
      contentHeight: 840,
      bodyHeight: 608,
      chromeHeight: 232,
    },
  };
  return renderSlideV2(slide, config, ctx);
}
