
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, UserProfile, GuestProfile, TaskPriority } from "@/types";
import { AppHeader } from "@/components/layout/Header";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { XPBar } from "@/components/user/XPBar";
import { OmnitrixTimer } from "@/components/timer/OmnitrixTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { preloadSounds, playCompleteSound, playLevelUpSound, playClickSound, playTransformSound } from "@/lib/soundUtils";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { LogIn, Info, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthModal } from "@/components/auth/AuthModal";

const XP_LEVEL_BASE = 50;
const XP_LEVEL_FACTOR = 1.5;

const XP_FOR_PRIORITY: Record<TaskPriority, number> = {
  low: 5,
  medium: 10,
  high: 15,
};
const DEFAULT_XP_FOR_OLD_TASKS = 10;


const GUEST_TASKS_KEY = "heroicTasks_guestTasks";
const GUEST_PROFILE_KEY = "heroicTasks_guestProfile";

const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export default function HeroicTasksPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [isGuestActive, setIsGuestActive] = useState(false);
  const [guestTasks, setGuestTasks] = useState<Task[]>([]);
  const [guestProfile, setGuestProfile] = useState<GuestProfile>({ xp: 0, level: 1 });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toast } = useToast();

  const handleEnterGuestMode = useCallback(() => {
    if (currentUser) return;
    playClickSound();
    setIsGuestActive(true);
    toast({ title: "Guest Mode Activated", description: "Your progress in guest mode is saved locally." });
  }, [currentUser, toast]);

  const handleExitGuestMode = useCallback(() => {
    setIsGuestActive(false);
  }, []);

  const loadGuestData = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedTasks = localStorage.getItem(GUEST_TASKS_KEY);
      if (storedTasks) {
        setGuestTasks(JSON.parse(storedTasks));
      }
      const storedProfile = localStorage.getItem(GUEST_PROFILE_KEY);
      if (storedProfile) {
        setGuestProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error("Error loading guest data from localStorage:", error);
      toast({ title: "Error", description: "Could not load guest data.", variant: "destructive" });
    }
  }, [toast]);

  const saveGuestTasks = useCallback((currentGuestTasks: Task[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(currentGuestTasks));
    } catch (error) {
      console.error("Error saving guest tasks to localStorage:", error);
    }
  }, []);

  const saveGuestProfile = useCallback((currentGuestProfile: GuestProfile) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(currentGuestProfile));
    } catch (error) {
      console.error("Error saving guest profile to localStorage:", error);
    }
  }, []);

  useEffect(() => {
    if (isGuestActive && isMounted) {
      saveGuestTasks(guestTasks);
    }
  }, [guestTasks, isGuestActive, isMounted, saveGuestTasks]);

  useEffect(() => {
    if (isGuestActive && isMounted) {
      saveGuestProfile(guestProfile);
    }
  }, [guestProfile, isGuestActive, isMounted, saveGuestProfile]);

  useEffect(() => {
    setIsMounted(true);
    preloadSounds();

    if (isGuestActive) {
      loadGuestData();
      setIsLoading(false);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsGuestActive(false);
        setIsLoading(true);
        if (!db) {
          console.error("Firestore (db) is not initialized. Check Firebase config.");
          setIsLoading(false);
          toast({ title: "Database Error", description: "Could not connect to the database.", variant: "destructive" });
          return;
        }
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile({ ...userSnap.data(), uid: user.uid } as UserProfile);
        } else {
          const newProfileData: Omit<UserProfile, 'uid'> = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            xp: 0,
            level: 1,
            createdAt: serverTimestamp() as Timestamp,
            lastLogin: serverTimestamp() as Timestamp,
          };
          await setDoc(userRef, newProfileData);
          setUserProfile({ ...newProfileData, uid: user.uid } as UserProfile);
        }
      } else {
        setUserProfile(null);
        setTasks([]);
        if (!isGuestActive) {
            setIsLoading(false);
        }
      }
    });
    return () => unsubscribeAuth();
  }, [toast, isGuestActive, loadGuestData]);

  useEffect(() => {
    if (currentUser?.uid && !isGuestActive) {
      setIsLoading(true);
      if (!db) {
        console.error("Firestore (db) is not initialized. Cannot fetch tasks.");
        setIsLoading(false);
        toast({ title: "Database Error", description: "Could not fetch tasks due to database connection issue.", variant: "destructive" });
        return;
      }
      const tasksColRef = collection(db, "users", currentUser.uid, "tasks");
      const q = query(tasksColRef, orderBy("createdAt", "desc"));

      const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Task));
        setTasks(fetchedTasks);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching Firestore tasks:", error);
        toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
        setIsLoading(false);
      });
      return () => unsubscribeTasks();
    } else if (!currentUser && !isGuestActive) {
      setTasks([]);
      setIsLoading(false);
    }
  }, [currentUser, toast, isGuestActive]);

  useEffect(() => {
    if (isGuestActive && isMounted) {
      loadGuestData();
      setIsLoading(false);
    }
  }, [isGuestActive, isMounted, loadGuestData]);


  const calculateXpToNextLevel = useCallback((level: number) => {
    return Math.floor(XP_LEVEL_BASE * Math.pow(XP_LEVEL_FACTOR, level - 1));
  }, []);

  const addXP = useCallback(async (amount: number) => {
    if (amount <= 0) return;

    if (isGuestActive) {
      let newXP = guestProfile.xp + amount;
      let newLevel = guestProfile.level;
      let xpToNext = calculateXpToNextLevel(newLevel);
      let levelUpOccurred = false;

      while (newXP >= xpToNext) {
        newXP -= xpToNext;
        newLevel++;
        xpToNext = calculateXpToNextLevel(newLevel);
        levelUpOccurred = true;
      }
      setGuestProfile({ xp: newXP, level: newLevel });
      if (levelUpOccurred) {
        playLevelUpSound();
        toast({
          title: "LEVEL UP (Guest)!",
          description: `You've reached Level ${newLevel}! Keep up the heroic work!`,
        });
      }
    } else if (currentUser && userProfile) {
      if (!db) {
        console.error("Firestore (db) is not initialized. Cannot update XP.");
        toast({ title: "Database Error", description: "Failed to update your XP due to database connection issue.", variant: "destructive" });
        return;
      }
      const userRef = doc(db, "users", currentUser.uid);
      let newXP = userProfile.xp + amount;
      let newLevel = userProfile.level;
      let xpToNext = calculateXpToNextLevel(newLevel);
      let levelUpOccurred = false;

      while (newXP >= xpToNext) {
        newXP -= xpToNext;
        newLevel++;
        xpToNext = calculateXpToNextLevel(newLevel);
        levelUpOccurred = true;
      }
      try {
        await updateDoc(userRef, { xp: newXP, level: newLevel, lastLogin: serverTimestamp() });
        setUserProfile(prev => prev ? { ...prev, xp: newXP, level: newLevel } : null);
        if (levelUpOccurred) {
          playLevelUpSound();
          toast({
            title: "LEVEL UP!",
            description: `You've reached Level ${newLevel}! Keep up the heroic work!`,
          });
        }
      } catch (error) {
        console.error("Error updating XP/Level in Firestore:", error);
        toast({ title: "Error", description: "Failed to update your XP.", variant: "destructive" });
      }
    }
  }, [currentUser, userProfile, isGuestActive, guestProfile, toast, calculateXpToNextLevel]);

  const handleAddTask = async (newTaskData: Omit<Task, "id" | "completed" | "createdAt" | "userId" | "xpEarned" | "xpAwardedAt">) => {
    playTransformSound();
    const xpToAward = XP_FOR_PRIORITY[newTaskData.priority || 'low'];

    if (isGuestActive) {
      const taskToAdd: Task = {
        ...newTaskData,
        id: generateLocalId(),
        completed: false,
        createdAt: Date.now(),
        xpEarned: xpToAward,
        xpAwardedAt: null, // Initialize xpAwardedAt
      };
      setGuestTasks(prev => [taskToAdd, ...prev]);
      toast({ title: "Task Added (Guest)!", description: `"${newTaskData.title}" is ready.`, className: "bg-primary text-primary-foreground" });
    } else if (currentUser) {
      if (!db) {
        console.error("Firestore (db) is not initialized. Cannot add task.");
        toast({ title: "Database Error", description: "Could not add task due to database connection issue.", variant: "destructive" });
        return;
      }
      const taskToAdd: Omit<Task, "id"> = {
        ...newTaskData,
        userId: currentUser.uid,
        completed: false,
        createdAt: serverTimestamp() as Timestamp,
        xpEarned: xpToAward,
        xpAwardedAt: null, // Initialize xpAwardedAt
      };
      try {
        const tasksColRef = collection(db, "users", currentUser.uid, "tasks");
        await addDoc(tasksColRef, taskToAdd);
        toast({ title: "Task Added!", description: `"${newTaskData.title}" is ready.`, className: "bg-primary text-primary-foreground" });
      } catch (error) {
        console.error("Error adding task to Firestore:", error);
        toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
      }
    } else {
      toast({ title: "Not Logged In", description: "Please log in or continue as guest to add tasks.", variant: "destructive" });
      setIsAuthModalOpen(true);
    }
  };

  const handleToggleComplete = async (id: string) => {
    if (isGuestActive) {
      const taskIndex = guestTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return;

      const oldTask = guestTasks[taskIndex];
      const newCompletedStatus = !oldTask.completed;
      let newXpAwardedAt = oldTask.xpAwardedAt;

      const updatedTasks = guestTasks.map(t =>
        t.id === id ? { ...t, completed: newCompletedStatus, xpAwardedAt: newXpAwardedAt } : t
      );

      if (newCompletedStatus && !oldTask.xpAwardedAt) {
        const xpGained = oldTask.xpEarned || DEFAULT_XP_FOR_OLD_TASKS;
        addXP(xpGained);
        newXpAwardedAt = Date.now();
        updatedTasks[taskIndex].xpAwardedAt = newXpAwardedAt; // Update in the mapped array
        playCompleteSound();
        toast({ title: "Mission Accomplished (Guest)!", description: `+${xpGained} XP.`, className: "bg-accent text-accent-foreground" });
      }
      setGuestTasks(updatedTasks);

    } else if (currentUser) {
      if (!db) {
        console.error("Firestore (db) is not initialized. Cannot toggle task.");
        toast({ title: "Database Error", description: "Could not update task due to database connection issue.", variant: "destructive" });
        return;
      }
      const taskRef = doc(db, "users", currentUser.uid, "tasks", id);
      const taskToUpdate = tasks.find(t => t.id === id);

      if (!taskToUpdate) return;

      const newCompletedStatus = !taskToUpdate.completed;
      const updateData: { completed: boolean; xpAwardedAt?: Timestamp } = { completed: newCompletedStatus };
      let awardedXpThisToggle = false;

      if (newCompletedStatus && !taskToUpdate.xpAwardedAt) {
        const xpGained = taskToUpdate.xpEarned || DEFAULT_XP_FOR_OLD_TASKS;
        addXP(xpGained);
        updateData.xpAwardedAt = serverTimestamp() as Timestamp;
        awardedXpThisToggle = true;
        playCompleteSound();
        toast({ title: "Mission Accomplished!", description: `+${xpGained} XP.`, className: "bg-accent text-accent-foreground" });
      }

      try {
        await updateDoc(taskRef, updateData);
        // If XP wasn't awarded but task was completed (e.g. already awarded), still play sound if appropriate
        if (newCompletedStatus && !awardedXpThisToggle && !taskToUpdate.completed) {
            playCompleteSound(); // Play sound if it's a fresh completion, even if XP was already awarded prior
        }
      } catch (error) {
        console.error("Error toggling task in Firestore:", error);
        toast({ title: "Error", description: "Could not update task status.", variant: "destructive" });
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    playClickSound();
    let taskTitle = "Task";
    if (isGuestActive) {
      const taskToDelete = guestTasks.find(t => t.id === id);
      if (taskToDelete) taskTitle = taskToDelete.title;
      setGuestTasks(prevTasks => prevTasks.filter(t => t.id !== id));
      toast({ title: "Task Removed (Guest)", description: `"${taskTitle}" has been cleared.`, variant: "destructive" });
    } else if (currentUser) {
      if (!db) {
        console.error("Firestore (db) is not initialized. Cannot delete task.");
        toast({ title: "Database Error", description: "Could not delete task due to database connection issue.", variant: "destructive" });
        return;
      }
      const taskToDelete = tasks.find(t => t.id === id);
      if (taskToDelete) taskTitle = taskToDelete.title;
      const taskRef = doc(db, "users", currentUser.uid, "tasks", id);
      try {
        await deleteDoc(taskRef);
        toast({ title: "Task Removed", description: `"${taskTitle}" has been cleared.`, variant: "destructive" });
      } catch (error) {
        console.error("Error deleting task from Firestore:", error);
        toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
      }
    }
  };

  const handleEditTask = async (updatedTaskData: Task) => {
    // Retain existing xpAwardedAt status when editing
    const originalTask = (isGuestActive ? guestTasks : tasks).find(t => t.id === updatedTaskData.id);
    const taskWithRetainedXpStatus = {
      ...updatedTaskData,
      xpAwardedAt: originalTask?.xpAwardedAt
    };

    if (isGuestActive) {
      setGuestTasks(prevTasks => prevTasks.map(t => t.id === taskWithRetainedXpStatus.id ? taskWithRetainedXpStatus : t));
      setEditingTask(null);
      toast({ title: "Task Updated (Guest)!", description: `"${taskWithRetainedXpStatus.title}" modified.` });
    } else if (currentUser) {
      if (!db) {
        console.error("Firestore (db) is not initialized. Cannot edit task.");
        toast({ title: "Database Error", description: "Could not edit task due to database connection issue.", variant: "destructive" });
        return;
      }
      const { id, userId, createdAt, xpEarned, xpAwardedAt, ...dataToUpdate } = taskWithRetainedXpStatus;
      const taskRef = doc(db, "users", currentUser.uid, "tasks", id);
      try {
        // Ensure xpAwardedAt is explicitly part of dataToUpdate if it exists, otherwise Firestore might remove it if not set
        const finalDataToUpdate = { ...dataToUpdate, ...(xpAwardedAt !== undefined && { xpAwardedAt })};
        await updateDoc(taskRef, finalDataToUpdate);
        setEditingTask(null);
        toast({ title: "Task Updated!", description: `"${taskWithRetainedXpStatus.title}" modified.` });
      } catch (error) {
        console.error("Error editing task in Firestore:", error);
        toast({ title: "Error", description: "Could not edit task.", variant: "destructive" });
      }
    }
  };

  const openEditModal = (task: Task) => {
    playClickSound();
    setEditingTask(task);
  }
  const closeEditModal = () => setEditingTask(null);

  const currentProfileToDisplay = isGuestActive ? { uid: "guest", xp: guestProfile.xp, level: guestProfile.level, displayName: "Guest Hero", photoURL: null } : userProfile;
  const currentTasksToDisplay = isGuestActive ? guestTasks : tasks;
  const currentXP = currentProfileToDisplay?.xp ?? 0;
  const currentLevel = currentProfileToDisplay?.level ?? 1;

  let pageContent;

  if (!isMounted || (isLoading && (currentUser || (isGuestActive && !guestTasks.length)))) {
    pageContent = (
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center p-10 text-lg font-semibold flex flex-col items-center">
            <RotateCw className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-spin mb-3" />
            <span className="text-sm sm:text-base">Loading Heroic Data...</span>
        </div>
      </main>
    );
  } else if (!currentUser && !isGuestActive) {
    pageContent = (
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <Card className="p-6 sm:p-8 text-center shadow-xl max-w-md w-full">
          <CardContent className="p-0">
            <LogIn className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-headline mb-2">Welcome, Hero!</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">Login or Sign Up to save your missions. Or, try Guest Mode to start immediately!</p>
          </CardContent>
        </Card>
      </main>
    );
  } else {
    pageContent = (
      <main className="flex-grow container mx-auto px-4 py-8">
        {isGuestActive && (
          <Alert variant="default" className="mb-6 bg-accent/10 border-accent/30">
            <Info className="h-5 w-5 text-accent" />
            <AlertTitle className="text-accent font-semibold text-sm sm:text-base">Guest Mode Active</AlertTitle>
            <AlertDescription className="text-accent/80 text-xs sm:text-sm">
              Your tasks and progress are saved locally. For permanent storage, please
              <Button variant="link" onClick={() => { playClickSound(); setIsAuthModalOpen(true); }} className="p-0 h-auto ml-1 text-accent underline text-xs sm:text-sm">
                Log In or Sign Up
              </Button>.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-1 space-y-6 lg:space-y-8">
            <OmnitrixTimer />
            {(userProfile || isGuestActive) && currentProfileToDisplay && (
              <XPBar
                currentXP={currentXP}
                xpToNextLevel={calculateXpToNextLevel(currentLevel)}
                level={currentLevel}
                userName={currentProfileToDisplay.displayName || (currentProfileToDisplay as UserProfile)?.email?.split('@')[0] || "Hero"}
                photoURL={currentProfileToDisplay.photoURL}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-2xl sm:text-3xl font-headline font-bold mb-4 sm:mb-6 text-center text-primary">Your Missions</h2>
                <TaskForm
                  onAddTask={handleAddTask}
                  editingTask={editingTask}
                  onEditTask={handleEditTask}
                  onDoneEditing={closeEditModal}
                />
                <Separator className="my-4 sm:my-6" />
                <TaskList
                  tasks={currentTasksToDisplay}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={openEditModal}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        isGuestActive={isGuestActive}
        onEnterGuestMode={handleEnterGuestMode}
        onExitGuestMode={handleExitGuestMode}
        onAuthModalOpen={() => { playClickSound(); setIsAuthModalOpen(true);}}
      />
      {pageContent}
      <footer className="text-center py-4 text-xs sm:text-sm text-muted-foreground border-t border-border/40">
        Built with 💚 by HEMANTH S.P
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && closeEditModal()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Mission: {editingTask.title}</DialogTitle>
              <DialogDescription>
                Make changes to your task below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              editingTask={editingTask}
              onEditTask={handleEditTask}
              onAddTask={() => {}} // This is fine as TaskForm won't call onAddTask when editingTask is present
              onDoneEditing={closeEditModal}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
