import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-20 w-full rounded-xl" />
      <section className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-[420px] lg:col-span-3" />
        <Skeleton className="h-[420px] lg:col-span-2" />
      </section>
    </main>
  );
}

