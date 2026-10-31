"use client";

import { useSyncExternalStore } from "react";
import { formatFeedDate } from "../../_lib/format-date";
import { useVisitorTimeZone } from "../../_lib/use-visitor-time-zone";
import { useTemporaryKids } from "../kids/temporary-kids-provider";

const subscribe = () => () => {};

type FeedHeaderProps = {
  eyebrow: string;
  teacherName: string;
  childrenCount: number;
};

export function FeedHeader({
  eyebrow,
  teacherName,
  childrenCount,
}: FeedHeaderProps) {
  const timeZone = useVisitorTimeZone();
  const { temporaryKids } = useTemporaryKids();
  const dateLabel = useSyncExternalStore(
    subscribe,
    () => (timeZone ? formatFeedDate(new Date(), timeZone) : ""),
    () => "",
  );
  const totalChildrenCount = childrenCount + temporaryKids.length;

  return (
    <header className="mb-6">
      <p className="mb-1 text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-brand-strong">
        {eyebrow}
      </p>
      <h1 className="font-display text-[30px] font-semibold leading-tight text-ink">
        Buenas, {teacherName}
      </h1>
      <p className="mt-[5px] min-h-[21px] text-[14.5px] text-muted">
        {totalChildrenCount} niños
        <span aria-hidden="true"> · </span>
        <span data-testid="feed-date">{dateLabel || "\u00A0"}</span>
      </p>
    </header>
  );
}
