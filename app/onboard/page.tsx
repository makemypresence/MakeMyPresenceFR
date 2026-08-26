'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '../../lib/services/auth';

export default function OnboardPage() {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'own.page';
  const displayUrl = frontendUrl.replace(/https?:\/\//, '').replace(/\/$/, '');

  useEffect(() => {
    if (!username.trim()) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const available = await authService.checkUsername(username);
        setIsAvailable(available);
      } catch (err) {
        console.error(err);
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#191c1e] text-[#e3e2e6] relative font-sans p-6">
      <div className="w-full max-w-[420px] flex flex-col items-center text-center space-y-6">
        {/* Username Input Container */}
        <div className="w-full space-y-2">
          <div className="w-full bg-[#202528] text-white border border-[#2d3236] rounded-full py-3 px-6 flex items-center focus-within:border-[#40474c] transition-colors text-base relative">
            <span className="text-[#5a626a] select-none pointer-events-none shrink-0 mr-1.5">
              {displayUrl} /
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))
              }
              placeholder="you"
              className="w-full bg-transparent outline-none border-none p-0 text-white pr-8"
              maxLength={30}
            />
            {/* Checking/Status Icon inside Input */}
            <div className="absolute right-5 flex items-center justify-center">
              {isChecking && (
                <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              )}
              {!isChecking && isAvailable === true && (
                <svg
                  className="w-5 h-5 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
              {!isChecking && isAvailable === false && (
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>

          {/* Validation Feedback */}
          <div className="h-5 text-sm">
            {username.trim() && !isChecking && (
              <>
                {isAvailable === true && (
                  <span className="text-emerald-500 font-medium">Username is available!</span>
                )}
                {isAvailable === false && (
                  <span className="text-red-500 font-medium">Username is taken.</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Login redirect Button */}
        <div className="pt-2">
          <Link
            href="/login"
            className="px-5 py-2 bg-transparent hover:bg-white/5 border border-[#2d3236] rounded-full transition-colors text-sm font-medium text-white cursor-pointer inline-block"
          >
            log in
          </Link>
        </div>
      </div>
    </main>
  );
}
