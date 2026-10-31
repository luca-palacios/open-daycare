import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "./_components/layout/app-shell";
import { CreatePostPrompt } from "./_components/feed/create-post-prompt";
import { FeedHeader } from "./_components/feed/feed-header";
import { PostFeed } from "./_components/feed/post-feed";
import { createMockPosts, room, teacher } from "./_data/mock";
import { createClient } from "../utils/supabase/server";

async function FeedHeaderWithChildrenCount() {
  await connection();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (error) throw error;

  return (
    <FeedHeader
      eyebrow={room.eyebrow}
      teacherName={teacher.firstName}
      childrenCount={count ?? 0}
    />
  );
}

function FeedHeaderSkeleton() {
  return (
    <div aria-hidden="true" className="mb-6 flex flex-col gap-2">
      <div className="h-3 w-40 animate-pulse rounded bg-[#E7DAC8]" />
      <div className="h-8 w-64 animate-pulse rounded bg-[#E7DAC8]" />
      <div className="h-4 w-48 animate-pulse rounded bg-[#E7DAC8]" />
    </div>
  );
}

async function FeedPosts() {
  await connection();
  const posts = createMockPosts();

  return <PostFeed posts={posts} />;
}

function FeedSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="flex items-center gap-3.5">
        <span className="h-3 w-28 rounded-full bg-[#E4D6C4]" />
        <span className="h-px flex-1 bg-[#E7DAC8]" />
      </div>
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-[180px] animate-pulse rounded-[20px] border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[760px] px-4 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-[34px]">
        <Suspense fallback={<FeedHeaderSkeleton />}>
          <FeedHeaderWithChildrenCount />
        </Suspense>
        <CreatePostPrompt />
        <Suspense fallback={<FeedSkeleton />}>
          <FeedPosts />
        </Suspense>
      </div>
    </AppShell>
  );
}
