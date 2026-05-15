'use client'
import { useState, useEffect } from "react";
import {getQuizAvg, getFlashAvg} from '../lib/functions'
import Summary from "./Summarry";
import { db } from "@/services/firebase";
import { ref, get } from "firebase/database";
import Loading from "./Loading";
import ChatBot from "./ChatBot";
import { Brain, MessageSquareQuote } from "lucide-react";
import { useRouter } from "next/navigation";

export default function  Note({ id }: { id: string }) {
  const router = useRouter();

  // ✅ ALL hooks at the top — never after a conditional return
  const [noteData, setNoteData] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [flashData, setFlashData] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.uid) return;

    const noteRef = ref(db, `notes/${user.uid}/${id}`);
    get(noteRef)
      .then((snapshot) => {
        if (snapshot.exists()) setNoteData(snapshot.val());
        else console.log("No note data available");
      })
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!noteData) return;

    const fetchData = async () => {
      const quizData = await getQuizAvg(noteData.quizKey);

      setQuizData(quizData);
      
      const flashCardData = await getFlashAvg(noteData.flashKey);

      console.log(noteData.flashKey);

      setFlashData(flashCardData);
    };

    fetchData();
  }, [noteData]);

  // ✅ Conditional return AFTER all hooks
  if (!noteData || !quizData) return <Loading />;

  return (
    <div className="flex flex-col items-center justify-start w-full px-4">
      <ChatBot summary={noteData.note.Summary.plainText} />
      <div className="flex-center flex-col md:flex-row items-start gap-12 w-full mt-8">
        <div className="flex-1/8">
          <Summary summary={noteData.note.Summary} />
        </div>

        <div className="flex-1 flex-center flex-col justify-start gap-12 w-full">

          {/* Flashcard Card */}
          <div className="w-full flex-1 flex flex-col p-6 bg-white border border-gray-100 border-b-4 border-b-gray-300 rounded-lg shadow-md hover:shadow-xl transition-shadow gap-4">
            <div className="flex items-center gap-3">
              <Brain size={32} className="text-purple-600" />
              <div className="text-left">
                <h2 className="text-lg font-extrabold text-gray-800">Flash Cards</h2>
                <p className="text-xs text-gray-400">Review and memorize concepts</p>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <div className="flex-1 bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Total Cards</p>
                <p className="text-xl font-bold text-purple-600">{flashData?.totalCards || 0}</p>
              </div>
              <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Avg Accuracy</p>
                <p className="text-xl font-bold text-purple-600">{flashData?.avgAccuracy || 0}%</p>
              </div>
              <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Best Accuracy</p>
                <p className="text-xl font-bold text-green-600">{flashData?.bestAccuracy || 0}%</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Overall accuracy</span>
                <span>{flashData?.avgAccuracy || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${flashData?.avgAccuracy || 0}%` }} />
              </div>
            </div>

            <button
              onClick={() => router.push(`/flash-cards/${noteData.flashKey}`)}
              className="w-[90%] mx-auto mt-auto py-3 rounded-lg bg-purple-600 text-white font-extrabold text-sm hover:bg-purple-700 active:scale-95 transition-all btn-anim"
            >
              Challenge Yourself
            </button>
          </div>

          {/* Quiz Card */}
          <div className="w-full flex-1 flex flex-col p-6 bg-white border border-gray-100 border-b-4 border-b-gray-300 rounded-lg shadow-md hover:shadow-xl transition-shadow gap-4">
            <div className="flex items-center gap-3">
              <MessageSquareQuote size={32} className="text-amber-600" />
              <div className="text-left">
                <h2 className="text-lg font-extrabold text-gray-800">Quiz</h2>
                <p className="text-xs text-gray-400">Test your knowledge</p>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Highest Score</p>
                <p className="text-xl font-bold text-gray-700">{quizData?.bestScore}%</p>
              </div>
              <div className="flex-1 bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Total Quizes</p>
                <p className="text-xl font-bold text-amber-600">{quizData?.total}</p>
              </div>
              <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Avg Score</p>
                <p className="text-xl font-bold text-blue-600">{quizData?.avgScore}%</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Average performance</span>
                <span>{quizData?.avgScore}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full " style={{ width: `${quizData?.avgScore}%` }} />
              </div>
            </div>

            <button
              onClick={() => router.push(`/quiz/${noteData.quizKey}`)}
              className="w-[90%] mx-auto mt-auto py-3 rounded-lg bg-amber-500 text-white font-extrabold text-sm hover:bg-amber-600 active:scale-95 transition-all btn-anim"
            >
              Test Your Knowledge
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}


// to listen the load use an api endpoint to fetch the data from the database