import Link from "next/link";
import SignOutButton from "./SignOutButton";
import UserSwitcher from "./UserSwitcher";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

type Props = {
  currentPath?: string;
};

export default function AppHeader({ currentPath = "/" }: Props) {
  const navItemClass = (href: string) =>
    `rounded-xl px-3 py-3 text-center text-sm font-medium transition sm:px-4 sm:py-2 ${
      currentPath === href
        ? "bg-slate-900 text-white"
        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
    }`;

  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">Shared dashboard</p>
        <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
          Vancouver Rental Tracker
        </h1>
      </div>

      <div className="flex flex-col gap-3 lg:items-end">
        <nav className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          <Link href="/" className={navItemClass("/")}>
            Dashboard
          </Link>
          <Link href="/viewings" className={navItemClass("/viewings")}>
            Viewings
          </Link>
          <Link href="/settings" className={navItemClass("/settings")}>
            Settings
          </Link>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <WorkspaceSwitcher />

          <UserSwitcher />

          <Link
            href="/#quick-save-url"
            className="rounded-xl bg-violet-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-violet-600 sm:py-2"
          >
            Quick save URL
          </Link>

          <Link
            href="/add-listing"
            className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-700 sm:py-2"
          >
            + Add listing
          </Link>

          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
