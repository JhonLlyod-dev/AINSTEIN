'use client';

import { FileText, Save } from "lucide-react";
import { useEffect, useState } from "react";
import NewNote from "@/components/EmptyState";
import Loading from "@/components/Loading";
import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/services/firebase";
import { Ainstein } from "@/lib/Prompt";
import { useRouter } from "next/navigation";

export default function Home() {

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user) return <div>loading...</div>

  const [shown, setShown] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [noteName, setNoteName] = useState('');

  const router = useRouter();

  useEffect(() => {
    setShown(!!text);
  }, [text]);

  async function AddNote(noteText: string) {
    const newUuid = uuidv4();

    if (!noteText || !noteName.trim()) {
      return alert("Please enter note name and upload a file");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/open-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: Ainstein },
            { role: "user", content: noteText }
          ]
        })
      });

      const aiResult = await res.json();

      await set(ref(db, `notes/${user.uid}/${newUuid}`), {
        note: JSON.parse(aiResult.result),
        noteName: noteName.trim(),
        quizKey: `${newUuid},${uuidv4()}`,
        flashKey: `${newUuid},${uuidv4()}`,
        timestamp: Date.now(),
        noteId: newUuid,
      });

      setText('');
      setNoteName('');

    } catch (err) {
      console.error("Error:", err);
      alert("Failed to add note");
    } finally {
      setLoading(false);
      router.push(`/note/${newUuid}`);
    }
  }

  return (
    <section className="flex-1 flex-center flex-col p-12">
      {loading ? (
        <Loading />
      ) : shown ? (
        <div className="flex flex-col w-full max-w-md p-6 bg-white border border-gray-100 border-b-8 border-b-gray-300 rounded-xl shadow-md hover:shadow-xl transition-shadow gap-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-extrabold text-gray-800">Name Your Study Note</h2>
              <p className="text-xs text-gray-400">Give it a name you'll remember</p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gray-100" />

          {/* Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Note Name
            </label>
            <input
              type="text"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && noteName.trim() && AddNote(text)}
              placeholder="e.g. Biology Chapter 5, Math Finals Review"
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={() => AddNote(text)}
            disabled={!noteName.trim() || loading}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 border-b-4 border-blue-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-anim"
          >
            <Save size={17} strokeWidth={3} />
            Save Note
          </button>

        </div>
      ) : (
        <NewNote AddNote={setText} />
      )}
    </section>
  );
}