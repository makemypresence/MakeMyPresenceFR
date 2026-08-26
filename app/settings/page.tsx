'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { storage } from '../../lib/utils/storage';

export default function SettingsPage() {
  const [username, setUsername] = useState('kichuu');
  const [email, setEmail] = useState('kichukichu4382@gmail.com');

  useEffect(() => {
    const storedEmail = storage.getUserEmail();
    if (storedEmail) {
      setEmail(storedEmail);
      setUsername(storedEmail.split('@')[0]);
    }
  }, []);

  return (
    <main className="flex min-h-screen bg-[#191c1e] text-[#e3e2e6] relative font-sans">
      {/* Sidebar Navigation */}
      <div className="fixed md:left-6 left-1/2 bottom-6 md:bottom-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 z-20">
        <div className="bg-[#202528]/80 backdrop-blur-md border border-[#2d3236] rounded-full py-3 px-6 md:py-3.5 md:px-3 flex flex-row md:flex-col items-center gap-3.5 shadow-2xl">
          {/* Home/Dashboard - Inactive */}
          <Link
            href="/dashboard"
            className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer"
            aria-label="Dashboard"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </Link>

          {/* Settings - Active */}
          <button
            className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full transition-all cursor-pointer"
            aria-label="Settings"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 flex flex-col justify-start p-8 md:pl-28 pt-20 max-w-5xl mx-auto w-full">
        {/* Title */}
        <h1 className="text-white text-3xl font-bold tracking-tight mb-10 select-none">
          My Account
        </h1>

        {/* Settings Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full">
          {/* Username Column */}
          <div className="flex flex-col space-y-2.5">
            <label className="text-[#8a9196] text-[15px] font-medium tracking-wide">Username</label>
            <div className="relative flex items-center w-full">
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))
                }
                className="w-full bg-[#202528] text-white placeholder-[#5a626a] border border-[#2d3236] rounded-2xl py-3.5 pl-6 pr-12 outline-none focus:border-[#40474c] transition-colors text-base"
              />
              {/* Pencil edit icon */}
              <div className="absolute right-5 flex items-center justify-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Email Column */}
          <div className="flex flex-col space-y-2.5">
            <label className="text-[#8a9196] text-[15px] font-medium tracking-wide">Email</label>
            <div className="w-full">
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-[#202528]/50 text-zinc-500 border border-[#2d3236] rounded-2xl py-3.5 px-6 outline-none text-base cursor-not-allowed select-none"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
