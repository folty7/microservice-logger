import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strategy: 'local',
          email,
          password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Chybné prihlasovacie údaje');
      }
      
      login(data.accessToken);
      navigate('/');
    } catch (err) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Neznáma chyba');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Login</CardTitle>
            <CardDescription>
              Prihláste sa do centrálneho logovacieho systému
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{authError}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                required
                placeholder="admin@startup.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input 
                id="password" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? "Prihlasovanie..." : "Prihlásiť sa"}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  Ostatné možnosti (Zatiaľ len Mockup)
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button type="button" variant="outline" onClick={() => alert('Will redirect to Github OAuth!')}>GitHub</Button>
              <Button type="button" variant="outline" onClick={() => alert('Will redirect to Google OAuth!')}>Google</Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
