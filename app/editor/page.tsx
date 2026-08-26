'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { profileService, ProfileDetails } from '../../lib/services/profile';
import { blockService, BlockDetails } from '../../lib/services/block';
import { EditorHeader } from '../../components/editor/EditorHeader';
import { ProfileEditor } from '../../components/editor/ProfileEditor';
import { BlockCard } from '../../components/editor/BlockCard';
import { SuggestionCard } from '../../components/editor/SuggestionCard';
import { BottomControls } from '../../components/editor/BottomControls';

export default function EditorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [profiles, setProfiles] = useState<ProfileDetails[]>([]);
  const [blocks, setBlocks] = useState<BlockDetails[]>([]);

  // Editable profile state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  // Suggestion visibility state
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [displayUrl, setDisplayUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Dynamic domain URL setup
    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      (typeof window !== 'undefined' ? window.location.host : '');
    const cleanUrl = frontendUrl.replace(/https?:\/\//, '').replace(/\/$/, '');
    setDisplayUrl(cleanUrl);

    loadEditorData();
  }, []);

  const loadEditorData = async () => {
    try {
      // 1. Get or create user profile
      let userProfiles = await profileService.listAllProfiles();
      setProfiles(userProfiles);

      const params = new URLSearchParams(window.location.search);
      const queryProfileId = params.get('profileId');

      let activeProfile: ProfileDetails;
      if (userProfiles.length === 0) {
        // Create a default first profile if none exist
        activeProfile = await profileService.createProfile({
          display_name: 'Your name',
          bio: 'Your bio...',
          theme_id: 'default',
          is_published: true,
        });
        setProfiles([activeProfile]);
      } else {
        if (queryProfileId) {
          activeProfile = userProfiles.find((p) => p.id === queryProfileId) || userProfiles[0];
        } else {
          activeProfile = userProfiles[0];
        }
      }

      setProfile(activeProfile);
      setDisplayName(activeProfile.display_name || '');
      setBio(activeProfile.bio || '');

      // 2. Load blocks belonging to active profile
      const activeBlocks = await blockService.listAllBlocks(activeProfile.id);
      setBlocks(activeBlocks);
    } catch (err) {
      console.error('Failed to load editor data:', err);
    }
  };

  // Switch profiles/pages via dropdown
  const handleProfileSwitch = async (profileId: string) => {
    const selected = profiles.find((p) => p.id === profileId);
    if (selected) {
      setProfile(selected);
      setDisplayName(selected.display_name || '');
      setBio(selected.bio || '');
      const activeBlocks = await blockService.listAllBlocks(selected.id);
      setBlocks(activeBlocks);
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = await profileService.updateProfile(profile.id, {
        display_name: displayName,
        bio: bio,
      });
      setProfile(updated);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Create block from suggestion
  const handleAddBlock = async (type: string, title: string) => {
    if (!profile) return;
    try {
      const newBlock = await blockService.createBlock({
        profile_id: profile.id,
        type,
        title,
        url: 'https://',
        position: blocks.length + 1,
      });
      setBlocks((prev) => [...prev, newBlock]);
    } catch (err) {
      console.error('Failed to create block:', err);
    }
  };

  // Delete an existing block
  const handleDeleteBlock = async (blockId: string) => {
    try {
      await blockService.deleteBlock(blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    } catch (err) {
      console.error('Failed to delete block:', err);
    }
  };

  // Suggestion Blocks structure
  const suggestions = [
    { type: 'link', title: 'Add Link', widthClass: 'w-full md:w-1/3' },
    { type: 'image', title: 'Add Image', widthClass: 'w-full md:w-1/2' },
    { type: 'link', title: 'Add Link', widthClass: 'w-full md:w-1/3' },
    { type: 'spotify', title: 'Add Spotify', widthClass: 'w-full md:w-1/2' },
    { type: 'youtube', title: 'Add Youtube', widthClass: 'w-full md:w-1/2' },
  ];

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-[#fafbfc] text-[#191c1e] font-sans antialiased relative">
      <EditorHeader
        profile={profile}
        profiles={profiles}
        displayUrl={displayUrl}
        onProfileSwitch={handleProfileSwitch}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-8 overflow-hidden">
        <ProfileEditor
          displayName={displayName}
          bio={bio}
          onDisplayNameChange={(val) => {
            setDisplayName(val);
          }}
          onBioChange={(val) => {
            setBio(val);
          }}
        />

        {/* Right column: Blocks layout editor */}
        <div className="lg:col-span-8 space-y-6 pb-36 h-full overflow-y-auto pr-2">
          {/* Add a Title Input */}
          <div className="w-full pb-2">
            <input
              type="text"
              value={pageTitle}
              placeholder="Add a title..."
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-full text-3xl font-semibold text-[#191c1e] placeholder-zinc-300 bg-transparent border-none outline-none"
            />
          </div>

          {/* Grid Layout containing active blocks + suggestions */}
          <div className="flex flex-wrap gap-6 items-start w-full">
            {/* 1. Saved/Active Blocks */}
            {blocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onDelete={handleDeleteBlock}
              />
            ))}

            {/* 2. Suggestion Placeholders (shown when showSuggestions is true) */}
            {showSuggestions &&
              suggestions.map((s, idx) => (
                <SuggestionCard
                  key={`suggest-${idx}`}
                  type={s.type}
                  title={s.title}
                  widthClass={s.widthClass}
                  onAdd={handleAddBlock}
                />
              ))}
          </div>
        </div>
      </div>

      <BottomControls
        showSuggestions={showSuggestions}
        onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
      />
    </main>
  );
}
