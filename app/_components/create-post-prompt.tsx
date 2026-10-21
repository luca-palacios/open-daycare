import { teacher } from "../_data/mock";
import { CameraIcon } from "./icons";

export function CreatePostPrompt() {
  return (
    <button
      type="button"
      className="mb-6 flex w-full items-center gap-3.5 rounded-[18px] border border-line bg-surface px-[18px] py-3.5 text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2937A] font-display text-base font-semibold text-white">
        {teacher.initials}
      </span>
      <span className="flex-1 text-[15px] text-faint">
        Compartí un momento…
      </span>
      <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-[#FBE3D8] text-brand">
        <CameraIcon className="h-[19px] w-[19px]" />
      </span>
    </button>
  );
}
