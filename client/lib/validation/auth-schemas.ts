// lib/validation/auth-schemas.ts
import { z } from "zod";

// Customer form messages are translation keys (namespace "auth"); see messages/*.json
export const customerLoginSchema = z.object({
  email: z.string().email("validation.email"),
  password: z.string().min(6, "validation.passwordMin"),
});
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

export const customerSignupSchema = z
  .object({
    fullName: z.string().min(2, "validation.fullName"),
    email: z.string().email("validation.email"),
    phone: z.string().min(7, "validation.phone"),
    password: z.string().min(6, "validation.passwordMin"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMatch",
    path: ["confirmPassword"],
  });
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;

export const ownerLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;

// The emailed 6-digit code and the account pages that use it (customer messages are translation keys, namespace "auth").
const codeField = z.string().regex(/^\d{6}$/, "validation.code");

export const verifyEmailSchema = z.object({ email: z.string().email("validation.email"), code: codeField });
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({ email: z.string().email("validation.email") });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email("validation.email"),
    code: codeField,
    newPassword: z.string().min(8, "validation.passwordMin8"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.passwordMatch",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Same forms for restaurant owners, with plain messages like the rest of the owner portal.
const ownerCodeField = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

export const ownerVerifyEmailSchema = z.object({ email: z.string().email("Enter a valid email"), code: ownerCodeField });
export type OwnerVerifyEmailInput = z.infer<typeof ownerVerifyEmailSchema>;

export const ownerForgotPasswordSchema = z.object({ email: z.string().email("Enter a valid email") });
export type OwnerForgotPasswordInput = z.infer<typeof ownerForgotPasswordSchema>;

export const ownerResetPasswordSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    code: ownerCodeField,
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type OwnerResetPasswordInput = z.infer<typeof ownerResetPasswordSchema>;
