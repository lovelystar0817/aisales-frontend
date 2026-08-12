import React from 'react';

export const SessionCardSkeleton = () => (
  <div className="grid grid-cols-2 w-full items-start space-y-6 rounded-2xl bg-white p-4 lg:w-[300px] animate-pulse">
    {/* Header with score circles */}
    <div className="flex w-full items-start space-x-6 col-span-2 md:col-span-1 lg:col-span-2">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-700 animate-pulse"></div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-1/2"></div>
      </div>
    </div>

    {/* Score indicators */}
    <ul className="flex flex-col space-y-4 col-span-2">
      {[1, 2, 3].map((i) => (
        <li key={i} className="flex items-center space-x-3">
          <div className="w-1 h-10 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-3/4 mb-2"></div>
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-1/2"></div>
          </div>
        </li>
      ))}
    </ul>

    {/* Practice info */}
    <section className="space-y-3 col-span-2">
      <div className="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-1/3 mb-2"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex">
          <div className="w-24 h-3 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className="ml-3 h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-1/2"></div>
        </div>
      ))}
    </section>

    {/* Action buttons */}
    <footer className="flex w-full flex-col space-y-3 col-span-2">
      <div className="h-10 bg-gray-200 rounded-full dark:bg-gray-700"></div>
      <div className="h-10 bg-gray-100 rounded-full dark:bg-gray-800"></div>
    </footer>
  </div>
);

export default SessionCardSkeleton;
