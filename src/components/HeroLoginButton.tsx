"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HeroLoginButton() {
  const { isMember, isReady } = useAuth();

  if (!isReady || isMember) return null;

  return (
    <Link
      href="/login"
      className="rounded-full border border-porcelain/30 px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:border-porcelain hover:bg-porcelain/10"
    >
      Log in to your account
    </Link>
  );
}
