
"use client";

import type { Task } from "@/types";
import { TaskItem } from "./TaskItem";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskList({ tasks, onToggleComplete, onDelete, onEdit }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 sm:py-10 text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 lucide lucide-clipboard-check sm:w-12 sm:h-12"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
        <p className="font-medium text-sm sm:text-base">No tasks yet, hero!</p>
        <p className="text-xs sm:text-sm">Add a new task to start your mission.</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <ScrollArea className="h-[calc(100vh-480px)] min-h-[200px] sm:h-[calc(100vh-420px)] md:h-[calc(100vh-380px)] lg:h-[calc(100vh-400px)] pr-2 sm:pr-3">
      {pendingTasks.length > 0 && (
        <>
          <h3 className="text-md sm:text-lg font-semibold mb-2 text-primary">Pending ({pendingTasks.length})</h3>
          {pendingTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </>
      )}

      {completedTasks.length > 0 && (
         <>
          <h3 className="text-md sm:text-lg font-semibold mt-4 sm:mt-6 mb-2 text-muted-foreground">Completed ({completedTasks.length})</h3>
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
        </>
      )}
    </ScrollArea>
  );
}
