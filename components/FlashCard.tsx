'use client'
import { useEffect, useState } from "react"
import { Check, X, RotateCcw, CheckCircle, XCircle, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface FlashCardData {
  question: string
  answer: string
}

interface FlashCardProps {
  flash: FlashCardData[]
  onComplete: (score: number) => void
}

export default function FlashCard({ flash, onComplete }: FlashCardProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<boolean[]>(new Array(flash.length).fill(null))
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  const router = useRouter();

  const currentCard = flash[currentCardIndex]
  const progress = ((currentCardIndex + 1) / flash.length) * 100
  const pct = Math.round((score / flash.length) * 100)

  function soundEffect(finalScore: number) {
    const audio = new Audio(finalScore / flash.length >= 0.7 ? "/success.mp3" : "/failed.mp3")
    audio.play()
  }

  useEffect(() => {
    if (showResults) soundEffect(score)
  }, [showResults])

  function handleAnswer(isCorrect: boolean) {
    const updated = [...userAnswers]
    updated[currentCardIndex] = isCorrect
    setUserAnswers(updated)

    if (currentCardIndex < flash.length - 1) {
      setTimeout(() => setCurrentCardIndex(i => i + 1), 300)
    } else {
      setTimeout(() => {
        const correct = updated.filter(a => a === true).length
        setScore(correct)
        setShowResults(true)
        onComplete(correct)
      }, 300)
    }
  }

  function resetFlashCards() {
    setCurrentCardIndex(0)
    setUserAnswers(new Array(flash.length).fill(null))
    setShowResults(false)
    setScore(0)
  }

  // ── Results screen ────────────────────────────────────────────
  if (showResults) {
    const excellent = pct >= 80
    const passing   = pct >= 50

    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">

          {/* Score ring */}
          <div className="relative flex items-center justify-center">
            <svg width="160" height="160" className="-rotate-90">
              <circle cx="80" cy="80" r="68" fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle
                cx="80" cy="80" r="68" fill="none"
                stroke={excellent ? "#22c55e" : passing ? "#f59e0b" : "#ef4444"}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 68}
                strokeDashoffset={2 * Math.PI * 68 * (1 - pct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-gray-800">{pct}%</span>
              <span className="text-xs text-gray-400 font-medium">{score}/{flash.length}</span>
            </div>
          </div>

          {/* Result label */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-800">
              {excellent ? "Excellent Work! 🏆" : passing ? "Good Effort! 💪" : "Keep Studying! 📚"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              You got {score} out of {flash.length} correct
            </p>
          </div>

          {/* Per-card breakdown */}
          <div className="w-full bg-white border border-gray-100 border-b-4 border-b-purple-300 rounded-xl shadow-sm p-5 flex flex-col gap-3 max-h-72 overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Review</p>
            {flash.map((card, i) => {
              const correct = userAnswers[i] === true
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${correct ? "bg-green-50" : "bg-red-50"}`}>
                  <span className={`mt-0.5 flex-shrink-0 ${correct ? "text-green-500" : "text-red-500"}`}>
                    {correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      Q{i + 1}: {card.question}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      Answer: <span className="font-medium text-gray-600">{card.answer}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}

          <div className="w-full flex gap-6">
            <button
              onClick={() => router.back()}
              className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              < ChevronLeft size={17} /> Back to Decks
            </button>

            <button
              onClick={resetFlashCards}
              className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <RotateCcw size={17} /> Review Again
            </button>
          </div>


        </div>
      </div>
    )
  }

  // ── Flashcard screen ──────────────────────────────────────────
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg flex flex-col items-center gap-6">

        {/* Progress */}
        <div className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 mb-1">
          <span>Card {currentCardIndex + 1} of {flash.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 -mt-4">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <Card card={currentCard} />

        {/* Wrong / Correct buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => handleAnswer(false)}
            disabled={userAnswers[currentCardIndex] !== null}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 font-black text-sm hover:bg-red-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={20} strokeWidth={3} /> Wrong
          </button>
          <button
            onClick={() => handleAnswer(true)}
            disabled={userAnswers[currentCardIndex] !== null}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-green-50 border-2 border-green-200 text-green-600 font-black text-sm hover:bg-green-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={20} strokeWidth={3} /> Correct
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {flash.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                userAnswers[i] === true
                  ? "w-2.5 h-2.5 bg-green-400"
                  : userAnswers[i] === false
                  ? "w-2.5 h-2.5 bg-red-400"
                  : i === currentCardIndex
                  ? "w-5 h-2.5 bg-purple-500"
                  : "w-2.5 h-2.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

function Card({ card }: { card: FlashCardData }) {
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => { setIsFlipped(false) }, [card])

  function handleFlip() {
    const audio = new Audio("/flip.mp3")
    audio.play()
    setIsFlipped(f => !f)
  }

  return (
    <div
      className="w-full h-72 [perspective:1000px] cursor-pointer"
      onClick={handleFlip}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front — Question */}
        <div className="absolute w-full h-full [backface-visibility:hidden]">
          <div className="w-full h-full bg-white border border-gray-100 border-b-4 border-b-purple-300 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
              Question
            </span>
            <p className="text-center text-gray-800 text-lg font-extrabold px-4 leading-snug">
              {card.question}
            </p>
            <span className="text-xs text-gray-300 mt-auto">Tap to reveal answer</span>
          </div>
        </div>

        {/* Back — Answer */}
        <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="w-full h-full bg-purple-600 border border-purple-700 border-b-4 border-b-purple-900 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-500 text-purple-100 border border-purple-400">
              Answer
            </span>
            <p className="text-center text-white text-lg font-extrabold px-4 leading-snug">
              {card.answer}
            </p>
            <span className="text-xs text-purple-300 mt-auto">Tap to see question</span>
          </div>
        </div>
      </div>
    </div>
  )
}