
-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'technical', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'viewer'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check user role (using security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN required_role = 'viewer' THEN 
      public.get_user_role(user_id) IN ('viewer', 'technical', 'admin')
    WHEN required_role = 'technical' THEN 
      public.get_user_role(user_id) IN ('technical', 'admin')
    WHEN required_role = 'admin' THEN 
      public.get_user_role(user_id) = 'admin'
    ELSE false
  END;
$$;

-- Add admin policy for profiles (after function creation)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for existing tables to include role-based access
CREATE POLICY "Technical users can modify processes" ON public.processes
  FOR ALL USING (public.has_role(auth.uid(), 'technical'));

CREATE POLICY "Technical users can modify municipalities" ON public.municipalities
  FOR ALL USING (public.has_role(auth.uid(), 'technical'));

CREATE POLICY "Technical users can modify regional_nuclei" ON public.regional_nuclei
  FOR ALL USING (public.has_role(auth.uid(), 'technical'));

-- Public read access for main tables
CREATE POLICY "Public can view processes" ON public.processes
  FOR SELECT USING (true);

CREATE POLICY "Public can view municipalities" ON public.municipalities
  FOR SELECT USING (true);

CREATE POLICY "Public can view regional_nuclei" ON public.regional_nuclei
  FOR SELECT USING (true);

-- Update existing notifications table to work with our system
-- Since recipient_user_id is integer, we need to handle this differently
CREATE POLICY "Users can view notifications" ON public.notifications
  FOR SELECT USING (
    is_public = true OR
    public.has_role(auth.uid(), 'technical')
  );

-- Function to create process expiration notifications
CREATE OR REPLACE FUNCTION public.create_expiration_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  process_record RECORD;
  days_until_expiration INTEGER;
  notification_message TEXT;
BEGIN
  -- Check for processes expiring in 30, 15, or 7 days
  FOR process_record IN
    SELECT id, process_number, object, vigencia_date
    FROM public.processes
    WHERE vigencia_date IS NOT NULL
  LOOP
    days_until_expiration := vigencia_date - CURRENT_DATE;
    
    IF days_until_expiration IN (30, 15, 7) THEN
      notification_message := format(
        'O processo %s (%s) vence em %s dias (%s)',
        process_record.process_number,
        process_record.object,
        days_until_expiration,
        process_record.vigencia_date
      );
      
      INSERT INTO public.notifications (message, type, is_public)
      VALUES (notification_message, 'important', true);
    END IF;
    
    IF days_until_expiration < 0 THEN
      notification_message := format(
        'O processo %s (%s) venceu em %s (há %s dias)',
        process_record.process_number,
        process_record.object,
        process_record.vigencia_date,
        ABS(days_until_expiration)
      );
      
      INSERT INTO public.notifications (message, type, is_public)
      VALUES (notification_message, 'critical', true);
    END IF;
  END LOOP;
END;
$$;

-- Create system settings table
CREATE TABLE public.system_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_settings
CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technical users can view settings" ON public.system_settings
  FOR SELECT USING (public.has_role(auth.uid(), 'technical'));

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('organization_name', '"Transfer Radar SC"', 'Nome da organização'),
('organization_description', '"Sistema de Transferências Financeiras de Santa Catarina"', 'Descrição da organização'),
('developer_credits', '"Portal desenvolvido pela GEINFRA"', 'Créditos do desenvolvedor'),
('notification_intervals', '[30, 15, 7]', 'Intervalos de notificação em dias antes do vencimento');
