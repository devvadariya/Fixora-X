import { fireEvent, render, screen } from "@testing-library/react";
import Button from "./Button";
import Input from "./Input";
import PillTabs from "./PillTabs";
import Select from "./Select";

test("button exposes loading and disabled state", () => {
  render(
    <Button loading disabled>
      Save changes
    </Button>,
  );

  const button = screen.getByRole("button", { name: /save changes/i });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
});

test("input associates its label and error message", () => {
  render(
    <Input
      label="Email"
      error="Enter a valid email"
      value=""
      onChange={() => {}}
    />,
  );

  const input = screen.getByLabelText("Email");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAttribute("aria-describedby");
  expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
});

test("select generates an accessible id when name is omitted", () => {
  render(
    <Select label="Role" value="customer" onChange={() => {}}>
      <option value="customer">Customer</option>
    </Select>,
  );

  expect(screen.getByLabelText("Role")).toHaveAttribute("id");
});

test("pill tabs activate the selected value", () => {
  const onChange = jest.fn();
  render(
    <PillTabs
      tabs={[
        { value: "overview", label: "Overview" },
        { value: "activity", label: "Activity" },
      ]}
      activeValue="overview"
      onChange={onChange}
    />,
  );

  fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
  expect(onChange).toHaveBeenCalledWith("activity");
});
