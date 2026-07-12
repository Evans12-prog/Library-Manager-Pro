import {
  useListActivityLogs,
  getListActivityLogsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Activity, BookOpen, UserPlus, RotateCcw, RefreshCw, BookMarked, Settings } from "lucide-react";

function ActionIcon({ action }: { action: string }) {
  if (action.includes("borrow")) return <BookOpen className="h-4 w-4 text-blue-500" />;
  if (action.includes("return")) return <RotateCcw className="h-4 w-4 text-green-500" />;
  if (action.includes("renew")) return <RefreshCw className="h-4 w-4 text-yellow-500" />;
  if (action.includes("user")) return <UserPlus className="h-4 w-4 text-purple-500" />;
  if (action.includes("book")) return <BookMarked className="h-4 w-4 text-orange-500" />;
  return <Settings className="h-4 w-4 text-muted-foreground" />;
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    book_borrowed: "Borrowed",
    book_returned: "Returned",
    book_renewed: "Renewed",
    book_added: "Book Added",
    book_updated: "Book Updated",
    book_deleted: "Book Deleted",
    user_created: "User Created",
    user_updated: "User Updated",
    user_deleted: "User Deleted",
    fine_paid: "Fine Paid",
    reservation_created: "Reserved",
    reservation_cancelled: "Cancelled",
  };
  return map[action] ?? action.replace(/_/g, " ");
}

function actionColor(action: string) {
  if (action.includes("borrow")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (action.includes("return")) return "bg-green-100 text-green-700 border-green-200";
  if (action.includes("user")) return "bg-purple-100 text-purple-700 border-purple-200";
  if (action.includes("delete")) return "bg-red-100 text-red-700 border-red-200";
  return "";
}

export default function ActivityLog() {
  const { data: res, isLoading } = useListActivityLogs(
    { page: 1, limit: 100 },
    { query: { queryKey: getListActivityLogsQueryKey({ page: 1, limit: 100 }) } },
  );

  const logs = res?.data ?? [];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Full audit trail of all system activity</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Activity className="h-10 w-10 mb-3 opacity-20" />
          <p>No activity logs yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="mt-0.5 p-2 rounded-full bg-muted shrink-0">
                <ActionIcon action={log.action} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{(log as any).user?.name ?? `User #${log.userId}`}</span>
                  <Badge variant="outline" className={`text-xs font-normal ${actionColor(log.action)}`}>
                    {actionLabel(log.action)}
                  </Badge>
                  {log.entityType && (
                    <Badge variant="outline" className="text-xs font-normal capitalize">{log.entityType}</Badge>
                  )}
                </div>
                {log.details && (
                  <p className="text-sm text-muted-foreground mt-0.5">{log.details}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground/60 shrink-0">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
