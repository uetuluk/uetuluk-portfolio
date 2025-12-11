import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { StructuredData } from './StructuredData';

// Track useHead calls
interface ScriptConfig {
  type: string;
  innerHTML: string;
}

let useHeadCalls: Array<{ script?: ScriptConfig[] }> = [];

// Mock @unhead/react
vi.mock('@unhead/react', () => ({
  useHead: (config: { script?: ScriptConfig[] }) => {
    useHeadCalls.push(config);
  },
}));

// Mock react-i18next with configurable language
let mockLanguage = 'en';
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: mockLanguage },
  }),
}));

// Mock portfolio data
let mockPortfolio = {
  personal: {
    name: 'Test User',
    title: 'Software Engineer',
    bio: 'A passionate developer building great software.',
    location: 'Austin, TX',
    contact: {
      email: 'test@example.com',
      linkedin: 'https://linkedin.com/in/testuser',
      github: 'https://github.com/testuser',
    },
  },
  projects: [],
  experience: [
    {
      company: 'TechCorp',
      role: 'Senior Engineer',
      period: '2020-Present',
      description: 'Building awesome stuff',
    },
  ],
  skills: ['TypeScript', 'React', 'Node.js'],
  education: [
    {
      institution: 'MIT',
      degree: 'B.S. Computer Science',
      year: '2018',
    },
  ],
};

vi.mock('@/hooks/useTranslatedPortfolio', () => ({
  useTranslatedPortfolio: () => mockPortfolio,
}));

function getSchemaByType(
  scripts: ScriptConfig[] | undefined,
  type: string,
): Record<string, unknown> | null {
  if (!scripts) return null;
  const script = scripts.find((s) => {
    const parsed = JSON.parse(s.innerHTML);
    return parsed['@type'] === type;
  });
  return script ? JSON.parse(script.innerHTML) : null;
}

describe('StructuredData', () => {
  beforeEach(() => {
    useHeadCalls = [];
    mockLanguage = 'en';
    mockPortfolio = {
      personal: {
        name: 'Test User',
        title: 'Software Engineer',
        bio: 'A passionate developer building great software.',
        location: 'Austin, TX',
        contact: {
          email: 'test@example.com',
          linkedin: 'https://linkedin.com/in/testuser',
          github: 'https://github.com/testuser',
        },
      },
      projects: [],
      experience: [
        {
          company: 'TechCorp',
          role: 'Senior Engineer',
          period: '2020-Present',
          description: 'Building awesome stuff',
        },
      ],
      skills: ['TypeScript', 'React', 'Node.js'],
      education: [
        {
          institution: 'MIT',
          degree: 'B.S. Computer Science',
          year: '2018',
        },
      ],
    };
  });

  describe('script generation', () => {
    it('generates three JSON-LD scripts', () => {
      render(<StructuredData />);
      const scripts = useHeadCalls[0].script;
      expect(scripts?.length).toBe(3);
    });

    it('all scripts have application/ld+json type', () => {
      render(<StructuredData />);
      const scripts = useHeadCalls[0].script;
      scripts?.forEach((script) => {
        expect(script.type).toBe('application/ld+json');
      });
    });
  });

  describe('Person schema', () => {
    it('has correct @type', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.['@type']).toBe('Person');
    });

    it('has @context from schema.org', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.['@context']).toBe('https://schema.org');
    });

    it('has @id with person anchor', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.['@id']).toBe('https://uetuluk.com/#person');
    });

    it('includes name from portfolio', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.name).toBe('Test User');
    });

    it('includes url as site URL', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.url).toBe('https://uetuluk.com');
    });

    it('includes image URL', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.image).toBe('https://uetuluk.com/assets/profile.png');
    });

    it('includes jobTitle from portfolio', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.jobTitle).toBe('Software Engineer');
    });

    it('includes description from bio', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.description).toBe('A passionate developer building great software.');
    });

    it('includes worksFor organization from first experience', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      const worksFor = person?.worksFor as Record<string, unknown>;
      expect(worksFor?.['@type']).toBe('Organization');
      expect(worksFor?.name).toBe('TechCorp');
    });

    it('has undefined worksFor when no experience', () => {
      mockPortfolio.experience = [];
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.worksFor).toBeUndefined();
    });

    it('includes address with locality and country', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      const address = person?.address as Record<string, unknown>;
      expect(address?.['@type']).toBe('PostalAddress');
      expect(address?.addressLocality).toBe('Austin');
      expect(address?.addressCountry).toBe('TX');
    });

    it('includes email in mailto format', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.email).toBe('mailto:test@example.com');
    });

    it('includes sameAs with social links', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      const sameAs = person?.sameAs as string[];
      expect(sameAs).toContain('https://linkedin.com/in/testuser');
      expect(sameAs).toContain('https://github.com/testuser');
    });

    it('includes alumniOf with education entries', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      const alumniOf = person?.alumniOf as Array<Record<string, unknown>>;
      expect(alumniOf?.length).toBe(1);
      expect(alumniOf?.[0]?.['@type']).toBe('CollegeOrUniversity');
      expect(alumniOf?.[0]?.name).toBe('MIT');
    });

    it('includes knowsAbout with skills', () => {
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      const knowsAbout = person?.knowsAbout as string[];
      expect(knowsAbout).toContain('TypeScript');
      expect(knowsAbout).toContain('React');
      expect(knowsAbout).toContain('Node.js');
    });

    it('includes inLanguage from i18n', () => {
      mockLanguage = 'ja';
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      expect(person?.inLanguage).toBe('ja');
    });
  });

  describe('WebSite schema', () => {
    it('has correct @type', () => {
      render(<StructuredData />);
      const website = getSchemaByType(useHeadCalls[0].script, 'WebSite');
      expect(website?.['@type']).toBe('WebSite');
    });

    it('has @id with website anchor', () => {
      render(<StructuredData />);
      const website = getSchemaByType(useHeadCalls[0].script, 'WebSite');
      expect(website?.['@id']).toBe('https://uetuluk.com/#website');
    });

    it('includes name with Portfolio suffix', () => {
      render(<StructuredData />);
      const website = getSchemaByType(useHeadCalls[0].script, 'WebSite');
      expect(website?.name).toBe('Test User Portfolio');
    });

    it('includes url as site URL', () => {
      render(<StructuredData />);
      const website = getSchemaByType(useHeadCalls[0].script, 'WebSite');
      expect(website?.url).toBe('https://uetuluk.com');
    });

    it('includes description from bio', () => {
      render(<StructuredData />);
      const website = getSchemaByType(useHeadCalls[0].script, 'WebSite');
      expect(website?.description).toBe('A passionate developer building great software.');
    });

    it('references person in author', () => {
      render(<StructuredData />);
      const website = getSchemaByType(useHeadCalls[0].script, 'WebSite');
      const author = website?.author as Record<string, unknown>;
      expect(author?.['@id']).toBe('https://uetuluk.com/#person');
    });

    it('includes inLanguage from i18n', () => {
      mockLanguage = 'zh';
      render(<StructuredData />);
      const website = getSchemaByType(useHeadCalls[0].script, 'WebSite');
      expect(website?.inLanguage).toBe('zh');
    });
  });

  describe('ProfilePage schema', () => {
    it('has correct @type', () => {
      render(<StructuredData />);
      const profilePage = getSchemaByType(useHeadCalls[0].script, 'ProfilePage');
      expect(profilePage?.['@type']).toBe('ProfilePage');
    });

    it('has @id with profilepage anchor', () => {
      render(<StructuredData />);
      const profilePage = getSchemaByType(useHeadCalls[0].script, 'ProfilePage');
      expect(profilePage?.['@id']).toBe('https://uetuluk.com/#profilepage');
    });

    it('references person in mainEntity', () => {
      render(<StructuredData />);
      const profilePage = getSchemaByType(useHeadCalls[0].script, 'ProfilePage');
      const mainEntity = profilePage?.mainEntity as Record<string, unknown>;
      expect(mainEntity?.['@id']).toBe('https://uetuluk.com/#person');
    });

    it('includes dateModified in ISO 8601 format', () => {
      render(<StructuredData />);
      const profilePage = getSchemaByType(useHeadCalls[0].script, 'ProfilePage');
      const dateModified = profilePage?.dateModified as string;
      expect(dateModified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('includes inLanguage from i18n', () => {
      mockLanguage = 'tr';
      render(<StructuredData />);
      const profilePage = getSchemaByType(useHeadCalls[0].script, 'ProfilePage');
      expect(profilePage?.inLanguage).toBe('tr');
    });
  });

  describe('component rendering', () => {
    it('returns null (renders nothing to DOM)', () => {
      const { container } = render(<StructuredData />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles location without comma separator', () => {
      mockPortfolio.personal.location = 'Austin';
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      const address = person?.address as Record<string, unknown>;
      expect(address?.addressLocality).toBe('Austin');
      expect(address?.addressCountry).toBeUndefined();
    });

    it('handles empty education array', () => {
      mockPortfolio.education = [];
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      const alumniOf = person?.alumniOf as Array<Record<string, unknown>>;
      expect(alumniOf).toEqual([]);
    });

    it('handles empty skills array', () => {
      mockPortfolio.skills = [];
      render(<StructuredData />);
      const person = getSchemaByType(useHeadCalls[0].script, 'Person');
      const knowsAbout = person?.knowsAbout as string[];
      expect(knowsAbout).toEqual([]);
    });
  });
});
