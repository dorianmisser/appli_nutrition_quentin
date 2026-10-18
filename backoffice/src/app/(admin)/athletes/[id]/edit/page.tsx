import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { toDateInput } from "@/lib/labels";
import { Athlete } from "@/models/Athlete";
import { updateAthlete } from "../../actions";
import { AthleteForm } from "../../athlete-form";

export default async function EditAthletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const athlete = await Athlete.findById(id).lean();
  if (!athlete) notFound();

  return (
    <main>
      <h1 className="mb-6 text-3xl font-semibold">
        Modifier {athlete.firstName} {athlete.lastName}
      </h1>
      <AthleteForm
        action={updateAthlete.bind(null, id)}
        submitLabel="Enregistrer"
        cancelHref={`/athletes/${id}`}
        defaults={{
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          email: athlete.email,
          phone: athlete.phone ?? "",
          birthDate: toDateInput(athlete.birthDate),
          sex: athlete.sex ?? "",
          status: athlete.status,
          source: athlete.source ?? "",
          mainSport: athlete.mainSport ?? "",
          ecName: athlete.emergencyContact?.name ?? "",
          ecPhone: athlete.emergencyContact?.phone ?? "",
          ecRelation: athlete.emergencyContact?.relation ?? "",
        }}
      />
    </main>
  );
}
