import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { getAthlete } from "@/lib/queries";
import { SportProfile } from "@/models/SportProfile";
import { saveSportProfile } from "../../../profile-actions";
import { SportForm } from "./sport-form";

const text = (value?: number | string | null) => (value === undefined || value === null ? "" : String(value));

export default async function SportPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole();
  const { id } = await params;
  if (!(await getAthlete(id))) notFound();

  await connectDB();
  const p = await SportProfile.findOne({ athleteId: id }).lean();

  return (
    <SportForm
      action={saveSportProfile.bind(null, id)}
      defaults={{
        disciplines: (p?.disciplines ?? []).join(", "),
        level: text(p?.level),
        club: text(p?.club),
        yearsOfPractice: text(p?.yearsOfPractice),
        weeklyHours: text(p?.weeklyHours),
        weeklySessions: text(p?.weeklySessions),
        maxHeartRate: text(p?.maxHeartRate),
        restingHeartRate: text(p?.restingHeartRate),
        ftp: text(p?.ftp),
        vma: text(p?.vma),
        equipment: text(p?.equipment),
      }}
    />
  );
}
