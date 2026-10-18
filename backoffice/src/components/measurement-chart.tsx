"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export type ChartPoint = { t: number; weightKg?: number; bodyFatPct?: number; waistCm?: number };

const metrics = [
  { key: "weightKg", label: "Poids", unit: "kg" },
  { key: "bodyFatPct", label: "Masse grasse", unit: "%" },
  { key: "waistCm", label: "Tour de taille", unit: "cm" },
] as const;

const day = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" });
const shortDay = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "2-digit", month: "short" });
const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export function MeasurementChart({ points }: { points: ChartPoint[] }) {
  const [metricKey, setMetricKey] = useState<(typeof metrics)[number]["key"]>("weightKg");
  const metric = metrics.find((m) => m.key === metricKey)!;

  // Uniquement les mesures où la valeur existe, triées par date croissante.
  const data = points
    .filter((point) => point[metricKey] !== undefined)
    .sort((a, b) => a.t - b.t);

  return (
    <section className="rounded border border-line bg-paper p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Évolution</h2>
        <div role="group" aria-label="Mesure affichée" className="flex gap-1 text-sm">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={m.key === metricKey}
              onClick={() => setMetricKey(m.key)}
              className={cn(
                "rounded px-3 py-1.5",
                m.key === metricKey ? "bg-ink text-white" : "border border-line hover:bg-fog"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {data.length < 2 ? (
        <p className="mt-6 text-sm text-muted">
          Ajoutez au moins deux mesures de « {metric.label.toLowerCase()} » pour afficher la courbe.
        </p>
      ) : (
        <div className="mt-4 h-72" role="img" aria-label={`Courbe : ${metric.label} en ${metric.unit}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#d6d6d3" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t) => shortDay.format(Number(t))}
                tick={{ fontSize: 12, fill: "#666666" }}
              />
              <YAxis
                domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
                tick={{ fontSize: 12, fill: "#666666" }}
                width={44}
                unit={` ${metric.unit}`}
              />
              <Tooltip
                labelFormatter={(t) => day.format(Number(t))}
                formatter={(value) => [`${number.format(Number(value))} ${metric.unit}`, metric.label]}
              />
              <Line
                type="monotone"
                dataKey={metricKey}
                stroke="#c41732"
                strokeWidth={2}
                dot={{ r: 3, fill: "#c41732" }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
