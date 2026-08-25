import { privateGateway } from '../api/gateway';
import { profileUrls } from '../api/urls';

export interface CreateProfilePayload {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  theme_id?: string;
  is_published?: boolean;
}

export interface ProfileDetails extends CreateProfilePayload {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  blocks?: any[];
}

export const profileService = {
  // Creates a new profile for the authenticated user
  async createProfile(payload: CreateProfilePayload): Promise<ProfileDetails> {
    const data = await privateGateway.post<{ response: ProfileDetails }>(
      profileUrls.createProfile,
      payload
    );
    return data.response;
  },

  // Lists all profiles belonging to the authenticated user
  async listAllProfiles(): Promise<ProfileDetails[]> {
    const data = await privateGateway.get<{ response: ProfileDetails[] }>(
      profileUrls.listAllProfiles
    );
    return data.response || [];
  },

  // Retrieves details of a specific profile (includes its blocks)
  async getProfile(profileId: string): Promise<ProfileDetails> {
    const data = await privateGateway.get<{ response: ProfileDetails }>(
      profileUrls.getProfile(profileId)
    );
    return data.response;
  },

  // Updates the specified profile
  async updateProfile(profileId: string, payload: CreateProfilePayload): Promise<ProfileDetails> {
    const data = await privateGateway.put<{ response: ProfileDetails }>(
      profileUrls.updateProfile(profileId),
      payload
    );
    return data.response;
  },

  // Deletes the specified profile
  async deleteProfile(profileId: string): Promise<any> {
    return privateGateway.delete<any>(profileUrls.deleteProfile(profileId));
  },
};
