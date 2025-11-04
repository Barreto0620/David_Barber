// @ts-nocheck
// src/components/monthly-clients/ScheduleLimitDialog.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScheduleLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  maxSchedules: number;
  planName: string;
  planIcon: string;
  planGradient: string;
}

export function ScheduleLimitDialog({
  open,
  onOpenChange,
  currentCount,
  maxSchedules,
  planName,
  planIcon,
  planGradient,
}: ScheduleLimitDialogProps) {
  const getUpgradeInfo = () => {
    if (maxSchedules === 2) {
      return {
        hasUpgrade: true,
        nextPlan: 'VIP',
        nextLimit: 4,
        nextIcon: '👑',
        nextGradient: 'from-amber-500 to-orange-500'
      };
    }
    return { hasUpgrade: false };
  };

  const upgradeInfo = getUpgradeInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg animate-pulse">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <DialogTitle className="text-center text-3xl font-bold">
            Limite Atingido!
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Você atingiu o limite de agendamentos para o seu plano
          </DialogDescription>
        </DialogHeader>

        {/* Plan Status Card */}
        <Card className={`bg-gradient-to-br ${planGradient} text-white border-0 shadow-xl`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl shadow-lg">
                  {planIcon}
                </div>
                <div>
                  <div className="text-sm text-white/80 mb-1">Plano Atual</div>
                  <div className="text-2xl font-bold">{planName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {currentCount}/{maxSchedules}
                </div>
                <div className="text-sm text-white/80">agendamentos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Message */}
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-300 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  Você já selecionou {maxSchedules} datas!
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Para adicionar mais agendamentos, você pode:
                </p>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 mt-2 ml-4">
                  <li className="flex items-center gap-2">
                    <span className="text-orange-500">•</span>
                    Remover um agendamento existente
                  </li>
                  {upgradeInfo.hasUpgrade && (
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      Fazer upgrade para o plano {upgradeInfo.nextPlan}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      

        {/* Action Button */}
        <Button 
          onClick={() => onOpenChange(false)}
          className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Entendi
        </Button>
      </DialogContent>
    </Dialog>
  );
}