import { useState } from "react";
import { useListBooks, getListBooksQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, SlidersHorizontal, Book as BookIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Books() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  
  const { data: booksResponse, isLoading } = useListBooks(
    { search, page: 1, limit: 20 },
    { query: { queryKey: getListBooksQueryKey({ search, page: 1, limit: 20 }) } }
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Books Catalog</h1>
          <p className="text-muted-foreground mt-1">Manage and search library inventory</p>
        </div>
        
        {user?.role !== 'student' && (
          <Button className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add New Book
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, author, or ISBN..." 
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto h-10">
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Book Info</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead className="text-right">Availability</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center text-muted-foreground">
                    <span className="animate-pulse">Loading catalog...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : booksResponse?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <BookIcon className="h-8 w-8 mb-2 opacity-20" />
                    <p>No books found matching your search.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              booksResponse?.data?.map((book) => (
                <TableRow key={book.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-8 bg-muted rounded shadow-sm overflow-hidden flex-shrink-0">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                            <BookIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground line-clamp-1">{book.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{book.publishedYear} &bull; {book.language || 'EN'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{book.author?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {book.category ? (
                      <Badge variant="secondary" className="font-normal" style={book.category.color ? { backgroundColor: `${book.category.color}20`, color: book.category.color, borderColor: `${book.category.color}40` } : {}}>
                        {book.category.name}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{book.isbn}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={book.availableCopies > 0 ? "default" : "destructive"}>
                        {book.availableCopies} / {book.totalCopies} Available
                      </Badge>
                    </div>
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
