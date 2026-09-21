import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/context/AuthContext';

interface LogEntry {
  _id: string;
  level: number;
  type: string;
  text: string;
  timeStamp?: string;
  createdAt?: string;
}

interface LogsPage {
  total: number;
  limit: number;
  skip: number;
  data: LogEntry[];
}

const PAGE_SIZE = 25;

// Syslog severities: lower number = more severe (0 Emergency ... 7 Debug)
const LEVELS = ['Emergency', 'Alert', 'Critical', 'Error', 'Warning', 'Notice', 'Info', 'Debug'];

function levelClassName(level: number) {
  if (level <= 3) return 'bg-red-100 text-red-700';
  if (level === 4) return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '—';
}

export default function Dashboard() {
  const { token, logout } = useAuth();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setIsLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        '$sort[createdAt]': '-1',
        '$limit': String(PAGE_SIZE),
        '$skip': String(skip),
      });
      const response = await fetch(`/api/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        setLoadError(`Logy sa nepodarilo načítať (chyba ${response.status}).`);
        return;
      }

      const page: LogsPage = await response.json();
      setLogs(page.data);
      setTotal(page.total);
      setLoadError('');
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLoadError('Server je nedostupný. Skúste to znova o chvíľu.');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [token, logout, skip]);

  // Load logs when token is available
  useEffect(() => {
    fetchLogs();

    // Obnova každých 10 sekúnd pre "kvázi-live" pocit
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const pageStart = total === 0 ? 0 : skip + 1;
  const pageEnd = Math.min(skip + PAGE_SIZE, total);

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
              <CardDescription>Najnovšie logy ako prvé.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoadingLogs}>
              {isLoadingLogs ? "Načítavam..." : "Obnoviť"}
            </Button>
          </CardHeader>
          <CardContent>
            {loadError && (
              <div role="alert" className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{loadError}</div>
            )}
            {logs.length === 0 && !isLoadingLogs && !loadError ? (
              <div className="text-center p-8 text-slate-500">Zatiaľ žiadne logy v databáze.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Level</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Správa</TableHead>
                    <TableHead className="text-right">Dátum a Čas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: LogEntry) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-medium">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${levelClassName(log.level)}`}>
                          {LEVELS[log.level] ?? `Level ${log.level}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs capitalize ${log.type === 'system' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700 font-mono text-sm max-w-sm truncate" title={log.text}>
                        {log.text}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 text-sm">
                        {formatDate(log.timeStamp || log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-4 text-sm text-slate-600">
                <span>{pageStart}–{pageEnd} z {total}</span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))} disabled={skip === 0 || isLoadingLogs}>
                    Novšie
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSkip(skip + PAGE_SIZE)} disabled={pageEnd >= total || isLoadingLogs}>
                    Staršie
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
