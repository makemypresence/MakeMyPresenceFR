import { privateGateway } from '../api/gateway';
import { blockUrls } from '../api/urls';

export interface CreateBlockPayload {
  profile_id: string;
  type: string;
  title?: string;
  url?: string;
  content?: string;
  image_url?: string;
  block_metadata?: Record<string, any>;
  position?: number;
  layout?: {
    desktop?: { w: number; h: number };
    mobile?: { w: number; h: number };
  };
  is_active?: boolean;
}

export interface BlockDetails extends CreateBlockPayload {
  id: string;
  created_at: string;
  updated_at: string;
}

export const blockService = {
  // Creates a content block within a profile
  async createBlock(payload: CreateBlockPayload): Promise<BlockDetails> {
    const data = await privateGateway.post<{ response: BlockDetails }>(
      blockUrls.createBlock,
      payload,
    );
    return data.response;
  },

  // Lists all blocks inside a specific profile
  async listAllBlocks(profileId: string): Promise<BlockDetails[]> {
    const data = await privateGateway.get<{ response: BlockDetails[] }>(
      blockUrls.listAllBlocks(profileId),
    );
    return data.response || [];
  },

  // Retrieves details of a specific block by its ID
  async getBlock(blockId: string): Promise<BlockDetails> {
    const data = await privateGateway.get<{ response: BlockDetails }>(blockUrls.getBlock(blockId));
    return data.response;
  },

  // Updates the specified block
  async updateBlock(blockId: string, payload: Partial<CreateBlockPayload>): Promise<BlockDetails> {
    const data = await privateGateway.put<{ response: BlockDetails }>(
      blockUrls.updateBlock(blockId),
      payload,
    );
    return data.response;
  },

  // Deletes the specified block
  async deleteBlock(blockId: string): Promise<any> {
    return privateGateway.delete<any>(blockUrls.deleteBlock(blockId));
  },
};
