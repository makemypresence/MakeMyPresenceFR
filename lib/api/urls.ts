const buildURL = (basePath: string) => (endpoint: string) => `${basePath}${endpoint}`;

const commonURL = buildURL('/api/common');
const authURL = buildURL('/api/auth');
const profileURL = buildURL('/api/user/profile');
const blockURL = buildURL('/api/user/block');

export const commonUrls = {
  health: commonURL('/health'),
  dbHealth: commonURL('/health/db'),
};

export const authUrls = {
  signup: authURL('/signup'),
  login: authURL('/login'),
  verifyOtp: authURL('/verify-otp'),
  getAccessToken: authURL('/get-access-token'),
  googleAuth: authURL('/google'),
  checkUsername: authURL('/check-username'),
};

export const profileUrls = {
  createProfile: profileURL('/create'),
  listAllProfiles: profileURL('/list-all'),
  getProfile: (profileId: string) => profileURL(`/${profileId}/list`),
  updateProfile: (profileId: string) => profileURL(`/${profileId}/update`),
  deleteProfile: (profileId: string) => profileURL(`/${profileId}/delete`),
};

export const blockUrls = {
  createBlock: blockURL('/create'),
  listAllBlocks: (profileId: string) => blockURL(`/${profileId}/list-all`),
  getBlock: (blockId: string) => blockURL(`/${blockId}/list`),
  updateBlock: (blockId: string) => blockURL(`/${blockId}/update`),
  deleteBlock: (blockId: string) => blockURL(`/${blockId}/delete`),
};
