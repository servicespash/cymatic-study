-- Create app_config table
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_number TEXT,
    support_email TEXT,
    mobile_money_details TEXT,
    merchant_id TEXT,
    support_price TEXT,
    about_app TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to app_config" ON public.app_config
    FOR SELECT USING (true);

-- Insert default config
INSERT INTO public.app_config (
    whatsapp_number,
    support_email,
    mobile_money_details,
    merchant_id,
    support_price,
    about_app
) VALUES (
    '+256768715065',
    'latifisabirye123@gmail.com',
    'Send 5,000 UGX to +256 768 715065 (MTN) - Latif Sabirye. After payment, send a screenshot to WhatsApp for instant activation.',
    '7064464',
    '5,000 UGX',
    'Cymatic Study is an advanced educational platform tailored for Uganda''s New Lower Secondary Curriculum, providing students with interactive tools, high-quality notes, and AI-powered learning assistance.'
) ON CONFLICT DO NOTHING;
