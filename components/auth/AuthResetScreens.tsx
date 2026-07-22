"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  forgotPasswordAction,
  confirmForgotPasswordAction,
  confirmSignUpAction,
  resendSignUpOtpAction,
} from "@/actions/auth.action";
import { useToast } from "@/components/common/ToastProvider";

export function ForgotOtpScreen({
  email,
  onBackToLogin,
  onVerifyOtp,
}: {
  email: string;
  onBackToLogin?: () => void;
  onVerifyOtp?: (code: string) => void;
}) {
  return (
    <OtpScreen
      email={email}
      title="Forgot Password"
      subtitle="Verify OTP to Reset Password"
      buttonText="Verify OTP"
      onBackToLogin={onBackToLogin}
      onVerifyOtp={onVerifyOtp}
      onResendOtp={forgotPasswordAction}
    />
  );
}

export function SignupOtpScreen({
  email,
  password,
  onBackToLogin,
  onVerifyOtp,
}: {
  email: string;
  password: string;
  onBackToLogin?: () => void;
  onVerifyOtp?: () => void;
}) {
  return (
    <OtpScreen
      email={email}
      password={password}
      title="OTP Verification"
      subtitle="Verify OTP to Sign up"
      buttonText="Verify OTP"
      onBackToLogin={onBackToLogin}
      onVerifyOtp={onVerifyOtp}
      onResendOtp={resendSignUpOtpAction}
    />
  );
}

export function SetNewPasswordScreen({
  email,
  code,
  onBackToLogin,
}: {
  email: string;
  code: string;
  onBackToLogin?: () => void;
}) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleSetNewPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      showToast({ title: "Passwords do not match", tone: "error" });
      return;
    }

    setIsSubmitting(true);

    const response = await confirmForgotPasswordAction({
      email,
      code,
      newPassword,
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError(response.error ?? "Unable to update password");
      showToast({ title: response.error ?? "Unable to update password", tone: "error" });
      return;
    }

    showToast({ title: "Password updated successfully", tone: "success" });
    onBackToLogin?.();
  }

  return (
    <PlainAuthShell onBackToLogin={onBackToLogin}>
      <div className="mb-7">
        <h1 className="font-heading text-[32px] font-semibold leading-tight text-[#3b2418] sm:text-[36px]">
          Set New Password
        </h1>
        <p className="mt-2 text-xs text-[#c9914d] sm:text-sm">
          Create a new password for your account
        </p>
      </div>

      <form
        className="space-y-6"
        onSubmit={handleSetNewPassword}
      >
        <PasswordInput
          placeholder="New Password"
          type={showNewPassword ? "text" : "password"}
          icon={showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          label={showNewPassword ? "Hide new password" : "Show new password"}
          onToggle={() => setShowNewPassword((current) => !current)}
          value={newPassword}
          onChange={setNewPassword}
        />

        <PasswordInput
          placeholder="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          icon={showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          label={
            showConfirmPassword
              ? "Hide confirm password"
              : "Show confirm password"
          }
          onToggle={() => setShowConfirmPassword((current) => !current)}
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-[4px] bg-[#c9914d] text-xs font-semibold tracking-[2px] text-white transition hover:bg-[#b57f3f]"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </PlainAuthShell>
  );
}

function OtpScreen({
  email,
  password,
  title,
  subtitle,
  buttonText,
  onBackToLogin,
  onVerifyOtp,
  onResendOtp,
}: {
  email: string;
  password?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  onBackToLogin?: () => void;
  onVerifyOtp?: (code: string) => void;
  onResendOtp?: (params: { email: string }) => Promise<{
    ok: boolean;
    error?: string;
    message?: string;
  }>;
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const code = otp.join("");

    if (code.length !== 6) {
      setError("Enter the 6 digit OTP");
      showToast({ title: "Enter the 6 digit OTP", tone: "error" });
      return;
    }

    if (!password) {
      onVerifyOtp?.(code);
      return;
    }

    setIsSubmitting(true);

    const response = await confirmSignUpAction({ email, code, password });

    setIsSubmitting(false);

    if (!response.ok) {
      setError(response.error ?? "Unable to verify OTP");
      showToast({ title: response.error ?? "Unable to verify OTP", tone: "error" });
      return;
    }

    showToast({ title: "Account verified successfully", tone: "success" });
    router.push("/dashboard");
    router.refresh();
    onVerifyOtp?.(code);
  }

  async function handleResendOtp() {
    setError("");
    setIsResending(true);

    if (!onResendOtp) {
      return;
    }

    const response = await onResendOtp({ email });

    setIsResending(false);

    if (!response.ok) {
      setError(response.error ?? "Unable to resend OTP");
      showToast({ title: response.error ?? "Unable to resend OTP", tone: "error" });
      return;
    }

    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    showToast({ title: response.message ?? "OTP resent. Please check your inbox.", tone: "success" });
  }

  return (
    <PlainAuthShell onBackToLogin={onBackToLogin}>
      <div className="mb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-tight text-[#3b2418] sm:text-[36px]">
          {title}
        </h1>
        <p className="mt-2 text-xs text-[#c9914d] sm:text-sm">{subtitle}</p>
      </div>

      <form
        className="space-y-6"
        onSubmit={handleVerifyOtp}
      >
        <div className="grid grid-cols-6 gap-3 sm:gap-[26px]">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              value={digit}
              maxLength={1}
              onChange={(event) => handleOtpChange(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !otp[index] && index > 0) {
                  inputRefs.current[index - 1]?.focus();
                }
              }}
              className="h-11 w-full rounded-[4px] border border-[#3b2418]/70 bg-white text-center text-base text-[#3b2418] outline-none focus:border-[#c9914d]"
            />
          ))}
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-[4px] bg-[#c9914d] text-xs font-semibold tracking-[2px] text-white transition hover:bg-[#b57f3f]"
        >
          {isSubmitting ? "Verifying..." : buttonText}
        </button>

        {onResendOtp && (
          <button
            type="button"
            disabled={isResending}
            onClick={handleResendOtp}
            className="w-full rounded-[4px] text-center text-xs font-semibold text-[#3b2418] underline transition hover:text-[#c9914d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Resending OTP..." : "Resend OTP"}
          </button>
        )}
      </form>
    </PlainAuthShell>
  );
}

function PasswordInput({
  placeholder,
  type,
  icon,
  label,
  onToggle,
  value,
  onChange,
}: {
  placeholder: string;
  type: string;
  icon: React.ReactNode;
  label: string;
  onToggle: () => void;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-11 items-center rounded-[4px] border border-[#c9914d] px-4">
      <span className="mr-5 text-[#3b2418]">
        <Lock size={15} />
      </span>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm text-[#3b2418] outline-none placeholder:text-[#8a8580]"
      />

      <button
        type="button"
        aria-label={label}
        onClick={onToggle}
        className="ml-3 rounded-[4px] text-[#3b2418]/60"
      >
        {icon}
      </button>
    </div>
  );
}

function PlainAuthShell({
  children,
  onBackToLogin,
}: {
  children: React.ReactNode;
  onBackToLogin?: () => void;
}) {
  return (
    <div className="min-h-screen w-full bg-white px-5 py-8 sm:px-8">
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[405px] flex-col justify-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="mb-7 flex w-fit items-center gap-2 rounded-[4px] text-sm font-medium text-[#3b2418] transition hover:text-[#c9914d]"
        >
          <ArrowLeft size={17} />
          Back to Login
        </button>

        {children}
      </main>
    </div>
  );
}
