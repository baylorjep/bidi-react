import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://splafvfbznewlbeqaocv.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbGFmdmZiem5ld2xiZXFhb2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5MDMzMzYsImV4cCI6MjAzODQ3OTMzNn0.dXaaFmPzf3Hy2Nw5tvfB4-UefnyiegdsnQuxygH5ixU';

const ALLOWED_FILTER_METHODS = new Set(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in', 'is']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.slice(7);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const {
    data: { user },
    error: userError,
  } = await anonClient.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: profile } = await anonClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return res.status(500).json({ error: 'Admin service not configured' });

  const adminClient = createClient(SUPABASE_URL, serviceRoleKey);
  const body = req.body;

  try {
    if (body.type === 'auth') {
      let result;
      switch (body.action) {
        case 'generateLink':
          result = await adminClient.auth.admin.generateLink(body.params);
          break;
        case 'createUser':
          result = await adminClient.auth.admin.createUser(body.params);
          break;
        case 'deleteUser':
          result = await adminClient.auth.admin.deleteUser(body.params.userId);
          break;
        case 'signIn':
          result = await adminClient.auth.admin.signIn(body.params);
          break;
        default:
          return res.status(400).json({ error: 'Unknown auth action' });
      }
      return res.status(200).json(result);
    }

    if (body.type === 'query') {
      let q = adminClient.from(body.table).select(body.select || '*');
      for (const f of body.filters || []) {
        if (!ALLOWED_FILTER_METHODS.has(f.method)) continue;
        q = q[f.method](f.col, f.val);
      }
      if (body.order) q = q.order(body.order.col, body.order.opts || {});
      if (body.limit) q = q.limit(body.limit);
      if (body.single) q = q.single();
      else if (body.maybeSingle) q = q.maybeSingle();
      return res.status(200).json(await q);
    }

    if (body.type === 'mutation') {
      const ops = { insert: 'insert', update: 'update', upsert: 'upsert', delete: 'delete' };
      if (!ops[body.operation]) return res.status(400).json({ error: 'Unknown mutation operation' });

      let q =
        body.operation === 'delete'
          ? adminClient.from(body.table).delete()
          : adminClient.from(body.table)[body.operation](body.data);

      for (const f of body.filters || []) {
        if (!ALLOWED_FILTER_METHODS.has(f.method)) continue;
        q = q[f.method](f.col, f.val);
      }
      if (body.select) q = q.select(body.select);
      if (body.single) q = q.single();
      return res.status(200).json(await q);
    }

    return res.status(400).json({ error: 'Unknown request type' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
