import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Car,
  Check,
  Copy,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import AuthForm from "./AuthForm";

type AuthMode = "login" | "signup" | null;

type Props = {
  authMode?: AuthMode;
  redirectTo?: string;
};

const featureCards = [
  {
    title: "Shared dashboard",
    description: "One place for every listing, saved link, note, and status.",
    icon: <Building2 className="h-5 w-5" />,
    accent: "bg-emerald-50 text-emerald-700",
    visual: "dashboard",
  },
  {
    title: "Match scoring",
    description: "Compare what matters most without arguing in a spreadsheet.",
    icon: <Star className="h-5 w-5" />,
    accent: "bg-amber-50 text-amber-700",
    visual: "score",
  },
  {
    title: "Duplicate detection",
    description: "Catch repeated listings before your group wastes time.",
    icon: <Copy className="h-5 w-5" />,
    accent: "bg-rose-50 text-rose-700",
    visual: "duplicates",
  },
  {
    title: "Viewing tracking",
    description: "Coordinate tours and keep the next appointment visible.",
    icon: <CalendarDays className="h-5 w-5" />,
    accent: "bg-sky-50 text-sky-700",
    visual: "viewings",
  },
  {
    title: "Commute estimation",
    description: "See how each place fits work, school, gym, and daily life.",
    icon: <Car className="h-5 w-5" />,
    accent: "bg-teal-50 text-teal-700",
    visual: "commute",
  },
  {
    title: "Messaging workflow",
    description: "Draft landlord outreach with context from the listing.",
    icon: <Mail className="h-5 w-5" />,
    accent: "bg-indigo-50 text-indigo-700",
    visual: "message",
  },
];

const workflow = [
  { label: "Add listing", icon: <Home className="h-4 w-4" /> },
  { label: "Compare", icon: <Star className="h-4 w-4" /> },
  { label: "Schedule", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "Message", icon: <MessageCircle className="h-4 w-4" /> },
  { label: "Decide", icon: <Check className="h-4 w-4" /> },
];

function authHref(mode: "login" | "signup", redirectTo?: string) {
  const params = new URLSearchParams({ auth: mode });
  if (redirectTo) params.set("next", redirectTo);
  return `/${mode}?${params.toString()}`;
}

function closeHref(redirectTo?: string) {
  return redirectTo ? `/login?next=${encodeURIComponent(redirectTo)}` : "/login";
}

function MiniPhoto({ tone }: { tone: "green" | "blue" | "amber" }) {
  const tones = {
    green: "from-emerald-200 via-slate-200 to-teal-100",
    blue: "from-sky-200 via-slate-200 to-indigo-100",
    amber: "from-amber-200 via-slate-200 to-rose-100",
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tones[tone]}`}>
      <div className="absolute inset-x-4 bottom-3 h-10 rounded-t-xl bg-white/60" />
      <div className="absolute bottom-3 left-1/2 h-7 w-5 -translate-x-1/2 rounded-t-md bg-slate-700/35" />
      <div className="absolute left-5 top-5 h-4 w-8 rounded-full bg-white/55" />
      <div className="absolute right-5 top-8 h-5 w-10 rounded-full bg-white/45" />
    </div>
  );
}

function ListingPreview({
  title,
  area,
  price,
  score,
  status,
  tone,
}: {
  title: string;
  area: string;
  price: string;
  score: string;
  status: string;
  tone: "green" | "blue" | "amber";
}) {
  return (
    <article className="overflow-hidden rounded-[1.25rem] bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid h-28 grid-cols-[1.1fr_0.9fr] gap-1 bg-slate-100 p-1">
        <MiniPhoto tone={tone} />
        <div className="grid gap-1">
          <MiniPhoto tone={tone === "green" ? "blue" : "green"} />
          <MiniPhoto tone={tone === "amber" ? "blue" : "amber"} />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-950">
              {title}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{area}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            {score}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-slate-950">{price}</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {status}
          </span>
        </div>
      </div>
    </article>
  );
}

function ProductMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2.5rem] bg-slate-900/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Shared search
            </p>
            <h2 className="text-lg font-bold text-slate-950">
              Vancouver May rentals
            </h2>
          </div>
          <div className="flex -space-x-2">
            {["T", "M", "A"].map((avatar, index) => (
              <span
                key={avatar}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white ${
                  index === 0
                    ? "bg-slate-950"
                    : index === 1
                      ? "bg-emerald-600"
                      : "bg-sky-600"
                }`}
              >
                {avatar}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3 rounded-[1.5rem] bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">Action center</p>
              <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-bold text-slate-950">
                3 ready
              </span>
            </div>
            {[
              ["Duplicate found", "Same Craigslist URL"],
              ["Message soon", "Score 8.7 average"],
              ["Viewing today", "6:30 PM in Kitsilano"],
            ].map(([title, detail]) => (
              <div
                key={title}
                className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"
              >
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-slate-300">{detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ListingPreview
              title="Kitsilano 2 bed"
              area="Near Arbutus Greenway"
              price="$3,200"
              score="92"
              status="To view"
              tone="green"
            />
            <ListingPreview
              title="Mount Pleasant loft"
              area="12 min to work"
              price="$2,850"
              score="84"
              status="Messaged"
              tone="blue"
            />
          </div>
        </div>

        <div className="grid gap-3 border-t border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-3">
          {[
            ["Commute", "22 min drive", <MapPin key="map" className="h-4 w-4" />],
            ["Comments", "Alex: book it", <MessageCircle key="msg" className="h-4 w-4" />],
            ["Budget", "$350 under", <ShieldCheck key="budget" className="h-4 w-4" />],
          ].map(([label, value, icon]) => (
            <div key={label as string} className="rounded-2xl bg-white p-3">
              <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                {icon}
                {label}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ type }: { type: string }) {
  if (type === "score") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {["92", "84", "71"].map((score, index) => (
          <div key={score} className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-2xl font-bold text-slate-950">{score}</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  index === 0
                    ? "w-11/12 bg-emerald-500"
                    : index === 1
                      ? "w-4/5 bg-sky-500"
                      : "w-2/3 bg-amber-500"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "duplicates") {
    return (
      <div className="space-y-2">
        {["Craigslist Kits 2 bed", "Facebook Kits 2 bed"].map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-sm font-bold text-slate-800">{item}</span>
            <span className={index === 0 ? "text-rose-600" : "text-slate-400"}>
              <Copy className="h-4 w-4" />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "viewings") {
    return (
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-xs font-bold text-slate-400">Tonight</p>
        <p className="mt-1 text-lg font-bold text-slate-950">6:30 PM viewing</p>
        <p className="mt-1 text-sm text-slate-500">Kitsilano with Maya</p>
      </div>
    );
  }

  if (type === "commute") {
    return (
      <div className="grid gap-2">
        {["Work 18 min", "UBC 24 min", "Gym 8 min"].map((place) => (
          <div key={place} className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
            {place}
          </div>
        ))}
      </div>
    );
  }

  if (type === "message") {
    return (
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-xs font-bold text-slate-400">Draft ready</p>
        <p className="mt-1 text-sm font-bold text-slate-900">
          Hi, is this apartment still available for a viewing?
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <ListingPreview
        title="West End 1 bed"
        area="Near Stanley Park"
        price="$2,650"
        score="88"
        status="New"
        tone="amber"
      />
      <div className="space-y-2">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-xs font-bold text-slate-400">Saved links</p>
          <p className="text-2xl font-bold text-slate-950">12</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-xs font-bold text-slate-400">Need review</p>
          <p className="text-2xl font-bold text-slate-950">4</p>
        </div>
      </div>
    </div>
  );
}

function AuthOverlay({
  mode,
  redirectTo,
}: {
  mode: "login" | "signup";
  redirectTo?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid min-h-screen place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        <Link
          href={closeHref(redirectTo)}
          className="absolute -right-2 -top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100"
          aria-label="Close auth panel"
        >
          <X className="h-5 w-5" />
        </Link>
        <AuthForm mode={mode} redirectTo={redirectTo} />
      </div>
    </div>
  );
}

export default function LandingPage({ authMode = null, redirectTo }: Props) {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/login" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
            <Building2 className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-bold leading-tight">
              Rental Search Tracker
            </span>
            <span className="hidden text-sm font-medium text-slate-500 sm:block">
              Find a place together
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href={authHref("login", redirectTo)}
            className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white/70"
          >
            Log in
          </Link>
          <Link
            href={authHref("signup", redirectTo)}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
          >
            Start searching
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:pb-20 lg:pt-12">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Replace spreadsheets, tabs, and group chats
          </p>
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Apartment hunting, organized for everyone.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Track listings together, compare priorities, estimate commutes,
            coordinate viewings, and draft landlord messages without losing the
            thread.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={authHref("signup", redirectTo)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800"
            >
              Start searching
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={authHref("login", redirectTo)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Log in
            </Link>
          </div>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Shared notes", "Live statuses", "Smart next steps"].map((item) => (
              <div key={item} className="rounded-2xl bg-white/75 px-4 py-3 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ProductMockup />
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Product showcase
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Built for the messy middle of finding a home.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => (
              <article
                key={feature.title}
                className="overflow-hidden rounded-[1.5rem] bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${feature.accent}`}
                    >
                      {feature.icon}
                    </span>
                    <h3 className="text-xl font-bold text-slate-950">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="min-h-40 rounded-[1.25rem] bg-gradient-to-br from-white to-slate-100 p-3">
                  <FeatureVisual type={feature.visual} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Workflow
              </p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight">
                From link to decision without the chaos.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Every saved listing moves through a simple shared workflow so
                the next action is obvious.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {workflow.map((step, index) => (
                <div key={step.label} className="relative">
                  <div className="rounded-[1.25rem] bg-white p-4 text-slate-950 shadow-xl shadow-slate-950/20">
                    <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      {step.icon}
                    </span>
                    <p className="text-xs font-bold text-slate-400">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-bold">{step.label}</p>
                  </div>
                  {index < workflow.length - 1 && (
                    <div className="hidden sm:block absolute left-[calc(100%-0.25rem)] top-1/2 h-0.5 w-4 bg-white/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5f0] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-300/50 ring-1 ring-slate-200 sm:p-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-950">
            Ready to organize your apartment search?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Create a shared workspace, paste the first listing, and keep the
            whole group moving toward the right place.
          </p>
          <Link
            href={authHref("signup", redirectTo)}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800"
          >
            Start searching
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {authMode && <AuthOverlay mode={authMode} redirectTo={redirectTo} />}
    </main>
  );
}
