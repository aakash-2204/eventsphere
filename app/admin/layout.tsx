import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <DashboardHeader />
      <main className="flex-1 py-10">{children}</main>
    </>
  );
}
