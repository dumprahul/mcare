"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RetroGrid } from "@/components/magicui/retro-grid";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

export default function SignIn() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    await signIn("google", {
      callbackUrl: "/profile",
      redirect: true,
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Retro Grid Background */}
      <RetroGrid angle={70} cellSize={50} opacity={0.3} lightLineColor="#a5b4fc" darkLineColor="#6366f1" />

   
      

      {/* Main Card */}
      <div className="relative z-10 max-w-md w-full space-y-8 p-10 bg-white/90 dark:bg-black/80 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-200 dark:border-gray-800">
        <div className="text-center space-y-4">
          <AnimatedShinyText className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white block">
            Welcome to Marutham Care
          </AnimatedShinyText>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
            Your trusted healthcare companion
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <RainbowButton
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 text-lg font-semibold rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M21.805 10.023h-9.18v3.955h5.262c-.227 1.19-1.36 3.49-5.262 3.49-3.168 0-5.75-2.63-5.75-5.868s2.582-5.868 5.75-5.868c1.805 0 3.017.77 3.71 1.43l2.53-2.46C17.09 3.64 15.13 2.5 12.625 2.5 7.98 2.5 4.25 6.23 4.25 10.877c0 4.646 3.73 8.377 8.375 8.377 4.84 0 8.04-3.4 8.04-8.19 0-.55-.06-1.09-.16-1.64z"
              />
            </svg>
            Sign in with Google
          </RainbowButton>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Secure and private healthcare management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 