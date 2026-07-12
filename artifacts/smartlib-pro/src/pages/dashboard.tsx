import { useGetDashboardStats, useGetBorrowTrend, useGetRecentActivity, useGetCategoryDistribution, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Users, AlertCircle, Library, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() }
  });
  
  // Use empty arrays / objects as fallbacks since we might not have these endpoints working in mock yet
  // In a real app we would use:
  // const { data: trend } = useGetBorrowTrend();
  // const { data: categories } = useGetCategoryDistribution();
  // const { data: activity } = useGetRecentActivity({ limit: 5 });

  const mockTrend = [
    { date: 'Mon', count: 12 }, { date: 'Tue', count: 19 },
    { date: 'Wed', count: 15 }, { date: 'Thu', count: 22 },
    { date: 'Fri', count: 28 }, { date: 'Sat', count: 35 },
    { date: 'Sun', count: 18 },
  ];

  const mockCategories = [
    { name: 'Science', value: 400, color: 'hsl(var(--chart-1))' },
    { name: 'Fiction', value: 300, color: 'hsl(var(--chart-2))' },
    { name: 'History', value: 300, color: 'hsl(var(--chart-3))' },
    { name: 'Art', value: 200, color: 'hsl(var(--chart-4))' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Library Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back to the SmartLib Pro command center.</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Books" value={stats?.totalBooks || 0} icon={Book} trend="+12 this week" />
          <StatCard title="Active Members" value={stats?.totalUsers || 0} icon={Users} trend="+3 this week" />
          <StatCard title="Active Borrows" value={stats?.activeBorrows || 0} icon={Library} />
          <StatCard title="Overdue Books" value={stats?.overdueBooks || 0} icon={AlertCircle} alert={!!stats?.overdueBooks} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium">Borrowing Trends</CardTitle>
              <p className="text-sm text-muted-foreground">Activity over the last 7 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {mockCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {mockCategories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, alert }: { title: string, value: string | number, icon: any, trend?: string, alert?: boolean }) {
  return (
    <Card className={alert ? "border-destructive/50 bg-destructive/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${alert ? "text-destructive" : ""}`}>{value}</div>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}
