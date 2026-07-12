import { useState } from "react";
import {
  useListAuthors,
  useListCategories,
  useListPublishers,
  useCreateAuthor,
  useCreateCategory,
  useCreatePublisher,
  getListAuthorsQueryKey,
  getListCategoriesQueryKey,
  getListPublishersQueryKey,
  Author,
  Category,
  Publisher,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pen, Building2, Tag } from "lucide-react";

function AuthorsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const { data: authors = [] } = useListAuthors(
    {},
    { query: { queryKey: getListAuthorsQueryKey({}) } },
  );

  const createAuthor = useCreateAuthor({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listAuthors"] });
        setOpen(false);
        setName(""); setBio("");
        toast({ title: "Author added" });
      },
      onError: () => toast({ title: "Failed to add author", variant: "destructive" }),
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{authors.length} authors in the system</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Author</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Author</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createAuthor.mutate({ data: { name, bio: bio || undefined } }); }} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} required onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Input value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAuthor.isPending}>Add</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(authors as Author[]).map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {a.name.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{a.name}</p>
              {a.bio && <p className="text-xs text-muted-foreground truncate">{a.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [description, setDescription] = useState("");

  const { data: categories = [] } = useListCategories(
    { query: { queryKey: getListCategoriesQueryKey() } },
  );

  const create = useCreateCategory({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listCategories"] });
        setOpen(false);
        setName(""); setDescription("");
        toast({ title: "Category added" });
      },
      onError: () => toast({ title: "Failed to add category", variant: "destructive" }),
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate({ data: { name, color, description: description || undefined } }); }} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} required onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 px-2" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>Add</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-3">
        {(categories as Category[]).map((c) => (
          <Badge
            key={c.id}
            variant="outline"
            className="px-3 py-1.5 text-sm font-normal"
            style={c.color ? { backgroundColor: `${c.color}20`, color: c.color, borderColor: `${c.color}40` } : {}}
          >
            {c.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function PublishersTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", website: "" });

  const { data: publishers = [] } = useListPublishers(
    { query: { queryKey: getListPublishersQueryKey() } },
  );

  const create = useCreatePublisher({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["listPublishers"] });
        setOpen(false);
        setForm({ name: "", address: "", website: "" });
        toast({ title: "Publisher added" });
      },
      onError: () => toast({ title: "Failed to add publisher", variant: "destructive" }),
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{publishers.length} publishers</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Publisher</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Publisher</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate({ data: { name: form.name, address: form.address || undefined, website: form.website || undefined } }); }} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>Add</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(publishers as Publisher[]).map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{p.name}</p>
              {p.website && <p className="text-xs text-muted-foreground truncate">{p.website}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">System Setup</h1>
        <p className="text-muted-foreground mt-1">Manage authors, categories, and publishers</p>
      </div>

      <Tabs defaultValue="authors">
        <TabsList>
          <TabsTrigger value="authors"><Pen className="h-4 w-4 mr-2" />Authors</TabsTrigger>
          <TabsTrigger value="categories"><Tag className="h-4 w-4 mr-2" />Categories</TabsTrigger>
          <TabsTrigger value="publishers"><Building2 className="h-4 w-4 mr-2" />Publishers</TabsTrigger>
        </TabsList>
        <TabsContent value="authors" className="mt-6"><AuthorsTab /></TabsContent>
        <TabsContent value="categories" className="mt-6"><CategoriesTab /></TabsContent>
        <TabsContent value="publishers" className="mt-6"><PublishersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
