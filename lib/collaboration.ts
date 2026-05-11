export type WorkspaceMember = {
  rentalSearchId?: string | null;
  userId: string;
  role: "owner" | "member";
  nickname: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
};

export type ListingScore = {
  userId: string;
  score: number | null;
};

export type ListingImage = {
  id?: string;
  url: string;
  position: number;
  source?: string | null;
};

export function getMemberDisplayName(member: Pick<WorkspaceMember, "nickname" | "fullName" | "email">) {
  return member.nickname || member.fullName || member.email || "Collaborator";
}

export function getAverageCollaboratorScore(scores?: ListingScore[] | null) {
  const values = (scores ?? [])
    .map((score) => score.score)
    .filter((score): score is number => typeof score === "number" && score > 0);

  if (values.length === 0) return null;

  return values.reduce((sum, score) => sum + score, 0) / values.length;
}

export function getScoreForUser(scores: ListingScore[] | null | undefined, userId: string) {
  return scores?.find((score) => score.userId === userId)?.score ?? null;
}
