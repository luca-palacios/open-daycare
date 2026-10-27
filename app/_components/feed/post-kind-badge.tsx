import type { PostKind } from "../../_data/mock";

const BADGE_STYLES: Record<
  PostKind,
  { label: string; container: string; dot: string }
> = {
  meal: {
    label: "COMIDA",
    container: "bg-[#F3E3B5] text-[#9A7B1E]",
    dot: "bg-[#9A7B1E]",
  },
  nap: {
    label: "SIESTA",
    container: "bg-[#E7DCF6] text-[#7B5FC0]",
    dot: "bg-[#7B5FC0]",
  },
  activity: {
    label: "ACTIVIDAD",
    container: "bg-[#C7E7F1] text-[#2E89A6]",
    dot: "bg-[#2E89A6]",
  },
  achievement: {
    label: "LOGRO",
    container: "bg-[#CFEBD8] text-[#3E9B6C]",
    dot: "bg-[#3E9B6C]",
  },
  mood: {
    label: "ÁNIMO",
    container: "bg-[#F9D2DE] text-[#C56486]",
    dot: "bg-[#C56486]",
  },
  photo: {
    label: "FOTO",
    container: "bg-[#FBD8CC] text-[#D9684A]",
    dot: "bg-[#D9684A]",
  },
  announcement: {
    label: "ANUNCIO",
    container: "bg-[#CCD8F4] text-[#4E72C8]",
    dot: "bg-[#4E72C8]",
  },
};

export function PostKindBadge({ kind }: { kind: PostKind }) {
  const style = BADGE_STYLES[kind];

  return (
    <span
      data-testid={`post-kind-${kind}`}
      className={`flex flex-none items-center gap-[7px] rounded-full px-3 py-1.5 text-xs font-extrabold tracking-[0.5px] ${style.container}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${style.dot}`}
      />
      {style.label}
    </span>
  );
}
