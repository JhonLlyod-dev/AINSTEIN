'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Home, ShieldAlert, ShieldCheck, ShieldOff, Search, X, ChevronRight, Menu } from "lucide-react"
import { get, ref, update } from "firebase/database"
import { db } from "@/services/firebase"

interface User {
  uid: string
  name: string
  email: string
  photoURL?: string
  role: "admin" | "user"
  status: "active" | "disabled"
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function RoleModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [search, setSearch]     = useState("")
  const [result, setResult]     = useState<User | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [searching, setSearching] = useState(false)
  const [updating, setUpdating]   = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (!search.trim()) {
      setResult(null)
      setNotFound(false)
      return
    }

    setSearching(true)
    setNotFound(false)

    searchTimeout.current = setTimeout(async () => {
      try {
        const snapshot = await get(ref(db, "users"))
        if (!snapshot.exists()) { setNotFound(true); return }

        const users: User[] = Object.values(snapshot.val())
        const found = users.find(u =>
          u.email.toLowerCase().includes(search.toLowerCase())
        )

        if (found) {
          setResult(found)
          setNotFound(false)
        } else {
          setResult(null)
          setNotFound(true)
        }
      } catch (err) {
        console.error(err)
        setNotFound(true)
      } finally {
        setSearching(false)
      }
    }, 500)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [search])

  async function handleRoleChange(newRole: "admin" | "user") {
    if (!result) return
    setUpdating(true)
    try {
      await update(ref(db, `users/${result.uid}`), { role: newRole })
      setResult(prev => prev ? { ...prev, role: newRole } : null)
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const newRole = result?.role === "admin" ? "user" : "admin"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div className="bg-white border border-gray-100 border-b-4 border-b-blue-400 rounded-2xl shadow-md w-full max-w-sm flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <ShieldAlert size={15} className="text-blue-500" />
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Manage Role</h2>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors btn-anim">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-2">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
            Search by email
          </label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="user@email.com"
              className="w-full pl-8 pr-10 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-300 transition-colors"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Result area */}
        <div className="px-5 py-4 min-h-32 flex items-center justify-center">
          {!search.trim() ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Search size={16} className="text-gray-300" />
              </div>
              <p className="text-xs text-gray-300 font-semibold">Type an email to search</p>
            </div>
          ) : searching ? (
            <p className="text-xs text-gray-300 font-semibold">Searching...</p>
          ) : notFound ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <X size={16} className="text-red-400" />
              </div>
              <p className="text-xs text-red-400 font-semibold">No user found</p>
            </div>
          ) : result ? (
            <div className="w-full flex flex-col gap-3">

              {/* User card */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 border-b-4 border-b-blue-200 rounded-xl">
                {result.photoURL ? (
                  <img src={result.photoURL} alt={result.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className={`w-10 h-10 rounded-xl font-extrabold text-sm flex items-center justify-center flex-shrink-0
                    ${result.role === "admin" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}
                  `}>
                    {getInitials(result.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-gray-800 truncate">{result.name}</p>
                  <p className="text-xs text-gray-400 truncate">{result.email}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
                  ${result.role === "admin" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}
                `}>
                  {result.role}
                </span>
              </div>

              {/* Role change preview */}
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400">
                <span className={`font-extrabold ${result.role === "admin" ? "text-blue-500" : "text-gray-500"}`}>
                  {result.role}
                </span>
                <ChevronRight size={13} className="text-gray-300" />
                <span className={`font-extrabold ${newRole === "admin" ? "text-blue-500" : "text-gray-500"}`}>
                  {newRole}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-2.5">
          <button
            onClick={() => handleRoleChange(newRole)}
            disabled={!result || updating}
            className={`w-full py-3 rounded-xl border-b-4 text-white font-extrabold text-xs active:scale-95 transition-all btn-anim disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2
              ${result?.role === "admin"
                ? "bg-red-500 hover:bg-red-600 border-red-800"
                : "bg-blue-500 hover:bg-blue-600 border-blue-800"
              }`}
          >
            {updating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : result ? (
              result.role === "admin" ? (
                <><ShieldOff size={13} /> Demote to User</>
              ) : (
                <><ShieldCheck size={13} /> Promote to Admin</>
              )
            ) : "Select a user"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-400 font-extrabold text-xs transition-all btn-anim"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// In AdminSidebar — change the aside and add a persistent toggle button
export default function AdminSidebar() {
  const router = useRouter()

  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null)
  const [admins,        setAdmins]      = useState<User[]>([])
  const [showModal,     setShowModal]   = useState(false)
  const [isOpen,        setIsOpen]      = useState(true) // ← default open on desktop

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) return
    const parsed = JSON.parse(stored)

    const fetchUsers = async () => {
      try {
        const snapshot = await get(ref(db, "users"))
        if (!snapshot.exists()) return
        const data: User[] = Object.values(snapshot.val())
        setAdmins(data.filter(u => u.role === "admin"))
        setCurrentAdmin(data.find(u => u.uid === parsed.uid) || null)
      } catch (err) { console.error(err) }
    }

    fetchUsers()
  }, [])

  const sidebarContent = (
    <div className="flex flex-col h-full p-4 gap-4">

      {/* Header row with close button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <ShieldAlert size={15} className="text-blue-500" />
          </div>
          <p className="text-sm font-extrabold text-gray-700">Admin Panel</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-300 hover:text-gray-500 transition-colors btn-anim"
        >
          <X size={18} />
        </button>
      </div>

      <div className="w-full h-px bg-gray-200" />

      {/* Current admin profile */}
      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 border-b-4 border-b-blue-300 rounded-xl">
        {currentAdmin?.photoURL ? (
          <img src={currentAdmin.photoURL} alt={currentAdmin.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
            {currentAdmin ? getInitials(currentAdmin.name) : "A"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-gray-800 truncate">{currentAdmin?.name || "Admin"}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">admin</span>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200" />

      {/* Back to home */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100 border-b-4 border-b-gray-300 text-gray-600 font-extrabold text-sm hover:shadow-md active:scale-95 transition-all btn-anim"
      >
        <Home size={17} />
        Back to Home
        <ChevronRight size={14} className="ml-auto text-gray-300" />
      </button>

      {/* Manage roles */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 border-b-4 border-blue-800 text-white font-extrabold text-sm active:scale-95 transition-all btn-anim"
      >
        <ShieldAlert size={17} />
        Manage Roles
        <ChevronRight size={14} className="ml-auto opacity-60" />
      </button>

      <div className="w-full h-px bg-gray-200" />

      {/* Admin list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 px-1">
          Admins ({admins.length})
        </p>
        {admins.length === 0 ? (
          <p className="text-xs text-gray-300 text-center py-4">No admins found</p>
        ) : (
          admins.map(admin => (
            <div
              key={admin.uid}
              className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 border-b-4 bg-white transition-all
                ${admin.status === "active" ? "border-b-green-200" : "border-b-red-200"}
              `}
            >
              {admin.photoURL ? (
                <img src={admin.photoURL} alt={admin.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                  {getInitials(admin.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-gray-700 truncate">{admin.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{admin.email}</p>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${admin.status === "active" ? "bg-green-400" : "bg-red-400"}`} />
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Floating open button — shown when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 w-11 h-11 rounded-full overflow-hidden border-2 border-gray-200 shadow-md btn-anim"
        >
          <img src="/Ainstein.webp" alt="open sidebar" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Mobile overlay — only on small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-72 bg-gray-50 border-r border-gray-200 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {sidebarContent}
      </aside>

      {/* Role modal */}
      {showModal && (
        <RoleModal onClose={() => setShowModal(false)} />
      )}
    </>
  )
}