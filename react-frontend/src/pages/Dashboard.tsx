import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/context/AuthContext';

interface LogEntry {
  _id: string;
  level: number;
  type: string;
  message: string | Record<string, unknown>;
  timeStamp?: string;
  createdAt?: string;
}

export default function Dashboard() {
  const { token, logout } = useAuth();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setIsLoadingLogs(true);
    try {
      const response = await fetch('/api/logs?$sort[createdAt]=-1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [token, logout]);

  // Load logs when token is available
  useEffect(() => {
    fetchLogs();

    // Obnova každých 10 sekúnd pre "kvázi-live" pocit
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">Logs Dashboard</h1>
          <Button variant="ghost" onClick={logout}>Odhlásiť sa</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Záznamy systému</CardTitle>
              <CardDescription>Reálne logy vytiahnuté z vašej databázy cez API Bránu.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoadingLogs}>
              {isLoadingLogs ? "Načítavam..." : "Obnoviť"}
            </Button>
          </CardHeader>
          <CardContent>
            {logs.length === 0 && !isLoadingLogs ? (
              <div className="text-center p-8 text-slate-500">Zatiaľ žiadne logy v databáze.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Správa</TableHead>
                    <TableHead className="text-right">Dátum a Čas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: LogEntry) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-medium">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${log.level > 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          Lvl {log.level}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs capitalize ${log.type === 'system' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700 font-mono text-sm max-w-sm truncate" title={JSON.stringify(log.message)}>
                        {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 text-sm">
                        {new Date(log.timeStamp || log.createdAt || '').toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
