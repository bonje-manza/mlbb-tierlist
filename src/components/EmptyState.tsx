import React from 'react';

export interface EmptyStateProps {
  testId: string;
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  testId,
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl bg-cyber-card/40 border border-cyber-border my-3"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
        <span className="text-xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <h2 className="text-sm font-bold text-slate-200 mb-1">{title}</h2>
      <p className="text-xs text-slate-400 mb-4 max-w-xs">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="min-h-[44px] min-w-[44px] px-4 py-2 inline-flex items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-colors active:scale-95"
      >
        {actionLabel}
      </button>
    </div>
  );
};
