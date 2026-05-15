'use client'

import { useEffect, useState } from "react"
import { Plus, X, Brain, Zap, Flame, Trophy, BookOpen, ChevronRight, Target, ArrowLeft } from "lucide-react"
import { useRouter,useParams } from "next/navigation"
import { Quizgen } from "@/lib/Prompt"
import { db } from "@/services/firebase"
import { ref, get, set } from "firebase/database"
import { v4 as uuidv4 } from "uuid"
import Quiz from "@/components/Quiz"
import { ToastContainer, toast } from 'react-toastify';

interface Quiz {
  id: string
  name: string
  items: number
  difficulty: "easy" | "medium" | "hard"
  score: number | null
  totalItems: number
  attempts: number,
  timestamp: number
}

const difficultyConfig = {
  easy: {
    label: "Warm Up",
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    borderB: "border-b-green-300",
    badge: "bg-green-100 text-green-700",
    icon: <Brain size={14} />,
    bar: "bg-green-400",
  },
  medium: {
    label: "Brain Flex",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    borderB: "border-b-amber-300",
    badge: "bg-amber-100 text-amber-700",
    icon: <Zap size={14} />,
    bar: "bg-amber-400",
  },
  hard: {
    label: "Mind Crusher",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    borderB: "border-b-red-300",
    badge: "bg-red-100 text-red-700",
    icon: <Flame size={14} />,
    bar: "bg-red-400",
  },
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100)
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444"}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-bold text-gray-700">{pct}%</span>
    </div>
  )
}

function QuizCard({ quiz }: { quiz: Quiz }) {
  const config = difficultyConfig[quiz.difficulty];
  const taken = quiz.attempts !== 0;
  const accuracy = taken ? Math.round((quiz.score! / quiz.totalItems) * 100) : 0;

  const router = useRouter();

  return (
    <div
      className={`bg-white border border-gray-100 border-b-4 ${config.borderB} rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-extrabold text-gray-800 text-base leading-snug">
            {quiz.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <BookOpen size={12} />
            <span>{quiz.items} items</span>
          </div>
        </div>

        <span
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${config.badge}`}
        >
          {config.icon}
          {config.label}
        </span>
      </div>

      {/* Score section */}
      <div className={`${config.bg} rounded-lg p-3`}>
        {taken ? (
          <div className="flex flex-col gap-3">
            {/* Score */}
            <div className="flex justify-between">
              <ScoreRing score={quiz.score || 0} total={quiz.totalItems} />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Your Score</p>
                <p className={`text-xl font-bold ${config.text}`}>
                  {quiz.score}
                  <span className="text-sm font-medium text-gray-400">
                    /{quiz.totalItems}
                  </span>
                </p>
              </div>
            </div>

            {/* Accuracy bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Accuracy</span>
                <span>{accuracy}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-1.5">
                <div
                  className={`${config.bar} h-1.5 rounded-full transition-all`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {/* Performance label */}
            <p className="text-xs text-gray-400">
              {accuracy >= 80
                ? "🏆 Excellent mastery!"
                : accuracy >= 50
                ? "💪 Getting there!"
                : "📚 Keep practicing!"}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <div
              className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm ${config.text}`}
            >
              <Target size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Not attempted yet</p>
              <p className="text-sm font-medium text-gray-500">
                Start your first quiz
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push(`/challenge/${quiz.id}/?type=quiz&attempts=${quiz.attempts}`)}
        className={`
          w-full mt-auto py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2
          transition-all active:scale-95
          ${
            taken
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }
        `}
      >
        {taken ? (
          <>
            <Trophy size={15} /> Retake Quiz
          </>
        ) : (
          <>
            <ChevronRight size={15} /> Take Quiz
          </>
        )}
      </button>
    </div>
  )
}

function AddQuizModal({onSave, onClose, content, quizKey}: { onSave: () => void, onClose: () => void, content: string, quizKey: string }) {
  const [name, setName] = useState("")
  const [items, setItems] = useState<5 | 10 | 20 | null>(null)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  console.log(quizKey);

  const itemOptions = [
    { value: 5,  label: "Quick",    sub: "5 items",  icon: <Zap size={18} /> },
    { value: 10, label: "Standard", sub: "10 items", icon: <Brain size={18} /> },
    { value: 20, label: "Deep",     sub: "20 items", icon: <Flame size={18} /> },
  ]

  const handleGenerate = async () => {
    if(!name.trim() || !items || !difficulty) return toast.error("Please fill in all fields.");

    if (!name.trim()) return setError("Please enter a quiz name.")
    if (!items)       return setError("Please select the number of items.")
    if (!difficulty)  return setError("Please select a difficulty.")

    setError("")

    
    setIsLoading(true)

    const quizID = uuidv4();

    try {
      const res = await fetch("/api/open-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: Quizgen },
            { role: "user", content: "total items: " + items + " difficulty: " + difficulty + " content: " + content  }
          ]
        })
      })

      if (!res.ok) {
        setError("Failed to generate quiz. Please try again.")
        return
      }

      const aiResult = await res.json()
      if (aiResult.error) {
        setError(aiResult.error.message || "Something went wrong. Please try again.")
        return
      }

      await set(ref(db, `quizes/${quizKey}/${quizID}`), {
          id: quizID,
          name,
          items,
          score: 0,
          totalItems: items,
          difficulty,
          attempts: 0,
          timestamp: Date.now(),
      })
      await set(ref (db, `questionaires/${quizID}`), { quizKey , id: quizID, ...JSON.parse(aiResult.result) });

    } catch (err) {
      setError("Something went wrong. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
      onClose()
      onSave()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <ToastContainer/>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800">Create New Quiz</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors btn-anim">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">

          {/* Quiz name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Quiz Name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError("") }}
              placeholder="e.g. Cell Biology Basics"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors bg-gray-50"
            />
          </div>

          {/* Number of items */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Number of Items</label>
            <div className="grid grid-cols-3 gap-2">
              {itemOptions.map(opt => {
                const selected = items === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setItems(opt.value as 5 | 10 | 20); setError("") }}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all 
                      ${selected
                        ? "border-blue-500 bg-blue-50 scale-105"
                        : "border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50"
                      }
                    `}
                  >
                    <span className={selected ? "text-blue-600" : "text-gray-400"}>
                      {opt.icon}
                    </span>
                    <span className={`text-xs font-semibold ${selected ? "text-blue-700" : "text-gray-600"}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{opt.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as const).map(d => {
                const c = difficultyConfig[d]
                const selected = difficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDifficulty(d); setError("") }}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
                      ${c.bg}
                      ${selected
                        ? `border-current ${c.text} scale-105`
                        : "border-transparent opacity-60 hover:opacity-100"
                      }
                    `}
                  >
                    <span className={c.text}>{c.icon}</span>
                    <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{d}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 -mt-1">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1 font-extrabold ">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors btn-anim"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-anim"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Quiz"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QuizPage() {
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();
  const params = useParams();

  const { id } = params;
  const [noteId, quizKey] = (id as string).split("%2C");
  const quizIdKey = noteId + "," + quizKey;


    const [topic, setTopic] = useState("");
    const [title, setTitle] = useState("");
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isRefetch, setIsRefetch] = useState(false);

    useEffect(() => {
      if (!noteId) return;

      const quizRef = ref(db, `quizes/${quizIdKey}`);

      get(quizRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = Object.values(snapshot.val()) as Quiz[];

            const sortedData = data.sort((a, b) => b.timestamp - a.timestamp);

            setQuizzes(sortedData);
          } else {
            console.log("No note data available for quiz");
            setQuizzes([]);
          }
        })
        .catch(console.error);
    }, [noteId, quizIdKey, isRefetch]);

    useEffect(() => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?.uid) return;
  
      const noteRef = ref(db, `notes/${user.uid}/${noteId}/note/About`);
      get(noteRef)
        .then((snapshot) => {
          if (snapshot.exists()) setTopic(snapshot.val());
          else console.log("No note data available");
        })
        .catch(console.error);

      const titleRef = ref(db, `notes/${user.uid}/${noteId}/noteName`);
      get(titleRef)
        .then((snapshot) => {
          if (snapshot.exists()) setTitle(snapshot.val());
          else console.log("No note data available");
        })
        .catch(console.error);
    }, [noteId]);

  if (!quizzes) return;

  const taken = quizzes.filter(q => q?.attempts != 0);

  const avgScore = taken.length
    ? Math.round(taken.reduce((sum, q) => sum + (q.score! / q.totalItems) * 100, 0) / taken.length)
    : 0
  const bestScore = taken.length
    ? Math.max(...taken.map(q => Math.round((q.score! / q.totalItems) * 100)))
    : 0;

  return (
    <div className="w-full min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <button onClick={() => router.back()} className=" btn-anim fixed top-4 left-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-extrabold hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex-shrink-0 anim-btn">
          <ArrowLeft size={16} />
          Back to Note
      </button>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Quizzes</h1>
          <p className="text-sm text-gray-400 mt-1">{title}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-anim flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-extrabold hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex-shrink-0 anim-btn"
        >
          <Plus size={16} />
          Add Quiz
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total Quizzes</p>
          <p className="text-2xl font-bold text-gray-700">{quizzes.length}</p>
        </div>
        <div className="bg-purple-50 border border-blue-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Avg Score</p>
          <p className="text-2xl font-bold text-blue-600">{avgScore}%</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Best Score</p>
          <p className="text-2xl font-bold text-green-600">{bestScore}%</p>
        </div>
      </div>

      {/* Quiz grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map(quiz => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>

      {/* Modal */}
      {showModal && <AddQuizModal onSave={()=> setIsRefetch(!isRefetch) } onClose={() => setShowModal(false)} content={topic} quizKey={quizIdKey} />}
    </div>
  )
}