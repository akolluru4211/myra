"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RotateCw, ShieldCheck } from "lucide-react";

export interface OtpInputGroupProps {
  length?: number;
  value?: string;
  onChange?: (otp: string) => void;
  onComplete?: (otp: string) => void;
  error?: string;
  initialCountdown?: number;
  onResend?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const OtpInputGroup: React.FC<OtpInputGroupProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  initialCountdown = 45,
  onResend,
  isLoading = false,
  className,
}) => {
  const [internalOtp, setInternalOtp] = useState<string[]>(Array(length).fill(""));
  const [countdown, setCountdown] = useState(initialCountdown);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setCountdown(initialCountdown);
    setCanResend(false);
  }, [initialCountdown]);

  // Resend cooldown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const digits = value !== undefined ? value.split("").slice(0, length) : internalOtp;

  const updateOtp = (newDigits: string[]) => {
    if (value === undefined) {
      setInternalOtp(newDigits);
    }
    const combined = newDigits.join("");
    onChange?.(combined);
    if (combined.length === length && !newDigits.includes("")) {
      onComplete?.(combined);
    }
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const char = rawVal.slice(-1);

    if (!/^\d*$/.test(char)) return;

    const newDigits = [...digits];
    while (newDigits.length < length) newDigits.push("");

    newDigits[index] = char;
    updateOtp(newDigits);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        updateOtp(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        updateOtp(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    if (!/^\d+$/.test(pastedData)) return;

    const pastedDigits = pastedData.slice(0, length).split("");
    const newDigits = Array(length).fill("");
    pastedDigits.forEach((d, i) => {
      newDigits[i] = d;
    });

    updateOtp(newDigits);

    // Focus last filled index or next
    const targetIdx = Math.min(pastedDigits.length, length - 1);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleResendClick = () => {
    if (!canResend || isLoading) return;
    setCountdown(45);
    setCanResend(false);
    onResend?.();
  };

  return (
    <div className={cn("w-full flex flex-col items-center gap-4", className)}>
      {/* 6-box Input Array */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 w-full max-w-sm">
        {Array.from({ length }).map((_, index) => {
          const val = digits[index] || "";
          const isFilled = val.length > 0;
          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={val}
              onChange={(e) => handleInputChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading}
              aria-label={`Digit ${index + 1} of ${length}`}
              className={cn(
                "w-12 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold font-mono rounded-xl transition-all outline-none",
                "bg-white/80 backdrop-blur-md border",
                "text-slate-900 shadow-sm",
                isFilled
                  ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
                error && "border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-500/10",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            />
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs font-medium text-red-600 bg-red-50/80 px-3 py-1.5 rounded-lg border border-red-200 animate-in fade-in">
          {error}
        </p>
      )}

      {/* Resend Cooldown Controls */}
      <div className="flex items-center justify-between w-full max-w-sm px-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          5-min single-use code
        </span>

        {canResend ? (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={isLoading}
            className="font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 hover:underline disabled:opacity-50"
          >
            <RotateCw className="w-3 h-3" />
            Resend Code
          </button>
        ) : (
          <span className="text-slate-400 font-mono">
            Resend in <strong className="text-slate-700 font-bold">{countdown}s</strong>
          </span>
        )}
      </div>
    </div>
  );
};
