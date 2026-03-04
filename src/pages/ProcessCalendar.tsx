import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ProcessCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

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
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processos do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              {date ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Processo #001</span>
                        <Badge variant="default">Em Andamento</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Audiência marcada para as 14:00
                      </p>
                    </div>
                  </div>
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
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Esta semana</span>
                  <Badge variant="secondary">23</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Este mês</span>
                  <Badge variant="secondary">87</Badge>
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
