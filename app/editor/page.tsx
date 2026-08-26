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
import { DEFAULT_BLOCK_DIMENSIONS } from '../../lib/utils/dimensions';

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
  const [deletedBlockIds, setDeletedBlockIds] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  // Save profile and synchronize blocks changes
  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      // 1. Save profile details
      const updated = await profileService.updateProfile(profile.id, {
        display_name: displayName,
        bio: bio,
      });
      setProfile(updated);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

      // 2. Sync deleted blocks
      for (const id of deletedBlockIds) {
        await blockService.deleteBlock(id);
      }
      setDeletedBlockIds([]);

      // 3. Sync created/updated blocks
      const syncedBlocks: BlockDetails[] = [];
      for (const block of blocks) {
        if (block.id.startsWith('temp-')) {
          // Create block on server
          const newBlock = await blockService.createBlock({
            profile_id: profile.id,
            type: block.type,
            title: block.title,
            url: block.url,
            position: block.position,
            layout: block.layout,
          });
          syncedBlocks.push(newBlock);
        } else {
          // Keep existing block
          syncedBlocks.push(block);
        }
      }
      setBlocks(syncedBlocks);
    } catch (err) {
      console.error('Failed to save changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Add block locally with a temporary ID
  const handleAddBlock = (type: string, title: string) => {
    if (!profile) return;
    const defaultDim = DEFAULT_BLOCK_DIMENSIONS[type] || { w: 2, h: 2 };
    const hVal = defaultDim.h === 'infinite' ? 2 : defaultDim.h;

    const tempBlock: BlockDetails = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      profile_id: profile.id,
      type,
      title,
      url: 'https://',
      position: blocks.length + 1,
      layout: {
        desktop: { w: defaultDim.w, h: hVal },
        mobile: { w: defaultDim.w, h: hVal },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBlocks((prev) => [...prev, tempBlock]);
  };

  // Delete block locally, tracking DB IDs for synchronization on Save click
  const handleDeleteBlock = (blockId: string) => {
    if (!blockId.startsWith('temp-')) {
      setDeletedBlockIds((prev) => [...prev, blockId]);
    }
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  // Drag and Drop arrangement handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...blocks];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Update positions
    const updated = reordered.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
    setBlocks(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Suggestion Blocks structure
  const suggestions = [
    { type: 'title', title: 'Add Title', colSpan: 'col-span-4' },
    { type: 'link', title: 'Add Link', colSpan: 'col-span-1' },
    { type: 'image', title: 'Add Image', colSpan: 'col-span-2' },
    { type: 'link', title: 'Add Link', colSpan: 'col-span-1' },
    { type: 'spotify', title: 'Add Spotify', colSpan: 'col-span-2' },
    { type: 'youtube', title: 'Add Youtube', colSpan: 'col-span-2' },
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
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 overflow-hidden">
        {/* Left Column (1/3) */}
        <div className="lg:col-span-1 h-full overflow-y-auto pr-2">
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
        </div>

        {/* Right column: Blocks layout editor (2/3) */}
        <div className="lg:col-span-2 space-y-6 pb-36 h-full overflow-y-auto pr-2 max-w-[980px] w-full px-5">
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
          <div className="grid grid-cols-1 md:grid-cols-[repeat(4,215px)] gap-0 w-full items-start">
            {/* 1. Saved/Active Blocks */}
            {blocks.map((block, idx) => (
              <BlockCard
                key={block.id}
                block={block}
                onDelete={handleDeleteBlock}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                isDragging={draggedIndex === idx}
              />
            ))}

            {/* 2. Suggestion Placeholders (shown when showSuggestions is true) */}
            {showSuggestions &&
              suggestions.map((s, idx) => (
                <SuggestionCard
                  key={`suggest-${idx}`}
                  type={s.type}
                  title={s.title}
                  colSpan={s.colSpan}
                  onAdd={handleAddBlock}
                />
              ))}
          </div>
        </div>
      </div>

      <BottomControls
        showSuggestions={showSuggestions}
        onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
        onAddBlock={handleAddBlock}
      />
    </main>
  );
}
