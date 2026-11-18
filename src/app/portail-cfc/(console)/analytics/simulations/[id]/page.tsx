import { notFound } from "next/navigation";

/** Simulator sessions are not persisted, so no individual simulation detail exists. */
export default function AnalyticsSimulationDetailPage(): never {
  notFound();
}
