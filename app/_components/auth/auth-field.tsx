"use client";

import type { HTMLInputTypeAttribute } from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  variant?: "default" | "code";
};

const INPUT_VARIANTS = {
  default: "text-[15px]",
  code: "font-display text-[18px] font-bold tracking-[3px]",
} as const;

export function AuthField({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  error,
  variant = "default",
}: AuthFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-[#B6A99B] focus:border-auth-focus focus:ring-2 focus:ring-auth-focus/40 ${
          error ? "border-brand-dark" : "border-auth-line"
        } ${INPUT_VARIANTS[variant]}`}
      />
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-[13px] font-semibold text-brand-dark"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
