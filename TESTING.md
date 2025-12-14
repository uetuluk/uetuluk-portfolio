# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component tests.

## Quick Start

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
├── test/
│   └── setup.ts                    # Global test setup and mocks
├── App.test.tsx                    # Main app tests
├── lib/
│   ├── palette.test.ts             # Color palette utility tests
│   ├── utils.test.ts               # cn() utility tests
│   ├── applyPalette.test.ts        # Theme application tests
│   └── head.test.ts                # Document head utility tests
├── hooks/
│   ├── useTheme.test.ts            # Theme hook tests
│   ├── useSessionId.test.ts        # Session ID hook tests
│   └── useTranslatedPortfolio.test.ts # i18n hook tests
├── i18n/
│   └── index.test.ts               # i18n setup tests
└── components/
    ├── ComponentMapper.test.tsx    # Component rendering tests
    ├── WelcomeModal.test.tsx       # Welcome modal tests
    ├── ThemeToggle.test.tsx        # Theme toggle tests
    ├── LanguageSwitcher.test.tsx   # Language switcher tests
    ├── FeedbackButtons.test.tsx    # Feedback buttons tests
    ├── GeneratedPage.test.tsx      # Generated page tests
    ├── SEO.test.tsx                # SEO component tests
    ├── StructuredData.test.tsx     # Structured data tests
    ├── LoadingScreen.test.tsx      # Loading screen tests
    ├── MosaicBackground.test.tsx   # Background tests
    └── sections/
        ├── HeroSection.test.tsx    # Hero section tests
        ├── ProjectCardGrid.test.tsx # Project grid tests
        ├── SkillBadgeList.test.tsx # Skills tests
        ├── ExperienceTimeline.test.tsx # Timeline tests
        ├── ContactSection.test.tsx # Contact tests
        ├── TextBlock.test.tsx      # Text block tests
        ├── ImageGallery.test.tsx   # Gallery tests
        ├── StatsCounter.test.tsx   # Stats counter tests
        ├── TechLogos.test.tsx      # Tech logos tests
        └── DataChart.test.tsx      # Data chart tests

worker/
├── index.test.ts                   # Worker function tests
├── handlers.test.ts                # API handler tests
├── ai-generation.test.ts           # AI generation tests
├── ai-categorization.test.ts       # AI categorization tests
├── categorization.test.ts          # Categorization logic tests
├── rate-limiting.test.ts           # Rate limiting tests
├── visitor-context.test.ts         # Visitor context tests
├── link-validation.test.ts         # Link validation tests
└── prompts.test.ts                 # Prompt generation tests
```

## Writing Tests

### Utility Function Tests

For pure functions, test inputs and outputs directly:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myModule";

describe("myFunction", () => {
  it("handles basic input", () => {
    expect(myFunction("input")).toBe("expected output");
  });

  it("handles edge cases", () => {
    expect(myFunction(null)).toBe("default");
  });
});
```

### React Hook Tests

Use `renderHook` from React Testing Library:

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMyHook } from "./useMyHook";

describe("useMyHook", () => {
  it("returns initial state", () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe("initial");
  });

  it("updates state on action", () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.setValue("new value");
    });

    expect(result.current.value).toBe("new value");
  });
});
```

### React Component Tests

Use `render` and query functions from React Testing Library:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### Mocking

#### Mock Functions

```typescript
import { vi } from "vitest";

// Create a mock function
const mockFn = vi.fn();

// Mock return value
mockFn.mockReturnValue("mocked");

// Mock implementation
mockFn.mockImplementation((arg) => arg.toUpperCase());

// Verify calls
expect(mockFn).toHaveBeenCalledWith("expected arg");
expect(mockFn).toHaveBeenCalledTimes(1);
```

#### Mock Modules

```typescript
import { vi } from "vitest";

// Mock an entire module
vi.mock("./myModule", () => ({
  myFunction: vi.fn(() => "mocked result"),
}));

// Mock a specific export
vi.mock("./myModule", async () => {
  const actual = await vi.importActual("./myModule");
  return {
    ...actual,
    myFunction: vi.fn(() => "mocked"),
  };
});
```

#### Mock Browser APIs

The test setup (`src/test/setup.ts`) already mocks:
- `window.matchMedia` - for theme detection
- `crypto.randomUUID` - for session IDs
- `localStorage` / `sessionStorage` - for persistence

To customize these mocks in a specific test:

```typescript
import { vi, beforeEach } from "vitest";

describe("my test", () => {
  beforeEach(() => {
    // Override matchMedia to simulate dark mode preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
});
```

### Testing Async Code

```typescript
import { describe, it, expect, vi } from "vitest";

describe("async tests", () => {
  it("handles promises", async () => {
    const result = await fetchData();
    expect(result).toBe("data");
  });

  it("uses fake timers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));

    const result = getTimeOfDay();
    expect(result).toBe("afternoon");

    vi.useRealTimers();
  });
});
```

## Test Configuration

### vitest.config.ts

The Vitest configuration includes:

- **Environment**: `jsdom` for DOM APIs
- **Setup File**: `src/test/setup.ts` for global mocks
- **Globals**: Test APIs available without imports
- **Coverage**: Istanbul provider with text/json/html reporters

### Coverage

Coverage is configured for:
- `src/lib/**/*.ts` - Utility functions
- `src/hooks/**/*.ts` - React hooks
- `src/components/ComponentMapper.tsx` - Dynamic component mapper
- `worker/**/*.ts` - Worker functions

Run `npm run test:coverage` to generate reports in the `coverage/` directory.

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it.

2. **Use descriptive test names** - Test names should describe the expected behavior.

3. **One assertion per concept** - Each test should verify one specific behavior.

4. **Arrange-Act-Assert pattern** - Structure tests clearly:
   ```typescript
   it("increments counter", () => {
     // Arrange
     const { result } = renderHook(() => useCounter());

     // Act
     act(() => result.current.increment());

     // Assert
     expect(result.current.count).toBe(1);
   });
   ```

5. **Clean up after tests** - The setup file handles cleanup automatically, but for custom mocks:
   ```typescript
   afterEach(() => {
     vi.restoreAllMocks();
   });
   ```

6. **Avoid testing implementation details** - Don't test internal state or private methods.

7. **Use data-testid sparingly** - Prefer accessible queries like `getByRole`, `getByText`.

## Debugging Tests

### Run a specific test file

```bash
npx vitest run src/lib/palette.test.ts
```

### Run tests matching a pattern

```bash
npx vitest run -t "colorNameToHSL"
```

### Debug with UI

```bash
npx vitest --ui
```

### Verbose output

```bash
npx vitest run --reporter=verbose
```

## CI Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm run test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```
