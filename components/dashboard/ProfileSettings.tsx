"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
  DashboardCard,
  DashboardPageTitle,
  Field,
  PrimaryAction,
} from "@/components/dashboard/DashboardPrimitives";
import { useToast } from "@/components/common/ToastProvider";
import { changePasswordAction } from "@/actions/auth.action";
import { updateProfile } from "@/helper/user/action";
import type { ProfileView } from "@/services/user.service";

export function ProfileSettings({ profile }: { profile: ProfileView | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateProfile({
        fullName: formData.get("fullName"),
        phone: formData.get("phone"),
        secondPhone: formData.get("secondPhone"),
      });

      showToast({
        title: result.message,
        tone: result.success ? "success" : "error",
      });

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      showToast({
        title: "New password and confirmation do not match",
        tone: "error",
      });
      return;
    }

    startPasswordTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      showToast({
        title: result.message ?? result.error ?? "Unable to update password",
        tone: result.ok ? "success" : "error",
      });

      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <div>
      <DashboardPageTitle>Profile Settings</DashboardPageTitle>

      <div className="mt-5 space-y-5">
        <DashboardCard className="p-5 sm:p-6">
          <h2 className="font-heading text-xl font-medium text-black">
            Personal Information
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field
                label="Full Name"
                name="fullName"
                defaultValue={profile?.fullName}
                required
              />
              <Field
                label="Mobile Number"
                name="phone"
                defaultValue={profile?.phone}
                required
              />
              <Field
                label="Alternate Mobile Number (Optional)"
                name="secondPhone"
                defaultValue={profile?.secondPhone}
              />
              <Field
                label="Email"
                type="email"
                defaultValue={profile?.email}
                className="md:col-span-2"
                readOnly
              />
            </div>
            <PrimaryAction type="submit" className="mt-4" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </PrimaryAction>
          </form>
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6">
          <h2 className="font-heading text-xl font-medium text-black">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mt-5 grid max-w-md gap-4">
              <PasswordField
                label="Current Password"
                name="currentPassword"
                showPassword={showCurrentPassword}
                onToggleShowPassword={() =>
                  setShowCurrentPassword((current) => !current)
                }
              />
              <PasswordField
                label="New Password"
                name="newPassword"
                showPassword={showNewPassword}
                onToggleShowPassword={() =>
                  setShowNewPassword((current) => !current)
                }
              />
              <Field
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
            <PrimaryAction
              type="submit"
              className="mt-4"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? "Updating..." : "Update Password"}
            </PrimaryAction>
          </form>
        </DashboardCard>

        {/* <DashboardCard className="p-5 sm:p-6">
          <h2 className="font-heading text-xl font-medium text-red-500">
            Delete Account
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#555]">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <button
            type="button"
            className="mt-5 h-10 bg-red-500 px-7 text-xs font-semibold tracking-[0.08em] text-white transition hover:bg-red-600"
          >
            Request Account Deletion
          </button>
        </DashboardCard> */}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  name,
  showPassword,
  onToggleShowPassword,
}: {
  label: string;
  name: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
}) {
  return (
    <label className="block min-w-0 text-xs text-[#777]">
      {label}
      <span className="mt-1 flex h-10 w-full items-center border border-[#e1c5a5] bg-white focus-within:border-[#C39150]">
        <input
          name={name}
          type={showPassword ? "text" : "password"}
          required
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-black outline-none"
        />
        <button
          type="button"
          aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
          onClick={onToggleShowPassword}
          className="flex size-10 shrink-0 items-center justify-center text-[#6f625b] transition hover:text-[#C39150]"
        >
          {showPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </span>
    </label>
  );
}
