import { getJob } from "@/lib/tesa/data";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useTesa } from "@/lib/tesa/context";
import { JOBS, BLOOM, SOFT, type Turn, type Job, type Simulation } from "@/lib/tesa/data";
import { canEndSimulation, skillLevel } from "@/lib/tesa/scoring";
import { coachTurn, reviewSimulation, type CoachRequest } from "@/lib/api/client";
import { JobSelector } from "./gap";
import { PageHeading, Status } from "./shared";
import { CoachAvatar } from "./coach-avatar";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

function tutorOpening(skill: string, title: string, spanish: boolean) {
  return spanish
    ? `Practiquemos ${skill} para ${title}. Piensa en una situación de trabajo realista: ¿cómo aplicarías esta habilidad y cuál sería tu primer paso?`
    : `Let’s practice ${skill} for ${title}. Think of a realistic workplace situation. How would you apply this skill, and what would you do first?`;
}
function simulationOpening(job: Job, spanish: boolean) {
  return job.id === "gem"
    ? spanish
      ? "Reservé una suite hace tres meses para Art Basel. Es medianoche, estoy agotado y ahora me dice que no hay habitación. ¿Cómo van a solucionarlo?"
      : "I booked a suite three months ago for Art Basel. It’s midnight, I’m exhausted, and now you’re telling me it’s gone. What are you going to do about this?"
    : spanish
      ? `Necesito ayuda. ${job.scn.name} está afectando mi día y necesito una solución. ¿Qué puede hacer?`
      : `I need your help. This situation—${job.scn.name.toLowerCase()}—is affecting my day, and I need a clear solution. What can you do?`;
}

export function LearningChat({
  simulation = false,
  jobId,
  onFinish,
}: {
  simulation?: boolean;
  jobId?: string;
  onFinish?: (sim: Simulation) => void;
}) {
  const { state, update, t, addEvidence, addSimulation } = useTesa();
  const job = getJob(jobId ?? state.focus);
  const skill = state.skill;
  const sl = skillLevel(state.profile, state.evidence, skill);
  const target = job.reqs.find((r) => r.s === skill)?.t ?? 3;
  const [turns, setTurns] = useState<Turn[]>([]),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [read, setRead] = useState(false),
    [listening, setListening] = useState(false),
    [voiceFirst, setVoiceFirst] = useState(false),
    [scored, setScored] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [reacting, setReacting] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const session = useRef("");
  const submitted = useRef("");
  const userCount = turns.filter((t) => t.role === "user").length;
  const es = state.language === "es";
  useEffect(() => {
    if (busy || turns.length < 2 || turns.at(-1)?.role !== "assistant") {
      setReacting(false);
      return;
    }
    setReacting(true);
    const reaction = setTimeout(() => setReacting(false), 2200);
    return () => clearTimeout(reaction);
  }, [turns, busy]);
  useEffect(() => {
    session.current = crypto.randomUUID();
    setTurns([
      {
        role: "assistant",
        text: simulation ? simulationOpening(job, es) : tutorOpening(skill, job.title, es),
        level: Math.max(1, sl.level + 1),
      },
    ]);
    setScored(false);
    setBusy(false);
    setText("");
    setSpeaking(false);
    setListening(false);
    return () => {
      rec.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, [job.id, skill, simulation, es]);
  function say(reply: string) {
    if (!read || !window.speechSynthesis) return;
    const speech = new SpeechSynthesisUtterance(reply);
    speech.lang = es ? "es-US" : "en-US";
    speech.onstart = () => setSpeaking(true);
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(speech);
  }
  function stop() {
    // A new session makes the pending AI reply be ignored when it arrives.
    session.current = crypto.randomUUID();
    setBusy(false);
    setTurns((prev) => (prev.at(-1)?.role === "user" ? prev.slice(0, -1) : prev));
    setText(submitted.current);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }
  function voice() {
    if (listening) {
      rec.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Constructor) {
      toast.info(
        t(
          "Voice input isn’t available in this browser",
          "La entrada de voz no está disponible en este navegador",
        ),
        {
          description: t(
            "Use typing, or try Chrome for microphone input.",
            "Escribe tu respuesta o prueba Chrome para usar el micrófono.",
          ),
        },
      );
      return;
    }
    const recognition = new Constructor();
    rec.current = recognition;
    recognition.lang = es ? "es-US" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) =>
      setText((prev) => `${prev} ${e.results[0]?.[0]?.transcript ?? ""}`.trim());
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      setListening(false);
      toast.error(t(`Microphone: ${e.error}`, `Micrófono: ${e.error}`));
    };
    try {
      recognition.start();
      setListening(true);
    } catch {
      toast.error(t("Could not start the microphone", "No se pudo iniciar el micrófono"));
    }
  }
  /** The conversation context the AI coach needs, with `turnsSoFar` as the transcript. */
  function coachRequest(turnsSoFar: Turn[]): CoachRequest {
    return {
      mode: simulation ? "simulation" : "tutor",
      language: es ? "es" : "en",
      job: { title: job.title, employer: job.employer, sector: job.sector, scenario: job.scn },
      ...(simulation ? {} : { skill, currentLevel: sl.level, targetLevel: target }),
      turns: turnsSoFar.map(({ role, text }) => ({ role, text })),
    };
  }
  async function submit(answer: string) {
    const value = answer.trim();
    if (!value || busy || scored) return;
    submitted.current = value;
    const sessionId = session.current;
    const history: Turn[] = [...turns, { role: "user", text: value }];
    setText("");
    setBusy(true);
    setTurns(history);
    try {
      const { reply, grade } = await coachTurn(coachRequest(history));
      // Ignore replies to a conversation the learner has since restarted.
      if (session.current !== sessionId) return;
      setTurns([
        ...history.slice(0, -1),
        { role: "user", text: value, level: grade?.level, confidence: grade?.confidence },
        { role: "assistant", text: reply, level: Math.min(6, (grade?.level ?? sl.level) + 1) },
      ]);
      if (!simulation && grade)
        addEvidence({
          skill,
          job: job.id,
          level: grade.level,
          confidence: grade.confidence,
          quote: grade.quote,
          at: new Date().toISOString(),
          session: sessionId,
        });
      say(reply);
    } catch (error) {
      if (session.current !== sessionId) return;
      // Put the answer back so the learner can send it again.
      setTurns(turns);
      setText(value);
      toast.error(t("The coach couldn’t reply", "El coach no pudo responder"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      if (session.current === sessionId) setBusy(false);
    }
  }
  async function finish() {
    if (!canEndSimulation(turns) || busy || scored) return;
    const sessionId = session.current;
    setBusy(true);
    try {
      const { mode: _mode, ...req } = coachRequest(turns);
      const review = await reviewSimulation(req);
      if (session.current !== sessionId) return;
      const sim: Simulation = {
        job: job.id,
        scores: review.scores,
        summary: review.summary,
        quote: review.quote,
        tips: review.tips,
        turns,
        at: new Date().toISOString(),
      };
      addSimulation(sim);
      setScored(true);
      onFinish?.(sim);
    } catch (error) {
      if (session.current !== sessionId) return;
      toast.error(t("Couldn’t score this simulation", "No se pudo evaluar la simulación"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      if (session.current === sessionId) setBusy(false);
    }
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {!simulation && (
          <>
            <JobSelector />
            <select
              aria-label={t("Skill to practice", "Habilidad para practicar")}
              className="text-xs max-w-full"
              value={skill}
              onChange={(e) => update({ skill: e.target.value })}
            >
              {Array.from(new Set([...job.reqs.map((r) => r.s), skill])).map((s) => (
                <option key={s} value={s}>
                  {s} · L{skillLevel(state.profile, state.evidence, s).level} → L
                  {job.reqs.find((r) => r.s === s)?.t ?? 3}
                </option>
              ))}
            </select>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            session.current = crypto.randomUUID();
            setBusy(false);
            setTurns([
              {
                role: "assistant",
                text: simulation ? simulationOpening(job, es) : tutorOpening(skill, job.title, es),
                level: Math.max(1, sl.level + 1),
              },
            ]);
            setScored(false);
          }}
        >
          <RotateCcw />
          {t("Restart", "Reiniciar")}
        </Button>
      </div>
      <div className="chat-layout">
        <section className="chat-main">
          <div className="chat-identity">
            <CoachAvatar
              compact
              activity={
                listening
                  ? "listening"
                  : busy
                    ? "thinking"
                    : speaking
                      ? "speaking"
                      : reacting
                        ? "celebrating"
                        : "idle"
              }
            />
            <div>
              <h3>{simulation ? job.scn.name : skill}</h3>
              <p>
                {job.title} · {job.employer}
              </p>
            </div>
          </div>
          {voiceFirst && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Button
                variant="ghost"
                className="avatar-voice-button"
                aria-label={
                  listening
                    ? t("Stop microphone", "Detener micrófono")
                    : t("Start microphone", "Iniciar micrófono")
                }
                onClick={voice}
              >
                <CoachAvatar
                  activity={
                    listening
                      ? "listening"
                      : busy
                        ? "thinking"
                        : speaking
                          ? "speaking"
                          : reacting
                            ? "celebrating"
                            : "idle"
                  }
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                {listening
                  ? t("Listening…", "Escuchando…")
                  : t("Ready when you are", "Listo cuando tú lo estés")}
              </span>
            </div>
          )}
          <Conversation className="transcript" aria-live="polite">
            <ConversationContent className="px-0 py-5">
              {turns.map((turn, i) => (
                <Message from={turn.role} key={i}>
                  <MessageContent>
                    <MessageResponse>{turn.text}</MessageResponse>
                  </MessageContent>
                  {turn.role === "user" && turn.level !== undefined && (
                    <div
                      className={`grade ${Number(turn.confidence) < 0.7 ? "text-muted-foreground" : ""}`}
                    >
                      {t("AI grade", "Nota IA")} L{turn.level} {BLOOM[turn.level]} ·{" "}
                      {Math.round(Number(turn.confidence) * 100)}%{" "}
                      {Number(turn.confidence) >= 0.7 ? "✓" : ""}
                    </div>
                  )}
                  {turn.role === "assistant" && !simulation && (
                    <div className="text-[9px] text-muted-foreground">
                      {t("Probing", "Explorando")} L{turn.level ?? 1} {BLOOM[turn.level ?? 1]}
                    </div>
                  )}
                </Message>
              ))}
              {busy && (
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer>{t("Thinking…", "Pensando…")}</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="chat-composer">
            <PromptInput onSubmit={({ text: answer }) => submit(answer)}>
              <PromptInputTextarea
                aria-label={t("Your answer", "Tu respuesta")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("Share your thinking…", "Comparte tu razonamiento…")}
                disabled={scored}
              />
              <PromptInputFooter className="justify-between">
                <Button
                  type="button"
                  variant={listening ? "bay" : "ghost"}
                  size="icon-sm"
                  onClick={voice}
                  disabled={busy || scored}
                  aria-label={
                    listening
                      ? t("Stop microphone", "Detener micrófono")
                      : t("Speak your answer", "Dictar respuesta")
                  }
                  title={t("Speak your answer", "Dictar respuesta")}
                >
                  {listening ? <MicOff /> : <Mic />}
                </Button>
                <PromptInputSubmit
                  status={busy ? "submitted" : "ready"}
                  disabled={!busy && (!text.trim() || scored)}
                  onStop={stop}
                  aria-label={busy ? t("Stop", "Detener") : t("Send answer", "Enviar respuesta")}
                />
              </PromptInputFooter>
            </PromptInput>
            <div className="chat-settings">
              <label>
                <input
                  type="checkbox"
                  checked={read}
                  onChange={(e) => {
                    setRead(e.target.checked);
                    if (!e.target.checked) {
                      window.speechSynthesis?.cancel();
                      setSpeaking(false);
                    }
                  }}
                />
                <Volume2 size={12} />
                {t("Read replies aloud", "Leer respuestas en voz alta")}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={voiceFirst}
                  onChange={(e) => setVoiceFirst(e.target.checked)}
                />
                {t("Voice first", "Priorizar voz")}
              </label>
            </div>
            <p className="helper">
              {t(
                "AI coach powered by Gemini · grades are AI estimates.",
                "Coach con IA de Gemini · las notas son estimaciones de la IA.",
              )}
            </p>
          </div>
        </section>
        <aside className="chat-side">
          {simulation ? (
            <>
              <h3>{t("Live practice rubric", "Rúbrica de práctica")}</h3>
              {SOFT.map((k) => (
                <div className="rubric" key={k}>
                  <div className="rubric-label">
                    <span>{k.replaceAll("_", " ")}</span>
                    <span className="font-mono">{userCount ? "4" : "—"} / 5</span>
                  </div>
                  <div className="mini-track">
                    <div
                      className="mini-fill"
                      ref={(node) => {
                        if (node) node.style.transform = `scaleX(${userCount ? 0.8 : 0})`;
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-4 mt-5">
                <h3>{t("Coach note", "Nota del coach")}</h3>
                <p className="text-xs text-muted-foreground leading-7">
                  {t(
                    "Acknowledge their frustration, offer a concrete solution, and set a clear expectation for follow-up.",
                    "Reconoce su frustración, ofrece una solución concreta y establece expectativas de seguimiento.",
                  )}
                </p>
              </div>
              <Button
                className="w-full mt-5 text-xs"
                disabled={!canEndSimulation(turns) || busy || scored}
                onClick={finish}
              >
                {t("End and score", "Terminar y evaluar")}
                <Check />
              </Button>
              <p className="helper">
                {t(
                  "Available after 2 replies. The AI scores each dimension from 1 to 5.",
                  "Disponible tras 2 respuestas. La IA evalúa cada dimensión del 1 al 5.",
                )}
              </p>
            </>
          ) : (
            <>
              <h3>{t("Your Bloom ladder", "Tu escalera de Bloom")}</h3>
              <p className="text-[11px] text-muted-foreground mb-5 leading-5">
                {t(
                  "Two strong answers earn a level. Confidence must be at least 70%.",
                  "Dos respuestas sólidas alcanzan un nivel. Confianza mínima del 70%.",
                )}
              </p>
              <div className="ladder">
                {BLOOM.slice(1).map((name, i) => (
                  <div
                    key={name}
                    className={`rung ${sl.level >= i + 1 ? "earned" : ""} ${sl.nextL === i + 1 ? "next" : ""}`}
                  >
                    <span className="level">L{i + 1}</span>
                    <span>
                      {t(
                        name,
                        ["", "Recordar", "Comprender", "Aplicar", "Analizar", "Evaluar", "Crear"][
                          i + 1
                        ] ?? name,
                      )}
                    </span>
                    {sl.level >= i + 1 ? (
                      <Check size={11} className="ml-auto" />
                    ) : sl.nextL === i + 1 ? (
                      <span className="ml-auto text-[10px] text-sun">
                        {Math.min(sl.toward, 2)}/2
                      </span>
                    ) : null}
                    {target === i + 1 && <small>{t("TARGET", "META")}</small>}
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-6 pt-5">
                <h3>{t("Latest evidence", "Última evidencia")}</h3>
                {sl.last ? (
                  <>
                    <span className="pill sample">
                      L{sl.last.level} · {Math.round(sl.last.confidence * 100)}%
                    </span>
                    <p className="text-xs leading-6 text-muted-foreground">“{sl.last.quote}”</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground leading-6">
                    {t(
                      "Your demonstrated skills will appear here.",
                      "Tus habilidades demostradas aparecerán aquí.",
                    )}
                  </p>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4 text-xs" asChild>
                <Link to="/gap">
                  {t("View updated gap", "Ver brecha actualizada")}
                  <ArrowRight />
                </Link>
              </Button>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
export function TutorPage() {
  const { t } = useTesa();
  return (
    <>
      <PageHeading
        eyebrow={t("One question. One step forward.", "Una pregunta. Un paso adelante.")}
        title={t(
          "Build the skill. Prove you know it.",
          "Aprende la habilidad. Demuestra tu conocimiento.",
        )}
        description={t(
          "Practice job-specific thinking with your Socratic tutor.",
          "Practica el razonamiento específico de tu empleo con tu tutor socrático.",
        )}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link to="/gap">
            <ArrowLeft />
            {t("Skill gap", "Brecha")}
          </Link>
        </Button>
      </PageHeading>
      <LearningChat />
    </>
  );
}
