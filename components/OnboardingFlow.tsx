"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Archive,
  Building2,
  CalendarDays,
  Car,
  Check,
  Copy,
  Dumbbell,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Sofa,
  Sparkles,
  Trees,
  Users,
  WashingMachine,
  Waves,
  X,
} from "lucide-react";
import {
  completeOnboarding,
  completeOnboardingWithSetup,
  createOnboardingInviteLink,
  saveOnboardingPriorities,
  saveOnboardingSearchSetup,
} from "@/app/onboarding/actions";
import { type FrequentPlace } from "@/lib/commute";

type OnboardingWorkspace = {
  id: string;
  name: string;
  maxRent: number | null;
  bedrooms: string | null;
  moveInDate: string | null;
  preferredNeighborhoods: string[];
};

type OnboardingCriterion = {
  label: string;
  builtinKey: string | null;
  importance: "low" | "medium" | "high" | "must-have";
  selected: boolean;
};

type OnboardingPlace = FrequentPlace & {
  saved: boolean;
};

type Props = {
  initialWorkspace: OnboardingWorkspace | null;
  initialCriteria: OnboardingCriterion[];
  initialPlaces: FrequentPlace[];
};

const steps = [
  "Welcome",
  "Search",
  "Priorities",
  "Commute",
  "Collaboration",
  "Finish",
];

const priorityOptions: Array<{
  label: string;
  builtinKey?: string;
  helper: string;
}> = [
  { label: "Parking", builtinKey: "parking", helper: "Secure or included parking" },
  { label: "Storage", builtinKey: "storage", helper: "Locker or extra storage" },
  { label: "Gym", builtinKey: "gym", helper: "Fitness room in building" },
  {
    label: "In-suite laundry",
    builtinKey: "inSuiteLaundry",
    helper: "Washer/dryer in the unit",
  },
  { label: "Pets / pet policy", builtinKey: "pets", helper: "Pet-friendly terms" },
  { label: "Furnished", builtinKey: "furnished", helper: "Move-in ready furniture" },
  { label: "Balcony", helper: "Private outdoor space" },
  { label: "Sauna", helper: "Building amenity" },
];

const importanceOptions: OnboardingCriterion["importance"][] = [
  "low",
  "medium",
  "high",
  "must-have",
];

const importanceLabels: Record<OnboardingCriterion["importance"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  "must-have": "Must-have",
};

function getInitialPriorities(criteria: OnboardingCriterion[]) {
  const existing = new Map(
    criteria.map((criterion) => [criterion.label.toLowerCase(), criterion])
  );

  return priorityOptions.map((option) => {
    const saved = existing.get(option.label.toLowerCase());
    return {
      label: option.label,
      builtinKey: option.builtinKey ?? null,
      importance: saved?.importance ?? "medium",
      selected: saved?.selected ?? false,
    };
  });
}

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rental Search Tracker
            </p>
            <p className="text-sm font-semibold text-slate-900">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => completeOnboarding()}
            className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-900"
          >
            Skip onboarding
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {steps.map((step, index) => (
            <div key={step} className="h-2 rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition ${
                  index <= currentStep ? "bg-slate-950" : "bg-transparent"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white p-4 shadow-2xl shadow-slate-300/60 ring-1 ring-slate-200">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-emerald-100 via-sky-50 to-violet-100" />
      <div className="relative mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Shared dashboard
          </p>
          <p className="text-lg font-bold text-slate-950">Listings</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          82% match
        </span>
      </div>
      <div className="relative grid gap-3 sm:grid-cols-[0.9fr_1fr]">
        <div className="rounded-3xl bg-slate-950 p-3 text-white">
          <div className="mb-4 grid h-32 grid-cols-[1.2fr_0.8fr] gap-2">
            <div className="rounded-2xl bg-gradient-to-br from-slate-600 via-slate-400 to-emerald-200" />
            <div className="grid gap-2">
              <div className="rounded-2xl bg-gradient-to-br from-sky-200 to-slate-400" />
              <div className="rounded-2xl bg-gradient-to-br from-violet-200 to-slate-500" />
            </div>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Kitsilano 2 bed</p>
              <p className="text-2xl font-bold">$3,200/mo</p>
            </div>
            <span className="rounded-full bg-emerald-300 px-2 py-1 text-xs font-bold text-slate-950">
              92
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/15 px-2 py-1">Parking</span>
            <span className="rounded-full bg-white/15 px-2 py-1">Laundry</span>
            <span className="rounded-full bg-white/15 px-2 py-1">24m commute</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <div className="mb-3 flex -space-x-2">
              {["S", "G", "+"].map((avatar) => (
                <span
                  key={avatar}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white ring-2 ring-white"
                >
                  {avatar}
                </span>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-950">
              “Great layout. Book viewing?”
            </p>
          </div>
          {[
            ["Message landlord", "Ready"],
            ["Viewing", "Thu 6:30 PM"],
            ["Commute", "22 min drive"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-400">{label}</p>
              <p className="font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getPriorityIcon(label: string) {
  const className = "h-5 w-5";

  switch (label) {
    case "Parking":
      return <Car className={className} />;
    case "Storage":
      return <Archive className={className} />;
    case "Gym":
      return <Dumbbell className={className} />;
    case "In-suite laundry":
      return <WashingMachine className={className} />;
    case "Pets / pet policy":
      return <Home className={className} />;
    case "Furnished":
      return <Sofa className={className} />;
    case "Balcony":
      return <Trees className={className} />;
    case "Sauna":
      return <Waves className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
      {children}
      {helper && <span className="mt-2 block text-sm text-slate-500">{helper}</span>}
    </label>
  );
}

export default function OnboardingFlow({
  initialWorkspace,
  initialCriteria,
  initialPlaces,
}: Props) {
  const [step, setStep] = useState(0);
  const [workspaceId, setWorkspaceId] = useState(initialWorkspace?.id ?? "");
  const [workspaceName, setWorkspaceName] = useState(
    initialWorkspace?.name ?? "My rental search"
  );
  const [maxRent, setMaxRent] = useState(
    initialWorkspace?.maxRent ? String(initialWorkspace.maxRent) : ""
  );
  const [bedrooms, setBedrooms] = useState(initialWorkspace?.bedrooms ?? "");
  const [moveInDate, setMoveInDate] = useState(initialWorkspace?.moveInDate ?? "");
  const [preferredNeighborhoods, setPreferredNeighborhoods] = useState(
    initialWorkspace?.preferredNeighborhoods.join(", ") ?? ""
  );
  const [priorities, setPriorities] = useState(() =>
    getInitialPriorities(initialCriteria)
  );
  const [customCriterion, setCustomCriterion] = useState("");
  const [places, setPlaces] = useState<OnboardingPlace[]>(() =>
    initialPlaces.map((place) => ({ ...place, saved: true }))
  );
  const [savedPlaceIds] = useState(
    () => new Set(initialPlaces.map((place) => place.id))
  );
  const [placeName, setPlaceName] = useState("");
  const [placeAddress, setPlaceAddress] = useState("");
  const [maxDriveMinutes, setMaxDriveMinutes] = useState("");
  const [maxTransitMinutes, setMaxTransitMinutes] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedPriorities = useMemo(
    () => priorities.filter((priority) => priority.selected),
    [priorities]
  );
  const canContinue = step !== 1 || workspaceName.trim().length > 0;

  function updatePriority(
    label: string,
    updates: Partial<OnboardingCriterion>
  ) {
    setPriorities((current) =>
      current.map((priority) =>
        priority.label === label ? { ...priority, ...updates } : priority
      )
    );
  }

  function addCustomCriterion() {
    const label = customCriterion.trim();
    if (!label) return;
    if (
      priorities.some(
        (priority) => priority.label.toLowerCase() === label.toLowerCase()
      )
    ) {
      setCustomCriterion("");
      return;
    }

    setPriorities((current) => [
      ...current,
      { label, builtinKey: null, importance: "medium", selected: true },
    ]);
    setCustomCriterion("");
  }

  function goBack() {
    setError("");
    setMessage("");
    setStep((current) => Math.max(0, current - 1));
  }

  function continueFromSearchSetup() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await saveOnboardingSearchSetup({
        workspaceId,
        workspaceName,
        maxRent,
        bedrooms,
        moveInDate,
        preferredNeighborhoods,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.workspaceId) setWorkspaceId(result.workspaceId);
      setStep(2);
    });
  }

  function continueFromPriorities() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await saveOnboardingPriorities({
        workspaceId,
        priorities: selectedPriorities,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setStep(3);
    });
  }

  function addPlace() {
    setError("");
    setMessage("");
    setPlaces((current) => [
      ...current,
      {
        id: `draft-${Date.now()}`,
        rentalSearchId: workspaceId,
        name: placeName.trim(),
        address: placeAddress.trim(),
        latitude: null,
        longitude: null,
        formattedAddress: null,
        maxDriveMinutes: Number(maxDriveMinutes) || null,
        maxTransitMinutes: Number(maxTransitMinutes) || null,
        saved: false,
      },
    ]);
    setPlaceName("");
    setPlaceAddress("");
    setMaxDriveMinutes("");
    setMaxTransitMinutes("");
    setMessage("Place added to onboarding.");
  }

  function createInvite() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await createOnboardingInviteLink(workspaceId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setInviteLink(
        result.inviteLink ? `${window.location.origin}${result.inviteLink}` : ""
      );
      setMessage("Invite link created.");
    });
  }

  function goNext() {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1) {
      continueFromSearchSetup();
      return;
    }

    if (step === 2) {
      continueFromPriorities();
      return;
    }

    if (step === 5) {
      startTransition(async () => {
        const draftPlaces = [
          ...places
            .filter((place) => !savedPlaceIds.has(place.id))
            .map((place) => ({
              name: place.name,
              address: place.address,
              maxDriveMinutes: place.maxDriveMinutes
                ? String(place.maxDriveMinutes)
                : undefined,
              maxTransitMinutes: place.maxTransitMinutes
                ? String(place.maxTransitMinutes)
                : undefined,
            })),
          ...(placeName.trim() && placeAddress.trim()
            ? [
                {
                  name: placeName,
                  address: placeAddress,
                  maxDriveMinutes: maxDriveMinutes || undefined,
                  maxTransitMinutes: maxTransitMinutes || undefined,
                },
              ]
            : []),
        ];
        const result = await completeOnboardingWithSetup({
          searchSetup: {
            workspaceId,
            workspaceName,
            maxRent,
            bedrooms,
            moveInDate,
            preferredNeighborhoods,
          },
          priorities: selectedPriorities,
          places: draftPlaces,
        });

        if (result?.error) {
          setError(result.error);
        }
      });
      return;
    }

    setError("");
    setMessage("");
    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  function renderStep() {
    if (step === 0) {
      return (
        <div className="grid items-center gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
              <Home className="h-4 w-4" />
              Shared rental search
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
              Find your next home together
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Track listings, compare apartments, coordinate viewings, and
              message landlords in one shared workspace.
            </p>
          </div>
          <PreviewCard />
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="mx-auto max-w-5xl">
          <div className="mb-5">
            <p className="text-sm font-bold text-slate-500">Search setup</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              What are you looking for?
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Start with the basics. You can refine everything later.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Workspace/search name" helper="For example: Vancouver May search">
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                />
              </Field>
              <Field label="Max rent" helper="A monthly ceiling helps flag good fits.">
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={maxRent}
                  onChange={(event) => setMaxRent(event.target.value)}
                  placeholder="3200"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                />
              </Field>
              <Field label="Bedrooms" helper="Studio, 1 bed, 2 bed, or whatever fits.">
                <input
                  value={bedrooms}
                  onChange={(event) => setBedrooms(event.target.value)}
                  placeholder="2 bedrooms"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                />
              </Field>
              <Field label="Move-in date" helper="Approximate is fine.">
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(event) => setMoveInDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Preferred neighborhoods"
                  helper="Separate areas with commas, like Kitsilano, Mount Pleasant, West End."
                >
                  <input
                    value={preferredNeighborhoods}
                    onChange={(event) =>
                      setPreferredNeighborhoods(event.target.value)
                    }
                    placeholder="Kitsilano, Mount Pleasant, West End"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <p className="text-sm font-bold text-slate-500">Priorities</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Choose what matters most
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Pick the signals you want listings scored against.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {priorityOptions.map((option) => {
                  const priority = priorities.find(
                    (item) => item.label === option.label
                  );
                  const selected = Boolean(priority?.selected);
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        updatePriority(option.label, { selected: !selected })
                      }
                      className={`rounded-3xl p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                        selected
                          ? "bg-slate-950 text-white shadow-md shadow-slate-300/60 ring-2 ring-slate-950"
                          : "bg-slate-50 text-slate-900 hover:bg-white hover:ring-1 hover:ring-slate-200"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex gap-3">
                          <span
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                              selected ? "bg-white/15" : "bg-white"
                            }`}
                          >
                            {getPriorityIcon(option.label)}
                          </span>
                          <span>
                          <span className="block font-bold">{option.label}</span>
                          <span
                            className={`mt-1 block text-sm ${
                              selected ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {option.helper}
                          </span>
                          </span>
                        </span>
                        {selected && <Check className="h-5 w-5" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <input
                  value={customCriterion}
                  onChange={(event) => setCustomCriterion(event.target.value)}
                  placeholder="Add custom criterion"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={addCustomCriterion}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <p className="mb-4 text-sm font-bold text-slate-500">
                Selected priorities
              </p>
              {selectedPriorities.length === 0 ? (
                <p className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                  Select a few priorities to make listing matches feel more
                  personal.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedPriorities.map((priority) => (
                    <div
                      key={priority.label}
                      className="rounded-3xl bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="font-bold text-slate-950">
                          {priority.label}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            updatePriority(priority.label, { selected: false })
                          }
                          className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                          aria-label={`Remove ${priority.label}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {importanceOptions.map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() =>
                              updatePriority(priority.label, {
                                importance: level,
                              })
                            }
                            className={`rounded-full px-3 py-2 text-xs font-bold ${
                              priority.importance === level
                                ? "bg-slate-950 text-white"
                                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {importanceLabels[level]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <p className="text-sm font-bold text-slate-500">Commute places</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Add places you visit often
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Add places like UBC, work, or gym to estimate commute times for
              each listing.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr]">
            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="grid gap-4">
                <Field label="Place name">
                  <input
                    value={placeName}
                    onChange={(event) => setPlaceName(event.target.value)}
                    placeholder="Work, UBC, Gym"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                  />
                </Field>
                <Field label="Address">
                  <input
                    value={placeAddress}
                    onChange={(event) => setPlaceAddress(event.target.value)}
                    placeholder="2329 West Mall, Vancouver"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Max drive time">
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={maxDriveMinutes}
                      onChange={(event) => setMaxDriveMinutes(event.target.value)}
                      placeholder="25"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                    />
                  </Field>
                  <Field label="Max transit time">
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={maxTransitMinutes}
                      onChange={(event) =>
                        setMaxTransitMinutes(event.target.value)
                      }
                      placeholder="40"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500"
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={addPlace}
                  disabled={isPending || !placeName.trim() || !placeAddress.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Add place
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <p className="mb-4 text-sm font-bold text-slate-500">
                Saved places
              </p>
              {places.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-center">
                  <MapPin className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                  <p className="text-sm text-slate-500">
                    Add places like UBC, work, or gym to estimate commute times
                    for each listing.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {places.map((place) => (
                    <article key={place.id} className="rounded-3xl bg-slate-50 p-4">
                      <p className="font-bold text-slate-950">{place.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {place.formattedAddress || place.address}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                        {place.maxDriveMinutes && (
                          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                            Drive {place.maxDriveMinutes} min
                          </span>
                        )}
                        {place.maxTransitMinutes && (
                          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                            Transit {place.maxTransitMinutes} min
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <p className="text-sm font-bold text-slate-500">Collaboration</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Search together without losing the thread
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Invite your search partner now, or do it later from Settings.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div className="grid gap-3">
              {[
                "Everyone can add listings",
                "Everyone can comment",
                "Everyone can compare priorities",
                "Everyone can track messages/viewings",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Check className="h-5 w-5" />
                  </span>
                  <p className="font-bold text-slate-900">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <Users className="mb-4 h-10 w-10 text-slate-900" />
              <h2 className="text-2xl font-bold text-slate-950">
                Invite a collaborator
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create a private invite link for the current workspace.
              </p>
              <button
                type="button"
                onClick={createInvite}
                disabled={isPending || !workspaceId}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Users className="h-4 w-4" />
                Invite now
              </button>
              {inviteLink && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <input
                    readOnly
                    value={inviteLink}
                    className="w-full bg-transparent text-sm text-slate-700 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-950 text-white">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Your search is ready
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Head to the dashboard to add your first listing, compare matches, and
          keep every message and viewing organized.
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
          {[
            { Icon: CalendarDays, label: "Viewings" },
            { Icon: MessageCircle, label: "Messages" },
            { Icon: MapPin, label: "Commutes" },
          ].map(({ Icon, label }) => (
            <div key={label} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <Icon className="mx-auto mb-3 h-6 w-6 text-slate-700" />
              <p className="font-bold text-slate-900">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <StepProgress currentStep={step} />
      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        {renderStep()}

        {(error || message) && (
          <div
            className={`mx-auto mt-8 max-w-4xl rounded-2xl px-4 py-3 text-sm font-semibold ${
              error
                ? "bg-rose-50 text-rose-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-2xl shadow-slate-300/50 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || isPending}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {(step === 3 || step === 4) && (
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                disabled={isPending}
                className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                {step === 3 ? "Skip places" : "Invite later"}
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue || isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Saving..."
                : step === 0
                  ? "Start search"
                  : step === 5
                    ? "Go to dashboard"
                    : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
