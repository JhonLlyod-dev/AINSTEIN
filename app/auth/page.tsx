'use client';

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/services/firebase";
import { set, ref, get } from 'firebase/database'
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { Sparkles, BookOpen, Brain, MessageSquareQuote, ChevronRight } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const existingUser = snapshot.val();
        if (existingUser.status !== "active") {
          toast.error("Your account is disabled. Please contact support.");
          return;
        }
        saveUserAndRedirect(user);
        return;
      }

      await set(userRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
        joinedAt: Date.now(),
        status: "active",
        role: "user",
      });

      saveUserAndRedirect(user, 1000);
    } catch (error) {
      console.error("Error signing in:", error);
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function saveUserAndRedirect(user: any, delay = 0) {
    localStorage.setItem("user", JSON.stringify(user));
    setTimeout(() => router.push("/"), delay);
  }

  const features = [
    {
      icon: <BookOpen size={20} className="text-blue-500" />,
      bg: "bg-blue-50 border-blue-100 border-b-blue-200",
      emoji: "📚",
      title: "Smart Summaries",
      text: "Instantly condense your notes into clear, student-friendly summaries",
    },
    {
      icon: <Brain size={20} className="text-purple-500" />,
      bg: "bg-purple-50 border-purple-100 border-b-purple-200",
      emoji: "🧠",
      title: "AI Flashcards",
      text: "Auto-generate flashcard decks from any material and track your mastery",
    },
    {
      icon: <MessageSquareQuote size={20} className="text-amber-500" />,
      bg: "bg-amber-50 border-amber-100 border-b-amber-200",
      emoji: "✅",
      title: "Interactive Quizzes",
      text: "Test yourself with multiple choice, true/false, and identification questions",
    },
  ]

  const stats = [
    { value: "3x",   label: "Faster studying" },
    { value: "AI",   label: "Powered learning" },
    { value: "100%", label: "Free to start" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex-center flex-col lg:flex-row ">
      <ToastContainer />

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 lg:py-0 lg:max-w-xl">

        {/* Logo + wordmark */}
        <div className="flex items-center gap-3 mb-10">
          <img src="/Ainstein.webp" alt="Ainstein" className="w-12 h-12 rounded-full animate-bounce" />
          <span className="text-xl font-extrabold text-gray-800">Ainstein</span>
          <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-500 flex items-center gap-1">
            <Sparkles size={10} /> AI Powered
          </span>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-3 mb-8">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-800 leading-tight">
            Study smarter,<br />
            <span className="text-blue-500">not harder.</span>
          </h1>
          <p className="text-sm text-gray-400 font-semibold max-w-sm leading-relaxed">
            Upload your notes and let Ainstein do the heavy lifting — summaries, flashcards, and quizzes in seconds.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-10">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center bg-white border border-gray-100 border-b-4 border-b-gray-300 rounded-xl px-4 py-3 flex-1 shadow-sm">
              <p className="text-xl font-extrabold text-blue-500">{s.value}</p>
              <p className="text-[10px] text-gray-400 font-semibold text-center">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Google sign in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex-center gap-3 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 border-b-4 border-blue-800 text-white font-extrabold text-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-anim shadow-sm"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
              <ChevronRight size={16} className="ml-auto" />
            </div>
          )}
        </button>

        <p className="text-center text-[10px] text-gray-300 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────── */}
      <div className=" flex flex-col justify-center px-8 py-12 lg:px-16 lg:py-0 gap-5">

        {/* Section label */}
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
          Everything you need
        </p>

        {/* Feature cards */}
        {features.map((f, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 px-5 py-4 bg-white border border-gray-100 border-b-4 border-b-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 border border-gray-100`}>
              {f.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-gray-800 mb-0.5">{f.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{f.text}</p>
            </div>
          </div>
        ))}

        {/* Bottom mascot card */}
        <div className="flex items-center gap-4 px-5 py-4 bg-blue-50 border border-blue-100 border-b-4 border-b-blue-300 rounded-xl shadow-sm mt-2">
          <img src="/Ainstein.webp" alt="Ainstein" className="w-12 h-12 rounded-full flex-shrink-0" />
          <div>
            <p className="text-sm font-extrabold text-gray-800">Meet Ainstein</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your always-available AI study buddy — ask anything about your notes.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}