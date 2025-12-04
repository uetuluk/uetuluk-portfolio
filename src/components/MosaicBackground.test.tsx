import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MosaicBackground } from "./MosaicBackground";

// Mock react-responsive-masonry
vi.mock("react-responsive-masonry", () => ({
  default: ({
    children,
    gutter,
  }: {
    children: React.ReactNode;
    gutter?: string;
  }) => (
    <div data-testid="masonry" data-gutter={gutter}>
      {children}
    </div>
  ),
  ResponsiveMasonry: ({
    children,
    columnsCountBreakPoints,
  }: {
    children: React.ReactNode;
    columnsCountBreakPoints?: Record<number, number>;
  }) => (
    <div
      data-testid="responsive-masonry"
      data-breakpoints={JSON.stringify(columnsCountBreakPoints)}
    >
      {children}
    </div>
  ),
}));

describe("MosaicBackground", () => {
  describe("container rendering", () => {
    it("renders container with absolute positioning", () => {
      const { container } = render(<MosaicBackground />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toContain("absolute");
      expect(outerDiv.className).toContain("inset-0");
    });

    it("has overflow hidden to clip content", () => {
      const { container } = render(<MosaicBackground />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toContain("overflow-hidden");
    });

    it("has z-0 to sit behind other content", () => {
      const { container } = render(<MosaicBackground />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toContain("z-0");
    });
  });

  describe("masonry grid", () => {
    it("renders two MasonryGrid instances for seamless looping", () => {
      render(<MosaicBackground />);
      const masonryElements = screen.getAllByTestId("masonry");
      expect(masonryElements.length).toBe(2);
    });

    it("renders ResponsiveMasonry with correct breakpoints", () => {
      render(<MosaicBackground />);
      const responsiveMasonries = screen.getAllByTestId("responsive-masonry");
      const breakpoints = JSON.parse(
        responsiveMasonries[0].getAttribute("data-breakpoints") || "{}"
      );
      expect(breakpoints).toEqual({ "350": 2, "750": 3, "1024": 4 });
    });

    it("passes gutter of 8px to Masonry", () => {
      render(<MosaicBackground />);
      const masonryElements = screen.getAllByTestId("masonry");
      expect(masonryElements[0].getAttribute("data-gutter")).toBe("8px");
    });
  });

  describe("images", () => {
    it("renders all 12 images per grid (24 total)", () => {
      const { container } = render(<MosaicBackground />);
      // Images with empty alt have role="presentation", so use querySelectorAll
      const images = container.querySelectorAll("img");
      expect(images.length).toBe(24);
    });

    it("renders images with correct src paths", () => {
      const { container } = render(<MosaicBackground />);
      const images = container.querySelectorAll("img");

      const expectedSrcs = [
        "/assets/kiwi-chat.png",
        "/assets/kiwi-annotate.png",
        "/assets/kiwi-analytics.png",
        "/assets/kiwi-ide.png",
        "/assets/ask-chat.png",
        "/assets/ask-tts.png",
        "/assets/ask-multiple-experiences.png",
        "/assets/spiegel-main.png",
        "/assets/spiegel-obs.png",
        "/assets/vtuber-youtube.png",
        "/assets/vtuber-twitch.png",
        "/assets/vtuber-overlay.png",
      ];

      // Check that each expected image appears twice (in both grids)
      expectedSrcs.forEach((src) => {
        const matchingImages = Array.from(images).filter((img) =>
          img.getAttribute("src")?.includes(src)
        );
        expect(matchingImages.length).toBe(2);
      });
    });

    it("renders images with empty alt attribute for decorative purposes", () => {
      const { container } = render(<MosaicBackground />);
      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        expect(img.getAttribute("alt")).toBe("");
      });
    });

    it("renders images with eager loading", () => {
      const { container } = render(<MosaicBackground />);
      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        expect(img.getAttribute("loading")).toBe("eager");
      });
    });

    it("renders images with async decoding", () => {
      const { container } = render(<MosaicBackground />);
      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        expect(img.getAttribute("decoding")).toBe("async");
      });
    });

    it("renders images with correct CSS classes", () => {
      const { container } = render(<MosaicBackground />);
      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        expect(img.className).toContain("w-full");
        expect(img.className).toContain("block");
      });
    });
  });

  describe("animation wrapper", () => {
    it("has blur effect for background aesthetics", () => {
      const { container } = render(<MosaicBackground />);
      const animationWrapper = container.querySelector(".animate-float-up");
      expect(animationWrapper?.className).toContain("blur-sm");
    });

    it("has reduced opacity for subtle background", () => {
      const { container } = render(<MosaicBackground />);
      const animationWrapper = container.querySelector(".animate-float-up");
      expect(animationWrapper?.className).toContain("opacity-20");
    });

    it("has float-up animation class", () => {
      const { container } = render(<MosaicBackground />);
      const animationWrapper = container.querySelector(".animate-float-up");
      expect(animationWrapper).not.toBeNull();
    });
  });

  describe("rotation wrapper", () => {
    it("has rotation transform applied", () => {
      const { container } = render(<MosaicBackground />);
      const rotationWrapper = container.querySelector(".rotate-\\[30deg\\]");
      expect(rotationWrapper).not.toBeNull();
    });

    it("has scale transform to cover corners", () => {
      const { container } = render(<MosaicBackground />);
      const rotationWrapper = container.querySelector(".scale-150");
      expect(rotationWrapper).not.toBeNull();
    });
  });
});
