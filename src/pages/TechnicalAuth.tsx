import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function TechnicalAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isAuthenticated } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  // Remover redirecionamento automático
  // if (isAuthenticated) {
  //   window.location.href = '/';
  //   return null;
  // }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <Shield className="h-12 w-12 mx-auto text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Você já está autenticado!</h1>
          <p className="text-gray-600 mb-4">Você já está logado na área técnica. Se quiser acessar outra conta, faça logout primeiro.</p>
          <Button className="w-full" onClick={() => window.location.href = '/'}>Ir para o Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError('E-mail ou senha inválidos.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 mx-auto text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Área Técnica</h1>
          <p className="text-gray-600">Acesso restrito para equipe técnica</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LogIn className="h-5 w-5 mr-2" />
              Entrar na Área Técnica
            </CardTitle>
            <CardDescription>
              Informe seu e-mail e senha cadastrados para acessar as funcionalidades técnicas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  ref={inputRef}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              {error && <div className="text-red-600 text-center mt-2">{error}</div>}
            </form>
          </CardContent>
        </Card>
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Portal desenvolvido pela GEINFRA</p>
        </div>
      </div>
    </div>
  );
} 