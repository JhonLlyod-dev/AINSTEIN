// components/AuthProvider.tsx
'use client';

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useRouter, usePathname } from "next/navigation";
import Loading from "./Loading";
import {get, ref} from 'firebase/database'
import {db} from '@/services/firebase';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          // Not logged in
          if (pathname !== "/auth") {
            localStorage.removeItem("user");
            router.push("/auth");
          }
          return;
        }

        // Logged in → fetch user data from DB
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
          // No user record → force logout
          await auth.signOut();
          localStorage.removeItem("user");
          router.push("/auth");
          return;
        }

        const userData = snapshot.val();

        // 🚫 Disabled account check (THIS FIXES YOUR BUG)
        if (userData.status !== "active") {
          await auth.signOut();
          localStorage.removeItem("user");
          router.push("/auth");
          return;
        }

        // ✅ Valid active user
        if (pathname === "/auth") {
          router.push("/");
        }

      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return <Loading />;
  }

  return <>{children}</>;
}