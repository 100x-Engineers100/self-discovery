"use client";

import { useEffect ,useActionState} from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react"; // Import signIn and useSession from next-auth/react

import { login, type LoginActionState } from "../actions";
import { AuthForm } from "@/components/auth-form";
import { toast } from "@/components/toast";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );
  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === "success") {
      // Call signIn from next-auth/react to establish the session
      signIn("credentials", {
        email: state.email, // Assuming email is returned in state
        password: state.password, // Assuming password is returned in state
        redirect: false,
      }).then(() => {
        updateSession();
        router.refresh();
        router.push("/");
      });
    } else if (state.status === "failed") {
      toast({
        type: "error",
        description: state.message || "Invalid credentials. Please try again.",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Invalid email or password format.",
      });
    }
  }, [state, router, updateSession]);

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={formAction}>
          <SubmitButton isSuccessful={state.status === "success"}>Sign in</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/register"
            >
              Sign up
            </Link>
            {" for free."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}