export function SavedMessage({ saved }: { saved?: boolean }) {
  return (
    <p role="status" className="min-h-5 self-center text-sm text-emerald-700">
      {saved ? "Modifications enregistrées." : ""}
    </p>
  );
}
