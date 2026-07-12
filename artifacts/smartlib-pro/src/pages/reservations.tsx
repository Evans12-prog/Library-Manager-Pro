import { useState } from "react";
import {
  useListReservations,
  useCancelReservation,
  getListReservationsQueryKey,
  ListReservationsStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Calendar, Search, X } from "lucide-react";

type StatusFilter = "all" | "pending" | "fulfilled" | "cancelled";

function statusBadge(status: string) {
  if (status === "pending") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-normal">Pending</Badge>;
  if (status === "fulfilled") return <Badge className="bg-green-100 text-green-700 border-green-200 font-normal">Fulfilled</Badge>;
  if (status === "cancelled") return <Badge variant="secondary">Cancelled</Badge>;
  if (status === "expired") return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function Reservations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const listStatus = statusFilter === "all" ? undefined : ListReservationsStatus[statusFilter as keyof typeof ListReservationsStatus];
  const params = { status: listStatus };

  const { data: res, isLoading } = useListReservations(params, {
    query: { queryKey: getListReservationsQueryKey(params) },
  });

  const cancelMutation = useCancelReservation({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listReservations"] });
        toast({ title: "Reservation cancelled" });
      },
      onError: () => toast({ title: "Failed to cancel", variant: "destructive" }),
    },
  });

  const records = (res?.data ?? []).filter((r) => {
    if (!search) return true;
    const title = (r as any).book?.title?.toLowerCase() ?? "";
    const name = (r as any).user?.name?.toLowerCase() ?? "";
    return title.includes(search.toLowerCase()) || name.includes(search.toLowerCase());
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Reservations</h1>
        <p className="text-muted-foreground mt-1">Manage book hold requests from members</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by book or member..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Book</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Reserved On</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              {user?.role !== "student" && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading reservations…</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-20" />
                    <p>No reservations found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium max-w-[200px]">
                    <span className="line-clamp-1">{(r as any).book?.title ?? `Book #${r.bookId}`}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(r as any).user?.name ?? `User #${r.userId}`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  {user?.role !== "student" && (
                    <TableCell className="text-right">
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate({ id: r.id })}
                        >
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
