-- Enable http extension
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Enable pg_net for async http requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;