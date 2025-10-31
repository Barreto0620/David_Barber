// @ts-nocheck
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Gift,
  Trophy,
  Star,
  Sparkles,
  Users,
  Settings,
  Crown,
  Target,
  TrendingUp,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface LoyaltyClient {
  id: string;
  name: string;
  phone: string;
  points: number;
  totalVisits: number;
  lastVisit: string;
  freeHaircuts: number;
}

interface LoyaltySettings {
  cutsForFree: number;
}

const today = new Date();
const getRecentDate = (daysAgo: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const mockLoyaltyClients: LoyaltyClient[] = [
  {
    id: 'c1',
    name: 'João Silva',
    phone: '(11) 98765-4321',
    points: 8,
    totalVisits: 42,
    lastVisit: getRecentDate(2),
    freeHaircuts: 1
  },
  {
    id: 'c2',
    name: 'Pedro Santos',
    phone: '(11) 91234-5678',
    points: 3,
    totalVisits: 28,
    lastVisit: getRecentDate(1),
    freeHaircuts: 0
  },
  {
    id: 'c3',
    name: 'Carlos Oliveira',
    phone: '(11) 99876-5432',
    points: 9,
    totalVisits: 35,
    lastVisit: getRecentDate(3),
    freeHaircuts: 2
  },
  {
    id: 'c4',
    name: 'Ricardo Almeida',
    phone: '(11) 97654-3210',
    points: 5,
    totalVisits: 18,
    lastVisit: getRecentDate(4),
    freeHaircuts: 0
  },
  {
    id: 'c5',
    name: 'Ana Costa',
    phone: '(11) 96543-2109',
    points: 2,
    totalVisits: 15,
    lastVisit: getRecentDate(0),
    freeHaircuts: 0
  },
  {
    id: 'c6',
    name: 'Maria Santos',
    phone: '(11) 95432-1098',
    points: 7,
    totalVisits: 22,
    lastVisit: getRecentDate(5),
    freeHaircuts: 1
  },
  {
    id: 'c7',
    name: 'Fernando Lima',
    phone: '(11) 94321-0987',
    points: 4,
    totalVisits: 19,
    lastVisit: getRecentDate(1),
    freeHaircuts: 0
  },
  {
    id: 'c8',
    name: 'Juliana Rocha',
    phone: '(11) 93210-9876',
    points: 6,
    totalVisits: 25,
    lastVisit: getRecentDate(2),
    freeHaircuts: 1
  },
  {
    id: 'c9',
    name: 'Roberto Souza',
    phone: '(11) 92109-8765',
    points: 1,
    totalVisits: 12,
    lastVisit: getRecentDate(3),
    freeHaircuts: 0
  },
  {
    id: 'c10',
    name: 'Patrícia Martins',
    phone: '(11) 91098-7654',
    points: 9,
    totalVisits: 31,
    lastVisit: getRecentDate(0),
    freeHaircuts: 2
  },
  {
    id: 'c11',
    name: 'Gabriel Costa',
    phone: '(11) 90987-6543',
    points: 5,
    totalVisits: 20,
    lastVisit: getRecentDate(4),
    freeHaircuts: 0
  },
  {
    id: 'c12',
    name: 'Camila Ferreira',
    phone: '(11) 99876-5432',
    points: 3,
    totalVisits: 16,
    lastVisit: getRecentDate(2),
    freeHaircuts: 0
  },
  {
    id: 'c13',
    name: 'Bruno Alves',
    phone: '(11) 98888-7777',
    points: 4,
    totalVisits: 21,
    lastVisit: getRecentDate(1),
    freeHaircuts: 0
  },
  {
    id: 'c14',
    name: 'Daniela Souza',
    phone: '(11) 97777-6666',
    points: 7,
    totalVisits: 29,
    lastVisit: getRecentDate(0),
    freeHaircuts: 1
  },
  {
    id: 'c15',
    name: 'Eduardo Pires',
    phone: '(11) 96666-5555',
    points: 2,
    totalVisits: 14,
    lastVisit: getRecentDate(2),
    freeHaircuts: 0
  },
  {
    id: 'c16',
    name: 'Fernanda Dias',
    phone: '(11) 95555-4444',
    points: 6,
    totalVisits: 24,
    lastVisit: getRecentDate(1),
    freeHaircuts: 1
  },
  {
    id: 'c17',
    name: 'Gustavo Ribeiro',
    phone: '(11) 94444-3333',
    points: 3,
    totalVisits: 17,
    lastVisit: getRecentDate(3),
    freeHaircuts: 0
  },
  {
    id: 'c18',
    name: 'Helena Castro',
    phone: '(11) 93333-2222',
    points: 8,
    totalVisits: 33,
    lastVisit: getRecentDate(0),
    freeHaircuts: 1
  },
  {
    id: 'c19',
    name: 'Igor Moreira',
    phone: '(11) 92222-1111',
    points: 5,
    totalVisits: 19,
    lastVisit: getRecentDate(2),
    freeHaircuts: 0
  },
  {
    id: 'c20',
    name: 'Julia Cardoso',
    phone: '(11) 91111-0000',
    points: 9,
    totalVisits: 38,
    lastVisit: getRecentDate(1),
    freeHaircuts: 2
  },
];

export default function LoyaltyPage() {
  const [clients, setClients] = useState<LoyaltyClient[]>(mockLoyaltyClients);
  const [settings, setSettings] = useState<LoyaltySettings>({ cutsForFree: 10 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempCutsForFree, setTempCutsForFree] = useState(settings.cutsForFree);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<LoyaltyClient | null>(null);
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  
  const { addNotification } = useAppStore();

  const weeklyClients = clients.filter(client => {
    const lastVisit = new Date(client.lastVisit);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastVisit >= weekAgo;
  });

  const totalPoints = clients.reduce((sum, c) => sum + c.points, 0);
  const totalFreeHaircuts = clients.reduce((sum, c) => sum + c.freeHaircuts, 0);
  const clientsNearReward = clients.filter(c => c.points >= settings.cutsForFree - 2).length;

  const handleSaveSettings = () => {
    setSettings({ cutsForFree: tempCutsForFree });
    setSettingsOpen(false);
    toast.success('Configurações de fidelidade atualizadas!');
  };

  const spinWheel = () => {
    if (weeklyClients.length === 0) {
      toast.error('Nenhum cliente elegível esta semana!');
      return;
    }

    setSpinning(true);
    
    // Gera um índice aleatório mais distribuído
    const randomValue = Math.random();
    const randomIndex = Math.floor(randomValue * weeklyClients.length);
    const selectedClient = weeklyClients[randomIndex];
    
    console.log('🎲 Sorteio:', { randomValue, randomIndex, total: weeklyClients.length, cliente: selectedClient.name });
    
    const segmentAngle = 360 / weeklyClients.length;
    const targetOffset = (randomIndex * segmentAngle) + (segmentAngle / 2);
    const targetStopAngle = 360 - targetOffset; 
    
    // Adiciona rotações extras aleatórias (entre 5 e 8 voltas completas)
    const fullRotations = 5 + Math.floor(Math.random() * 4);
    const currentFullTurns = Math.floor(rotation / 360);
    
    // Adiciona um offset aleatório pequeno para variar onde para
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.3);
    const targetRotation = (currentFullTurns + fullRotations) * 360 + targetStopAngle + randomOffset;
    
    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinner(selectedClient);
      setWinnerDialogOpen(true);
      
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id 
          ? { ...c, freeHaircuts: c.freeHaircuts + 1 }
          : c
      ));
      
      // Adicionar notificação do sorteio
      try {
        addNotification({
          type: 'system',
          title: '🎉 Vencedor da Roleta da Sorte!',
          message: `${selectedClient.name} ganhou 1 corte grátis no sorteio semanal!`,
          clientName: selectedClient.name,
          serviceType: 'Corte Grátis - Roleta',
          scheduledDate: new Date(),
        });
        console.log('✅ Notificação criada com sucesso para:', selectedClient.name);
      } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
      }
      
      toast.success(`🎉 ${selectedClient.name} ganhou 1 Corte Grátis na Roleta!`);
    }, 5000);
  };

  const redeemFreeHaircut = (clientId: string) => {
    setClients(prev => prev.map(c => 
      c.id === clientId && c.freeHaircuts > 0
        ? { ...c, freeHaircuts: c.freeHaircuts - 1 }
        : c
    ));
    toast.success('Corte grátis resgatado!');
  };

  const addPoint = (clientId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newPoints = c.points + 1;
        const remainingPoints = newPoints % settings.cutsForFree;
        
        if (newPoints % settings.cutsForFree === 0 && newPoints > 0) {
          toast.success(`🎉 ${c.name} ganhou um corte grátis!`);
        }
        
        return {
          ...c,
          points: remainingPoints,
          freeHaircuts: c.freeHaircuts + (newPoints >= settings.cutsForFree ? 1 : 0),
          totalVisits: c.totalVisits + 1,
          lastVisit: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            Programa de Fidelidade
          </h1>
          <p className="text-muted-foreground">
            Recompense seus clientes fiéis e faça sorteios especiais
          </p>
        </div>
        <Button onClick={() => {
          setTempCutsForFree(settings.cutsForFree);
          setSettingsOpen(true);
        }}>
          <Settings className="h-4 w-4 mr-2" />
          Configurar Fidelidade
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">Acumulados pelos clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cortes Grátis Disponíveis</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFreeHaircuts}</div>
            <p className="text-xs text-muted-foreground">Prontos para resgatar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perto da Recompensa</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsNearReward}</div>
            <p className="text-xs text-muted-foreground">Faltam 2 cortes ou menos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuração Atual</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.cutsForFree}</div>
            <p className="text-xs text-muted-foreground">Cortes = 1 grátis</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cards">
            <Star className="h-4 w-4 mr-2" />
            Cartões Fidelidade
          </TabsTrigger>
          <TabsTrigger value="wheel">
            <Sparkles className="h-4 w-4 mr-2" />
            Roleta da Sorte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => {
              const progress = (client.points / settings.cutsForFree) * 100;
              const isNearReward = client.points >= settings.cutsForFree - 2;
              
              return (
                <Card key={client.id} className={cn(
                  "hover:shadow-lg transition-all",
                  isNearReward && "ring-2 ring-green-500"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {client.name}
                          {client.freeHaircuts > 0 && (
                            <Badge className="bg-amber-500">
                              <Crown className="w-3 h-3 mr-1" />
                              {client.freeHaircuts}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {client.phone}
                        </CardDescription>
                      </div>
                      {isNearReward && (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Quase lá!
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso:</span>
                        <span className="font-bold">
                          {client.points} / {settings.cutsForFree}
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: settings.cutsForFree }).map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center transition-all",
                            idx < client.points
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-muted"
                          )}
                        >
                          {idx < client.points && <Star className="w-4 h-4 fill-current" />}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                      <div>
                        <p className="text-muted-foreground">Total de Visitas:</p>
                        <p className="font-bold">{client.totalVisits}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Última Visita:</p>
                        <p className="font-bold">
                          {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => addPoint(client.id)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        +1 Ponto
                      </Button>
                      {client.freeHaircuts > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-amber-500 hover:bg-amber-600"
                          onClick={() => redeemFreeHaircut(client.id)}
                        >
                          <Gift className="w-4 h-4 mr-1" />
                          Resgatar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="wheel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Roleta da Sorte Semanal
              </CardTitle>
              <CardDescription>
                Sorteie um cliente que visitou a barbearia esta semana e ganhe 1 corte grátis!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                <Card className="w-full bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {weeklyClients.length} clientes elegíveis esta semana
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Clientes que visitaram nos últimos 7 dias
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="relative w-[450px] h-[450px] flex items-center justify-center" style={{ marginTop: '50px' }}>
                  {weeklyClients.length > 0 ? (
                    <>
                      <div className="absolute w-[420px] h-[420px] rounded-full border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse" />
                      
                      <svg 
                        className="w-[400px] h-[400px] absolute" 
                        viewBox="0 0 400 400"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          transition: spinning ? 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
                          transformOrigin: 'center center'
                        }}
                      >
                        <defs>
                          {weeklyClients.map((_, idx) => {
                            const colors = [
                              ['#ef4444', '#dc2626'],
                              ['#f59e0b', '#d97706'],
                              ['#10b981', '#059669'],
                              ['#3b82f6', '#2563eb'],
                              ['#8b5cf6', '#7c3aed'],
                              ['#ec4899', '#db2777'],
                              ['#14b8a6', '#0d9488'],
                              ['#f97316', '#ea580c'],
                            ];
                            const colorPair = colors[idx % colors.length];
                            return (
                              <linearGradient key={`grad-${idx}`} id={`grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: colorPair[0], stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: colorPair[1], stopOpacity: 1 }} />
                              </linearGradient>
                            );
                          })}
                        </defs>
                        
                        {weeklyClients.map((client, idx) => {
                          const segmentAngle = 360 / weeklyClients.length;
                          const startAngle = idx * segmentAngle - 90;
                          const endAngle = (idx + 1) * segmentAngle - 90;
                          
                          const startX = 200 + 190 * Math.cos((startAngle * Math.PI) / 180);
                          const startY = 200 + 190 * Math.sin((startAngle * Math.PI) / 180);
                          const endX = 200 + 190 * Math.cos((endAngle * Math.PI) / 180);
                          const endY = 200 + 190 * Math.sin((endAngle * Math.PI) / 180);
                          const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                          
                          const midAngle = startAngle + segmentAngle / 2;
                          const textRadius = 140;
                          const textX = 200 + textRadius * Math.cos((midAngle * Math.PI) / 180);
                          const textY = 200 + textRadius * Math.sin((midAngle * Math.PI) / 180);
                          
                          return (
                            <g key={client.id}>
                              <path
                                d={`M 200 200 L ${startX} ${startY} A 190 190 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                                fill={`url(#grad-${idx})`}
                              />
                              <line
                                x1="200"
                                y1="200"
                                x2={startX}
                                y2={startY}
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="2"
                              />
                              <text
                                x={textX}
                                y={textY}
                                fill="white"
                                fontSize="13"
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                                style={{
                                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                                }}
                              >
                                {client.name.split(' ')[0]}
                              </text>
                            </g>
                          );
                        })}
                        
                        <circle cx="200" cy="200" r="190" fill="none" stroke="#f59e0b" strokeWidth="10" />
                        <circle cx="200" cy="200" r="50" fill="#f59e0b" />
                        <circle cx="200" cy="200" r="50" fill="none" stroke="white" strokeWidth="5" />
                      </svg>
                      
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                        <Sparkles className="w-12 h-12 text-white drop-shadow-lg" />
                      </div>
                      
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-30">
                        <div className="relative">
                          <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[60px] border-t-red-600 drop-shadow-2xl" />
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[48px] border-t-red-500" />
                        </div>
                      </div>
                      
                      {spinning && (
                        <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-radial from-amber-500/20 to-transparent animate-ping pointer-events-none" />
                      )}
                    </>
                  ) : (
                    <div className="w-[400px] h-[400px] rounded-full border-8 border-muted bg-muted/20 flex items-center justify-center">
                      <p className="text-muted-foreground text-center text-lg">
                        Nenhum cliente<br />elegível
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full max-w-md h-14 text-lg font-bold"
                  onClick={spinWheel}
                  disabled={spinning || weeklyClients.length === 0}
                >
                  {spinning ? (
                    <>
                      <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                      Girando...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-2" />
                      Girar Roleta
                    </>
                  )}
                </Button>

                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Clientes Elegíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weeklyClients.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum cliente visitou esta semana
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {weeklyClients.map((client) => (
                          <div
                            key={client.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.phone}</p>
                            </div>
                            <Badge variant="outline">
                              {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações de Fidelidade</DialogTitle>
            <DialogDescription>
              Defina quantos cortes são necessários para ganhar 1 grátis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cortes para ganhar 1 grátis</Label>
              <Input
                type="number"
                min="5"
                max="20"
                value={tempCutsForFree}
                onChange={(e) => setTempCutsForFree(parseInt(e.target.value) || 10)}
              />
              <p className="text-sm text-muted-foreground">
                Recomendado: entre 8 e 12 cortes
              </p>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Exemplo:</strong> Se configurar para {tempCutsForFree} cortes, o cliente
                  precisará fazer {tempCutsForFree} cortes para ganhar 1 grátis.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings}>
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              🎉 Parabéns! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              O grande vencedor é:
            </DialogDescription>
          </DialogHeader>

          {winner && (
            <div className="py-6">
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0">
                <CardContent className="p-6 text-center text-white">
                  <Crown className="w-12 h-12 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold mb-2">{winner.name}</h3>
                  <p className="text-amber-100">{winner.phone}</p>
                  <div className="mt-4 p-3 bg-white/20 rounded-lg">
                    <p className="font-bold text-lg">Ganhou 1 Corte Grátis! 💇‍♂️</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setWinnerDialogOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}