import Link from "next/link";
import UserSwitcher from "./UserSwitcher";

type Props = {
  currentPath?: string;
};

export default function AppHeader({ currentPath = "/" }: Props) {
  const navItemClass = (href: string) =>
    `rounded-xl px-4 py-2 text-sm font-medium transition ${
      currentPath === href
        ? "bg-slate-900 text-white"
        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
    }`;

  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Shared dashboard</p>
        <h1 className="text-3xl font-bold text-slate-900">
          Vancouver Rental Tracker
        </h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <nav className="flex items-center gap-2">
          <Link href="/" className={navItemClass("/")}>
            Dashboard
          </Link>
          <Link href="/viewings" className={navItemClass("/viewings")}>
            Viewings
          </Link>
        </nav>

        <UserSwitcher />

        <Link
          href="/add-listing"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Add listing
        </Link>
      </div>
    </header>
  );
}