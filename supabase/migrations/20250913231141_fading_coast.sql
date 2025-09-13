/*
  # Schema completo do sistema David Barber

  1. Novas Tabelas
    - `users` - Usuários do sistema (clientes e barbeiros)
      - `id` (uuid, chave primária)
      - `email` (text, único)
      - `name` (text, nome completo)
      - `phone` (text, telefone único)
      - `role` (enum, papel do usuário)
      - `avatar_url` (text, URL do avatar)
      - `is_active` (boolean, status ativo)
      - `created_at`, `updated_at` (timestamps)

    - `barbers` - Informações específicas dos barbeiros
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência ao usuário)
      - `specialty` (text, especialidade)
      - `experience_years` (integer, anos de experiência)
      - `bio` (text, biografia)
      - `is_available` (boolean, disponibilidade)
      - `working_hours` (jsonb, horários de trabalho)

    - `services` - Serviços oferecidos
      - `id` (uuid, chave primária)
      - `name` (text, nome do serviço)
      - `description` (text, descrição)
      - `duration_minutes` (integer, duração)
      - `price` (decimal, preço)
      - `category` (text, categoria do serviço)
      - `is_active` (boolean, se está ativo)

    - `barber_services` - Relacionamento N:N entre barbeiros e serviços
      - `barber_id` (uuid, referência ao barbeiro)
      - `service_id` (uuid, referência ao serviço)

    - `appointments` - Agendamentos
      - `id` (uuid, chave primária)
      - `client_id` (uuid, referência ao cliente)
      - `barber_id` (uuid, referência ao barbeiro)
      - `service_id` (uuid, referência ao serviço)
      - `appointment_date` (date, data do agendamento)
      - `appointment_time` (time, horário)
      - `status` (enum, status do agendamento)
      - `notes` (text, observações)
      - `created_via` (enum, origem do agendamento)

    - `payments` - Controle financeiro
      - `id` (uuid, chave primária)
      - `appointment_id` (uuid, referência ao agendamento)
      - `amount` (decimal, valor)
      - `payment_method` (enum, método de pagamento)
      - `payment_status` (enum, status do pagamento)
      - `paid_at` (timestamp, data do pagamento)
      - `transaction_id` (text, ID da transação)

    - `reviews` - Avaliações
      - `id` (uuid, chave primária)
      - `client_id` (uuid, referência ao cliente)
      - `barber_id` (uuid, referência ao barbeiro)
      - `appointment_id` (uuid, referência ao agendamento)
      - `rating` (integer, nota de 1 a 5)
      - `comment` (text, comentário)

    - `business_settings` - Configurações do negócio
      - `id` (uuid, chave primária)
      - `business_name` (text, nome da barbearia)
      - `business_phone` (text, telefone)
      - `business_email` (text, email)
      - `address` (jsonb, endereço completo)
      - `working_hours` (jsonb, horários de funcionamento)
      - `settings` (jsonb, configurações gerais)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas específicas por tipo de usuário
    - Proteção de dados sensíveis
*/

-- Criar tipos ENUM
CREATE TYPE user_role AS ENUM ('client', 'barber', 'admin');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'pix', 'transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE appointment_source AS ENUM ('whatsapp', 'manual', 'online', 'phone');

-- Tabela de usuários (clientes e barbeiros)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  role user_role DEFAULT 'client',
  avatar_url text,
  is_active boolean DEFAULT true,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de barbeiros (informações específicas)
CREATE TABLE IF NOT EXISTS barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialty text,
  experience_years integer DEFAULT 0,
  bio text,
  is_available boolean DEFAULT true,
  working_hours jsonb DEFAULT '{}',
  commission_rate decimal(5,2) DEFAULT 50.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  price decimal(10,2) NOT NULL,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de relacionamento barbeiro-serviços (N:N)
CREATE TABLE IF NOT EXISTS barber_services (
  barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (barber_id, service_id)
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  notes text,
  created_via appointment_source DEFAULT 'manual',
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint para evitar agendamentos duplicados no mesmo horário
  UNIQUE(barber_id, appointment_date, appointment_time)
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  paid_at timestamptz,
  transaction_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  appointment_id uuid UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de configurações do negócio
CREATE TABLE IF NOT EXISTS business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'David Barber',
  business_phone text,
  business_email text,
  address jsonb DEFAULT '{}',
  working_hours jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de estatísticas (para cache de métricas)
CREATE TABLE IF NOT EXISTS statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_appointments integer DEFAULT 0,
  completed_appointments integer DEFAULT 0,
  cancelled_appointments integer DEFAULT 0,
  total_revenue decimal(10,2) DEFAULT 0,
  barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(date, barber_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_barbers_user_id ON barbers(user_id);
CREATE INDEX IF NOT EXISTS idx_barbers_available ON barbers(is_available);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_id ON appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_statistics_updated_at BEFORE UPDATE ON statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION update_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar estatísticas quando um agendamento for modificado
  INSERT INTO statistics (date, barber_id, total_appointments, completed_appointments, cancelled_appointments, total_revenue)
  SELECT 
    NEW.appointment_date,
    NEW.barber_id,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'completed'), 0) as total_revenue
  FROM appointments a
  LEFT JOIN payments p ON a.id = p.appointment_id
  WHERE a.appointment_date = NEW.appointment_date 
    AND a.barber_id = NEW.barber_id
  GROUP BY NEW.appointment_date, NEW.barber_id
  ON CONFLICT (date, barber_id) 
  DO UPDATE SET
    total_appointments = EXCLUDED.total_appointments,
    completed_appointments = EXCLUDED.completed_appointments,
    cancelled_appointments = EXCLUDED.cancelled_appointments,
    total_revenue = EXCLUDED.total_revenue,
    updated_at = now();
    
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar estatísticas
CREATE TRIGGER update_appointment_statistics 
  AFTER INSERT OR UPDATE ON appointments 
  FOR EACH ROW EXECUTE FUNCTION update_statistics();

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para a tabela barbers
CREATE POLICY "Barbers can view their own profile" ON barbers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Barbers can update their own profile" ON barbers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Everyone can view active barbers" ON barbers
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage all barbers" ON barbers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para a tabela services
CREATE POLICY "Everyone can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para a tabela barber_services
CREATE POLICY "Everyone can view barber services" ON barber_services
  FOR SELECT USING (true);

CREATE POLICY "Barbers can manage their own services" ON barber_services
  FOR ALL USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all barber services" ON barber_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para a tabela appointments
CREATE POLICY "Clients can view their own appointments" ON appointments
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create appointments" ON appointments
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own appointments" ON appointments
  FOR UPDATE USING (
    client_id = auth.uid() AND 
    status IN ('scheduled', 'confirmed')
  );

CREATE POLICY "Barbers can view their appointments" ON appointments
  FOR SELECT USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Barbers can update their appointments" ON appointments
  FOR UPDATE USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para a tabela payments
CREATE POLICY "Clients can view their own payments" ON payments
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Barbers can view payments for their appointments" ON payments
  FOR SELECT USING (
    appointment_id IN (
      SELECT a.id FROM appointments a
      JOIN barbers b ON a.barber_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para a tabela reviews
CREATE POLICY "Clients can view and create their own reviews" ON reviews
  FOR ALL USING (client_id = auth.uid());

CREATE POLICY "Barbers can view reviews about them" ON reviews
  FOR SELECT USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view public reviews" ON reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para a tabela business_settings
CREATE POLICY "Everyone can view business settings" ON business_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage business settings" ON business_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para a tabela statistics
CREATE POLICY "Barbers can view their own statistics" ON statistics
  FOR SELECT USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all statistics" ON statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Inserir dados iniciais

-- Configurações do negócio
INSERT INTO business_settings (
  business_name, 
  business_phone, 
  business_email,
  address,
  working_hours,
  settings
) VALUES (
  'David Barber',
  '(11) 99999-0000',
  'contato@davidbarber.com',
  '{"street": "Rua das Flores, 123", "city": "São Paulo", "state": "SP", "zip": "01234-567"}',
  '{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}, "wednesday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "08:00", "close": "20:00"}, "friday": {"open": "08:00", "close": "20:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "sunday": {"closed": true}}',
  '{"appointment_duration": 30, "advance_booking_days": 30, "cancellation_hours": 2}'
) ON CONFLICT DO NOTHING;

-- Serviços padrão
INSERT INTO services (name, description, duration_minutes, price, category) VALUES
  ('Corte Simples', 'Corte de cabelo tradicional masculino', 30, 25.00, 'corte'),
  ('Corte + Barba', 'Corte de cabelo com barba completa', 45, 35.00, 'combo'),
  ('Barba', 'Aparar e modelar barba', 20, 15.00, 'barba'),
  ('Corte Especial', 'Corte elaborado com acabamento premium', 60, 40.00, 'corte'),
  ('Sobrancelha', 'Design e limpeza de sobrancelha masculina', 15, 10.00, 'acabamento'),
  ('Lavagem + Corte', 'Lavagem completa com corte', 40, 30.00, 'combo'),
  ('Corte Infantil', 'Corte especial para crianças até 12 anos', 25, 20.00, 'corte'),
  ('Hidratação', 'Tratamento hidratante para cabelo', 30, 25.00, 'tratamento')
ON CONFLICT DO NOTHING;

-- Views úteis para relatórios
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.notes,
  a.created_via,
  c.name as client_name,
  c.phone as client_phone,
  c.email as client_email,
  u.name as barber_name,
  s.name as service_name,
  s.duration_minutes,
  s.price as service_price,
  p.amount as paid_amount,
  p.payment_method,
  p.payment_status,
  r.rating,
  r.comment as review_comment
FROM appointments a
JOIN users c ON a.client_id = c.id
JOIN barbers b ON a.barber_id = b.id
JOIN users u ON b.user_id = u.id
JOIN services s ON a.service_id = s.id
LEFT JOIN payments p ON a.id = p.appointment_id
LEFT JOIN reviews r ON a.id = r.appointment_id;

CREATE OR REPLACE VIEW daily_revenue AS
SELECT 
  appointment_date,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
  SUM(s.price) FILTER (WHERE status = 'completed') as potential_revenue,
  SUM(p.amount) FILTER (WHERE p.payment_status = 'completed') as actual_revenue
FROM appointments a
JOIN services s ON a.service_id = s.id
LEFT JOIN payments p ON a.id = p.appointment_id
GROUP BY appointment_date
ORDER BY appointment_date DESC;

CREATE OR REPLACE VIEW barber_performance AS
SELECT 
  u.name as barber_name,
  COUNT(a.id) as total_appointments,
  COUNT(a.id) FILTER (WHERE a.status = 'completed') as completed_appointments,
  AVG(r.rating) as average_rating,
  SUM(p.amount) FILTER (WHERE p.payment_status = 'completed') as total_revenue
FROM barbers b
JOIN users u ON b.user_id = u.id
LEFT JOIN appointments a ON b.id = a.barber_id
LEFT JOIN payments p ON a.id = p.appointment_id
LEFT JOIN reviews r ON b.id = r.barber_id
GROUP BY b.id, u.name
ORDER BY total_revenue DESC NULLS LAST;