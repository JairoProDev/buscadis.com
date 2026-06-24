-- QR visual: render modes, QA status, fallback tracking

ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS render_mode TEXT NOT NULL DEFAULT 'branded'
    CHECK (render_mode IN ('classic', 'branded', 'visual')),
  ADD COLUMN IF NOT EXISTS qa_status TEXT DEFAULT 'pending'
    CHECK (qa_status IN ('pending', 'passed', 'degraded', 'failed')),
  ADD COLUMN IF NOT EXISTS qa_fallback_mode TEXT,
  ADD COLUMN IF NOT EXISTS generation_error TEXT;

COMMENT ON COLUMN qr_codes.render_mode IS 'classic | branded | visual halftone';
COMMENT ON COLUMN qr_codes.qa_status IS 'Quality gate result for cached PNG';
COMMENT ON COLUMN qr_codes.qa_fallback_mode IS 'Actual mode used when degraded from requested mode';
