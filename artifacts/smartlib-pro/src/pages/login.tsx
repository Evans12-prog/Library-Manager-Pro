import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (res) => {
        setUser(res.user);
        toast({
          title: "Welcome back",
          description: `Successfully logged in as ${res.user.name}.`,
        });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: err?.message || "Invalid credentials. Please try again.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 px-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5 dark:opacity-10 pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10 shadow-xl border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <BookOpen className="h-7 w-7" />
            </div>
          </div>
          <CardTitle className="font-serif text-3xl font-bold tracking-tight">SmartLib Pro</CardTitle>
          <CardDescription className="text-sm">
            Enter your credentials to access the library system
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@smartlib.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-4 pb-8">
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
