import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslatedPortfolio } from './useTranslatedPortfolio';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      // Simulate translation by prefixing with [translated]
      const translations: Record<string, string> = {
        'personal.name': '[translated] Test User',
        'personal.title': '[translated] Test Engineer',
        'personal.bio': '[translated] Test bio',
        'personal.location': '[translated] Test City',
        'projects.project-1.title': '[translated] Project One',
        'projects.project-1.description': '[translated] Project one desc',
        'projects.project-1.longDescription': '[translated] Project one long',
        'experience.exp-1.company': '[translated] Test Company',
        'experience.exp-1.role': '[translated] Test Role',
        'experience.exp-1.period': '[translated] 2020 - Present',
        'experience.exp-1.description': '[translated] Exp description',
        'experience.exp-1.highlights.0': '[translated] Highlight 1',
        'experience.exp-1.highlights.1': '[translated] Highlight 2',
        'education.edu-1.institution': '[translated] Test University',
        'education.edu-1.degree': '[translated] Test Degree',
        'education.edu-1.period': '[translated] 2015 - 2019',
        'education.edu-1.highlights.0': '[translated] GPA 4.0',
        'education.edu-1.highlights.1': '[translated] Honor Student',
      };
      return translations[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

// Mock portfolio.json - data must be inline since vi.mock is hoisted
vi.mock('@/content/portfolio.json', () => ({
  default: {
    personal: {
      name: 'Test User',
      title: 'Test Engineer',
      bio: 'Test bio description',
      location: 'Test City',
      contact: {
        email: 'test@example.com',
        linkedin: 'https://linkedin.com/in/test',
        github: 'https://github.com/test',
      },
    },
    projects: [
      {
        id: 'project-1',
        title: 'Project One',
        description: 'Project one description',
        longDescription: 'Project one long description',
        technologies: ['React', 'TypeScript'],
        image: '/assets/project1.png',
        links: {},
        tags: ['web'],
        featured: true,
      },
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'Test Company',
        role: 'Test Role',
        period: '2020 - Present',
        description: 'Test experience description',
        highlights: ['Highlight 1', 'Highlight 2'],
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'Test University',
        degree: 'Test Degree',
        period: '2015 - 2019',
        highlights: ['GPA 4.0', 'Honor Student'],
      },
    ],
    skills: ['TypeScript', 'React', 'Node.js'],
    photos: [
      { path: '/assets/photo1.png', description: 'Photo 1' },
      { path: '/assets/photo2.png', description: 'Photo 2' },
    ],
  },
}));

describe('useTranslatedPortfolio', () => {
  it('returns translated personal info', () => {
    const { result } = renderHook(() => useTranslatedPortfolio());

    expect(result.current.personal.name).toBe('[translated] Test User');
    expect(result.current.personal.title).toBe('[translated] Test Engineer');
    expect(result.current.personal.bio).toBe('[translated] Test bio');
    expect(result.current.personal.location).toBe('[translated] Test City');
  });

  it('preserves non-translated personal fields', () => {
    const { result } = renderHook(() => useTranslatedPortfolio());

    expect(result.current.personal.contact).toEqual({
      email: 'test@example.com',
      linkedin: 'https://linkedin.com/in/test',
      github: 'https://github.com/test',
    });
  });

  it('returns translated projects', () => {
    const { result } = renderHook(() => useTranslatedPortfolio());

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].id).toBe('project-1');
    expect(result.current.projects[0].title).toBe('[translated] Project One');
    expect(result.current.projects[0].description).toBe('[translated] Project one desc');
    expect(result.current.projects[0].longDescription).toBe('[translated] Project one long');
  });

  it('preserves non-translated project fields', () => {
    const { result } = renderHook(() => useTranslatedPortfolio());

    expect(result.current.projects[0].technologies).toEqual(['React', 'TypeScript']);
    expect(result.current.projects[0].image).toBe('/assets/project1.png');
    expect(result.current.projects[0].featured).toBe(true);
  });

  it('returns translated experience with highlights', () => {
    const { result } = renderHook(() => useTranslatedPortfolio());

    expect(result.current.experience).toHaveLength(1);
    expect(result.current.experience[0].company).toBe('[translated] Test Company');
    expect(result.current.experience[0].role).toBe('[translated] Test Role');
    expect(result.current.experience[0].period).toBe('[translated] 2020 - Present');
    expect(result.current.experience[0].description).toBe('[translated] Exp description');
    expect(result.current.experience[0].highlights).toEqual([
      '[translated] Highlight 1',
      '[translated] Highlight 2',
    ]);
  });

  it('returns translated education with highlights', () => {
    const { result } = renderHook(() => useTranslatedPortfolio());

    expect(result.current.education).toHaveLength(1);
    expect(result.current.education[0].institution).toBe('[translated] Test University');
    expect(result.current.education[0].degree).toBe('[translated] Test Degree');
    expect(result.current.education[0].period).toBe('[translated] 2015 - 2019');
    expect(result.current.education[0].highlights).toEqual([
      '[translated] GPA 4.0',
      '[translated] Honor Student',
    ]);
  });

  it('preserves skills array unchanged (technical terms)', () => {
    const { result } = renderHook(() => useTranslatedPortfolio());

    expect(result.current.skills).toEqual(['TypeScript', 'React', 'Node.js']);
  });

  it('preserves photos array unchanged', () => {
    const { result } = renderHook(() => useTranslatedPortfolio());

    expect(result.current.photos).toEqual([
      { path: '/assets/photo1.png', description: 'Photo 1' },
      { path: '/assets/photo2.png', description: 'Photo 2' },
    ]);
  });
});
