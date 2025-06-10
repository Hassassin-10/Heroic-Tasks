
"use client";

import type { Task } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, CalendarDays, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow, parseISO, fromUnixTime, isValid } from 'date-fns';
import { Timestamp } from "firebase/firestore";


interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskItem({ task, onToggleComplete, onDelete, onEdit }: TaskItemProps) {

  const handleEditClick = () => {
    onEdit(task);
  };

  const handleDeleteClick = () => {
    onDelete(task.id);
  };

  const formatTaskTime = (timeString?: string, dateString?: string) => { // dateString is yyyy-MM-dd
    if (!timeString) return '';
    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) return '';

    let baseDate: Date;
    if (dateString) { // dateString is 'yyyy-MM-dd'
      const fullDateTimeString = `${dateString}T${timeString}`; // e.g., "2023-11-25T14:30"
      baseDate = parseISO(fullDateTimeString);
    } else {
      // If no dateString, create a date object for today to set the time on
      baseDate = new Date();
      baseDate.setHours(hours);
      baseDate.setMinutes(minutes);
      baseDate.setSeconds(0);
      baseDate.setMilliseconds(0);
    }

    return isValid(baseDate) ? format(baseDate, 'p') : ''; // 'p' is like h:mm aa (e.g., 5:00 PM)
  };


  const formatDateDistance = (dateInput?: string | Timestamp | number): string => {
    if (!dateInput) return '';
    try {
      let date: Date;
      if (typeof dateInput === 'string') {
        const parsedDate = parseISO(dateInput);
        if (isValid(parsedDate)) {
          date = parsedDate;
        } else {
          const parts = dateInput.split('-');
          if (parts.length === 3) {
            date = new Date(parseInt(parts[0],10), parseInt(parts[1],10) -1, parseInt(parts[2],10));
            if (!isValid(date)) return "Invalid date";
          } else {
             return "Invalid date string";
          }
        }
      } else if (dateInput instanceof Timestamp) {
        date = dateInput.toDate();
      } else if (typeof dateInput === 'number') {
        date = fromUnixTime(dateInput / 1000);
      } else {
        return 'Invalid date type';
      }

      if (!isValid(date)) return "Invalid date";

      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn("Error formatting date:", dateInput, error);
      return "Invalid date";
    }
  };

  const formattedTimeOnly = formatTaskTime(task.time); // Time if no date
  const formattedTimeWithDate = formatTaskTime(task.time, task.dueDate); // Time potentially combined with date logic
  const formattedDueDateOnly = task.dueDate ? formatDateDistance(task.dueDate) : '';


  return (
    <Card className={`mb-2 sm:mb-3 transition-all duration-300 ease-in-out hover:shadow-lg ${task.completed ? "bg-card/60 opacity-70" : "bg-card"}`}>
      <CardContent className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-3 sm:gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            aria-labelledby={`task-label-${task.id}`}
            className="transform scale-100 sm:scale-110 mt-1 sm:mt-0 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <label
              htmlFor={`task-${task.id}`}
              id={`task-label-${task.id}`}
              className={`font-medium cursor-pointer text-sm sm:text-base break-words ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
            >
              {task.title}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-1">
              {task.dueDate && (
                <div className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
                  Due: {formattedDueDateOnly}
                  {task.time && formattedTimeWithDate && (`, ${formattedTimeWithDate}`)}
                </div>
              )}
              {!task.dueDate && task.time && formattedTimeOnly && (
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                  Time: {formattedTimeOnly}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 self-end sm:self-center">
          {task.priority && (
            <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"} className="capitalize text-xs px-2 py-0.5">
              {task.priority}
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={handleEditClick} aria-label="Edit task" className="h-8 w-8 sm:h-9 sm:w-9">
            <Edit3 className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDeleteClick} aria-label="Delete task" className="h-8 w-8 sm:h-9 sm:w-9">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
