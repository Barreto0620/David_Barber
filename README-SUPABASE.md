# Configuração do Supabase - David Barber

## 📋 Visão Geral

Este documento descreve a estrutura completa do banco de dados Supabase para o sistema David Barber, incluindo tabelas, relacionamentos, políticas de segurança e queries otimizadas.

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. **users** - Usuários do Sistema
- **Propósito**: Armazena todos os usuários (clientes, barbeiros, admins)
- **Campos principais**: 
  - `id` (UUID, PK)
  - `email` (único)
  - `name`, `phone` (único)
  - `role` (client/barber/admin)
  - `avatar_url`, `preferences`

#### 2. **barbers** - Informações dos Barbeiros
- **Propósito**: Dados específicos dos profissionais
- **Relacionamento**: 1:1 com `users`
- **Campos principais**:
  - `user_id` (FK para users)
  - `specialty`, `experience_years`
  - `working_hours` (JSONB)
  - `commission_rate`

#### 3. **services** - Serviços Oferecidos
- **Propósito**: Catálogo de serviços da barbearia
- **Campos principais**:
  - `name`, `description`
  - `duration_minutes`, `price`
  - `category`, `is_active`

#### 4. **appointments** - Agendamentos
- **Propósito**: Controle de agendamentos
- **Relacionamentos**: 
  - `client_id` → `users.id`
  - `barber_id` → `barbers.id`
  - `service_id` → `services.id`
- **Campos principais**:
  - `appointment_date`, `appointment_time`
  - `status` (scheduled/confirmed/in_progress/completed/cancelled/no_show)
  - `created_via` (whatsapp/manual/online/phone)

#### 5. **payments** - Controle Financeiro
- **Propósito**: Gestão de pagamentos
- **Relacionamento**: 1:1 com `appointments`
- **Campos principais**:
  - `amount`, `payment_method`
  - `payment_status`, `paid_at`
  - `transaction_id`

#### 6. **reviews** - Avaliações
- **Propósito**: Sistema de avaliações
- **Relacionamentos**: 
  - `client_id` → `users.id`
  - `barber_id` → `barbers.id`
  - `appointment_id` → `appointments.id`
- **Campos principais**:
  - `rating` (1-5)
  - `comment`, `is_public`

### Tabelas Auxiliares

#### 7. **barber_services** - Relacionamento N:N
- **Propósito**: Define quais serviços cada barbeiro oferece
- **Chaves**: `barber_id` + `service_id` (PK composta)

#### 8. **business_settings** - Configurações
- **Propósito**: Configurações gerais da barbearia
- **Campos JSONB**: `address`, `working_hours`, `settings`

#### 9. **statistics** - Cache de Estatísticas
- **Propósito**: Performance em relatórios
- **Campos**: métricas diárias por barbeiro

## 🔐 Políticas de Segurança (RLS)

### Usuários (users)
- ✅ Usuários podem ver/editar próprio perfil
- ✅ Admins podem gerenciar todos os usuários

### Barbeiros (barbers)
- ✅ Barbeiros podem gerenciar próprio perfil
- ✅ Todos podem ver barbeiros disponíveis
- ✅ Admins têm acesso total

### Agendamentos (appointments)
- ✅ Clientes veem apenas seus agendamentos
- ✅ Barbeiros veem seus agendamentos
- ✅ Clientes podem criar/editar agendamentos próprios
- ✅ Admins têm acesso total

### Pagamentos (payments)
- ✅ Clientes veem pagamentos de seus agendamentos
- ✅ Barbeiros veem pagamentos de seus atendimentos
- ✅ Admins gerenciam todos os pagamentos

### Avaliações (reviews)
- ✅ Clientes podem criar/editar próprias avaliações
- ✅ Barbeiros podem ver avaliações sobre eles
- ✅ Todos podem ver avaliações públicas

## 📊 Views e Relatórios

### 1. **appointment_details**
Visão completa dos agendamentos com dados relacionados:
```sql
SELECT * FROM appointment_details 
WHERE appointment_date = '2024-01-15';
```

### 2. **daily_revenue**
Receita diária consolidada:
```sql
SELECT * FROM daily_revenue 
WHERE appointment_date >= '2024-01-01'
ORDER BY appointment_date DESC;
```

### 3. **barber_performance**
Performance dos barbeiros:
```sql
SELECT * FROM barber_performance 
ORDER BY total_revenue DESC;
```

## 🚀 Configuração e Deploy

### 1. Executar Migration
```bash
# No painel do Supabase, vá em SQL Editor
# Cole o conteúdo do arquivo: supabase/migrations/create_complete_schema.sql
# Execute o script
```

### 2. Configurar Variáveis de Ambiente
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Verificar Configuração
```typescript
import { supabase } from '@/lib/supabase-client';

// Testar conexão
const { data, error } = await supabase
  .from('business_settings')
  .select('*')
  .single();
```

## 📈 Queries Otimizadas

### Dashboard Metrics
```typescript
import { getDashboardMetrics } from '@/lib/supabase-queries';

const metrics = await getDashboardMetrics();
// Retorna: todayAppointments, todayRevenue, weeklyRevenue, etc.
```

### Agendamentos por Data
```typescript
import { getAppointmentsByDate } from '@/lib/supabase-queries';

const appointments = await getAppointmentsByDate('2024-01-15', barberId);
```

### Barbeiros Disponíveis
```typescript
import { getAvailableBarbers } from '@/lib/supabase-queries';

const barbers = await getAvailableBarbers();
// Inclui serviços que cada barbeiro oferece
```

## 🔧 Funcionalidades Automáticas

### 1. **Timestamps Automáticos**
- `created_at` e `updated_at` são gerenciados automaticamente
- Triggers atualizam `updated_at` em todas as modificações

### 2. **Estatísticas em Tempo Real**
- Trigger atualiza tabela `statistics` automaticamente
- Cache de métricas para performance

### 3. **Constraints de Integridade**
- Evita agendamentos duplicados no mesmo horário
- Validações de rating (1-5)
- Chaves estrangeiras com CASCADE apropriado

## 🎯 Próximos Passos

1. **Executar o script SQL** no Supabase
2. **Configurar autenticação** (email/senha)
3. **Testar políticas RLS** com diferentes usuários
4. **Implementar queries** no frontend
5. **Configurar webhooks** para notificações

## 📞 Suporte

Para dúvidas sobre a implementação:
- Documentação oficial: [supabase.com/docs](https://supabase.com/docs)
- Verificar logs no painel do Supabase
- Testar queries no SQL Editor

---

**Estrutura criada para escalabilidade e performance, seguindo as melhores práticas do Supabase e PostgreSQL.**