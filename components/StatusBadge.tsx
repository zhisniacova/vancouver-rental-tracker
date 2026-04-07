type ListingStatus = "new" | "messaged" | "viewing_scheduled" | "viewed" | "expired";

type StatusBadgeProps = {
  status: ListingStatus;
};

export function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusStyles(status: ListingStatus) {
  switch (status) {
    case "new":
      return "bg-slate-100 text-slate-700";
    case "messaged":
      return "bg-blue-100 text-blue-700";
    case "viewing_scheduled":
      return "bg-amber-100 text-amber-700";
    case "viewed":
      return "bg-emerald-100 text-emerald-700";
    case "expired":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(status)}`}>
      {formatStatusLabel(status)}
    </span>
  );
}
