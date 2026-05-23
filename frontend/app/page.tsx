"use client";

import React, { useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function formatPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 10);
  const area = digits.slice(0, 3);
  const mid = digits.slice(3, 6);
  const last = digits.slice(6, 10);
  if (digits.length > 6) return `(${area}) ${mid}-${last}`;
  if (digits.length > 3) return `(${area}) ${mid}`;
  if (digits.length > 0) return `(${area}`;
  return "";
}

function isValidUsPhone(phone: string) {
  return digitsOnly(phone).length === 10;
}

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

const faqs: [string, string][] = [
  ["is this free?", "Joining the waitlist is free. Early users get access first."],
  ["do i need an app?", "No. yuanfen works through SMS."],
  ["is it private?", "Yes. Your profile is never public."],
  ["where is this available?", "US numbers only for now."],
];

const steps: [string, string, string][] = [
  ["01", "answer honestly", "share your values, timing, lifestyle, and what actually matters."],
  ["02", "we look for yuanfen", "the system searches for natural affinity instead of endless options."],
  ["03", "one text arrives", "one person, one reason, one question: yes or no?"],
];

const quotes = [
  "i just want someone who can hold a real conversation.",
  "less swiping, more intention.",
  "one thoughtful intro feels better than fifty random matches.",
  "dating should feel human again.",
];

function WaitlistForm() {
  const [phone, setPhone] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidUsPhone(phone)) {
      setError("enter a valid us phone number");
      return;
    }

    setError("");

    try {
      const res = await fetch(`${API}/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: digitsOnly(phone) }),
      });

      if (res.ok) {
        setJoined(true);
      } else {
        setError("something went wrong");
      }
    } catch (err) {
      setError("backend not running");
    }
  }

  if (joined) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-full border border-[#d4af37]/40 bg-[#fff2bd] px-6 py-4 text-center text-sm font-medium text-[#7a1f1f]"
      >
        you&apos;re on the list.
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex rounded-full border border-[#d4af37]/50 bg-white/90 p-1 shadow-sm backdrop-blur">
        <input
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(555) 123-4567"
          inputMode="tel"
          className="min-w-0 flex-1 rounded-full bg-transparent px-5 py-3 text-sm outline-none"
        />
        <button className="rounded-full bg-[#9b1c1c] px-5 py-3 text-sm font-medium text-[#f8df8e] transition hover:bg-[#7a1515]">
          join
        </button>
      </div>
      <p className={`text-xs ${error ? "text-[#9b1c1c]" : "text-stone-500"}`}>
        {error || "us numbers only"}
      </p>
    </form>
  );
}

function FloatingPhone() {
  const [connected, setConnected] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, rotate: 6, y: 30 }}
      animate={{ opacity: 1, rotate: -2, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-[330px]"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-[2.5rem] border border-[#d4af37]/50 bg-[#240808] p-3 shadow-2xl"
      >
        <div className="rounded-[2rem] bg-[#fffaf0] p-5">
          <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-4 text-xs">
            <span className="font-semibold text-[#9b1c1c]">yuanfen</span>
            <span className="text-stone-400">sms</span>
          </div>
          <div className="mt-5 rounded-3xl bg-white p-5 text-sm leading-6 shadow-sm ring-1 ring-[#d4af37]/20">
            <p className="text-stone-700">quick intro for you.</p>
            <p className="mt-4 text-xl font-semibold text-[#7a1f1f]">Anthony, 21</p>
            <p className="text-[#b8860b]">91% match</p>
            <p className="mt-4 text-stone-600">
              both of you enjoy running, raves, and planning trips ahead of time.
            </p>
            <p className="mt-4 font-medium text-[#7a1f1f]">reply YES to connect · NO to skip</p>
          </div>
          <button
            onClick={() => setConnected(true)}
            className="ml-auto mt-4 block rounded-full bg-[#9b1c1c] px-5 py-2 text-sm text-[#f8df8e]"
          >
            YES
          </button>
          {connected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-3xl bg-[#fff2bd] p-4 text-sm text-[#7a1f1f]"
            >
              connected. go say hi.
            </motion.div>
          )}
        </div>
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -right-6 -top-6 rounded-full border border-[#d4af37]/50 bg-[#fff2bd] px-5 py-3 text-sm font-medium text-[#7a1f1f] shadow-lg"
      >
        93%
      </motion.div>
    </motion.div>
  );
}

function StepRail() {
  return (
    <div className="space-y-8">
      {steps.map(([n, title, body], index) => (
        <motion.div
          key={n}
          initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: index * 0.12 }}
          className="group grid gap-5 rounded-[2rem] border border-[#d4af37]/30 bg-white/60 p-6 text-center backdrop-blur md:grid-cols-[90px_1fr] md:text-left"
        >
          <div className="text-5xl font-semibold tracking-[-0.08em] text-[#d4af37] transition group-hover:scale-110">
            {n}
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-[#7a1f1f]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-[#d4af37]/30">
      {faqs.map(([q, a], i) => (
        <motion.div
          key={q}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-5"
        >
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between text-left text-lg font-medium text-[#7a1f1f]"
          >
            {q}
            <span>{open === i ? "-" : "+"}</span>
          </button>
          {open === i && <p className="mt-3 text-sm leading-6 text-stone-600">{a}</p>}
        </motion.div>
      ))}
    </div>
  );
}

export default function App() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -90]);
  const circleScale = useTransform(scrollYProgress, [0, 0.45], [1, 1.8]);
  const quoteTrack = useMemo(() => [...quotes, ...quotes, ...quotes], []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf0] font-sans text-center text-stone-900">
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed left-0 top-0 z-[100] h-1 w-full origin-left bg-[#9b1c1c]"
      />

      <motion.div
        style={{ scale: circleScale }}
        className="pointer-events-none fixed -right-32 -top-32 h-80 w-80 rounded-full bg-[#d4af37]/20 blur-3xl"
      />
      <div className="pointer-events-none fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#9b1c1c]/10 blur-3xl" />

      <nav className="sticky top-0 z-50 border-b border-[#d4af37]/20 bg-[#fffaf0]/75 px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm">
          <a href="#top" className="font-semibold tracking-tight text-[#9b1c1c]">
            yuanfen
          </a>
          <div className="flex gap-6 text-stone-500">
            <a href="#works" className="hover:text-[#9b1c1c]">how it works</a>
            <a href="#name" className="hover:text-[#9b1c1c]">meaning</a>
            <a href="#faq" className="hover:text-[#9b1c1c]">faq</a>
          </div>
        </div>
      </nav>

      <section id="top" className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-[1.05fr_.95fr] md:items-center md:py-32">
        <motion.div style={{ y: heroY }} className="mx-auto text-center">
          <motion.p initial="hidden" animate="show" variants={fadeUp} className="text-xs uppercase tracking-[0.35em] text-[#b8860b]">
            sms matchmaking · us only
          </motion.p>
          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto mt-6 max-w-4xl text-6xl font-semibold leading-[0.9] tracking-[-0.07em] text-[#7a1f1f] md:text-8xl"
          >
            your person is already on the way.
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto mt-7 max-w-lg text-lg leading-8 text-stone-600"
          >
            a quieter way to date. no endless browsing. no noisy app. just one intentional text when the match feels right.
          </motion.p>
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="mx-auto mt-9 max-w-md">
            <WaitlistForm />
          </motion.div>
        </motion.div>
        <FloatingPhone />
      </section>

      <section id="works" className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-[.75fr_1.25fr] md:items-start">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          className="sticky top-28 hidden text-center md:block"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-[#b8860b]">how it works</p>
          <h2 className="mt-5 text-5xl font-semibold leading-none tracking-[-0.06em] text-[#7a1f1f]">
            three steps. one real intro.
          </h2>
        </motion.div>

        <div>
          <div className="mb-8 text-center md:hidden">
            <p className="text-xs uppercase tracking-[0.35em] text-[#b8860b]">how it works</p>
            <h2 className="mt-5 text-5xl font-semibold leading-none tracking-[-0.06em] text-[#7a1f1f]">
              three steps. one real intro.
            </h2>
          </div>
          <StepRail />
        </div>
      </section>

      <section id="name" className="relative px-5 py-28">
        <div className="mx-auto max-w-5xl rounded-[3rem] border border-[#d4af37]/30 bg-white/60 p-8 text-center backdrop-blur md:p-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.35em] text-[#b8860b]"
          >
            our name
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-6 text-6xl font-semibold tracking-[-0.06em] text-[#7a1f1f] md:text-8xl"
          >
            缘分
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-stone-600"
          >
            Yuanfen is the Chinese idea of a fateful coincidence: the quiet force that brings two people together.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-stone-600"
          >
            romantic, friendly, or fleeting, some connections feel less random than others. yuanfen is built for those moments.
          </motion.p>
        </div>
      </section>

      <section className="overflow-hidden border-y border-[#d4af37]/30 bg-[#7a1f1f] py-12 text-[#fff2bd]">
        <motion.div
          animate={{ x: [0, -900] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-6 px-5"
        >
          {quoteTrack.map((quote, index) => (
            <div
              key={`${quote}-${index}`}
              className="w-[320px] rounded-full border border-[#d4af37]/40 px-6 py-4 text-sm"
            >
              {quote}
            </div>
          ))}
        </motion.div>
      </section>

      <section id="faq" className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-[.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-[#b8860b]">faq</p>
          <h2 className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#7a1f1f]">simple by design.</h2>
        </motion.div>
        <FAQ />
      </section>

      <section className="px-5 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl rounded-[3rem] border border-[#d4af37]/30 bg-white/60 p-8"
        >
          <h2 className="text-4xl font-semibold tracking-[-0.05em] text-[#7a1f1f]">be first to know.</h2>
          <p className="mt-3 text-sm text-stone-600">we&apos;ll text you when yuanfen opens.</p>
          <div className="mt-7">
            <WaitlistForm />
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-[#d4af37]/30 px-5 py-8 text-center text-xs text-stone-500">
        © 2026 yuanfen · us only · privacy · terms
      </footer>
    </main>
  );
}
