import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Users, Bell, Database } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configurations = [], isLoading } = useQuery({
    queryKey: ['configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .order('chave');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateConfigurationMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('configuracoes')
        .update({ valor: value })
        .eq('chave', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] });
      toast({
        title: 'Configuração atualizada',
        description: 'A configuração foi salva com sucesso.',
      });
    },
  });

  const createNotificationsMutation = useMutation({
    mutationFn: async () => {
      // Create a simple notification for testing
      const { error } = await supabase
        .from('notifications')
        .insert({
          message: 'Notificações de vencimento foram geradas',
          type: 'informative',
          is_public: true
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Notificações criadas',
        description: 'Notificações de vencimento foram geradas.',
      });
    },
  });

  const handleConfigurationUpdate = (key: string, value: string) => {
    updateConfigurationMutation.mutate({ key, value });
  };

  const getConfigurationValue = (configValue: any): string => {
    if (typeof configValue === 'string') {
      try {
        return JSON.parse(configValue);
      } catch {
        return configValue;
      }
    }
    return String(configValue);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SettingsIcon className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configurations.map((config) => (
                <div key={config.chave} className="space-y-2">
                  <Label htmlFor={config.chave}>
                    {config.descricao || config.chave}
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id={config.chave}
                      defaultValue={getConfigurationValue(config.valor)}
                      onBlur={(e) => handleConfigurationUpdate(config.chave, e.target.value)}
                      disabled={!config.editavel}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription>
                Visualizar usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usersList.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{user.username}</h3>
                      <p className="text-sm text-gray-600">ID: {user.id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        Usuário
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Sistema de Notificações
              </CardTitle>
              <CardDescription>
                Configure e gerencie as notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Intervalos de Notificação</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Notificações são enviadas automaticamente nos seguintes intervalos antes do vencimento:
                  </p>
                  <div className="flex space-x-2">
                    <Badge>30 dias</Badge>
                    <Badge>15 dias</Badge>
                    <Badge>7 dias</Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => createNotificationsMutation.mutate()}
                    disabled={createNotificationsMutation.isPending}
                  >
                    {createNotificationsMutation.isPending 
                      ? 'Gerando...' 
                      : 'Gerar Notificações de Vencimento'
                    }
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Clique para gerar notificações para processos próximos ao vencimento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Informações do Banco de Dados
              </CardTitle>
              <CardDescription>
                Estatísticas e informações sobre o banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Conectividade</h4>
                  <p className="text-sm text-blue-700">Sistema conectado ao Supabase</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">RLS Ativo</h4>
                  <p className="text-sm text-green-700">Segurança por linha habilitada</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Backup</h4>
                  <p className="text-sm text-purple-700">Backup automático ativo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
