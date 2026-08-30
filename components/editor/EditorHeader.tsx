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
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
}

export function EditorHeader({
  profile,
  profiles,
  displayUrl,
  onProfileSwitch,
  onSave,
  isSaving,
  showSuggestions,
  onToggleSuggestions,
}: EditorHeaderProps) {
  return (
    <header className="w-full flex items-start justify-between px-6 py-4">
      <div className="flex items-center space-x-3">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="p-2.5 hover:bg-[#e1e3e5] rounded-full transition-colors cursor-pointer text-[#5a626a]"
        >
          <img src="/images/svg/icons/left-arrow.svg" alt="Back" className="w-6 h-6" />
        </Link>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving || !profile}
          className="flex items-center space-x-2 max-[425px]:space-x-0 px-4 py-2 max-[425px]:px-2.5 bg-black hover:bg-zinc-800 text-white rounded-full transition-colors cursor-pointer text-sm font-semibold disabled:opacity-50"
        >
          <img src="/images/svg/icons/save.svg" alt="Save" className="w-4.5 h-4.5 invert" />
          <span className="max-[425px]:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {/* Right Side Column (Dropdown Selector + Mobile Share/Trash) */}
      <div className="flex flex-col items-end space-y-2">
        {profile && (
          <div className="relative">
            <select
              value={profile.id}
              onChange={(e) => onProfileSwitch(e.target.value)}
              className="appearance-none bg-white hover:bg-[#fafbfc] border border-[#e1e3e5] rounded-full py-2 pl-5 pr-10 max-[425px]:pl-0 max-[425px]:pr-0 max-[425px]:w-10 max-[425px]:h-10 max-[425px]:text-transparent text-sm font-medium text-[#191c1e] shadow-sm outline-none cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="text-[#191c1e]">
                  {displayUrl}/{p.display_name?.toLowerCase().replace(/\s+/g, '') || 'page'}
                </option>
              ))}
            </select>
            <div className="absolute right-4 max-[425px]:right-0 max-[425px]:left-0 max-[425px]:mx-auto max-[425px]:w-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5a626a]">
              <img src="/images/svg/icons/down-arrow.svg" alt="Dropdown" className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Mobile-only additional header controls (Share and Trash/Suggestions) */}
        <div className="hidden max-[425px]:flex flex-col items-end space-y-2">
          {/* Trash/Suggestions Button */}
          <button
            onClick={onToggleSuggestions}
            className="flex items-center justify-center p-2.5 bg-white hover:bg-zinc-50 border border-[#e1e3e5] rounded-2xl shadow-md cursor-pointer text-[#5a626a] hover:text-black"
          >
            <img src="/images/svg/icons/trash.svg" alt="Toggle Suggestions" className="w-5 h-5" />
          </button>
          {/* Share Button */}
          <button className="flex items-center justify-center p-2.5 bg-white hover:bg-zinc-50 border border-[#e1e3e5] rounded-2xl shadow-md cursor-pointer text-[#191c1e]">
            <img src="/images/svg/icons/share.svg" alt="Share" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
