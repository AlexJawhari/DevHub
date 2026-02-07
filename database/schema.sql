-- DevHub Database Schema for Supabase (PostgreSQL)

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Collections table (organize saved requests)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Saved requests table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  body TEXT,
  query_params JSONB DEFAULT '{}',
  auth_type VARCHAR(50),
  auth_config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Request history table
CREATE TABLE request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  response_size INTEGER,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Monitored endpoints table
CREATE TABLE monitored_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'GET',
  headers JSONB DEFAULT '{}',
  expected_status_code INTEGER DEFAULT 200,
  check_interval INTEGER DEFAULT 5,
  alert_on_failure BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Monitoring results table
CREATE TABLE monitoring_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES monitored_endpoints(id) ON DELETE CASCADE,
  status_code INTEGER,
  response_time INTEGER,
  is_up BOOLEAN,
  error_message TEXT,
  checked_at TIMESTAMP DEFAULT NOW()
);

-- Security scans table
CREATE TABLE security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  scan_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  security_score INTEGER,
  findings JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Security findings table
CREATE TABLE security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES security_scans(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  evidence TEXT,
  recommendation TEXT,
  owasp_category VARCHAR(50),
  cwe_id VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SSL certificates cache
CREATE TABLE ssl_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  issuer VARCHAR(255),
  subject VARCHAR(255),
  valid_from TIMESTAMP,
  valid_to TIMESTAMP,
  fingerprint VARCHAR(255),
  protocol VARCHAR(50),
  cipher VARCHAR(100),
  last_checked TIMESTAMP DEFAULT NOW()
);

-- Environments table
CREATE TABLE environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_requests_collection ON requests(collection_id);
CREATE INDEX idx_request_history_user ON request_history(user_id);
CREATE INDEX idx_monitoring_results_endpoint ON monitoring_results(endpoint_id);
CREATE INDEX idx_monitoring_results_checked ON monitoring_results(checked_at);
CREATE INDEX idx_security_scans_user ON security_scans(user_id);
CREATE INDEX idx_security_scans_status ON security_scans(status);
CREATE INDEX idx_security_findings_scan ON security_findings(scan_id);
CREATE INDEX idx_security_findings_severity ON security_findings(severity);
CREATE INDEX idx_environments_user ON environments(user_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Collections policies
CREATE POLICY "Users can view their own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Requests policies
CREATE POLICY "Users can view their own requests" ON requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" ON requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests" ON requests
  FOR DELETE USING (auth.uid() = user_id);

-- Request history policies
CREATE POLICY "Users can view their own request history" ON request_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own request history" ON request_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Monitored endpoints policies
CREATE POLICY "Users can view their own monitored endpoints" ON monitored_endpoints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monitored endpoints" ON monitored_endpoints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitored endpoints" ON monitored_endpoints
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitored endpoints" ON monitored_endpoints
  FOR DELETE USING (auth.uid() = user_id);

-- Monitoring results policies
CREATE POLICY "Users can view results for their endpoints" ON monitoring_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monitored_endpoints
      WHERE monitored_endpoints.id = monitoring_results.endpoint_id
      AND monitored_endpoints.user_id = auth.uid()
    )
  );

-- Security scans policies
CREATE POLICY "Users can view their own security scans" ON security_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own security scans" ON security_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security scans" ON security_scans
  FOR UPDATE USING (auth.uid() = user_id);

-- Security findings policies
CREATE POLICY "Users can view findings for their scans" ON security_findings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM security_scans
      WHERE security_scans.id = security_findings.scan_id
      AND security_scans.user_id = auth.uid()
    )
  );

-- SSL certificates policies (Shared cache but read-only for users)
CREATE POLICY "Authenticated users can view SSL certificates" ON ssl_certificates
  FOR SELECT TO authenticated USING (true);

-- Environments policies
CREATE POLICY "Users can view their own environments" ON environments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own environments" ON environments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own environments" ON environments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own environments" ON environments
  FOR DELETE USING (auth.uid() = user_id);
