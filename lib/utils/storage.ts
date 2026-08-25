const isClient = typeof window !== 'undefined';

export const storage = {
  getAccessToken(): string | null {
    return isClient ? localStorage.getItem('accessToken') : null;
  },
  setAccessToken(token: string): void {
    if (isClient) localStorage.setItem('accessToken', token);
  },
  getRefreshToken(): string | null {
    return isClient ? localStorage.getItem('refreshToken') : null;
  },
  setRefreshToken(token: string): void {
    if (isClient) localStorage.setItem('refreshToken', token);
  },
  getUserEmail(): string | null {
    return isClient ? localStorage.getItem('userEmail') : null;
  },
  setUserEmail(email: string): void {
    if (isClient) localStorage.setItem('userEmail', email);
  },
  getUserImage(): string | null {
    return isClient ? localStorage.getItem('userImage') : null;
  },
  setUserImage(image: string): void {
    if (isClient) localStorage.setItem('userImage', image);
  },
  clear(): void {
    if (isClient) localStorage.clear();
  },
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
};
