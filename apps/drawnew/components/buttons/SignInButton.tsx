"use client";
import Link from "next/link";
import { Button } from "@repo/ui/button";

export function SignInButton() {
  return (
    <Link href="/signin">
      <Button className="h-12 px-6 bg-gradient-to-r from-[#8B5CF6] to-[#7E69AB] hover:from-[#9b87f5] hover:to-[#8B5CF6] border-none shadow-lg shadow-purple-900/20 text-white">
        Sign in
      </Button>
    </Link>
  );
}
 