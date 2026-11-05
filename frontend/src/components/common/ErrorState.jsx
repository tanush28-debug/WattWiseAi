import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Failed to load content',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
  isRetrying = false
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-rose-500/5 rounded-2xl border border-rose-500/20">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-midnight-900 mb-1">{title}</h3>
      <p className="text-xs text-midnight-600 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={RefreshCw}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;

