import { useState } from "react";
import {
  useListBorrowRecords,
  useReturnBook,
  useRenewBook,
  getListBorrowRecordsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Library, Search, RotateCcw, RefreshCw } from "lucide-react";

function statusBadge(status: string) {
  if (status === "active") return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-normal">Active</Badge>;
  if (status === "overdue") return <Badge variant="destructive">Overdue</Badge>;
  if (status === "returned") return <Badge variant="secondary">Returned</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function daysLabel(dueDate: string, returnedAt: string | null) {
  if (returnedAt) return null;
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return <span className="text-destructive text-xs font-medium">{Math.abs(diff)}d overdue</span>;
  if (diff === 0) return <span className="text-orange-500 text-xs font-medium">Due today</span>;
  return <span className="text-muted-foreground text-xs">{diff}d left</span>;
}

export default function Borrow() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "overdue" | "returned">("all");

  const params = {
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
    limit: 50,
  };

  const { data: res, isLoading } = useListBorrowRecords(params, {
    query: { queryKey: getListBorrowRecordsQueryKey(params) },
  });

  const returnMutation = useReturnBook({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listBorrowRecords"] });
        toast({ title: "Book returned", description: "Return recorded successfully." });
      },
      onError: () => toast({ title: "Return failed", variant: "destructive" }),
    },
  });

  const renewMutation = useRenewBook({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listBorrowRecords"] });
        toast({ title: "Renewed", description: "Loan period extended by 14 days." });
      },
      onError: () => toast({ title: "Renewal failed", variant: "destructive" }),
    },
  });

  const records = res?.data ?? [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Borrowing Records</h1>
          <p className="text-muted-foreground mt-1">Track all active, overdue and returned loans</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="returned">Returned</TabsTrigger>
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
              <TableHead>Borrowed</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Renewals</TableHead>
              {user?.role !== "student" && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading records…</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Library className="h-8 w-8 mb-2 opacity-20" />
                    <p>No borrow records found.</p>
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
                    {new Date(r.borrowedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">{new Date(r.dueDate).toLocaleDateString()}</span>
                      {daysLabel(r.dueDate, r.returnedAt ?? null)}
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-sm text-center">{r.renewCount ?? 0}</TableCell>
                  {user?.role !== "student" && (
                    <TableCell className="text-right">
                      {r.status !== "returned" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={returnMutation.isPending}
                            onClick={() => returnMutation.mutate({ id: r.id })}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Return
                          </Button>
                          {(r.renewCount ?? 0) < 2 && r.status !== "overdue" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={renewMutation.isPending}
                              onClick={() => renewMutation.mutate({ id: r.id })}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Renew
                            </Button>
                          )}
                        </div>
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
