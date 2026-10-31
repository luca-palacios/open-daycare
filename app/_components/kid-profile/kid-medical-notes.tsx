export function KidMedicalNotes({ notes }: { notes: string }) {
  return (
    <section
      aria-labelledby="kid-medical-notes"
      className="rounded-2xl border border-line bg-surface px-[18px] py-4"
    >
      <h2
        id="kid-medical-notes"
        className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-[#8A7C6D]"
      >
        Notas médicas
      </h2>
      <p className="break-words whitespace-pre-wrap text-[14.5px] leading-[1.5] text-ink">
        {notes}
      </p>
    </section>
  );
}
