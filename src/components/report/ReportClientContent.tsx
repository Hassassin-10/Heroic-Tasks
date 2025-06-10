
// src/components/report/ReportClientContent.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import type { Task, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart as BarChartIconLucide, FileText, LogIn, RotateCw } from 'lucide-react';
import { format, parseISO, fromUnixTime, isValid as isValidDate } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  RechartsPrimitive,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import OmnitrixIcon from '@/components/icons/OmnitrixIcon';
import { playClickSound } from '@/lib/soundUtils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ChartDataItem {
  date: string; // Will store 'YYYY-MM-DD'
  completed: number;
}

export default function ReportClientContent() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchReportData = useCallback(async (user: FirebaseUser) => {
    setIsLoading(true);
    setError(null);
    if (!db) {
      setError("Database not initialized. Please check Firebase configuration.");
      setIsLoading(false);
      toast({ title: "Database Error", description: "Could not connect to the database.", variant: "destructive" });
      return;
    }
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserProfile({ uid: user.uid, ...userSnap.data() } as UserProfile);
      } else {
        setError("User profile not found.");
        setUserProfile(null);
      }

      const tasksColRef = collection(db, "users", user.uid, "tasks");
      const tasksQuery = query(tasksColRef, orderBy("createdAt", "desc"));
      const tasksSnapshot = await getDocs(tasksQuery);
      const fetchedTasks = tasksSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Task));
      setTasks(fetchedTasks);

    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again.");
      toast({ title: "Error", description: "Could not fetch report data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchReportData(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setTasks([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [fetchReportData]);

  const handleRefreshData = () => {
    if (currentUser) {
      playClickSound();
      fetchReportData(currentUser);
      toast({ title: "Data Refreshed", description: "Report data has been updated."});
    }
  }

  const handleExportPDF = async () => {
    playClickSound();
    if (!reportContentRef.current) {
      toast({ title: "Error", description: "Report content not ready.", variant: "destructive"});
      return;
    }

    const html2pdf = (await import('html2pdf.js')).default;
    if (!html2pdf) {
      toast({ title: "Error", description: "PDF export tool could not be loaded.", variant: "destructive"});
      return;
    }

    const element = reportContentRef.current;
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `HeroicTasks_Report_${currentUser?.displayName || currentUser?.uid}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    const pdfHeader = document.createElement('div');
    pdfHeader.className = 'mb-4 p-4 border-b border-border text-center';
    pdfHeader.innerHTML = `
      <div class="flex items-center justify-center mb-2">
        <style> .pdf-omnitrix-icon { height: 2rem; width: 2rem; margin-right: 0.5rem; color: hsl(var(--primary)); } 
        .pdf-omnitrix-icon circle[fill="hsl(var(--primary-foreground))"] { fill: #FFFFFF; }
        .pdf-omnitrix-icon path[fill="hsl(var(--primary-foreground))"] { fill: #000000; }
        </style>
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="pdf-omnitrix-icon" aria-label="Omnitrix Icon">
          <circle cx="100" cy="100" r="95" fill="hsl(var(--primary-foreground))" stroke="currentColor" stroke-width="8"></circle>
          <circle cx="100" cy="100" r="70" fill="currentColor"></circle>
          <path d="M60 60 L90 100 L60 140 L70 150 L100 110 L130 150 L140 140 L110 100 L140 60 L130 50 L100 90 L70 50 Z" fill="hsl(var(--primary-foreground))"></path>
          <circle cx="100" cy="100" r="10" fill="currentColor"></circle>
        </svg>
        <h1 class="text-2xl font-headline font-bold text-primary">Heroic Tasks Report</h1>
      </div>
      <p class="text-sm text-muted-foreground">Exported on: ${format(new Date(), 'PPP p')}</p>
    `;
    clonedElement.insertBefore(pdfHeader, clonedElement.firstChild);
    
    const buttonsToHide = clonedElement.querySelectorAll('.hide-on-pdf');
    buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = 'none');
    
    const isDarkTheme = document.documentElement.classList.contains('dark');
    if (isDarkTheme) {
        clonedElement.style.backgroundColor = 'var(--background-dark-pdf, #1A202C)'; 
        clonedElement.style.color = 'var(--foreground-dark-pdf, #E2E8F0)'; 
    }

    html2pdf().from(clonedElement).set(opt).save();
    toast({ title: "PDF Exported", description: "Your report is being downloaded."});
  };

  const formatDateForDisplay = (dateInput: Timestamp | string | number | undefined, includeTime = false): string => {
    if (!dateInput) return 'N/A';
    let date: Date;
    try {
      if (dateInput instanceof Timestamp) {
        date = dateInput.toDate();
      } else if (typeof dateInput === 'string') {
        date = parseISO(dateInput); 
      } else if (typeof dateInput === 'number') {
        date = fromUnixTime(dateInput / 1000); 
      } else {
        return 'Invalid Date Source';
      }

      if (!isValidDate(date)) { 
          console.warn("formatDateForDisplay resulted in an invalid date from input:", dateInput);
          return 'Invalid Date';
      }
      return format(date, includeTime ? 'PPP p' : 'PPP');
    } catch (e) {
      console.warn("Error in formatDateForDisplay utility:", dateInput, e);
      return "Date Format Error";
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasksCount = tasks.length - completedTasks.length;

  const chartConfig = {
    completed: {
      label: "Tasks Completed",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;
  
  const taskCompletionData: ChartDataItem[] = completedTasks.reduce((acc: ChartDataItem[], task: Task) => {
    if (!task.createdAt) return acc;
    
    let originalDate: Date | null = null;
    try {
      if (task.createdAt instanceof Timestamp) {
        originalDate = task.createdAt.toDate();
      } else if (typeof task.createdAt === 'string') {
        originalDate = parseISO(task.createdAt); 
         if (!isValidDate(originalDate) && /^\d{4}-\d{2}-\d{2}$/.test(task.createdAt)) {
            const parts = task.createdAt.split('-').map(Number);
            originalDate = new Date(parts[0], parts[1] - 1, parts[2]);
        }
      } else if (typeof task.createdAt === 'number') {
        originalDate = fromUnixTime(task.createdAt / 1000);
      }

      if (originalDate && isValidDate(originalDate)) { 
        const dateKey = format(originalDate, 'yyyy-MM-dd'); 
        const existingEntry = acc.find(item => item.date === dateKey);
        if (existingEntry) {
          existingEntry.completed += 1;
        } else {
          acc.push({ date: dateKey, completed: 1 });
        }
      } else {
         console.warn(`Skipping task with invalid createdAt for chart data: ${task.id}`, task.createdAt);
      }
    } catch (e) {
      console.warn("Error processing task createdAt for chart:", task.id, task.createdAt, e);
    }
    return acc;
  }, []).sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });


  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <RotateCw className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-xl text-muted-foreground">Loading Heroic Report...</p>
        </div>
    );
  }

  if (!currentUser) {
    return (
      <Card className="max-w-md mx-auto mt-10 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <LogIn className="h-16 w-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your Heroic Report.
          </p>
          <Button onClick={() => {
            playClickSound();
             window.location.href = '/'; 
          }}>
            Login / Sign Up
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <FileText className="h-4 w-4" />
        <AlertTitle>Error Loading Report</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={handleRefreshData} variant="outline" className="mt-4">
            <RotateCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </Alert>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary flex items-center">
          <BarChartIconLucide className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Your Heroic Report
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleRefreshData} variant="outline" className="hide-on-pdf text-xs sm:text-sm">
            <RotateCw className="mr-1 sm:mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={handleExportPDF} variant="default" className="hide-on-pdf text-xs sm:text-sm">
            <FileText className="mr-1 sm:mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div ref={reportContentRef} className="p-1 md:p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tasks Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{tasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500">{completedTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-500">{pendingTasksCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">XP & Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-accent">
                {userProfile?.xp || 0} XP (Lvl {userProfile?.level || 1})
              </div>
            </CardContent>
          </Card>
        </div>

        {taskCompletionData.length > 0 ? (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-headline">Task Completion Over Time</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Showing tasks completed by creation date.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] sm:h-[320px] md:h-[350px] p-2 sm:p-4 md:p-6">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <RechartsPrimitive.BarChart data={taskCompletionData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <RechartsPrimitive.XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    tickFormatter={(value) => {
                        try {
                            const dateObj = parseISO(value); 
                            if (isValidDate(dateObj)) {
                                return format(dateObj, "MMM d");
                            }
                            return value; 
                        } catch (e) {
                            console.warn("Error formatting tick for XAxis:", value, e);
                            return value; 
                        }
                    }}
                    fontSize="10px" className="sm:text-xs" 
                  />
                  <RechartsPrimitive.YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} fontSize="10px" className="sm:text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} cursorStyle={{ fill: 'hsl(var(--muted))' }} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <RechartsPrimitive.Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                </RechartsPrimitive.BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        ) : (
           <Card className="mb-6 sm:mb-8 text-center py-10">
            <CardHeader><CardTitle className="text-lg sm:text-xl font-headline">Task Completion Chart</CardTitle></CardHeader>
            <CardContent>
                <BarChartIconLucide className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-2"/>
                <p className="text-muted-foreground text-sm sm:text-base">No completed tasks with valid dates to display in the chart yet.</p>
            </CardContent>
           </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-headline">Completed Task Log</CardTitle>
            <CardDescription className="text-xs sm:text-sm">A list of all your accomplished missions.</CardDescription>
          </CardHeader>
          <CardContent>
            {completedTasks.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Task Title</TableHead>
                      <TableHead className="text-xs sm:text-sm">Date Created</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">XP Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">{task.title}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatDateForDisplay(task.createdAt)}</TableCell>
                        <TableCell className="text-right text-accent font-semibold text-xs sm:text-sm">+{task.xpEarned}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2"/>
                <p className="text-sm sm:text-base">No tasks completed yet. Go be a hero!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
