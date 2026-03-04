
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, Info, CheckCircle } from "lucide-react";

type NotificationType = 'critical' | 'important' | 'informative';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean;
}

export function SystemNotifications() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['system-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Notification[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'important':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'informative':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'important':
        return 'bg-orange-50 border-orange-200';
      case 'informative':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  if (isLoading || !notifications || notifications.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Bell className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-medium text-gray-900">Notificações do Sistema</h3>
        </div>
        
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-start space-x-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {notification.type === 'critical' ? 'Crítico' : 
                   notification.type === 'important' ? 'Importante' : 'Info'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
