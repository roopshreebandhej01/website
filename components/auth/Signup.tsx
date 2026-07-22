"use client";

import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { signUpAction } from "@/actions/auth.action";
import { useToast } from "@/components/common/ToastProvider";
import Link from "next/link";

export default function Signup({
  onLogin,
  onVerifyOtp,
}: {
  onLogin?: () => void;
  onVerifyOtp?: (credentials: { email: string; password: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const showWeakPasswordWarning =
    password.length > 0 && !isStrongPassword(password);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      showToast({ title: "Passwords do not match", tone: "error" });
      return;
    }

    if (!isStrongPassword(password)) {
      setError("Please use a stronger password");
      showToast({ title: "Please use a stronger password", tone: "error" });
      return;
    }

    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const response = await signUpAction({
      name,
      email: normalizedEmail,
      phone,
      password,
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError(response.error ?? "Unable to create account");
      showToast({
        title: response.error ?? "Unable to create account",
        tone: "error",
      });
      return;
    }

    showToast({
      title: response.message ?? "OTP sent. Please check your inbox.",
      tone: "success",
    });
    onVerifyOtp?.({ email: normalizedEmail, password });
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white lg:bg-[#f3dfc7] lg:bg-[url('/auth/login_bg.png')] lg:bg-cover lg:bg-center lg:bg-no-repeat">
      <div className="relative grid min-h-screen w-full px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:px-0 lg:py-0">
        <div className="hidden lg:block" />

        <section className="relative flex min-h-screen w-full items-center justify-center lg:px-8 xl:px-16 2xl:px-24">
          <div className="relative w-full max-w-[360px] px-0 py-0 sm:max-w-[420px] lg:w-[min(630px,calc(50vw-64px))] lg:max-w-none lg:bg-white/45 lg:px-6 lg:py-6 xl:px-7 xl:py-8">
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

            <div className="mb-6 text-center lg:mb-5 xl:mb-6">
              <h1 className="font-heading text-[22px] leading-tight text-[#3b2418] lg:text-[clamp(26px,1.9vw,30px)] lg:font-semibold">
                Register
              </h1>
              <p className="mt-1 text-xs text-[#3b2418] lg:text-sm">
                Create Your Account
              </p>
            </div>

            <form
              className="space-y-3 lg:space-y-4 xl:space-y-5"
              onSubmit={handleSignup}
            >
              <InputBox
                icon={<User size={18} />}
                placeholder="Full Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <InputBox
                icon={<Mail size={18} />}
                placeholder="Email Address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <InputBox
                icon={<Phone size={18} />}
                placeholder="Mobile Number"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />

              <InputBox
                icon={<Lock size={18} />}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                rightIcon={
                  showPassword ? <EyeOff size={18} /> : <Eye size={18} />
                }
                rightIconLabel={
                  showPassword ? "Hide password" : "Show password"
                }
                onRightIconClick={() => setShowPassword((current) => !current)}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <InputBox
                icon={<Lock size={18} />}
                placeholder="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              {showWeakPasswordWarning && (
                <p className="text-xs font-medium text-red-500">
                  Weak Password. Please use a strong password
                </p>
              )}

              {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-[4px] bg-[#c9914d] text-xs font-semibold tracking-[1px] text-white transition hover:bg-[#b57f3f] lg:h-11 lg:text-sm lg:tracking-[1.5px] xl:h-12 xl:text-base"
              >
                {isSubmitting ? "Signing Up..." : "Sign Up"}
              </button>
            </form>

            <p className="mt-5 text-center text-[10px] text-[#c9914d] lg:mt-5 lg:text-sm">
              Already Have An Account?{" "}
              <button
                type="button"
                onClick={onLogin}
                className="rounded-[4px] font-semibold text-[#3b2418] underline"
              >
                Login
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

function InputBox({
  icon,
  rightIcon,
  rightIconLabel,
  onRightIconClick,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconLabel?: string;
  onRightIconClick?: () => void;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="flex h-11 items-center rounded-[4px] border border-[#d9b37f] bg-white px-3 lg:h-12 lg:border-[#c9914d] lg:bg-transparent lg:px-4 xl:h-14 xl:px-5">
      <span className="mr-3 text-[#3b2418] [&_svg]:h-3.5 [&_svg]:w-3.5 lg:mr-4 lg:[&_svg]:h-4 lg:[&_svg]:w-4 xl:mr-5 xl:[&_svg]:h-[18px] xl:[&_svg]:w-[18px]">
        {icon}
      </span>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-transparent text-xs text-[#3b2418] outline-none placeholder:text-[#777] lg:text-sm lg:placeholder:text-[#8a8580] xl:text-base"
      />

      {rightIcon && onRightIconClick && (
        <button
          type="button"
          aria-label={rightIconLabel}
          onClick={onRightIconClick}
          className="ml-3 rounded-[4px] text-[#3b2418] [&_svg]:h-3.5 [&_svg]:w-3.5 lg:[&_svg]:h-4 lg:[&_svg]:w-4 xl:[&_svg]:h-[18px] xl:[&_svg]:w-[18px]"
        >
          {rightIcon}
        </button>
      )}
    </div>
  );
}
