// Layout for /login, /signup, /forgot-password and /reset-password.
// The "(auth)" folder name is a route group: it groups pages without
// adding "/auth" to their URLs.

import { AuthShell } from "@/components/auth/auth-shell";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthShell>{children}</AuthShell>;
}
