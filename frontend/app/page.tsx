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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yuanfen-production-28a5.up.railway.app";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ==========================================================================
// MOTION PRIMITIVES
// ==========================================================================

function Reveal(props: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const delay = props.delay || 0;
  const y = props.y === undefined ? 40 : props.y;
  return (
    <motion.div
      initial={{ opacity: 0, y: y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay: delay, ease: EASE }}
      className={props.className || ""}
    >
      {props.children}
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

function RevealStagger(props: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={staggerParent}
      className={props.className || ""}
    >
      {props.children}
    </motion.div>
  );
}

// ==========================================================================
// SELF-TYPING CHAT (small phone mockup)
// ==========================================================================

type Msg = { from: "mei" | "user"; text: string };

function ChatBubble(props: { msg: Msg }) {
  const isMei = props.msg.from === "mei";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={"flex " + (isMei ? "justify-start" : "justify-end")}
    >
      <div
        className={
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-snug " +
          (isMei
            ? "bg-[#1f1a16] text-[#f4ede0] border border-[#d4af37]/10 rounded-bl-md"
            : "bg-[#a82626] text-[#f4ede0] rounded-br-md")
        }
      >
        {props.msg.text}
      </div>
    </motion.div>
  );
}

function ChatMockup(props: { messages: Msg[]; loop?: boolean }) {
  const loop = props.loop || false;
  const messages = props.messages;
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
      <div className="relative w-[280px] rounded-[36px] border border-[#d4af37]/15 bg-[#0d0a08] shadow-2xl shadow-black/50 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl bg-black z-10" />
        <div className="px-5 pt-3 pb-2 flex justify-between text-[10px] text-[#f4ede0]/70 font-medium">
          <span>9:41</span>
          <span>5G</span>
        </div>
        <div className="px-4 pt-2 pb-3 border-b border-[#1f1a16] flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#a82626] flex items-center justify-center text-[#f4ede0] font-bold text-[10px]">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium leading-tight">mei</p>
            <p className="text-[10px] text-[#d4af37]/60 leading-tight">active now</p>
          </div>
        </div>
        <div className="px-3 py-4 space-y-2 min-h-[380px]">
          <AnimatePresence>
            {messages.slice(0, shown).map((msg, idx) => (
              <ChatBubble key={idx + "-" + (loop ? shown : "once")} msg={msg} />
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
                {[0, 0.15, 0.3].map((d, idx) => (
                  <motion.span
                    key={idx}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: d }}
                    className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/60"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
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
// MESSAGE STACK
// ==========================================================================

function MessageStack() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scrollYProgress = scroll.scrollYProgress;

  const rotL = useTransform(scrollYProgress, [0.2, 0.6], [0, -14]);
  const rotR = useTransform(scrollYProgress, [0.2, 0.6], [0, 14]);
  const xL = useTransform(scrollYProgress, [0.2, 0.6], [0, -80]);
  const xR = useTransform(scrollYProgress, [0.2, 0.6], [0, 80]);
  const yFan = useTransform(scrollYProgress, [0.2, 0.6], [24, 0]);

  return (
    <div ref={ref} className="relative h-[440px] flex items-center justify-center">
      <motion.div
        style={{ rotate: rotL, x: xL, y: yFan }}
        className="absolute w-[220px] rounded-3xl bg-[#a82626] text-[#f4ede0] p-5 shadow-2xl shadow-black/40"
      >
        <p className="text-xs text-[#f4ede0]/70 mb-2">mei · about alex</p>
        <p className="text-[15px] leading-snug">quiet, thoughtful. reads before bed.</p>
      </motion.div>
      <motion.div
        style={{ y: yFan }}
        className="relative z-10 w-[240px] rounded-3xl bg-[#a82626] text-[#f4ede0] p-5 shadow-2xl shadow-black/50"
      >
        <p className="text-xs text-[#f4ede0]/70 mb-2">mei · about sam</p>
        <p className="text-[15px] leading-snug">loves being outside. runs before work.</p>
      </motion.div>
      <motion.div
        style={{ rotate: rotR, x: xR, y: yFan }}
        className="absolute w-[220px] rounded-3xl bg-[#a82626] text-[#f4ede0] p-5 shadow-2xl shadow-black/40"
      >
        <p className="text-xs text-[#f4ede0]/70 mb-2">mei · about j.</p>
        <p className="text-[15px] leading-snug">warm, direct. cooks for people.</p>
      </motion.div>
    </div>
  );
}

// ==========================================================================
// PORTAL SECTION — dive into the phone; inside view self-types on a timer
// ==========================================================================

const portalConversation: Msg[] = [
  { from: "mei", text: "good news — i found someone." },
  { from: "user", text: "ok... tell me about them" },
  { from: "mei", text: "quiet. patient. reads late. laughs easy." },
  { from: "user", text: "what do they care about?" },
  { from: "mei", text: "family. slow mornings. doing things well instead of fast." },
  { from: "user", text: "ok. i'm interested." },
  { from: "mei", text: "sent your intro. i'll let you know." },
  { from: "mei", text: "...they said yes. here's their number 🎉" },
];

function PortalSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  // scroll progress via native listener
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      setProgress(Math.min(1, Math.max(0, -rect.top / total)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const inside = progress >= 0.25 && progress <= 0.9;

  // self-typing timer — same proven mechanism as ChatMockup
  useEffect(() => {
    if (!inside) {
      setMsgCount(0);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i > portalConversation.length) {
        clearInterval(iv);
        return;
      }
      setMsgCount(i);
    }, 900);
    return () => clearInterval(iv);
  }, [inside]);

  // phone scale for the dive
  let phoneScale = 1;
  if (progress < 0.25) phoneScale = 1 + (progress / 0.25) * 5;
  else if (progress > 0.9) phoneScale = 6 - ((progress - 0.9) / 0.1) * 5;
  else phoneScale = 6;

  let shellOpacity = 1;
  if (progress > 0.15 && progress < 0.25) shellOpacity = 1 - (progress - 0.15) / 0.1;
  else if (progress >= 0.25 && progress <= 0.9) shellOpacity = 0;
  else if (progress > 0.9) shellOpacity = Math.min(1, (progress - 0.9) / 0.08);

  const captionOpacity = progress < 0.18 ? 1 - progress / 0.18 : 0;

  return (
    <section ref={ref} className="relative bg-[#0a0807]" style={{ height: "350vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0a0807]">
        {/* ---- DIVE LAYER ---- */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ visibility: inside ? "hidden" : "visible" }}
        >
          <div
            style={{ opacity: captionOpacity }}
            className="absolute top-[10vh] left-0 right-0 text-center px-5 z-30 pointer-events-none"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#d4af37] mb-3">
              step inside
            </p>
            <h3 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.05]">
              keep scrolling —{" "}
              <span className="italic text-[#a82626]">
                see what texting mei feels like.
              </span>
            </h3>
          </div>

          {progress > 0.9 && (
            <div className="absolute bottom-[10vh] left-0 right-0 text-center px-5 z-30 pointer-events-none">
              <p className="text-2xl md:text-4xl font-medium tracking-tight">
                that's the whole app.{" "}
                <span className="italic text-[#d4af37]">that's the point.</span>
              </p>
            </div>
          )}

          <div
            style={{
              transform: "scale(" + phoneScale + ")",
              opacity: shellOpacity,
            }}
            className="relative z-10 will-change-transform"
          >
            <div className="relative w-[280px] rounded-[36px] border border-[#d4af37]/15 bg-[#0d0a08] shadow-2xl shadow-black/50 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl bg-black z-10" />
              <div className="px-5 pt-3 pb-2 flex justify-between text-[10px] text-[#f4ede0]/70 font-medium">
                <span>9:41</span>
                <span>5G</span>
              </div>
              <div className="px-4 pt-2 pb-3 border-b border-[#1f1a16] flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#a82626] flex items-center justify-center text-[#f4ede0] font-bold text-[10px]">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-tight">mei</p>
                  <p className="text-[10px] text-[#d4af37]/60 leading-tight">active now</p>
                </div>
              </div>
              <div className="px-3 py-4 min-h-[320px] flex items-center justify-center">
                <p className="text-[13px] text-[#f4ede0]/40 text-center px-6">
                  good news — i found someone.
                </p>
              </div>
              <div className="px-3 py-3 border-t border-[#1f1a16]">
                <div className="rounded-full bg-[#1f1a16] px-4 py-2 text-[11px] text-[#f4ede0]/40">
                  Message mei...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- INSIDE LAYER — always mounted, toggled with visibility ---- */}
        <div
          className="absolute inset-0 z-20 flex flex-col bg-[#0a0807]"
          style={{ visibility: inside ? "visible" : "hidden" }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#a82626]/[0.07] blur-3xl pointer-events-none" />

          <div className="relative pt-12 pb-4 px-6 border-b border-[#1f1a16] bg-[#0a0807]">
            <div className="mx-auto max-w-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] to-[#a82626] flex items-center justify-center text-[#f4ede0] font-bold text-sm">
                M
              </div>
              <div>
                <p className="text-base font-medium leading-tight">mei</p>
                <p className="text-xs text-[#d4af37]/60 leading-tight">active now</p>
              </div>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden px-6 py-6">
            <div className="mx-auto max-w-lg space-y-3">
              {portalConversation.slice(0, msgCount).map((msg, idx) => {
                const isMei = msg.from === "mei";
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className={"flex " + (isMei ? "justify-start" : "justify-end")}
                  >
                    <div
                      className={
                        "max-w-[80%] rounded-3xl px-5 py-3.5 text-[15px] md:text-[17px] leading-snug " +
                        (isMei
                          ? "bg-[#1f1a16] text-[#f4ede0] border border-[#d4af37]/10 rounded-bl-lg"
                          : "bg-[#a82626] text-[#f4ede0] rounded-br-lg")
                      }
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}
              {msgCount < portalConversation.length && (
                <div className="flex justify-start pl-1">
                  <div className="flex gap-1 py-2.5 px-4 rounded-2xl bg-[#1f1a16]">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-[#d4af37]/60"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.15 }}
                      className="w-2 h-2 rounded-full bg-[#d4af37]/60"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                      className="w-2 h-2 rounded-full bg-[#d4af37]/60"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative px-6 pb-10">
            <div className="mx-auto max-w-lg rounded-full bg-[#1f1a16] px-5 py-3.5 text-sm text-[#f4ede0]/40">
              Message mei...
            </div>
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
      const body = mode === "sms" ? { phone: value } : { email: value };
      const res = await fetch(API_URL + "/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Something went wrong. Try again.");
      setStatus("ok");
    } catch (e) {
      setStatus("err");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-[#d4af37]/30 bg-[#1a1410] px-5 py-4 text-sm text-[#f4ede0]">
        {mode === "sms"
          ? "text mei from your phone anytime — we'll be in touch."
          : "you're on the list. we'll email when it's your turn."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex gap-1 mb-3 text-xs">
        <button
          onClick={() => setMode("sms")}
          className={
            "px-4 py-2 rounded-full transition " +
            (mode === "sms"
              ? "bg-[#d4af37] text-[#0a0807] font-medium"
              : "bg-[#1f1a16] text-[#f4ede0]/60 hover:text-[#f4ede0]")
          }
        >
          SMS
        </button>
        <button
          onClick={() => setMode("email")}
          className={
            "px-4 py-2 rounded-full transition " +
            (mode === "email"
              ? "bg-[#d4af37] text-[#0a0807] font-medium"
              : "bg-[#1f1a16] text-[#f4ede0]/60 hover:text-[#f4ede0]")
          }
        >
          Email
        </button>
      </div>
      <div className="flex items-stretch bg-[#1a1410] rounded-2xl border border-[#d4af37]/15 overflow-hidden">
        <input
          type={mode === "sms" ? "tel" : "email"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
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
      {mode === "sms" ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[#f4ede0]/40">
          By tapping join, you agree to receive SMS from Yuanfen for onboarding and match alerts. Msg &amp; data rates may apply. ~1-10 msgs/week. Reply STOP to opt out, HELP for help. See{" "}
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
  const scroll = useScroll();
  const scrollY = scroll.scrollY;
  const scrollYProgress = scroll.scrollYProgress;
  const progressBar = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const glowY = useTransform(scrollY, [0, 1500], [0, -300]);
  const heroTextY = useTransform(scrollY, [0, 800], [0, -80]);
  const heroTextOpacity = useTransform(scrollY, [0, 500], [1, 0.3]);

  return (
  <main className="grain min-h-screen bg-[#0a0807] text-[#f4ede0]">
  <motion.div
        style={{ scaleX: progressBar }}
        className="fixed left-0 top-0 z-[100] h-[2px] w-full origin-left bg-gradient-to-r from-[#d4af37] via-[#c46060] to-[#a82626]"
      />
      <motion.div
        style={{ y: glowY }}
        className="pointer-events-none fixed left-1/2 -translate-x-1/2 top-[-200px] w-[600px] h-[600px] rounded-full bg-[#d4af37]/[0.05] blur-3xl"
      />
      <motion.div
        style={{ y: glowY }}
        className="pointer-events-none fixed left-[15%] top-[-100px] w-[420px] h-[420px] rounded-full bg-[#a82626]/[0.06] blur-3xl"
      />

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
          <a href="#start" className="px-4 py-2 rounded-full bg-[#a82626] hover:bg-[#8a1a1a] text-[#f4ede0] text-xs font-medium transition">
            text mei
          </a>
        </div>
      </nav>

      <section id="top" className="relative px-5 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-4xl">
          <motion.div style={{ y: heroTextY, opacity: heroTextOpacity }}>
            <Reveal delay={0}>
              <div className="mb-6 flex items-center gap-3 text-[10px] tracking-wider uppercase">
                <span className="rounded-full border border-[#a82626]/50 px-3 py-1 text-[#c46060]">NEW</span>
                <span className="text-[#f4ede0]/50">introducing mei</span>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <h1 className="text-4xl md:text-6xl font-medium leading-[1.05] tracking-tight mb-6">
                ai that learns who you <span className="italic text-[#a82626]">actually</span> are, then matches you.
              </h1>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="text-lg md:text-xl text-[#f4ede0]/60 leading-relaxed mb-10 max-w-xl">
                yuanfen is an sms matchmaker. no photos, no swiping. you text mei, she learns who you are, she introduces you when it's right.
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

      <section className="min-h-[70vh] flex items-center justify-center px-5">
        <div className="max-w-4xl">
          <RevealStagger>
            <motion.p variants={staggerChild} className="text-4xl md:text-6xl font-medium leading-[1.1] tracking-tight text-center">
              somewhere in this city
            </motion.p>
            <motion.p variants={staggerChild} className="text-4xl md:text-6xl font-medium leading-[1.1] tracking-tight text-center italic text-[#a82626]">
              is someone worth actually meeting.
            </motion.p>
            <motion.p variants={staggerChild} className="mt-8 text-lg md:text-xl text-[#f4ede0]/50 text-center max-w-2xl mx-auto">
              but endless swiping was never the fix. feeling understood is.
            </motion.p>
          </RevealStagger>
        </div>
      </section>

      <section id="how" className="px-5 py-24">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <p className="text-xs uppercase tracking-[0.35em] text-[#d4af37] mb-5">mei</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="text-4xl md:text-5xl font-medium leading-[1.05] tracking-tight mb-6">mei learns the real you.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-lg text-[#f4ede0]/70 leading-relaxed max-w-md">
                she picks up what you'd never put on a profile. what actually matters, what you're actually like, who you become on a wednesday night at 10.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <ChatMockup
              loop={true}
              messages={[
                { from: "mei", text: "hey — i'm mei." },
                { from: "mei", text: "tell me about a time recently when you felt most like yourself." },
                { from: "user", text: "walking home late from my sister's place. street was quiet." },
                { from: "mei", text: "who's around when you feel most yourself?" },
              ]}
            />
          </Reveal>
        </div>
      </section>

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

      {/* PORTAL — dive into the phone */}
      <PortalSection />

      <section id="why" className="px-5 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-[#a82626] mb-6">research</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-3xl md:text-5xl font-medium leading-[1.15] tracking-tight mb-8">
              swiping predicts <span className="text-[#a82626]">5%</span> of long-term compatibility.
              <br />
              conversation predicts <span className="text-[#d4af37]">45%</span>.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="text-sm text-[#f4ede0]/50">joel, eastwick, et al. — psychological science, 2020.</p>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-24 border-y border-[#d4af37]/10">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[100px] md:text-[160px] font-serif leading-none text-[#d4af37] mb-6">缘分</p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-xs uppercase tracking-[0.35em] text-[#f4ede0]/50 mb-6">yuánfèn</p>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
              the fated connection between two people — the reason strangers become inevitable.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="faq" className="px-5 py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-12">questions</h2>
          </Reveal>
          <div className="space-y-4">
            {[
              { q: "how does mei actually work?", a: "you text her. she asks questions that don't feel like a survey. over a few days she builds a picture of who you are. when she meets someone she thinks fits, she introduces you — one person at a time." },
              { q: "why no photos?", a: "because photos are what broke the apps. mei matches on who you are, not how you photograph. when it's mutual, we hand over a real phone number — you take it from there." },
              { q: "is this actually just a chatbot?", a: "no. mei is the interface. the matching runs on real research about relationship compatibility, and every intro is a real person she thinks you'd click with." },
              { q: "what if i don't want SMS?", a: "there's an email-only waitlist. no phone number needed. we'll email you when we're ready and you can decide then." },
              { q: "what's the research?", a: "joel, eastwick et al. 2020 — self-reported preferences (the stuff on dating apps) predict about 5% of long-term compatibility. actual back-and-forth predicts closer to 45%. mei is built on the second thing." },
              { q: "who's behind this?", a: "a small team who watched the apps burn out everyone we know. yuanfen is what we wish existed." },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.05} className="border-b border-[#1f1a16] pb-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer py-3 list-none">
                    <span className="text-lg font-medium">{item.q}</span>
                    <span className="text-[#d4af37] text-xl group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-[#f4ede0]/60 leading-relaxed pb-3 pr-8">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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

      <footer className="px-5 py-12 border-t border-[#1f1a16]">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between gap-6 text-xs text-[#f4ede0]/40">
          <div className="flex items-baseline gap-2">
            <span className="text-[#d4af37] text-base">缘</span>
            <span>yuanfen — © 2026</span>
          </div>
          <div className="flex flex-wrap gap-6">
            <a href="/privacy" className="hover:text-[#f4ede0] transition">privacy</a>
            <a href="/terms" className="hover:text-[#f4ede0] transition">terms</a>
            <a href="mailto:hello@joinyuanfen.com" className="hover:text-[#f4ede0] transition">hello@joinyuanfen.com</a>
          </div>
          <p className="max-w-xs md:text-right">
            in crisis? call or text <a href="tel:988" className="underline hover:text-[#f4ede0]">988</a>.
          </p>
        </div>
      </footer>
    </main>
  );
}
