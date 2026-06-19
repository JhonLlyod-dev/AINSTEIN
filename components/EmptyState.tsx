'use client';

import { FileText, Brain, MessageSquareQuote, Upload, CircleX } from "lucide-react";
import { useState } from "react";
import { handleFiles } from "@/lib/handleFiles";

export default function NewNote({ AddNote }: any) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const files = event.target.files;
    if (file && files) {
      setSelectedFile(file);
      setFiles(files);
    }
  };

  async function generateNote() {
    if (!files || files.length === 0) return;
    const extracted = await handleFiles(files);
    AddNote(extracted[0].content);
  }

  function reset() {
    setSelectedFile(null);
    setFiles(null);
  }

  const features = [
    {
      icon: <FileText size={28} className="text-blue-600" />,
      iconBg: "bg-blue-50",
      title: "Summarize",
      description: "Get concise summaries of your study materials in seconds",
    },
    {
      icon: <Brain size={28} className="text-purple-600" />,
      iconBg: "bg-purple-50",
      title: "Flash Cards",
      description: "Generate interactive flashcards to boost your memory retention",
    },
    {
      icon: <MessageSquareQuote size={28} className="text-amber-600" />,
      iconBg: "bg-amber-50",
      title: "Quiz",
      description: "Test your knowledge with auto-generated quizzes from your content",
    },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-8 gap-10">

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 bg-white border border-gray-100 border-b-4 border-b-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow gap-3"
          >
            <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center`}>
              {feature.icon}
            </div>
            <h3 className="text-base font-extrabold text-gray-800">{feature.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Upload area */}
      <div className="w-full max-w-md flex flex-col items-center gap-4">

        {/* File preview card */}
        {selectedFile ? (
          <div className="w-full bg-white border border-gray-100 border-b-4 border-b-blue-300 rounded-xl shadow-sm p-5 flex flex-col gap-4">

            {/* Status row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-xs font-semibold text-blue-600">File ready</p>
              </div>
              <button onClick={reset} className="text-gray-300 hover:text-gray-500 transition-colors btn-anim">
                <CircleX size={18} />
              </button>
            </div>

            {/* File name */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Selected file</p>
                <p className="text-sm font-extrabold text-gray-700 truncate">{selectedFile.name}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <label
                htmlFor="file-upload"
                className="flex-1 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-500 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors btn-anim"
              >
                <Upload size={15} strokeWidth={3} />
                Change
              </label>
              <button
                onClick={generateNote}
                className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 border-b-4 border-blue-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all btn-anim"
              >
                <Brain size={15} strokeWidth={3} />
                Generate
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Empty state prompt */}
            <p className="text-sm font-semibold text-gray-500 text-center">
              Upload your file to start your studying journey
            </p>

            {/* Upload button */}
            <label
              htmlFor="file-upload"
              className="w-full py-4 rounded-xl bg-blue-500 hover:bg-bluex-600 border-b-4 border-blue-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all btn-anim"
            >
              <Upload size={18} strokeWidth={3} />
              Upload File
            </label>
          </>
        )}

        <input
          id="file-upload"
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
        />

        {/* Supported formats */}
        <p className="text-[10px] text-gray-300 font-medium">
          Supports PDF, DOC, DOCX, TXT
        </p>
      </div>
    </div>
  );
}