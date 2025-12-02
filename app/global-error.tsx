'use client';

import { PageErrorFallback } from '@/components/ui/ErrorBoundary';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <PageErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}
