"use client";

import { useEffect, useState, type ReactNode } from "react";

const ADMIN_SECRET_KEY = "mauriresults-admin-secret";

export default function AdminSecretStorageBridge({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const sessionSecret = sessionStorage.getItem(ADMIN_SECRET_KEY) || "";
      const localSecret = localStorage.getItem(ADMIN_SECRET_KEY) || "";
      const secret = sessionSecret || localSecret;

      if (secret) {
        sessionStorage.setItem(ADMIN_SECRET_KEY, secret);
        localStorage.setItem(ADMIN_SECRET_KEY, secret);
      }
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <main className="admin-page grid min-h-screen place-items-center px-4 text-center">
        <p className="font-black">جاري فتح لوحة الإدارة...</p>
      </main>
    );
  }

  return children;
}
