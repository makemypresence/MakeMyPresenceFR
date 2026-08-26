'use client';

import Link from 'next/link';
import { ProfileDetails } from '../../lib/services/profile';

interface EditorHeaderProps {
  profile: ProfileDetails | null;
  profiles: ProfileDetails[];
  displayUrl: string;
  onProfileSwitch: (profileId: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditorHeader({
  profile,
  profiles,
  displayUrl,
  onProfileSwitch,
  onSave,
  isSaving,
}: EditorHeaderProps) {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4">
      <div className="flex items-center space-x-3">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="p-2.5 hover:bg-[#e1e3e5] rounded-full transition-colors cursor-pointer text-[#5a626a]"
        >
          <img
            src="/images/svg/icons/left-arrow.svg"
            alt="Back"
            className="w-6 h-6"
          />
        </Link>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving || !profile}
          className="flex items-center space-x-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-full transition-colors cursor-pointer text-sm font-semibold disabled:opacity-50"
        >
          <img
            src="/images/svg/icons/save.svg"
            alt="Save"
            className="w-4.5 h-4.5 invert"
          />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {/* Dynamic page URL selector */}
      {profile && (
        <div className="relative">
          <select
            value={profile.id}
            onChange={(e) => onProfileSwitch(e.target.value)}
            className="appearance-none bg-white hover:bg-[#fafbfc] border border-[#e1e3e5] rounded-full py-2 pl-5 pr-10 text-sm font-medium text-[#191c1e] shadow-sm outline-none cursor-pointer"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {displayUrl}/{p.display_name?.toLowerCase().replace(/\s+/g, '') || 'page'}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5a626a]">
            <img
              src="/images/svg/icons/down-arrow.svg"
              alt="Dropdown"
              className="w-4 h-4"
            />
          </div>
        </div>
      )}
    </header>
  );
}
