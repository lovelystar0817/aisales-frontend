export const MSIGOverviewSkeleton = () => {
  return (
    <section id="overview" className="rounded-2xl bg-[#FFFFFF] p-4">
      <div className="animate-pulse">
        {/* Title */}
        <div className="mb-4 h-5 w-1/4 rounded-md bg-gray-200"></div>

        {/* Summary */}
        <div className="mb-4 space-y-2">
          <div className="h-4 w-full rounded-md bg-gray-200"></div>
          <div className="h-4 w-5/6 rounded-md bg-gray-200"></div>
          <div className="h-4 w-3/4 rounded-md bg-gray-200"></div>
        </div>

        {/* Next Steps Title */}
        <div className="mb-2 h-4 w-1/3 rounded-md bg-gray-200"></div>

        {/* Next Steps List */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="h-4 w-4 rounded-full bg-gray-200"></div>
            <div className="h-4 flex-1 rounded-md bg-gray-200"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-4 w-4 rounded-full bg-gray-200"></div>
            <div className="h-4 flex-1 rounded-md bg-gray-200"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
