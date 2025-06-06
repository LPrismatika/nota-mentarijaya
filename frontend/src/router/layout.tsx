import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import AppSidebar from "@/pages/sidebar/AppSidebar";

function LayoutInner() {
  const { open } = useSidebar();

  return (
    <div className="flex min-h-screen relative">
      <AppSidebar />
      <main
        className={`transition-all duration-100 ease-in-out p-4 ${
          open ? "m-0" : "mx-40"
        } w-full`}
      >
        {/* Toggle tetap muncul di pojok kiri atas */}
        <SidebarTrigger className="calender fixed top-4 left-70 z-50" />
        <div className={`w-full transition-all duration-200 ease-in-out ${
      open ? "" : "max-w-full mx-auto"
    }`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
