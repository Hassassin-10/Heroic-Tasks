
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Play, Pause, RotateCcw, TimerIcon, Settings2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { playTransformSound, getMuteState, playClickSound } from "@/lib/soundUtils"; // Added playClickSound

type CycleType = 'work' | 'shortBreak' | 'longBreak';

const DEFAULT_CYCLE_DURATIONS: Record<CycleType, number> = {
  work: 25 * 60, 
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};
const CYCLES_BEFORE_LONG_BREAK = 4;

export function OmnitrixTimer() {
  const [configuredDurations, setConfiguredDurations] = useState({...DEFAULT_CYCLE_DURATIONS});
  const [timeLeft, setTimeLeft] = useState(configuredDurations.work);
  const [isActive, setIsActive] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<CycleType>('work');
  const [workCycleCount, setWorkCycleCount] = useState(0);
  const [inputWorkMinutes, setInputWorkMinutes] = useState<string>((configuredDurations.work / 60).toString());
  const { toast } = useToast();

  const calculateProgress = useCallback(() => {
    const totalDuration = configuredDurations[currentCycle];
    if (totalDuration === 0) return 0;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  }, [timeLeft, currentCycle, configuredDurations]);

  const advanceCycle = useCallback(() => {
    setIsActive(false);
    let nextCycle: CycleType;
    let newWorkCycleCount = workCycleCount;

    if (currentCycle === 'work') {
      newWorkCycleCount++;
      if (newWorkCycleCount % CYCLES_BEFORE_LONG_BREAK === 0) {
        nextCycle = 'longBreak';
      } else {
        nextCycle = 'shortBreak';
      }
    } else {
      nextCycle = 'work';
    }
    
    setWorkCycleCount(newWorkCycleCount);
    setCurrentCycle(nextCycle);
    setTimeLeft(configuredDurations[nextCycle]);
  }, [currentCycle, workCycleCount, configuredDurations]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      console.log(`${currentCycle} cycle ended!`);
      if (!getMuteState()) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(currentCycle === 'work' ? 440 : 660, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); 
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 1);
        } catch (error) {
          console.warn("Could not play timer cycle end sound:", error);
        }
      }
      advanceCycle();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, advanceCycle, currentCycle]);

  const toggleTimer = () => {
    if (!isActive) { 
      playTransformSound();
    } else {
      playClickSound(); // Play click sound for pause
    }
    setIsActive(!isActive);
  };

  const handleResetTimer = () => { // Renamed for clarity to avoid conflict with resetTimer variable
    playClickSound();
    setIsActive(false);
    setTimeLeft(configuredDurations[currentCycle]);
  };
  
  const handleResetToWorkCycle = () => { // Renamed for clarity
    playClickSound();
    setIsActive(false);
    setCurrentCycle('work');
    setTimeLeft(configuredDurations.work);
    setWorkCycleCount(0);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getCycleName = (cycle: CycleType) => {
    switch(cycle) {
      case 'work': return `Focus Time (${configuredDurations.work / 60} min)`;
      case 'shortBreak': return `Short Break (${configuredDurations.shortBreak / 60} min)`;
      case 'longBreak': return `Long Break (${configuredDurations.longBreak / 60} min)`;
      default: return 'Timer';
    }
  }

  const handleSetFocusTime = useCallback(() => {
    playClickSound();
    const newMinutes = parseFloat(inputWorkMinutes);
    if (!isNaN(newMinutes) && newMinutes > 0 && newMinutes <= 240) {
      const newWorkDurationInSeconds = Math.round(newMinutes * 60);
      setConfiguredDurations(prev => {
        const newDurations = { ...prev, work: newWorkDurationInSeconds };
        if (currentCycle === 'work' && !isActive) {
          setTimeLeft(newWorkDurationInSeconds);
        } else if (currentCycle === 'work' && isActive) {
           setTimeLeft(newWorkDurationInSeconds);
        }
        return newDurations;
      });
      toast({
        title: "Focus Time Updated",
        description: `Focus time set to ${newMinutes} minutes.`,
      });
    } else {
      toast({
        title: "Invalid Duration",
        description: "Please enter a valid number of minutes (1-240).",
        variant: "destructive",
      });
      setInputWorkMinutes((configuredDurations.work / 60).toString());
    }
  }, [inputWorkMinutes, currentCycle, isActive, configuredDurations.work, toast]);


  return (
    <Card className="w-full max-w-md mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline text-primary flex items-center justify-center">
          <TimerIcon className="mr-2 h-7 w-7" /> Omnitrix Timer
        </CardTitle>
        <p className="text-sm text-muted-foreground">{getCycleName(currentCycle)}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div 
          className="relative w-48 h-48 rounded-full border-4 border-primary p-2 flex items-center justify-center"
          role="timer"
          aria-live="assertive"
        >
          <div 
            className="absolute inset-0 rounded-full bg-accent/30 transition-all duration-1000" 
            style={{ transform: `scale(${calculateProgress() / 100})`, opacity: calculateProgress() > 0 ? 0.8 : 0 }}
            data-ai-hint="timer progress"
          />
          <span className="text-5xl font-mono font-bold text-foreground z-10">
            {formatTime(timeLeft)}
          </span>
        </div>
         <Progress value={calculateProgress()} className="w-full h-2 [&>div]:bg-primary" aria-label="Timer progress"/>
        
        <div className="mt-2 w-full max-w-xs mx-auto space-y-2">
          <label htmlFor="focus-duration-input" className="block text-sm font-medium text-muted-foreground text-center">
            Set Focus Time (minutes)
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="focus-duration-input"
              type="number"
              value={inputWorkMinutes}
              onChange={(e) => setInputWorkMinutes(e.target.value)}
              min="1"
              max="240"
              className="w-full text-center"
              aria-label="Focus time in minutes"
            />
            <Button onClick={handleSetFocusTime} variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-1 sm:mr-2"/> Set
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 pt-4">
        <Button onClick={toggleTimer} variant={isActive ? "secondary" : "default"} size="lg" className="px-6 sm:px-8 w-full sm:w-auto">
          {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
          {isActive ? "Pause" : "Start"}
        </Button>
        <Button onClick={handleResetTimer} variant="outline" size="lg" className="w-full sm:w-auto">
          <RotateCcw className="mr-2 h-5 w-5" /> Reset Current
        </Button>
      </CardFooter>
        <div className="text-center pb-4">
          <Button onClick={handleResetToWorkCycle} variant="link" size="sm" className="text-muted-foreground">
            Reset All to Focus Cycle
          </Button>
        </div>
    </Card>
  );
}
