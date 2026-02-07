-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
-- ... (I will include all drops just to be safe, or just use the creators. I'll just use the creators and let user handle likely clean state, or ideally use DO block but Supabase SQL editor handles simple statements better. I'll add drops.)

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Collections
DROP POLICY IF EXISTS "Users can view their own collections" ON collections;
CREATE POLICY "Users can view their own collections" ON collections FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own collections" ON collections;
CREATE POLICY "Users can create their own collections" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collections" ON collections;
CREATE POLICY "Users can update their own collections" ON collections FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collections" ON collections;
CREATE POLICY "Users can delete their own collections" ON collections FOR DELETE USING (auth.uid() = user_id);

-- Requests
DROP POLICY IF EXISTS "Users can view their own requests" ON requests;
CREATE POLICY "Users can view their own requests" ON requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own requests" ON requests;
CREATE POLICY "Users can create their own requests" ON requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own requests" ON requests;
CREATE POLICY "Users can update their own requests" ON requests FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own requests" ON requests;
CREATE POLICY "Users can delete their own requests" ON requests FOR DELETE USING (auth.uid() = user_id);

-- Request History
DROP POLICY IF EXISTS "Users can view their own request history" ON request_history;
CREATE POLICY "Users can view their own request history" ON request_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own request history" ON request_history;
CREATE POLICY "Users can create their own request history" ON request_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Monitored Endpoints
DROP POLICY IF EXISTS "Users can view their own monitored endpoints" ON monitored_endpoints;
CREATE POLICY "Users can view their own monitored endpoints" ON monitored_endpoints FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own monitored endpoints" ON monitored_endpoints;
CREATE POLICY "Users can create their own monitored endpoints" ON monitored_endpoints FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own monitored endpoints" ON monitored_endpoints;
CREATE POLICY "Users can update their own monitored endpoints" ON monitored_endpoints FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own monitored endpoints" ON monitored_endpoints;
CREATE POLICY "Users can delete their own monitored endpoints" ON monitored_endpoints FOR DELETE USING (auth.uid() = user_id);

-- Monitoring Results
DROP POLICY IF EXISTS "Users can view results for their endpoints" ON monitoring_results;
CREATE POLICY "Users can view results for their endpoints" ON monitoring_results FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monitored_endpoints
      WHERE monitored_endpoints.id = monitoring_results.endpoint_id
      AND monitored_endpoints.user_id = auth.uid()
    )
  );

-- Security Scans
DROP POLICY IF EXISTS "Users can view their own security scans" ON security_scans;
CREATE POLICY "Users can view their own security scans" ON security_scans FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own security scans" ON security_scans;
CREATE POLICY "Users can create their own security scans" ON security_scans FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own security scans" ON security_scans;
CREATE POLICY "Users can update their own security scans" ON security_scans FOR UPDATE USING (auth.uid() = user_id);

-- Security Findings
DROP POLICY IF EXISTS "Users can view findings for their scans" ON security_findings;
CREATE POLICY "Users can view findings for their scans" ON security_findings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM security_scans
      WHERE security_scans.id = security_findings.scan_id
      AND security_scans.user_id = auth.uid()
    )
  );

-- SSL Certificates
DROP POLICY IF EXISTS "Authenticated users can view SSL certificates" ON ssl_certificates;
CREATE POLICY "Authenticated users can view SSL certificates" ON ssl_certificates FOR SELECT TO authenticated USING (true);

-- Environments
DROP POLICY IF EXISTS "Users can view their own environments" ON environments;
CREATE POLICY "Users can view their own environments" ON environments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own environments" ON environments;
CREATE POLICY "Users can create their own environments" ON environments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own environments" ON environments;
CREATE POLICY "Users can update their own environments" ON environments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own environments" ON environments;
CREATE POLICY "Users can delete their own environments" ON environments FOR DELETE USING (auth.uid() = user_id);
