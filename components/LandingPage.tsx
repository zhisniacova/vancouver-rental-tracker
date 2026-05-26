import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Copy,
  Link2,
  Mail,
  MapPin,
  MousePointer2,
  Scale,
  Send,
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

type ScreenshotFrameProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  variant?: "hero" | "wide" | "tall" | "full";
  browserBar?: boolean;
  priority?: boolean;
};

const screenshotSources = {
  dashboard: "/screenshots/dashboard.png",
  detailedListing: "/screenshots/detailed-listing.png",
  actionCenter: "/screenshots/action-center.png",
  criteria: "/screenshots/criteria.png",
  message: "/screenshots/message.png",
  messageTemplate: "/screenshots/message-template.png",
  mapView: "/screenshots/map-view.png",
  viewings: "/screenshots/viewings.png",
  collaborators: "/screenshots/collaborators.png",
  frequentPlaces: "/screenshots/freq-places.png",
  listingCard: "/screenshots/listing-card.png",
};

const screenshotDimensions: Record<string, { width: number; height: number }> = {
  [screenshotSources.dashboard]: { width: 2468, height: 1624 },
  [screenshotSources.detailedListing]: { width: 1790, height: 1610 },
  [screenshotSources.actionCenter]: { width: 512, height: 1282 },
  [screenshotSources.criteria]: { width: 1222, height: 890 },
  [screenshotSources.message]: { width: 1780, height: 1188 },
  [screenshotSources.messageTemplate]: { width: 1780, height: 1188 },
  [screenshotSources.mapView]: { width: 1554, height: 920 },
  [screenshotSources.viewings]: { width: 1600, height: 798 },
  [screenshotSources.collaborators]: { width: 1200, height: 900 },
  [screenshotSources.frequentPlaces]: { width: 1200, height: 900 },
  [screenshotSources.listingCard]: { width: 1200, height: 900 },
};

const painPoints = [
  {
    title: "Links everywhere",
    description: "Keep every rental listing in one shared place.",
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    title: "Duplicate posts",
    description:
      "Catch repeated Craigslist/Facebook listings before your group wastes time.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "No clear next step",
    description:
      "Track who messaged, what needs review, and when viewings are booked.",
    icon: <MousePointer2 className="h-5 w-5" />,
  },
];

const walkthroughCards = [
  {
    title: "Add listings",
    description:
      "Save every rental link, track status, and keep the whole search visible.",
    src: screenshotSources.dashboard,
    alt: "Rental tracker dashboard screenshot",
    variant: "wide" as const,
  },
  {
    title: "Compare tradeoffs",
    description:
      "Set what matters, compare preferences, and see fit across your group.",
    src: screenshotSources.criteria,
    alt: "Rental search criteria and preference scoring screenshot",
    variant: "wide" as const,
  },
  {
    title: "Plan viewings",
    description:
      "Keep upcoming and past apartment tours organized in one schedule.",
    src: screenshotSources.viewings,
    alt: "Viewing tracker schedule screenshot",
    variant: "wide" as const,
  },
  {
    title: "Message landlords",
    description:
      "Draft landlord outreach from listing details and reusable templates.",
    src: screenshotSources.message,
    alt: "Landlord message composer screenshot",
    variant: "wide" as const,
  },
];

const productWorkflow = [
  {
    title: "See every listing with the context that matters.",
    description:
      "Photos, price, location, criteria match, commute estimates, viewing status, contact details, and notes stay attached to the listing.",
    src: screenshotSources.detailedListing,
    alt: "Detailed rental listing with photos, criteria, contact details, and notes",
    variant: "full" as const,
  },
  {
    title: "Catch duplicates before your group wastes time.",
    description:
      "The action center surfaces duplicate groups, message reminders, and listings that still need review.",
    src: screenshotSources.actionCenter,
    alt: "Action center showing duplicate groups and listings needing review",
    variant: "tall" as const,
  },
];

const features = [
  {
    title: "Shared dashboard",
    description:
      "A shared view for saved rentals, statuses, filters, notes, and next steps.",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: "Duplicate detection",
    description:
      "Catch repeated listings before your group reviews the same place twice.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Match scoring",
    description:
      "Compare listings against the preferences that matter to your search.",
    icon: <Star className="h-5 w-5" />,
  },
  {
    title: "Viewing tracker",
    description: "Keep upcoming and past apartment tours easy to scan.",
    icon: <CalendarCheck className="h-5 w-5" />,
  },
  {
    title: "Message templates",
    description: "Create landlord messages from reusable, listing-aware drafts.",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    title: "Map view",
    description:
      "See geocoded listings near work, school, transit, and daily places.",
    icon: <MapPin className="h-5 w-5" />,
  },
];

const workflowSteps = [
  {
    title: "Save listing",
    description: "Paste a rental link into the shared workspace.",
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    title: "Compare",
    description: "Check tradeoffs, notes, scores, and duplicate warnings.",
    icon: <Scale className="h-5 w-5" />,
  },
  {
    title: "Message",
    description: "Use a template and record landlord outreach.",
    icon: <Send className="h-5 w-5" />,
  },
  {
    title: "View",
    description: "Track scheduled tours and follow-up status.",
    icon: <CalendarCheck className="h-5 w-5" />,
  },
  {
    title: "Decide",
    description: "Keep the final call attached to the listing history.",
    icon: <ClipboardCheck className="h-5 w-5" />,
  },
];

function authHref(mode: "login" | "signup", redirectTo?: string) {
  const params = new URLSearchParams({ auth: mode });
  if (redirectTo) params.set("next", redirectTo);
  return `/${mode}?${params.toString()}`;
}

function closeHref(redirectTo?: string) {
  return redirectTo ? `/login?next=${encodeURIComponent(redirectTo)}` : "/login";
}

function CTAButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-slate-950 text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 focus-visible:outline-slate-950"
      : "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-slate-700";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold whitespace-nowrap transition ${styles} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4`}
    >
      {children}
    </Link>
  );
}

function ScreenshotFrame({
  src,
  alt,
  className = "",
  imageClassName = "w-full h-auto object-contain",
  variant = "wide",
  browserBar = true,
  priority = false,
}: ScreenshotFrameProps) {
  const dimensions = screenshotDimensions[src] ?? { width: 1600, height: 1000 };
  const variantStyles = {
    hero: "mx-auto w-full max-w-7xl",
    wide: "w-full",
    tall: "mx-auto w-full max-w-sm",
    full: "w-full",
  };
  const imageStyles =
    variant === "tall"
      ? `${imageClassName} max-h-[620px] w-auto max-w-full`
      : imageClassName;

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-300/45 ring-1 ring-slate-200 ${variantStyles[variant]} ${className}`}
    >
      {browserBar && (
        <div
          className="flex min-h-10 items-center gap-2 border-b border-slate-200 bg-slate-100 px-4"
          aria-hidden="true"
        >
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 h-2 flex-1 rounded-full bg-white ring-1 ring-slate-200" />
        </div>
      )}
      <div
        className={`flex bg-slate-50 ${
          variant === "tall" ? "justify-center" : ""
        }`}
      >
        <Image
          src={src}
          alt={alt}
          sizes="(min-width: 1280px) 1000px, (min-width: 768px) 58vw, 92vw"
          width={dimensions.width}
          height={dimensions.height}
          priority={priority}
          loading={priority ? undefined : "eager"}
          quality={95}
          className={imageStyles}
        />
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  tone = "light",
}: {
  title: string;
  description: string;
  icon: ReactNode;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <article
      className={`rounded-2xl p-5 ring-1 ${
        isDark
          ? "bg-slate-900 text-white ring-white/10"
          : "bg-white text-slate-950 ring-slate-200"
      }`}
    >
      <span
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
          isDark
            ? "bg-white/10 text-emerald-200"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {icon}
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      <p
        className={`mt-2 text-sm leading-6 ${
          isDark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {description}
      </p>
    </article>
  );
}

function WorkflowStep({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl bg-white p-4 text-slate-950 shadow-xl shadow-slate-950/20">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </span>
        <span className="text-xs font-bold text-slate-400">Step {step}</span>
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
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
          className="absolute -right-2 -top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
  const signupHref = authHref("signup", redirectTo);
  const loginHref = authHref("login", redirectTo);

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg">
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
        <nav className="flex items-center gap-2" aria-label="Landing page">
          <Link
            href={loginHref}
            className="rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap text-slate-700 hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
          >
            Log in
          </Link>
          <CTAButton href={signupHref}>Start tracking</CTAButton>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:pb-24 lg:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <Users className="h-4 w-4 text-emerald-700" />
            Built for shared rental searches
          </p>
          <h1 className="text-5xl font-bold text-slate-950 sm:text-6xl lg:text-7xl">
            Stop losing rental listings in group chats.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Track apartments, compare tradeoffs, avoid duplicates, and decide
            together in one shared workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <CTAButton href={signupHref}>
              Start tracking listings
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="#walkthrough" variant="secondary">
              See how it works
            </CTAButton>
          </div>
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-3">
            {[
              "Shared workspace",
              "Duplicate detection",
              "Viewing tracker",
              "Message templates",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200"
              >
                <Check className="h-4 w-4 text-emerald-700" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <ScreenshotFrame
          src={screenshotSources.dashboard}
          alt="Shared rental search workspace dashboard"
          variant="hero"
          className="mt-12"
          priority
        />
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-slate-950">
              Apartment hunting gets messy fast.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Links get buried in group chats, spreadsheets go stale, and nobody
              knows who messaged which landlord.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {painPoints.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5f0] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-slate-950">
              Everything your group needs to decide faster.
            </h2>
          </div>
          <div className="mt-10 space-y-10">
            <article className="rounded-3xl bg-white p-4 shadow-xl shadow-slate-300/40 ring-1 ring-slate-200 sm:p-6 lg:p-8">
              <div className="mb-6 max-w-3xl">
                <h3 className="text-2xl font-bold text-slate-950">
                  {productWorkflow[0].title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {productWorkflow[0].description}
                </p>
              </div>
              <ScreenshotFrame
                src={productWorkflow[0].src}
                alt={productWorkflow[0].alt}
                variant={productWorkflow[0].variant}
                className="shadow-none"
              />
            </article>

            <article className="grid gap-8 rounded-3xl bg-white p-4 shadow-xl shadow-slate-300/40 ring-1 ring-slate-200 sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-950">
                  {productWorkflow[1].title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {productWorkflow[1].description}
                </p>
              </div>
              <ScreenshotFrame
                src={productWorkflow[1].src}
                alt={productWorkflow[1].alt}
                variant={productWorkflow[1].variant}
                className="shadow-none"
              />
            </article>
          </div>
        </div>
      </section>

      <section id="walkthrough" className="bg-[#f7f5f0] py-20 scroll-mt-8">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-slate-950">
              From saved link to viewing, every step stays organized.
            </h2>
          </div>
          <div className="mt-10 space-y-12">
            {walkthroughCards.map((card, index) => (
              <article
                key={card.title}
                className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr] lg:items-center"
              >
                <div
                  className={
                    index % 2 === 1 ? "lg:order-2 lg:pl-6" : "lg:pr-6"
                  }
                >
                  <p className="text-sm font-bold text-emerald-700">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">
                    {card.description}
                  </p>
                </div>
                <ScreenshotFrame
                  src={card.src}
                  alt={card.alt}
                  variant={card.variant}
                  className={
                    index % 2 === 1
                      ? "lg:order-1 shadow-xl shadow-slate-300/35"
                      : "shadow-xl shadow-slate-300/35"
                  }
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
            <div>
              <h2 className="text-4xl font-bold text-slate-950">
                The essentials for a shared rental search.
              </h2>
              <div className="mt-8 overflow-hidden rounded-2xl bg-slate-950 p-2 shadow-xl shadow-slate-300/40">
                <ScreenshotFrame
                  src={screenshotSources.mapView}
                  alt="Map view showing geocoded listings around frequent places"
                  variant="wide"
                  browserBar={false}
                  className="shadow-none"
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <h2 className="text-4xl font-bold">
                A clear workflow for every listing.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Each apartment moves through the same simple path, so everyone
                can see what happened and what needs attention next.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {workflowSteps.map((step, index) => (
                <WorkflowStep key={step.title} step={index + 1} {...step} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5f0] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-300/50 ring-1 ring-slate-200 sm:p-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="text-4xl font-bold text-slate-950">
            Ready to make your apartment search less chaotic?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Create a shared workspace, add your first listing, and invite the
            people searching with you.
          </p>
          <div className="mt-8">
            <CTAButton href={signupHref}>
              Start tracking listings
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </div>
        </div>
      </section>

      {authMode && <AuthOverlay mode={authMode} redirectTo={redirectTo} />}
    </main>
  );
}
