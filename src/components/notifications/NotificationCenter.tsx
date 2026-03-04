
import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, AlertCircle, Info, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  tipo: 'atencao' | 'urgencia' | 'informativa';
  processoId?: string;
  titulo: string;
  mensagem: string;
  dataGeracao: string;
  lida: boolean;
  acoes?: Array<{label: string; callback: string}>;
  link_sgpe?: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [stackedNotifications, setStackedNotifications] = useState<Notification[]>([]);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Buscar notificações do banco
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Gerar notificações automáticas de urgência
      const urgentNotifications = await generateUrgentNotifications();
      
      // Combinar e converter para o novo formato
      const allNotifications = [
        ...urgentNotifications,
        ...(dbNotifications || []).map(n => ({
          id: n.id.toString(),
          tipo: n.type === 'critical' ? 'urgencia' : n.type === 'important' ? 'atencao' : 'informativa',
          processoId: n.processo_id?.toString(),
          titulo: n.title || 'Notificação',
          mensagem: n.message || '',
          dataGeracao: n.created_at,
          lida: n.is_read,
          link_sgpe: n.link
        }))
      ];
      
      return allNotifications;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Verificar a cada 30 segundos
  });
  
  // Gerar notificações automáticas de urgência
  const generateUrgentNotifications = async (): Promise<Notification[]> => {
    try {
      const { data: processes } = await supabase
        .from('processes')
        .select('*')
        .lte('data_vigencia', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .not('status', 'in', '(Finalizado,Cancelado)')
        .is('deleted_at', null);
      
      return (processes || []).map(process => ({
        id: `urgency-${process.id}`,
        tipo: 'urgencia' as const,
        processoId: process.id.toString(),
        titulo: 'Processo próximo ao vencimento',
        mensagem: `O processo ${process.numero_processo} do município de ${process.municipio} vence em ${Math.ceil((new Date(process.data_vigencia).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias.`,
        dataGeracao: new Date().toISOString(),
        lida: false,
        link_sgpe: process.link_sgpe
      }));
    } catch (error) {
      console.error('Erro ao gerar notificações de urgência:', error);
      return [];
    }
  };

  const unreadCount = notifications?.filter(n => !n.lida).length || 0;
  
  // Efeito para empilhar notificações (máximo 3 visíveis)
  useEffect(() => {
    if (notifications) {
      setStackedNotifications(notifications.slice(0, 3));
    }
  }, [notifications]);
  
  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('urgency-')) {
        // Notificação automática - apenas marcar localmente
        return { success: true };
      }
      await supabase.from('notifications').update({ is_read: true }).eq('id', parseInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications?.filter(n => !n.lida) || [];
      const dbNotifications = unreadNotifications.filter(n => !n.id.startsWith('urgency-'));
      
      if (dbNotifications.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', dbNotifications.map(n => parseInt(n.id)));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas as notificações foram marcadas como lidas');
    }
  });
  
  // Função para marcar como lida
  const markAsRead = async (id: string) => {
    markAsReadMutation.mutate(id);
  };
  
  // Função para marcar todas como lidas
  const markAllAsRead = async () => {
    markAllAsReadMutation.mutate();
  };

  // Estilo visual por tipo
  const getNotificationStyle = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'atencao':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          header: 'bg-yellow-100 border-yellow-300',
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100'
        };
      case 'urgencia':
        return {
          bg: 'bg-red-50 border-red-200',
          header: 'bg-red-100 border-red-300',
          icon: 'text-red-600',
          iconBg: 'bg-red-100'
        };
      case 'informativa':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          header: 'bg-blue-100 border-blue-300',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100'
        };
    }
  };
  
  // Ícone por tipo
  const getNotificationIcon = (tipo: Notification['tipo']) => {
    const style = getNotificationStyle(tipo);
    switch (tipo) {
      case 'atencao':
        return (
          <div className={`p-1 rounded-full ${style.iconBg}`}>
            <AlertTriangle className={`h-4 w-4 ${style.icon}`} />
          </div>
        );
      case 'urgencia':
        return (
          <div className={`p-1 rounded-full ${style.iconBg}`}>
            <AlertCircle className={`h-4 w-4 ${style.icon}`} />
          </div>
        );
      case 'informativa':
      default:
        return (
          <div className={`p-1 rounded-full ${style.iconBg}`}>
            <Info className={`h-4 w-4 ${style.icon}`} />
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Notificações empilhadas no topo */}
      {stackedNotifications.length > 0 && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 space-y-2 max-w-2xl w-full px-4">
          {stackedNotifications.map((notification, index) => {
            const style = getNotificationStyle(notification.tipo);
            return (
              <div
                key={notification.id}
                className={`border rounded-lg shadow-lg p-4 ${style.bg} ${!notification.lida ? 'border-l-4' : ''} animate-in slide-in-from-top fade-in duration-300`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.tipo)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {notification.titulo}
                      </div>
                      <div className="text-xs text-gray-700 mt-1">
                        {notification.mensagem}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.dataGeracao), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {notification.link_sgpe && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => window.open(notification.link_sgpe, '_blank')}
                        title="Abrir no SGPE"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    {!notification.lida && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => markAsRead(notification.id)}
                        title="Marcar como lida"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      </Button>
                    )}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => {
                        setStackedNotifications(prev => prev.filter(n => n.id !== notification.id));
                        markAsRead(notification.id);
                      }}
                      title="Fechar"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Centro de notificações */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {isOpen && (
          <Card className="absolute right-0 top-full mt-2 w-96 z-50 shadow-xl border-0">
            <CardHeader className={`${getNotificationStyle('informativa').header} border-b`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificações
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-7 px-2"
                      disabled={markAllAsReadMutation.isPending}
                    >
                      Marcar todas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto p-0">
              {isLoading ? (
                <div className="p-4 text-sm text-gray-500 text-center">Carregando...</div>
              ) : notifications && notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const style = getNotificationStyle(notification.tipo);
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 text-sm flex gap-3 items-start hover:bg-gray-50 transition-colors ${
                          !notification.lida ? style.bg : ''
                        }`}
                      >
                        <div className="pt-0.5">
                          {getNotificationIcon(notification.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {notification.titulo}
                          </div>
                          <div className="text-xs text-gray-700 mt-1 line-clamp-2">
                            {notification.mensagem}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                            <span>
                              {formatDistanceToNow(new Date(notification.dataGeracao), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                            {notification.link_sgpe && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                                onClick={() => window.open(notification.link_sgpe, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                SGPE
                              </Button>
                            )}
                          </div>
                        </div>
                        {!notification.lida && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => markAsRead(notification.id)}
                            title="Marcar como lida"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">Nenhuma notificação</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
