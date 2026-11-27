const PillTabs = ({ tabs = [], activeValue, onChange, className = "" }) => {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`.trim()}
      role="tablist"
      aria-label="Tabs"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(tab.value)}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2 active:scale-[0.98] sm:min-h-10 ${
              isActive
                ? "border-primary-900 bg-primary-900 text-white"
                : "border-hairline bg-white text-secondary-600"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default PillTabs;
