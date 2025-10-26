"use server";

import { z } from "zod";

import { fetchWithErrorHandlers } from "@/lib/utils";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  message?: string;
  token?: string;
  email?: string; // Add email to the state
  password?: string; // Add password to the state
  name?: string; // Add name to the state
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const response = await fetchWithErrorHandlers(
      `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        status: "failed",
        message: errorData.message || "Login failed",
      };
    }

    const data = await response.json();
    return {
      status: "success",
      message: "Login successful",
      token: data.token, // Assuming the token is returned here
      email: validatedData.email, // Return email
      password: validatedData.password, // Return password
      name: data.name, // Return name
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "invalid_data",
        message: "Invalid email or password format.",
      };
    }

    return {
      status: "failed",
      message:
        error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const checkUserResponse = await fetchWithErrorHandlers(
      `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/user?email=${validatedData.email}`
    );

    const users = await checkUserResponse.json();

    if (users && users.length > 0) {
      return { status: "user_exists" } as RegisterActionState;
    }

    const registerResponse = await fetchWithErrorHandlers(
      `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!registerResponse.ok) {
      return { status: "failed" };
    }

    // Removed signIn call from here as well

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};
