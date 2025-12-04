import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentMapper } from "./ComponentMapper";

// Mock the section components
vi.mock("./sections/HeroSection", () => ({
  HeroSection: ({ title }: { title: string }) => (
    <div data-testid="hero-section">{title}</div>
  ),
}));

vi.mock("./sections/ProjectCardGrid", () => ({
  ProjectCardGrid: ({ title }: { title: string }) => (
    <div data-testid="card-grid">{title}</div>
  ),
}));

vi.mock("./sections/SkillBadgeList", () => ({
  SkillBadgeList: ({ title }: { title: string }) => (
    <div data-testid="skill-badges">{title}</div>
  ),
}));

vi.mock("./sections/ExperienceTimeline", () => ({
  ExperienceTimeline: ({ title }: { title: string }) => (
    <div data-testid="timeline">{title}</div>
  ),
}));

vi.mock("./sections/ContactSection", () => ({
  ContactSection: ({ title }: { title: string }) => (
    <div data-testid="contact-form">{title}</div>
  ),
}));

vi.mock("./sections/TextBlock", () => ({
  TextBlock: ({ title }: { title: string }) => (
    <div data-testid="text-block">{title}</div>
  ),
}));

vi.mock("./sections/ImageGallery", () => ({
  ImageGallery: ({ title }: { title: string }) => (
    <div data-testid="image-gallery">{title}</div>
  ),
}));

describe("ComponentMapper", () => {
  it("renders Hero section correctly", () => {
    const section = {
      type: "Hero",
      props: { title: "Test Hero", subtitle: "Welcome" },
    };

    render(<ComponentMapper section={section} />);

    expect(screen.getByTestId("hero-section")).toBeInTheDocument();
    expect(screen.getByText("Test Hero")).toBeInTheDocument();
  });

  it("renders CardGrid section correctly", () => {
    const section = {
      type: "CardGrid",
      props: { title: "Projects", columns: 3, items: [] },
    };

    render(<ComponentMapper section={section} />);

    expect(screen.getByTestId("card-grid")).toBeInTheDocument();
  });

  it("renders SkillBadges section correctly", () => {
    const section = {
      type: "SkillBadges",
      props: { title: "Skills", style: "detailed" },
    };

    render(<ComponentMapper section={section} />);

    expect(screen.getByTestId("skill-badges")).toBeInTheDocument();
  });

  it("renders Timeline section correctly", () => {
    const section = {
      type: "Timeline",
      props: { title: "Experience" },
    };

    render(<ComponentMapper section={section} />);

    expect(screen.getByTestId("timeline")).toBeInTheDocument();
  });

  it("renders ContactForm section correctly", () => {
    const section = {
      type: "ContactForm",
      props: { title: "Contact", showEmail: true },
    };

    render(<ComponentMapper section={section} />);

    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
  });

  it("renders TextBlock section correctly", () => {
    const section = {
      type: "TextBlock",
      props: { title: "About", content: "Hello world" },
    };

    render(<ComponentMapper section={section} />);

    expect(screen.getByTestId("text-block")).toBeInTheDocument();
  });

  it("renders ImageGallery section correctly", () => {
    const section = {
      type: "ImageGallery",
      props: { title: "Gallery", images: [] },
    };

    render(<ComponentMapper section={section} />);

    expect(screen.getByTestId("image-gallery")).toBeInTheDocument();
  });

  it("renders fallback for unknown component type", () => {
    const section = {
      type: "UnknownComponent",
      props: {},
    };

    render(<ComponentMapper section={section} />);

    expect(
      screen.getByText(/Unknown component: UnknownComponent/)
    ).toBeInTheDocument();
  });

  it("wraps component in mb-8 container", () => {
    const section = {
      type: "Hero",
      props: { title: "Test" },
    };

    const { container } = render(<ComponentMapper section={section} />);

    expect(container.firstChild).toHaveClass("mb-8");
  });

  it("passes props to the rendered component", () => {
    const section = {
      type: "Hero",
      props: { title: "Custom Title" },
    };

    render(<ComponentMapper section={section} />);

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });
});
