"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  AnimatePresence,
  Variants,
} from "framer-motion";

// ==========================================================================
// PALETTE — gold + wine on dark. Wine (#a82626) is a co-primary accent.
// ==========================================================================
// bg          #0a0807
// card        #1a1410
// border      #1f1a16
// cream text  #f4ede0
// gold        #d4af37
// gold light  #e6c25f
// gold muted  #a07426
// wine        #a82626
// wine hover  #8a1a1a
// wine soft   #c46060

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://yuanfen-production-28a5.up.railway.app";

// ==========================================================================
// MOTION PRIMITIVES
// ==========================================================================

// Standard Inyo-style ease: firm start, soft finish
const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  delay = 0,
  y = 40,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

function RevealStagger({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={staggerParent}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==========================================================================
// SELF-TYPING CHAT — triggers on scroll into view
// ==========================================================================

type Msg = { from: "mei" | "user"; text: string };

function ChatBubble({ msg }: { msg: Msg }) {
  const isMei = msg.from === "mei";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`flex ${isMei ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-snug ${
          isMei
            ? "bg-[#1f1a16] text-[#f4ede0] border border-[#d4af37]/10 rounded-bl-md"
            : "bg-[#a82626] text-[#f4ede0] rounded-br-md"
        }`}
      >
        {msg.text}
      </div>
    </motion.div>
  );
}

function ChatMockup({
  messages,
  loop = false,
}: {
  messages: Msg[];
  loop?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: !loop, margin: "-100px" });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    setShown(0);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i > messages.length) {
        if (loop) {
          setTimeout(() => {
            setShown(0);
            i = 0;
          }, 2400);
          return;
        }
        clearInterval(iv);
        return;
      }
      setShown(i);
    }, 1100);
    return () => clearInterval(iv);
  }, [inView, messages, loop]);

  return (
    <div ref={ref} className="w-full flex justify-center">
      {/* iPhone frame */}
      <div className="relative w-[280px] rounded-[36px] border border-[#d4af37]/15 bg-[#0d0a08] shadow-2xl shadow-black/50 overflow-hidden">
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl bg-black z-10" />
        {/* status bar */}
        <div className="px-5 pt-3 pb-2 flex justify-between text-[10px] text-[#f4ede0]/70 font-medium">
          <span>9:41</span>
          <span>••• 5G</span>
        </div>
        {/* header */}
        <div className="px-4 pt-2 pb-3 border-b border-[#1f1a16] flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#a82626] flex items-center justify-center text-[#f4ede0] font-bold text-[10px]">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium leading-tight">mei</p>
            <p className="text-[10px] text-[#d4af37]/60 leading-tight">active now</p>
          </div>
        </div>
        {/* messages */}
        <div className="px-3 py-4 space-y-2 min-h-[380px]">
          <AnimatePresence>
            {messages.slice(0, shown).map((msg, i) => (
              <ChatBubble key={`${i}-${loop ? shown : "once"}`} msg={msg} />
            ))}
          </AnimatePresence>
          {shown < messages.length && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start pl-1"
            >
              <div className="flex gap-1 py-2 px-3 rounded-2xl bg-[#1f1a16]">
                {[0, 0.15, 0.3].map((d, i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: d }}
                    className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/60"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
        {/* input bar */}
        <div className="px-3 py-3 border-t border-[#1f1a16]">
          <div className="rounded-full bg-[#1f1a16] px-4 py-2 text-[11px] text-[#f4ede0]/40">
            Message mei...
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// MESSAGE STACK — Yuanfen's substitute for Inyo's photo card fan
// Three wine-red bubbles fanning out as you scroll
// ==========================================================================

function MessageStack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Cards rotate out from center as user scrolls through
  const rotL = useTransform(scrollYProgress, [0.2, 0.6], [0, -14]);
  const rotR = useTransform(scrollYProgress, [0.2, 0.6], [0, 14]);
  const xL = useTransform(scrollYProgress, [0.2, 0.6], [0, -80]);
  const xR = useTransform(scrollYProgress, [0.2, 0.6], [0, 80]);
  const yFan = useTransform(scrollYProgress, [0.2, 0.6], [24, 0]);

  const cards = [
    { text: "quiet, thoughtful. reads before bed.", tag: "alex" },
    { text: "loves being outside. runs before work.", tag: "sam" },
    { text: "warm, direct. cooks for people.", tag: "j." },
  ];

  return (
    <div ref={ref} className="relative h-[440px] flex items-center justify-center">
      {/* left card */}
      <motion.div
        style={{ rotate: rotL, x: xL, y: yFan }}
        className="absolute w-[220px] rounded-3xl bg-[#a82626] text-[#f4ede0] p-5 shadow-2xl shadow-black/40"
      >
        <p className="text-xs text-[#f4ede0]/70 mb-2">mei · about {cards[0].tag}</p>
        <p className="text-[15px] leading-snug">{cards[0].text}</p>
      </motion.div>
      {/* center card */}
      <motion.div
        style={{ y: yFan }}
        className="relative z-10 w-[240px] rounded-3xl bg-[#a82626] text-[#f4ede0] p-5 shadow-2xl shadow-black/50"
      >
        <p className="text-xs text-[#f4ede0]/70 mb-2">mei · about {cards[1].tag}</p>
        <p className="text-[15px] leading-snug">{cards[1].text}</p>
      </motion.div>
      {/* right card */}
      <motion.div
        style={{ rotate: rotR, x: xR, y: yFan }}
        className="absolute w-[220px] rounded-3xl bg-[#a82626] text-[#f4ede0] p-5 shadow-2xl shadow-black/40"
      >
        <p className="text-xs text-[#f4ede0]/70 mb-2">mei · about {cards[2].tag}</p>
        <p className="text-[15px] leading-snug">{cards[2].text}</p>
      </motion.div>
    </div>
  );
}

// ==========================================================================
// STICKY PHONE — phone pins while text scrolls past in three phases
// ==========================================================================

const stickyMessages: Msg[][] = [
  [
    { from: "mei", text: "good news — i found someone." },
    { from: "mei", text: "want to see who?" },
  ],
  [
    { from: "user", text: "tell me more about her values first" },
    { from: "mei", text: "quiet. patient. reads late." },
  ],
  [
    { from: "mei", text: "you both said yes." },
    { from: "mei", text: "here's her number: (555) 123-4567" },
  ],
];

const stickyCaptions = [
  {
    title: "an intro, not a match.",
    body: "mei asks before sharing anyone. no infinite scroll — one person at a time.",
  },
  {
    title: "ask before you say yes.",
    body: "want to know their values, their communication style, how they spend a saturday? just ask her.",
  },
  {
    title: "when it's mutual, it's real.",
    body: "no swiping, no ghosting mechanics. a real phone number and a real name.",
  },
];

function StickyPhoneSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      if (v < 0.33) setPhase(0);
      else if (v < 0.66) setPhase(1);
      else setPhase(2);
    });
    return () => unsub();
  }, [scrollYProgress]);

  return (
    <section ref={ref} className="relative" style={{ height: "260vh" }}>
      <div className="sticky top-0 h-screen flex items-center px-5 md:px-10">
        <div className="mx-auto w-full max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          {/* Left: captions cross-fade */}
          <div className="relative min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <p className="text-xs uppercase tracking-[0.35em] text-[#d4af37] mb-4">
                  phase {phase + 1} of 3
                </p>
                <h3 className="text-3xl md:text-5xl font-medium leading-[1.05] tracking-tight mb-5">
                  {stickyCaptions[phase].title}
                </h3>
                <p className="text-lg text-[#f4ede0]/70 max-w-md leading-relaxed">
                  {stickyCaptions[phase].body}
                </p>
              </motion.div>
            </AnimatePresence>
            {/* progress dots */}
            <div className="mt-10 flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === phase
                      ? "w-10 bg-[#a82626]"
                      : "w-6 bg-[#f4ede0]/15"
                  }`}
                />
              ))}
            </div>
          </div>
          {/* Right: phone with messages that swap per phase */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <ChatMockup messages={stickyMessages[phase]} loop />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================================================
// WAITLIST FORM — SMS/email toggle preserved for Twilio compliance
// ==========================================================================

function WaitlistForm() {
  const [mode, setMode] = useState<"sms" | "email">("sms");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!value.trim()) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`${API_URL}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "sms" ? { phone: value } : { email: value }),
      });
      if (!res.ok) throw new Error("Something went wrong. Try again.");
      setStatus("ok");
    } catch (e: unknown) {
      setStatus("err");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-[#d4af37]/30 bg-[#1a1410] px-5 py-4 text-sm text-[#f4ede0]">
        {mode === "sms" ? "text mei from your phone anytime — we'll be in touch." : "you're on the list. we'll email when it's your turn."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* toggle */}
      <div className="flex gap-1 mb-3 text-xs">
        <button
          onClick={() => setMode("sms")}
          className={`px-4 py-2 rounded-full transition ${
            mode === "sms"
              ? "bg-[#d4af37] text-[#0a0807] font-medium"
              : "bg-[#1f1a16] text-[#f4ede0]/60 hover:text-[#f4ede0]"
          }`}
        >
          SMS
        </button>
        <button
          onClick={() => setMode("email")}
          className={`px-4 py-2 rounded-full transition ${
            mode === "email"
              ? "bg-[#d4af37] text-[#0a0807] font-medium"
              : "bg-[#1f1a16] text-[#f4ede0]/60 hover:text-[#f4ede0]"
          }`}
        >
          Email
        </button>
      </div>
      {/* input + button */}
      <div className="flex items-stretch bg-[#1a1410] rounded-2xl border border-[#d4af37]/15 overflow-hidden">
        <input
          type={mode === "sms" ? "tel" : "email"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={mode === "sms" ? "(555) 123-4567" : "you@somewhere.com"}
          className="flex-1 bg-transparent px-5 py-3.5 text-sm outline-none placeholder:text-[#f4ede0]/30"
        />
        <button
          onClick={submit}
          disabled={status === "loading"}
          className="px-6 py-3.5 text-sm font-medium text-[#f4ede0] bg-[#a82626] hover:bg-[#8a1a1a] disabled:opacity-50 transition"
        >
          {status === "loading" ? "..." : mode === "sms" ? "text mei" : "join"}
        </button>
      </div>
      {/* consent disclosure — DO NOT REMOVE (Twilio A2P) */}
      {mode === "sms" ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[#f4ede0]/40">
          By tapping join, you agree to receive SMS from Yuanfen for onboarding and match alerts. Msg &amp; data rates may apply. ~1–10 msgs/week. Reply STOP to opt out, HELP for help. See{" "}
          <a href="/privacy" className="underline hover:text-[#d4af37]">privacy</a> and{" "}
          <a href="/terms" className="underline hover:text-[#d4af37]">terms</a>.
        </p>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-[#f4ede0]/40">
          Email waitlist — no SMS required. See{" "}
          <a href="/privacy" className="underline hover:text-[#d4af37]">privacy</a>.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-[#c46060]">{error}</p>}
    </div>
  );
}

// ==========================================================================
// MAIN PAGE
// ==========================================================================

export default function Page() {
  const { scrollY, scrollYProgress } = useScroll();
  const progressBar = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const glowY = useTransform(scrollY, [0, 1500], [0, -300]);
  const heroTextY = useTransform(scrollY, [0, 800], [0, -80]);
  const heroTextOpacity = useTransform(scrollY, [0, 500], [1, 0.3]);

  return (
    <main className="grain min-h-screen bg-[#0a0807] text-[#f4ede0] overflow-x-hidden">
      {/* scroll progress bar */}
      <motion.div
        style={{ scaleX: progressBar }}
        className="fixed left-0 top-0 z-[100] h-[2px] w-full origin-left bg-gradient-to-r from-[#d4af37] via-[#c46060] to-[#a82626]"
      />

      {/* ambient glows — gold + wine, parallax on scroll */}
      <motion.div
        style={{ y: glowY }}
        className="pointer-events-none fixed left-1/2 -translate-x-1/2 top-[-200px] w-[600px] h-[600px] rounded-full bg-[#d4af37]/[0.05] blur-3xl"
      />
      <motion.div
        style={{ y: glowY }}
        className="pointer-events-none fixed left-[15%] top-[-100px] w-[420px] h-[420px] rounded-full bg-[#a82626]/[0.06] blur-3xl"
      />

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[#d4af37]/10 bg-[#0a0807]/85 backdrop-blur-xl px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm">
          <a href="#top" className="flex items-baseline gap-2 font-medium tracking-tight">
            <span className="text-[#d4af37] text-lg">缘</span>
            <span>yuanfen</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-[#f4ede0]/60">
            <a href="#how" className="hover:text-[#f4ede0] transition">how it works</a>
            <a href="#why" className="hover:text-[#f4ede0] transition">why</a>
            <a href="#faq" className="hover:text-[#f4ede0] transition">faq</a>
          </div>
          
            href="#start"
            className="px-4 py-2 rounded-full bg-[#a82626] hover:bg-[#8a1a1a] text-[#f4ede0] text-xs font-medium transition"
          >
            text mei
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section id="top" className="relative px-5 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-4xl">
          <motion.div style={{ y: heroTextY, opacity: heroTextOpacity }}>
            <Reveal delay={0}>
              <div className="mb-6 flex items-center gap-3 text-[10px] tracking-wider uppercase">
                <span className="rounded-full border border-[#a82626]/50 px-3 py-1 text-[#c46060]">
                  NEW
                </span>
                <span className="text-[#f4ede0]/50">introducing mei</span>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <h1 className="text-4xl md:text-6xl font-medium leading-[1.05] tracking-tight mb-6">
                ai that learns who you{" "}
                <span className="italic text-[#a82626]">actually</span> are,
                then matches you.
              </h1>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="text-lg md:text-xl text-[#f4ede0]/60 leading-relaxed mb-10 max-w-xl">
                yuanfen is an sms matchmaker. no photos, no swiping. you text mei,
                she learns who you are, she introduces you when it's right.
              </p>
            </Reveal>
            <Reveal delay={0.45}>
              <div id="start">
                <WaitlistForm />
              </div>
            </Reveal>
          </motion.div>
        </div>
      </section>

      {/* BIG STATEMENT #1 */}
      <section className="min-h-[70vh] flex items-center justify-center px-5">
        <div className="max-w-4xl">
          <RevealStagger>
            <motion.p
              variants={staggerChild}
              className="text-4xl md:text-6xl font-medium leading-[1.1] tracking-tight text-center"
            >
              somewhere in this city
            </motion.p>
            <motion.p
              variants={staggerChild}
              className="text-4xl md:text-6xl font-medium leading-[1.1] tracking-tight text-center italic text-[#a82626]"
            >
              is someone worth actually meeting.
            </motion.p>
            <motion.p
              variants={staggerChild}
              className="mt-8 text-lg md:text-xl text-[#f4ede0]/50 text-center max-w-2xl mx-auto"
            >
              but endless swiping was never the fix. feeling understood is.
            </motion.p>
          </RevealStagger>
        </div>
      </section>

      {/* MEI LEARNS THE REAL YOU — self-typing chat */}
      <section id="how" className="px-5 py-24">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <p className="text-xs uppercase tracking-[0.35em] text-[#d4af37] mb-5">
                mei
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="text-4xl md:text-5xl font-medium leading-[1.05] tracking-tight mb-6">
                mei learns the real you.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-lg text-[#f4ede0]/70 leading-relaxed max-w-md">
                she picks up what you'd never put on a profile. what actually matters,
                what you're actually like, who you become on a wednesday night at 10.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <ChatMockup
              messages={[
                { from: "mei", text: "hey — i'm mei." },
                { from: "mei", text: "tell me about a time recently when you felt most like yourself." },
                { from: "user", text: "walking home late from my sister's place. street was quiet." },
                { from: "mei", text: "who's around when you feel most yourself?" },
              ]}
              loop
            />
          </Reveal>
        </div>
      </section>

      {/* MESSAGE STACK — replaces Inyo's photo fan */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-center mb-4 max-w-3xl mx-auto leading-[1.05]">
              not the right person? that's useful too.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-lg text-[#f4ede0]/60 text-center max-w-2xl mx-auto mb-16">
              pass on an intro and mei doesn't forget. every no sharpens the next yes.
            </p>
          </Reveal>
          <MessageStack />
        </div>
      </section>

      {/* BIG STATEMENT #2 */}
      <section className="min-h-[50vh] flex items-center justify-center px-5">
        <RevealStagger className="max-w-4xl">
          <motion.p
            variants={staggerChild}
            className="text-3xl md:text-5xl font-medium leading-[1.1] tracking-tight text-center"
          >
            a simple chat.
          </motion.p>
          <motion.p
            variants={staggerChild}
            className="text-3xl md:text-5xl font-medium leading-[1.1] tracking-tight text-center italic text-[#d4af37]"
          >
            over a real understanding of you.
          </motion.p>
        </RevealStagger>
      </section>

      {/* STICKY PHONE — three phases scroll past */}
      <StickyPhoneSection />

      {/* RESEARCH */}
      <section id="why" className="px-5 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-[#a82626] mb-6">
              research
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-3xl md:text-5xl font-medium leading-[1.15] tracking-tight mb-8">
              swiping predicts{" "}
              <span className="text-[#a82626]">5%</span> of long-term compatibility.
              <br />
              conversation predicts{" "}
              <span className="text-[#d4af37]">45%</span>.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="text-sm text-[#f4ede0]/50">
              joel, eastwick, et al. — psychological science, 2020.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 缘分 MEANING */}
      <section className="px-5 py-24 border-y border-[#d4af37]/10">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[100px] md:text-[160px] font-serif leading-none text-[#d4af37] mb-6">
              缘分
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-xs uppercase tracking-[0.35em] text-[#f4ede0]/50 mb-6">
              yuánfèn
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
              the fated connection between two people — the reason strangers become
              inevitable.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-12">
              questions
            </h2>
          </Reveal>
          <div className="space-y-4">
            {[
              {
                q: "how does mei actually work?",
                a: "you text her. she asks questions that don't feel like a survey. over a few days she builds a picture of who you are. when she meets someone she thinks fits, she introduces you — one person at a time.",
              },
              {
                q: "why no photos?",
                a: "because photos are what broke the apps. mei matches on who you are, not how you photograph. when it's mutual, we hand over a real phone number — you take it from there.",
              },
              {
                q: "is this actually just a chatbot?",
                a: "no. mei is the interface. the matching runs on real research about relationship compatibility, and every intro is a real person she thinks you'd click with.",
              },
              {
                q: "what if i don't want SMS?",
                a: "there's an email-only waitlist. no phone number needed. we'll email you when we're ready and you can decide then.",
              },
              {
                q: "what's the research?",
                a: "joel, eastwick et al. 2020 — self-reported preferences (the stuff on dating apps) predict about 5% of long-term compatibility. actual back-and-forth predicts closer to 45%. mei is built on the second thing.",
              },
              {
                q: "who's behind this?",
                a: "a small team who watched the apps burn out everyone we know. yuanfen is what we wish existed.",
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.05} className="border-b border-[#1f1a16] pb-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer py-3 list-none">
                    <span className="text-lg font-medium">{item.q}</span>
                    <span className="text-[#d4af37] text-xl group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="text-[#f4ede0]/60 leading-relaxed pb-3 pr-8">
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <h2 className="text-5xl md:text-7xl font-medium leading-[1.05] tracking-tight mb-10">
              your person is out there.
              <br />
              <span className="italic text-[#a82626]">let mei find them.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex justify-center">
              <WaitlistForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 py-12 border-t border-[#1f1a16]">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between gap-6 text-xs text-[#f4ede0]/40">
          <div className="flex items-baseline gap-2">
            <span className="text-[#d4af37] text-base">缘</span>
            <span>yuanfen — © 2026</span>
          </div>
          <div className="flex flex-wrap gap-6">
            <a href="/privacy" className="hover:text-[#f4ede0] transition">privacy</a>
            <a href="/terms" className="hover:text-[#f4ede0] transition">terms</a>
            <a href="mailto:hello@joinyuanfen.com" className="hover:text-[#f4ede0] transition">
              hello@joinyuanfen.com
            </a>
          </div>
          <p className="max-w-xs md:text-right">
            in crisis? call or text{" "}
            <a href="tel:988" className="underline hover:text-[#f4ede0]">988</a>.
          </p>
        </div>
      </footer>
    </main>
  );
}
