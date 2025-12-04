import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { FeedbackButtons } from "./FeedbackButtons";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "feedback.thanks": "Thanks for your feedback!",
        "feedback.share": "Share",
        "feedback.regenerating": "Regenerating...",
        "feedback.sending": "Sending...",
        "feedback.likeTooltip": "I like this layout",
        "feedback.dislikeTooltip": "Show me something different",
        "feedback.shareTitle": "Check out this portfolio",
        "feedback.shareText": "I found this interesting portfolio",
        "feedback.linkCopied": "Link copied to clipboard!",
      };
      if (key === "feedback.rateLimited" && params?.seconds) {
        return `Rate limited. Try again in ${params.seconds}s`;
      }
      return translations[key] || key;
    },
  }),
}));

// Mock useSessionId hook
vi.mock("@/hooks/useSessionId", () => ({
  useSessionId: () => "mock-session-id-123",
}));

describe("FeedbackButtons", () => {
  const defaultProps = {
    audienceType: "developer",
    cacheKey: "cache-key-123",
    onRegenerate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders idle state with like and dislike buttons", () => {
    render(<FeedbackButtons {...defaultProps} />);

    expect(screen.getByTitle("I like this layout")).toBeInTheDocument();
    expect(
      screen.getByTitle("Show me something different")
    ).toBeInTheDocument();
  });

  it("shows loading state when feedback is submitted", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<FeedbackButtons {...defaultProps} />);

    const likeButton = screen.getByTitle("I like this layout");
    fireEvent.click(likeButton);

    expect(screen.getByText("Sending...")).toBeInTheDocument();
  });

  it("transitions to liked state with share button after successful like", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true, message: "Feedback received" }),
    });

    render(<FeedbackButtons {...defaultProps} />);

    const likeButton = screen.getByTitle("I like this layout");
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(
        screen.getByText("Thanks for your feedback!")
      ).toBeInTheDocument();
      expect(screen.getByText("Share")).toBeInTheDocument();
    });
  });

  it("transitions to disliked state and shows regenerating message", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        message: "Will regenerate",
        regenerate: true,
      }),
    });

    const onRegenerate = vi.fn();
    render(<FeedbackButtons {...defaultProps} onRegenerate={onRegenerate} />);

    const dislikeButton = screen.getByTitle("Show me something different");
    fireEvent.click(dislikeButton);

    await waitFor(() => {
      expect(screen.getByText("Regenerating...")).toBeInTheDocument();
    });
  });

  it("shows rate-limited state", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        rateLimited: true,
        retryAfter: 30,
      }),
    });

    render(<FeedbackButtons {...defaultProps} />);

    const likeButton = screen.getByTitle("I like this layout");
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(
        screen.getByText("Rate limited. Try again in 30s")
      ).toBeInTheDocument();
    });
  });

  it("handles share with navigator.share API", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });

    render(<FeedbackButtons {...defaultProps} />);

    // Like first to get share button
    fireEvent.click(screen.getByTitle("I like this layout"));

    await waitFor(() => {
      expect(screen.getByText("Share")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Share"));

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: "Check out this portfolio",
        text: "I found this interesting portfolio",
        url: expect.any(String),
      });
    });
  });

  it("falls back to clipboard when navigator.share unavailable", async () => {
    // Remove navigator.share
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const mockClipboard = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockClipboard },
      writable: true,
      configurable: true,
    });

    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });

    render(<FeedbackButtons {...defaultProps} />);

    // Like first to get share button
    fireEvent.click(screen.getByTitle("I like this layout"));

    await waitFor(() => {
      expect(screen.getByText("Share")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Share"));

    await waitFor(() => {
      expect(mockClipboard).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith("Link copied to clipboard!");
    });
  });

  it("returns to idle state on API error", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<FeedbackButtons {...defaultProps} />);

    fireEvent.click(screen.getByTitle("I like this layout"));

    // First it shows loading, then returns to idle
    expect(screen.getByText("Sending...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTitle("I like this layout")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("sends correct feedback request payload", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });

    render(<FeedbackButtons {...defaultProps} />);

    fireEvent.click(screen.getByTitle("I like this layout"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType: "like",
          audienceType: "developer",
          cacheKey: "cache-key-123",
          sessionId: "mock-session-id-123",
        }),
      });
    });
  });

  it("sends dislike feedback with regenerate flag", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true, regenerate: true }),
    });

    render(<FeedbackButtons {...defaultProps} />);

    fireEvent.click(screen.getByTitle("Show me something different"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType: "dislike",
          audienceType: "developer",
          cacheKey: "cache-key-123",
          sessionId: "mock-session-id-123",
        }),
      });
    });
  });
});
