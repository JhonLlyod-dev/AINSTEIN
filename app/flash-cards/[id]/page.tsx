'use client'

import { useState, useEffect } from "react"
import { Plus, X, Brain, Zap, Flame, BookOpen, ChevronRight, Trophy, Layers, ArrowLeft } from "lucide-react"
import { useRouter,useParams } from "next/navigation"
import { Flashgen } from "@/lib/Prompt"
import { db } from "@/services/firebase"
import { ref, get, set } from "firebase/database"
import { v4 as uuidv4 } from "uuid"
import FlashCard from "@/components/FlashCard"
import Loading from "@/components/Loading"
import { ToastContainer, toast } from 'react-toastify';

interface FlashCardDeck {
  id: string
  name: string
  totalCards: number
  difficulty: "easy" | "medium" | "hard"
  bestScore: number | null
  lastScore: number | null,
  attempts: number,
  timestamp: number
}

const difficultyConfig = {
  easy: {
    label: "Warm Up",
    bg: "bg-green-50",
    text: "text-green-600",
    borderB: "border-b-green-300",
    badge: "bg-green-100 text-green-700",
    bar: "bg-green-400",
    icon: <Brain size={13} />,
  },
  medium: {
    label: "Brain Flex",
    bg: "bg-amber-50",
    text: "text-amber-600",
    borderB: "border-b-amber-300",
    badge: "bg-amber-100 text-amber-700",
    bar: "bg-amber-400",
    icon: <Zap size={13} />,
  },
  hard: {
    label: "Mind Crusher",
    bg: "bg-red-50",
    text: "text-red-600",
    borderB: "border-b-red-300",
    badge: "bg-red-100 text-red-700",
    bar: "bg-red-400",
    icon: <Flame size={13} />,
  },
}

function DeckCard({ deck }: { deck: FlashCardDeck }) {


  const config = difficultyConfig[deck.difficulty]
  const taken = deck.attempts !== 0;
  const accuracy = taken ? Math.round((deck.bestScore! / deck.totalCards) * 100) : 0;

  const router = useRouter();

  return (
    <div className={`bg-white border border-gray-100 border-b-4 ${config.borderB} rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-4`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-base leading-snug">{deck.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <BookOpen size={12} />
            <span>{deck.totalCards} cards</span>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${config.badge}`}>
          {config.icon}
          {config.label}
        </span>
      </div>

      {/* Score section */}
      <div className={`${config.bg} rounded-lg p-3`}>
        {taken ? (
          <div className="flex flex-col gap-3">

            {/* Best & Last score */}
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Best Score</p>
                <p className={`text-xl font-bold ${config.text}`}>
                  {deck.bestScore}
                  <span className="text-sm font-medium text-gray-400">/{deck.totalCards}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Last Score</p>
                <p className="text-xl font-bold text-gray-600">
                  {deck.lastScore}
                  <span className="text-sm font-medium text-gray-400">/{deck.totalCards}</span>
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
              {accuracy >= 80 ? "🏆 Excellent mastery!" : accuracy >= 50 ? "💪 Getting there!" : "📚 Keep practicing!"}
            </p>

          </div>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm ${config.text}`}>
              <Layers size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Not attempted yet</p>
              <p className="text-sm font-medium text-gray-500">Start your first session</p>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push(`/challenge/${deck.id}?type=flashcards&${deck.attempts}`)}
        className={`
          w-full mt-auto py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2
          transition-all active:scale-95
          ${taken
            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
            : "bg-blue-600 text-white hover:bg-blue-700"
          }
        `}
      >
        {taken ? (
          <><Trophy size={15} /> Practice Again</>
        ) : (
          <><ChevronRight size={15} /> Start Session</>
        )}
      </button>
    </div>
  )
}

function AddDeckModal({ onSave, onClose, content, flashKey }: { onSave: () => void, onClose: () => void, content: string, flashKey: string }) {
  const [name, setName] = useState("")
  const [items, setItems] = useState<5 | 10 | 20 | null>(null)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("");

  const itemOptions = [
    { value: 5,  label: "Quick",    sub: "5 cards",  icon: <Zap size={18} /> },
    { value: 10, label: "Standard", sub: "10 cards", icon: <Brain size={18} /> },
    { value: 20, label: "Deep",     sub: "20 cards", icon: <Flame size={18} /> },
  ]

  const handleGenerate = async () => {
    if (!name.trim() || !items || !difficulty) return toast.error("Please fill in all fields.")

    setError("")
    setIsLoading(true)

    const deckID = uuidv4()

    try {
      const res = await fetch("/api/open-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: Flashgen },
            { role: "user", content: "total cards: " + items + " difficulty: " + difficulty + " content: " + content }
          ]
        })
      })

      if (!res.ok) {
        setError("Failed to generate deck. Please try again.")
        return
      }

      const aiResult = await res.json()
      if (aiResult.error) {
        setError(aiResult.error.message || "Something went wrong. Please try again.")
        return
      }

      await set(ref(db, `flashcards/${flashKey}/${deckID}`), {
        id: deckID,
        name,
        items,
        bestScore: 0,
        lastScore: 0,
        totalCards: items,
        difficulty,
        attempts: 0,
        timestamp: Date.now(),
      })

      await set(ref(db, `decks/${deckID}`), {
        flashKey,
        id: deckID,
        ...JSON.parse(aiResult.result)
      })

      toast.success("Deck generated successfully!")

    } catch (err) {
      setError("Something went wrong. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
      onClose()
      onSave();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <ToastContainer />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800">Create Flashcard Deck</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors btn-anim">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">

          {/* Deck name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Deck Name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError("") }}
              placeholder="e.g. Cell Biology Basics"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors bg-gray-50"
            />
          </div>

          {/* Number of cards */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Number of Cards</label>
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
        <div className="flex gap-3 pt-1 font-extrabold">
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
              "Generate Deck"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FlashCards() {

  const router = useRouter();
  const params = useParams();

  const { id } = params;
  const [noteId, flashKey] = (id as string).split("%2C");
  const combinedId = `${noteId},${flashKey}`;

  const [showModal, setShowModal] = useState(false)
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [flashCards, setFlashCards] = useState<FlashCardDeck[]>([]);
  const [isRefetch, setIsRefetch] = useState(false);

useEffect(() => {
  if (!noteId) return;

  const flashRef = ref(db, `flashcards/${combinedId}`);

  get(flashRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val()) as FlashCardDeck[];
        console.log(data);

        const sortedData = data.sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        );

        setFlashCards(sortedData);
      } else {
        console.log("No note data available for quiz");
        setFlashCards([]);
      }
    })
    .catch(console.error);
}, [noteId, combinedId, isRefetch]);
  
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

    const titleref = ref(db, `notes/${user.uid}/${noteId}/noteName`);
    get(titleref)
      .then((snapshot) => {
        if (snapshot.exists()) setTitle(snapshot.val());
        else console.log("No note data available");
      })
      .catch(console.error);
  }, [noteId]);

  const attempted = flashCards.filter(d => d.attempts !== 0);
  const totalCards = flashCards.reduce((sum, d) => sum + d.totalCards, 0)
  const avgAccuracy = attempted.length
    ? Math.round(attempted.reduce((sum, d) => sum + (d.bestScore! / d.totalCards) * 100, 0) / attempted.length)
    : 0
  const bestAccuracy = attempted.length
    ? Math.max(...attempted.map(d => Math.round((d.bestScore! / d.totalCards) * 100)))
    : 0

  return (
    <div className="w-full min-h-screen px-4 py-8 max-w-6xl mx-auto">

      <button onClick={() => router.back()} className=" fixed top-4 left-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-extrabold hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex-shrink-0 anim-btn">
          <ArrowLeft size={16} />
          Back to Note
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Flash Cards</h1>
          <p className="text-sm text-gray-400 mt-1">{title}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-extrabold hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex-shrink-0 btn-anim"
        >
          <Plus size={16} />
          Add Deck
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total Cards</p>
          <p className="text-2xl font-bold text-gray-700">{totalCards}</p>
        </div>
        <div className="bg-purple-50 border border-blue-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Avg Accuracy</p>
          <p className="text-2xl font-bold text-blue-600">{avgAccuracy}%</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Best Accuracy</p>
          <p className="text-2xl font-bold text-green-600">{bestAccuracy}%</p>
        </div>
      </div>

      {/* Decks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashCards.map(deck => (
          <DeckCard key={deck.id} deck={deck} />
        ))}
      </div>

      {showModal && <AddDeckModal onSave={() => setIsRefetch(!isRefetch)} onClose={() => setShowModal(false)} content={topic} flashKey={combinedId} />}
    </div>
  )
}