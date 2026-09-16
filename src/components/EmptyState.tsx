import React from 'react';

export interface EmptyStateProps {
  testId: string;
  icon: React.ReactNode;
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
  const renderVisualIcon = () => {
    if (typeof icon === 'string') {
      if (icon.includes('🔍')) {
        return (
          <>
            <span className="sr-only">{icon}</span>
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </>
        );
      }
      if (icon.includes('🛡️')) {
        return (
          <>
            <span className="sr-only">{icon}</span>
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              />
            </svg>
          </>
        );
      }
      return <span className="text-xl">{icon}</span>;
    }
    return icon;
  };

  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-cyber-card/60 border border-cyber-border my-4 shadow-xs"
    >
      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-400">
        {renderVisualIcon()}
      </div>
      <h2 className="text-sm sm:text-base font-medium text-zinc-200 mb-1 tracking-tight">{title}</h2>
      <p className="text-xs sm:text-sm text-zinc-400 mb-4 max-w-sm leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="min-h-[44px] min-w-[44px] px-4 py-2 inline-flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs sm:text-sm font-medium text-zinc-200 hover:text-white transition-all duration-150 active:scale-95 shadow-xs cursor-pointer"
      >
        {actionLabel}
      </button>
    </div>
  );
};
