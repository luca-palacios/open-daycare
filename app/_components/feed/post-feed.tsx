"use client";

import type { Post } from "../_data/mock";
import { TEACHER_TIME_ZONE } from "../_data/mock";
import {
  formatFeedDate,
  formatPostTime,
  getLocalDayKey,
} from "../_lib/format-date";
import { useVisitorTimeZone } from "../_lib/use-visitor-time-zone";
import { PostCard } from "./post-card";

type PostGroup = {
  key: string;
  label: string;
  posts: Post[];
};

function groupByLocalDay(posts: Post[], timeZone?: string): PostGroup[] {
  const todayKey = getLocalDayKey(new Date(), timeZone);
  const groups = new Map<string, Post[]>();

  for (const post of posts) {
    const key = getLocalDayKey(post.publishedAt, timeZone);
    const group = groups.get(key);

    if (group) group.push(post);
    else groups.set(key, [post]);
  }

  return Array.from(groups, ([key, dayPosts]) => ({
    key,
    label:
      key === todayKey
        ? "PUBLICADO HOY"
        : formatFeedDate(dayPosts[0].publishedAt, timeZone).toUpperCase(),
    posts: dayPosts,
  }));
}

export function PostFeed({ posts }: { posts: Post[] }) {
  // Fallback determinista para SSR y primera hidratación; luego manda la zona del visitante.
  const timeZone = useVisitorTimeZone() || TEACHER_TIME_ZONE;
  const groups = groupByLocalDay(posts, timeZone);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`day-${group.key}`}>
          <div className="mb-3.5 flex items-center gap-3.5">
            <h2
              id={`day-${group.key}`}
              data-testid="feed-day-label"
              className="text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-[#8A7C6D]"
            >
              {group.label}
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7DAC8]" />
          </div>

          <div className="flex flex-col gap-4">
            {group.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                timeLabel={formatPostTime(post.publishedAt, timeZone)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
