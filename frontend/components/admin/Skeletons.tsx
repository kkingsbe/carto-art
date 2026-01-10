import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            <Skeleton className="h-4 w-[100px]" />
                        </CardTitle>
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <Skeleton className="h-8 w-[60px]" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function ActivitySkeleton() {
    return (
        <div className="space-y-8">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="ml-4 space-y-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                    <div className="ml-auto font-medium">
                        <Skeleton className="h-4 w-[50px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}
