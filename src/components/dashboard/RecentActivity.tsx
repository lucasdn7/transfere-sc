
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: 'process_created' | 'process_approved' | 'process_finished' | 'municipality_updated';
  title: string;
  description: string;
  timestamp: Date;
  municipality?: string;
  status?: string;
}

export function RecentActivity() {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'process_created',
      title: 'Novo processo criado',
      description: 'Processo 2024/001234 - Pavimentação Asfáltica',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      municipality: 'Florianópolis',
      status: 'created'
    },
    {
      id: '2',
      type: 'process_approved',
      title: 'Processo aprovado',
      description: 'Processo 2024/001200 - Construção de Escola',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      municipality: 'Joinville',
      status: 'approved'
    },
    {
      id: '3',
      type: 'process_finished',
      title: 'Processo finalizado',
      description: 'Processo 2024/001150 - Reforma do Hospital Municipal',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      municipality: 'Blumenau',
      status: 'finished'
    },
    {
      id: '4',
      type: 'municipality_updated',
      title: 'Dados municipais atualizados',
      description: 'Informações de contato e população atualizadas',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      municipality: 'Chapecó'
    }
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'created': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const getAvatarColor = (type: string) => {
    switch (type) {
      case 'process_created': return 'bg-blue-500';
      case 'process_approved': return 'bg-green-500';
      case 'process_finished': return 'bg-gray-500';
      default: return 'bg-purple-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={`text-white text-xs ${getAvatarColor(activity.type)}`}>
                  {activity.municipality?.[0] || 'SC'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <div className="flex items-center space-x-2">
                  {activity.municipality && (
                    <Badge variant="outline" className="text-xs">
                      {activity.municipality}
                    </Badge>
                  )}
                  {activity.status && (
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status === 'created' && 'Criado'}
                      {activity.status === 'approved' && 'Aprovado'}
                      {activity.status === 'finished' && 'Finalizado'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
