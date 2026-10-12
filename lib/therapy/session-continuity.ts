export interface ContinuitySummary {
  id: string;
  topic: string;
  summary: string;
  updated_at: string;
}
export interface ContinuityReview {
  resource_id: string | null;
  decision: string;
  correction: string | null;
  created_at: string;
}

/** Review decisions and current restrictions override earlier session history. */
export function reviewedSessionContext(
  summaries: ContinuitySummary[],
  reviews: ContinuityReview[],
  safeText: (text: string) => boolean,
): string {
  const latest = new Map<string, ContinuityReview>();
  for (const review of reviews) {
    if (!review.resource_id || !Number.isFinite(Date.parse(review.created_at))) continue;
    const prior = latest.get(review.resource_id);
    if (!prior || Date.parse(review.created_at) > Date.parse(prior.created_at))
      latest.set(review.resource_id, review);
  }
  const entries: Array<{ topic: string; account: string; source: string }> = [];
  for (const summary of summaries) {
    const review = latest.get(summary.id);
    // A review of an older revision must not approve newly changed content.
    if (!review || !Number.isFinite(Date.parse(summary.updated_at)) ||
        Date.parse(review.created_at) < Date.parse(summary.updated_at)) continue;
    if (!['approved', 'corrected'].includes(review.decision)) continue;
    const text = review.decision === 'corrected' ? review.correction : summary.summary;
    if (!text?.trim() || !safeText(text) || !safeText(summary.topic)) continue;
    entries.push({
      topic: summary.topic.slice(0, 120),
      account: text.trim().slice(0, 450),
      source: review.decision === 'corrected' ? 'caregiver-corrected session account' : 'reviewed session account',
    });
    if (entries.length === 3) break;
  }
  return entries.length ? JSON.stringify(entries) : '';
}
