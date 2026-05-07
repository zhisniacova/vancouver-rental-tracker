export type ImportanceLevel =
  | "must-have"
  | "important"
  | "nice-to-have"
  | "not important";

export type CriteriaKey =
  | "parking"
  | "storage"
  | "gym"
  | "inSuiteLaundry"
  | "pets"
  | "furnished";

export type RentalCriteriaPreferences = {
  criteria: Record<CriteriaKey, ImportanceLevel>;
  maxRent: number | null;
  targetSqft: number | null;
  minimumSqft: number | null;
};

export type CriteriaSignal = {
  key: CriteriaKey;
  label: string;
  importance: ImportanceLevel;
  points: number;
  matched: boolean;
  known: boolean;
  summary: string;
};

export type MatchSummary = {
  signals: CriteriaSignal[];
  earnedPoints: number;
  totalPoints: number;
  percentage: number | null;
  missingMustHaves: CriteriaSignal[];
};

export type BudgetStatus = "under" | "near" | "over" | "unset";
export type SqftStatus = "below-minimum" | "below-target" | "meets-target" | "unset";

export type ListingCriteriaInput = {
  parking?: string | null;
  storageLocker?: string | null;
  gym?: string | null;
  inSuiteWasher?: string | null;
  petPolicy?: string | null;
  furnished?: string | boolean | null;
};

export const IMPORTANCE_LEVELS: ImportanceLevel[] = [
  "must-have",
  "important",
  "nice-to-have",
  "not important",
];

export const CRITERIA_LABELS: Record<CriteriaKey, string> = {
  parking: "Parking",
  storage: "Storage",
  gym: "Gym",
  inSuiteLaundry: "Laundry",
  pets: "Pets",
  furnished: "Furnished",
};

export const DEFAULT_RENTAL_PREFERENCES: RentalCriteriaPreferences = {
  criteria: {
    parking: "important",
    storage: "nice-to-have",
    gym: "nice-to-have",
    inSuiteLaundry: "important",
    pets: "not important",
    furnished: "not important",
  },
  maxRent: null,
  targetSqft: null,
  minimumSqft: null,
};

const IMPORTANCE_POINTS: Record<ImportanceLevel, number> = {
  "must-have": 3,
  important: 2,
  "nice-to-have": 1,
  "not important": 0,
};

function isImportanceLevel(value: unknown): value is ImportanceLevel {
  return (
    typeof value === "string" &&
    IMPORTANCE_LEVELS.includes(value as ImportanceLevel)
  );
}

function cleanNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
}

export function normalizeRentalPreferences(
  value: unknown
): RentalCriteriaPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_RENTAL_PREFERENCES;
  }

  const raw = value as Partial<RentalCriteriaPreferences>;
  const rawCriteria: Partial<Record<CriteriaKey, unknown>> =
    raw.criteria && typeof raw.criteria === "object" ? raw.criteria : {};

  return {
    criteria: {
      parking: isImportanceLevel(rawCriteria.parking)
        ? rawCriteria.parking
        : DEFAULT_RENTAL_PREFERENCES.criteria.parking,
      storage: isImportanceLevel(rawCriteria.storage)
        ? rawCriteria.storage
        : DEFAULT_RENTAL_PREFERENCES.criteria.storage,
      gym: isImportanceLevel(rawCriteria.gym)
        ? rawCriteria.gym
        : DEFAULT_RENTAL_PREFERENCES.criteria.gym,
      inSuiteLaundry: isImportanceLevel(rawCriteria.inSuiteLaundry)
        ? rawCriteria.inSuiteLaundry
        : DEFAULT_RENTAL_PREFERENCES.criteria.inSuiteLaundry,
      pets: isImportanceLevel(rawCriteria.pets)
        ? rawCriteria.pets
        : DEFAULT_RENTAL_PREFERENCES.criteria.pets,
      furnished: isImportanceLevel(rawCriteria.furnished)
        ? rawCriteria.furnished
        : DEFAULT_RENTAL_PREFERENCES.criteria.furnished,
    },
    maxRent: cleanNumber(raw.maxRent),
    targetSqft: cleanNumber(raw.targetSqft),
    minimumSqft: cleanNumber(raw.minimumSqft),
  };
}

export function parseOptionalPositiveNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed);
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

function evaluatePets(petPolicy?: string | null) {
  if (!petPolicy || petPolicy.toLowerCase() === "unknown") {
    return { matched: false, known: false, summary: "Unknown" };
  }

  const normalized = petPolicy.toLowerCase();
  const missing = /\b(no pets|not allowed|pet[s]? not allowed)\b/.test(
    normalized
  );

  return {
    matched: !missing,
    known: true,
    summary: petPolicy,
  };
}

function evaluateCriterion(key: CriteriaKey, listing: ListingCriteriaInput) {
  if (key === "pets") {
    return evaluatePets(listing.petPolicy);
  }

  const value =
    key === "parking"
      ? listing.parking
      : key === "storage"
        ? listing.storageLocker
        : key === "gym"
          ? listing.gym
          : key === "inSuiteLaundry"
            ? listing.inSuiteWasher
            : listing.furnished;

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

export function getCriteriaMatchSummary(
  preferences: RentalCriteriaPreferences,
  listing: ListingCriteriaInput
): MatchSummary {
  const signals = (Object.keys(CRITERIA_LABELS) as CriteriaKey[]).map((key) => {
    const importance = preferences.criteria[key];
    const points = IMPORTANCE_POINTS[importance];
    const result = evaluateCriterion(key, listing);

    return {
      key,
      label: CRITERIA_LABELS[key],
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
  const percentage =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null;

  return {
    signals,
    earnedPoints,
    totalPoints,
    percentage,
    missingMustHaves: signals.filter(
      (signal) => signal.importance === "must-have" && !signal.matched
    ),
  };
}

export function getPricePerSqft(price: number, sqft?: number | null) {
  if (!price || !sqft || sqft <= 0) return null;
  return price / sqft;
}

export function getBudgetStatus(
  price: number,
  preferences: RentalCriteriaPreferences
): BudgetStatus {
  if (!price || !preferences.maxRent) return "unset";
  if (price > preferences.maxRent) return "over";
  if (price >= preferences.maxRent * 0.9) return "near";
  return "under";
}

export function getSqftStatus(
  sqft: number | null | undefined,
  preferences: RentalCriteriaPreferences
): SqftStatus {
  if (!sqft || (!preferences.minimumSqft && !preferences.targetSqft)) {
    return "unset";
  }

  if (preferences.minimumSqft && sqft < preferences.minimumSqft) {
    return "below-minimum";
  }

  if (preferences.targetSqft && sqft < preferences.targetSqft) {
    return "below-target";
  }

  return "meets-target";
}
