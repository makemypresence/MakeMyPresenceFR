'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { profileService, ProfileDetails } from '../../lib/services/profile';
import { blockService, BlockDetails } from '../../lib/services/block';
import { EditorHeader } from '../../components/editor/EditorHeader';
import { ProfileEditor } from '../../components/editor/ProfileEditor';
import { BlockCard } from '../../components/editor/BlockCard';
import { SuggestionCard } from '../../components/editor/SuggestionCard';
import { BottomControls } from '../../components/editor/BottomControls';
import { DEFAULT_BLOCK_DIMENSIONS, getBoxDimensions } from '../../lib/utils/dimensions';

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
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragActiveRef = useRef(false);

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
          // Update existing block on server to save any changes (e.g. edited title)
          const updatedBlock = await blockService.updateBlock(block.id, {
            title: block.title,
            url: block.url,
            position: block.position,
            layout: block.layout,
          });
          syncedBlocks.push(updatedBlock);
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

    const isInputBlock = type === 'title' || type === 'text' || type === 'link' || type === 'tile';

    const tempBlock: BlockDetails = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      profile_id: profile.id,
      type,
      title: isInputBlock ? '' : title,
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

  // Update block properties locally
  const handleUpdateBlock = (blockId: string, updates: Partial<BlockDetails>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );
  };

  // Drag and Drop arrangement handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    dragActiveRef.current = true;
    setTimeout(() => {
      if (dragActiveRef.current) {
        setDraggedIndex(index);
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
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
    dragActiveRef.current = false;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Helper type for drag-and-drop placeholder grids
  interface GridItem {
    type: 'block' | 'empty';
    block?: BlockDetails;
    index?: number;
    insertIndex?: number;
    w: number;
    h: number | 'infinite';
  }

  // Generate grid items including empty slot placeholders for drag-and-drop
  const getGridItems = (): GridItem[] => {
    const items: GridItem[] = [];
    if (draggedIndex === null) return [];

    const draggedBlock = blocks[draggedIndex];
    const dragW = draggedBlock.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[draggedBlock.type]?.w || 2;
    const dragH = draggedBlock.layout?.desktop?.h || DEFAULT_BLOCK_DIMENSIONS[draggedBlock.type]?.h || 2;

    // Start with a placeholder at the very beginning (position 0)
    items.push({
      type: 'empty',
      w: dragW,
      h: dragH,
      insertIndex: 0,
    });
    
    let currentColumn = dragW;

    blocks.forEach((block, idx) => {
      if (idx === draggedIndex) return;
      const w = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
      
      // If it doesn't fit in the current row:
      if (currentColumn + w > 4) {
        const remainingSpace = 4 - currentColumn;
        if (remainingSpace >= dragW) {
          items.push({
            type: 'empty',
            w: dragW,
            h: dragH,
            insertIndex: idx,
          });
        }
        currentColumn = 0;
      }

      items.push({
        type: 'block',
        block,
        index: idx,
        w,
        h: block.layout?.desktop?.h || DEFAULT_BLOCK_DIMENSIONS[block.type]?.h || 2,
      });

      currentColumn += w;
      if (currentColumn === 4) {
        currentColumn = 0;
      }
    });

    // Always append an empty placeholder at the end of the grid items
    items.push({
      type: 'empty',
      w: dragW,
      h: dragH,
      insertIndex: blocks.length,
    });

    return items;
  };

  // Move dragged block to an empty slot position
  const handleDropOnEmpty = (insertIndex: number) => {
    if (draggedIndex === null) return;
    
    const reordered = [...blocks];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    
    let finalInsertIndex = insertIndex;
    if (draggedIndex < insertIndex) {
      finalInsertIndex = insertIndex - 1;
    }
    
    reordered.splice(finalInsertIndex, 0, movedItem);

    // Update positions
    const updated = reordered.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
    setBlocks(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
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
            {/* 1. Saved/Active Blocks & Drag Placeholders */}
            {draggedIndex !== null
              ? getGridItems().map((item, idx) => {
                  if (item.type === 'block') {
                    return (
                      <BlockCard
                        key={item.block!.id}
                        block={item.block!}
                        onDelete={handleDeleteBlock}
                        onUpdate={handleUpdateBlock}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.index!)}
                        onDragOver={(e) => handleDragOver(e, item.index!)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, item.index!)}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedIndex === item.index}
                        isDragOver={dragOverIndex === item.index}
                      />
                    );
                  } else {
                    // Empty drop zone placeholder slot matching drag dimensions
                    const dims = getBoxDimensions(item.w, item.h);
                    const isOver = dragOverIndex === -(idx + 1);
                    return (
                      <div
                        key={`empty-${idx}`}
                        style={{ height: dims.outerHeight === 'infinite' ? 'auto' : `${dims.outerHeight}px` }}
                        className={`col-span-${item.w} w-full flex items-center justify-center`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverIndex(-(idx + 1));
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDropOnEmpty(item.insertIndex!)}
                      >
                        <div
                          style={{
                            width: `${dims.innerWidth}px`,
                            height: dims.innerHeight === 'infinite' ? 'auto' : `${dims.innerHeight}px`,
                          }}
                          className="rounded-[14px] transition-all duration-200 bg-zinc-100/50 border-transparent shadow-[inset_0_2px_5px_rgba(0,0,0,0.08)]"
                        />
                      </div>
                    );
                  }
                })
              : blocks.map((block, idx) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    onDelete={handleDeleteBlock}
                    onUpdate={handleUpdateBlock}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === idx}
                    isDragOver={dragOverIndex === idx}
                  />
                ))}

            {/* 2. Suggestion Placeholders (shown when showSuggestions is true and not dragging) */}
            {showSuggestions && draggedIndex === null &&
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
