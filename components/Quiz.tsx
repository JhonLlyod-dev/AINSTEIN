import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Send, RotateCcw, Trophy, XCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuizQuestion {
  answer: string
  options: string[]
  question: string
  questionType: "T&F" | "Multiple Choice" | "Identification"
}

interface QuizProps {
  quiz: QuizQuestion[]
  onComplete: (score: number) => void
}

export default function Quiz({ quiz, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(quiz.length).fill(""))
  const [score, setScore] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)

  const router = useRouter()


  const currentQuestion = quiz[currentQuestionIndex]
  const currentAnswer   = userAnswers[currentQuestionIndex]
  const progress        = ((currentQuestionIndex + 1) / quiz.length) * 100

  function soundEffect(finalScore: number) {
    const audio = new Audio(finalScore / quiz.length >= 0.7 ? "/success.mp3" : "/failed.mp3")
    audio.play()
  }

  useEffect(() => {
    if (showResults && score !== null) soundEffect(score)
  }, [showResults])

  const handleAnswerChange = (answer: string) => {
    const updated = [...userAnswers]
    updated[currentQuestionIndex] = answer
    setUserAnswers(updated)
  }

  const handleNext = () => {
    if (currentQuestionIndex < quiz.length - 1)
      setCurrentQuestionIndex(i => i + 1)
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0)
      setCurrentQuestionIndex(i => i - 1)
  }

  const handleSubmit = () => {
    let correct = 0
    quiz.forEach((q, i) => {
      if (userAnswers[i].trim().toLowerCase() === q.answer.trim().toLowerCase())
        correct++
    })
    setScore(correct)
    setShowResults(true)
    onComplete(correct)
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setUserAnswers(new Array(quiz.length).fill(""))
    setScore(null)
    setShowResults(false)
  }

  const pct = score !== null ? Math.round((score / quiz.length) * 100) : 0

  // ── Results screen ────────────────────────────────────────────
  if (showResults && score !== null) {
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
              <span className="text-xs text-gray-400 font-medium">{score}/{quiz.length}</span>
            </div>
          </div>

          {/* Result label */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-800">
              {excellent ? "Excellent Work! 🏆" : passing ? "Good Effort! 💪" : "Keep Studying! 📚"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              You got {score} out of {quiz.length} correct
            </p>
          </div>

          {/* Per-question breakdown */}
          <div className="w-full bg-white border border-gray-100 border-b-4 border-b-gray-300 rounded-xl shadow-sm p-5 flex flex-col gap-3 max-h-82 overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Review</p>
            {quiz.map((q, i) => {
              const correct = userAnswers[i].trim().toLowerCase() === q.answer.trim().toLowerCase()
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${correct ? "bg-green-50" : "bg-red-50"}`}>
                  <span className={`mt-0.5 flex-shrink-0 ${correct ? "text-green-500" : "text-red-500"}`}>
                    {correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">Q{i + 1}: {q.question}</p>
                    {!correct && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Your answer: <span className="font-medium">{userAnswers[i] || "—"}</span>
                      </p>
                    )}
                    {!correct && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Correct: <span className="font-medium">{q.answer}</span>
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => router.back()}
                className="w-fit px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <ChevronLeft size={17} /> Back to Quizzes
              </button>
              
              <button
                onClick={resetQuiz}
                className="w-fit px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <RotateCcw size={17} /> Retake Quiz
              </button>
            <div/>

          </div>

        </div>
      </div>
    )
  }

  // ── Quiz screen ───────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg flex flex-col gap-5">

        {/* Progress */}
        <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-1">
          <span>Question {currentQuestionIndex + 1} of {quiz.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 -mt-3">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-white border border-gray-100 border-b-4 border-b-amber-300 rounded-xl shadow-sm p-6 flex flex-col gap-5 min-h-72">

          {/* Question type badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              {currentQuestion.questionType}
            </span>
          </div>

          <p className="text-base font-extrabold text-gray-800 leading-snug">
            {currentQuestion.question}
          </p>

          <div className="border-t border-gray-100 pt-4">

            {/* T&F + Multiple Choice */}
            {(currentQuestion.questionType === "T&F" || currentQuestion.questionType === "Multiple Choice") && (
              <div className="flex flex-col gap-2.5">
                {currentQuestion.options.map((option, i) => {
                  const selected = currentAnswer === option
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAnswerChange(option)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all
                        ${selected
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:border-amber-200 hover:bg-amber-50"
                        }
                      `}
                    >
                      <span className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-black
                        ${selected ? "border-amber-400 bg-amber-400 text-white" : "border-gray-300 text-gray-400"}
                      `}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Identification */}
            {currentQuestion.questionType === "Identification" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={e => handleAnswerChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleNext()}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:border-amber-400 bg-gray-50 transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={17} /> Prev
          </button>

          <div className="flex-1" />

          {currentQuestionIndex === quiz.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-sm active:scale-95 transition-all shadow-sm"
            >
              <Send size={15} /> Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm active:scale-95 transition-all shadow-sm"
            >
              Next <ChevronRight size={17} />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
          {quiz.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestionIndex(i)}
              className={`rounded-full transition-all ${
                i === currentQuestionIndex
                  ? "w-5 h-2.5 bg-amber-500"
                  : userAnswers[i]
                  ? "w-2.5 h-2.5 bg-amber-200"
                  : "w-2.5 h-2.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  )
}