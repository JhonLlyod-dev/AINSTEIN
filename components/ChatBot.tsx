'use client'

import { useState, useRef, useEffect } from "react"
import { X, Send, Minimize2 } from "lucide-react"
import { Ainstein2 } from "@/lib/Prompt"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatBot({ summary }: { summary: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/open-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: Ainstein2 + ' Summary: ' + summary },
            ...updatedMessages
          ]
        })
      })

      const data = await res.json()
      const parsed = JSON.parse(data.result)

      if (parsed.error) {
        setMessages(prev => [...prev, { role: "assistant", content: parsed.error.message || "Something went wrong. Please try again." }])
        return
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: parsed.message || "Sorry, I couldn't get a response."
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end pointer-events-none">

      {/* Chatbox */}
      <div
        className={`
          pointer-events-auto
          mb-4 w-140 h-130 bg-white rounded-2xl shadow-2xl border border-gray-200
          flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out origin-bottom-right
          ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}
        `}
    
      >
        {/* Header */}
        <div className="bg-blue-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-full">
              <img src="/Ainstein.webp" alt="Ainstein" className="w-8 h-8 rounded-full object-cover" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Ainstein</p>
              <p className="text-blue-100 text-xs">Always here to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <Minimize2 size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <img src="/Ainstein.webp" alt="Ainstein" className="w-12 h-12 rounded-full opacity-40" />
              <p className="text-gray-400 text-sm">Hi! Ask me anything.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`
                  max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${msg.role === "user"
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-white text-gray-700 border border-gray-200 rounded-bl-sm shadow-sm"
                  }
                `}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold mt-6 mb-4" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className={`leading-relaxed ${msg.role === "user" ? "my-0" : "mb-4"}`} {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                    li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props} />,
                    code: ({ node, inline, ...props }: any) =>
                      inline ? (
                        <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                      ) : (
                        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4" {...props} />
                      ),
                    pre: ({ node, ...props }) => <pre className="bg-gray-900 rounded-lg overflow-x-auto my-4" {...props} />,
                    a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
                    th: ({ node, ...props }) => <th className="border border-gray-300 px-4 py-2 text-left font-bold" {...props} />,
                    td: ({ node, ...props }) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                    hr: ({ node, ...props }) => <hr className="my-6 border-gray-300" {...props} />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-2">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 transition-colors bg-gray-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="pointer-events-auto rounded-full border-2 border-blue-500 flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 bg-white overflow-hidden"
        style={{ width: "4.5rem", height: "4.5rem" }}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <X size={24} className="text-blue-500" />
        ) : (
          <img src="/Ainstein.webp" alt="Ainstein" className="w-full h-full object-cover" />
        )}
      </button>
    </div>
  )
}