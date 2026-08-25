'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { storage } from '../lib/utils/storage';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(storage.isAuthenticated());
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#191c1e] text-white p-4 space-y-6">
      <h1 className="text-3xl font-semibold tracking-wide">
        MakeMyPresence
      </h1>
      {isAuthenticated ? (
        <Link 
          href="/dashboard"
          className="px-6 py-2.5 bg-transparent hover:bg-white/5 border border-[#2d3236] rounded-full transition-colors text-sm font-medium text-white cursor-pointer"
        >
          Go to Dashboard
        </Link>
      ) : (
        <Link 
          href="/login"
          className="px-6 py-2.5 bg-transparent hover:bg-white/5 border border-[#2d3236] rounded-full transition-colors text-sm font-medium text-white cursor-pointer"
        >
          Go to Login
        </Link>
      )}
    </main>
  );
}
