import { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";

const WorkspaceLayout = ({
  roleLabel,
  title,
  subtitle,
  navigationItems,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-secondary-900">
      <div className="flex min-h-screen">
        <Sidebar
          navigationItems={navigationItems}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          roleLabel={roleLabel}
        />

        <div className="flex min-w-0 flex-1 flex-col bg-surface">
          <Header
            onMenuClick={() => setIsSidebarOpen(true)}
            title={title}
            subtitle={subtitle}
          />

          <main className="min-w-0 flex-1">
            <div className="page-shell py-6 sm:py-8 lg:py-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
