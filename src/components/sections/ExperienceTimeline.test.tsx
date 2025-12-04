import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExperienceTimeline } from "./ExperienceTimeline";

// Mock portfolio.json
vi.mock("@/content/portfolio.json", () => ({
  default: {
    experience: [
      {
        id: "default-exp",
        company: "Default Company",
        role: "Default Role",
        period: "2020 - Present",
        description: "Default description",
        highlights: ["Default highlight 1"],
      },
    ],
  },
}));

describe("ExperienceTimeline", () => {
  const mockExperience = [
    {
      id: "exp-1",
      company: "Tech Corp",
      role: "Senior Developer",
      period: "2022 - Present",
      description: "Building amazing products",
      highlights: ["Led team of 5", "Shipped 3 major features"],
    },
    {
      id: "exp-2",
      company: "Startup Inc",
      role: "Developer",
      period: "2020 - 2022",
      description: "Full stack development",
    },
  ];

  const defaultProps = {
    title: "Experience",
  };

  it("renders title correctly", () => {
    render(<ExperienceTimeline {...defaultProps} items={mockExperience} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Experience"
    );
  });

  it("renders timeline items", () => {
    render(<ExperienceTimeline {...defaultProps} items={mockExperience} />);

    expect(screen.getByText("Tech Corp")).toBeInTheDocument();
    expect(screen.getByText("Startup Inc")).toBeInTheDocument();
  });

  it("displays role, company, and period", () => {
    render(<ExperienceTimeline {...defaultProps} items={mockExperience} />);

    expect(screen.getByText("Senior Developer")).toBeInTheDocument();
    expect(screen.getByText("Tech Corp")).toBeInTheDocument();
    expect(screen.getByText("2022 - Present")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<ExperienceTimeline {...defaultProps} items={mockExperience} />);

    expect(screen.getByText("Building amazing products")).toBeInTheDocument();
  });

  it("renders highlights when provided", () => {
    render(<ExperienceTimeline {...defaultProps} items={mockExperience} />);

    expect(screen.getByText("Led team of 5")).toBeInTheDocument();
    expect(screen.getByText("Shipped 3 major features")).toBeInTheDocument();
  });

  it("does not render highlights section when not provided", () => {
    const experienceWithoutHighlights = [
      {
        id: "exp-no-highlights",
        company: "No Highlights Co",
        role: "Developer",
        period: "2020 - 2022",
        description: "Some work",
      },
    ];

    const { container } = render(
      <ExperienceTimeline
        {...defaultProps}
        items={experienceWithoutHighlights}
      />
    );

    // Should not have any list items for highlights
    const highlights = container.querySelectorAll("ul li");
    expect(highlights.length).toBe(0);
  });

  it("resolves experience IDs to full objects", () => {
    render(<ExperienceTimeline {...defaultProps} items={["default-exp"]} />);

    expect(screen.getByText("Default Company")).toBeInTheDocument();
    expect(screen.getByText("Default Role")).toBeInTheDocument();
  });

  it("falls back to default experience when not provided", () => {
    render(<ExperienceTimeline {...defaultProps} />);

    expect(screen.getByText("Default Company")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ExperienceTimeline
        {...defaultProps}
        items={mockExperience}
        className="custom-class"
      />
    );

    expect(container.querySelector("section")).toHaveClass("custom-class");
  });
});
