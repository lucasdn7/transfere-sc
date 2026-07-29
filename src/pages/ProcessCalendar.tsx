import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';

const ProcessCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Buscar eventos do banco de dados
  const { data: events } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          municipalities!inner(name)
        `)
        .order('data_evento', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000
  });

  // Filtrar eventos para a data selecionada
  const eventsForSelectedDate = events?.filter(event => {
    if (!date) return false;
    const eventDate = parseISO(event.data_evento);
    return eventDate.toDateString() === date.toDateString();
  }) || [];

  // Contar eventos por período
  const today = new Date();
  const eventsToday = events?.filter(e => parseISO(e.data_evento).toDateString() === today.toDateString()).length || 0;
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const eventsThisWeek = events?.filter(e => {
    const eventDate = parseISO(e.data_evento);
    return eventDate >= weekStart && eventDate <= weekEnd;
  }).length || 0;

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const eventsThisMonth = events?.filter(e => {
    const eventDate = parseISO(e.data_evento);
    return eventDate >= monthStart && eventDate <= monthEnd;
  }).length || 0;

  // Modificadores para destacar datas com eventos
  const modifiers = {
    hasEvent: events?.map(e => parseISO(e.data_evento)) || []
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <h1 className="page-title">Calendário de Processos</h1>
        <p className="page-description">
          Visualize eventos e prazos importantes dos processos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="rounded-md border"
                modifiers={modifiers}
                modifiersStyles={{
                  hasEvent: {
                    backgroundColor: '#dbeafe',
                    fontWeight: 'bold',
                    borderRadius: '4px'
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              {date ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {eventsForSelectedDate.length > 0 ? (
                    <div className="space-y-2">
                      {eventsForSelectedDate.map((event) => (
                        <div key={event.id} className="p-3 border rounded-lg bg-blue-50">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{event.nome}</span>
                            <Badge variant="default" className="bg-blue-600">Evento</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.objeto}
                          </p>
                          <div className="flex justify-between items-center mt-2 text-sm">
                            <span className="text-gray-500">
                              Município: {event.municipalities?.name}
                            </span>
                            {event.valor_concedente && (
                              <span className="font-medium text-green-600">
                                {formatCurrency(event.valor_concedente)}
                              </span>
                            )}
                          </div>
                          {event.numero_processo && (
                            <p className="text-xs text-gray-500 mt-1">
                              Processo: {event.numero_processo}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4">Nenhum evento nesta data</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Selecione uma data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total hoje</span>
                  <Badge variant="secondary">{eventsToday}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Esta semana</span>
                  <Badge variant="secondary">{eventsThisWeek}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Este mês</span>
                  <Badge variant="secondary">{eventsThisMonth}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total de eventos</span>
                  <Badge variant="default">{events?.length || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProcessCalendar;
