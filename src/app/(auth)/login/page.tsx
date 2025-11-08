"use client";

import { useEffect ,useActionState} from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react"; // Import signIn and useSession from next-auth/react
import Image from "next/image"; // Import Image component

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
    <div className="relative flex h-dvh w-screen items-center md:justify-end justify-center bg-white">
      <div className="h-full w-full absolute top-0 left-0">
        <Image
          src="/ikigai-login.png"
          alt="Login Background"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      </div>
      <div className="relative z-10 flex w-full max-w-xs flex-col gap-12 overflow-hidden rounded-2xl bg-white p-8 shadow-lg md:max-w-lg lg:max-w-xl md:mr-20">
        <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
          <img src="/100xEngineers-black.svg" alt="100xEngineers" className="h-6 w-auto" />
        </div>
        <h2 className="text-center lg:text-4xl md:text-2xl text-xl tracking-tight">Welcome, cohort member 👋</h2>
        <div className="flex flex-col gap-2 text-center">
          <h3 className="lg:text-2xl md:text-xl tracking-tight">Sign in to continue</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use the email you registered for the cohort with.
          </p>
        </div>
        <AuthForm action={formAction}>
          <SubmitButton isSuccessful={state.status === "success"}>Sign In</SubmitButton>
        </AuthForm>
        {/* <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Having trouble logging in? <a href="mailto:hello@100xengineers.com" className="text-[#FF6445] hover:underline">hello@100xengineers.com</a>
          </p>
        </div> */}
      </div>
    </div>
  );
}