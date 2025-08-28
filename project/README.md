# David Barber Management System

Sistema completo de gestão para barbearia com integração WhatsApp Business e automação n8n.

## 🚀 Características

- **Dashboard Completo**: Métricas em tempo real, gráficos de receita, status dos agendamentos
- **Gestão de Agendamentos**: Calendario completo, controle de status, confirmação de serviços
- **Base de Clientes**: Perfis detalhados, histórico de visitas, preferências
- **Controle Financeiro**: Relatórios detalhados, análise por período, formas de pagamento
- **API para n8n**: Endpoints prontos para integração com WhatsApp Business

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Estado**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Autenticação**: Supabase Auth

## 📋 Funcionalidades

### Dashboard
- Receita diária/semanal/mensal
- Agendamentos do dia
- Taxa de conclusão
- Gráfico de receita dos últimos 7 dias
- Status em tempo real

### Agendamentos
- Criação manual de agendamentos
- Visualização por data
- Filtros por status (agendado, em andamento, concluído, cancelado)
- Confirmação de serviços com forma de pagamento
- Notas e observações

### Clientes
- Base completa de clientes
- Histórico de visitas
- Total gasto por cliente
- Preferências e observações
- Busca por nome ou telefone

### Financeiro
- Receita por período (hoje, semana, mês, ano)
- Análise por serviço
- Distribuição por forma de pagamento
- Exportação de relatórios
- Métricas de crescimento

## 🔌 API Endpoints para n8n

### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento (WhatsApp)
- `GET /api/appointments/today` - Agendamentos de hoje
- `PUT /api/appointments/[id]/confirm` - Confirmar serviço

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar/atualizar cliente

### Relatórios
- `GET /api/revenue/summary` - Resumo financeiro

### Notificações
- `POST /api/notifications/send` - Enviar notificações

## 📊 Schema do Banco de Dados

### Tabela `clients`
```sql
- id (uuid, primary key)
- name (text)
- phone (text, unique)  
- email (text, optional)
- created_at (timestamp)
- last_visit (timestamp)
- total_visits (integer)
- total_spent (decimal)
- preferences (jsonb)
- notes (text)
```

### Tabela `appointments`
```sql
- id (uuid, primary key)
- client_id (uuid, foreign key)
- scheduled_date (timestamp)
- service_type (text)
- status (scheduled, in_progress, completed, cancelled)
- price (decimal)
- payment_method (text)
- created_via (whatsapp, manual)
- completed_at (timestamp)
- notes (text)
```

### Tabela `services`
```sql
- id (uuid, primary key)
- name (text)
- price (decimal)
- duration_minutes (integer)
- description (text)
- active (boolean)
```

## 🚀 Configuração

### Pré-requisitos
- Node.js 18+
- Conta no Supabase

### Instalação
```bash
npm install
```

### Configuração do Ambiente
Crie um arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Executar Desenvolvimento
```bash
npm run dev
```

### Build para Produção
```bash
npm run build
```

## 🔐 Autenticação e Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) configurado
- Proteção de API endpoints
- Validação de dados de entrada

## 📱 Integração WhatsApp (via n8n)

O sistema está preparado para receber webhooks do n8n que processam mensagens do WhatsApp Business:

1. **Recebimento de mensagem** → n8n processa → `POST /api/appointments`
2. **Confirmação de agendamento** → n8n notifica cliente
3. **Serviço concluído** → `POST /api/notifications/send` → n8n envia confirmação

## 📈 Métricas e Relatórios

- Receita por período
- Serviços mais procurados  
- Formas de pagamento
- Taxa de conclusão de agendamentos
- Análise de crescimento
- Exportação de dados

## 🎨 Design

- Interface profissional para barbearia
- Modo escuro/claro
- Responsive design (mobile-first)
- Animações suaves
- Localização para português brasileiro
- Formatação de moeda em Real (R$)

## 📄 Licença

Este projeto é de propriedade da David Barber e está protegido por direitos autorais.