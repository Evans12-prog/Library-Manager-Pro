import { useState } from "react";
import {
  useListUsers,
  useCreateUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Users, Search, Plus, Shield } from "lucide-react";

function roleBadge(role: string) {
  if (role === "admin") return <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-normal">Admin</Badge>;
  if (role === "librarian") return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-normal">Librarian</Badge>;
  return <Badge variant="secondary" className="font-normal">Student</Badge>;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", phone: "", studentId: "" });

  const params = { search: search || undefined, page: 1, limit: 50 };
  const { data: res, isLoading } = useListUsers(params, {
    query: { queryKey: getListUsersQueryKey(params) },
  });

  const createUser = useCreateUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listUsers"] });
        setOpen(false);
        setForm({ name: "", email: "", password: "", role: "student", phone: "", studentId: "" });
        toast({ title: "User created successfully" });
      },
      onError: () => toast({ title: "Failed to create user", variant: "destructive" }),
    },
  });

  const users = res?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({
      data: {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as "admin" | "librarian" | "student",
        phone: form.phone || undefined,
        studentId: form.studentId || undefined,
      },
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Members</h1>
          <p className="text-muted-foreground mt-1">Manage library members and staff accounts</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="librarian">Librarian</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={form.password} required onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input id="studentId" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? "Creating…" : "Create Member"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading members…</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-8 w-8 mb-2 opacity-20" />
                    <p>No members found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {u.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{u.studentId ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.phone ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "secondary"} className="font-normal">
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
