import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WorkspaceLayout from "./WorkspaceLayout";

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Alex Rivera", role: "customer" },
    logout: jest.fn(),
  }),
}));

const navigationItems = [
  { name: "Dashboard", href: "/customer/dashboard", icon: "HomeIcon" },
  { name: "Requests", href: "/customer/requests", icon: "ClockIcon" },
];

test("keeps sidebar and header sticky without trapping scroll via overflow-x-hidden", () => {
  const { container } = render(
    <MemoryRouter initialEntries={["/customer/dashboard"]}>
      <WorkspaceLayout
        roleLabel="Customer workspace"
        title="Customer dashboard"
        subtitle="Track requests in one place."
        navigationItems={navigationItems}
      >
        <div>Main content</div>
      </WorkspaceLayout>
    </MemoryRouter>,
  );

  const shell = container.firstElementChild;
  expect(shell).toHaveClass("overflow-x-clip");
  expect(shell).not.toHaveClass("overflow-x-hidden");

  const sidebar = screen.getByLabelText("Customer workspace navigation");
  expect(sidebar).toHaveClass(
    "lg:sticky",
    "lg:top-0",
    "lg:h-screen",
    "lg:shrink-0",
    "lg:self-start",
  );

  const nav = sidebar.querySelector("nav");
  expect(nav).toHaveClass("overflow-y-auto");

  const header = screen.getByRole("banner");
  expect(header).toHaveClass("sticky", "top-0");
});

test("toggles the mobile navigation drawer open and closed", () => {
  render(
    <MemoryRouter initialEntries={["/customer/dashboard"]}>
      <WorkspaceLayout
        roleLabel="Customer workspace"
        title="Customer dashboard"
        subtitle="Track requests in one place."
        navigationItems={navigationItems}
      >
        <div>Main content</div>
      </WorkspaceLayout>
    </MemoryRouter>,
  );

  const sidebar = screen.getByLabelText("Customer workspace navigation");
  expect(sidebar).toHaveClass("-translate-x-full");

  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  expect(sidebar).toHaveClass("translate-x-0");

  fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
  expect(sidebar).toHaveClass("-translate-x-full");
});
