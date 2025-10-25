"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import type { VisibilityType } from "@/components/visibility-selector";

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId?: string;
  initialVisibilityType?: VisibilityType;
}) {
  const pathname = usePathname();
  const [isChatPage, setIsChatPage] = useState(false);
  const { setOpenMobile } = useSidebar();
  const [visibilityType, setVisibilityType] = useState<VisibilityType>(
    initialVisibilityType || "private"
  );

  useEffect(() => {
    if (pathname === "/") {
      setIsChatPage(true);
      setOpenMobile(true);
    } else {
      setIsChatPage(false);
      setOpenMobile(false);
    }
  }, [pathname, setOpenMobile]);

  useEffect(() => {
    if (initialVisibilityType) {
      setVisibilityType(initialVisibilityType);
    }
  }, [initialVisibilityType]);

  return {
    isChatPage,
    visibilityType,
    setVisibilityType,
  };
}
