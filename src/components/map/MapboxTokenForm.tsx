
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface MapboxTokenFormProps {
  onTokenSave: (token: string) => void;
}

export function MapboxTokenForm({ onTokenSave }: MapboxTokenFormProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateToken = (tokenValue: string): string | null => {
    if (!tokenValue.trim()) {
      return 'Por favor, insira sua chave API do Mapbox';
    }

    if (!tokenValue.startsWith('pk.')) {
      return 'A chave pública do Mapbox deve começar com "pk."';
    }

    if (tokenValue.length < 50) {
      return 'A chave API parece muito curta. Verifique se copiou corretamente.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateToken(token);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Simular validação (em um cenário real, você poderia fazer uma requisição teste)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onTokenSave(token.trim());
    } catch (error) {
      setError('Erro ao salvar a chave API. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToken(value);
    
    // Limpar erro quando o usuário começar a digitar um token válido
    if (error && value.startsWith('pk.')) {
      setError('');
    }
  };

  const isTokenValid = token.startsWith('pk.') && token.length >= 50;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Key className="h-5 w-5" />
            Configurar Mapbox
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Para usar o mapa interativo, você precisa inserir sua chave pública do Mapbox.
              Ela deve começar com "pk." e você pode obtê-la gratuitamente.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Chave Pública do Mapbox</Label>
              <div className="relative">
                <Input
                  id="token"
                  type="text"
                  placeholder="pk.eyJ1IjoibWV1dXN1YXJpbyIsImEiOiJjbGV..."
                  value={token}
                  onChange={handleTokenChange}
                  className="font-mono pr-10"
                  disabled={isValidating}
                />
                {isTokenValid && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {token && !isTokenValid && (
                <p className="text-xs text-muted-foreground">
                  Digite uma chave que comece com "pk."
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!isTokenValid || isValidating}
            >
              {isValidating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Validando...
                </>
              ) : (
                'Salvar Chave API'
              )}
            </Button>
          </form>

          <div className="space-y-3 pt-2 border-t">
            <div className="text-center">
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Obter chave gratuita no Mapbox
              </a>
            </div>
            
            <Alert>
              <AlertDescription className="text-xs">
                <strong>Dica:</strong> Após criar sua conta no Mapbox, vá em "Access Tokens" 
                e copie o token público padrão ou crie um novo.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
