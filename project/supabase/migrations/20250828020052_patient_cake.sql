/*
  # Esquema inicial do sistema David Barber

  1. Novas Tabelas
    - `clients` - Informações dos clientes
      - `id` (uuid, chave primária)
      - `name` (text, nome do cliente)
      - `phone` (text, telefone único)
      - `email` (text, email opcional)
      - `created_at` (timestamp, data de criação)
      - `last_visit` (timestamp, última visita)
      - `total_visits` (integer, total de visitas)
      - `total_spent` (decimal, total gasto)
      - `preferences` (jsonb, preferências)
      - `notes` (text, observações)

    - `appointments` - Agendamentos
      - `id` (uuid, chave primária)
      - `client_id` (uuid, referência ao cliente)
      - `scheduled_date` (timestamp, data agendada)
      - `service_type` (text, tipo de serviço)
      - `status` (text, status do agendamento)
      - `price` (decimal, preço)
      - `payment_method` (text, forma de pagamento)
      - `created_via` (text, origem do agendamento)
      - `completed_at` (timestamp, data de conclusão)
      - `notes` (text, observações)

    - `services` - Serviços oferecidos
      - `id` (uuid, chave primária)
      - `name` (text, nome do serviço)
      - `price` (decimal, preço padrão)
      - `duration_minutes` (integer, duração em minutos)
      - `description` (text, descrição)
      - `active` (boolean, se está ativo)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuário autenticado
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  last_visit timestamptz,
  total_visits integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  preferences jsonb DEFAULT '{}',
  notes text
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  duration_minutes integer NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_date timestamptz NOT NULL,
  service_type text NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  price decimal(10,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('dinheiro', 'cartao', 'pix', 'transferencia')),
  created_via text DEFAULT 'manual' CHECK (created_via IN ('whatsapp', 'manual')),
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users" ON clients
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON services
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON appointments
  FOR ALL TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- Insert default services
INSERT INTO services (name, price, duration_minutes, description) VALUES
  ('Corte Simples', 25.00, 30, 'Corte de cabelo tradicional'),
  ('Corte + Barba', 35.00, 45, 'Corte de cabelo com barba'),
  ('Barba', 15.00, 20, 'Apenas barba'),
  ('Corte Especial', 40.00, 60, 'Corte elaborado com acabamento'),
  ('Sobrancelha', 10.00, 15, 'Design de sobrancelha'),
  ('Lavagem + Corte', 30.00, 40, 'Lavagem e corte completo')
ON CONFLICT DO NOTHING;