import {
  Bars3Icon,
  ChevronDownIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "./Button";

const Header = ({
  onMenuClick,
  title = "Dashboard",
  subtitle = "Overview of your workspace",
}) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hairline text-secondary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2 active:scale-[0.98] lg:hidden"
            aria-label="Open navigation"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-500">
              {user?.role ? `${user.role} workspace` : "Workspace"}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-primary-900 sm:text-2xl">
              {title}
            </h1>
            <p className="truncate text-sm text-secondary-600">{subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            variant="tertiary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            {user?.role ? user.role : "Account"}
          </Button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 rounded-full border border-hairline bg-white px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2 active:scale-[0.98]"
              aria-haspopup="menu"
              aria-expanded={showDropdown}
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-primary-900">
                  {user?.name}
                </p>
                <p className="text-xs capitalize text-secondary-500">
                  {user?.role}
                </p>
              </div>
              <UserCircleIcon className="h-8 w-8 text-secondary-500" />
              <ChevronDownIcon className="hidden h-4 w-4 text-secondary-400 sm:block" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-hairline bg-white p-2 shadow-modal z-30">
                <button
                  className="block w-full rounded-lg px-4 py-2 text-left text-sm text-secondary-700 transition-colors focus-visible:bg-surface focus-visible:outline-none"
                  onClick={() => setShowDropdown(false)}
                >
                  Profile Settings
                </button>
                <button
                  className="block w-full rounded-lg px-4 py-2 text-left text-sm text-secondary-700 transition-colors focus-visible:bg-surface focus-visible:outline-none"
                  onClick={() => setShowDropdown(false)}
                >
                  Preferences
                </button>
                <hr className="my-2 border-hairline" />
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-lg px-4 py-2 text-left text-sm text-danger-600 transition-colors focus-visible:bg-danger-50 focus-visible:outline-none"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
