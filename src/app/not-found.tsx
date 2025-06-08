
// src/app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import OmnitrixIcon from '@/components/icons/OmnitrixIcon'; // Assuming you have this

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center max-w-md">
        <OmnitrixIcon className="h-24 w-24 sm:h-32 sm:w-32 text-primary mx-auto mb-6" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary mb-4">404 - Sector Not Found</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-2">
          Oops! It seems like you've ventured into an uncharted territory of the galaxy.
        </p>
        <p className="text-md text-muted-foreground mb-8">
          The page you're looking for might have been vaporized by a Chronosapien or teleported to another dimension.
        </p>
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-8 animate-pulse" />
        <Link href="/">
          <Button size="lg" className="font-semibold">
            <Home className="mr-2 h-5 w-5" />
            Return to Headquarters
          </Button>
        </Link>
        <p className="mt-12 text-xs text-muted-foreground/70">
          If you believe this is an error, try recalibrating your Omnitrix (or refresh the page).
        </p>
      </div>
    </div>
  );
}
