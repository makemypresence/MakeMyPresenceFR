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
import { removeEmptyRows, fillSpacers, appendBlock } from '../../lib/utils/layout';

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
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
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

    // Listen to resize and force mobile view if below 1025px
    const handleResize = () => {
      if (window.innerWidth <= 1025) {
        setViewMode('mobile');
      } else {
        setViewMode('desktop');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call initially

    return () => {
      window.removeEventListener('resize', handleResize);
    };
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

  const handleAddSuggestionBlock = (type: string, title: string, suggestionIndex: number) => {
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
      position: 1,
      layout: {
        desktop: { w: defaultDim.w, h: hVal },
        mobile: { w: defaultDim.w, h: hVal },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const makeSpacer = () => ({
      id: `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      profile_id: '',
      type: 'spacer',
      position: 0,
      layout: { desktop: { w: 1, h: 2 }, mobile: { w: 1, h: 2 } },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const titleBlocks = blocks.length > 0 && blocks[0].type === 'title' ? [blocks[0]] : [];
    const other = blocks.length > 0 && blocks[0].type === 'title' ? blocks.slice(1) : blocks;

    const firstRow: BlockDetails[] = [];
    const remaining: BlockDetails[] = [];
    let currentColCount = 0;

    other.forEach((b) => {
      const w = b.type === 'spacer' ? 1 : (b.layout?.desktop?.w || 2);
      if (currentColCount < 4) {
        firstRow.push(b);
        currentColCount += w;
      } else {
        remaining.push(b);
      }
    });

    while (currentColCount < 4) {
      firstRow.push(makeSpacer());
      currentColCount += 1;
    }

    let targetColStart = 0;
    let targetW = 1;
    if (suggestionIndex === 1) {
      targetColStart = 1;
      targetW = 2;
    } else if (suggestionIndex === 2) {
      targetColStart = 3;
      targetW = 1;
    }

    const slots: (BlockDetails | null)[] = [null, null, null, null];
    let colIdx = 0;
    firstRow.forEach((b) => {
      const w = b.type === 'spacer' ? 1 : (b.layout?.desktop?.w || 2);
      slots[colIdx] = b;
      for (let i = 1; i < w; i++) {
        slots[colIdx + i] = b;
      }
      colIdx += w;
    });

    const overwrittenBlocks = new Set<string>();
    for (let i = 0; i < targetW; i++) {
      const existingBlock = slots[targetColStart + i];
      if (existingBlock && existingBlock.type !== 'spacer') {
        overwrittenBlocks.add(existingBlock.id);
      }
    }

    if (overwrittenBlocks.size > 0) {
      overwrittenBlocks.forEach(id => {
        if (!id.startsWith('temp-')) {
          setDeletedBlockIds((prev) => [...prev, id]);
        }
      });
    }

    const newFirstRow: BlockDetails[] = [];
    let i = 0;
    while (i < 4) {
      if (i === targetColStart) {
        newFirstRow.push(tempBlock);
        i += targetW;
      } else {
        const originalBlock = slots[i];
        if (originalBlock && !overwrittenBlocks.has(originalBlock.id)) {
          newFirstRow.push(originalBlock);
          const w = originalBlock.type === 'spacer' ? 1 : (originalBlock.layout?.desktop?.w || 2);
          i += w;
        } else {
          newFirstRow.push(makeSpacer());
          i += 1;
        }
      }
    }

    const combined = [...titleBlocks, ...newFirstRow, ...remaining];
    setBlocks(fillSpacers(combined));
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

  // Duplicate a block and insert it immediately after the original
  const handleDuplicateBlock = (block: BlockDetails) => {
    const duplicatedBlock: BlockDetails = {
      ...block,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: (block.position ?? 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === block.id);
      if (idx === -1) return prev;

      const updated = [...prev];
      updated.splice(idx + 1, 0, duplicatedBlock);

      const reordered = updated.map((b, i) => ({
        ...b,
        position: i + 1,
      }));

      const cols = viewMode === 'mobile' ? 2 : 4;
      return fillSpacers(removeEmptyRows(reordered, cols), cols);
    });
  };

  const renderBlockCard = (block: BlockDetails, isOverlay = false) => (
    <BlockCard
      key={block.id}
      block={block}
      onDelete={handleDeleteBlock}
      onUpdate={handleUpdateBlock}
      onDuplicate={handleDuplicateBlock}
      isOverlay={isOverlay}
      viewMode={viewMode}
    />
  );



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

  const getRenderableContent = () => {
    const cols = viewMode === 'mobile' ? 2 : 4;
    
    // We overlay suggestions on the first 4 width units of content
    const suggestionRowWidth = 4;
    const firstRow: BlockDetails[] = [];
    const remaining: BlockDetails[] = [];
    let currentColCount = 0;

    otherBlocks.forEach((b) => {
      const rawW = b.layout?.desktop?.w || 2;
      const w = b.type === 'spacer' ? 1 : (cols === 2 ? Math.min(2, rawW) : rawW);
      if (currentColCount < suggestionRowWidth) {
        firstRow.push(b);
        currentColCount += w;
      } else {
        remaining.push(b);
      }
    });

    while (currentColCount < suggestionRowWidth) {
      firstRow.push({
        id: `temp-spacer-pad-${currentColCount}`,
        profile_id: '',
        type: 'spacer',
        position: 0,
        layout: { desktop: { w: 1, h: 2 }, mobile: { w: 1, h: 2 } },
        created_at: '',
        updated_at: '',
      });
      currentColCount += 1;
    }

    const slots: (BlockDetails | null)[] = [null, null, null, null];
    let slotIdx = 0;
    firstRow.forEach((b) => {
      const rawW = b.layout?.desktop?.w || 2;
      const w = b.type === 'spacer' ? 1 : (cols === 2 ? Math.min(2, rawW) : rawW);
      slots[slotIdx] = b;
      for (let i = 1; i < w; i++) {
        slots[slotIdx + i] = b;
      }
      slotIdx += w;
    });

    const renderItems: React.ReactNode[] = [];
    const renderedIds = new Set<string>();

    const renderBlockAt = (idx: number, width: number) => {
      const block = slots[idx];
      if (block && block.type !== 'spacer') {
        if (renderedIds.has(block.id)) {
          return true;
        }
        renderedIds.add(block.id);
        renderItems.push(renderBlockCard(block));
        return true;
      }
      return false;
    };

    if (cols === 4) {
      // 4-COLUMN DESKTOP VIEW SUGGESTIONS
      if (!renderBlockAt(0, 1)) {
        if (showSuggestions && activeId === null) {
          renderItems.push(
            <SuggestionCard
              key="suggest-0"
              type="link"
              title="Add Link"
              colSpan="col-span-1"
              onAdd={(type, title) => handleAddSuggestionBlock(type, title, 0)}
            />
          );
        } else if (slots[0]) {
          renderBlockAt(0, 1);
        }
      }

      const blockAt1 = slots[1];
      const blockAt2 = slots[2];
      const hasRealBlockAt1Or2 = (blockAt1 && blockAt1.type !== 'spacer') || (blockAt2 && blockAt2.type !== 'spacer');

      if (hasRealBlockAt1Or2) {
        if (blockAt1 && blockAt1.type !== 'spacer') {
          if (!renderedIds.has(blockAt1.id)) {
            renderedIds.add(blockAt1.id);
            renderItems.push(renderBlockCard(blockAt1));
          }
        }
        if (blockAt2 && blockAt2.type !== 'spacer' && (!blockAt1 || blockAt1.layout?.desktop?.w !== 2)) {
          if (!renderedIds.has(blockAt2.id)) {
            renderedIds.add(blockAt2.id);
            renderItems.push(renderBlockCard(blockAt2));
          }
        }
      } else if (showSuggestions && activeId === null) {
        renderItems.push(
          <SuggestionCard
            key="suggest-1"
            type="image"
            title="Add Image"
            colSpan="col-span-2"
            onAdd={(type, title) => handleAddSuggestionBlock(type, title, 1)}
          />
        );
      } else {
        if (blockAt1) renderBlockAt(1, 1);
        if (blockAt2) renderBlockAt(2, 1);
      }

      if (!renderBlockAt(3, 1)) {
        if (showSuggestions && activeId === null) {
          renderItems.push(
            <SuggestionCard
              key="suggest-2"
              type="link"
              title="Add Link"
              colSpan="col-span-1"
              onAdd={(type, title) => handleAddSuggestionBlock(type, title, 2)}
            />
          );
        } else if (slots[3]) {
          renderBlockAt(3, 1);
        }
      }
    } else {
      // 2-COLUMN MOBILE VIEW SUGGESTIONS
      // Row 1: Link Suggestion 0 (col 0) & Link Suggestion 2 (col 1)
      if (!renderBlockAt(0, 1)) {
        if (showSuggestions && activeId === null) {
          renderItems.push(
            <SuggestionCard
              key="suggest-0"
              type="link"
              title="Add Link"
              colSpan="col-span-1"
              onAdd={(type, title) => handleAddSuggestionBlock(type, title, 0)}
            />
          );
        } else if (slots[0]) {
          renderBlockAt(0, 1);
        }
      }

      if (!renderBlockAt(1, 1)) {
        if (showSuggestions && activeId === null) {
          renderItems.push(
            <SuggestionCard
              key="suggest-2"
              type="link"
              title="Add Link"
              colSpan="col-span-1"
              onAdd={(type, title) => handleAddSuggestionBlock(type, title, 2)}
            />
          );
        } else if (slots[1]) {
          renderBlockAt(1, 1);
        }
      }

      // Row 2: Image Suggestion 1 (spans cols 0-1)
      const blockAt2 = slots[2];
      const blockAt3 = slots[3];
      const hasRealBlockAt2Or3 = (blockAt2 && blockAt2.type !== 'spacer') || (blockAt3 && blockAt3.type !== 'spacer');

      if (hasRealBlockAt2Or3) {
        if (blockAt2 && blockAt2.type !== 'spacer') {
          if (!renderedIds.has(blockAt2.id)) {
            renderedIds.add(blockAt2.id);
            renderItems.push(renderBlockCard(blockAt2));
          }
        }
        if (blockAt3 && blockAt3.type !== 'spacer' && (!blockAt2 || Math.min(2, blockAt2.layout?.desktop?.w || 2) !== 2)) {
          if (!renderedIds.has(blockAt3.id)) {
            renderedIds.add(blockAt3.id);
            renderItems.push(renderBlockCard(blockAt3));
          }
        }
      } else if (showSuggestions && activeId === null) {
        renderItems.push(
          <SuggestionCard
            key="suggest-1"
            type="image"
            title="Add Image"
            colSpan="col-span-2"
            onAdd={(type, title) => handleAddSuggestionBlock(type, title, 1)}
          />
        );
      } else {
        if (blockAt2) renderBlockAt(2, 1);
        if (blockAt3) renderBlockAt(3, 1);
      }
    }

    remaining.forEach((block) => {
      if (!renderedIds.has(block.id)) {
        renderedIds.add(block.id);
        renderItems.push(renderBlockCard(block));
      }
    });

    return renderItems;
  };

  const renderGridContent = () => (
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
        {titleBlocks.map((block) => renderBlockCard(block))}

        {/* 2. Suggestion Placeholders and content blocks */}
        {getRenderableContent()}
      </SortableContext>

      <DragOverlay>
        {activeId ? renderBlockCard(blocks.find((b) => b.id === activeId)!, true) : null}
      </DragOverlay>
    </DndContext>
  );

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-[#fafbfc] text-[#191c1e] font-sans antialiased relative">
      <EditorHeader
        profile={profile}
        profiles={profiles}
        displayUrl={displayUrl}
        onProfileSwitch={handleProfileSwitch}
        onSave={handleSave}
        isSaving={isSaving}
        showSuggestions={showSuggestions}
        onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
      />

      {/* Main Workspace */}
      <div className="flex-1 w-full flex justify-center py-8 overflow-hidden">
        {viewMode === 'desktop' ? (
          /* Desktop Split Workspace */
          <div className="w-full max-w-[1360px] px-6 flex flex-row gap-8 h-full overflow-hidden">
            {/* Left Column */}
            <div className="w-[340px] shrink-0 h-full overflow-y-auto pr-2">
              <ProfileEditor
                displayName={displayName}
                bio={bio}
                onDisplayNameChange={setDisplayName}
                onBioChange={setBio}
              />
            </div>

            {/* Right column: Blocks layout editor */}
            <div className="flex-1 space-y-6 pb-36 h-full overflow-y-auto pr-2 w-full px-5">
              <div className="grid grid-cols-1 md:grid-cols-[repeat(4,215px)] gap-0 w-full items-start">
                {renderGridContent()}
              </div>
            </div>
          </div>
        ) : (
          /* Mobile Mockup Workspace */
          <div className="w-full h-full flex items-start justify-center overflow-y-auto pb-36 md:px-4">
            <div className="w-full md:max-w-[480px] md:min-h-[750px] bg-transparent md:bg-white md:border md:border-[#e1e3e5] md:rounded-[48px] md:shadow-2xl p-4 md:p-6 flex flex-col items-center md:my-4 overflow-y-auto scrollbar-none">
              {/* Profile Header Preview inside mockup */}
              <div className="w-full flex flex-col items-center text-center space-y-4 pt-4 mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <img
                    src="/images/svg/icons/image-placeholder.svg"
                    alt="Profile Placeholder"
                    className="w-16 h-16 opacity-60"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-[#191c1e]">{displayName || 'Your name'}</h2>
                  <p className="text-[15px] text-[#5a626a] mt-1 whitespace-pre-line leading-relaxed">{bio || 'Your bio...'}</p>
                </div>
              </div>

              {/* Grid Layout inside mockup (constrained to 2 columns!) */}
              <div className="grid max-[425px]:grid-cols-2 max-[425px]:gap-3 max-[425px]:px-4 grid-cols-[repeat(2,215px)] gap-0 w-full items-start justify-center">
                {renderGridContent()}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomControls
        showSuggestions={showSuggestions}
        onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
        onAddBlock={handleAddBlock}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'))}
      />
    </main>
  );
}
