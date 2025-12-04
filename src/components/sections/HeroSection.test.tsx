import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

describe("HeroSection", () => {
  const defaultProps = {
    title: "Test Title",
    subtitle: "Test Subtitle",
  };

  it("renders title correctly", () => {
    render(<HeroSection {...defaultProps} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Test Title"
    );
  });

  it("renders subtitle correctly", () => {
    render(<HeroSection {...defaultProps} />);

    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it("renders image when provided", () => {
    render(<HeroSection {...defaultProps} image="/test-image.jpg" />);

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/test-image.jpg");
    expect(img).toHaveAttribute("alt", "Test Title");
  });

  it("does not render image when not provided", () => {
    render(<HeroSection {...defaultProps} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders CTA button when provided", () => {
    const cta = { text: "Contact Me", href: "https://example.com" };
    render(<HeroSection {...defaultProps} cta={cta} />);

    const link = screen.getByRole("link", { name: /Contact Me/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render CTA when not provided", () => {
    render(<HeroSection {...defaultProps} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <HeroSection {...defaultProps} className="custom-class" />
    );

    expect(container.querySelector("section")).toHaveClass("custom-class");
  });

  it("handles image error with fallback", () => {
    render(<HeroSection {...defaultProps} image="/broken-image.jpg" />);

    const img = screen.getByRole("img");
    fireEvent.error(img);

    expect(img).toHaveAttribute("src");
    expect(img.getAttribute("src")).toContain("data:image/svg+xml");
  });
});
