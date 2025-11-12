// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
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
    // 3. VARIÁVEIS COMPUTADAS - CORRIGIDO COM useMemo
    // ============================================
    const totalPoints = stats?.totalPoints || 0;
    const totalFreeHaircuts = stats?.totalFreeHaircuts || 0;
    const clientsNearReward = stats?.clientsNearReward || 0;
    
    // 🔥 CORREÇÃO: Usar useMemo ao invés de useCallback
    const weeklyClients = useMemo(() => {
        console.log('🔍 Calculando weeklyClients. Total de clientes:', clients?.length || 0);
        
        if (!clients || clients.length === 0) {
            console.log('⚠️ Nenhum cliente disponível');
            return [];
        }

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        
        const filtered = clients.filter(client => {
            if (!client.last_visit) {
                return false;
            }
            
            const lastVisit = new Date(client.last_visit);
            const isEligible = lastVisit >= weekAgo;
            
            if (isEligible) {
                console.log('✅ Cliente elegível:', client.name, '- Última visita:', lastVisit.toLocaleDateString('pt-BR'));
            }
            
            return isEligible;
        }).sort((a, b) => a.client_id.localeCompare(b.client_id));
        
        console.log('📊 Total de clientes elegíveis:', filtered.length);
        return filtered;
    }, [clients]); // Recalcula quando 'clients' mudar

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
        
        const segmentAngle = 360 / weeklyClients.length;
        const targetOffset = (randomIndex * segmentAngle) + (segmentAngle / 2);
        const targetStopAngle = 360 - targetOffset; 
        
        const currentRotationNormalized = rotation % 360;
        let diff = targetStopAngle - currentRotationNormalized;
        if (diff < 0) diff += 360; 
        
        const fullRotations = 5; 
        const finalRotation = rotation + (360 * fullRotations) + diff + 360; 
        
        setRotation(finalRotation); 
        
        setTimeout(async () => {
            const winnerFromStore = await storeSpinWheel(selectedClient.client_id); 
            
            if (winnerFromStore) {
                setWinner(winnerFromStore);
                setWinnerDialogOpen(true);
                setLastWinnerId(winnerFromStore.client_id); 
            }
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
        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 pb-20 sm:pb-6">

            {/* Título e Botão de Configuração - Otimizado */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Gift className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
                        <span className="truncate">Programa de Fidelidade</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Recompense seus clientes fiéis e faça sorteios especiais
                    </p>
                </div>
                <Button
                    onClick={() => setSettingsOpen(true)}
                    disabled={loading}
                    className="w-full sm:w-auto h-11 text-base active:scale-95 transition-transform touch-manipulation"
                    size="lg"
                >
                    <Settings className="h-5 w-5 sm:mr-2" />
                    <span className="hidden xs:inline">Configurar Fidelidade</span>
                    <span className="xs:hidden">Configurar</span>
                </Button>
            </div>

            {/* Cards de Métricas - Grid Responsivo */}
            <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">Total de Pontos</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="text-xl sm:text-2xl font-bold">{totalPoints}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Acumulados</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">Cortes Grátis</CardTitle>
                        <Trophy className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="text-xl sm:text-2xl font-bold">{totalFreeHaircuts}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Disponíveis</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">Perto da Recompensa</CardTitle>
                        <Target className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="text-xl sm:text-2xl font-bold">{clientsNearReward}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Faltam ≤2</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">Configuração</CardTitle>
                        <Award className="h-4 w-4 text-primary flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="text-xl sm:text-2xl font-bold">{cutsForFree}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Cortes = 1 grátis</p>
                    </CardContent>
                </Card>
            </div>

            {/* Debug Info - Temporário */}
            {process.env.NODE_ENV === 'development' && (
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                        <p className="text-sm font-mono">
                            🐛 Debug: {clients?.length || 0} clientes total | {weeklyClients.length} elegíveis esta semana
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Tabs - Otimizado */}
            <Tabs defaultValue="cards" className="space-y-3 sm:space-y-4">
                <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
                    <TabsTrigger value="cards" className="text-xs sm:text-sm gap-1 sm:gap-2 py-2.5">
                        <Star className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden xs:inline">Cartões Fidelidade</span>
                        <span className="xs:hidden">Cartões</span>
                    </TabsTrigger>
                    <TabsTrigger value="wheel" className="text-xs sm:text-sm gap-1 sm:gap-2 py-2.5">
                        <Sparkles className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden xs:inline">Roleta da Sorte</span>
                        <span className="xs:hidden">Roleta</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Cartões de Fidelidade */}
                <TabsContent value="cards" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                    {clients.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-muted-foreground">Nenhum cliente com programa de fidelidade ainda.</p>
                                <p className="text-sm text-muted-foreground mt-2">Os clientes receberão pontos automaticamente ao finalizar atendimentos.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {clients.map((client) => {
                                const progress = (client.points / cutsForFree) * 100;
                                const isNearReward = client.points >= cutsForFree - 2;
                                
                                return (
                                    <Card key={client.client_id} className={cn(
                                        "hover:shadow-lg transition-all shadow-sm",
                                        isNearReward && "ring-2 ring-green-500"
                                    )}>
                                        <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                                                        <span className="truncate">{client.name}</span>
                                                        {client.free_haircuts > 0 && (
                                                            <Badge className="bg-amber-500 text-xs flex-shrink-0">
                                                                <Crown className="w-3 h-3 mr-1" />
                                                                {client.free_haircuts}
                                                            </Badge>
                                                        )}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs sm:text-sm truncate">
                                                        {client.phone}
                                                    </CardDescription>
                                                </div>
                                                {isNearReward && (
                                                    <Badge variant="outline" className="border-green-500 text-green-500 text-[10px] sm:text-xs flex-shrink-0">
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        <span className="hidden xs:inline">Quase lá!</span>
                                                        <span className="xs:hidden">!</span>
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                                            {/* Barra de Progresso */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs sm:text-sm">
                                                    <span className="text-muted-foreground">Progresso:</span>
                                                    <span className="font-bold">
                                                        {client.points} / {cutsForFree}
                                                    </span>
                                                </div>
                                                <div className="h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Grid de Estrelas */}
                                            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                                                {Array.from({ length: cutsForFree }).map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={cn(
                                                            "aspect-square rounded-md sm:rounded-lg flex items-center justify-center transition-all",
                                                            idx < client.points
                                                                ? "bg-primary text-primary-foreground shadow-md"
                                                                : "bg-muted"
                                                        )}
                                                    >
                                                        {idx < client.points && <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Estatísticas */}
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs sm:text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Total de Visitas:</p>
                                                    <p className="font-bold">{client.total_visits || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Última Visita:</p>
                                                    <p className="font-bold truncate">
                                                        {client.last_visit 
                                                            ? new Date(client.last_visit).toLocaleDateString('pt-BR', {
                                                                day: '2-digit',
                                                                month: '2-digit'
                                                            })
                                                            : 'N/A'
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Botões de Ação */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                                                    disabled={true} 
                                                >
                                                    <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    <span className="hidden xs:inline">Pontuação Automática</span>
                                                    <span className="xs:hidden">Automático</span>
                                                </Button>
                                                {client.free_haircuts > 0 && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="flex-1 text-xs sm:text-sm h-9 sm:h-10 bg-amber-500 hover:bg-amber-600 active:scale-95 transition-transform touch-manipulation"
                                                        onClick={() => redeemFreeHaircut(client.client_id)} 
                                                        disabled={loading}
                                                    >
                                                        <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                        Resgatar
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Tab: Roleta da Sorte */}
                <TabsContent value="wheel" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                    <Card className="shadow-sm">
                        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-4">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                                <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                                <span className="truncate">Roleta da Sorte Semanal</span>
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Sorteie um cliente que visitou a barbearia esta semana e ganhe 1 corte grátis!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                                {/* Card Info Clientes Elegíveis */}
                                <Card className="w-full bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                                                {weeklyClients.length} clientes elegíveis esta semana
                                            </p>
                                            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 truncate">
                                                Visitaram nos últimos 7 dias
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Roleta - Responsiva */}
                                <div className="relative w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[400px] md:max-w-[450px] aspect-square flex items-center justify-center my-4 sm:my-8">
                                    {weeklyClients.length > 0 ? (
                                        <>
                                            <div className="absolute w-[95%] h-[95%] rounded-full border-2 sm:border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] sm:shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse" />
                                            
                                            <svg 
                                                className="w-[90%] h-[90%] absolute" 
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
                                                                fontSize={weeklyClients.length > 6 ? "11" : "13"}
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
                                                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
                                            </div>
                                            
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 sm:-translate-y-6 z-30">
                                                <div className="relative">
                                                    <div className="w-0 h-0 border-l-[20px] sm:border-l-[30px] border-l-transparent border-r-[20px] sm:border-r-[30px] border-r-transparent border-t-[40px] sm:border-t-[60px] border-t-red-600 drop-shadow-2xl" />
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] sm:border-l-[24px] border-l-transparent border-r-[16px] sm:border-r-[24px] border-r-transparent border-t-[32px] sm:border-t-[48px] border-t-red-500" />
                                                </div>
                                            </div>
                                            
                                            {spinning && (
                                                <div className="absolute w-full h-full rounded-full bg-gradient-radial from-amber-500/20 to-transparent animate-ping pointer-events-none" />
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full rounded-full border-4 sm:border-8 border-muted bg-muted/20 flex items-center justify-center">
                                            <p className="text-muted-foreground text-center text-sm sm:text-base md:text-lg px-4">
                                                Nenhum cliente<br />elegível
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Botão Girar */}
                                <Button
                                    size="lg"
                                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold active:scale-95 transition-transform touch-manipulation"
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

                                {/* Lista de Clientes Elegíveis */}
                                <Card className="w-full shadow-sm">
                                    <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                                        <CardTitle className="text-base sm:text-lg">Clientes Elegíveis</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                                        {weeklyClients.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-4 text-sm">
                                                Nenhum cliente visitou esta semana
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {weeklyClients.map((client) => (
                                                    <div
                                                        key={client.client_id}
                                                        className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg gap-2"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm sm:text-base truncate">{client.name}</p>
                                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{client.phone}</p>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">
                                                            {new Date(client.last_visit).toLocaleDateString('pt-BR', {
                                                                day: '2-digit',
                                                                month: '2-digit'
                                                            })}
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

            {/* Dialog: Configurações de Fidelidade */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md mx-auto rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">Configurações de Fidelidade</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Defina quantos cortes são necessários para ganhar 1 grátis
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Cortes para ganhar 1 grátis</Label>
                            <Input
                                type="number"
                                min="5"
                                max="20"
                                value={tempCutsForFree}
                                onChange={(e) => setTempCutsForFree(parseInt(e.target.value) || 10)}
                                className="h-11 text-base"
                            />
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Recomendado: entre 8 e 12 cortes
                            </p>
                        </div>

                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                            <CardContent className="p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                                    <strong>Exemplo:</strong> Se configurar para {tempCutsForFree} cortes, o cliente
                                    precisará fazer {tempCutsForFree} cortes para ganhar 1 grátis.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={() => setSettingsOpen(false)} 
                            disabled={loading}
                            className="w-full sm:w-auto h-11 active:scale-95 transition-transform touch-manipulation"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSaveSettings} 
                            disabled={loading}
                            className="w-full sm:w-auto h-11 active:scale-95 transition-transform touch-manipulation"
                        >
                            Salvar Configurações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Vencedor da Roleta - Otimizado */}
            <Dialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md mx-auto border-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-0 overflow-hidden rounded-lg">
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
                    
                    <div className="relative z-10 p-4 sm:p-6">
                        <DialogHeader className="space-y-3 sm:space-y-4">
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-40" />
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl animate-bounce">
                                        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center space-y-1">
                                <DialogTitle className="text-2xl sm:text-3xl font-bold">
                                    <span>🎉</span>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200"> Parabéns! </span>
                                    <span>🎉</span>
                                </DialogTitle>
                                <DialogDescription className="text-sm sm:text-base text-indigo-200">
                                    Temos um grande vencedor!
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        {winner && (
                            <div className="py-4 sm:py-6 space-y-3 sm:space-y-4">
                                <div className="relative">
                                    <Card className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 border-2 border-blue-400/30 shadow-xl overflow-hidden">
                                        <CardContent className="relative p-4 sm:p-6 text-center text-white space-y-3 sm:space-y-4">
                                            <div className="flex justify-center">
                                                <Crown className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-lg text-yellow-300" />
                                            </div>

                                            <div className="space-y-1 sm:space-y-2">
                                                <h3 className="text-2xl sm:text-3xl font-bold drop-shadow-lg break-words">
                                                    {winner.name}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-blue-100">{winner.phone}</p>
                                            </div>

                                            <div className="relative p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    <p className="text-xl sm:text-2xl font-bold">1 CORTE GRÁTIS!</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="text-center">
                                    <p className="text-xs sm:text-sm text-indigo-200 font-medium">
                                        ✨ Sorteio realizado com sucesso! ✨
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                onClick={() => setWinnerDialogOpen(false)}
                                className="w-full h-11 sm:h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-white active:scale-95 transition-transform touch-manipulation"
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