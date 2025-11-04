// types/loyalty.ts
// Conteúdo para o arquivo types/loyalty.ts

export interface LoyaltySettings {
  id: string;
  professional_id: string;
  cuts_for_free: number;
  program_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyPoints {
  id: string;
  client_id: string;
  professional_id: string;
  points: number;
  free_haircuts: number;
  total_earned_points: number;
  total_redeemed_haircuts: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyHistory {
  id: string;
  loyalty_points_id: string;
  client_id: string;
  professional_id: string;
  action_type: 'earned' | 'redeemed' | 'wheel_won' | 'expired' | 'adjusted';
  points_change: number;
  free_haircuts_change: number;
  appointment_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface LoyaltyWheelSpin {
  id: string;
  professional_id: string;
  winner_client_id: string;
  // O tipo de eligible_clients foi ajustado para refletir o JSONB array de objetos
  eligible_clients: Array<{ id: string; name: string }>; 
  spin_date: string;
  notes: string | null;
  // 🔥 Adicionado para corrigir o erro PGRST204 que apareceu no log
  prize_name: string | null; 
}

// O tipo LoyaltyClient representa o retorno da view 'loyalty_clients_view'
export interface LoyaltyClient {
  client_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  total_visits: number;
  total_spent: number;
  last_visit: string | null;
  professional_id: string;
  points: number;
  free_haircuts: number;
  total_earned_points: number;
  total_redeemed_haircuts: number;
  loyalty_points_id: string | null;
}

export interface LoyaltyStats {
  totalPoints: number;
  totalFreeHaircuts: number;
  clientsNearReward: number;
  activeClients: number;
  weeklyClients: number;
}