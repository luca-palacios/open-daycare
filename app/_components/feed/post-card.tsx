import type { Post } from "../../_data/mock";
import { CommentIcon, HeartIcon, ImageIcon, MegaphoneIcon } from "../ui/icons";
import { PostKindBadge } from "./post-kind-badge";

type PostCardProps = {
  post: Post;
  timeLabel: string;
};

function PostAvatar({ post }: { post: Post }) {
  if (post.kind === "announcement") {
    return (
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#CCD8F4] text-[#4E72C8]">
        <MegaphoneIcon className="h-5 w-5" />
      </span>
    );
  }

  return (
    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[17px] font-semibold text-[#1F7A93]">
      {post.authorInitials}
    </span>
  );
}

export function PostCard({ post, timeLabel }: PostCardProps) {
  return (
    <article className="rounded-[20px] border border-line bg-surface px-4 py-4 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)] sm:px-[22px] sm:py-5">
      <header className="mb-3.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
        <div className="row-span-2">
          <PostAvatar post={post} />
        </div>
        <h2 className="truncate font-display text-[16.5px] font-semibold text-ink">
          {post.authorName}
        </h2>
        <PostKindBadge kind={post.kind} />
        <p className="col-span-2 text-[12.5px] text-faint">
          <time dateTime={post.publishedAt}>{timeLabel}</time> · publicado por
          vos
        </p>
      </header>

      <p className="mb-2.5 text-[12.5px] text-faint">Para: {post.audience}</p>

      <p className="text-[15.5px] leading-[1.55] text-body">{post.message}</p>

      {post.photo && (
        <div
          role="img"
          aria-label={post.photo.label}
          className="mt-3.5 flex h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290] sm:h-[200px]"
        >
          <ImageIcon className="h-[30px] w-[30px]" />
          <span className="text-[13.5px]">{post.photo.label}</span>
        </div>
      )}

      {post.images && post.images.length > 0 && (
        <div
          className={`mt-3.5 grid gap-2 ${
            post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {post.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className="h-[180px] w-full rounded-2xl border border-line object-cover sm:h-[200px]"
            />
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <span
          aria-label={`${post.reactions} reacciones`}
          className="flex items-center gap-[7px] text-[14px] font-bold text-brand"
        >
          <HeartIcon aria-hidden="true" className="h-[19px] w-[19px] fill-current" />
          {post.reactions}
        </span>
        <span
          aria-label={`${post.comments} comentarios`}
          className="flex items-center gap-[7px] text-[14px] font-bold text-muted"
        >
          <CommentIcon aria-hidden="true" className="h-[18px] w-[18px]" />
          {post.comments}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          className="text-[14px] font-extrabold text-brand-dark"
        >
          Editar
        </button>
      </footer>
    </article>
  );
}
