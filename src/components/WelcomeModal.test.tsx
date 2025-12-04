import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeModal } from "./WelcomeModal";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "welcome.title": "Welcome to My Portfolio",
        "welcome.subtitle": "Tell me about yourself",
        "welcome.formLabel": "What brings you here?",
        "welcome.placeholder": "I'm looking for...",
        "welcome.continue": "Continue",
        "welcome.quickOptions": "Quick options:",
        "welcome.selectionHelp": "This helps personalize your experience",
        "visitorTypes.recruiter.label": "Recruiter",
        "visitorTypes.developer.label": "Developer",
        "visitorTypes.collaborator.label": "Collaborator",
        "visitorTypes.friend.label": "Friend",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock MosaicBackground
vi.mock("./MosaicBackground", () => ({
  MosaicBackground: () => <div data-testid="mosaic-background" />,
}));

describe("WelcomeModal", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and subtitle", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    expect(screen.getByText("Welcome to My Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Tell me about yourself")).toBeInTheDocument();
  });

  it("renders form label", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    expect(screen.getByText("What brings you here?")).toBeInTheDocument();
  });

  it("renders textarea with placeholder", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const textarea = screen.getByPlaceholderText("I'm looking for...");
    expect(textarea).toBeInTheDocument();
  });

  it("renders continue button", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it("continue button is disabled when textarea is empty", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const button = screen.getByText("Continue");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("cursor-not-allowed");
  });

  it("continue button is enabled when textarea has content", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const textarea = screen.getByPlaceholderText("I'm looking for...");
    fireEvent.change(textarea, { target: { value: "I want to hire you" } });

    const button = screen.getByText("Continue");
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveClass("cursor-not-allowed");
  });

  it("continue button is disabled when textarea only has whitespace", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const textarea = screen.getByPlaceholderText("I'm looking for...");
    fireEvent.change(textarea, { target: { value: "   " } });

    const button = screen.getByText("Continue");
    expect(button).toBeDisabled();
  });

  it("submitting custom intent calls onSelect with collaborator and intent", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const textarea = screen.getByPlaceholderText("I'm looking for...");
    fireEvent.change(textarea, { target: { value: "I want to collaborate" } });

    const button = screen.getByText("Continue");
    fireEvent.click(button);

    expect(mockOnSelect).toHaveBeenCalledWith("collaborator", "I want to collaborate");
  });

  it("renders quick options label", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    expect(screen.getByText(/Quick options:/)).toBeInTheDocument();
  });

  it("renders all 4 visitor type quick options", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    // These appear in both mobile and desktop variants
    expect(screen.getAllByText(/Recruiter/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Developer/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Collaborator/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Friend/).length).toBeGreaterThanOrEqual(1);
  });

  it("clicking recruiter quick option calls onSelect with recruiter", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    // Get all buttons with "Recruiter" text and click the first one
    const recruiterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.includes("Recruiter")
    );
    fireEvent.click(recruiterButtons[0]);

    expect(mockOnSelect).toHaveBeenCalledWith("recruiter");
  });

  it("clicking developer quick option calls onSelect with developer", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const developerButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.includes("Developer")
    );
    fireEvent.click(developerButtons[0]);

    expect(mockOnSelect).toHaveBeenCalledWith("developer");
  });

  it("clicking collaborator quick option calls onSelect with collaborator", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const collaboratorButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.includes("Collaborator")
    );
    fireEvent.click(collaboratorButtons[0]);

    expect(mockOnSelect).toHaveBeenCalledWith("collaborator");
  });

  it("clicking friend quick option calls onSelect with friend", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const friendButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.includes("Friend")
    );
    fireEvent.click(friendButtons[0]);

    expect(mockOnSelect).toHaveBeenCalledWith("friend");
  });

  it("renders MosaicBackground component", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    expect(screen.getByTestId("mosaic-background")).toBeInTheDocument();
  });

  it("renders selection help text", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    expect(screen.getByText("This helps personalize your experience")).toBeInTheDocument();
  });

  it("textarea updates on input", () => {
    render(<WelcomeModal onSelect={mockOnSelect} />);

    const textarea = screen.getByPlaceholderText("I'm looking for...");
    fireEvent.change(textarea, { target: { value: "Test input" } });

    expect(textarea).toHaveValue("Test input");
  });
});
