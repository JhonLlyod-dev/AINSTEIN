'use client'
import {db} from "@/services/firebase"
import { useRouter, useParams,useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { get, ref, update } from "firebase/database"
import { Brain, MessageSquareQuote, CheckCircle, XCircle, Clock, Lightbulb, ChevronRight, ChevronLeft } from "lucide-react"
import Quiz from "@/components/Quiz"
import FlashCard from "@/components/FlashCard"
import { ToastContainer, toast } from 'react-toastify';

interface QuizQuestion {
  answer: string
  options: string[]
  question: string
  questionType: "T&F" | "Multiple Choice" | "Identification"
}

interface FlashCard {
  question: string
  answer: string
}

export default function challenge() {
    // fetch the questionaire ID & the type from the url
    // fetch the questionaire from the database using the ID
    // render the UI base on type quiz or flashcards
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const type = searchParams.get("type") as string || "";
    const attempt = searchParams.get("attempts") as string || "";
    const {id} = params;

    const [quizID, setQuizID] = useState("");
    const [quizKey, setQuizKey] = useState("");
    const [questionaire, setQuestionaire] = useState<QuizQuestion[]>([]);

    const [flashID, setFlashID] = useState("");
    const [flashKey, setFlashKey] = useState("");
    const [flashcards, setFlashcards] = useState<FlashCard[]>([]);

    const documentTitle = type === "quiz" ? "questionaires" : "decks";

    useEffect(() => {
      if (!id) return;
      const challengeRef = ref(db, `${documentTitle}/${id}`);
      get(challengeRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (type === "quiz") {
              setQuizID(data.id);
              setQuizKey(data.quizKey);
              setQuestionaire(data.questions);
            } else {
              setFlashID(data.id);
              setFlashKey(data.flashKey);
              setFlashcards(data.cards);
            }
          } else {
            console.log("No data available");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    },[id]);

    const [tab, setTab] = useState("challenge");
    const [started, setStarted] = useState(false);

    useEffect(() => {
      if (started) {
        setTab(type);
      }
    }, [started]);

    const [isCompleted, setIsCompleted] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
      if (isCompleted) {

        if(type === "quiz"){
          console.log(quizKey,quizID);

          update(ref(db, `quizes/${quizKey}/${quizID}`), {
            score: score,
            attempts: parseInt(attempt) + 1,
          }).then(() => {
            toast.success("Score Recorded!");
          })
        } else {
          const scoreRef = ref(db, `flashcards/${flashKey}/${flashID}/bestScore`);
          get(scoreRef)
            .then((snapshot) => {
              if (snapshot.exists()) {
                const bestScore = Number(snapshot.val());
                console.log(bestScore);
                update(ref(db, `flashcards/${flashKey}/${flashID}`), {
                  bestScore: score > bestScore ? score : bestScore,
                  lastScore: score,
                  attempts: Number(attempt) + 1,
                }).then(() => {
                  toast.success("Score Recorded!");
                })
              } else {
                console.log("No data available");
              }
            })
            .catch((error) => {
              console.error(error);
            });
        }
      }
    }, [isCompleted]);

    if(!type) return;

  return (
    <div>
      <ToastContainer />
      {tab === "challenge" && <ChallengeHero type={type || ""} onStart={() =>setStarted(true)}  />}
      {tab === "quiz" && <Quiz quiz={questionaire} onComplete={(s) => { setScore(s); setIsCompleted(true) }}  />}
      {tab === "flashcards" && <FlashCard flash={flashcards} onComplete={(s) => { setScore(s); setIsCompleted(true) }} />}
    </div>
  )
}

// challenge Tab

const quizGuidelines = [
  { icon: <CheckCircle size={18} />, text: "Read each question carefully before answering" },
  { icon: <XCircle size={18} />,    text: "You cannot go back once you answer" },
  { icon: <Clock size={18} />,      text: "Take your time — there is no time limit" },
  { icon: <Lightbulb size={18} />,  text: "Trust your instincts on tough questions" },
]

const flashGuidelines = [
  { icon: <CheckCircle size={18} />, text: "Think of your answer before flipping the card" },
  { icon: <Brain size={18} />,       text: "Mark it correct only if you truly knew it" },
  { icon: <Clock size={18} />,       text: "Pace yourself — retention beats speed" },
  { icon: <Lightbulb size={18} />,   text: "Repeat cards you miss for better recall" },
]

const quizQuotes = [
  "The expert in anything was once a beginner.",
  "Every question is a chance to prove yourself.",
  "Knowledge is the one thing no one can take from you.",
  "Challenge yourself — comfort zones don't build champions.",
]

const flashQuotes = [
  "Repetition is the mother of learning.",
  "Small progress is still progress.",
  "Your brain is a muscle — train it daily.",
  "The more you review, the more you retain.",
]

interface QuizHeroProps {
  type: string
  onStart: () => void
}

function ChallengeHero({ type, onStart }: QuizHeroProps) {
  const [phase, setPhase] = useState<"intro" | "countdown">("intro")
  const [count, setCount] = useState(3);

  const router = useRouter();

  const isQuiz       = type === "quiz"
  const back_btn     = isQuiz ? "Quizzes" : "Flashcards";
  const guidelines   = isQuiz ? quizGuidelines : flashGuidelines
  const quotes       = isQuiz ? quizQuotes : flashQuotes
  const quote        = quotes[Math.floor(Math.random() * quotes.length)]

  const accentBg     = isQuiz ? "bg-amber-500"       : "bg-purple-600"
  const accentHover  = isQuiz ? "hover:bg-amber-600"  : "hover:bg-purple-700"
  const accentText   = isQuiz ? "text-amber-500"      : "text-purple-600"
  const accentBgSoft = isQuiz ? "bg-amber-50"         : "bg-purple-50"
  const accentBorder = isQuiz ? "border-amber-200"    : "border-purple-200"
  const accentRing   = isQuiz ? "ring-amber-400"      : "ring-purple-400"

  useEffect(() => {
    if (phase !== "countdown") return
    if (count === 0) { onStart(); return }
    const timer = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, count])

  // ── Countdown screen ──────────────────────────────────────────
  if (phase === "countdown") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-8">
        <p className={`text-base font-semibold uppercase tracking-widest ${accentText}`}>
          {isQuiz ? "Quiz Starting" : "Session Starting"}
        </p>

        <div
          key={count}
          className={`w-56 h-56 rounded-full flex items-center justify-center ring-[10px] ${accentRing} ${accentBgSoft}`}
          style={{ animation: "popIn 0.4s ease" }}
        >
          <span className={`text-9xl font-black ${accentText}`}>{count}</span>
        </div>

        <p className="text-gray-400 text-lg font-medium">
          {count === 3 && "Get ready..."}
          {count === 2 && "Focus up..."}
          {count === 1 && "Here we go!"}
        </p>

        <style>{`
          @keyframes popIn {
            0%   { transform: scale(0.4); opacity: 0.1; }
            60%  { transform: scale(1.2); }
            100% { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  

  // ── Intro screen ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white overflow-y-auto">
      <button
        onClick={() => router.back()}
        className={`absolute top-4 left-4 w-fit px-4 py-2.5 rounded-xl ${accentBg} ${accentHover} text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm`}
      >
        <ChevronLeft size={17} /> Back to {back_btn}
      </button>
      <div className="w-full max-w-lg flex flex-col gap-8 py-8">

        {/* Icon + label */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`w-24 h-24 rounded-3xl ${accentBgSoft} ${accentBorder} border-2 flex items-center justify-center`}>
            {isQuiz
              ? <MessageSquareQuote size={48} className={accentText} />
              : <Brain              size={48} className={accentText} />
            }
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800">
              {isQuiz ? "Quiz Challenge" : "Flashcard Session"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {isQuiz ? "Test your knowledge" : "Train your memory"}
            </p>
          </div>
        </div>

        {/* Guidelines */}
        <div className={`${accentBgSoft} border-2 ${accentBorder} rounded-2xl p-6 flex flex-col gap-4`}>
          <p className={`text-xs font-bold uppercase tracking-widest ${accentText}`}>
            Before you begin
          </p>
          {guidelines.map((g, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className={`mt-0.5 flex-shrink-0 ${accentText}`}>{g.icon}</span>
              <p className="text-base text-gray-600 leading-snug">{g.text}</p>
            </div>
          ))}
        </div>

        {/* Motivational quote */}
        <div className={` p-6 flex items-start gap-4`}>
          <span className={`text-5xl font-black leading-none ${accentText} opacity-50 -mt-2`}>"</span>
          <p className="text-base text-gray-500 italic leading-relaxed">{quote}</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => setPhase("countdown")}
          className={`
            w-full py-5 rounded-2xl ${accentBg} ${accentHover}
            text-white font-black text-lg flex items-center justify-center gap-3
            active:scale-95 transition-all shadow-md
          `}
        >
          {isQuiz ? "Start Quiz" : "Start Session"}
          <ChevronRight size={22} />
        </button>

      </div>
    </div>
  )
}