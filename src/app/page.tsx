"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FullScreenLoader } from "@/components/ui";

export default function Index() {
  const router = useRouter();
  const { loading, session } = useAuth();
  useEffect(() => {
    if (!loading) router.replace(session ? "/home" : "/login");
  }, [loading, session, router]);
  return <FullScreenLoader />;
}
