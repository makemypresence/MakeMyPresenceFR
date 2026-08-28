'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { authService } from '../../lib/services/auth';
import { storage } from '../../lib/utils/storage';

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await authService.login(email);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6 || isLoading) return;

    setIsLoading(true);
    try {
      const data = await authService.verifyOtp(email, otpCode);
      storage.setAccessToken(data.access_token);
      storage.setRefreshToken(data.refresh_token);
      storage.setUserEmail(data.email);
      storage.setUserImage(data.profile_pic_url);

      router.push('/');
    } catch (err: any) {
      console.error(err);
      alert('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (typeof window === 'undefined' || !window.google) {
      alert('Google Sign-In is still loading. Please try again in a moment.');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scope: 'email profile openid',
        callback: async (response: any) => {
          if (response.access_token) {
            setIsLoading(true);
            try {
              // Generate a default temporary username or let backend handle it
              const tempUsername = 'google_user_' + Math.floor(Math.random() * 100000);
              const data = await authService.googleAuth(response.access_token, tempUsername);

              storage.setAccessToken(data.access_token);
              storage.setRefreshToken(data.refresh_token);
              storage.setUserEmail(data.email);
              storage.setUserImage(data.profile_pic_url);

              router.push('/');
            } catch (err) {
              console.error('Google Sign-In backend verification failed:', err);
              alert('Failed to complete Google Sign-In with backend.');
            } finally {
              setIsLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error('Failed to initialize Google login client:', err);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    const digits = value.split('').slice(0, 6 - index);
    digits.forEach((digit, i) => {
      newOtp[index + i] = digit;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(index + digits.length, 5);
    if (nextIndex !== index && otpInputsRef.current[nextIndex]) {
      otpInputsRef.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const prevIndex = index - 1;
        const newOtp = [...otp];
        newOtp[prevIndex] = '';
        setOtp(newOtp);
        otpInputsRef.current[prevIndex]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
    } else {
      router.push('/');
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#191c1e] text-[#e3e2e6] relative font-sans">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={handleBack}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer focus:outline-none"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5 text-zinc-300"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[320px] flex flex-col items-center">
          {step === 'email' ? (
            <>
              {/* Header */}
              <h2 className="text-[#a4a9ae] text-[15px] font-normal tracking-wide mb-6">
                Login with
              </h2>

              {/* Email Input */}
              <form onSubmit={handleEmailSubmit} className="w-full mb-6 relative flex items-center">
                <input
                  type="email"
                  value={email}
                  ref={emailInputRef}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-[#202528] text-white placeholder-[#5a626a] border border-[#2d3236] rounded-full py-3.5 pl-6 pr-24 outline-none focus:border-[#40474c] transition-colors text-base"
                  required
                  disabled={isLoading}
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('');
                      emailInputRef.current?.focus();
                    }}
                    className="absolute right-14 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer transition-colors"
                    aria-label="Clear email"
                    disabled={isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2.5 w-10 h-10 flex items-center justify-center bg-[#2d3236] hover:bg-[#383e43] rounded-full text-white cursor-pointer transition-colors"
                  aria-label="Submit email"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="text-[#8a9196] text-[15px] font-normal mb-6">or</div>

              {/* Social Logins */}
              <div className="flex flex-col space-y-3.5 w-[140px]">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center space-x-2.5 w-full bg-transparent hover:bg-white/5 border border-[#2d3236] rounded-full py-2.5 px-4 transition-colors text-[14px] font-medium text-white cursor-pointer"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23 12c0-.82-.07-1.61-.21-2.38H12v4.51h6.18c-.27 1.41-1.07 2.61-2.27 3.42l3.66 2.84C21.72 18.59 23 15.54 23 12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-1.09 7.28-2.97l-3.66-2.84c-.95.63-2.17.97-3.62.97-2.86 0-5.29-1.93-6.16-4.53L2.18 16.93C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 13.66c-.33-.97-.33-2.02 0-2.99V7.83H2.18C1.43 9.31 1 10.98 1 12s.43 2.69 1.18 4.17l3.66-2.51z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <h2 className="text-[#a4a9ae] text-[15px] font-normal tracking-wide mb-6 text-center">
                Enter 6-digit OTP
              </h2>

              {/* OTP Inputs */}
              <div className="flex justify-between w-full gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={(el) => {
                      otpInputsRef.current[index] = el;
                    }}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-10 h-12 bg-[#202528] text-white text-center border border-[#2d3236] rounded-xl outline-none focus:border-[#40474c] transition-colors text-lg font-semibold"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={handleOtpVerify}
                className="w-full bg-[#202528] hover:bg-[#2d3236] border border-[#2d3236] rounded-full py-3 text-[14px] font-medium text-white transition-colors cursor-pointer flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Verify OTP'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
