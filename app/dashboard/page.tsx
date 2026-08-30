'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { storage } from '../../lib/utils/storage';
import { profileService, ProfileDetails } from '../../lib/services/profile';

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<ProfileDetails[]>([]);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [username, setUsername] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState('');

  useEffect(() => {
    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      (typeof window !== 'undefined' ? window.location.host : '');
    const cleanUrl = frontendUrl.replace(/https?:\/\//, '').replace(/\/$/, '');
    setDisplayUrl(cleanUrl);

    const email = storage.getUserEmail();
    if (email) {
      const prefix = email.split('@')[0];
      setUsername(prefix);
    }
    setUserImage(storage.getUserImage());

    const fetchProfiles = async () => {
      try {
        const userProfiles = await profileService.listAllProfiles();
        setProfiles(userProfiles);
      } catch (err) {
        console.error('Failed to load profiles for dashboard:', err);
      }
    };
    fetchProfiles();
  }, []);

  const activeProfile = activeSlide < profiles.length ? profiles[activeSlide] : null;
  const activeProfileId = activeProfile?.id || null;

  const handleDeleteProfile = async () => {
    if (!activeProfileId) return;
    if (!confirm('Are you sure you want to delete this profile?')) return;
    try {
      await profileService.deleteProfile(activeProfileId);
      alert('Profile deleted successfully.');
      window.location.reload(); // Reload to refresh state
    } catch (err) {
      console.error('Failed to delete profile:', err);
      alert('Failed to delete profile.');
    }
  };

  return (
    <main className="flex min-h-screen bg-[#191c1e] text-[#e3e2e6] relative font-sans">
      {/* Sidebar Navigation */}
      <div className="fixed md:left-6 left-1/2 bottom-6 md:bottom-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 z-20">
        <div className="bg-[#202528]/80 backdrop-blur-md border border-[#2d3236] rounded-full py-3 px-6 md:py-3.5 md:px-3 flex flex-row md:flex-col items-center gap-3.5 shadow-2xl">
          {/* Home/Dashboard - Active */}
          <button
            className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full transition-all cursor-pointer"
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
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer"
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
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 md:pb-6 md:pl-28 min-h-screen">
        {/* Dynamic Carousel Header */}
        <div className="text-center h-28 flex flex-col items-center justify-center mb-4 transition-all duration-300">
          {activeProfile ? (
            <div className="flex flex-col items-center justify-center gap-3 animate-fadeIn">
              <h2 className="text-zinc-200 text-lg font-medium tracking-wide">
                {displayUrl}/
                {activeProfile.display_name?.toLowerCase().replace(/\s+/g, '') || 'page'}
              </h2>
              <div className="flex items-center justify-center gap-3">
                {/* View Live */}
                <a
                  href={
                    displayUrl
                      ? `http://${displayUrl}/${activeProfile.display_name?.toLowerCase().replace(/\s+/g, '')}`
                      : '#'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[#202528] hover:bg-[#2d3236] border border-[#2d3236] text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer inline-block"
                  title="View Live Page"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
                {/* Edit Profile */}
                <Link
                  href={`/editor?profileId=${activeProfile.id}`}
                  className="p-2 bg-[#202528] hover:bg-[#2d3236] border border-[#2d3236] text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer inline-block"
                  title="Edit Profile"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </Link>
                {activeProfileId && (
                  <button
                    onClick={handleDeleteProfile}
                    className="p-2 bg-[#202528] hover:bg-red-950/60 border border-red-900/50 hover:border-red-700 text-red-400 hover:text-red-300 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                    title="Delete Profile"
                  >
                    <img
                      src="/images/svg/icons/trash.svg"
                      alt="Delete Profile"
                      className="w-4 h-4 filter invert-[0.2] sepia-[1] saturate-[8] hue-rotate-[340deg]"
                    />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <h2 className="text-zinc-200 text-lg font-medium tracking-wide">Create new page</h2>
            </div>
          )}
        </div>

        {/* Center Content Cards Slider */}
        <div
          className="w-64 h-[390px] overflow-visible relative flex justify-start items-center select-none cursor-grab active:cursor-grabbing"
          onWheel={(e) => {
            if (e.deltaY > 0) {
              if (activeSlide < profiles.length) {
                setActiveSlide((prev) => prev + 1);
              }
            } else if (e.deltaY < 0) {
              if (activeSlide > 0) {
                setActiveSlide((prev) => prev - 1);
              }
            }
          }}
        >
          <div
            className="flex gap-8 transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${activeSlide * 288}px)`,
            }}
          >
            {/* Dynamic Profiles */}
            {profiles.map((p, idx) => (
              <Link
                key={p.id}
                href={`/editor?profileId=${p.id}`}
                className={`w-64 h-[380px] bg-white border border-[#2d3236] rounded-3xl relative overflow-hidden flex flex-col items-center justify-center shadow-2xl transition-all duration-500 shrink-0 cursor-pointer ${
                  activeSlide === idx
                    ? 'scale-100 opacity-100'
                    : 'scale-95 opacity-30 pointer-events-none'
                }`}
              >
                <div className="w-32 h-32 rounded-full overflow-hidden bg-[#8bf825] flex items-center justify-center border-4 border-white shadow-lg">
                  {/* Ghost logo inside green circle */}
                  <svg
                    className="w-20 h-20 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <path
                      d="M12 2C7.58 2 4 5.58 4 10v9c0 .55.45 1 1 1h.5c.83 0 1.5-.67 1.5-1.5s.67-1.5 1.5-1.5.67.67 1.5 1.5.67 1.5 1.5 1.5h.5c.83 0 1.5-.67 1.5-1.5s.67-1.5 1.5-1.5.67.67 1.5 1.5c.83 0 1.5.67 1.5 1.5h.5c.55 0 1-.45 1-1v-9c0-4.42-3.58-8-8-8z"
                      fill="white"
                    />
                    <circle cx="9" cy="10" r="1" fill="black" />
                    <circle cx="15" cy="10" r="1" fill="black" />
                    <path
                      d="M12 13.5c-.5 0-.7.2-.7.5s.2.5.7.5.7-.2.7-.5-.2-.5-.7-.5z"
                      fill="black"
                    />
                  </svg>
                </div>

                <div className="mt-6 text-center px-4 w-full">
                  <h3 className="text-zinc-800 text-lg font-bold truncate">
                    {p.display_name || 'My page'}
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1 truncate">{p.bio || 'Your bio...'}</p>
                </div>

                {/* Minimalist icon inside purple circle at bottom center */}
                <div className="absolute bottom-6 w-9 h-9 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg border border-white/20">
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="7" r="3.5" />
                    <path d="M5 20a7 7 0 0114 0" />
                  </svg>
                </div>
              </Link>
            ))}

            {/* Right Create Card */}
            <Link
              href="/editor"
              className={`w-64 h-[380px] bg-[#202528]/40 border border-[#2d3236]/80 rounded-3xl flex items-center justify-center shadow-2xl relative group overflow-hidden transition-all duration-500 shrink-0 cursor-pointer ${
                activeSlide === profiles.length
                  ? 'scale-100 opacity-100'
                  : 'scale-95 opacity-30 pointer-events-none'
              }`}
            >
              {/* Soft background light */}
              <div className="absolute -inset-y-12 w-32 bg-white/2 blur-[80px] rounded-full pointer-events-none group-hover:bg-white/5 transition-all duration-300" />

              {/* Large centered Plus icon */}
              <svg
                className="w-10 h-10 text-zinc-400 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Carousel Indicators (Dots) */}
        <div className="flex items-center justify-center space-x-3 mt-8 z-10">
          {profiles.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === idx
                  ? 'bg-white w-3 h-3 shadow-sm'
                  : 'bg-[#5a626a] w-1.5 h-1.5 hover:bg-zinc-400'
              }`}
              aria-label={`Active page ${idx + 1}`}
            />
          ))}
          <button
            onClick={() => setActiveSlide(profiles.length)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === profiles.length
                ? 'bg-white w-3 h-3 shadow-sm'
                : 'bg-[#5a626a] w-1.5 h-1.5 hover:bg-zinc-400'
            }`}
            aria-label="Create page"
          />
        </div>
      </div>
    </main>
  );
}
