import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Custom render function that can be extended with providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { ...options });

export { customRender as render };
