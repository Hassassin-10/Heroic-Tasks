
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { User, LogIn, LogOut, Volume2, VolumeX, Users, UserCircle2, BarChart3 } from "lucide-react"; // Added BarChart3
import React, { useState, useEffect } from "react";
import { getMuteState, toggleMute, playTransformSound, playClickSound } from "@/lib/soundUtils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import OmnitrixIcon from "@/components/icons/OmnitrixIcon";

interface AppHeaderProps {
  isGuestActive: boolean;
  onEnterGuestMode: () => void;
  onExitGuestMode: () => void;
  onAuthModalOpen: () => void;
}

export function AppHeader({
  isGuestActive,
  onEnterGuestMode,
  onExitGuestMode,
  onAuthModalOpen
}: AppHeaderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMuted(getMuteState());
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      if (user) {
        onExitGuestMode();
      }
    });
    return () => unsubscribe();
  }, [onExitGuestMode]);

  const handleLogout = async () => {
    playTransformSound();
    try {
      await firebaseSignOut(auth);
      onExitGuestMode();
      toast({ title: "Logged Out", description: "Hope to see you back soon, Hero!" });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  const handleMuteToggle = () => {
    playClickSound();
    const newMuteState = toggleMute();
    setIsMuted(newMuteState);
  };

  const triggerAuthModalOpen = () => {
    playClickSound();
    if (onAuthModalOpen) {
      onAuthModalOpen();
    }
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Hero";

  return (
    <>
      <header className="py-4 px-4 sm:px-6 border-b border-border/40 shadow-sm sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={playClickSound}>
            <OmnitrixIcon className="h-8 w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-headline font-bold text-primary">Heroic Tasks</h1>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {isLoadingAuth ? (
              <Button variant="ghost" size="icon" disabled>
                <User className="h-5 w-5 animate-pulse" />
              </Button>
            ) : currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                 {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="h-7 w-7 rounded-full"/>
                 ) : (
                    <UserCircle2 className="h-7 w-7 text-muted-foreground"/>
                 )}
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {displayName}
                </span>
                <Link href="/report" passHref>
                  <Button variant="outline" size="sm" onClick={playClickSound}>
                    <BarChart3 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Report</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : isGuestActive ? (
              <div className="flex items-center gap-1 sm:gap-2">
                 <Users className="h-5 w-5 text-primary " />
                 <span className="text-sm text-primary font-medium hidden sm:inline">Guest Mode</span>
                <Button variant="default" size="sm" onClick={triggerAuthModalOpen}>
                  <LogIn className="h-4 w-4 sm:mr-2" /> 
                  <span className="hidden sm:inline">Login to Save</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="outline" size="sm" onClick={() => { playClickSound(); onEnterGuestMode(); }}>
                   <Users className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Guest Mode</span>
                </Button>
                <Button variant="default" size="sm" onClick={triggerAuthModalOpen}>
                  <LogIn className="h-4 w-4 sm:mr-2" /> 
                  <span className="hidden xxs:inline xs:hidden">Login</span>
                  <span className="hidden xs:inline">Login / Sign Up</span>
                </Button>
              </div>
            )}
            <Button variant="outline" size="icon" onClick={handleMuteToggle} aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}>
              {isMuted ? <VolumeX className="h-[1.2rem] w-[1.2rem]" /> : <Volume2 className="h-[1.2rem] w-[1.2rem]" />}
              <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
