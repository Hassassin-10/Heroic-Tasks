
"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider, 
  signInWithPopup,    
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { Separator } from "@/components/ui/separator"; 

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5 mr-2">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  const handleAuthError = (err: unknown) => {
    setLoading(false);
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential": 
          setError("Incorrect email or password.");
          break;
        case "auth/email-already-in-use":
          setError("This email is already registered. Try logging in or use Google Sign-In if you previously used it.");
          break;
        case "auth/weak-password":
          setError("Password is too weak. It should be at least 6 characters.");
          break;
        case "auth/popup-closed-by-user":
          setError("Sign-in process was cancelled. Please try again.");
          break;
        case "auth/account-exists-with-different-credential":
           setError("An account already exists with this email address using a different sign-in method. Try logging in with that method.");
           break;
        default:
          setError("An unexpected error occurred. Please try again.");
          console.error("Firebase Auth Error:", err);
      }
    } else {
      setError("An unexpected error occurred. Please try again.");
      console.error("Non-Firebase Auth Error:", err);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful!", description: "Welcome back, Hero!" });
      onClose();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Signup Successful!", description: "Your heroic journey begins!" });
      onClose();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address to reset password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: "Check your inbox for instructions." });
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Google Sign-In Successful!", description: "Welcome, Hero!" });
      onClose();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md w-[90%] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pt-4">
          <DialogTitle className="text-center text-xl sm:text-2xl font-headline text-primary">
            Heroic Tasks Access
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {activeTab === "login" ? "Log in to continue your missions." : "Sign up to become a hero!"}
          </DialogDescription>
        </DialogHeader>
        
        <Button 
          variant="outline" 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="w-full my-3 sm:my-4 text-sm sm:text-base"
        >
          <GoogleIcon />
          Sign in with Google
        </Button>

        <div className="flex items-center my-1 sm:my-2">
          <Separator className="flex-grow" />
          <span className="px-2 text-xs text-muted-foreground">OR</span>
          <Separator className="flex-grow" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
            <TabsTrigger value="login">Login with Email</TabsTrigger>
            <TabsTrigger value="signup">Sign Up with Email</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="login-email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="hero@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="login-password" className="text-xs sm:text-sm">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Your secret code"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="text-sm sm:text-base"
                />
              </div>
              {error && <p className="text-xs sm:text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full text-sm sm:text-base" disabled={loading}>
                {loading ? "Logging In..." : "Login"}
              </Button>
              <Button type="button" variant="link" onClick={handlePasswordReset} disabled={loading || !email} className="w-full text-xs sm:text-sm">
                Forgot Password?
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="signup-email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="hero@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="signup-password" className="text-xs sm:text-sm">Password (min. 6 characters)</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Choose a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="signup-confirm-password" className="text-xs sm:text-sm">Confirm Password</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="text-sm sm:text-base"
                />
              </div>
              {error && <p className="text-xs sm:text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full text-sm sm:text-base" disabled={loading}>
                {loading ? "Signing Up..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <DialogFooter className="sm:justify-center pt-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="text-sm sm:text-base">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
