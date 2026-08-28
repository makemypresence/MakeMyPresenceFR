'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { profileService, ProfileDetails } from '../../lib/services/profile';
import { blockService, BlockDetails } from '../../lib/services/block';
import { EditorHeader } from '../../components/editor/EditorHeader';
import { ProfileEditor } from '../../components/editor/ProfileEditor';
import { BlockCard } from '../../components/editor/BlockCard';
import { SuggestionCard } from '../../components/editor/SuggestionCard';
import { BottomControls } from '../../components/editor/BottomControls';
import { DEFAULT_BLOCK_DIMENSIONS, getBoxDimensions } from '../../lib/utils/dimensions';
const removeEmptyRows = (allBlocks: BlockDetails[]): BlockDetails[] => {
  const result: BlockDetails[] = [];
  let currentRow: BlockDetails[] = [];
  let currentColumn = 0;

  allBlocks.forEach((block) => {
    const w = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
    
    if (currentColumn + w > 4) {
      const hasRealBlock = currentRow.some(b => b.type !== 'spacer');
      if (hasRealBlock) {
        result.push(...currentRow);
      }
      currentRow = [];
      currentColumn = 0;
    }

    currentRow.push(block);
    currentColumn += w;
    if (currentColumn === 4) {
      const hasRealBlock = currentRow.some(b => b.type !== 'spacer');
      if (hasRealBlock) {
        result.push(...currentRow);
      }
      currentRow = [];
      currentColumn = 0;
    }
  });

  if (currentRow.length > 0) {
    const hasRealBlock = currentRow.some(b => b.type !== 'spacer');
    if (hasRealBlock) {
      result.push(...currentRow);
    }
  }

  return result;
};

const fillSpacers = (existingBlocks: BlockDetails[]): BlockDetails[] => {
  const result: BlockDetails[] = [];
  let currentColumn = 0;

  // Filter out any existing spacers first to avoid duplicate spacers
  const nonSpacers = existingBlocks.filter(b => b.type !== 'spacer');

  nonSpacers.forEach((block) => {
    const w = block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2;
    
    // If it doesn't fit in the current row:
    if (currentColumn + w > 4) {
      const remainingSpace = 4 - currentColumn;
      for (let k = 0; k < remainingSpace; k++) {
        result.push({
          id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${k}`,
          profile_id: '',
          type: 'spacer',
          position: result.length + 1,
          layout: {
            desktop: { w: 1, h: 2 },
            mobile: { w: 1, h: 2 },
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      currentColumn = 0;
    }

    result.push(block);
    currentColumn += w;
    if (currentColumn === 4) {
      currentColumn = 0;
    }
  });

  // Fill the remaining space of the last row
  if (currentColumn > 0) {
    const remainingSpace = 4 - currentColumn;
    for (let k = 0; k < remainingSpace; k++) {
      result.push({
        id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-end-${k}`,
        profile_id: '',
        type: 'spacer',
        position: result.length + 1,
        layout: {
          desktop: { w: 1, h: 2 },
          mobile: { w: 1, h: 2 },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return removeEmptyRows(result);
};

// Append a new block to the end of the layout, preserving existing positions (drag gaps).
// Strips trailing spacers from the last row, checks if the new block fits in the remaining
// space. If not, pads the row and starts a new one.
const appendBlock = (existingBlocks: BlockDetails[], newBlock: BlockDetails): BlockDetails[] => {
  const makeSpacer = () => ({
    id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    profile_id: '',
    type: 'spacer',
    position: 0,
    layout: { desktop: { w: 1, h: 2 }, mobile: { w: 1, h: 2 } },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // 1. Remove trailing spacers from end
  const blocks = [...existingBlocks];
  while (blocks.length > 0 && blocks[blocks.length - 1].type === 'spacer') {
    blocks.pop();
  }

  // 2. Calculate current column position after all existing blocks
  let currentColumn = 0;
  blocks.forEach((block) => {
    const w = block.type === 'spacer' ? 1 : (block.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[block.type]?.w || 2);
    currentColumn += w;
    if (currentColumn >= 4) currentColumn = 0;
  });

  // 3. Check if new block fits in remaining space of the current row
  const newW = newBlock.layout?.desktop?.w || DEFAULT_BLOCK_DIMENSIONS[newBlock.type]?.w || 2;

  if (currentColumn > 0 && currentColumn + newW > 4) {
    // Doesn't fit — pad the current row and start a new one
    const remaining = 4 - currentColumn;
    for (let k = 0; k < remaining; k++) {
      blocks.push(makeSpacer());
    }
    currentColumn = 0;
  }

  // 4. Append the new block
  blocks.push(newBlock);
  currentColumn += newW;

  // 5. Pad the final row with trailing spacers
  if (currentColumn > 0 && currentColumn < 4) {
    const remaining = 4 - currentColumn;
    for (let k = 0; k < remaining; k++) {
      blocks.push(makeSpacer());
    }
  }

  return blocks;
};

export default function EditorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [profiles, setProfiles] = useState<ProfileDetails[]>([]);
  const [blocks, setBlocks] = useState<BlockDetails[]>([]);

  // Editable profile state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Suggestion visibility state
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [displayUrl, setDisplayUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletedBlockIds, setDeletedBlockIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      let activeBlocks = await blockService.listAllBlocks(activeProfile.id);
      if (activeBlocks.length === 0) {
        const defaultTitleBlock: BlockDetails = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          profile_id: activeProfile.id,
          type: 'title',
          title: '',
          url: 'https://',
          position: 1,
          layout: {
            desktop: { w: 4, h: 1 },
            mobile: { w: 4, h: 1 },
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        activeBlocks = [defaultTitleBlock];
      }
      setBlocks(fillSpacers(activeBlocks));
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
      let activeBlocks = await blockService.listAllBlocks(selected.id);
      if (activeBlocks.length === 0) {
        const defaultTitleBlock: BlockDetails = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          profile_id: selected.id,
          type: 'title',
          title: '',
          url: 'https://',
          position: 1,
          layout: {
            desktop: { w: 4, h: 1 },
            mobile: { w: 4, h: 1 },
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        activeBlocks = [defaultTitleBlock];
      }
      setBlocks(fillSpacers(activeBlocks));
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
      const nonSpacers = blocks.filter((b) => b.type !== 'spacer');
      for (const block of nonSpacers) {
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
      setBlocks(fillSpacers(syncedBlocks));
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
    setBlocks((prev) => appendBlock(prev, tempBlock));
  };

  // Delete block locally, tracking DB IDs for synchronization on Save click
  const handleDeleteBlock = (blockId: string) => {
    if (!blockId.startsWith('temp-')) {
      setDeletedBlockIds((prev) => [...prev, blockId]);
    }
    setBlocks((prev) => {
      const updated = prev.map((b) =>
        b.id === blockId
          ? {
              id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              profile_id: '',
              type: 'spacer',
              position: b.position,
              layout: {
                desktop: { w: b.layout?.desktop?.w || 1, h: b.layout?.desktop?.h || 2 },
                mobile: { w: b.layout?.mobile?.w || 1, h: b.layout?.mobile?.h || 2 },
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : b
      );
      return removeEmptyRows(updated);
    });
  };

  // Update block properties locally
  const handleUpdateBlock = (blockId: string, updates: Partial<BlockDetails>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );
  };



  // Drag and Drop arrangement handlers using @dnd-kit
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr !== overIdStr) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === activeIdStr);
        const newIndex = prev.findIndex((item) => item.id === overIdStr);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(prev, oldIndex, newIndex);
          return reordered.map((item, idx) => ({
            ...item,
            position: idx + 1,
          }));
        }
        return prev;
      });
    }
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  // Suggestion Blocks structure
  const suggestions = [
    { type: 'link', title: 'Add Link', colSpan: 'col-span-1' },
    { type: 'image', title: 'Add Image', colSpan: 'col-span-2' },
    { type: 'link', title: 'Add Link', colSpan: 'col-span-1' },
    // { type: 'spotify', title: 'Add Spotify', colSpan: 'col-span-2' },
    // { type: 'youtube', title: 'Add Youtube', colSpan: 'col-span-2' },
  ];



  // Split blocks so the initial title block is rendered above suggestions,
  // and all subsequent created/content blocks are rendered below suggestions.
  const titleBlocks = blocks.length > 0 && blocks[0].type === 'title' ? [blocks[0]] : [];
  const otherBlocks = blocks.length > 0 && blocks[0].type === 'title' ? blocks.slice(1) : blocks;

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


          {/* Grid Layout containing active blocks + suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-[repeat(4,215px)] gap-0 w-full items-start">
            {/* 1. Saved/Active Blocks */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((block) => block.id)}
                strategy={rectSortingStrategy}
              >
                {/* 1. Top Title Block (if present) */}
                {titleBlocks.map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    onDelete={handleDeleteBlock}
                    onUpdate={handleUpdateBlock}
                  />
                ))}

                {/* 2. Suggestion Placeholders (shown between Top Title Block and content blocks) */}
                {showSuggestions && activeId === null &&
                  suggestions.map((s, idx) => (
                    <SuggestionCard
                      key={`suggest-${idx}`}
                      type={s.type}
                      title={s.title}
                      colSpan={s.colSpan}
                      onAdd={handleAddBlock}
                    />
                  ))}

                {/* 3. Created / Content Blocks */}
                {otherBlocks.map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    onDelete={handleDeleteBlock}
                    onUpdate={handleUpdateBlock}
                  />
                ))}
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <BlockCard
                    block={blocks.find((b) => b.id === activeId)!}
                    onDelete={handleDeleteBlock}
                    onUpdate={handleUpdateBlock}
                    isOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
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
