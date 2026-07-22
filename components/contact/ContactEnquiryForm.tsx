"use client";

import { FormEvent, useRef, useState, useTransition } from "react";

import { submitEnquiryContactAction } from "@/actions/customer-contact.action";
import { useToast } from "@/components/common/ToastProvider";
import { Button } from "@/components/ui/button";

export function ContactEnquiryForm({
  initialCategories = ["Bandhej Sarees", "Bandhej Dupattas", "Custom Order"],
}: {
  initialCategories?: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitEnquiryContactAction(formData);

      if (!result.success) {
        setError(result.message);
        showToast({ title: result.message, tone: "error" });
        return;
      }

      formRef.current?.reset();
      showToast({ title: result.message, tone: "success" });
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="mt-7 bg-[#F7EFE6] px-7 py-9 md:px-10 md:py-11"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#C39150]">
        Send a Message
      </p>
      <h3 className="mt-4 font-heading text-[2rem] font-medium leading-tight text-[#C39150]">
        Get in Touch
      </h3>

      <div className="mt-8 grid gap-x-7 gap-y-6 sm:grid-cols-2">
        <Field
          label="Full Name *"
          name="fullName"
          placeholder="Your name"
          autoComplete="name"
          required
        />
        <Field
          label="Email Address *"
          name="email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          required
        />
        <Field
          label="Phone Number *"
          name="phone"
          type="tel"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          required
        />
        <label className="block">
          <span className="text-[0.7rem] font-semibold text-[#22140f]">
            Category *
          </span>
          <select
            name="category"
            required
            defaultValue=""
            className="mt-3 h-12 w-full border border-[#C39150]/60 bg-transparent px-4 text-xs text-[#3F2617] outline-none transition focus:border-[#3F2617]"
          >
            <option value="" disabled>
              Select a category
            </option>
            {initialCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <Field
          label="Subject *"
          name="subject"
          placeholder="How can we help you"
          required
        />
      </div>

      <label className="mt-6 block">
        <span className="text-[0.7rem] font-semibold text-[#22140f]">
          Message *
        </span>
        <textarea
          name="message"
          placeholder="Tell us more about your inquiry..."
          rows={7}
          required
          className="mt-3 w-full resize-none border border-[#C39150]/60 bg-transparent px-4 py-4 text-xs outline-none transition placeholder:text-[#3F2617]/45 focus:border-[#3F2617]"
        />
      </label>

      {error ? (
        <p className="mt-5 text-sm font-medium text-red-700">{error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="mt-9 h-12 px-8 rounded-[2px] bg-[#C39150] text-sm font-semibold tracking-tight text-white hover:bg-[#3F2617]"
      >
        {isPending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[0.7rem] font-semibold text-[#22140f]">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="mt-3 h-12 w-full border border-[#C39150]/60 bg-transparent px-4 text-xs outline-none transition placeholder:text-[#3F2617]/45 focus:border-[#3F2617]"
      />
    </label>
  );
}
