import {
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  CogIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  HomeIcon,
  PlusCircleIcon,
  UserIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";

const iconMap = {
  HomeIcon,
  PlusCircleIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  CreditCardIcon,
};

const Sidebar = ({
  navigationItems,
  isOpen = false,
  onClose,
  roleLabel = "Workspace",
}) => {
  const location = useLocation();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-hairline bg-white shadow-modal transition-transform duration-200 lg:sticky lg:top-0 lg:bottom-auto lg:left-auto lg:z-auto lg:h-screen lg:w-72 lg:shrink-0 lg:self-start lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label={`${roleLabel} navigation`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-900 text-sm font-semibold text-white">
              F
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-900">Fixora-X</p>
              <p className="text-xs text-secondary-500">{roleLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-secondary-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2 active:scale-[0.98] lg:hidden"
            aria-label="Close navigation"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive = location.pathname === item.href;

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`
                    flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2
                    ${
                      isActive
                        ? "bg-surface text-primary-900 shadow-sm"
                        : "text-secondary-600 hover:bg-surface hover:text-primary-900"
                    }
                  `}
                  >
                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
