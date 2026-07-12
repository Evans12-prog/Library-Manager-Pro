import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BellOff, AlertCircle, Info, CreditCard, Calendar, Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function NotificationIcon({ type }: { type: string | undefined }) {
  if (type === "overdue_alert") return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (type === "fine_issued") return <CreditCard className="h-4 w-4 text-orange-500" />;
  if (type === "reservation_ready") return <Calendar className="h-4 w-4 text-blue-500" />;
  if (type === "due_reminder") return <Bell className="h-4 w-4 text-yellow-500" />;
  return <Info className="h-4 w-4 text-muted-foreground" />;
}

function typeBadge(type: string | undefined) {
  const labels: Record<string, string> = {
    overdue_alert: "Overdue",
    fine_issued: "Fine",
    reservation_ready: "Reservation",
    due_reminder: "Reminder",
    general: "General",
  };
  return <Badge variant="outline" className="text-xs font-normal">{(type && labels[type]) ?? type ?? "General"}</Badge>;
}

export default function Notifications() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useListNotifications(
    {},
    { query: { queryKey: getListNotificationsQueryKey({}) } },
  );

  const markRead = useMarkNotificationRead({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["listNotifications"] }),
      onError: () => toast({ title: "Failed to mark as read", variant: "destructive" }),
    },
  });

  const markAll = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listNotifications"] });
        toast({ title: "All notifications marked as read" });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <BellOff className="h-10 w-10 mb-3 opacity-20" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border bg-card transition-colors",
                !n.isRead && "border-primary/30 bg-primary/5",
              )}
            >
              <div className="mt-0.5 p-2 rounded-full bg-muted shrink-0">
                <NotificationIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn("font-medium text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                  {typeBadge(n.type)}
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary inline-block" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-xs"
                  onClick={() => markRead.mutate({ id: n.id })}
                  disabled={markRead.isPending}
                >
                  Dismiss
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
