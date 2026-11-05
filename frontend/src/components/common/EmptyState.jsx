import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data available',
  description = 'There are no records found for this view yet.',
  actionLabel,
  onAction,
  actionIcon
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 bg-white/70 rounded-2xl border border-dashed border-ivory-300">
      <div className="w-14 h-14 rounded-2xl bg-ivory-200/60 flex items-center justify-center text-midnight-600 mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-midnight-900 mb-1.5">{title}</h3>
      <p className="text-sm text-midnight-600 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

