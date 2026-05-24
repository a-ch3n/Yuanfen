"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type User = {
  id: number;
  phone: string;
  name: string | null;
  age: number | null;
  city: string | null;
  gender: string | null;
  seeking: string | null;
  onboarding_step: string;
  is_complete: boolean;
  is_active: boolean;
  personality: Record<string, any>;
  created_at: string;
};

type Match = {
  id: number;
  user_a_id: number;
  user_b_id: number;
  score: number;
  reasoning: string | null;
  state: string;
  a_response: string | null;
  b_response: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [tab, setTab] = useState<"users" | "matches" | "waitlist">("users");
  const [loading, setLoading] = useState(false);
  const [matchingStatus, setMatchingStatus] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("yuanfen_admin_token");
    if (t) {
      setToken(t);
      tryAuth(t);
    }
  }, []);

  async function tryAuth(t: string) {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/users`, {
        headers: { "X-Admin-Token": t },
      });
      if (r.ok) {
        setAuthed(true);
        localStorage.setItem("yuanfen_admin_token", t);
        await refresh(t);
      }
    } finally {
      setLoading(false);
    }
  }

  async function refresh(t = token) {
    setLoading(true);
    try {
      const [u, m, w] = await Promise.all([
        fetch(`${API}/admin/users`, { headers: { "X-Admin-Token": t } }).then((r) => r.json()),
        fetch(`${API}/admin/matches`, { headers: { "X-Admin-Token": t } }).then((r) => r.json()),
        fetch(`${API}/admin/waitlist`, { headers: { "X-Admin-Token": t } }).then((r) => r.json()),
      ]);
      setUsers(u);
      setMatches(m);
      setWaitlist(w);
    } finally {
      setLoading(false);
    }
  }

  async function runMatching() {
    setMatchingStatus("running…");
    try {
      const r = await fetch(`${API}/admin/run-matching`, {
        method: "POST",
        headers: { "X-Admin-Token": token },
      });
      const data = await r.json();
      setMatchingStatus(`created ${data.created} introduction${data.created === 1 ? "" : "s"}.`);
      await refresh();
    } catch {
      setMatchingStatus("failed.");
    }
  }

  async function deleteUser(id: number) {
    try {
      const r = await fetch(`${API}/admin/users/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": token },
      });
      if (r.ok) {
        await refresh();
      }
    } catch {
      // Silent fail; refresh below would show stale data
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#fffaf0] flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-[2rem] border border-[#d4af37]/30 bg-white/60 backdrop-blur p-8"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-[#b8860b] text-center">
            admin
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#7a1f1f] text-center">
            yuanfen desk
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              tryAuth(token);
            }}
            className="mt-8 space-y-4"
          >
            <input
              type="password"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="admin token"
              className="w-full rounded-full border border-[#d4af37]/50 bg-white/90 px-5 py-3 text-sm outline-none focus:border-[#9b1c1c]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#9b1c1c] px-5 py-3 text-sm font-medium text-[#f8df8e] transition hover:bg-[#7a1515] disabled:opacity-50"
            >
              {loading ? "verifying…" : "enter"}
            </button>
          </form>
          <p className="mt-6 text-xs text-stone-500 text-center">
            dev default: <code className="font-mono">change-me-please</code>
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <nav className="sticky top-0 z-50 border-b border-[#d4af37]/20 bg-[#fffaf0]/75 px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm">
          <a href="/" className="font-semibold tracking-tight text-[#9b1c1c]">
            yuanfen <span className="text-stone-400">/ admin</span>
          </a>
          <div className="flex gap-6 text-stone-500">
            <button onClick={() => refresh()} className="hover:text-[#9b1c1c]">refresh</button>
            <button
              onClick={() => {
                localStorage.removeItem("yuanfen_admin_token");
                setAuthed(false);
              }}
              className="hover:text-[#9b1c1c]"
            >
              sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-3 gap-6 mb-12">
          <Stat label="members" n={users.filter((u) => u.is_complete).length} sub={`${users.length} total`} />
          <Stat label="introductions" n={matches.length} sub={`${matches.filter((m) => m.state === "connected").length} connected`} />
          <Stat label="waitlist" n={waitlist.length} sub="awaiting place" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-6">
            {(["users", "matches", "waitlist"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs uppercase tracking-[0.35em] pb-2 border-b-2 transition ${
                  tab === t
                    ? "border-[#9b1c1c] text-[#7a1f1f]"
                    : "border-transparent text-stone-400 hover:text-[#7a1f1f]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={runMatching}
            className="rounded-full bg-[#9b1c1c] px-5 py-2 text-sm font-medium text-[#f8df8e] transition hover:bg-[#7a1515]"
          >
            run matching
          </button>
        </div>
        {matchingStatus && (
          <p className="mb-6 text-sm text-[#7a1f1f] italic">{matchingStatus}</p>
        )}

        {tab === "users" && <UsersList users={users} onDelete={deleteUser} />}
        {tab === "matches" && <MatchesList matches={matches} users={users} />}
        {tab === "waitlist" && <WaitlistList waitlist={waitlist} />}
      </div>
    </main>
  );
}

function Stat({ label, n, sub }: { label: string; n: number; sub?: string }) {
  return (
    <div className="rounded-[2rem] border border-[#d4af37]/30 bg-white/60 backdrop-blur p-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-[#b8860b]">{label}</p>
      <p className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-[#7a1f1f]">{n}</p>
      {sub && <p className="mt-2 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

function UsersList({ users, onDelete }: { users: User[]; onDelete: (id: number) => void }) {
  if (!users.length) return <Empty label="no members yet." />;
  return (
    <div className="space-y-3">
      {users.map((u) => (
        <details
          key={u.id}
          className="group rounded-2xl border border-[#d4af37]/30 bg-white/60 backdrop-blur px-5 py-4 hover:border-[#d4af37]/60 transition"
        >
          <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-4 flex-1 min-w-0">
              <span className="text-stone-400 text-sm w-8">#{u.id}</span>
              <span className="font-semibold text-[#7a1f1f] truncate">
                {u.name || <span className="italic text-stone-400">unnamed</span>}
              </span>
              <span className="text-stone-500 text-sm truncate">
                {u.age && `${u.age} · `}
                {u.gender && `${u.gender} seeking ${u.seeking || "?"} · `}
                {u.city}
              </span>
              <span className="font-mono text-xs text-stone-400 hidden md:inline">{u.phone}</span>
            </div>
            <span
              className={`text-xs uppercase tracking-[0.25em] px-3 py-1 rounded-full ${
                u.is_complete
                  ? "bg-[#fff2bd] text-[#7a1f1f]"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {u.is_complete ? "complete" : u.onboarding_step}
            </span>
          </summary>
          {u.is_complete && u.personality && Object.keys(u.personality).length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#d4af37]/20">
              <p className="italic text-[#9b1c1c] mb-3">&ldquo;{u.personality.summary}&rdquo;</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                <Trait k="humor" v={u.personality.humor_style} />
                <Trait k="energy" v={u.personality.energy} />
                <Trait k="love" v={u.personality.love_language} />
                <Trait k="openness" v={u.personality.openness?.toFixed?.(2)} />
              </div>
              {u.personality.values && (
                <p className="mt-3 text-sm">
                  <span className="text-stone-500">values: </span>
                  <span className="text-stone-700">{u.personality.values.join(" · ")}</span>
                </p>
              )}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-[#d4af37]/20 flex justify-end">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (confirm(`Permanently delete ${u.name || "this user"} and all their data?`)) {
                  onDelete(u.id);
                }
              }}
              className="text-xs uppercase tracking-[0.25em] text-stone-400 hover:text-[#9b1c1c] transition"
            >
              delete
            </button>
          </div>
        </details>
      ))}
    </div>
  );
}

function Trait({ k, v }: { k: string; v: any }) {
  return (
    <p>
      <span className="text-stone-500">{k}: </span>
      <span className="text-stone-800">{v ?? "—"}</span>
    </p>
  );
}

function MatchesList({ matches, users }: { matches: Match[]; users: User[] }) {
  if (!matches.length) return <Empty label="no introductions yet. click run matching." />;
  const name = (id: number) => users.find((u) => u.id === id)?.name || `#${id}`;
  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border border-[#d4af37]/30 bg-white/60 backdrop-blur px-5 py-4 flex items-start justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#7a1f1f]">
              {name(m.user_a_id)} <span className="text-[#b8860b] mx-2">&amp;</span> {name(m.user_b_id)}
            </p>
            {m.reasoning && (
              <p className="text-sm text-stone-600 mt-1 italic">&ldquo;{m.reasoning}&rdquo;</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
              {m.state.replace(/_/g, " ")}
            </p>
            <p className="text-[10px] text-stone-400 mt-1 font-mono">score {m.score}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WaitlistList({ waitlist }: { waitlist: any[] }) {
  if (!waitlist.length) return <Empty label="no one waiting." />;
  return (
    <div className="space-y-2">
      {waitlist.map((w) => (
        <div
          key={w.id}
          className="rounded-2xl border border-[#d4af37]/30 bg-white/60 backdrop-blur px-5 py-3 flex items-center justify-between gap-4"
        >
          <div className="flex items-baseline gap-4 flex-1 min-w-0">
            <span className="text-stone-400 text-sm w-8">#{w.id}</span>
            {w.phone && <span className="font-mono text-sm text-[#7a1f1f]">{w.phone}</span>}
            {w.email && <span className="text-stone-700 text-sm truncate">{w.email}</span>}
            {w.referral && (
              <span className="italic text-stone-500 text-sm truncate">via {w.referral}</span>
            )}
          </div>
          <span className="text-xs text-stone-400 shrink-0">
            {new Date(w.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#d4af37]/40 bg-white/40 py-20 text-center">
      <p className="italic text-stone-500">{label}</p>
    </div>
  );
}
