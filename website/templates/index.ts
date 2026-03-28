export interface Template {
  id: string
  name: string
  description: string
  category: 'product' | 'business' | 'tech' | 'minimal'
  thumbnail: {
    background: string
    accent: string
    style: string
  }
  content: string
}

export { appleProductTemplate } from './apple-product'
export { startupPitchTemplate } from './startup-pitch'
export { quarterlyReviewTemplate } from './quarterly-review'
export { techArchitectureTemplate } from './tech-architecture'
export { minimalDarkTemplate } from './minimal-dark'
export { devMeetupTemplate } from './dev-meetup'
export { imageMetricsTemplate } from './image-metrics'
export { inlineGalleryTemplate } from './inline-gallery'

import { appleProductTemplate } from './apple-product'
import { startupPitchTemplate } from './startup-pitch'
import { quarterlyReviewTemplate } from './quarterly-review'
import { techArchitectureTemplate } from './tech-architecture'
import { minimalDarkTemplate } from './minimal-dark'
import { devMeetupTemplate } from './dev-meetup'
import { imageMetricsTemplate } from './image-metrics'
import { inlineGalleryTemplate } from './inline-gallery'

export const templates: Template[] = [
  appleProductTemplate,
  imageMetricsTemplate,
  inlineGalleryTemplate,
  devMeetupTemplate,
  startupPitchTemplate,
  quarterlyReviewTemplate,
  techArchitectureTemplate,
  minimalDarkTemplate,
]
