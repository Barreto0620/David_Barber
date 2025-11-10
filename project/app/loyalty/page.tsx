// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import type { LoyaltyClient, LoyaltySettings } from '@/types/loyalty'; 

export default function LoyaltyPage() {
    // ============================================
    // 1. CONSUMINDO O ESTADO E AS AÇÕES DO STORE
    // ============================================
    const {
        loyaltyClients: clients,
        loyaltySettings: settings,
        loyaltyStats: stats,
        loyaltyLoading: loading,
        updateLoyaltySettings,
        spinWheel: storeSpinWheel, 
        redeemFreeHaircut: storeRedeem,
        addNotification,
    } = useAppStore();

    const cutsForFree = settings?.cuts_for_free || 10;
    
    // ============================================
    // 2. ESTADOS LOCAIS E EFEITOS
    // ============================================
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tempCutsForFree, setTempCutsForFree] = useState(cutsForFree);
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState(null);
    const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
    const [lastWinnerId, setLastWinnerId] = useState(null);
    
    useEffect(() => {
        setTempCutsForFree(cutsForFree);
    }, [cutsForFree]);

    // ============================================
    // 3. VARIÁVEIS COMPUTADAS (Clientes elegíveis e ESTÁVEIS)
    // ============================================
    const totalPoints = stats?.totalPoints || 0;
    const totalFreeHaircuts = stats?.totalFreeHaircuts || 0;
    const clientsNearReward = stats?.clientsNearReward || 0;
    
    // 🔥 CORREÇÃO DE ESTABILIDADE: Ordena a lista pelo client_id para estabilizar as chaves do React/SVG.
    const weeklyClients = useCallback(clients
        .filter(client => {
            const lastVisit = client.last_visit ? new Date(client.last_visit) : null;
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return lastVisit && lastVisit >= weekAgo;
        })
        .sort((a, b) => a.client_id.localeCompare(b.client_id)), // Ordena pelo ID
    [clients]);

    // ============================================
    // 4. FUNÇÕES DE AÇÃO
    // ============================================

    const handleSaveSettings = async () => {
        if (tempCutsForFree < 1) return toast.error("O número deve ser positivo.");
        const success = await updateLoyaltySettings(tempCutsForFree);
        if (success) {
            setSettingsOpen(false);
        }
    };

    const spinWheel = async () => {
        if (weeklyClients.length === 0) {
            toast.error('Nenhum cliente elegível esta semana!');
            return;
        }

        setSpinning(true);
        
        // 1. LÓGICA DE SORTEIO ANTI-REPETIÇÃO
        let selectedClient;
        let randomIndex;
        
        if (weeklyClients.length > 1) {
            let attempts = 0;
            do {
                randomIndex = Math.floor(Math.random() * weeklyClients.length);
                selectedClient = weeklyClients[randomIndex];
                attempts++;
            } while (selectedClient.client_id === lastWinnerId && attempts < 5);
        } else {
            selectedClient = weeklyClients[0];
            randomIndex = 0;
        }
        
        // 2. Define a ANIMAÇÃO (Calcula a rotação final)
        const segmentAngle = 360 / weeklyClients.length;
        const targetOffset = (randomIndex * segmentAngle) + (segmentAngle / 2);
        const targetStopAngle = 360 - targetOffset; 
        
        const currentRotationNormalized = rotation % 360;
        let diff = targetStopAngle - currentRotationNormalized;
        if (diff < 0) diff += 360; 
        
        const fullRotations = 5; 
        const finalRotation = rotation + (360 * fullRotations) + diff + 360; 
        
        setRotation(finalRotation); 
        
        // 3. Chama a API APÓS a animação (5000ms = 5s)
        setTimeout(async () => {
            const winnerFromStore = await storeSpinWheel(selectedClient.client_id); 
            
            if (winnerFromStore) {
                setWinner(winnerFromStore);
                setWinnerDialogOpen(true);
                setLastWinnerId(winnerFromStore.client_id); 
            }
            // A roleta mantém a rotação final porque setRotation foi chamado com finalRotation
            setSpinning(false); 
        }, 5000);
    };

    const redeemFreeHaircut = async (clientId: string) => {
        await storeRedeem(clientId);
    };

    // ============================================
    // 5. RENDERIZAÇÃO
    // ============================================
    
    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

            {/* Título e Botão de Configuração */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Gift className="h-6 h-8 sm:h-8 w-8 text-primary" />
                        Programa de Fidelidade
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Recompense seus clientes fiéis e faça sorteios especiais
                    </p>
                </div>
                <Button
                    onClick={() => setSettingsOpen(true)}
                    disabled={loading}
                    className="w-full sm:w-auto"
                >
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Configurar Fidelidade</span>
                    <span className="sm:hidden">Configurar</span>
                </Button>
            </div>

            {/* Cards de Métricas (Usando stats reais) */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                        <div className="text-2xl font-bold">{cutsForFree}</div>
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
                            const progress = (client.points / cutsForFree) * 100;
                            const isNearReward = client.points >= cutsForFree - 2;
                            
                            return (
                                <Card key={client.client_id} className={cn(
                                    "hover:shadow-lg transition-all",
                                    isNearReward && "ring-2 ring-green-500"
                                )}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {client.name}
                                                    {client.free_haircuts > 0 && (
                                                        <Badge className="bg-amber-500">
                                                            <Crown className="w-3 h-3 mr-1" />
                                                            {client.free_haircuts}
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
                                                    {client.points} / {cutsForFree}
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
                                            {Array.from({ length: cutsForFree }).map((_, idx) => (
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
                                                <p className="font-bold">{client.total_visits || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Última Visita:</p>
                                                <p className="font-bold">
                                                    {client.last_visit 
                                                        ? new Date(client.last_visit).toLocaleDateString('pt-BR')
                                                        : 'N/A'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                disabled={true} 
                                            >
                                                <Star className="w-4 h-4 mr-1" />
                                                Pontuação Automática
                                            </Button>
                                            {client.free_haircuts > 0 && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                                                    onClick={() => redeemFreeHaircut(client.client_id)} 
                                                    disabled={loading}
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
                                                    const correctedTextRadius = 160; 
                                                    const textX = 200 + correctedTextRadius * Math.cos((midAngle * Math.PI) / 180);
                                                    const textY = 200 + correctedTextRadius * Math.sin((midAngle * Math.PI) / 180);
                                                    
                                                    return (
                                                        <g key={client.client_id}>
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
                                                                transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`} 
                                                                style={{
                                                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
                                                                    textTransform: weeklyClients.length > 4 ? 'uppercase' : 'none',
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
                                    disabled={spinning || weeklyClients.length === 0 || loading}
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
                                                        key={client.client_id}
                                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="font-medium">{client.name}</p>
                                                            <p className="text-sm text-muted-foreground">{client.phone}</p>
                                                        </div>
                                                        <Badge variant="outline">
                                                            {new Date(client.last_visit).toLocaleDateString('pt-BR')}
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

            {/* Configurações de Fidelidade Dialog */}
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
                        <Button variant="outline" onClick={() => setSettingsOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveSettings} disabled={loading}>
                            Salvar Configurações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Vencedor da Roleta Dialog */}
            <Dialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
                <DialogContent className="max-w-md border-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 rounded-full animate-ping"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`,
                                    backgroundColor: ['#60a5fa', '#818cf8', '#c084fc', '#e879f9', '#f472b6'][Math.floor(Math.random() * 5)]
                                }}
                            />
                        ))}
                    </div>

                    <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 p-6">
                        <DialogHeader className="space-y-4">
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-40" />
                                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl animate-bounce">
                                        <Trophy className="w-10 h-10 text-white drop-shadow-lg" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center space-y-1">
                                <DialogTitle className="text-3xl font-bold">
                                    <span>🎉</span>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200"> Parabéns! </span>
                                    <span>🎉</span>
                                </DialogTitle>
                                <DialogDescription className="text-base text-indigo-200">
                                    Temos um grande vencedor!
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        {winner && (
                            <div className="py-6 space-y-4">
                                <div className="relative">
                                    <Card className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 border-2 border-blue-400/30 shadow-xl overflow-hidden">
                                        <CardContent className="relative p-6 text-center text-white space-y-4">
                                            <div className="flex justify-center">
                                                <Crown className="w-12 h-12 drop-shadow-lg text-yellow-300" />
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-3xl font-bold drop-shadow-lg">
                                                    {winner.name}
                                                </h3>
                                                <p className="text-sm text-blue-100">{winner.phone}</p>
                                            </div>

                                            <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Gift className="w-6 h-6" />
                                                    <p className="text-2xl font-bold">1 CORTE GRÁTIS!</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-indigo-200 font-medium">
                                        ✨ Sorteio realizado com sucesso! ✨
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                onClick={() => setWinnerDialogOpen(false)}
                                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-white"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Concluído!
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}