"use client";
import Link from "next/link";
import { Button } from "@repo/ui/button";

export function SignUpButton() {
  return (
    <Link href="/signup">
      <Button
        variant="outline"
        className="h-12 px-6 bg-gradient-to-r from-[#8B5CF6] to-[#7E69AB] hover:from-[#9b87f5] hover:to-[#8B5CF6] border-none shadow-lg shadow-purple-900/20 text-white"
      >
        Sign up
      </Button>
    </Link>
  );
}
 