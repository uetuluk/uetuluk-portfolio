import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillBadgeList } from "./SkillBadgeList";

// Mock portfolio.json for default skills
vi.mock("@/content/portfolio.json", () => ({
  default: {
    skills: ["React", "TypeScript", "Node.js"],
  },
}));

describe("SkillBadgeList", () => {
  const defaultProps = {
    title: "Skills",
  };

  it("renders title correctly", () => {
    render(<SkillBadgeList {...defaultProps} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Skills"
    );
  });

  it("renders provided skills", () => {
    const skills = ["Python", "JavaScript", "Go"];
    render(<SkillBadgeList {...defaultProps} skills={skills} />);

    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
  });

  it("falls back to default skills when not provided", () => {
    render(<SkillBadgeList {...defaultProps} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("applies compact style by default", () => {
    const skills = ["React"];
    const { container } = render(
      <SkillBadgeList {...defaultProps} skills={skills} />
    );

    // Compact style uses gap-2 and smaller text
    const skillBadge = screen.getByText("React");
    expect(skillBadge).toHaveClass("px-3", "py-1", "text-sm");
  });

  it("applies detailed style when specified", () => {
    const skills = ["React"];
    const { container } = render(
      <SkillBadgeList {...defaultProps} skills={skills} style="detailed" />
    );

    // Detailed style uses gap-3 and larger text
    const skillBadge = screen.getByText("React");
    expect(skillBadge).toHaveClass("px-4", "py-2", "text-base");
  });

  it("applies custom className", () => {
    const { container } = render(
      <SkillBadgeList {...defaultProps} className="custom-class" />
    );

    expect(container.querySelector("section")).toHaveClass("custom-class");
  });

  it("renders all skills with correct styling", () => {
    const skills = ["Skill1", "Skill2", "Skill3"];
    render(<SkillBadgeList {...defaultProps} skills={skills} />);

    skills.forEach((skill) => {
      const badge = screen.getByText(skill);
      expect(badge).toHaveClass("rounded-full", "border", "font-medium");
    });
  });
});
