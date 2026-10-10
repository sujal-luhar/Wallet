import { z } from "zod";

// ==========================================
// 1. Sign Up Validation Schema
// ==========================================
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .optional(),
  email: z
    .email({ message: "Invalid email address format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(100, { message: "Password cannot exceed 100 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});


// ==========================================
// 2. Sign In Validation Schema
// ==========================================
export const signInSchema = z.object({
    email: z
    .email({ message: "Invalid email address format" }),
    password: z
    .string()
    .min(1, { message: "Password is required" }),
});


// ==========================================
// 3. Email Verification Query Schema
// ==========================================
export const verifyEmailSchema = z.object({
    token: z
    .string()
    .min(1, { message: "Verification token is required" }),
});


// ==========================================
// 4. User Profile Response / Me Schema
// ==========================================
export const userProfileSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.email(),
    emailVerified: z.date().nullable(),
    image: z.string().nullable(),
    createdAt: z.date().optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;