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
