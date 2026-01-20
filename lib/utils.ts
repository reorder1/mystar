import { clsx } from "clsx";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function initials(firstName: string, lastName: string, nickname?: string | null) {
  const base = nickname?.trim() || `${firstName} ${lastName}`.trim();
  return base
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function hashToHsl(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

export function buildWeightedPick(
  students: Array<{ id: string; participationCount: number }>,
  lambda: number
) {
  const weights = students.map((student) => ({
    id: student.id,
    weight: 1 / Math.exp(student.participationCount * lambda)
  }));
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  for (const item of weights) {
    random -= item.weight;
    if (random <= 0) return item.id;
  }
  return weights[0]?.id ?? null;
}
