import { ClockIcon } from 'lucide-react';

export function FeedbackSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-2">
        <ClockIcon className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm text-blue-600">Generating feedback...</span>
      </div>
    </div>
  );
}
