"use client";

import Image from "next/image";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { signInAction } from "@/actions/auth.action";
import { useToast } from "@/components/common/ToastProvider";
import Link from "next/link";

export default function Login({
  onCreateAccount,
  onForgotPassword,
}: {
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    const response = await signInAction({ email, password });

    setIsSubmitting(false);

    if (!response.ok) {
      showToast({
        title: response.error ?? "Invalid email or password",
        tone: "error",
      });
      setError(response.error ?? "Invalid email or password");
      return;
    }

    showToast({ title: "Logged in successfully", tone: "success" });
    if (response.isAdmin) {
      router.push("/admin");
    } else {
      router.push(callbackUrl);
    }
    router.refresh();
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white lg:bg-[#f3dfc7] lg:bg-[url('/auth/login_bg.png')] lg:bg-cover lg:bg-center lg:bg-no-repeat">
      <div className="relative grid min-h-screen w-full px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:px-0 lg:py-0">
        <div className="hidden lg:block" />

        <section className="relative flex min-h-screen w-full items-center justify-center lg:px-8 xl:px-16 2xl:px-24">
          <div className="relative w-full max-w-[360px] px-0 py-0 sm:max-w-[420px] lg:w-[min(630px,calc(50vw-64px))] lg:max-w-none lg:bg-white/45 lg:px-7 lg:py-8 xl:py-9">
            <Link href="/" className="mb-4 flex justify-center">
              <Image
                src="/logo.svg"
                alt="Roop Shree"
                width={150}
                height={96}
                priority
                className="h-auto w-[92px] lg:w-[clamp(112px,8vw,140px)]"
              />
            </Link>

            <div className="mb-6 text-center lg:mb-7 xl:mb-8">
              <h1 className="font-heading text-[22px] leading-tight text-[#3b2418] lg:text-[clamp(28px,2vw,32px)] lg:font-semibold">
                Welcome Back
              </h1>
              <p className="mt-1 text-xs text-[#3b2418] lg:mt-2 lg:text-base">
                Login To Your Account
              </p>
            </div>

            <form
              className="space-y-3 lg:space-y-5 xl:space-y-6"
              onSubmit={handleLogin}
            >
              <InputBox
                icon={<Mail size={18} />}
                placeholder="Email Address"
                value={email}
                onChange={setEmail}
              />

              <InputBox
                icon={<Lock size={18} />}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                rightIcon={
                  showPassword ? <EyeOff size={18} /> : <Eye size={18} />
                }
                onRightIconClick={() => setShowPassword((current) => !current)}
                rightIconLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              />

              {error && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {error}
                </p>
              )}

              <div className="text-right">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="rounded-[4px] text-[10px] font-semibold text-[#c9914d] hover:underline lg:text-base xl:text-lg"
                >
                  Forgot Password ?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-[4px] bg-[#c9914d] text-xs font-semibold tracking-[1px] text-white transition hover:bg-[#b57f3f] lg:h-14 xl:h-[58px] lg:text-base lg:tracking-[2px]"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-5 text-center text-[10px] text-[#3b2418] lg:mt-8 lg:text-sm lg:text-[#c9914d]">
              Don&apos;t Have An Account?{" "}
              <button
                type="button"
                onClick={onCreateAccount}
                className="rounded-[4px] font-semibold text-[#c9914d] underline lg:text-[#3b2418]"
              >
                Create Account
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function InputBox({
  icon,
  rightIcon,
  rightIconLabel,
  onRightIconClick,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconLabel?: string;
  onRightIconClick?: () => void;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="flex h-11 items-center rounded-[4px] border border-[#d9b37f] bg-white px-3 lg:h-14 lg:border-[#c9914d] lg:bg-transparent lg:px-5 xl:h-16">
      <span className="mr-3 text-[#3b2418] [&_svg]:h-3.5 [&_svg]:w-3.5 lg:mr-5 lg:[&_svg]:h-[18px] lg:[&_svg]:w-[18px]">
        {icon}
      </span>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-xs text-[#3b2418] outline-none placeholder:text-[#777] lg:text-base lg:placeholder:text-[#6f6b68] xl:text-lg"
      />

      {rightIcon && onRightIconClick && (
        <button
          type="button"
          aria-label={rightIconLabel}
          onClick={onRightIconClick}
          className="ml-3 rounded-[4px] text-[#3b2418] [&_svg]:h-3.5 [&_svg]:w-3.5 lg:ml-4 lg:[&_svg]:h-[18px] lg:[&_svg]:w-[18px]"
        >
          {rightIcon}
        </button>
      )}
    </div>
  );
}
