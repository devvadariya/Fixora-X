import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders welcome message", () => {
  window.history.replaceState({}, "", "/");
  render(<App />);
  const brandElements = screen.getAllByText(/fixora-x/i);
  expect(brandElements.length).toBeGreaterThan(0);
});

test("renders the public login route", () => {
  window.history.replaceState({}, "", "/login");
  render(<App />);

  expect(
    screen.getByText(/sign in to a calmer roadside workflow/i),
  ).toBeInTheDocument();
});

test("redirects unknown routes to the landing page", () => {
  window.history.replaceState({}, "", "/route-that-does-not-exist");
  render(<App />);

  expect(screen.getAllByText(/fixora-x/i).length).toBeGreaterThan(0);
});

test.each(["/customer/dashboard", "/mechanic/dashboard", "/admin/dashboard"])(
  "redirects unauthenticated access from %s to login",
  async (path) => {
    window.history.replaceState({}, "", path);
    render(<App />);

    expect(
      await screen.findByText(/sign in to a calmer roadside workflow/i),
    ).toBeInTheDocument();
  },
);
