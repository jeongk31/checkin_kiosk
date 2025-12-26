-- Payments Table for KICC EasyCheck Integration
-- Stores payment transactions from the kiosk

-- ============================================
-- Payments Table
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    kiosk_id UUID REFERENCES kiosks(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,

    -- Transaction identification
    transaction_no VARCHAR(100) NOT NULL,
    order_num VARCHAR(255),

    -- Payment result
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled, refunded
    approval_num VARCHAR(100), -- 승인번호
    approval_date VARCHAR(20), -- 승인일자 (YYMMDD)
    approval_time VARCHAR(20), -- 승인시간 (HHMMSS)

    -- Card info (masked)
    card_num VARCHAR(50), -- Masked card number (e.g., "1234-****-****-5678")
    card_name VARCHAR(100), -- Card issuer name (e.g., "신한카드")

    -- Amount
    amount INTEGER, -- Total amount in KRW
    tax INTEGER, -- Tax amount
    installment INTEGER DEFAULT 0, -- Installment months (0 = one-time)

    -- Error info (for failed transactions)
    error_code VARCHAR(50),
    error_message TEXT,

    -- Raw response from payment gateway
    raw_response JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_kiosk_id ON payments(kiosk_id);
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_transaction_no ON payments(transaction_no);
CREATE INDEX idx_payments_approval_num ON payments(approval_num);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all payments
CREATE POLICY "Super admins can manage all payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- Project admins can view and manage their project payments
CREATE POLICY "Project admins can manage their payments" ON payments
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM profiles
            WHERE user_id = auth.uid() AND role = 'project_admin'
        )
    );

-- Kiosks can insert and view their own payments
CREATE POLICY "Kiosks can manage their payments" ON payments
    FOR ALL USING (
        kiosk_id IN (
            SELECT id FROM kiosks
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Add payment_status to reservations if not exists
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reservations' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE reservations ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid';
    END IF;
END $$;
