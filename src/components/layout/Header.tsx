
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { User, LogIn, LogOut, Volume2, VolumeX, Users, UserCircle2, BarChart3, AlertTriangle } from "lucide-react"; // Added BarChart3, AlertTriangle
import React, { useState, useEffect } from "react";
import { getMuteState, toggleMute, playTransformSound, playClickSound } from "@/lib/soundUtils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import OmnitrixIcon from "@/components/icons/OmnitrixIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
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

  const initiateLogout = () => {
    playTransformSound();
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = async () => {
    playClickSound();
    try {
      await firebaseSignOut(auth);
      onExitGuestMode(); // Ensure this is called
      toast({ title: "Logged Out", description: "Hope to see you back soon, Hero!" });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
    setIsLogoutConfirmOpen(false);
  };

  const cancelLogout = () => {
    playClickSound();
    setIsLogoutConfirmOpen(false);
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
            <OmnitrixIcon className="h-6 w-6 xs:h-8 xs:w-8 text-primary" />
            <h1 className="text-lg xxs:text-xl xs:text-2xl font-headline font-bold text-primary">Heroic Tasks</h1>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {isLoadingAuth ? (
              <Button variant="ghost" size="icon" disabled>
                <User className="h-5 w-5 animate-pulse" />
              </Button>
            ) : currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                 {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={displayName} className="h-6 w-6 sm:h-7 sm:w-7 rounded-full"/>
                 ) : (
                    <UserCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground"/>
                 )}
                <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">
                  {displayName}
                </span>
                <Link href="/report" passHref>
                  <Button variant="outline" size="sm" onClick={playClickSound} className="px-2 sm:px-3">
                    <BarChart3 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Report</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={initiateLogout} className="px-2 sm:px-3">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : isGuestActive ? (
              <div className="flex items-center gap-1 sm:gap-2">
                 <Users className="h-5 w-5 text-primary " />
                 <span className="text-xs sm:text-sm text-primary font-medium hidden xs:inline">Guest Mode</span>
                <Button variant="default" size="sm" onClick={triggerAuthModalOpen} className="px-2 sm:px-3">
                  <LogIn className="h-4 w-4 sm:mr-2" /> 
                  <span className="hidden sm:inline">Login to Save</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="outline" size="sm" onClick={() => { playClickSound(); onEnterGuestMode(); }} className="px-2 sm:px-3">
                   <Users className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Guest Mode</span>
                </Button>
                <Button variant="default" size="sm" onClick={triggerAuthModalOpen} className="px-2 sm:px-3">
                  <LogIn className="h-4 w-4 sm:mr-2" /> 
                  <span className="hidden xxs:inline xs:hidden">Login</span>
                  <span className="hidden xs:inline">Login / Sign Up</span>
                </Button>
              </div>
            )}
            <Button variant="outline" size="icon" onClick={handleMuteToggle} aria-label={isMuted ? "Unmute sounds" : "Mute sounds"} className="h-8 w-8 sm:h-9 sm:w-9">
              {isMuted ? <VolumeX className="h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem]" /> : <Volume2 className="h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem]" />}
              <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out, Hero? Your current session will end.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLogout}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-destructive hover:bg-destructive/90">
              Confirm Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
