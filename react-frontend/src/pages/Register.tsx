import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.status === 409) {
        throw new Error('Účet s týmto e-mailom už existuje.');
      }
      if (response.status === 429) {
        throw new Error('Priveľa registrácií z tejto siete. Skúste to neskôr.');
      }
      if (response.status === 400) {
        throw new Error(`Skontrolujte e-mail a heslo (aspoň ${MIN_PASSWORD_LENGTH} znakov).`);
      }
      if (!response.ok) {
        throw new Error('Registrácia sa nepodarila. Skúste to znova neskôr.');
      }

      // Sign the new user straight in
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: 'local', email, password })
      });
      const data = await authResponse.json().catch(() => ({}));

      if (!authResponse.ok || !data.accessToken) {
        navigate('/login');
        return;
      }

      login(data.accessToken);
      navigate('/');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Neznáma chyba');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <form onSubmit={handleRegister} className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Registrácia</CardTitle>
            <CardDescription>
              Vytvorte si účet do centrálneho logovacieho systému
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && <div role="alert" className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{formError}</div>}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="meno@firma.sk"
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
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-slate-500">Aspoň {MIN_PASSWORD_LENGTH} znakov.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Vytváram účet..." : "Zaregistrovať sa"}
            </Button>
            <p className="text-xs text-slate-500">
              Už máte účet? <Link to="/login" className="underline">Prihláste sa</Link>
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
