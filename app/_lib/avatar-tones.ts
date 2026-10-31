export const KID_AVATAR_TONES = {
  sky: "bg-[#A9D9E8] text-[#1F7A93]",
  rose: "bg-[#F4B8CC] text-[#C44A7A]",
  mint: "bg-[#B9DEC4] text-[#3E8B62]",
  sun: "bg-[#F4DC8E] text-[#9A7B1E]",
  lilac: "bg-[#C9B6E8] text-[#7B5FC0]",
};

export type KidAvatarTone = keyof typeof KID_AVATAR_TONES;

const AVATAR_TONES = Object.keys(KID_AVATAR_TONES) as KidAvatarTone[];

export function getKidAvatarTone(seed: string): KidAvatarTone {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return AVATAR_TONES[hash % AVATAR_TONES.length];
}
