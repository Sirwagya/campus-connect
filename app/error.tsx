'use client';

import { ErrorFallback } from '@/components/ui/ErrorBoundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      <ErrorFallback error={error} onReset={reset} />
    </div>
  );
}
