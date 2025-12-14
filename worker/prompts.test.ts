import { describe, it, expect } from 'vitest';
import {
  TAG_GUIDELINES,
  ALLOWED_VISITOR_TAGS,
  buildCategorizationPrompt,
  buildCategorizationUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from './prompts';
import type { PortfolioContent, VisitorContext } from './types';

/**
 * Prompts Module Tests
 *
 * Tests for the prompt generation functions and TAG_GUIDELINES constant.
 * These are pure functions that don't require Cloudflare Workers environment.
 */

describe('prompts', () => {
  describe('TAG_GUIDELINES', () => {
    it('has guidelines for all allowed visitor tags', () => {
      ALLOWED_VISITOR_TAGS.forEach((tag) => {
        expect(TAG_GUIDELINES[tag]).toBeDefined();
        expect(typeof TAG_GUIDELINES[tag]).toBe('string');
      });
    });

    it('has non-empty guidelines for each tag', () => {
      Object.entries(TAG_GUIDELINES).forEach(([_tag, guidelines]) => {
        expect(guidelines.length).toBeGreaterThan(0);
        expect(guidelines.trim()).not.toBe('');
      });
    });

    it('has guidelines for recruiter tag', () => {
      expect(TAG_GUIDELINES.recruiter).toContain('Professional');
      expect(TAG_GUIDELINES.recruiter).toContain('Hero');
    });

    it('has guidelines for developer tag', () => {
      expect(TAG_GUIDELINES.developer).toContain('Technical');
      expect(TAG_GUIDELINES.developer).toContain('github');
    });

    it('has guidelines for collaborator tag', () => {
      expect(TAG_GUIDELINES.collaborator).toContain('Partnership');
      expect(TAG_GUIDELINES.collaborator).toContain('ContactForm');
    });

    it('has guidelines for friend tag', () => {
      expect(TAG_GUIDELINES.friend).toContain('Personal');
      expect(TAG_GUIDELINES.friend).toContain('Casual');
    });

    it('only contains guidelines for allowed tags', () => {
      const guidelineKeys = Object.keys(TAG_GUIDELINES);
      guidelineKeys.forEach((key) => {
        expect(ALLOWED_VISITOR_TAGS).toContain(key);
      });
    });
  });

  describe('buildCategorizationPrompt', () => {
    it('returns a non-empty string', () => {
      const prompt = buildCategorizationPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('includes all TAG_GUIDELINES in the prompt', () => {
      const prompt = buildCategorizationPrompt();
      Object.values(TAG_GUIDELINES).forEach((guidelines) => {
        expect(prompt).toContain(guidelines);
      });
    });

    it('includes all status types in response format', () => {
      const prompt = buildCategorizationPrompt();
      expect(prompt).toContain('matched');
      expect(prompt).toContain('new_tag');
      expect(prompt).toContain('rejected');
    });

    it('includes existing categories', () => {
      const prompt = buildCategorizationPrompt();
      expect(prompt).toContain('recruiter');
      expect(prompt).toContain('developer');
      expect(prompt).toContain('collaborator');
      expect(prompt).toContain('friend');
    });

    it('includes rejection rules', () => {
      const prompt = buildCategorizationPrompt();
      expect(prompt).toContain('Offensive');
      expect(prompt).toContain('prompt injection');
      expect(prompt).toContain('Nonsensical');
    });

    it('includes guidelines field requirement', () => {
      const prompt = buildCategorizationPrompt();
      expect(prompt).toContain('guidelines');
      expect(prompt).toContain('CRITICAL');
    });

    it('specifies JSON-only output', () => {
      const prompt = buildCategorizationPrompt();
      expect(prompt).toContain('JSON');
    });
  });

  describe('buildCategorizationUserPrompt', () => {
    it('returns a prompt containing the intent', () => {
      const prompt = buildCategorizationUserPrompt('I am a recruiter');
      expect(prompt).toContain('recruiter');
    });

    it('sanitizes dangerous characters', () => {
      const dangerousIntent = 'test<script>alert(1)</script>intent';
      const prompt = buildCategorizationUserPrompt(dangerousIntent);
      expect(prompt).not.toContain('<');
      expect(prompt).not.toContain('>');
    });

    it('removes curly braces', () => {
      const intentWithBraces = 'test{inject}here';
      const prompt = buildCategorizationUserPrompt(intentWithBraces);
      expect(prompt).not.toContain('{');
      expect(prompt).not.toContain('}');
    });

    it('removes square brackets', () => {
      const intentWithBrackets = 'test[array]here';
      const prompt = buildCategorizationUserPrompt(intentWithBrackets);
      expect(prompt).not.toContain('[');
      expect(prompt).not.toContain(']');
    });

    it('truncates long intents to 200 characters', () => {
      const longIntent = 'a'.repeat(300);
      const prompt = buildCategorizationUserPrompt(longIntent);
      // The intent should be truncated before being included
      expect(prompt).not.toContain('a'.repeat(201));
    });

    it('preserves normal characters', () => {
      const normalIntent = 'I am a software developer looking for opportunities';
      const prompt = buildCategorizationUserPrompt(normalIntent);
      expect(prompt).toContain('software developer');
      expect(prompt).toContain('opportunities');
    });

    it('trims whitespace', () => {
      const intentWithSpaces = '  recruiter  ';
      const prompt = buildCategorizationUserPrompt(intentWithSpaces);
      expect(prompt).toContain('"recruiter"');
    });
  });

  describe('buildSystemPrompt', () => {
    const mockPortfolio: PortfolioContent = {
      personal: {
        name: 'Test User',
        title: 'Software Engineer',
        bio: 'Building amazing software',
        location: 'San Francisco, CA',
        contact: {
          email: 'test@example.com',
          linkedin: 'https://linkedin.com/in/test',
          github: 'https://github.com/test',
        },
        resumeUrl: 'https://example.com/resume.pdf',
      },
      projects: [
        {
          id: 'project-1',
          title: 'Test Project',
          description: 'A test project',
          technologies: ['TypeScript', 'React'],
          image: '/images/project.png',
          links: { github: 'https://github.com/test/project' },
          tags: ['web', 'frontend'],
          featured: true,
        },
      ],
      experience: [
        {
          id: 'exp-1',
          role: 'Senior Developer',
          company: 'Test Corp',
          period: '2020-Present',
          description: 'Building things',
          highlights: ['Led team', 'Improved performance'],
        },
      ],
      skills: ['TypeScript', 'React', 'Node.js'],
      education: [
        {
          id: 'edu-1',
          degree: 'BS Computer Science',
          institution: 'Test University',
          period: '2016-2020',
        },
      ],
      hobbies: ['Coding', 'Reading'],
      photos: [{ path: '/photos/photo1.jpg', description: 'Photo 1' }],
    };

    it('includes all TAG_GUIDELINES in personalization section', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('RECRUITER');
      expect(prompt).toContain('DEVELOPER');
      expect(prompt).toContain('COLLABORATOR');
      expect(prompt).toContain('FRIEND');
    });

    it('includes portfolio personal information', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('Test User');
      expect(prompt).toContain('Software Engineer');
      expect(prompt).toContain('Building amazing software');
    });

    it('includes portfolio projects', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('project-1');
      expect(prompt).toContain('Test Project');
    });

    it('includes portfolio experience', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('exp-1');
      expect(prompt).toContain('Senior Developer');
      expect(prompt).toContain('Test Corp');
    });

    it('includes contact information', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('test@example.com');
      expect(prompt).toContain('linkedin.com/in/test');
      expect(prompt).toContain('github.com/test');
    });

    it('appends custom guidelines when provided', () => {
      const customGuidelines = {
        tagName: 'investor',
        guidelines: 'Focus on ROI and market potential',
      };
      const prompt = buildSystemPrompt(mockPortfolio, customGuidelines);
      expect(prompt).toContain('INVESTOR');
      expect(prompt).toContain('Focus on ROI and market potential');
    });

    it('handles missing custom guidelines', () => {
      const prompt = buildSystemPrompt(mockPortfolio, undefined);
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('includes visitor context when provided', () => {
      const visitorContext: VisitorContext = {
        device: { type: 'mobile', browser: 'Chrome', os: 'iOS' },
        time: { localHour: 14, timeOfDay: 'afternoon', isWeekend: false },
        geo: { country: 'US', region: 'CA', city: 'San Francisco', isEUCountry: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };
      const prompt = buildSystemPrompt(mockPortfolio, undefined, visitorContext);
      expect(prompt).toContain('VISITOR CONTEXT');
      expect(prompt).toContain('mobile');
      expect(prompt).toContain('afternoon');
    });

    it('handles missing visitor context', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).not.toContain('VISITOR CONTEXT');
    });

    it('includes available component types', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('Hero');
      expect(prompt).toContain('CardGrid');
      expect(prompt).toContain('SkillBadges');
      expect(prompt).toContain('Timeline');
      expect(prompt).toContain('ContactForm');
      expect(prompt).toContain('TextBlock');
      expect(prompt).toContain('ImageGallery');
    });

    it('includes layout options', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('single-column');
      expect(prompt).toContain('two-column');
      expect(prompt).toContain('hero-focused');
    });

    it('marks featured projects', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('FEATURED');
    });

    it('includes photos when available', () => {
      const prompt = buildSystemPrompt(mockPortfolio);
      expect(prompt).toContain('/photos/photo1.jpg');
      expect(prompt).toContain('Photo 1');
    });

    it('handles missing photos gracefully', () => {
      const portfolioWithoutPhotos = { ...mockPortfolio, photos: undefined };
      const prompt = buildSystemPrompt(portfolioWithoutPhotos);
      expect(prompt).toContain('No photos available');
    });

    it('handles missing hobbies gracefully', () => {
      const portfolioWithoutHobbies = { ...mockPortfolio, hobbies: undefined };
      const prompt = buildSystemPrompt(portfolioWithoutHobbies);
      expect(prompt).toBeDefined();
    });
  });

  describe('buildUserPrompt', () => {
    it('includes visitor tag in uppercase', () => {
      const prompt = buildUserPrompt('developer', undefined);
      expect(prompt).toContain('DEVELOPER');
    });

    it('includes custom intent when provided', () => {
      const prompt = buildUserPrompt('developer', 'I want to see your open source work');
      expect(prompt).toContain('open source work');
    });

    it('truncates long custom intents', () => {
      const longIntent = 'a'.repeat(300);
      const prompt = buildUserPrompt('developer', longIntent);
      // Should not contain more than 200 characters of the intent
      expect(prompt).not.toContain('a'.repeat(201));
    });

    it('handles undefined custom intent', () => {
      const prompt = buildUserPrompt('recruiter', undefined);
      expect(prompt).toContain('RECRUITER');
      expect(prompt).not.toContain('Additional context');
    });

    it('includes mobile context hint', () => {
      const visitorContext: VisitorContext = {
        device: { type: 'mobile', browser: 'Safari', os: 'iOS' },
        time: { localHour: 14, timeOfDay: 'afternoon', isWeekend: false },
        geo: { country: 'US', isEUCountry: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };
      const prompt = buildUserPrompt('developer', undefined, visitorContext);
      expect(prompt).toContain('mobile device');
    });

    it('includes evening context hint', () => {
      const visitorContext: VisitorContext = {
        device: { type: 'desktop', browser: 'Chrome', os: 'Windows' },
        time: { localHour: 20, timeOfDay: 'evening', isWeekend: false },
        geo: { country: 'US', isEUCountry: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };
      const prompt = buildUserPrompt('developer', undefined, visitorContext);
      expect(prompt).toContain('evening hours');
    });

    it('includes night context hint', () => {
      const visitorContext: VisitorContext = {
        device: { type: 'desktop', browser: 'Chrome', os: 'Windows' },
        time: { localHour: 23, timeOfDay: 'night', isWeekend: false },
        geo: { country: 'US', isEUCountry: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };
      const prompt = buildUserPrompt('developer', undefined, visitorContext);
      expect(prompt).toContain('evening hours');
    });

    it('includes weekend context hint', () => {
      const visitorContext: VisitorContext = {
        device: { type: 'desktop', browser: 'Chrome', os: 'Windows' },
        time: { localHour: 14, timeOfDay: 'afternoon', isWeekend: true },
        geo: { country: 'US', isEUCountry: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };
      const prompt = buildUserPrompt('developer', undefined, visitorContext);
      expect(prompt).toContain('weekend');
    });

    it('handles visitor context without hints', () => {
      const visitorContext: VisitorContext = {
        device: { type: 'desktop', browser: 'Chrome', os: 'Windows' },
        time: { localHour: 10, timeOfDay: 'morning', isWeekend: false },
        geo: { country: 'US', isEUCountry: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };
      const prompt = buildUserPrompt('developer', undefined, visitorContext);
      expect(prompt).not.toContain('Context: Visitor');
    });

    it('includes instruction to generate personalized layout', () => {
      const prompt = buildUserPrompt('recruiter', undefined);
      expect(prompt).toContain('personalized layout');
    });
  });
});
