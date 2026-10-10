import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTesa } from "@/lib/tesa/context";

export function ScrollJourney({ children }: { children: ReactNode }) {
  const { state, t } = useTesa();
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const steps = [
    t("Add your resume", "Agrega tu currículum"),
    t("Find your fit", "Encuentra tu puesto"),
    t("Close the gap", "Cierra la brecha"),
  ];
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const chapters = root.current?.querySelectorAll<HTMLElement>("[data-journey-chapter]");
      let current = 0;
      const readingLine = Math.max(210, window.innerHeight * 0.4);
      chapters?.forEach((chapter) => {
        if (chapter.getBoundingClientRect().top <= readingLine)
          current = Number(chapter.dataset["journeyChapter"]);
      });
      if (
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4
      )
        current = 2;
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [state.analyzed]);
  return (
    <div ref={root} className="scroll-journey">
      <nav
        className="journey-guide"
        aria-label={t("Your career journey", "Tu recorrido profesional")}
      >
        {steps.map((label, index) => (
          <Button
            key={label}
            variant="ghost"
            className="journey-stop"
            data-active={active === index}
            aria-current={active === index ? "step" : undefined}
            onClick={() => {
              const target = root.current?.querySelector(`[data-journey-chapter="${index}"]`);
              target?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
                block: "start",
              });
            }}
          >
            <span className="journey-index">
              {index === 0 && state.analyzed ? <Check size={16} /> : `0${index + 1}`}
            </span>
            <span>{label}</span>
            <ArrowDown className="journey-arrow" />
          </Button>
        ))}
      </nav>
      {children}
    </div>
  );
}

export function JourneyChapter({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="journey-chapter-heading">
      <span className="page-eyebrow">{step}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
