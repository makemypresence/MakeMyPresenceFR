import { publicGateway, privateGateway } from '../api/gateway';
import { authUrls, commonUrls } from '../api/urls';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  email: string;
  profile_pic_url: string;
}

export const authService = {
  // Initiates login and sends OTP to the user's email
  async login(usernameOrEmail: string): Promise<any> {
    return publicGateway.post<any>(authUrls.login, {
      username_or_email: usernameOrEmail,
    });
  },

  // Verifies OTP and retrieves the JWT access/refresh tokens
  async verifyOtp(email: string, otpCode: string): Promise<AuthResponse> {
    const data = await publicGateway.post<{ response: AuthResponse }>(authUrls.verifyOtp, {
      email,
      otp_code: otpCode,
    });
    return data.response;
  },

  // Registers a new user
  async signup(email: string, username: string): Promise<any> {
    return publicGateway.post<any>(authUrls.signup, {
      email,
      username,
    });
  },

  // Refreshes the access token
  async getAccessToken(): Promise<any> {
    return privateGateway.get<any>(authUrls.getAccessToken);
  },

  // Authenticates with Google OAuth token
  async googleAuth(accessToken: string, username: string): Promise<AuthResponse> {
    const data = await publicGateway.post<{ response: AuthResponse }>(authUrls.googleAuth, {
      access_token: accessToken,
      username,
    });
    return data.response;
  },

  // Checks if a username is available
  async checkUsername(username: string): Promise<boolean> {
    const url = `${authUrls.checkUsername}?username=${encodeURIComponent(username)}`;
    const data = await publicGateway.get<{ response: { is_available: boolean } }>(url);
    return data.response?.is_available ?? false;
  },

  // Checks API health status
  async checkHealth(): Promise<any> {
    return publicGateway.get<any>(commonUrls.health);
  },

  // Checks database connection health
  async checkDbHealth(): Promise<any> {
    return publicGateway.get<any>(commonUrls.dbHealth);
  },
};
