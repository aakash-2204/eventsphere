// Zod validation rules for the auth forms. These run on the server inside the
// Server Actions, so they cannot be skipped by editing the page in the browser.

import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your name (at least 2 characters).")
  .max(100, "Use 100 characters or fewer.");

export const signUpSchema = z
  .object({
    fullName: fullNameSchema,
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const organizerRequestSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Enter your organization name.")
    .max(120, "Use 120 characters or fewer."),
  reason: z
    .string()
    .trim()
    .min(20, "Tell us a little more (at least 20 characters).")
    .max(1000, "Use 1000 characters or fewer."),
});
