-- Enhanced Security Migrations for Production Launch
-- Additional security measures and compliance features

-- Create security events table for comprehensive logging
CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device fingerprints table
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  fingerprint_hash TEXT NOT NULL,
  device_info JSONB,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_trusted BOOLEAN DEFAULT FALSE
);

-- Create security policies table
CREATE TABLE IF NOT EXISTS security_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_name TEXT NOT NULL UNIQUE,
  policy_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logs table for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security events" ON security_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security events" ON security_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert security events" ON security_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert rate limits" ON rate_limits
  FOR INSERT WITH CHECK (true);

-- RLS Policies for device_fingerprints
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own device fingerprints" ON device_fingerprints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all device fingerprints" ON device_fingerprints
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own device fingerprints" ON device_fingerprints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device fingerprints" ON device_fingerprints
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON rate_limits(created_at);

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint_hash ON device_fingerprints(fingerprint_hash);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old security events
CREATE OR REPLACE FUNCTION cleanup_security_events()
RETURNS void AS $$
BEGIN
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND severity IN ('low', 'medium');
END;
$$ LANGUAGE plpgsql;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has admin role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = $1 AND role = $2
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to detect suspicious login patterns
CREATE OR REPLACE FUNCTION detect_suspicious_login(
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  recent_logins INTEGER;
  different_ips INTEGER;
  different_devices INTEGER;
BEGIN
  -- Check for multiple failed logins in last hour
  SELECT COUNT(*) INTO recent_logins
  FROM security_events
  WHERE user_id = p_user_id
  AND event_type = 'login_failed'
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_logins > 5 THEN
    RETURN TRUE;
  END IF;
  
  -- Check for logins from different IPs in last 24 hours
  SELECT COUNT(DISTINCT ip_address) INTO different_ips
  FROM security_events
  WHERE user_id = p_user_id
  AND event_type IN ('login_success', 'login_failed')
  AND created_at > NOW() - INTERVAL '24 hours';
  
  IF different_ips > 3 THEN
    RETURN TRUE;
  END IF;
  
  -- Check for logins from different devices in last 24 hours
  SELECT COUNT(DISTINCT user_agent) INTO different_devices
  FROM security_events
  WHERE user_id = p_user_id
  AND event_type = 'login_success'
  AND created_at > NOW() - INTERVAL '24 hours';
  
  IF different_devices > 2 THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log audit events for sensitive tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.user_id,
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      NEW.user_id,
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      OLD.user_id,
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_age_verifications_trigger
  AFTER INSERT OR UPDATE OR DELETE ON age_verifications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create scheduled job to clean up old records (if pg_cron is available)
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_rate_limits();');
-- SELECT cron.schedule('cleanup-security-events', '0 2 * * *', 'SELECT cleanup_security_events();');

-- Insert default security policies
INSERT INTO security_policies (policy_name, policy_config) VALUES
('password_policy', '{"min_length": 12, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true, "max_age_days": 90}'),
('login_policy', '{"max_attempts": 5, "lockout_duration_minutes": 15, "require_2fa": false}'),
('session_policy', '{"max_duration_hours": 24, "require_reauth_for_sensitive": true}'),
('rate_limit_policy', '{"requests_per_minute": 100, "burst_limit": 200}'),
('geo_blocking', '{"enabled": true, "blocked_countries": [], "allowed_countries": ["US"]}')
ON CONFLICT (policy_name) DO NOTHING;

-- Create view for security dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), event_type, severity
ORDER BY hour DESC, severity DESC;

-- Grant necessary permissions
GRANT SELECT ON security_dashboard TO authenticated;
GRANT SELECT ON security_events TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON device_fingerprints TO authenticated;

-- Create function to get security summary
CREATE OR REPLACE FUNCTION get_security_summary()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_events_24h', (SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours'),
    'critical_events_24h', (SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours' AND severity = 'critical'),
    'failed_logins_24h', (SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours' AND event_type = 'login_failed'),
    'unique_ips_24h', (SELECT COUNT(DISTINCT ip_address) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours'),
    'locked_accounts', (SELECT COUNT(DISTINCT user_id) FROM security_events WHERE created_at > NOW() - INTERVAL '1 hour' AND event_type = 'account_locked')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
