"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "./CurrentUserProvider";
import { formatStatusLabel } from "./StatusBadge";
import { useNeighborhoodOptions } from "./useNeighborhoodOptions";
import { useWorkspace } from "./WorkspaceProvider";
import {
  getMemberDisplayName,
  type ListingImage,
  type WorkspaceMember,
} from "@/lib/collaboration";
import {
  isImportanceLevel,
  type MemberCriterionPreference,
  type WorkspaceCriterion,
} from "@/lib/customCriteria";

type ListingStatus =
  | "to_process"
  | "new"
  | "messaged"
  | "viewing_scheduled"
  | "viewed"
  | "expired";

type AmenityValue = "Unknown" | "Yes" | "No";

type AutofillListingResponse = Partial<{
  title: string;
  price: string;
  location: string;
  neighborhood: string;
  type: string;
  furnished: string;
  parking: AmenityValue;
  storageLocker: AmenityValue;
  inSuiteWasher: AmenityValue;
  gym: AmenityValue;
  petPolicy: AmenityValue;
  earliestMoveIn: string;
  sqft: string;
  rawDescription: string;
  imageUrl: string;
  imageUrls: string[];
  status: ListingStatus;
  viewingDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactMedium: string;
  contactDetails: string;
  aiEnhanced: boolean;
  warnings: string[];
}>;

type AutofillListingRequest = {
  url: string;
  descriptionOverride?: string;
};

type ListingFormData = {
  url: string;
  addedBy: string;
  title: string;
  price: string;
  location: string;
  neighborhood: string;
  type: string;
  furnished: string;
  parking: AmenityValue;
  storageLocker: AmenityValue;
  inSuiteWasher: AmenityValue;
  gym: AmenityValue;
  petPolicy: AmenityValue;
  earliestMoveIn: string;
  sqft: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactMedium: string;
  contactDetails: string;
  status: ListingStatus;
  messagedBy: string;
  viewingDate: string;
  pros: string;
  cons: string;
  comments: string;
  rawDescription: string;
  imageUrl: string;
};

type FormImage =
  | { kind: "url"; url: string }
  | { kind: "file"; file: File; preview: string };

type ExistingListing = {
  id: string;
  url: string | null;
  added_by: string | null;
  title: string | null;
  price: number | null;
  location: string | null;
  neighborhood: string | null;
  listing_type: string | null;
  furnished: string | null;
  parking: AmenityValue | null;
  storage_locker: AmenityValue | null;
  in_suite_washer: AmenityValue | null;
  gym: AmenityValue | null;
  pet_policy?: string | null;
  earliest_move_in: string | null;
  sqft: number | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_medium?: string | null;
  contact_details?: string | null;
  status: ListingStatus | null;
  messaged_by: string | null;
  viewing_date: string | null;
  pros: string | null;
  cons: string | null;
  comments: string | null;
  raw_description: string | null;
  cover_image_url?: string | null;
  rental_search_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  formatted_address?: string | null;
  geocoded_at?: string | null;
  images?: ListingImage[];
  criteria_values?: ListingCriteriaValue[];
};

type ListingCriteriaValue = {
  criterion_id: string;
  value: AmenityValue;
  notes?: string | null;
};

type Props = {
  existingListing?: ExistingListing;
};

const fieldClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 sm:text-sm";

const sectionClassName =
  "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6";

type BuiltinCriterionFieldName =
  | "parking"
  | "storageLocker"
  | "gym"
  | "inSuiteWasher"
  | "petPolicy";

const BUILTIN_CRITERION_FIELDS: Record<
  string,
  { label: string; name: BuiltinCriterionFieldName }
> = {
  parking: { label: "Parking", name: "parking" },
  storage: { label: "Storage", name: "storageLocker" },
  gym: { label: "Gym", name: "gym" },
  inSuiteLaundry: { label: "In-suite laundry", name: "inSuiteWasher" },
  pets: { label: "Pets / pet policy", name: "petPolicy" },
};

function normalizeAmenityValue(value?: string | null): AmenityValue {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === "unknown") return "Unknown";
  if (
    normalized === "yes" ||
    /\b(pets allowed|pet friendly|cats allowed|dogs allowed)\b/.test(normalized)
  ) {
    return "Yes";
  }
  if (
    normalized === "no" ||
    /\b(no pets|pets not allowed|pet not allowed|not allowed)\b/.test(normalized)
  ) {
    return "No";
  }

  return "Unknown";
}

function FormSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${sectionClassName} ${className}`}>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function getInitialFormData(
  currentUser: string,
  existingListing?: ExistingListing
): ListingFormData {
  if (!existingListing) {
    return {
      url: "",
      addedBy: currentUser,
      title: "",
      price: "",
      location: "",
      neighborhood: "Kitsilano",
      type: "Studio",
      furnished: "Unknown",
      parking: "Unknown",
      storageLocker: "Unknown",
      inSuiteWasher: "Unknown",
      gym: "Unknown",
      petPolicy: "Unknown",
      earliestMoveIn: "",
      sqft: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactMedium: "Unknown",
      contactDetails: "",
      status: "new",
      messagedBy: "None",
      viewingDate: "",
      pros: "",
      cons: "",
      comments: "",
      rawDescription: "",
      imageUrl: "",
    };
  }

  return {
    url: existingListing.url || "",
    addedBy: existingListing.added_by || currentUser,
    title: existingListing.title || "",
    price: existingListing.price?.toString() || "",
    location: existingListing.location || "",
    neighborhood: existingListing.neighborhood || "Kitsilano",
    type: existingListing.listing_type || "Studio",
    furnished: existingListing.furnished || "No",
    parking: existingListing.parking || "Unknown",
    storageLocker: existingListing.storage_locker || "Unknown",
    inSuiteWasher: existingListing.in_suite_washer || "Unknown",
    gym: existingListing.gym || "Unknown",
    petPolicy: normalizeAmenityValue(existingListing.pet_policy),
    earliestMoveIn: existingListing.earliest_move_in || "",
    sqft: existingListing.sqft?.toString() || "",
    contactName: existingListing.contact_name || "",
    contactEmail: existingListing.contact_email || "",
    contactPhone: existingListing.contact_phone || "",
    contactMedium: existingListing.contact_medium || "Unknown",
    contactDetails: existingListing.contact_details || "",
    status: existingListing.status || "new",
    messagedBy: existingListing.messaged_by || "None",
    viewingDate: existingListing.viewing_date
      ? existingListing.viewing_date.slice(0, 16)
      : "",
    pros: existingListing.pros || "",
    cons: existingListing.cons || "",
    comments: existingListing.comments || "",
    rawDescription: existingListing.raw_description || "",
    imageUrl: existingListing.cover_image_url || "",
  };
}

function getInitialImages(existingListing?: ExistingListing): FormImage[] {
  if (!existingListing) return [];
  const urls =
    existingListing.images?.map((image) => image.url).filter(Boolean) ??
    (existingListing.cover_image_url ? [existingListing.cover_image_url] : []);
  return urls.map((url) => ({ kind: "url" as const, url }));
}

function getInitialCustomCriteriaValues(existingListing?: ExistingListing) {
  return Object.fromEntries(
    (existingListing?.criteria_values ?? []).map((value) => [
      value.criterion_id,
      value.value,
    ])
  ) as Record<string, AmenityValue>;
}

function getUniqueMemberOptions(
  members: WorkspaceMember[],
  currentUserName: string,
  existingValues: Array<string | null | undefined>
) {
  const seen = new Set<string>();
  const options: string[] = [];

  function add(value?: string | null) {
    const cleaned = value?.trim();
    if (!cleaned || seen.has(cleaned)) return;
    seen.add(cleaned);
    options.push(cleaned);
  }

  add(currentUserName);
  members.forEach((member) => add(getMemberDisplayName(member)));
  existingValues.forEach(add);

  return options;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[-_]/g, " ");
}

function criterionMatchesText(criterion: WorkspaceCriterion, text: string) {
  const normalizedText = normalizeSearchText(text);
  const keywords = [
    criterion.label,
    criterion.key,
    ...(criterion.keywords ?? []),
  ]
    .map(normalizeSearchText)
    .filter(Boolean);

  return keywords.some((keyword) =>
    new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(
      normalizedText
    )
  );
}

export default function ListingForm({ existingListing }: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { currentRentalSearchId, currentWorkspace, isLoadingWorkspaces } =
    useWorkspace();
  const { neighborhoods, addNeighborhood } = useNeighborhoodOptions();
  const currentUserName = currentUser?.displayName ?? "Unknown";

  const [formData, setFormData] = useState<ListingFormData>(
    getInitialFormData(currentUserName, existingListing)
  );
  const [images, setImages] = useState<FormImage[]>(
    getInitialImages(existingListing)
  );
  const [workspaceCriteria, setWorkspaceCriteria] = useState<WorkspaceCriterion[]>(
    []
  );
  const [criterionPreferences, setCriterionPreferences] = useState<
    MemberCriterionPreference[]
  >([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(
    []
  );
  const [customCriteriaValues, setCustomCriteriaValues] = useState<
    Record<string, AmenityValue>
  >(getInitialCustomCriteriaValues(existingListing));
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillCooldownUntil, setAutofillCooldownUntil] = useState(0);
  const [message, setMessage] = useState("");
  const criteriaWorkspaceId =
    existingListing?.rental_search_id ?? currentRentalSearchId ?? null;
  const activeCriteria = useMemo(
    () => workspaceCriteria.filter((criterion) => !criterion.archivedAt),
    [workspaceCriteria]
  );
  const selectedCriteria = useMemo(
    () =>
      activeCriteria.filter((criterion) => {
        const preference = criterionPreferences.find(
          (item) =>
            item.criterionId === criterion.id &&
            item.userId === currentUser?.id
        );

        return Boolean(preference && preference.importance !== "not important");
      }),
    [activeCriteria, criterionPreferences, currentUser?.id]
  );
  const builtinCriteriaFields = useMemo(() => {
    const fields = new Map<
      BuiltinCriterionFieldName,
      { label: string; name: BuiltinCriterionFieldName }
    >();

    for (const criterion of selectedCriteria) {
      if (!criterion.builtinKey) continue;
      const field = BUILTIN_CRITERION_FIELDS[criterion.builtinKey];
      if (field) fields.set(field.name, field);
    }

    return [...fields.values()];
  }, [selectedCriteria]);
  const customCriteria = useMemo(
    () => selectedCriteria.filter((criterion) => !criterion.builtinKey),
    [selectedCriteria]
  );

  useEffect(() => {
    if (!existingListing) {
      setFormData((current) => ({
        ...current,
        addedBy: currentUserName,
      }));
    }
  }, [currentUserName, existingListing]);

  useEffect(() => {
    if (!criteriaWorkspaceId) {
      setWorkspaceCriteria([]);
      setCriterionPreferences([]);
      return;
    }

    let isMounted = true;

    async function loadWorkspaceCriteria() {
      const { data, error } = await supabase
        .from("rental_search_criteria")
        .select("id, rental_search_id, key, label, builtin_key, keywords, archived_at")
        .eq("rental_search_id", criteriaWorkspaceId)
        .order("created_at", { ascending: true });
      const { data: preferenceData, error: preferenceError } = currentUser?.id
        ? await supabase
            .from("search_member_criteria_preferences")
            .select("rental_search_id, user_id, criterion_id, importance")
            .eq("rental_search_id", criteriaWorkspaceId)
            .eq("user_id", currentUser.id)
        : { data: [], error: null };

      if (!isMounted) return;

      if (error || preferenceError) {
        console.error("Error loading workspace criteria:", error || preferenceError);
        setWorkspaceCriteria([]);
        setCriterionPreferences([]);
        return;
      }

      setWorkspaceCriteria(
        (data ?? []).map((criterion) => ({
          id: criterion.id,
          rentalSearchId: criterion.rental_search_id,
          key: criterion.key,
          label: criterion.label,
          builtinKey: criterion.builtin_key,
          keywords: criterion.keywords ?? [],
          archivedAt: criterion.archived_at,
        }))
      );
      setCriterionPreferences(
        (preferenceData ?? []).map((preference) => ({
          rentalSearchId: preference.rental_search_id,
          userId: preference.user_id,
          criterionId: preference.criterion_id,
          importance: isImportanceLevel(preference.importance)
            ? preference.importance
            : "not important",
        }))
      );
    }

    void loadWorkspaceCriteria();

    return () => {
      isMounted = false;
    };
  }, [criteriaWorkspaceId, currentUser?.id]);

  useEffect(() => {
    if (!criteriaWorkspaceId) {
      setWorkspaceMembers([]);
      return;
    }

    let isMounted = true;

    async function loadWorkspaceMembers() {
      const { data: memberData, error } = await supabase
        .from("search_members")
        .select("rental_search_id, user_id, role")
        .eq("rental_search_id", criteriaWorkspaceId)
        .order("created_at", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading workspace members:", error);
        setWorkspaceMembers([]);
        return;
      }

      const userIds = (memberData ?? []).map((member) => member.user_id);
      const { data: profileData } = userIds.length
        ? await supabase
            .from("profiles")
            .select("id, nickname, full_name, contact_email, phone_number")
            .in("id", userIds)
        : { data: [] };

      if (!isMounted) return;

      const profilesById = new Map(
        (profileData ?? []).map((profile) => [profile.id, profile])
      );

      setWorkspaceMembers(
        (memberData ?? []).map((member) => {
          const profile = profilesById.get(member.user_id);
          return {
            rentalSearchId: member.rental_search_id,
            userId: member.user_id,
            role: member.role as "owner" | "member",
            nickname: profile?.nickname ?? null,
            fullName: profile?.full_name ?? null,
            email: profile?.contact_email ?? null,
            phoneNumber: profile?.phone_number ?? null,
          };
        })
      );
    }

    void loadWorkspaceMembers();

    return () => {
      isMounted = false;
    };
  }, [criteriaWorkspaceId]);

  useEffect(() => {
    setCustomCriteriaValues((current) => {
      const next = { ...current };
      for (const criterion of customCriteria) {
        if (!next[criterion.id]) {
          next[criterion.id] =
            existingListing?.criteria_values?.find(
              (value) => value.criterion_id === criterion.id
            )?.value ?? "Unknown";
        }
      }
      return next;
    });
  }, [customCriteria, existingListing?.criteria_values]);

  const previewUrl = useMemo(() => {
    const firstImage = images[0];
    if (!firstImage) return "";
    return firstImage.kind === "url" ? firstImage.url : firstImage.preview;
  }, [images]);
  const memberNameOptions = useMemo(
    () =>
      getUniqueMemberOptions(workspaceMembers, currentUserName, [
        existingListing?.added_by,
        existingListing?.messaged_by,
      ]),
    [
      currentUserName,
      existingListing?.added_by,
      existingListing?.messaged_by,
      workspaceMembers,
    ]
  );

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "viewingDate" &&
      value &&
      (current.status === "to_process" ||
        current.status === "new" ||
        current.status === "messaged")
        ? { status: "viewing_scheduled" as ListingStatus }
        : {}),
    }));
  }

  function handleCustomCriteriaChange(criterionId: string, value: AmenityValue) {
    setCustomCriteriaValues((current) => ({
      ...current,
      [criterionId]: value,
    }));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setImages((current) => [
      ...current,
      ...files.map((file) => ({
        kind: "file" as const,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    event.target.value = "";
  }

  function addImageUrl() {
    const url = imageUrlInput.trim();
    if (!url) return;
    setImages((current) => [...current, { kind: "url", url }]);
    setImageUrlInput("");
  }

  function removeImage(index: number) {
    setImages((current) => {
      const image = current[index];
      if (image?.kind === "file") URL.revokeObjectURL(image.preview);
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
  }

  function mergeAutofillData(data: AutofillListingResponse) {
    setFormData((current) => {
      const viewingDate = data.viewingDate?.trim() || current.viewingDate;
      const status =
        data.status === "viewing_scheduled" && !viewingDate
          ? "new"
          : data.status || (current.status === "to_process" ? "new" : current.status);

      return {
        ...current,
        title: data.title?.trim() || current.title,
        price: data.price?.trim() || current.price,
        location: data.location?.trim() || current.location,
        neighborhood: data.neighborhood?.trim() || current.neighborhood,
        type: data.type?.trim() || current.type,
        furnished: data.furnished?.trim() || current.furnished,
        parking: data.parking || current.parking,
        storageLocker: data.storageLocker || current.storageLocker,
        inSuiteWasher: data.inSuiteWasher || current.inSuiteWasher,
        gym: data.gym || current.gym,
        earliestMoveIn: data.earliestMoveIn?.trim() || current.earliestMoveIn,
        sqft: data.sqft?.trim() || current.sqft,
        rawDescription: data.rawDescription?.trim() || current.rawDescription,
        imageUrl: data.imageUrl?.trim() || current.imageUrl,
        status,
        viewingDate,
        contactName: data.contactName?.trim() || current.contactName,
        contactEmail: data.contactEmail?.trim() || current.contactEmail,
        contactPhone: data.contactPhone?.trim() || current.contactPhone,
        contactMedium: data.contactMedium?.trim() || current.contactMedium,
        contactDetails: data.contactDetails?.trim() || current.contactDetails,
        petPolicy: normalizeAmenityValue(data.petPolicy) || current.petPolicy,
      };
    });

    const autofillText = [
      data.title,
      data.location,
      data.neighborhood,
      data.rawDescription,
    ]
      .filter(Boolean)
      .join(" ");

    if (autofillText) {
      setCustomCriteriaValues((current) => {
        const next = { ...current };
        for (const criterion of customCriteria) {
          if (
            (next[criterion.id] ?? "Unknown") === "Unknown" &&
            criterionMatchesText(criterion, autofillText)
          ) {
            next[criterion.id] = "Yes";
          }
        }
        return next;
      });
    }

    const autofillImages = data.imageUrls?.length
      ? data.imageUrls
      : data.imageUrl?.trim()
        ? [data.imageUrl.trim()]
        : [];

    if (autofillImages.length > 0) {
      setImages((current) => {
        const existingUrls = new Set(
          current
            .filter((image): image is { kind: "url"; url: string } => image.kind === "url")
            .map((image) => image.url)
        );
        const nextImages = autofillImages
          .filter((imageUrl) => imageUrl && !existingUrls.has(imageUrl))
          .map((imageUrl) => ({ kind: "url" as const, url: imageUrl }));
        return nextImages.length > 0 ? [...nextImages, ...current] : current;
      });
    }
  }

  async function handleAutofill() {
    const url = formData.url.trim();

    if (!url) {
      setMessage("Paste a listing URL first.");
      return;
    }

    if (Date.now() < autofillCooldownUntil) {
      setMessage("Please wait a moment before autofilling again.");
      return;
    }

    setIsAutofilling(true);
    setMessage("");

    try {
      const response = await fetch("/api/autofill-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          descriptionOverride: formData.rawDescription.trim() || undefined,
        } satisfies AutofillListingRequest),
      });

      const data = (await response.json()) as
        | AutofillListingResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Autofill failed");
      }

      mergeAutofillData(data as AutofillListingResponse);
      if (existingListing) {
        const autofillData = data as AutofillListingResponse;
        const location = autofillData.location?.trim();
        const neighborhood = autofillData.neighborhood?.trim();

        if (location) {
          await supabase
            .from("listings")
            .update({
              location,
              ...(neighborhood ? { neighborhood } : {}),
            })
            .eq("id", existingListing.id);

          const geocodeResponse = await fetch("/api/geocode-listing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId: existingListing.id,
              address: location,
            }),
          });
          const geocodeData = (await geocodeResponse.json().catch(() => null)) as
            | { neighborhood?: string | null }
            | null;

          if (geocodeData?.neighborhood) {
            setFormData((current) => ({
              ...current,
              neighborhood: geocodeData.neighborhood || current.neighborhood,
            }));
          }
        }
      }
      setAutofillCooldownUntil(Date.now() + 10_000);

      const warnings =
        "warnings" in data && Array.isArray(data.warnings)
          ? data.warnings
          : [];

      setMessage(
        warnings.length
          ? `Autofilled with notes: ${warnings.join(" ")}`
          : "Autofilled listing details. Review before saving."
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error autofilling listing:", error);
      setMessage(`Could not autofill listing: ${errorMessage}`);
    } finally {
      setIsAutofilling(false);
    }
  }

  async function uploadImages(): Promise<string[]> {
    const result: string[] = [];

    for (const image of images) {
      if (image.kind === "url") {
        result.push(image.url);
        continue;
      }

      const fileExt = image.file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error } = await supabase.storage
        .from("listing-images")
        .upload(filePath, image.file);

      if (error) {
        throw error;
      }

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      result.push(data.publicUrl);
    }

    return result;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      if (!existingListing && !currentRentalSearchId) {
        setMessage("Choose a workspace before saving a new listing.");
        setIsSaving(false);
        return;
      }

      const cleanedNeighborhood = formData.neighborhood.trim();

      if (cleanedNeighborhood) {
        await addNeighborhood(cleanedNeighborhood);
      }

      const imageUrls = await uploadImages();
      const coverImageUrl = imageUrls[0] ?? null;

      const payload = {
        url: formData.url,
        added_by: formData.addedBy,
        title: formData.title,
        price: formData.price ? Number(formData.price) : null,
        location: formData.location || null,
        neighborhood: cleanedNeighborhood || null,
        listing_type: formData.type || null,
        furnished: formData.furnished || null,
        parking: formData.parking || null,
        storage_locker: formData.storageLocker || null,
        in_suite_washer: formData.inSuiteWasher || null,
        gym: formData.gym || null,
        pet_policy: formData.petPolicy || null,
        earliest_move_in: formData.earliestMoveIn || null,
        sqft: formData.sqft ? Number(formData.sqft) : null,
        contact_name: formData.contactName || null,
        contact_email: formData.contactEmail || null,
        contact_phone: formData.contactPhone || null,
        contact_medium:
          formData.contactMedium === "Unknown" ? null : formData.contactMedium,
        contact_details: formData.contactDetails || null,
        status: formData.status,
        messaged_by:
          formData.messagedBy === "None" ? null : formData.messagedBy,
        viewing_date: formData.viewingDate || null,
        pros: formData.pros || null,
        cons: formData.cons || null,
        comments: formData.comments || null,
        raw_description: formData.rawDescription || null,
        cover_image_url: coverImageUrl,
        rental_search_id: existingListing
          ? existingListing.rental_search_id ?? null
          : currentRentalSearchId,
      };

      let savedListingId = existingListing?.id ?? null;

      if (existingListing) {
        const { error } = await supabase
          .from("listings")
          .update(payload)
          .eq("id", existingListing.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("listings")
          .insert([payload])
          .select("id")
          .single();

        if (error) throw error;
        savedListingId = data.id;
      }

      if (savedListingId) {
        await supabase
          .from("listing_images")
          .delete()
          .eq("listing_id", savedListingId);

        if (imageUrls.length > 0) {
          const { error: imageError } = await supabase
            .from("listing_images")
            .insert(
              imageUrls.map((imageUrl, index) => ({
                listing_id: savedListingId,
                image_url: imageUrl,
                position: index,
                source: "manual",
              }))
            );

          if (imageError) throw imageError;
        }

        if (customCriteria.length > 0) {
          const { error: deleteCriteriaError } = await supabase
            .from("listing_criteria_values")
            .delete()
            .eq("listing_id", savedListingId);

          if (deleteCriteriaError) throw deleteCriteriaError;

          const { error: criteriaError } = await supabase
            .from("listing_criteria_values")
            .insert(
              customCriteria.map((criterion) => ({
                listing_id: savedListingId,
                criterion_id: criterion.id,
                value: customCriteriaValues[criterion.id] ?? "Unknown",
              }))
            );

          if (criteriaError) throw criteriaError;
        }

        if (formData.location.trim()) {
          await fetch("/api/geocode-listing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId: savedListingId,
              address: formData.location.trim(),
            }),
          });
        }
      }

      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error saving listing:", error);
      setMessage(`Could not save listing: ${errorMessage}`);
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!existingListing && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Workspace:{" "}
          <span className="font-medium text-slate-900">
            {isLoadingWorkspaces
              ? "Loading..."
              : currentWorkspace?.name ?? "No workspace selected"}
          </span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
        <FormSection
          title="Listing Details"
          description="Core listing facts and the original source link."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Listing URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="Paste the listing URL"
                  className={fieldClassName}
                  required
                />
                <button
                  type="button"
                  onClick={handleAutofill}
                  disabled={isAutofilling || !formData.url.trim() || Date.now() < autofillCooldownUntil}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-40"
                >
                  {isAutofilling ? "Autofilling..." : "Autofill"}
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Listing title"
                className={fieldClassName}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Price
              </label>
              <input
                name="price"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.price}
                onChange={handleChange}
                placeholder="3250"
                className={fieldClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Added by
              </label>
              <select
                name="addedBy"
                value={formData.addedBy}
                onChange={handleChange}
                className={fieldClassName}
              >
                {memberNameOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Location / address
              </label>
              <input
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="Address or location text"
                className={fieldClassName}
              />
              {existingListing?.formatted_address && (
                <p className="mt-2 text-xs text-slate-500">
                  Saved map address:{" "}
                  <span className="font-medium text-slate-700">
                    {existingListing.formatted_address}
                  </span>
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Map location updates automatically after autofill or save.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Neighborhood
              </label>
              <input
                name="neighborhood"
                type="text"
                list="neighborhood-options"
                value={formData.neighborhood}
                onChange={handleChange}
                placeholder="Type or choose a neighborhood"
                className={fieldClassName}
              />
              <datalist id="neighborhood-options">
                {neighborhoods.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Listing type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={fieldClassName}
              >
                <option>Studio</option>
                <option>1 Bed</option>
                <option>1 Bed + Den</option>
                <option>2 Bed</option>
                <option>2 Bed + Den</option>
                <option>House</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Furnished
              </label>
              <select
                name="furnished"
                value={formData.furnished}
                onChange={handleChange}
                className={fieldClassName}
              >
                <option>Unknown</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Area (sqft)
              </label>
              <input
                name="sqft"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.sqft}
                onChange={handleChange}
                placeholder="850"
                className={fieldClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Earliest move-in
              </label>
              <input
                name="earliestMoveIn"
                type="date"
                value={formData.earliestMoveIn}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Viewing Details"
          description="Schedule a viewing without hunting through the whole form."
          className="lg:sticky lg:top-6 lg:self-start"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Viewing date / time
              </label>
              <input
                name="viewingDate"
                type="datetime-local"
                value={formData.viewingDate}
                onChange={handleChange}
                className={fieldClassName}
              />
              <p className="mt-2 text-xs text-slate-500">
                Adding a date sets status to viewing scheduled when the listing is new or messaged.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={fieldClassName}
              >
                <option value="to_process">
                  {formatStatusLabel("to_process")}
                </option>
                <option value="new">{formatStatusLabel("new")}</option>
                <option value="messaged">{formatStatusLabel("messaged")}</option>
                <option value="viewing_scheduled">
                  {formatStatusLabel("viewing_scheduled")}
                </option>
                <option value="viewed">{formatStatusLabel("viewed")}</option>
                <option value="expired">{formatStatusLabel("expired")}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Messaged by
              </label>
              <select
                name="messagedBy"
                value={formData.messagedBy}
                onChange={handleChange}
                className={fieldClassName}
              >
                <option>None</option>
                {memberNameOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>
      </div>

      <FormSection
        title="Amenities / Important Criteria"
        description="Only the criteria selected for this workspace appear here."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {builtinCriteriaFields.map((field) => (
            <div key={field.name}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {field.label}
              </label>
              <select
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                className={fieldClassName}
              >
                <option>Unknown</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          ))}

          {customCriteria.length > 0 && (
            <div className="md:col-span-2 lg:col-span-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900">
                  Custom criteria
                </p>
                <p className="text-xs text-slate-500">
                  These come from Settings for the current workspace.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customCriteria.map((criterion) => (
                  <label key={criterion.id} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {criterion.label}
                    </span>
                    <select
                      value={customCriteriaValues[criterion.id] ?? "Unknown"}
                      onChange={(event) =>
                        handleCustomCriteriaChange(
                          criterion.id,
                          event.target.value as AmenityValue
                        )
                      }
                      className={fieldClassName}
                    >
                      <option>Unknown</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}

          {builtinCriteriaFields.length === 0 && customCriteria.length === 0 && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 md:col-span-2 lg:col-span-4">
              No criteria selected for this workspace. Add criteria in Settings
              to track them on listings.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection title="Contact Information">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contact name
            </label>
            <input
              name="contactName"
              type="text"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Landlord or contact person"
              className={fieldClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contact email
            </label>
            <input
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="name@example.com"
              className={fieldClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contact phone
            </label>
            <input
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="604-123-4567"
              className={fieldClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contact medium
            </label>
            <select
              name="contactMedium"
              value={formData.contactMedium}
              onChange={handleChange}
              className={fieldClassName}
            >
              <option>Unknown</option>
              <option>Website</option>
              <option>Email</option>
              <option>Phone</option>
              <option>Text</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Other contact details
            </label>
            <textarea
              name="contactDetails"
              rows={3}
              value={formData.contactDetails}
              onChange={handleChange}
              placeholder="Contact notes, hidden info, preferred instructions..."
              className={fieldClassName}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Images">
        <div className="space-y-4">
          {images.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <div
                  key={`${image.kind}-${index}`}
                  className="relative h-28 w-36 flex-none overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                >
                  <img
                    src={image.kind === "url" ? image.url : image.preview}
                    alt={`Listing image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-slate-700 shadow-sm hover:bg-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
              No images added yet.
            </p>
          )}

          <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Upload images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
            />
            <p className="mt-2 text-xs text-slate-500">
              First image becomes the dashboard cover.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Or paste image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(event) => setImageUrlInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="https://..."
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Image preview
            </label>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {previewUrl ? (
                <div className="h-56 w-full">
                  <img
                    src={previewUrl}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-slate-500">
                  No image selected yet
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Notes">
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Pros
            </label>
            <textarea
              name="pros"
              rows={3}
              value={formData.pros}
              onChange={handleChange}
              placeholder="What looks good about this place?"
              className={fieldClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cons
            </label>
            <textarea
              name="cons"
              rows={3}
              value={formData.cons}
              onChange={handleChange}
              placeholder="Possible downsides"
              className={fieldClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              General comments
            </label>
            <textarea
              name="comments"
              rows={4}
              value={formData.comments}
              onChange={handleChange}
              placeholder="Anything else worth noting?"
              className={fieldClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Raw description from site
            </label>
            <textarea
              name="rawDescription"
              rows={6}
              value={formData.rawDescription}
              onChange={handleChange}
              placeholder="Paste the original listing description here..."
              className={fieldClassName}
            />
          </div>
        </div>
      </FormSection>

      {message && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? existingListing
              ? "Updating..."
              : "Saving..."
            : existingListing
              ? "Update listing"
              : "Save listing"}
        </button>
      </div>
    </form>
  );
}
