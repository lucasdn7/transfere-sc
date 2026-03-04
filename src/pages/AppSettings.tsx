import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Monitor, Palette, Type, Layout, LogOut, Info } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const colorThemes = [
  { value: 'theme-blue', label: 'Azul' },
  { value: 'theme-green', label: 'Verde' },
  { value: 'theme-orange', label: 'Laranja' },
  { value: 'theme-default', label: 'Padrão' },
];
const fontFamilies = [
  { value: 'font-sans', label: 'Sans (Inter)' },
  { value: 'font-serif', label: 'Serif (Merriweather)' },
  { value: 'font-mono', label: 'Mono (Fira Mono)' },
];

function LabelWithTooltip({ htmlFor, children, tooltip }: { htmlFor: string, children: React.ReactNode, tooltip: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1 cursor-pointer">
      {children}
      <span tabIndex={0} aria-label={tooltip} className="group relative focus:outline-none focus:ring-2 focus:ring-primary rounded-full">
        <Info className="h-4 w-4 text-gray-400 group-hover:text-primary" />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {tooltip}
        </span>
      </span>
    </label>
  );
}

const ONBOARDING_KEY = 'onboardingSeen';

export default function AppSettings() {
  const { theme, layoutPosition, fontSize, setTheme, setLayoutPosition, setFontSize } = useTheme();
  const { isAuthenticated, signOut } = useAuth();
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('highContrast') === 'true');
  const [colorBlindMode, setColorBlindMode] = useState(() => localStorage.getItem('colorBlindMode') === 'true');
  const [compactLayout, setCompactLayout] = useState(() => localStorage.getItem('compactLayout') === 'true');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('reduceMotion') === 'true');
  const [showFeedback, setShowFeedback] = useState(false);
  // Técnicos
  const [techNotifications, setTechNotifications] = useState(() => localStorage.getItem('techNotifications') !== 'false');
  const [techLogs, setTechLogs] = useState(() => localStorage.getItem('techLogs') === 'true');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('colorTheme') || 'theme-default');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'font-sans');
  const [debugVisual, setDebugVisual] = useState(() => localStorage.getItem('debugVisual') === 'true');
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== 'true');
  const onboardingStep = useRef(0);
  const onboardingSteps = [
    {
      title: 'Personalize sua experiência',
      desc: 'Aqui você pode ajustar tema, fonte, contraste, layout e muito mais para deixar o sistema com a sua cara.'
    },
    {
      title: 'Acessibilidade',
      desc: 'Ative alto contraste, modo daltônico ou reduza animações para uma navegação mais confortável.'
    },
    {
      title: 'Área Técnica',
      desc: 'Se você for técnico, acesse opções avançadas como logs detalhados, debug visual e exportação de relatórios.'
    },
    {
      title: 'Ajuda contextual',
      desc: 'Passe o mouse nos ícones de interrogação para entender cada configuração.'
    },
    {
      title: 'Pronto!',
      desc: 'Suas preferências ficam salvas e podem ser restauradas a qualquer momento.'
    }
  ];

  const [logFrom, setLogFrom] = useState('');
  const [logTo, setLogTo] = useState('');
  const [logTipo, setLogTipo] = useState('todos');

  useEffect(() => {
    localStorage.setItem('highContrast', String(highContrast));
    localStorage.setItem('colorBlindMode', String(colorBlindMode));
    localStorage.setItem('compactLayout', String(compactLayout));
    localStorage.setItem('reduceMotion', String(reduceMotion));
    setShowFeedback(true);
    const timeout = setTimeout(() => setShowFeedback(false), 1500);
    return () => clearTimeout(timeout);
  }, [highContrast, colorBlindMode, compactLayout, reduceMotion]);

  useEffect(() => {
    localStorage.setItem('techNotifications', String(techNotifications));
    localStorage.setItem('techLogs', String(techLogs));
  }, [techNotifications, techLogs]);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle('high-contrast', highContrast);
    body.classList.toggle('color-blind', colorBlindMode);
    body.classList.toggle('compact-layout', compactLayout);
    body.classList.toggle('reduce-motion', reduceMotion);
    colorThemes.forEach(t => body.classList.remove(t.value));
    body.classList.add(colorTheme);
    fontFamilies.forEach(f => body.classList.remove(f.value));
    body.classList.add(fontFamily);
    body.classList.toggle('debug-visual', debugVisual);
  }, [highContrast, colorBlindMode, compactLayout, reduceMotion, colorTheme, fontFamily, debugVisual]);

  useEffect(() => {
    localStorage.setItem('colorTheme', colorTheme);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('debugVisual', String(debugVisual));
  }, [colorTheme, fontFamily, debugVisual]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') setDebugVisual(v => !v);
      if (e.ctrlKey && e.key === 'e') alert('Exportação de logs técnicos em breve!');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAuthenticated]);

  // Sincronização de preferências com Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
    // Carregar preferências do Supabase ao autenticar
    (async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .like('chave', 'user_pref_%');
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          const key = item.chave.replace('user_pref_', '');
          try {
            const value = JSON.parse(item.valor);
            localStorage.setItem(key, value);
          } catch {
            localStorage.setItem(key, item.valor);
          }
        });
        // Forçar recarregar preferências locais
        setHighContrast(localStorage.getItem('highContrast') === 'true');
        setColorBlindMode(localStorage.getItem('colorBlindMode') === 'true');
        setCompactLayout(localStorage.getItem('compactLayout') === 'true');
        setReduceMotion(localStorage.getItem('reduceMotion') === 'true');
        setColorTheme(localStorage.getItem('colorTheme') || 'theme-default');
        setFontFamily(localStorage.getItem('fontFamily') || 'font-sans');
        setDebugVisual(localStorage.getItem('debugVisual') === 'true');
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Salvar preferências no Supabase sempre que mudarem
    const prefs = [
      { key: 'highContrast', value: highContrast },
      { key: 'colorBlindMode', value: colorBlindMode },
      { key: 'compactLayout', value: compactLayout },
      { key: 'reduceMotion', value: reduceMotion },
      { key: 'colorTheme', value: colorTheme },
      { key: 'fontFamily', value: fontFamily },
      { key: 'debugVisual', value: debugVisual },
    ];
    prefs.forEach(async ({ key, value }) => {
      await supabase
        .from('configuracoes')
        .upsert({ chave: `user_pref_${key}`, valor: JSON.stringify(value), editavel: false, tipo: 'string' }, { onConflict: 'chave' });
    });
  }, [isAuthenticated, highContrast, colorBlindMode, compactLayout, reduceMotion, colorTheme, fontFamily, debugVisual]);

  function resetPreferences() {
    setHighContrast(false);
    setColorBlindMode(false);
    setCompactLayout(false);
    setReduceMotion(false);
    setColorTheme('theme-default');
    setFontFamily('font-sans');
    setDebugVisual(false);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1500);
    localStorage.clear();
  }

  function nextOnboarding() {
    if (onboardingStep.current < onboardingSteps.length - 1) {
      onboardingStep.current++;
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
  }

  function skipOnboarding() {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }

  function getMockLogs() {
    return [
      { data: '2024-07-05 10:00', acao: 'Login técnico', usuario: 'tecnico1', status: 'sucesso', tipo: 'autenticacao' },
      { data: '2024-07-05 10:05', acao: 'Exportação de relatório', usuario: 'tecnico1', status: 'sucesso', tipo: 'relatorio' },
      { data: '2024-07-05 10:10', acao: 'Alteração de configuração', usuario: 'tecnico2', status: 'erro', tipo: 'configuracao' },
      { data: '2024-07-06 09:00', acao: 'Login técnico', usuario: 'tecnico2', status: 'sucesso', tipo: 'autenticacao' },
      { data: '2024-07-06 09:30', acao: 'Exportação de relatório', usuario: 'tecnico1', status: 'sucesso', tipo: 'relatorio' },
    ];
  }

  function exportTechLogsFiltered({ from, to, tipo }: { from?: string, to?: string, tipo?: string }) {
    let logs = getMockLogs();
    if (from) logs = logs.filter(l => l.data >= from);
    if (to) logs = logs.filter(l => l.data <= to);
    if (tipo && tipo !== 'todos') logs = logs.filter(l => l.tipo === tipo);
    const worksheet = XLSX.utils.json_to_sheet(logs);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'logs_tecnicos.csv');
  }

  function exportTechReport() {
    // Mock de relatório técnico
    const relatorio = [
      { data: '2024-07-05', total_acessos: 12, erros: 1, exportacoes: 3 },
      { data: '2024-07-06', total_acessos: 8, erros: 0, exportacoes: 2 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(relatorio);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'relatorio_tecnico.csv');
  }

  return (
    <div className="space-y-6">
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative animate-fade-in">
            <button onClick={skipOnboarding} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" aria-label="Fechar tutorial">×</button>
            <h2 className="text-xl font-bold mb-2">{onboardingSteps[onboardingStep.current].title}</h2>
            <p className="mb-4 text-gray-700">{onboardingSteps[onboardingStep.current].desc}</p>
            <div className="flex justify-between items-center">
              <button onClick={skipOnboarding} className="text-sm text-gray-500 underline">Não mostrar novamente</button>
              <button onClick={nextOnboarding} className="bg-primary text-white px-4 py-2 rounded font-medium">
                {onboardingStep.current === onboardingSteps.length - 1 ? 'Começar' : 'Próximo'}
              </button>
            </div>
            <div className="flex gap-1 mt-4 justify-center">
              {onboardingSteps.map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i === onboardingStep.current ? 'bg-primary' : 'bg-gray-300'}`}></span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center">
        <Settings className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>
      {showFeedback && (
        <div className="p-2 bg-green-100 text-green-800 rounded text-sm w-fit">Preferências salvas!</div>
      )}
      <div className="grid gap-6">
        {/* Configurações de Layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layout className="h-5 w-5 mr-2" />
              Layout e Navegação
            </CardTitle>
            <CardDescription>
              Configure a aparência e posicionamento do menu de navegação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="layout-position" tooltip="Selecione a posição do menu.">Posição do Menu</LabelWithTooltip>
              <Select value={layoutPosition} onValueChange={setLayoutPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a posição do menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sidebar">Barra Lateral (Esquerda)</SelectItem>
                  <SelectItem value="top">Barra Superior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <LabelWithTooltip htmlFor="compact-layout" tooltip="Ativa ou desativa o layout compacto.">Layout Compacto</LabelWithTooltip>
              <Switch
                id="compact-layout"
                checked={compactLayout}
                onCheckedChange={setCompactLayout}
              />
            </div>
          </CardContent>
        </Card>
        {/* Configurações de Tema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize o tema e cores da interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="color-theme" tooltip="Escolha a paleta de cores principal do sistema.">Paleta de Cores</LabelWithTooltip>
              <Select value={colorTheme} onValueChange={setColorTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a paleta de cores" />
                </SelectTrigger>
                <SelectContent>
                  {colorThemes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 mt-2">
                {colorThemes.map((t) => (
                  <div key={t.value} className={`w-8 h-8 rounded border-2 ${colorTheme === t.value ? 'border-primary' : 'border-gray-300'} ${t.value}`} title={t.label}></div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="font-family" tooltip="Escolha a fonte principal do sistema.">Fonte</LabelWithTooltip>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 mt-2">
                {fontFamilies.map((f) => (
                  <span key={f.value} className={`px-3 py-1 rounded border ${fontFamily === f.value ? 'border-primary' : 'border-gray-300'} ${f.value}`}>{f.label}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <LabelWithTooltip htmlFor="high-contrast" tooltip="Aumenta o contraste das cores para facilitar a leitura.">Alto Contraste</LabelWithTooltip>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>
            <div className="flex items-center justify-between">
              <LabelWithTooltip htmlFor="color-blind" tooltip="Ativa ou desativa o modo daltônico para melhorar a visão de cores.">Modo Daltônico</LabelWithTooltip>
              <Switch
                id="color-blind"
                checked={colorBlindMode}
                onCheckedChange={setColorBlindMode}
              />
              </div>
            <div className="flex items-center justify-between">
              <LabelWithTooltip htmlFor="reduce-motion" tooltip="Reduz ou aumenta a velocidade das animações para melhorar a experiência de usuário.">Reduzir Animações</LabelWithTooltip>
              <Switch
                id="reduce-motion"
                checked={reduceMotion}
                onCheckedChange={setReduceMotion}
              />
            </div>
            <Button variant="outline" onClick={resetPreferences} className="mt-2">Restaurar Padrão</Button>
          </CardContent>
        </Card>
        {/* Configurações de Tipografia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Type className="h-5 w-5 mr-2" />
              Tipografia
            </CardTitle>
            <CardDescription>
              Ajuste o tamanho da fonte para melhor legibilidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="font-size" tooltip="Ajuste o tamanho da fonte para melhor legibilidade.">Tamanho da Fonte</LabelWithTooltip>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho da fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequena</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* Configurações de Acessibilidade */}
        {/* Painel Técnico */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Área Técnica
              </CardTitle>
              <CardDescription>
                Configurações e ações para usuários técnicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <LabelWithTooltip htmlFor="tech-notifications" tooltip="Ativa ou desativa notificações técnicas.">Notificações Técnicas</LabelWithTooltip>
                <Switch
                  id="tech-notifications"
                  checked={techNotifications}
                  onCheckedChange={setTechNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <LabelWithTooltip htmlFor="tech-logs" tooltip="Ativa ou desativa logs detalhados.">Logs Detalhados</LabelWithTooltip>
                <Switch
                  id="tech-logs"
                  checked={techLogs}
                  onCheckedChange={setTechLogs}
                />
              </div>
              <div className="flex items-center justify-between">
                <LabelWithTooltip htmlFor="debug-visual" tooltip="Ativa ou desativa o modo de depuração visual.">Debug Visual</LabelWithTooltip>
                <Switch
                  id="debug-visual"
                  checked={debugVisual}
                  onCheckedChange={setDebugVisual}
                />
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                  <div>
                    <LabelWithTooltip htmlFor="log-from" tooltip="Data inicial dos logs">De</LabelWithTooltip>
                    <input id="log-from" type="date" value={logFrom} onChange={e => setLogFrom(e.target.value)} className="border rounded px-2 py-1" />
                  </div>
                  <div>
                    <LabelWithTooltip htmlFor="log-to" tooltip="Data final dos logs">Até</LabelWithTooltip>
                    <input id="log-to" type="date" value={logTo} onChange={e => setLogTo(e.target.value)} className="border rounded px-2 py-1" />
                  </div>
                  <div>
                    <LabelWithTooltip htmlFor="log-tipo" tooltip="Tipo de log">Tipo</LabelWithTooltip>
                    <select id="log-tipo" value={logTipo} onChange={e => setLogTipo(e.target.value)} className="border rounded px-2 py-1">
                      <option value="todos">Todos</option>
                      <option value="autenticacao">Autenticação</option>
                      <option value="relatorio">Relatório</option>
                      <option value="configuracao">Configuração</option>
                    </select>
                  </div>
                  <Button variant="outline" onClick={() => exportTechLogsFiltered({ from: logFrom, to: logTo, tipo: logTipo })}>
                    Exportar Logs Técnicos
                  </Button>
                </div>
                <Button variant="outline" onClick={exportTechReport}>
                  Exportar Relatório Técnico
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <LabelWithTooltip htmlFor="status-authentication" tooltip="Status de autenticação do usuário técnico.">Status de Autenticação</LabelWithTooltip>
                  <p className="text-sm text-green-600">
                    Conectado como usuário técnico
                  </p>
                </div>
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Área Técnica
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Sistema</CardTitle>
            <CardDescription>
              Informações sobre o Transfer Radar SC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <LabelWithTooltip htmlFor="version" tooltip="Versão atual do sistema.">Versão:</LabelWithTooltip>
                <p className="text-gray-600">1.0.0</p>
              </div>
              <div>
                <LabelWithTooltip htmlFor="developed-by" tooltip="Empresa responsável pelo desenvolvimento do sistema.">Desenvolvido por:</LabelWithTooltip>
                <p className="text-gray-600">GEINFRA</p>
              </div>
              <div>
                <LabelWithTooltip htmlFor="last-update" tooltip="Data da última atualização do sistema.">Última Atualização:</LabelWithTooltip>
                <p className="text-gray-600">Julho 2025</p>
              </div>
              <div>
                <LabelWithTooltip htmlFor="technical-support" tooltip="Empresa responsável pelo suporte técnico do sistema.">Suporte Técnico:</LabelWithTooltip>
                <p className="text-gray-600">GEINFRA/SETUR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
