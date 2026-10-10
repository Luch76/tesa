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
  abort?: () => void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: {
          length: number;
          [key: number]: { isFinal: boolean; [key: number]: { transcript: string } };
        };
      }) => void)
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

/** Silent listening rounds (each ends after a few seconds without speech) before voice chat pauses. */
const MAX_SILENT_ROUNDS = 4;

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
    [talking, setTalking] = useState(false),
    [scored, setScored] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [reacting, setReacting] = useState(false);
  const rec = useRef<Recognition | null>(null);
  // Voice conversation: recognition and speech callbacks outlive renders, so they read these refs.
  const talkingRef = useRef(false);
  const submitRef = useRef<(answer: string) => Promise<void>>(async () => {});
  const listenRef = useRef<() => void>(() => {});
  const silentRounds = useRef(0);
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
      endConversation();
    };
  }, [job.id, skill, simulation, es]);
  /**
   * Speaks a reply when "Read replies aloud" is on or a voice conversation is running,
   * then calls `onDone`. Sentences are queued separately because Chrome stops speaking
   * long single utterances partway through.
   */
  function say(reply: string, onDone?: () => void) {
    const synth = window.speechSynthesis;
    if (!(read || talkingRef.current) || !synth) {
      onDone?.();
      return;
    }
    synth.cancel();
    const sentences = reply.match(/[^.!?¿¡]+[.!?]*\s*/g) ?? [reply];
    setSpeaking(true);
    sentences.forEach((sentence, i) => {
      const speech = new SpeechSynthesisUtterance(sentence.trim());
      speech.lang = es ? "es-US" : "en-US";
      if (i === sentences.length - 1) {
        speech.onend = () => {
          setSpeaking(false);
          onDone?.();
        };
        speech.onerror = () => {
          setSpeaking(false);
          onDone?.();
        };
      }
      synth.speak(speech);
    });
  }
  function stop() {
    endConversation();
    // A new session makes the pending AI reply be ignored when it arrives.
    session.current = crypto.randomUUID();
    setBusy(false);
    setTurns((prev) => (prev.at(-1)?.role === "user" ? prev.slice(0, -1) : prev));
    setText(submitted.current);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }
  /** Listens for one spoken answer; when the speaker pauses, sends it to the coach. */
  function listen() {
    if (!talkingRef.current) return;
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Constructor) {
      endConversation();
      toast.info(
        t(
          "Voice chat isn’t available in this browser",
          "El chat de voz no está disponible en este navegador",
        ),
        {
          description: t(
            "Type your answers, or try Chrome or Safari for voice.",
            "Escribe tus respuestas o prueba Chrome o Safari para usar la voz.",
          ),
        },
      );
      return;
    }
    const recognition = new Constructor();
    rec.current = recognition;
    recognition.lang = es ? "es-US" : "en-US";
    // Not continuous: the browser ends recognition when the speaker pauses, which ends the turn.
    recognition.continuous = false;
    recognition.interimResults = true;
    let heard = "";
    recognition.onresult = (e) => {
      let interim = "";
      heard = "";
      for (let i = 0; i < e.results.length; i++) {
        const piece = e.results[i]?.[0]?.transcript ?? "";
        if (e.results[i]?.isFinal) heard += piece;
        else interim += piece;
      }
      setText(`${heard}${interim}`.trim());
    };
    recognition.onend = () => {
      setListening(false);
      if (!talkingRef.current) return;
      if (heard.trim()) {
        silentRounds.current = 0;
        void submitRef.current(heard);
      } else if (++silentRounds.current >= MAX_SILENT_ROUNDS) {
        // Nobody has spoken for a while: stop rather than listen forever.
        endConversation();
        toast.info(t("Voice chat paused", "Chat de voz en pausa"), {
          description: t(
            "Tap Talk when you’re ready to continue.",
            "Toca Hablar cuando quieras seguir.",
          ),
        });
      } else {
        listenRef.current();
      }
    };
    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      endConversation();
      toast.error(
        e.error === "not-allowed"
          ? t("Microphone access was blocked", "Se bloqueó el acceso al micrófono")
          : t(`Microphone: ${e.error}`, `Micrófono: ${e.error}`),
      );
    };
    try {
      recognition.start();
      setListening(true);
    } catch {
      endConversation();
      toast.error(t("Could not start the microphone", "No se pudo iniciar el micrófono"));
    }
  }
  function startConversation() {
    silentRounds.current = 0;
    talkingRef.current = true;
    setTalking(true);
    setText("");
    listen();
  }
  function endConversation() {
    talkingRef.current = false;
    setTalking(false);
    setListening(false);
    rec.current?.abort?.();
    rec.current?.stop();
    window.speechSynthesis?.cancel();
    setSpeaking(false);
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
      say(reply, () => {
        if (talkingRef.current) listenRef.current();
      });
    } catch (error) {
      if (session.current !== sessionId) return;
      // Put the answer back so the learner can send it again.
      endConversation();
      setTurns(turns);
      setText(value);
      toast.error(t("The coach couldn’t reply", "El coach no pudo responder"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      if (session.current === sessionId) setBusy(false);
    }
  }
  submitRef.current = submit;
  listenRef.current = listen;
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
      endConversation();
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
                  variant={talking ? "bay" : "ghost"}
                  size="sm"
                  onClick={talking ? endConversation : startConversation}
                  disabled={scored || (busy && !talking)}
                  aria-pressed={talking}
                  aria-label={
                    talking
                      ? t("End voice conversation", "Terminar conversación de voz")
                      : t("Start voice conversation", "Iniciar conversación de voz")
                  }
                >
                  {talking ? <MicOff /> : <Mic />}
                  {talking ? t("End voice chat", "Terminar voz") : t("Talk", "Hablar")}
                </Button>
                {talking && (
                  <span className="voice-status" role="status" aria-live="polite">
                    <i className={`voice-dot ${listening ? "live" : ""}`} aria-hidden="true" />
                    {listening
                      ? t(
                          "Listening… pause when you’re done",
                          "Escuchando… haz una pausa al terminar",
                        )
                      : busy
                        ? t("Thinking…", "Pensando…")
                        : speaking
                          ? t("Speaking…", "Hablando…")
                          : t("Your turn", "Tu turno")}
                  </span>
                )}
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
