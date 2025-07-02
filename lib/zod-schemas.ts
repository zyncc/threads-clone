import { z } from "zod";

export const signUpFormSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(
        /^[a-zA-Z0-9._]+$/,
        "Username can only contain letters, numbers, dots, and underscores",
      ),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signInFormSchema = z.object({
  identifier: z
    .string()
    .min(1, "Username or email is required")
    .refine((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;

      return emailRegex.test(value) || usernameRegex.test(value);
    }, "Please enter a valid email or username"),
  password: z.string().min(1, "Password is required"),
});

export const commentSchema = z.object({
  comment: z
    .string()
    .min(1, {
      message: "Comment must be at least 1 character.",
    })
    .max(255, "Comment must be less than 255 characters")
    .trim(),
});
