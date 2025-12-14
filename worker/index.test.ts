import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseUserAgent,
  getTimeContext,
  hashString,
  getClientIP,
  getDefaultCategorizationResult,
  sanitizeCategorizationResult,
  getDefaultLayout,
} from './index';
import { TAG_GUIDELINES } from './prompts';

/**
 * Worker Pure Functions Tests
 *
 * These tests verify the logic of pure functions in the worker.
 * Functions are now exported from index.ts for better testability.
 */

describe('Worker Pure Functions', () => {
  describe('parseUserAgent', () => {
    it('returns desktop type for null user agent', () => {
      const result = parseUserAgent(null);
      expect(result.type).toBe('desktop');
    });

    it('returns desktop type for empty string', () => {
      const result = parseUserAgent('');
      expect(result.type).toBe('desktop');
    });

    describe('mobile detection', () => {
      it('detects iPhone', () => {
        const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15';
        expect(parseUserAgent(ua).type).toBe('mobile');
      });

      it('detects Android mobile', () => {
        const ua = 'Mozilla/5.0 (Linux; Android 10; SM-G960U Mobile) AppleWebKit/537.36';
        expect(parseUserAgent(ua).type).toBe('mobile');
      });

      it('detects Windows Phone', () => {
        const ua = 'Mozilla/5.0 (Windows Phone 10.0) AppleWebKit/537.36';
        expect(parseUserAgent(ua).type).toBe('mobile');
      });
    });

    describe('tablet detection', () => {
      it('detects iPad', () => {
        const ua = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15';
        expect(parseUserAgent(ua).type).toBe('tablet');
      });

      it('detects Android tablet (no mobile keyword)', () => {
        const ua = 'Mozilla/5.0 (Linux; Android 10; SM-T860) AppleWebKit/537.36';
        expect(parseUserAgent(ua).type).toBe('tablet');
      });

      it('detects Kindle', () => {
        const ua = 'Mozilla/5.0 (Linux; U; Android 4.0.3; en-us; Kindle)';
        expect(parseUserAgent(ua).type).toBe('tablet');
      });
    });

    describe('browser detection', () => {
      it('detects Chrome browser', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        expect(parseUserAgent(ua).browser).toBe('Chrome');
      });

      it('detects Safari browser (not Chrome)', () => {
        const ua =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
        expect(parseUserAgent(ua).browser).toBe('Safari');
      });

      it('detects Edge browser', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0 Safari/537.36 Edg/91.0.864.59';
        expect(parseUserAgent(ua).browser).toBe('Edge');
      });

      it('detects Firefox browser', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
        expect(parseUserAgent(ua).browser).toBe('Firefox');
      });

      it('detects Opera browser', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 OPR/77.0';
        expect(parseUserAgent(ua).browser).toBe('Opera');
      });
    });

    describe('OS detection', () => {
      it('detects Windows OS', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
        expect(parseUserAgent(ua).os).toBe('Windows');
      });

      it('detects macOS', () => {
        const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
        expect(parseUserAgent(ua).os).toBe('macOS');
      });

      it('detects iOS', () => {
        const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
        expect(parseUserAgent(ua).os).toBe('iOS');
      });

      it('detects Android', () => {
        const ua = 'Mozilla/5.0 (Linux; Android 10; SM-G960U)';
        expect(parseUserAgent(ua).os).toBe('Android');
      });

      it('detects Linux', () => {
        const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
        expect(parseUserAgent(ua).os).toBe('Linux');
      });
    });
  });

  describe('getTimeContext', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns morning for hours 5-11', () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00Z'));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe('morning');
      expect(result.localHour).toBe(9);
    });

    it('returns afternoon for hours 12-16', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00Z'));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe('afternoon');
    });

    it('returns evening for hours 17-20', () => {
      vi.setSystemTime(new Date('2024-01-15T18:00:00Z'));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe('evening');
    });

    it('returns night for hours 21-4', () => {
      vi.setSystemTime(new Date('2024-01-15T23:00:00Z'));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe('night');
    });

    it('returns night for early morning hours', () => {
      vi.setSystemTime(new Date('2024-01-15T03:00:00Z'));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe('night');
    });

    it('detects weekend correctly (Saturday)', () => {
      vi.setSystemTime(new Date('2024-01-13T12:00:00Z')); // Saturday

      const result = getTimeContext();
      expect(result.isWeekend).toBe(true);
    });

    it('detects weekend correctly (Sunday)', () => {
      vi.setSystemTime(new Date('2024-01-14T12:00:00Z')); // Sunday

      const result = getTimeContext();
      expect(result.isWeekend).toBe(true);
    });

    it('detects weekday correctly', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Monday

      const result = getTimeContext();
      expect(result.isWeekend).toBe(false);
    });

    it('handles valid timezone', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // America/New_York is UTC-5 in winter
      const result = getTimeContext('America/New_York');
      expect(result.localHour).toBe(7);
      expect(result.timeOfDay).toBe('morning');
    });

    it('falls back to UTC for invalid timezone', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const result = getTimeContext('Invalid/Timezone');
      expect(result.localHour).toBe(12);
    });
  });

  describe('hashString', () => {
    it('returns consistent hash for same input', () => {
      const hash1 = hashString('test');
      const hash2 = hashString('test');
      expect(hash1).toBe(hash2);
    });

    it('returns different hashes for different inputs', () => {
      const hash1 = hashString('test1');
      const hash2 = hashString('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('returns a string', () => {
      const hash = hashString('test');
      expect(typeof hash).toBe('string');
    });

    it('handles empty string', () => {
      const hash = hashString('');
      expect(hash).toBe('0');
    });

    it('returns base36 encoded value', () => {
      const hash = hashString('test');
      expect(hash).toMatch(/^[0-9a-z]+$/);
    });

    it('handles long strings', () => {
      const longString = 'a'.repeat(10000);
      const hash = hashString(longString);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('handles special characters', () => {
      const hash = hashString('hello@world#123');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('getClientIP', () => {
    it('extracts CF-Connecting-IP header when present', () => {
      const request = new Request('https://example.com', {
        headers: { 'CF-Connecting-IP': '1.2.3.4' },
      });
      expect(getClientIP(request)).toBe('1.2.3.4');
    });

    it('falls back to X-Forwarded-For when CF-Connecting-IP is missing', () => {
      const request = new Request('https://example.com', {
        headers: { 'X-Forwarded-For': '5.6.7.8, 9.10.11.12' },
      });
      expect(getClientIP(request)).toBe('5.6.7.8');
    });

    it('extracts first IP from X-Forwarded-For chain', () => {
      const request = new Request('https://example.com', {
        headers: { 'X-Forwarded-For': ' 1.1.1.1 , 2.2.2.2, 3.3.3.3' },
      });
      expect(getClientIP(request)).toBe('1.1.1.1');
    });

    it('returns null when no IP headers present', () => {
      const request = new Request('https://example.com');
      expect(getClientIP(request)).toBeNull();
    });

    it('prefers CF-Connecting-IP over X-Forwarded-For', () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '1.2.3.4',
          'X-Forwarded-For': '5.6.7.8',
        },
      });
      expect(getClientIP(request)).toBe('1.2.3.4');
    });
  });

  describe('getDefaultCategorizationResult', () => {
    it('returns matched status', () => {
      const result = getDefaultCategorizationResult();
      expect(result.status).toBe('matched');
    });

    it('returns friend as tag name', () => {
      const result = getDefaultCategorizationResult();
      expect(result.tagName).toBe('friend');
    });

    it('returns confidence of 1', () => {
      const result = getDefaultCategorizationResult();
      expect(result.confidence).toBe(1);
    });

    it('returns friend guidelines', () => {
      const result = getDefaultCategorizationResult();
      expect(result.guidelines).toBe(TAG_GUIDELINES.friend);
    });

    it('returns Default fallback as reason', () => {
      const result = getDefaultCategorizationResult();
      expect(result.reason).toBe('Default fallback');
    });
  });

  describe('sanitizeCategorizationResult', () => {
    it('converts tag name to lowercase', () => {
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: 'MyTag',
        displayName: 'My Tag',
        guidelines: 'Some guidelines',
        confidence: 0.8,
        reason: 'Test',
      });
      expect(result.tagName).toBe('mytag');
    });

    it('replaces special characters with hyphens', () => {
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: 'my@tag#here',
        displayName: 'My Tag',
        guidelines: 'Some guidelines',
        confidence: 0.8,
        reason: 'Test',
      });
      expect(result.tagName).toBe('my-tag-here');
    });

    it('collapses multiple hyphens', () => {
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: 'my---tag',
        displayName: 'My Tag',
        guidelines: 'Some guidelines',
        confidence: 0.8,
        reason: 'Test',
      });
      expect(result.tagName).toBe('my-tag');
    });

    it('removes leading and trailing hyphens', () => {
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: '-mytag-',
        displayName: 'My Tag',
        guidelines: 'Some guidelines',
        confidence: 0.8,
        reason: 'Test',
      });
      expect(result.tagName).toBe('mytag');
    });

    it('truncates tag name to 20 characters', () => {
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: 'a'.repeat(30),
        displayName: 'Long Tag',
        guidelines: 'Some guidelines',
        confidence: 0.8,
        reason: 'Test',
      });
      expect(result.tagName.length).toBe(20);
    });

    it('uses friend for empty tag after sanitization', () => {
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: '---',
        displayName: 'Invalid',
        guidelines: 'Some guidelines',
        confidence: 0.8,
        reason: 'Test',
      });
      expect(result.tagName).toBe('friend');
    });

    it('uses canonical guidelines for matched known tags', () => {
      const result = sanitizeCategorizationResult({
        status: 'matched',
        tagName: 'recruiter',
        displayName: 'Recruiter',
        guidelines: 'Old guidelines',
        confidence: 0.9,
        reason: 'Test',
      });
      expect(result.guidelines).toBe(TAG_GUIDELINES.recruiter);
    });

    it('forces friend tag for rejected status', () => {
      const result = sanitizeCategorizationResult({
        status: 'rejected',
        tagName: 'spam',
        displayName: 'Spam',
        guidelines: 'Spam guidelines',
        confidence: 0.1,
        reason: 'Looks suspicious',
      });
      expect(result.tagName).toBe('friend');
      expect(result.guidelines).toBe(TAG_GUIDELINES.friend);
    });

    it('preserves guidelines for new_tag status', () => {
      const customGuidelines = 'Focus on investment potential, market opportunities, and startup ROI metrics';
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: 'investor',
        displayName: 'Investor',
        guidelines: customGuidelines,
        confidence: 0.85,
        reason: 'New audience type identified',
      });
      expect(result.status).toBe('new_tag');
      expect(result.tagName).toBe('investor');
      expect(result.guidelines).toBe(customGuidelines);
    });

    it('clamps confidence between 0 and 1 (high value)', () => {
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: 'custom',
        displayName: 'Custom',
        guidelines: 'Custom guidelines',
        confidence: 1.5,
        reason: 'Test',
      });
      expect(result.confidence).toBe(1);
    });

    it('clamps confidence between 0 and 1 (negative value)', () => {
      const result = sanitizeCategorizationResult({
        status: 'new_tag',
        tagName: 'custom',
        displayName: 'Custom',
        guidelines: 'Custom guidelines',
        confidence: -0.5,
        reason: 'Test',
      });
      expect(result.confidence).toBe(0);
    });
  });

  describe('getDefaultLayout', () => {
    const mockPortfolio = {
      personal: {
        name: 'Test User',
        title: 'Software Engineer',
        bio: 'Building cool stuff',
        contact: {
          email: 'test@example.com',
          linkedin: 'https://linkedin.com/in/test',
          github: 'https://github.com/test',
        },
        resumeUrl: 'https://example.com/resume.pdf',
      },
      projects: [
        {
          id: 'proj-1',
          title: 'Project 1',
          description: 'Desc 1',
          technologies: [],
          image: '',
          links: {},
          tags: [],
        },
        {
          id: 'proj-2',
          title: 'Project 2',
          description: 'Desc 2',
          technologies: [],
          image: '',
          links: {},
          tags: [],
        },
        {
          id: 'proj-3',
          title: 'Project 3',
          description: 'Desc 3',
          technologies: [],
          image: '',
          links: {},
          tags: [],
        },
        {
          id: 'proj-4',
          title: 'Project 4',
          description: 'Desc 4',
          technologies: [],
          image: '',
          links: {},
          tags: [],
        },
        {
          id: 'proj-5',
          title: 'Project 5',
          description: 'Desc 5',
          technologies: [],
          image: '',
          links: {},
          tags: [],
        },
      ],
      experience: [],
      skills: [],
      education: [],
    };

    describe('recruiter layout', () => {
      it('uses hero-focused layout', () => {
        const layout = getDefaultLayout('recruiter', mockPortfolio);
        expect(layout.layout).toBe('hero-focused');
      });

      it('includes resume CTA when resumeUrl is provided', () => {
        const layout = getDefaultLayout('recruiter', mockPortfolio);
        const heroProps = layout.sections[0].props as { cta?: { text: string; href: string } };
        expect(heroProps.cta?.text).toBe('View Resume');
        expect(heroProps.cta?.href).toBe('https://example.com/resume.pdf');
      });

      it('includes SkillBadges section', () => {
        const layout = getDefaultLayout('recruiter', mockPortfolio);
        const skillSection = layout.sections.find((s) => s.type === 'SkillBadges');
        expect(skillSection).toBeDefined();
        expect(skillSection?.props.style).toBe('detailed');
      });

      it('includes Timeline section', () => {
        const layout = getDefaultLayout('recruiter', mockPortfolio);
        const timelineSection = layout.sections.find((s) => s.type === 'Timeline');
        expect(timelineSection).toBeDefined();
      });

      it('includes CardGrid with first 4 projects', () => {
        const layout = getDefaultLayout('recruiter', mockPortfolio);
        const cardGrid = layout.sections.find((s) => s.type === 'CardGrid');
        expect(cardGrid?.props.columns).toBe(2);
        expect((cardGrid?.props.items as string[]).length).toBe(4);
      });
    });

    describe('developer layout', () => {
      it('uses two-column layout', () => {
        const layout = getDefaultLayout('developer', mockPortfolio);
        expect(layout.layout).toBe('two-column');
      });

      it('includes CardGrid with all projects', () => {
        const layout = getDefaultLayout('developer', mockPortfolio);
        const cardGrid = layout.sections.find((s) => s.type === 'CardGrid');
        expect(cardGrid?.props.columns).toBe(3);
        expect((cardGrid?.props.items as string[]).length).toBe(5);
      });

      it('includes ContactForm with GitHub and email', () => {
        const layout = getDefaultLayout('developer', mockPortfolio);
        const contactForm = layout.sections.find((s) => s.type === 'ContactForm');
        expect(contactForm?.props.showGitHub).toBe(true);
        expect(contactForm?.props.showEmail).toBe(true);
      });
    });

    describe('collaborator layout', () => {
      it('uses hero-focused layout', () => {
        const layout = getDefaultLayout('collaborator', mockPortfolio);
        expect(layout.layout).toBe('hero-focused');
      });

      it('includes TextBlock with bio', () => {
        const layout = getDefaultLayout('collaborator', mockPortfolio);
        const textBlock = layout.sections.find((s) => s.type === 'TextBlock');
        expect(textBlock?.props.content).toBe('Building cool stuff');
        expect(textBlock?.props.style).toBe('prose');
      });

      it('includes ContactForm with all contact options', () => {
        const layout = getDefaultLayout('collaborator', mockPortfolio);
        const contactForm = layout.sections.find((s) => s.type === 'ContactForm');
        expect(contactForm?.props.showEmail).toBe(true);
        expect(contactForm?.props.showLinkedIn).toBe(true);
        expect(contactForm?.props.showGitHub).toBe(true);
      });

      it('includes CardGrid with first 2 projects', () => {
        const layout = getDefaultLayout('collaborator', mockPortfolio);
        const cardGrid = layout.sections.find((s) => s.type === 'CardGrid');
        expect((cardGrid?.props.items as string[]).length).toBe(2);
      });
    });

    describe('friend layout', () => {
      it('uses single-column layout', () => {
        const layout = getDefaultLayout('friend', mockPortfolio);
        expect(layout.layout).toBe('single-column');
      });

      it('includes TextBlock with prose style', () => {
        const layout = getDefaultLayout('friend', mockPortfolio);
        const textBlock = layout.sections.find((s) => s.type === 'TextBlock');
        expect(textBlock?.props.style).toBe('prose');
      });

      it('includes ImageGallery', () => {
        const layout = getDefaultLayout('friend', mockPortfolio);
        const gallery = layout.sections.find((s) => s.type === 'ImageGallery');
        expect(gallery).toBeDefined();
      });

      it('includes photo paths in ImageGallery when photos exist', () => {
        const portfolioWithPhotos = {
          ...mockPortfolio,
          photos: [
            { path: '/assets/photo1.jpg', description: 'Photo 1' },
            { path: '/assets/photo2.jpg', description: 'Photo 2' },
            { path: '/assets/photo3.jpg', description: 'Photo 3' },
          ],
        };

        const layout = getDefaultLayout('friend', portfolioWithPhotos);
        const gallery = layout.sections.find((s) => s.type === 'ImageGallery');

        expect(gallery?.props.images).toEqual(['/assets/photo1.jpg', '/assets/photo2.jpg', '/assets/photo3.jpg']);
      });

      it('includes empty array when photos is undefined', () => {
        // mockPortfolio doesn't have photos property
        const layout = getDefaultLayout('friend', mockPortfolio);
        const gallery = layout.sections.find((s) => s.type === 'ImageGallery');

        expect(gallery?.props.images).toEqual([]);
      });
    });

    describe('unknown visitor tag', () => {
      it('defaults to friend layout', () => {
        const layout = getDefaultLayout('unknown-tag', mockPortfolio);
        expect(layout.layout).toBe('single-column');
      });

      it('includes ImageGallery like friend layout', () => {
        const layout = getDefaultLayout('some-random-tag', mockPortfolio);
        const gallery = layout.sections.find((s) => s.type === 'ImageGallery');
        expect(gallery).toBeDefined();
      });
    });

    describe('common layout elements', () => {
      it('always includes Hero section first', () => {
        const layouts = ['recruiter', 'developer', 'collaborator', 'friend'];
        layouts.forEach((tag) => {
          const layout = getDefaultLayout(tag, mockPortfolio);
          expect(layout.sections[0].type).toBe('Hero');
        });
      });

      it('Hero section includes personal info', () => {
        const layout = getDefaultLayout('friend', mockPortfolio);
        const heroProps = layout.sections[0].props;
        expect(heroProps.title).toBe('Test User');
        expect(heroProps.subtitle).toBe('Software Engineer');
        expect(heroProps.image).toBe('/assets/profile.png');
      });

      it('always has blue accent theme', () => {
        const layouts = ['recruiter', 'developer', 'collaborator', 'friend'];
        layouts.forEach((tag) => {
          const layout = getDefaultLayout(tag, mockPortfolio);
          expect(layout.theme.accent).toBe('blue');
        });
      });
    });
  });
});
