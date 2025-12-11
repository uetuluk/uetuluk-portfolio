import type { PortfolioContent } from '../../worker/types';

/**
 * Test variable configuration
 */
export interface TestVars {
  visitorTag?: 'RECRUITER' | 'DEVELOPER' | 'COLLABORATOR' | 'FRIEND' | string;
  customIntent?: string;
  portfolioContent?: PortfolioContent;
}

/**
 * Categorization test result
 */
export interface CategorizationTestResult {
  status: 'matched' | 'new_tag' | 'rejected';
  tagName: string;
  displayName?: string;
  guidelines?: string;
  confidence?: number;
  reason?: string;
}

/**
 * Layout test result
 */
export interface LayoutTestResult {
  layout: 'single-column' | 'two-column' | 'hero-focused';
  theme: {
    accent: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  };
  sections: Array<{
    type:
      | 'Hero'
      | 'CardGrid'
      | 'SkillBadges'
      | 'Timeline'
      | 'ContactForm'
      | 'TextBlock'
      | 'ImageGallery';
    props: Record<string, unknown>;
  }>;
}
