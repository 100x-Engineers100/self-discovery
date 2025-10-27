"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Spinner from "@/components/ui/spinner";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  return <>{children}</>;
}