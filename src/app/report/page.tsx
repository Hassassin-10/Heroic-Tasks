
// src/app/report/page.tsx
import type { Metadata } from 'next';
import ReportClientContent from '@/components/report/ReportClientContent';

export const metadata: Metadata = {
  title: 'Heroic Tasks Report',
  description: 'Analyze your task completion and progress.',
};

export default function ReportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ReportClientContent />
    </div>
  );
}
