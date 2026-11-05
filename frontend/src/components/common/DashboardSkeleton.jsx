import React from 'react';

export const DashboardSkeleton = ({ roleLabel = 'Workspace' }) => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-ivory-300 rounded-md" />
          <div className="h-7 w-64 bg-ivory-300 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-ivory-300 rounded-xl" />
          <div className="h-9 w-32 bg-ivory-300 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-ivory-300 shadow-subtle space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-ivory-200 rounded" />
              <div className="w-8 h-8 rounded-xl bg-ivory-200" />
            </div>
            <div className="h-7 w-32 bg-ivory-300 rounded-lg" />
            <div className="h-3 w-40 bg-ivory-200 rounded" />
          </div>
        ))}
      </div>

      {/* Main Chart Placeholder Skeleton */}
      <div className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-ivory-300 rounded" />
            <div className="h-3 w-72 bg-ivory-200 rounded" />
          </div>
          <div className="h-8 w-24 bg-ivory-200 rounded-xl" />
        </div>

        {/* Simulated Shimmer Wave Bars */}
        <div className="h-64 flex items-end gap-3 pt-6 px-4 border-b border-l border-ivory-200">
          {[40, 65, 50, 80, 60, 75, 90, 85, 70, 60, 55, 65].map((height, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full bg-ivory-200 rounded-t-md"
                style={{ height: `${height}%` }}
              />
              <div className="h-2 w-6 bg-ivory-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-ivory-300 space-y-4">
          <div className="h-4 w-40 bg-ivory-300 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-14 bg-ivory-100 rounded-xl border border-ivory-200" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-ivory-300 space-y-4">
          <div className="h-4 w-36 bg-ivory-300 rounded" />
          <div className="space-y-3">
            {[1, 2].map((k) => (
              <div key={k} className="h-20 bg-ivory-100 rounded-xl border border-ivory-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

