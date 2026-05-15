import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="flex flex-col items-center gap-5">

        {/* Spinner with Image inside */}
        <div className="relative w-28 h-28">
          {/* Spinning border */}
          <div className="absolute inset-0 w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          
          {/* Centered Image */}
          <img
            src="/Ainstein.webp"
            alt="Loading"
            className="w-16 h-16 object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce"
          />
        </div>

        {/* Loading Text */}
        <p className="text-sm font-semibold tracking-wide text-gray-700">
          Summoning Knowledge…
        </p>
      </div>
    </div>
  );
}