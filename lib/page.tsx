'use client';

import { useState, useEffect, use } from "react";
import { handleFiles, ExtractedFile } from "@/lib/handleFiles";


export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [results, setResults] = useState<ExtractedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");


  function fileChangeHandler(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (event.target.files) {
      setFiles(event.target.files);
      setError(""); // Clear previous errors
    }
  }
  
    useEffect(() => {
      fetch("/api/open-ai", {
        method: "POST", // Must match the API route export
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "" },
            { role: "user", content: "What is the capital of France?" }
          ]
        })
      })
        .then((res) => res.json()) // parse JSON
        .then((data) => console.log("Open AI:", data))
        .catch((err) => console.error("Fetch error:", err));
    }, []);

    async function playTTS() {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      await audio.play(); // ✅ allowed after click
    }



  async function extractHandler() {
    if (!files || files.length === 0) {
      setError("Please select at least one file");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]); // Clear previous results

    try {
      const extracted = await handleFiles(files);
      setResults(extracted);
    } catch (err) {
      setError("Failed to extract files. Please try again.");
      console.error("Extraction error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <main className="w-full max-w-3xl bg-white p-16">
        <h1 className="text-4xl font-bold text-zinc-900">
          Hello Kalibutan
        </h1>

        <div className="border mt-8 p-4 text-black">
          <input
            type="file"
            multiple
            accept=".pdf,.docx"
            onChange={fileChangeHandler}
            disabled={loading}
            className="text-sm"
          />

          <button
            onClick={extractHandler}
            disabled={loading || !files}
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? "Extracting..." : "Extract"}
          </button>

          <button onClick={playTTS} className="ml-4 bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300 disabled:cursor-not-allowed">
            Play Audio
          </button>

          {files && (
            <p className="mt-2 text-sm text-gray-600">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* RESULTS */}
        {results.length > 0 && (
          <div className="mt-8 text-black">
            <h2 className="text-xl font-bold">Resulta:</h2>

            {results.map((file, index) => (
              <div key={index} className="mt-4 border p-4 rounded">
                <h3 className="font-semibold text-lg mb-2">{file.name}</h3>
                <div className="bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">
                    {file.content.trim() || "No content extracted"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}