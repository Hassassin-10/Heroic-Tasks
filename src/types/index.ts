
import type { Timestamp } from "firebase/firestore";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  userId?: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp | string | number;
  dueDate?: string;
  priority?: TaskPriority;
  time?: string;
  xpEarned: number;
  xpAwardedAt?: Timestamp | number | null; // Added to track if XP has been awarded
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  xp: number;
  level: number;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
}

export interface GuestProfile {
  xp: number;
  level: number;
}
