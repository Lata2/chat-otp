'use client';

import { useEffect, useState } from 'react';
import { PhoneCheckIcon } from '@/components/PhoneCheckIcon';

type Step = 'phone' | 'otp' | 'success';

const COUNTRY_CODE = '971';
const RESEND_COOLDOWN_SECONDS = 30;

export function SubscriptionFlow() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devPin, setDevPin] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const fullMsisdn = `${COUNTRY_CODE}${phone.trim()}`;
  const isPhoneValid = /^5\d{8}$/.test(phone.trim());
  const isOtpValid = /^\d{4}$/.test(otp);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function requestOtp(isResend: boolean) {
    const res = await fetch('/api/pingen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msisdn: fullMsisdn, isResend }),
    });
    const data = await res.json();
    if (!res.ok || data.response !== 'SUCCESS') {
      throw new Error(data.errorMessage || 'Something went wrong');
    }
    return data;
  }

  async function handleContinue() {
    if (!isPhoneValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await requestOtp(false);
      setDevPin(data.devPin ?? null);
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const data = await requestOtp(true);
      setDevPin(data.devPin ?? null);
      setOtp('');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setResending(false);
    }
  }

  async function handleVerify() {
    if (!isOtpValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pinval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msisdn: fullMsisdn, pin: otp }),
      });
      const data = await res.json();
      if (!res.ok || data.response !== 'SUCCESS') {
        throw new Error(data.errorMessage || 'Incorrect PIN');
      }
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect PIN');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep('phone');
    setOtp('');
    setError(null);
    setDevPin(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F0FF] via-[#EFF6FF] to-[#ECFEFF] px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <p className="text-center text-[15px] leading-relaxed text-slate-500">
          Enter your Etisalat mobile number to receive an OTP
        </p>

        <div className="relative overflow-hidden rounded-[28px] bg-white p-8 shadow-[0_25px_60px_-20px_rgba(124,58,237,0.28)]">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-teal-400" />

          <div className="flex flex-col items-center gap-6">
            <PhoneCheckIcon />

            {step !== 'success' && (
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-xl font-bold text-slate-900">
                  {step === 'phone' ? 'Enter your phone number' : 'Enter the code'}
                </h1>
                <p className="text-sm text-slate-500">
                  {step === 'phone'
                    ? "We'll text you a 4-digit code to confirm your subscription."
                    : `We sent a 4-digit code to +${COUNTRY_CODE} ${fullMsisdn}`}
                </p>
              </div>
            )}

            {step === 'phone' && (
              <>
                <div className="flex w-full items-center gap-3 rounded-2xl border-2 border-violet-200 bg-violet-50/60 px-4 py-3.5 transition focus-within:border-violet-400 focus-within:bg-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-violet-400">
                    <path
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-semibold text-slate-900">{COUNTRY_CODE}</span>
                  <span className="h-5 w-px bg-violet-200" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="5XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className="w-full bg-transparent text-slate-900 placeholder:text-slate-300 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={!isPhoneValid || loading}
                  onClick={handleContinue}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3.5 text-center font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {loading ? 'Sending code...' : 'Continue'}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Free for 24 hours, then AED 3.25/day (VAT inclusive)
                </p>
              </>
            )}

            {step === 'otp' && (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-2xl border-2 border-violet-200 bg-violet-50/60 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 transition focus:border-violet-400 focus:bg-white focus:outline-none"
                />

              
                <button
                  type="button"
                  disabled={!isOtpValid || loading}
                  onClick={handleVerify}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3.5 text-center font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {loading ? 'Verifying...' : 'Verify & Subscribe'}
                </button>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">Didn&apos;t get the code?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || resending}
                    onClick={handleResend}
                    className="font-semibold text-violet-500 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                  >
                    {resending
                      ? 'Sending...'
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBack}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600"
                >
                  Use a different number
                </button>
              </>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-xl font-bold text-slate-900">You&apos;re subscribed</h1>
                <p className="text-sm text-slate-500">
                  +{COUNTRY_CODE} {fullMsisdn} is confirmed for GoChat Games.
                </p>
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-2 text-xs font-medium text-violet-500 hover:underline"
                >
                  Start over
                </button>
              </div>
            )}

            {error && (
              <p className="w-full rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-500">
                {error}
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500">
          After clicking &quot;Subscribe&quot; you will receive a PIN message to confirm your subscription.
        </p>

        {/* T&C card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-base text-center font-semibold text-slate-900">
            Terms and Conditions
          </h2>

          <div className="flex flex-wrap gap-1 text-sm">
            GoChat Games is a subscription service that will automatically renew for AED 3.25/Daily for Etisalat subscribers until you unsubscribe. You can unsubscribe from the service at anytime, by sending C HP1 to 1111.
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs leading-relaxed text-slate-400">
           GoChat Games is a subscription service of Etisalat UAE that automatically
          renews for AED 3.25/day. You can unsubscribe at any time by sending{' '}
          <span className="font-medium">C HP1</span> to{' '}
          <span className="font-medium">1111</span>.
        </p>
      </div>
    </div>
  );
}