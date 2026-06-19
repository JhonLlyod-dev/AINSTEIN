'use client';

import { Volume2, CirclePlay, CirclePause, Repeat1 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useRef } from "react";

export default function Summary({ summary }: any) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [load, setLoad] = useState(false);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Audio play error:", err);
      }
    }
  };

  const playTTS = async () => {
    if (audioRef.current) return;
    setLoad(true);

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: summary.plainText }),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setHasAudio(true);

    audio.onended = () => setIsPlaying(false);

    await audio.play();
    setIsPlaying(true);
    setLoad(false);
  };

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Summary card */}
      <div className="w-full bg-white border border-gray-100 border-b-4 border-b-gray-300 rounded-xl shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Summary</p>
          </div>

          {/* TTS controls inside header */}
          {!hasAudio ? (
            <button
              title="Only available for Development"
              onClick={playTTS}
              disabled={true} // Disable the button becuase this is just for testing
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-xs font-extrabold hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-anim"
            >
              {load ? (
                <>
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 size={13} strokeWidth={3} />
                  Narrate
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-xs font-extrabold hover:bg-blue-100 active:scale-95 transition-all btn-anim"
              >
                {isPlaying
                  ? <CirclePause size={14} strokeWidth={3} />
                  : <CirclePlay  size={14} strokeWidth={3} />
                }
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play();
                    setIsPlaying(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 text-xs font-extrabold hover:bg-gray-100 active:scale-95 transition-all btn-anim"
              >
                <Repeat1 size={14} strokeWidth={3} />
                Replay
              </button>
            </div>
          )}
        </div>

        {/* Markdown content */}
        <div className="overflow-y-auto h-160 px-6 py-5">
          <article className="prose prose-slate max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-extrabold text-gray-900 mt-6 mb-4" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold text-gray-800 mt-5 mb-3" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-bold text-gray-700 mt-4 mb-2" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-gray-600 leading-8 mb-4 text-sm" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-4 space-y-2" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-gray-600 text-sm" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-500 my-4 bg-blue-50 py-2 rounded-r-lg" {...props} />
                ),
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code className="bg-gray-100 text-red-500 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                  ) : (
                    <code className="block bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs font-mono my-4" {...props} />
                  ),
                pre: ({ node, ...props }) => (
                  <pre className="bg-gray-900 rounded-xl overflow-x-auto my-4" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a className="text-blue-500 hover:text-blue-700 underline" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-extrabold text-gray-800" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-gray-500" {...props} />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4 rounded-xl border border-gray-100">
                    <table className="min-w-full border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-gray-50" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border-b border-gray-100 px-4 py-2 text-sm text-gray-600" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-6 border-gray-100" {...props} />
                ),
              }}
            >
              {summary.markdown}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}