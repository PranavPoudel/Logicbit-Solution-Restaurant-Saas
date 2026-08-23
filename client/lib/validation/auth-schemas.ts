// lib/validation/auth-schemas.ts
import { z } from "zod";

export const customerLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

export const customerSignupSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7, "Enter a valid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;

export const ownerLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;
