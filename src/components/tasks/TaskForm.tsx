
"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Task, TaskPriority } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PlusCircle, Save } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { playClickSound } from "@/lib/soundUtils";

interface TaskFormProps {
  onAddTask: (task: Omit<Task, "id" | "completed" | "createdAt" | "userId" | "xpEarned">) => void;
  onEditTask?: (task: Task) => void;
  editingTask?: Task | null;
  onDoneEditing?: () => void;
}

export function TaskForm({ onAddTask, onEditTask, editingTask, onDoneEditing }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>("low");
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      if (editingTask.dueDate && typeof editingTask.dueDate === 'string') {
        const parsedDate = parseISO(editingTask.dueDate);
        if (isValid(parsedDate)) {
          setDueDate(parsedDate);
        } else {
          setDueDate(undefined);
        }
      } else if (editingTask.dueDate instanceof Date && isValid(editingTask.dueDate)) {
         setDueDate(editingTask.dueDate);
      }
      else {
        setDueDate(undefined);
      }
      setPriority(editingTask.priority || "low");
      setTime(editingTask.time || "");
    } else {
      setTitle("");
      setDueDate(undefined);
      setPriority("low");
      setTime("");
    }
  }, [editingTask]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    playClickSound();

    const formattedDueDate = dueDate ? format(dueDate, "yyyy-MM-dd") : undefined;

    const taskDataPayload = {
      title,
      dueDate: formattedDueDate,
      priority,
      time: time || undefined
    };

    if (editingTask && onEditTask) {
      const fullUpdatedTask: Task = {
        ...editingTask,
        title: taskDataPayload.title,
        dueDate: taskDataPayload.dueDate,
        priority: taskDataPayload.priority,
        time: taskDataPayload.time,
      };
      onEditTask(fullUpdatedTask);
    } else {
      onAddTask(taskDataPayload);
      setTitle("");
      setDueDate(undefined);
      setPriority("low");
      setTime("");
    }
  };

  const handleCancelEditing = () => {
    playClickSound();
    if (onDoneEditing) {
      onDoneEditing();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-card rounded-lg shadow">
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Enter new task, e.g., Defeat Vilgax"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-base"
          aria-label="Task title"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">Due Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  onClick={playClickSound}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate && isValid(dueDate) ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => setDueDate(date instanceof Date ? date : undefined)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">Time</span>
             <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="text-base"
                aria-label="Task time"
              />
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">Priority</span>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as TaskPriority)}
            >
              <SelectTrigger className="w-full" aria-label="Task priority" onClick={playClickSound}>
                <SelectValue placeholder="Set priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low" onClick={playClickSound}>Low</SelectItem>
                <SelectItem value="medium" onClick={playClickSound}>Medium</SelectItem>
                <SelectItem value="high" onClick={playClickSound}>High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {editingTask && onDoneEditing && (
              <Button type="button" variant="outline" onClick={handleCancelEditing} className="w-full sm:w-auto">
                Cancel
              </Button>
            )}
          <Button type="submit" className="w-full sm:w-auto flex-grow sm:flex-grow-0">
            {editingTask ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {editingTask ? "Save Changes" : "Add Task"}
          </Button>
        </div>
      </div>
    </form>
  );
}
