"use client"
import React from "react";
import { Card } from "@repo/ui/card";
import Link from "next/link";
import { Share2, Users2, Sparkles, Github, Download, Moon, } from "lucide-react";
import { SignOutButton } from "@/components/buttons/SignOutButton";
import { useEffect, useState } from "react";
import { SignInButton } from "@/components/buttons/SignInButton";
import { SignUpButton } from "@/components/buttons/SignUpButton";
import { OpenCanvasButton } from "@/components/buttons/OpenCanvasButton";

const Index = () => {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(!!localStorage.getItem("token"));
  }, []);

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      <SignOutButton />

      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 via-[#1EAEDB]/10 to-[#7E69AB]/20 animate-gradient"></div>
        <div className="relative z-10 container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-[#9b87f5] via-[#D6BCFA] to-[#8B5CF6] bg-clip-text text-transparent animate-pulse">
              Collaborative Whiteboarding
              <span className="block mt-2">Made Simple</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-gray-300">
              Create, collaborate, and share beautiful diagrams and sketches with our intuitive drawing tool.
              sign-up required.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              {!signedIn ? (
                <>
                  <SignInButton />
                  <SignUpButton />
                </>
              ) : (
                <OpenCanvasButton />
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="py-24 bg-[#1A1F2C]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-16 bg-gradient-to-r from-[#D6BCFA] to-[#8B5CF6] bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 bg-[#403E43]/30 backdrop-blur-sm border rounded-md border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all duration-300 shadow-xl shadow-purple-900/10 group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#8B5CF6]/20 group-hover:bg-[#8B5CF6]/30 transition-colors">
                  <Share2 className="h-6 w-6 text-[#9b87f5]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100">Real-time Collaboration</h3>
              </div>
              <div className="mt-4 text-gray-300">
                Work together with your team in real-time. Share your drawings instantly with a simple link.
              </div>
            </Card>

            <Card className="p-6 bg-[#403E43]/30 backdrop-blur-sm border rounded-md border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all duration-300 shadow-xl shadow-purple-900/10 group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#8B5CF6]/20 group-hover:bg-[#8B5CF6]/30 transition-colors">
                  <Users2 className="h-6 w-6 text-[#9b87f5]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100">Multiplayer Editing</h3>
              </div>
              <div className="mt-4 text-gray-300">
                Multiple users can edit the same canvas simultaneously. See who&apos; drawing what in real-time.
              </div>
            </Card>

            <Card className="p-6 bg-[#403E43]/30 backdrop-blur-sm border rounded-md border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all duration-300 shadow-xl shadow-purple-900/10 group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#8B5CF6]/20 group-hover:bg-[#8B5CF6]/30 transition-colors">
                  <Sparkles className="h-6 w-6 text-[#9b87f5]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100">Smart Drawing</h3>
              </div>
              <div className="mt-4 text-gray-300">
                Intelligent shape recognition and drawing assistance helps you create perfect diagrams.
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#121212]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#1EAEDB]"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00TTI2IDE0YzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNE0xNiA0NGMwLTIuMiAxLjgtNCA0LTRzNCAxLjggNCA0LTEuOCA0LTQgNC00LTEuOC00LTQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xNSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
            <div className="relative p-8 sm:p-16">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to start creating?
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg text-gray-100/90">
                  Join thousands of users who are already creating amazing diagrams and sketches.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                  <Link href={"/signin"} >
                    <OpenCanvasButton/>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 bg-[#0F1115]">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-sm text-gray-400">
              © 2025 Excalidraw Clone. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="https://github.com/saurabhraghuvanshii/excalidraw-clone" className="text-gray-400 hover:text-[#9b87f5] transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#9b87f5] transition-colors">
                <Download className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#9b87f5] transition-colors">
                <Moon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
