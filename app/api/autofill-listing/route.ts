type AmenityValue = "Unknown" | "Yes" | "No";
type ListingStatus =
  | "new"
  | "messaged"
  | "viewing_scheduled"
  | "viewed"
  | "expired";

type AutofillListingRequest = {
  url: string;
};

type AutofillListingData = {
  title: string;
  price: string;
  location: string;
  neighborhood: string;
  type: string;
  furnished: "Unknown" | "Yes" | "No";
  parking: AmenityValue;
  storageLocker: AmenityValue;
  inSuiteWasher: AmenityValue;
  gym: AmenityValue;
  earliestMoveIn: string;
  sqft: string;
  rawDescription: string;
  imageUrl: string;
  status: ListingStatus;
  viewingDate: string;
  contactName: string;
  aiEnhanced: boolean;
  warnings: string[];
};

type ListingContext = {
  postedAt: string;
};

const YES_NO_UNKNOWN = ["Unknown", "Yes", "No"] as const;
const LISTING_TYPES = [
  "",
  "Studio",
  "1 Bed",
  "1 Bed + Den",
  "2 Bed",
  "2 Bed + Den",
  "House",
] as const;

const VANCOUVER_NEIGHBORHOODS = [
  "Kitsilano",
  "Mount Pleasant",
  "Downtown",
  "West End",
  "Yaletown",
  "Fairview",
  "South Granville",
  "Olympic Village",
  "Commercial Drive",
  "Kerrisdale",
  "Point Grey",
  "UBC",
  "Riley Park",
  "Strathcona",
  "Gastown",
  "Coal Harbour",
  "Chinatown",
  "Renfrew-Collingwood",
  "Hastings-Sunrise",
  "Marpole",
  "Dunbar",
  "Shaughnessy",
  "Arbutus Ridge",
  "South Cambie",
  "Killarney",
  "Victoria-Fraserview",
];

function emptyListingData(): AutofillListingData {
  return {
    title: "",
    price: "",
    location: "",
    neighborhood: "",
    type: "",
    furnished: "Unknown",
    parking: "Unknown",
    storageLocker: "Unknown",
    inSuiteWasher: "Unknown",
    gym: "Unknown",
    earliestMoveIn: "",
    sqft: "",
    rawDescription: "",
    imageUrl: "",
    status: "new",
    viewingDate: "",
    contactName: "",
    aiEnhanced: false,
    warnings: [],
  };
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/&([a-z]+);/gi, (_, entity) => namedEntities[entity] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getFirstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return "";
}

function getMetaContent(html: string, names: string[]) {
  for (const name of names) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
        "i"
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedName}["'][^>]*>`,
        "i"
      ),
    ];
    const content = getFirstMatch(html, patterns);

    if (content) {
      return content;
    }
  }

  return "";
}

function extractDescription(html: string) {
  const postingBody = html.match(
    /<section[^>]+id=["']postingbody["'][^>]*>([\s\S]*?)<\/section>/i
  )?.[1];

  if (!postingBody) {
    return "";
  }

  return stripTags(postingBody).replace(/^QR Code Link to This Post\s*/i, "").trim();
}

function extractTitleLocation(html: string) {
  return getFirstMatch(html, [
    /<span[^>]+class=["'][^"']*\bpostingtitletext\b[^"']*["'][^>]*>[\s\S]*?<small[^>]*>\(([\s\S]*?)\)<\/small>/i,
    /<h1[^>]+class=["'][^"']*\bpostingtitle\b[^"']*["'][^>]*>[\s\S]*?<small[^>]*>\(([\s\S]*?)\)<\/small>/i,
  ]);
}

function extractStreetAddress(html: string) {
  return getFirstMatch(html, [
    /<h2[^>]+class=["'][^"']*\bstreet-address\b[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i,
  ]);
}

function extractPrice(value: string) {
  const match = value.match(/\$?\s*([0-9][0-9,]*)/);
  return match ? match[1].replace(/,/g, "") : "";
}

function extractSqft(value: string) {
  const match = value.match(
    /([0-9][0-9,]*)\s*(?:ft(?:\s*2|\s*²)?|sq\s*\.?\s*ft|sqft)\b/i
  );
  return match ? match[1].replace(/,/g, "") : "";
}

function extractDate(value: string) {
  const isoMatch = value.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return isoMatch[1];
  }

  return "";
}

function normalizeDateTimeLocal(value: string) {
  const input = value.trim();

  if (!input) {
    return "";
  }

  const isoMinute = input.match(/\b(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2})\b/);
  if (isoMinute) {
    return isoMinute[1];
  }

  const isoWithSeconds = input.match(
    /\b(20\d{2}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?\b/
  );
  if (isoWithSeconds) {
    return `${isoWithSeconds[1]}T${isoWithSeconds[2]}`;
  }

  return "";
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseAvailableDate(rawValue: string) {
  const value = rawValue.trim().toLowerCase();

  const iso = extractDate(value);
  if (iso) {
    return iso;
  }

  const monthDay = value.match(
    /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:,\s*(\d{4}))?\b/i
  );

  if (!monthDay) {
    return "";
  }

  const [, monthText, dayText, yearText] = monthDay;
  const monthDate = new Date(`${monthText} ${dayText}, ${yearText || ""}`.trim());

  if (Number.isNaN(monthDate.getTime())) {
    return "";
  }

  if (yearText) {
    return formatIsoDate(monthDate);
  }

  const now = new Date();
  monthDate.setFullYear(now.getFullYear());

  // Craigslist usually omits year for upcoming move-ins.
  if (monthDate < now) {
    monthDate.setFullYear(now.getFullYear() + 1);
  }

  return formatIsoDate(monthDate);
}

function extractAttrGroupText(html: string) {
  const mapAndAttrsStart = html.indexOf('<div class="mapAndAttrs">');
  const postingBodyStart = html.indexOf('<section id="postingbody">');

  if (mapAndAttrsStart >= 0 && postingBodyStart > mapAndAttrsStart) {
    const sectionHtml = html.slice(mapAndAttrsStart, postingBodyStart);
    return stripTags(sectionHtml).toLowerCase();
  }

  const groups = html.match(
    /<(?:div|p)[^>]+class=["'][^"']*\battrgroup\b[^"']*["'][^>]*>[\s\S]*?<\/(?:div|p)>/gi
  );

  if (!groups?.length) {
    return "";
  }

  return groups.map((group) => stripTags(group)).join(" | ").toLowerCase();
}

function extractBedrooms(html: string) {
  const housingRaw = getFirstMatch(html, [
    /<span[^>]+class=["'][^"']*\bhousing\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
  ]);

  const housingText = housingRaw.toLowerCase();
  const match = housingText.match(/(\d+)\s*br\b/i);
  return match ? Number(match[1]) : null;
}

function inferListingType(html: string, title: string, attrText: string) {
  const combined = `${title} ${attrText}`.toLowerCase();
  const bedrooms = extractBedrooms(html);
  const hasDen = /\bden\b/i.test(combined);

  if (bedrooms === 0 || combined.includes("studio")) {
    return "Studio";
  }

  if (bedrooms === 1) {
    return hasDen ? "1 Bed + Den" : "1 Bed";
  }

  if (bedrooms === 2) {
    return hasDen ? "2 Bed + Den" : "2 Bed";
  }

  if (
    combined.includes("house") ||
    combined.includes("townhouse") ||
    combined.includes("duplex")
  ) {
    return "House";
  }

  return "";
}

function inferAmenityValues(attrText: string) {
  const text = attrText.toLowerCase();

  const furnished: AmenityValue = text.includes("unfurnished")
    ? "No"
    : text.includes("furnished")
      ? "Yes"
      : "Unknown";

  const parking: AmenityValue =
    text.includes("no parking")
      ? "No"
      : /\b(parking|garage|carport)\b/i.test(text)
        ? "Yes"
        : "Unknown";

  const inSuiteWasher: AmenityValue =
    /\b(w\/d in unit|washer\/dryer in unit|in-unit laundry|laundry in unit)\b/i.test(
      text
    )
      ? "Yes"
      : /\b(laundry in bldg|shared laundry|coin op laundry|no laundry)\b/i.test(
            text
          )
        ? "No"
        : "Unknown";

  const storageLocker: AmenityValue =
    /\b(storage locker|extra storage|storage)\b/i.test(text) ? "Yes" : "Unknown";

  const gym: AmenityValue =
    /\b(gym|fitness center|fitness room)\b/i.test(text) ? "Yes" : "Unknown";

  return { furnished, parking, inSuiteWasher, storageLocker, gym };
}

function extractAvailableFromHtml(html: string, attrText: string) {
  const availableFromTag = getFirstMatch(html, [
    /<span[^>]+class=["'][^"']*\battr\b[^"']*\bimportant\b[^"']*["'][^>]*>\s*<span[^>]*>\s*available\s+([^<]+?)\s*<\/span>\s*<\/span>/i,
    /<span[^>]*>\s*available\s+([^<]+?)\s*<\/span>/i,
  ]);

  const parsedTagDate = parseAvailableDate(availableFromTag);
  if (parsedTagDate) {
    return parsedTagDate;
  }

  const availableFromText = attrText.match(
    /\bavailable\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{1,2}(?:,\s*\d{4})?/i
  )?.[0];

  return availableFromText ? parseAvailableDate(availableFromText) : "";
}

function normalizeListingStatus(value: unknown): ListingStatus | "" {
  const statuses: ListingStatus[] = [
    "new",
    "messaged",
    "viewing_scheduled",
    "viewed",
    "expired",
  ];

  return statuses.includes(value as ListingStatus) ? (value as ListingStatus) : "";
}

function parseMonthName(monthText: string) {
  const months: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  return months[monthText.toLowerCase()];
}

function normalize12HourTime(hourText: string, minuteText: string, ampm: string) {
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "";
  }

  const ampmNormalized = ampm.toLowerCase();
  if (ampmNormalized === "pm" && hour < 12) {
    hour += 12;
  }

  if (ampmNormalized === "am" && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

function inferFromDescription(rawDescription: string, postedAt: string) {
  const text = rawDescription.toLowerCase();
  const postedYear = Number(postedAt.slice(0, 4)) || new Date().getFullYear();

  const gym: AmenityValue =
    /\b(exercise room|fitness room|fitness center|gym)\b/i.test(text)
      ? "Yes"
      : "Unknown";

  const parking: AmenityValue =
    /\b(parking included|secured parking|underground parking|garage)\b/i.test(text)
      ? "Yes"
      : "Unknown";

  const inSuiteWasher: AmenityValue =
    /\b(washer\/dryer|washer and dryer|w\/d in unit|in-unit laundry)\b/i.test(text)
      ? "Yes"
      : "Unknown";

  const contactNameMatch = rawDescription.match(
    /\bmy name is\s+([A-Za-z][A-Za-z'-]{1,30})\b/i
  );

  const showingMatch = rawDescription.match(
    /\b(showing|viewing)[^.]*?\b(?:on\s+)?(?:[A-Za-z]+,\s+)?(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:st|nd|rd|th)?[^.\n]*?\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
  );

  let viewingDate = "";
  let status: ListingStatus = "new";

  if (showingMatch) {
    const month = parseMonthName(showingMatch[2]);
    const day = Number(showingMatch[3]);
    const time = normalize12HourTime(
      showingMatch[4],
      showingMatch[5] || "00",
      showingMatch[6]
    );

    if (month !== undefined && day >= 1 && day <= 31 && time) {
      const date = new Date(postedYear, month, day);
      const yyyy = date.getFullYear();
      const mm = `${date.getMonth() + 1}`.padStart(2, "0");
      const dd = `${date.getDate()}`.padStart(2, "0");
      viewingDate = `${yyyy}-${mm}-${dd}T${time}`;
      status = "viewing_scheduled";
    }
  }

  return {
    gym,
    parking,
    inSuiteWasher,
    contactName: contactNameMatch?.[1] || "",
    viewingDate,
    status,
  };
}

function normalizeAmenity(value: unknown): AmenityValue {
  return YES_NO_UNKNOWN.includes(value as AmenityValue)
    ? (value as AmenityValue)
    : "Unknown";
}

function normalizeListingType(value: unknown) {
  return LISTING_TYPES.includes(value as (typeof LISTING_TYPES)[number])
    ? (value as string)
    : "";
}

function guessNeighborhood(text: string) {
  const normalized = text.toLowerCase();

  return (
    VANCOUVER_NEIGHBORHOODS.find((name) =>
      normalized.includes(name.toLowerCase())
    ) || ""
  );
}

type OpenAiResponseBody = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      text?: unknown;
    }>;
  }>;
};

function getResponseText(responseBody: OpenAiResponseBody) {
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text;
  }

  for (const output of responseBody.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function extractPostedAt(html: string) {
  return (
    getFirstMatch(html, [
      /<p[^>]+id=["']display-date["'][^>]*>[\s\S]*?<time[^>]+datetime=["']([^"']+)["']/i,
      /<p[^>]+class=["'][^"']*\bpostinginfo\b[^"']*["'][^>]*>[\s\S]*?<time[^>]+datetime=["']([^"']+)["']/i,
    ]) || ""
  );
}

async function enrichWithAi(
  scrapedData: AutofillListingData,
  context: ListingContext
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !scrapedData.rawDescription) {
    return {
      ...scrapedData,
      warnings: [
        ...scrapedData.warnings,
        apiKey
          ? "No description was found for AI extraction."
          : "AI extraction skipped because OPENAI_API_KEY is not configured.",
      ],
    };
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      neighborhood: { type: "string" },
      type: { enum: LISTING_TYPES },
      furnished: { enum: YES_NO_UNKNOWN },
      parking: { enum: YES_NO_UNKNOWN },
      storageLocker: { enum: YES_NO_UNKNOWN },
      inSuiteWasher: { enum: YES_NO_UNKNOWN },
      gym: { enum: YES_NO_UNKNOWN },
      earliestMoveIn: {
        type: "string",
        description: "ISO date in YYYY-MM-DD format, or an empty string.",
      },
      sqft: { type: "string" },
      status: { enum: ["", "new", "messaged", "viewing_scheduled", "viewed", "expired"] },
      viewingDate: {
        type: "string",
        description:
          "Viewing datetime in YYYY-MM-DDTHH:mm format, or empty string if not stated.",
      },
      contactName: { type: "string" },
    },
    required: [
      "neighborhood",
      "type",
      "furnished",
      "parking",
      "storageLocker",
      "inSuiteWasher",
      "gym",
      "earliestMoveIn",
      "sqft",
      "status",
      "viewingDate",
      "contactName",
    ],
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Extract rental listing facts from the provided description. Prefer explicit statements only. Return Unknown when the description does not clearly say Yes or No. Do not infer amenities from neighborhood or vibes. earliestMoveIn must be YYYY-MM-DD or empty. viewingDate must be YYYY-MM-DDTHH:mm or empty. If viewing date text omits year, infer year from posted date context. If the text says a showing/viewing time is scheduled, set status to viewing_scheduled.",
          },
          {
            role: "user",
            content: [
              `Title: ${scrapedData.title || "Unknown"}`,
              `Location: ${scrapedData.location || "Unknown"}`,
              `Posted date context: ${context.postedAt || "Unknown"}`,
              `Description: ${scrapedData.rawDescription}`,
            ].join("\n\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "rental_listing_extraction",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ...scrapedData,
        warnings: [
          ...scrapedData.warnings,
          `AI extraction failed: ${response.status} ${errorText.slice(0, 120)}`,
        ],
      };
    }

    const responseBody = await response.json();
    const text = getResponseText(responseBody);
    const aiData = JSON.parse(text) as Partial<AutofillListingData>;
    const aiFurnished = normalizeAmenity(aiData.furnished);
    const aiParking = normalizeAmenity(aiData.parking);
    const aiStorageLocker = normalizeAmenity(aiData.storageLocker);
    const aiInSuiteWasher = normalizeAmenity(aiData.inSuiteWasher);
    const aiGym = normalizeAmenity(aiData.gym);
    const aiStatus = normalizeListingStatus(aiData.status);
    const aiViewingDate = normalizeDateTimeLocal(aiData.viewingDate || "");
    const aiContactName = (aiData.contactName || "").trim();

    return {
      ...scrapedData,
      neighborhood:
        aiData.neighborhood?.trim() ||
        scrapedData.neighborhood ||
        guessNeighborhood(`${scrapedData.title} ${scrapedData.location}`),
      type: scrapedData.type || normalizeListingType(aiData.type),
      furnished:
        scrapedData.furnished !== "Unknown"
          ? scrapedData.furnished
          : aiFurnished,
      parking:
        scrapedData.parking !== "Unknown" ? scrapedData.parking : aiParking,
      storageLocker:
        scrapedData.storageLocker !== "Unknown"
          ? scrapedData.storageLocker
          : aiStorageLocker,
      inSuiteWasher:
        scrapedData.inSuiteWasher !== "Unknown"
          ? scrapedData.inSuiteWasher
          : aiInSuiteWasher,
      gym: scrapedData.gym !== "Unknown" ? scrapedData.gym : aiGym,
      earliestMoveIn:
        extractDate(aiData.earliestMoveIn || "") || scrapedData.earliestMoveIn,
      sqft: extractSqft(aiData.sqft || "") || scrapedData.sqft,
      status: aiStatus || scrapedData.status,
      viewingDate: aiViewingDate || scrapedData.viewingDate,
      contactName: aiContactName || scrapedData.contactName,
      aiEnhanced: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return {
      ...scrapedData,
      warnings: [...scrapedData.warnings, `AI extraction failed: ${message}`],
    };
  }
}

function scrapeListing(html: string): AutofillListingData {
  const data = emptyListingData();
  const metaDescription = getMetaContent(html, ["description", "og:description"]);
  const combinedText = stripTags(html);
  const attrText = extractAttrGroupText(html);

  data.title =
    getFirstMatch(html, [
      /<span[^>]+id=["']titletextonly["'][^>]*>([\s\S]*?)<\/span>/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i,
    ]) || getMetaContent(html, ["og:title", "twitter:title"]);

  data.title = data.title.replace(/\s*-\s*.*craigslist.*$/i, "").trim();

  data.price = extractPrice(
    getFirstMatch(html, [
      /<span[^>]+class=["'][^"']*\bprice\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    ]) || metaDescription
  );

  data.location =
    extractStreetAddress(html) ||
    extractTitleLocation(html) ||
    getFirstMatch(html, [
      /<small[^>]*>\(([\s\S]*?)\)<\/small>/i,
      /<div[^>]+class=["'][^"']*\bmapaddress\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ]) ||
    getMetaContent(html, ["geo.placename", "og:locality"]);

  data.rawDescription = extractDescription(html) || metaDescription;

  data.imageUrl = getMetaContent(html, [
    "og:image",
    "twitter:image",
    "twitter:image:src",
  ]);

  data.sqft = extractSqft(attrText) || extractSqft(combinedText);
  data.earliestMoveIn = extractAvailableFromHtml(html, attrText);
  data.type = inferListingType(html, data.title, attrText);
  const inferredAmenities = inferAmenityValues(attrText);
  data.furnished = inferredAmenities.furnished;
  data.parking = inferredAmenities.parking;
  data.storageLocker = inferredAmenities.storageLocker;
  data.inSuiteWasher = inferredAmenities.inSuiteWasher;
  data.gym = inferredAmenities.gym;
  data.neighborhood = guessNeighborhood(
    `${data.title} ${data.location} ${data.rawDescription}`
  );
  const descriptionSignals = inferFromDescription(data.rawDescription, extractPostedAt(html));
  data.gym = data.gym !== "Unknown" ? data.gym : descriptionSignals.gym;
  data.parking =
    data.parking !== "Unknown" ? data.parking : descriptionSignals.parking;
  data.inSuiteWasher =
    data.inSuiteWasher !== "Unknown"
      ? data.inSuiteWasher
      : descriptionSignals.inSuiteWasher;
  data.contactName = descriptionSignals.contactName;
  data.viewingDate = descriptionSignals.viewingDate;
  data.status = descriptionSignals.status;

  if (!data.title) {
    data.warnings.push("Could not find a title on the listing page.");
  }

  if (!data.rawDescription) {
    data.warnings.push("Could not find a description on the listing page.");
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AutofillListingRequest;
    const rawUrl = body.url?.trim();

    if (!rawUrl) {
      return Response.json({ error: "Missing listing URL" }, { status: 400 });
    }

    let url: URL;

    try {
      url = new URL(rawUrl);
    } catch {
      return Response.json({ error: "Invalid listing URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      return Response.json(
        { error: "Listing URL must start with http or https" },
        { status: 400 }
      );
    }

    const listingResponse = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VancouverRentalTracker/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!listingResponse.ok) {
      return Response.json(
        { error: `Could not fetch listing: HTTP ${listingResponse.status}` },
        { status: 502 }
      );
    }

    const html = await listingResponse.text();
    const scrapedData = scrapeListing(html);
    const postedAt = extractPostedAt(html);
    const enrichedData = await enrichWithAi(scrapedData, { postedAt });

    return Response.json(enrichedData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json({ error: message }, { status: 500 });
  }
}
