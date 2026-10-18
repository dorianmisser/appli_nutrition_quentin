import { AthleteForm } from "../athlete-form";
import { createAthlete } from "../actions";

export default function NewAthletePage() {
  return (
    <main>
      <h1 className="mb-6 text-3xl font-semibold">Nouvel athlète</h1>
      <AthleteForm action={createAthlete} submitLabel="Créer la fiche" cancelHref="/athletes" />
    </main>
  );
}
