'use client';

interface ProfileEditorProps {
  displayName: string;
  bio: string;
  onDisplayNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
}

export function ProfileEditor({
  displayName,
  bio,
  onDisplayNameChange,
  onBioChange,
}: ProfileEditorProps) {
  return (
    <div className="w-full flex flex-col items-center text-center space-y-6 pt-6">
      {/* Large Avatar preview */}
      <div className="w-44 h-44 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center border-4 border-white shadow-xl">
        {/* Image Placeholder */}
        <img
          src="/images/svg/icons/image-placeholder.svg"
          alt="Profile Placeholder"
          className="w-20 h-20 opacity-60"
        />
      </div>

      {/* Editable Display Name */}
      <div className="w-full">
        <input
          type="text"
          value={displayName}
          placeholder="Your name"
          onChange={(e) => onDisplayNameChange(e.target.value)}
          className="w-full text-center text-4xl font-extrabold text-[#191c1e] placeholder-zinc-300 border-none outline-none bg-transparent"
        />
      </div>

      {/* Editable Bio */}
      <div className="w-full">
        <textarea
          value={bio}
          placeholder="Your bio..."
          onChange={(e) => onBioChange(e.target.value)}
          rows={2}
          className="w-full text-center text-[17px] text-[#5a626a] placeholder-zinc-300 border-none outline-none bg-transparent resize-none leading-relaxed"
        />
      </div>
    </div>
  );
}
