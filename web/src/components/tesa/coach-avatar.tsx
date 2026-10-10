import robotUrl from "@/assets/tesa-coach.png";
import { useTesa } from "@/lib/tesa/context";

export function CoachAvatar({
  activity = "idle",
  compact = false,
}: {
  activity?: "idle" | "thinking" | "listening" | "speaking" | "celebrating";
  compact?: boolean;
}) {
  const { t } = useTesa();
  return (
    <div className={`coach-avatar ${compact ? "compact" : ""}`} data-activity={activity}>
      <img
        src={robotUrl}
        alt={t("Your TESA robot coach", "Tu coach robot TESA")}
        width={1338}
        height={1176}
      />
      <span className="coach-avatar-signal" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
