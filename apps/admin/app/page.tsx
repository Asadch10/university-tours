import { redirect } from 'next/navigation';

// The console lives under the (console) route group; entry point routes to the dashboard.
// The AppShell guard bounces unauthenticated users to /login.
export default function RootPage() {
  redirect('/dashboard');
}
