import { SunLogo } from "../ui/icons";

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-[60px] py-14 text-white lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden="true"
        className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/12"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/10"
      />

      <div className="relative flex items-center gap-[13px]">
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/22">
          <SunLogo className="h-[26px] w-[26px]" />
        </div>
        <span className="font-display text-[21px] font-semibold tracking-[0.5px]">
          OpenDayCare
        </span>
      </div>

      <div className="relative">
        <h2 className="mb-[18px] font-display text-[42px] font-semibold leading-[1.12]">
          El día de cada niño,
          <br />
          compartido con su familia.
        </h2>
        <p className="max-w-[430px] text-[17px] leading-[1.6] text-white/92">
          Publicá momentos, gestioná las salas y mantené a las familias cerca,
          desde un solo lugar.
        </p>
      </div>

      <div className="relative text-[14px] text-white/90">
        🌿 Guardería Estrellitas
      </div>
    </aside>
  );
}
