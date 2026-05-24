import {
  type ImportanceLevel,
  IMPORTANCE_LEVELS,
  type ListingCriteriaInput,
} from "./rentalPreferences";

export type WorkspaceCriterion = {
  id: string;
  rentalSearchId: string;
  key: string;
  label: string;
  builtinKey: string | null;
  keywords: string[];
  archivedAt: string | null;
};

export type MemberCriterionPreference = {
  rentalSearchId: string;
  userId: string;
  criterionId: string;
  importance: ImportanceLevel;
};

export type CustomCriterionSignal = {
  id: string;
  key: string;
  label: string;
  importance: ImportanceLevel;
  points: number;
  matched: boolean;
  known: boolean;
  summary: string;
};

export type CustomCriteriaMatchSummary = {
  signals: CustomCriterionSignal[];
  earnedPoints: number;
  totalPoints: number;
  percentage: number | null;
  missingMustHaves: CustomCriterionSignal[];
};

const IMPORTANCE_POINTS: Record<ImportanceLevel, number> = {
  "must-have": 3,
  important: 2,
  "nice-to-have": 1,
  "not important": 0,
};

export const DEFAULT_CRITERIA_SUGGESTIONS = [
  "Balcony",
  "EV charging",
  "Parking",
  "Gym",
  "In-suite laundry",
  "Storage",
  "Dishwasher",
  "Pets allowed",
  "Smoke-free",
  "Furnished",
  "Sauna",
  "Air conditioning",
  "Concierge",
];

export type PredefinedCriterion = {
  key: string;
  label: string;
  builtinKey: string | null;
  keywords: string[];
};

export const PREDEFINED_CRITERIA: PredefinedCriterion[] = [
  {
    key: "parking",
    label: "Parking",
    builtinKey: "parking",
    keywords: ["parking", "parking stall", "secure parking"],
  },
  {
    key: "storage",
    label: "Storage",
    builtinKey: "storage",
    keywords: ["storage", "storage locker"],
  },
  {
    key: "gym",
    label: "Gym",
    builtinKey: "gym",
    keywords: ["gym", "fitness centre", "fitness center", "fitness room"],
  },
  {
    key: "in_suite_laundry",
    label: "In-suite laundry",
    builtinKey: "inSuiteLaundry",
    keywords: [
      "in-suite laundry",
      "in suite laundry",
      "ensuite laundry",
      "in-unit laundry",
      "washer dryer in suite",
    ],
  },
  {
    key: "pets",
    label: "Pets allowed",
    builtinKey: "pets",
    keywords: [
      "pets",
      "pet friendly",
      "pets allowed",
      "pets / pet policy",
      "pet policy",
      "cats allowed",
      "dogs allowed",
    ],
  },
  {
    key: "furnished",
    label: "Furnished",
    builtinKey: "furnished",
    keywords: ["furnished", "fully furnished"],
  },
  {
    key: "balcony",
    label: "Balcony",
    builtinKey: null,
    keywords: ["balcony", "patio", "private outdoor space"],
  },
  {
    key: "sauna",
    label: "Sauna",
    builtinKey: null,
    keywords: ["sauna", "steam room"],
  },
  {
    key: "air_conditioning",
    label: "Air conditioning",
    builtinKey: null,
    keywords: ["air conditioning", "air conditioner", "a/c", "ac"],
  },
  {
    key: "dishwasher",
    label: "Dishwasher",
    builtinKey: null,
    keywords: ["dishwasher"],
  },
  {
    key: "concierge",
    label: "Concierge",
    builtinKey: null,
    keywords: ["concierge", "front desk"],
  },
  {
    key: "ev_charging",
    label: "EV charging",
    builtinKey: null,
    keywords: ["ev charging", "electric vehicle charging"],
  },
  {
    key: "smoke_free",
    label: "Smoke-free",
    builtinKey: null,
    keywords: ["smoke-free", "smoke free", "no smoking", "non-smoking"],
  },
];

export function normalizeCriterionLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getCriterionKey(value: string) {
  return normalizeCriterionLabel(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getPredefinedCriterion(value: string) {
  const key = getCriterionKey(value);
  const normalized = normalizeCriterionLabel(value).toLowerCase();

  return (
    PREDEFINED_CRITERIA.find(
      (criterion) =>
        criterion.key === key ||
        criterion.label.toLowerCase() === normalized ||
        criterion.keywords.some((keyword) => getCriterionKey(keyword) === key)
    ) ?? null
  );
}

export function isPredefinedCriterion(criterion: Pick<WorkspaceCriterion, "key" | "label" | "builtinKey">) {
  return Boolean(
    criterion.builtinKey ||
      getPredefinedCriterion(criterion.key) ||
      getPredefinedCriterion(criterion.label)
  );
}

export function isImportanceLevel(value: unknown): value is ImportanceLevel {
  return (
    typeof value === "string" &&
    IMPORTANCE_LEVELS.includes(value as ImportanceLevel)
  );
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[-_]/g, " ");
}

function isYes(value?: string | boolean | null) {
  if (typeof value === "boolean") return value;
  return typeof value === "string" && value.toLowerCase() === "yes";
}

function isKnown(value?: string | boolean | null) {
  if (typeof value === "boolean") return true;
  if (!value) return false;
  return value.toLowerCase() !== "unknown";
}

function evaluateBuiltIn(
  builtinKey: string,
  listing: ListingCriteriaInput,
  searchableText: string
) {
  if (builtinKey === "pets") {
    const value = listing.petPolicy;
    if (!value || value.toLowerCase() === "unknown") {
      return { matched: false, known: false, summary: "Unknown" };
    }
    const normalized = normalizeText(value);
    const missing = normalized === "no" || /\b(no pets|not allowed|pets not allowed|pet not allowed)\b/.test(
      normalized
    );
    return { matched: !missing, known: true, summary: value };
  }

  if (builtinKey === "inSuiteLaundry") {
    const value = listing.inSuiteWasher;
    const text = normalizeText(`${value ?? ""} ${searchableText}`);
    const hasInSuite =
      isYes(value) ||
      /\b(in suite|in-suite|ensuite|in unit|in-unit)\s+(laundry|washer|washer dryer)\b/.test(
        text
      ) ||
      /\b(laundry|washer|washer dryer)\s+(in suite|in-suite|ensuite|in unit|in-unit)\b/.test(
        text
      );
    const sharedOnly = /\b(shared laundry|coin laundry|laundry room|laundry on (the )?floor|floor laundry)\b/.test(
      text
    );
    return {
      matched: hasInSuite && !sharedOnly,
      known: isKnown(value) || hasInSuite || sharedOnly,
      summary: hasInSuite && !sharedOnly ? "Yes" : sharedOnly ? "Shared laundry" : value || "Unknown",
    };
  }

  const value =
    builtinKey === "parking"
      ? listing.parking
      : builtinKey === "storage"
        ? listing.storageLocker
        : builtinKey === "gym"
          ? listing.gym
          : builtinKey === "furnished"
            ? listing.furnished
            : null;

  return {
    matched: isYes(value),
    known: isKnown(value),
    summary:
      typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : value || "Unknown",
  };
}

function evaluateCustomCriterion(
  criterion: WorkspaceCriterion,
  searchableText: string,
  customCriteriaValues: Record<string, string | null | undefined> = {}
) {
  const explicitValue = customCriteriaValues[criterion.id];
  if (explicitValue && explicitValue !== "Unknown") {
    return {
      matched: isYes(explicitValue),
      known: isKnown(explicitValue),
      summary: explicitValue,
    };
  }

  const text = normalizeText(searchableText);
  const keywords = [
    criterion.label,
    criterion.key,
    ...(criterion.keywords ?? []),
  ]
    .map(normalizeText)
    .filter(Boolean);
  const matched = keywords.some((keyword) =>
    new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)
  );

  return {
    matched,
    known: matched,
    summary: matched ? "Mentioned" : "Not mentioned",
  };
}

function aggregateImportance(
  criterionId: string,
  preferences: MemberCriterionPreference[]
): ImportanceLevel {
  let highest: ImportanceLevel = "not important";

  for (const pref of preferences) {
    if (pref.criterionId !== criterionId) continue;

    if (IMPORTANCE_POINTS[pref.importance] > IMPORTANCE_POINTS[highest]) {
      highest = pref.importance;
    }
  }

  return highest;
}

export function getCustomCriteriaMatchSummary({
  criteria,
  preferences,
  listing,
  searchableText,
  customCriteriaValues,
}: {
  criteria: WorkspaceCriterion[];
  preferences: MemberCriterionPreference[];
  listing: ListingCriteriaInput;
  searchableText: string;
  customCriteriaValues?: Record<string, string | null | undefined>;
}): CustomCriteriaMatchSummary {
  const signals = criteria
    .filter((criterion) => !criterion.archivedAt)
    .map((criterion) => {
      const importance = aggregateImportance(criterion.id, preferences);
      const points = IMPORTANCE_POINTS[importance];
      const result = criterion.builtinKey
        ? evaluateBuiltIn(criterion.builtinKey, listing, searchableText)
        : evaluateCustomCriterion(
            criterion,
            searchableText,
            customCriteriaValues
          );

      return {
        id: criterion.id,
        key: criterion.key,
        label: criterion.label,
        importance,
        points,
        matched: result.matched,
        known: result.known,
        summary: result.summary,
      };
    });

  const relevantSignals = signals.filter((signal) => signal.points > 0);
  const totalPoints = relevantSignals.reduce(
    (sum, signal) => sum + signal.points,
    0
  );
  const earnedPoints = relevantSignals.reduce(
    (sum, signal) => sum + (signal.matched ? signal.points : 0),
    0
  );

  return {
    signals,
    earnedPoints,
    totalPoints,
    percentage:
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null,
    missingMustHaves: signals.filter(
      (signal) =>
        signal.importance === "must-have" && signal.known && !signal.matched
    ),
  };
}
