import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message: string;
  fullScreen?: boolean;
}

export function LoadingState({ message, fullScreen = false }: LoadingStateProps) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-60 w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center"
    >
      <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-700">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return content;
}
