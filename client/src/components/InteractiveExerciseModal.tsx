import React, { useState, useEffect } from "react";
import { Wind, Activity, Brain, Clock3, X, ChevronRight, ChevronLeft, Check, Sparkles, Volume2, Play, Pause, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface InteractiveExerciseModalProps {
  exerciseName: string;
  onClose: () => void;
  onSaveReframing?: (text: string) => void;
}

export default function InteractiveExerciseModal({ exerciseName, onClose, onSaveReframing }: InteractiveExerciseModalProps) {
  // Determine mode based on name
  const isBoxBreathing = exerciseName.toLowerCase().includes("box") || exerciseName.toLowerCase().includes("breathing");
  const isGrounding = exerciseName.toLowerCase().includes("grounding") || exerciseName.includes("5-4-3-2-1");
  const isReframing = exerciseName.toLowerCase().includes("reframing") || exerciseName.toLowerCase().includes("thought");
  const isSleepReset = exerciseName.toLowerCase().includes("sleep") || exerciseName.toLowerCase().includes("wind-down");

  // --- 1. BOX BREATHING STATE ---
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [breathCount, setBreathCount] = useState(4);
  const [cycleCount, setCycleCount] = useState(1);
  const [breathPaused, setBreathPaused] = useState(false);

  useEffect(() => {
    if (!isBoxBreathing || breathPaused) return;
    const interval = setInterval(() => {
      setBreathCount((prev) => {
        if (prev > 1) return prev - 1;
        // Move to next phase
        if (breathPhase === "Inhale") {
          setBreathPhase("Hold");
          return 4;
        } else if (breathPhase === "Hold") {
          setBreathPhase("Exhale");
          return 4;
        } else if (breathPhase === "Exhale") {
          setBreathPhase("Pause");
          return 4;
        } else {
          setBreathPhase("Inhale");
          setCycleCount((c) => (c >= 4 ? 1 : c + 1));
          return 4;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBoxBreathing, breathPhase, breathPaused]);

  // --- 2. GROUNDING 5-4-3-2-1 STATE ---
  const [groundingStep, setGroundingStep] = useState(5);
  const [groundingInputs, setGroundingInputs] = useState<Record<number, string[]>>({
    5: ["Desk lamp", "Computer screen", "Window light", "Coffee mug", "Notebook"],
    4: ["Soft sweater texture", "Desk surface", "Feet resting on floor", "Chair back support"],
    3: ["Fan humming", "Distorted ambient chatter", "Keyboard keystrokes"],
    2: ["Fresh morning air", "Warm tea aroma"],
    1: ["Clean water taste"],
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  // --- 3. THOUGHT REFRAMING STATE ---
  const [reframeStep, setReframeStep] = useState(1);
  const [worryText, setWorryText] = useState("I feel overwhelmed by midterms and I'm afraid I'll fail.");
  const [selectedDistortion, setSelectedDistortion] = useState("Catastrophizing");
  const [balancedText, setBalancedText] = useState("Midterms are challenging, but I have prepared well and can take it one step at a time.");

  // --- 4. SLEEP RESET STATE ---
  const [sleepPhase, setSleepPhase] = useState(1);
  const [bodyZone, setBodyZone] = useState(0);
  const bodyZones = [
    { title: "Shoulders & Neck", tip: "Release muscle tension, drop shoulders away from ears, unclench neck." },
    { title: "Jaw & Facial Muscles", tip: "Unclench teeth, relax your forehead, smooth out facial expressions." },
    { title: "Arms & Hands", tip: "Rest hands heavy on your lap, release grip tension completely." },
    { title: "Torso & Deep Belly", tip: "Allow your abdomen to rise and fall naturally with slow breathing." },
    { title: "Legs & Feet", tip: "Feel the support beneath your feet, letting lower body rest heavy." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18314a]/45 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[540px] rounded-3xl bg-white p-6 md:p-8 text-center shadow-[0_25px_80px_rgba(24,49,74,.35)] relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isBoxBreathing ? "bg-[#e5f3f1] text-[#2f9c95]" :
              isGrounding ? "bg-[#eeeaf8] text-[#80668b]" :
              isReframing ? "bg-[#fdf0e3] text-[#b87837]" :
              "bg-[#edf1f7] text-[#667c99]"
            }`}>
              {isBoxBreathing && <Wind size={18} />}
              {isGrounding && <Activity size={18} />}
              {isReframing && <Brain size={18} />}
              {isSleepReset && <Clock3 size={18} />}
            </div>
            <div className="text-left">
              <div className="text-[15px] font-extrabold text-[#18314a]">{exerciseName}</div>
              <div className="text-[10px] font-bold uppercase tracking-[.06em] text-[#829297]">
                {isBoxBreathing ? "Nervous System Reset" :
                 isGrounding ? "Sensory Reorientation" :
                 isReframing ? "Cognitive Perspective Shift" :
                 "Bedtime Relaxation Protocol"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#88979c] hover:bg-[#f2f6f4] hover:text-[#18314a] transition">
            <X size={20} />
          </button>
        </div>

        {/* --- 1. BOX BREATHING MODAL CONTENT --- */}
        {isBoxBreathing && (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="text-[11px] font-bold text-[#839399] uppercase tracking-[.08em] mb-4">
              Cycle {cycleCount} of 4 · 4-4-4-4 Rhythm
            </div>

            {/* Breathing Animation Circle */}
            <div className="relative flex h-48 w-48 items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  breathPhase === "Inhale"
                    ? "scale-110 bg-[#c7e9e2] opacity-80"
                    : breathPhase === "Hold"
                    ? "scale-110 bg-[#2f9c95] opacity-20 animate-pulse"
                    : breathPhase === "Exhale"
                    ? "scale-90 bg-[#dbeae6] opacity-60"
                    : "scale-95 bg-[#eaf4f2] opacity-40"
                }`}
              />
              <div className="relative z-10 flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-md border border-[#d8e6e2]">
                <span className="text-[40px] font-extrabold text-[#18314a] leading-none">{breathCount}</span>
                <span className="mt-1 text-[13px] font-bold text-[#23645f]">{breathPhase}</span>
              </div>
            </div>

            <p className="mt-6 text-[13px] font-medium text-[#566972] max-w-[320px]">
              {breathPhase === "Inhale" && "Breathe in slowly and deeply through your nose..."}
              {breathPhase === "Hold" && "Hold your breath calmly without straining..."}
              {breathPhase === "Exhale" && "Release slowly and steadily through your mouth..."}
              {breathPhase === "Pause" && "Pause briefly and rest before the next cycle..."}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setBreathPaused(!breathPaused)}
                className="rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-4 py-2 text-[12px] font-bold text-[#50616d] hover:bg-[#edf3f1]"
              >
                {breathPaused ? <Play size={14} className="inline mr-1" /> : <Pause size={14} className="inline mr-1" />}
                {breathPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={() => {
                  setBreathPhase("Inhale");
                  setBreathCount(4);
                  setCycleCount(1);
                  setBreathPaused(false);
                }}
                className="rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-4 py-2 text-[12px] font-bold text-[#50616d] hover:bg-[#edf3f1]"
              >
                <RefreshCw size={14} className="inline mr-1" /> Reset
              </button>
            </div>
          </div>
        )}

        {/* --- 2. GROUNDING 5-4-3-2-1 MODAL CONTENT --- */}
        {isGrounding && (
          <div className="py-6 text-left">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-3 mb-4">
              <span className="text-[12px] font-bold text-[#23645f]">
                Step {6 - groundingStep} of 5: Notice {groundingStep} {
                  groundingStep === 5 ? "things you can SEE" :
                  groundingStep === 4 ? "things you can TOUCH" :
                  groundingStep === 3 ? "things you can HEAR" :
                  groundingStep === 2 ? "things you can SMELL" :
                  "thing you can TASTE"
                }
              </span>
              <span className="text-[11px] font-mono text-[#819196]">{Math.round(((6 - groundingStep) / 5) * 100)}%</span>
            </div>

            <p className="text-[12px] text-[#637780] mb-4">
              {groundingStep === 5 && "Look around your environment and check off 5 distinct visual objects:"}
              {groundingStep === 4 && "Focus on physical contact points and tactile sensations around you:"}
              {groundingStep === 3 && "Listen closely to ambient auditory cues in your immediate space:"}
              {groundingStep === 2 && "Pay attention to subtle aromas or scents in the air:"}
              {groundingStep === 1 && "Notice any remaining taste or take a slow sip of water:"}
            </p>

            <div className="space-y-2.5 my-4">
              {(groundingInputs[groundingStep] || []).map((item, idx) => {
                const isDone = checkedItems[`${groundingStep}-${idx}`];
                return (
                  <button
                    key={idx}
                    onClick={() => toggleCheck(`${groundingStep}-${idx}`)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-[12px] font-medium transition ${
                      isDone
                        ? "border-[#2f9c95] bg-[#edf7f4] text-[#1b4e4a]"
                        : "border-[#e0e7e4] bg-[#fbfdfc] text-[#33464e] hover:border-[#b8cfc8]"
                    }`}
                  >
                    <span>{item}</span>
                    <div className={`flex h-5 w-5 items-center justify-center rounded-lg border ${
                      isDone ? "border-[#2f9c95] bg-[#2f9c95] text-white" : "border-[#c4d4ce]"
                    }`}>
                      {isDone && <Check size={12} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-[#edf1ef]">
              <button
                disabled={groundingStep === 5}
                onClick={() => setGroundingStep((s) => Math.min(5, s + 1))}
                className="rounded-xl border border-[#dfe6e3] px-3.5 py-2 text-[12px] font-bold text-[#556972] disabled:opacity-40"
              >
                Previous Step
              </button>
              {groundingStep > 1 ? (
                <button
                  onClick={() => setGroundingStep((s) => Math.max(1, s - 1))}
                  className="btn btn-teal rounded-xl px-5 py-2 text-[12px] font-bold flex items-center gap-1"
                >
                  Next Step <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    toast.success("Grounding 5-4-3-2-1 completed! You feel more present.");
                    onClose();
                  }}
                  className="btn btn-teal rounded-xl px-5 py-2 text-[12px] font-bold flex items-center gap-1"
                >
                  Complete Exercise <Check size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- 3. THOUGHT REFRAMING MODAL CONTENT --- */}
        {isReframing && (
          <div className="py-6 text-left">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-3 mb-4">
              <span className="text-[12px] font-bold text-[#b87837]">
                Cognitive Step {reframeStep} of 3: {
                  reframeStep === 1 ? "Identify Distressing Thought" :
                  reframeStep === 2 ? "Recognize Cognitive Bias" :
                  "Construct Balanced Reframe"
                }
              </span>
            </div>

            {reframeStep === 1 && (
              <div className="space-y-4">
                <p className="text-[12px] text-[#637780]">
                  Write out the specific worry or recurring thought causing stress right now:
                </p>
                <textarea
                  value={worryText}
                  onChange={(e) => setWorryText(e.target.value)}
                  className="w-full min-h-[90px] rounded-2xl border border-[#dfe6e3] bg-[#fbfdfc] p-3.5 text-[12px] leading-5 outline-none focus:border-[#2f9c95]"
                  placeholder="e.g., I have so much coursework left, I'm definitely going to fall behind..."
                />
                <button
                  onClick={() => setReframeStep(2)}
                  className="btn btn-teal w-full rounded-xl py-2.5 text-[12px] font-bold flex items-center justify-center gap-1"
                >
                  Examine Evidence <ChevronRight size={14} />
                </button>
              </div>
            )}

            {reframeStep === 2 && (
              <div className="space-y-4">
                <p className="text-[12px] text-[#637780]">
                  Is this thought affected by any common cognitive distortions? Select one:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["Catastrophizing", "Expecting the absolute worst outcome"],
                    ["All-or-Nothing", "Viewing situations in black & white"],
                    ["Mind Reading", "Assuming others hold negative views"],
                    ["Overgeneralization", "Single setback applies to everything"],
                  ].map(([label, desc]) => (
                    <button
                      key={label}
                      onClick={() => setSelectedDistortion(label)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedDistortion === label
                          ? "border-[#b87837] bg-[#fdf0e3] text-[#7a481c]"
                          : "border-[#e0e7e4] bg-[#fbfdfc] text-[#556972]"
                      }`}
                    >
                      <div className="text-[12px] font-bold">{label}</div>
                      <div className="text-[10px] text-[#88979c] mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReframeStep(1)}
                    className="rounded-xl border border-[#dfe6e3] px-4 py-2.5 text-[12px] font-bold text-[#556972]"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setReframeStep(3)}
                    className="btn btn-teal flex-1 rounded-xl py-2.5 text-[12px] font-bold flex items-center justify-center gap-1"
                  >
                    Build Balanced Reframe <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {reframeStep === 3 && (
              <div className="space-y-4">
                <p className="text-[12px] text-[#637780]">
                  Reframe this thought with a balanced, compassionate, and realistic perspective:
                </p>
                <textarea
                  value={balancedText}
                  onChange={(e) => setBalancedText(e.target.value)}
                  className="w-full min-h-[90px] rounded-2xl border border-[#dfe6e3] bg-[#fbfdfc] p-3.5 text-[12px] leading-5 outline-none focus:border-[#2f9c95]"
                />
                <div className="rounded-2xl bg-[#edf7f4] p-3 border border-[#cbe4dd] text-[11px] leading-5 text-[#23645f]">
                  <strong>Reframed Mindset:</strong> "{balancedText}"
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReframeStep(2)}
                    className="rounded-xl border border-[#dfe6e3] px-4 py-2.5 text-[12px] font-bold text-[#556972]"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (onSaveReframing) onSaveReframing(balancedText);
                      toast.success("Reframed perspective saved to reflections!");
                      onClose();
                    }}
                    className="btn btn-teal flex-1 rounded-xl py-2.5 text-[12px] font-bold flex items-center justify-center gap-1"
                  >
                    Save & Finish <Check size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 4. SLEEP RESET WIND-DOWN MODAL CONTENT --- */}
        {isSleepReset && (
          <div className="py-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-3">
              <span className="text-[12px] font-bold text-[#667c99]">
                Body Zone {bodyZone + 1} of {bodyZones.length}: {bodyZones[bodyZone].title}
              </span>
              <span className="text-[11px] font-mono text-[#8a9aa8]">8 min wind-down</span>
            </div>

            <div className="rounded-3xl bg-[#0f2133] p-6 text-center text-white shadow-inner">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1c3854] text-[#86a8cf] animate-pulse">
                <Clock3 size={32} />
              </div>
              <h3 className="mt-4 text-[16px] font-bold text-[#e1ebf5]">{bodyZones[bodyZone].title}</h3>
              <p className="mt-2 text-[12px] leading-6 text-[#9bb3cc]">
                {bodyZones[bodyZone].tip}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#edf1ef]">
              <button
                disabled={bodyZone === 0}
                onClick={() => setBodyZone((z) => Math.max(0, z - 1))}
                className="rounded-xl border border-[#dfe6e3] px-3.5 py-2 text-[12px] font-bold text-[#556972] disabled:opacity-40"
              >
                Previous Zone
              </button>
              {bodyZone < bodyZones.length - 1 ? (
                <button
                  onClick={() => setBodyZone((z) => Math.min(bodyZones.length - 1, z + 1))}
                  className="btn btn-teal rounded-xl px-5 py-2 text-[12px] font-bold flex items-center gap-1"
                >
                  Next Zone <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    toast.success("Sleep wind-down protocol completed. Rest well!");
                    onClose();
                  }}
                  className="btn btn-teal rounded-xl px-5 py-2 text-[12px] font-bold flex items-center gap-1"
                >
                  Finish Sleep Wind-down <Check size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer close button for Box Breathing */}
        {isBoxBreathing && (
          <button
            onClick={() => {
              toast.success("Box breathing session completed!");
              onClose();
            }}
            className="btn btn-teal mt-2 w-full rounded-xl py-3 text-[12px] font-bold"
          >
            Finish Exercise
          </button>
        )}

      </div>
    </div>
  );
}
