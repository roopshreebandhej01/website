"use client";

import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { forgotPasswordAction } from "@/actions/auth.action";
import { useToast } from "@/components/common/ToastProvider";

export default function Forgotpass({
  onBackToLogin,
  onCreateAccount,
  onSendOtp,
}: {
  onBackToLogin?: () => void;
  onCreateAccount?: () => void;
  onSendOtp?: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const response = await forgotPasswordAction({ email: normalizedEmail });

    setIsSubmitting(false);

    if (!response.ok) {
      setError(response.error ?? "Unable to send OTP");
      showToast({ title: response.error ?? "Unable to send OTP", tone: "error" });
      return;
    }

    showToast({
      title: response.message ?? "Password reset OTP sent",
      tone: "success",
    });
    onSendOtp?.(normalizedEmail);
  }

  return (
    <div className="min-h-screen w-full bg-white px-5 py-8 sm:px-8">
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[580px] flex-col justify-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="mb-9 flex w-fit items-center gap-2 rounded-[4px] text-sm font-medium text-[#3b2418] transition hover:text-[#c9914d] sm:text-base"
        >
          <ArrowLeft size={18} />
          Back to Login
        </button>

        <div className="mb-8">
          <h1 className="font-heading text-[34px] font-semibold leading-tight text-[#3b2418] sm:text-[42px]">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-[#c9914d] sm:text-base ">
            Enter your registered email to receive a reset OTP
          </p>
        </div>

        <form
          className="space-y-8 "
          onSubmit={handleForgotPassword}
        >
          <div className="flex h-14 items-center rounded-[4px] border border-[#c9914d] px-5 sm:h-16">
            <span className="mr-5 text-[#3b2418]">
              <Mail size={18} />
            </span>

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-transparent text-sm text-[#3b2418] outline-none placeholder:text-[#8a8580] sm:text-base"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-[4px] bg-[#c9914d] text-sm font-semibold tracking-[2px] text-white transition hover:bg-[#b57f3f] sm:h-[58px] sm:text-base"
          >
            {isSubmitting ? "Sending..." : "Send OTP"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#c9914d] sm:text-base">
          Don&apos;t Have An Account?{" "}
          <button
            type="button"
            onClick={onCreateAccount}
            className="rounded-[4px] font-semibold text-[#3b2418] underline"
          >
            Create Account
          </button>
        </p>
      </main>
    </div>
  );
}
