import { useState } from "react";
import {
  useListFines,
  usePayFine,
  getListFinesQueryKey,
  ListFinesStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle } from "lucide-react";

type StatusFilter = "all" | "unpaid" | "paid";

function statusBadge(status: string) {
  if (status === "paid") return <Badge className="bg-green-100 text-green-700 border-green-200 font-normal">Paid</Badge>;
  if (status === "unpaid") return <Badge variant="destructive">Unpaid</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function Fines() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const listStatus = statusFilter === "all" ? undefined : ListFinesStatus[statusFilter];
  const params = { status: listStatus };

  const { data: res, isLoading } = useListFines(params, {
    query: { queryKey: getListFinesQueryKey(params) },
  });

  const payMutation = usePayFine({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listFines"] });
        toast({ title: "Fine marked as paid" });
      },
      onError: () => toast({ title: "Failed to process payment", variant: "destructive" }),
    },
  });

  const fines = res?.data ?? [];
  const totalUnpaid = fines
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + Number(f.amount), 0);
  const totalPaid = fines
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Fines Management</h1>
        <p className="text-muted-foreground mt-1">Track and process overdue fines</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Outstanding Fines</p>
            <p className="text-3xl font-bold text-destructive mt-1">${totalUnpaid.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fines.filter((f) => f.status === "unpaid").length} unpaid records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Collected This Month</p>
            <p className="text-3xl font-bold text-green-600 mt-1">${totalPaid.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fines.filter((f) => f.status === "paid").length} paid records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Fines Issued</p>
            <p className="text-3xl font-bold mt-1">{fines.length}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Member</TableHead>
              <TableHead>Book</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Paid On</TableHead>
              <TableHead>Status</TableHead>
              {user?.role !== "student" && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading fines…</TableCell>
              </TableRow>
            ) : fines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CreditCard className="h-8 w-8 mb-2 opacity-20" />
                    <p>No fines found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              fines.map((f) => (
                <TableRow key={f.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-sm">{(f as any).user?.name ?? `User #${f.userId}`}</TableCell>
                  <TableCell className="text-sm max-w-[180px]">
                    <span className="line-clamp-1">{(f as any).borrowRecord?.book?.title ?? `Record #${f.borrowRecordId}`}</span>
                  </TableCell>
                  <TableCell className="font-semibold">${Number(f.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.paidAt ? new Date(f.paidAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>{statusBadge(f.status)}</TableCell>
                  {user?.role !== "student" && (
                    <TableCell className="text-right">
                      {f.status === "unpaid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={payMutation.isPending}
                          onClick={() => payMutation.mutate({ id: f.id })}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Mark Paid
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
