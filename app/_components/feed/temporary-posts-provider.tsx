"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  teacher,
  type Post,
  type PostImage,
  type PostKind,
} from "../../_data/mock";
import {
  describeAudience,
  MAX_POST_IMAGES,
  releaseImages,
  type PostAudience,
} from "../../_lib/post-validation";
export type PostDraft = {
  kind: PostKind;
  message: string;
  audience: PostAudience;
  images: PostImage[];
  roomKids: { id: string; name: string }[];
};

type TemporaryPostsContextValue = {
  temporaryPosts: Post[];
  publishPost: (draft: PostDraft) => void;
  clearTemporaryPosts: () => void;
};

const TemporaryPostsContext =
  createContext<TemporaryPostsContextValue | null>(null);

export function TemporaryPostsProvider({ children }: { children: ReactNode }) {
  const [temporaryPosts, setTemporaryPosts] = useState<Post[]>([]);

  const publishPost = useCallback(
    (draft: PostDraft) => {
      const post: Post = {
        id: `temporary-post-${globalThis.crypto.randomUUID()}`,
        kind: draft.kind,
        authorName: teacher.name,
        authorInitials: teacher.initials,
        audience: describeAudience(draft.audience, draft.roomKids),
        publishedAt: new Date().toISOString(),
        message: draft.message.trim(),
        reactions: 0,
        comments: 0,
        images: draft.images
          .slice(0, MAX_POST_IMAGES)
          .map((image) => ({ src: image.src, alt: image.alt })),
      };

      setTemporaryPosts((currentPosts) => [post, ...currentPosts]);
    },
    [],
  );

  const clearTemporaryPosts = useCallback(() => {
    temporaryPosts.forEach((post) => releaseImages(post.images ?? []));
    setTemporaryPosts([]);
  }, [temporaryPosts]);

  const value = useMemo(
    () => ({ temporaryPosts, publishPost, clearTemporaryPosts }),
    [temporaryPosts, publishPost, clearTemporaryPosts],
  );

  return (
    <TemporaryPostsContext.Provider value={value}>
      {children}
    </TemporaryPostsContext.Provider>
  );
}

export function useTemporaryPosts(): TemporaryPostsContextValue {
  const context = useContext(TemporaryPostsContext);

  if (!context) {
    throw new Error(
      "useTemporaryPosts must be used within a TemporaryPostsProvider.",
    );
  }

  return context;
}
