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
import {
  reorderBlocksList,
  getActiveDraggedBlock,
  compute2DGridPositions,
  gridPositionToCSS,
} from '../../lib/utils/layout';

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
    }),
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
      setBlocks(activeBlocks.filter((b) => b.type !== 'spacer'));
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
      setBlocks(activeBlocks.filter((b) => b.type !== 'spacer'));
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

    setBlocks((prev) => {
      // Insert after title block if title block exists at index 0
      if (prev.length > 0 && prev[0].type === 'title') {
        const next = [...prev];
        next.splice(1, 0, tempBlock);
        return next;
      }
      return [tempBlock, ...prev];
    });
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
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b)));
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
      if (idx === -1) return [...prev, duplicatedBlock];

      const updated = [...prev];
      updated.splice(idx + 1, 0, duplicatedBlock);

      return updated.map((b, i) => ({
        ...b,
        position: i + 1,
      }));
    });
  };

  const renderBlockCard = (
    block: BlockDetails,
    isOverlay = false,
    gridStyle?: React.CSSProperties,
  ) => (
    <BlockCard
      key={block.id}
      block={block}
      onDelete={handleDeleteBlock}
      onUpdate={handleUpdateBlock}
      onDuplicate={handleDuplicateBlock}
      isOverlay={isOverlay}
      viewMode={viewMode}
      gridStyle={gridStyle}
    />
  );

  // Drag and Drop arrangement handlers using @dnd-kit
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    setBlocks((prev) => reorderBlocksList(prev, active.id, over.id));
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const renderGridContent = () => {
    const cols = viewMode === 'mobile' ? 2 : 4;
    const positioned = compute2DGridPositions(blocks, cols);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((block) => block.id)} strategy={rectSortingStrategy}>
          {positioned.map((pos) => renderBlockCard(pos.block, false, gridPositionToCSS(pos)))}
        </SortableContext>

        <DragOverlay>
          {activeId
            ? (() => {
                const activeBlock = getActiveDraggedBlock(blocks, activeId);
                return activeBlock ? renderBlockCard(activeBlock, true) : null;
              })()
            : null}
        </DragOverlay>
      </DndContext>
    );
  };

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
            <div className="flex-1 space-y-6 pt-4 pb-36 h-full overflow-y-auto pr-2 w-full px-5">
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
                  <h2 className="text-3xl font-extrabold text-[#191c1e]">
                    {displayName || 'Your name'}
                  </h2>
                  <p className="text-[15px] text-[#5a626a] mt-1 whitespace-pre-line leading-relaxed">
                    {bio || 'Your bio...'}
                  </p>
                </div>
              </div>

              {/* Grid Layout inside mockup (constrained to 2 columns!) */}
              <div className="grid pt-2 max-[425px]:grid-cols-2 max-[425px]:gap-3 max-[425px]:px-4 grid-cols-[repeat(2,215px)] gap-0 w-full items-start justify-center">
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
