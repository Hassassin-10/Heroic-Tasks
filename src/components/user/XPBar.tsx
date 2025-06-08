
"use client";

import { Progress } from "@/components/ui/progress";
import { Star, Zap } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar

interface XPBarProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
  userName?: string;
  photoURL?: string | null; // Added photoURL prop
}

const getAlienRank = (level: number): string => {
  if (level < 5) return "Rookie Plumber";
  if (level < 10) return "Field Agent";
  if (level < 15) return "Galactic Hero";
  if (level < 20) return "Keeper of the Omnitrix";
  return "Legend of the Universe";
};


export function XPBar({ currentXP, xpToNextLevel, level, userName = "Hero", photoURL }: XPBarProps) {
  const progressPercentage = xpToNextLevel > 0 ? (currentXP / xpToNextLevel) * 100 : 0;
  const alienRank = getAlienRank(level);
  const userInitial = userName?.charAt(0).toUpperCase() || "H";

  return (
    <Card className="mb-6 shadow-md bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3 mb-2">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            <AvatarImage src={photoURL || undefined} alt={userName} data-ai-hint="user avatar" />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{userInitial}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base sm:text-lg font-headline text-primary">
               Welcome, {userName}!
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground -mt-0.5">{alienRank}</p>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
         <div className="text-sm sm:text-md font-semibold text-foreground flex items-center">
            <Zap className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-accent" /> Level {level}
          </div>
          <div className="flex items-center text-xs sm:text-sm font-medium text-accent">
            <Star className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            {currentXP} / {xpToNextLevel} XP
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4 sm:px-6">
        <Progress value={progressPercentage} className="w-full h-2.5 sm:h-3 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" aria-label={`Level progress: ${currentXP} of ${xpToNextLevel} XP`} />
         {progressPercentage >= 100 && (
          <p className="text-xs text-center mt-2 text-primary font-semibold animate-pulse">LEVEL UP IMMINENT!</p>
        )}
      </CardContent>
    </Card>
  );
}
