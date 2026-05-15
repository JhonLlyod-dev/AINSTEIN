'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, NotebookPen, LogOut, ShieldAlert, X } from "lucide-react";
import { db, auth } from '../services/firebase';
import { ref, onValue, get } from "firebase/database";
import { signOut } from "firebase/auth";

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [isOpen, setIsOpen]               = useState(true);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isAdmin, setIsAdmin]             = useState(false);
  const router                            = useRouter();
  const [notes, setNotes]                 = useState([]);

  useEffect(() => {
    const notesRef = ref(db, `notes/${user.uid}`);
    onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setNotes(Object.values(data) as any);
    });
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const snapshot = await get(ref(db, `users/${user.uid}`))
        if (snapshot.exists() && snapshot.val().role === "admin") {
          setIsAdmin(true)
        }
      } catch (err) { console.error(err) }
    }
    if (user?.uid) checkRole()
  }, [])

  async function handleSignOut() {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) { console.error("Error signing out:", error) }
  }

  function navigate(path: string) {
    router.push(path)
    setMobileOpen(false)
  }

  if (!notes) return <div>Loading...</div>;

  // ── Shared nav content ────────────────────────────────────────
  const navContent = (showLabels: boolean) => (
    <>
      {/* Top logo */}
      <div className={`flex items-center ${showLabels ? "justify-start gap-2" : "justify-center"} mb-2 mt-2`}>
        <img src="/Ainstein.webp" alt="logo" className="rounded-full w-10 animate-bounce flex-shrink-0" />
        {showLabels && <span className="text-sm font-bold">Ainstein</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col mt-4">
        <ul className="w-full">
          <li
            onClick={() => navigate('/')}
            className="flex items-center text-gray-700 gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <NotebookPen size={18} className="flex-shrink-0" />
            {showLabels && <span className="text-sm">New Notes</span>}
          </li>
        </ul>

        {showLabels && (
          <>
            <div className="my-4 border-b border-gray-200" />
            <div className="flex flex-col gap-2">
              <h3 className="text-sm text-gray-700 font-bold">Your notes</h3>
              <ul className="flex flex-col gap-1 overflow-y-auto">
                {notes.map((note: any) => (
                  <li
                    key={note.noteId}
                    onClick={() => navigate('/note/' + note.noteId)}
                    className="text-sm text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors w-full truncate"
                  >
                    {note.noteName}
                  </li>
                ))}
                {notes.length === 0 && (
                  <li className="text-sm text-gray-400 p-2">No notes created</li>
                )}
              </ul>
            </div>
          </>
        )}
      </nav>

      {showLabels && <div className="my-4 border-b border-gray-200" />}

      {/* User info */}
      <div className={`flex items-center gap-2 ${showLabels ? "justify-start" : "justify-center"}`}>
        <img
          src={user.photoURL || '/user.png'}
          alt="Profile"
          className="w-8 h-8 rounded-full bg-blue-300 flex-shrink-0"
        />
        {showLabels && <span className="text-sm truncate">{user.displayName}</span>}
      </div>

      {/* Admin button */}
      {isAdmin && (
        <>
          {showLabels && <div className="my-3 border-b border-gray-200" />}
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-500 hover:text-blue-600 gap-2 p-2 rounded hover:bg-blue-50 cursor-pointer transition-colors"
          >
            <ShieldAlert size={18} className="flex-shrink-0" />
            {showLabels && <span className="text-sm font-semibold">Admin Dashboard</span>}
          </button>
        </>
      )}

      {showLabels && <div className="my-3 border-b border-gray-200" />}

      {/* Sign out */}
      <button
        onClick={() => { setMobileOpen(false); setShowSignOutModal(true) }}
        className="flex items-center text-red-500 hover:text-red-600 gap-2 p-2 rounded hover:bg-red-50 cursor-pointer transition-colors mb-4"
      >
        <LogOut size={18} className="flex-shrink-0" />
        {showLabels && <span className="text-sm font-semibold">Sign Out</span>}
      </button>
    </>
  )

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside
        className={`
          hidden md:flex flex-col p-2 md:p-4
          transition-all duration-300 ease-in-out
          rounded-r-lg border-r border-gray-200 shadow relative flex-shrink-0
          ${isOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-1/2 -right-5 z-10 transform -translate-y-1/2
            bg-white p-2 rounded-full text-gray-600 hover:text-gray-800 cursor-pointer
            transition-colors border-r-2 border-gray-200"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {navContent(isOpen)}
      </aside>

      {/* ── MOBILE HAMBURGER BUTTON ──────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-11 h-11 rounded-full overflow-hidden border-2 border-gray-200 shadow-md btn-anim"
        aria-label="Open sidebar"
      >
        <img src="/Ainstein.webp" alt="menu" className="w-full h-full object-cover" />
      </button>

      {/* ── MOBILE OVERLAY ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER ────────────────────────────────────── */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 h-screen z-50
          w-3/4 max-w-xs
          bg-white border-r border-gray-200 shadow-2xl
          flex flex-col p-4
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors btn-anim"
        >
          <X size={20} />
        </button>

        {navContent(true)}
      </aside>

      {/* ── SIGN OUT MODAL ───────────────────────────────────── */}
      <SignoutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}

function SignoutModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div className="bg-white border border-gray-100 border-b-4 border-b-red-400 rounded-2xl shadow-md w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">Sign Out</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              You'll need to log in again to access your study materials
            </p>
          </div>
        </div>
        <div className="w-full h-px bg-gray-100" />
        <div className="flex flex-col gap-2.5">
          <button onClick={onConfirm} className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 border-b-4 border-red-800 text-white font-extrabold text-sm active:scale-95 transition-all btn-anim">
            Yes, Sign Out
          </button>
          <button onClick={onClose} className="w-full py-3 rounded-xl border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-500 font-extrabold text-sm transition-all btn-anim">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}