'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, Users, ShieldCheck, ShieldOff, ShieldAlert } from "lucide-react"
import { get, ref, update } from "firebase/database"
import { db } from "@/services/firebase"
import AdminSidebar from "@/components/AdminSidebar"

interface User {
  uid: string
  name: string
  email: string
  photoURL?: string
  status: "active" | "disabled"
  role?: string
  joinedAt: number
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  })
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function ConfirmModal({ user, onClose, onConfirm }: any) {
  const isDisabling = user.status === "active"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className={`bg-white border border-gray-100 border-b-4 ${isDisabling ? "border-b-red-400" : "border-b-green-400"} rounded-2xl shadow-md w-full max-w-sm p-6 flex flex-col gap-5`}>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDisabling ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
            {isDisabling
              ? <ShieldOff size={26} className="text-red-500" />
              : <ShieldCheck size={26} className="text-green-500" />
            }
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">
              {isDisabling ? "Disable Account" : "Enable Account"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDisabling
                ? `${user.name} will lose access to the app`
                : `${user.name} will regain access to the app`
              }
            </p>
          </div>
        </div>

        <div className="w-full h-px bg-gray-100" />

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className={`w-full py-3.5 rounded-xl border-b-4 text-white font-extrabold text-sm active:scale-95 transition-all btn-anim
              ${isDisabling
                ? "bg-red-500 hover:bg-red-600 border-red-800"
                : "bg-green-500 hover:bg-green-600 border-green-800"
              }`}
          >
            {isDisabling ? "Yes, Disable" : "Yes, Enable"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-500 font-extrabold text-sm transition-all btn-anim"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const router   = useRouter()
  const pathname = usePathname()

  const [users,       setUsers]       = useState<User[]>([])
  const [search,      setSearch]      = useState("")
  const [filter,      setFilter]      = useState<"all" | "active" | "disabled">("all")
  const [confirmUser, setConfirmUser] = useState<User | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const stored = localStorage.getItem("user")
        if (!stored) { router.push("/auth"); return }
        const parsed   = JSON.parse(stored)
        const snapshot = await get(ref(db, `users/${parsed.uid}`))
        if (!snapshot.exists() || snapshot.val().role !== "admin") { router.push("/"); return }
      } catch { router.push("/") }
    }
    checkAdmin()
  }, [router, pathname])

  useEffect(() => {
  const fetchUsers = async () => {
    try {
      const snapshot = await get(ref(db, "users"));

      if (!snapshot.exists()) {
        setUsers([]);
        return;
      }

      const data = snapshot.val() as Record<string, User>;

      // 🔥 Convert + filter NON-admin users only
      const filtered: User[] = Object.values(data).filter(
        (user: any) => user.role !== "admin"
      );

      setUsers(filtered);

    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };
    fetchUsers()
  }, [])

  async function toggleStatus(uid: string) {
    const user = users.find(u => u.uid === uid)
    if (!user) return
    const newStatus = user.status === "active" ? "disabled" : "active"
    try {
      await update(ref(db, `users/${uid}`), { status: newStatus })
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u))
    } catch (err) { console.error(err) }
    setConfirmUser(null)
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || u.status === filter
    return matchSearch && matchFilter
  })

  const totalActive   = users.filter(u => u.status === "active").length
  const totalDisabled = users.filter(u => u.status === "disabled").length

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-300">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="w-full min-h-screen px-4 py-8 max-w-6xl mx-auto"> 
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">User Management</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and monitor all user accounts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} className="text-blue-500" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-100 border-b-4 border-b-gray-300 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Total Users</p>
            <p className="text-2xl font-extrabold text-gray-700">{users.length}</p>
          </div>
          <div className="bg-green-50 border border-green-100 border-b-4 border-b-green-300 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Active</p>
            <p className="text-2xl font-extrabold text-green-600">{totalActive}</p>
          </div>
          <div className="bg-red-50 border border-red-100 border-b-4 border-b-red-300 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Disabled</p>
            <p className="text-2xl font-extrabold text-red-500">{totalDisabled}</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex-1 relative min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm font-semibold text-gray-700 focus:outline-none focus:border-blue-300 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "disabled"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold border-2 transition-all btn-anim capitalize
                  ${filter === f
                    ? f === "all"
                      ? "bg-blue-500 border-b-4 border-blue-800 text-white"
                      : f === "active"
                      ? "bg-green-500 border-b-4 border-green-800 text-white"
                      : "bg-red-500 border-b-4 border-red-800 text-white"
                    : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Users list */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Users size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-300">No users found</p>
            </div>
          ) : (
            filtered.map(user => (
              <div
                key={user.uid}
                className={`bg-white border border-gray-100 border-b-4 rounded-xl shadow-sm p-4 flex items-center gap-4 transition-all hover:shadow-md
                  ${user.status === "active" ? "border-b-green-200" : "border-b-red-200"}
                `}
              >
                {/* Avatar */}
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0
                    ${user.status === "active" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}
                  `}>
                    {getInitials(user.name)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-extrabold text-gray-800 truncate">{user.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
                      ${user.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-500"
                      }`}
                    >
                      {user.status}
                    </span>
                    {user.role === "admin" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
                        admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">Joined {formatDate(user.joinedAt)}</p>
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => setConfirmUser(user)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-extrabold flex-shrink-0 transition-all btn-anim
                    ${user.status === "active"
                      ? "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"
                      : "bg-green-50 border-green-100 text-green-600 hover:bg-green-100"
                    }`}
                >
                  {user.status === "active"
                    ? <><ShieldOff size={13} /> Disable</>
                    : <><ShieldCheck size={13} /> Enable</>
                  }
                </button>
              </div>
            ))
          )}
        </div>

        {/* Confirm modal */}
        {confirmUser && (
          <ConfirmModal
            user={confirmUser}
            onClose={() => setConfirmUser(null)}
            onConfirm={() => toggleStatus(confirmUser.uid)}
          />
        )}
      </div>
    </div>

  )
}