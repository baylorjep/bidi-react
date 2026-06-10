import { supabase } from '../supabaseClient';

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

async function adminPost(body) {
  const token = await getAuthToken();
  const res = await fetch('/api/admin/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._select = '*';
    this._filters = [];
    this._order = null;
    this._limit = null;
    this._single = false;
    this._maybeSingle = false;
    this._isMutation = false;
    this._operation = null;
    this._data = null;
    this._mutSelect = null;
  }

  select(cols) {
    if (this._isMutation) { this._mutSelect = cols; return this; }
    this._select = cols;
    return this;
  }

  eq(col, val)  { this._filters.push({ method: 'eq',  col, val }); return this; }
  neq(col, val) { this._filters.push({ method: 'neq', col, val }); return this; }
  lt(col, val)  { this._filters.push({ method: 'lt',  col, val }); return this; }
  lte(col, val) { this._filters.push({ method: 'lte', col, val }); return this; }
  gt(col, val)  { this._filters.push({ method: 'gt',  col, val }); return this; }
  gte(col, val) { this._filters.push({ method: 'gte', col, val }); return this; }
  in(col, val)  { this._filters.push({ method: 'in',  col, val }); return this; }
  is(col, val)  { this._filters.push({ method: 'is',  col, val }); return this; }

  order(col, opts) { this._order = { col, opts: opts || {} }; return this; }
  limit(n) { this._limit = n; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }

  then(resolve, reject) {
    const body = this._isMutation
      ? {
          type: 'mutation',
          operation: this._operation,
          table: this._table,
          data: this._data,
          filters: this._filters,
          select: this._mutSelect,
          single: this._single,
        }
      : {
          type: 'query',
          table: this._table,
          select: this._select,
          filters: this._filters,
          order: this._order,
          limit: this._limit,
          single: this._single,
          maybeSingle: this._maybeSingle,
        };
    return adminPost(body).then(resolve, reject);
  }
}

function makeTableProxy(table) {
  return {
    select(cols = '*') {
      const q = new QueryBuilder(table);
      q._select = cols;
      return q;
    },
    insert(data) {
      const q = new QueryBuilder(table);
      q._isMutation = true; q._operation = 'insert'; q._data = data;
      return q;
    },
    update(data) {
      const q = new QueryBuilder(table);
      q._isMutation = true; q._operation = 'update'; q._data = data;
      return q;
    },
    upsert(data) {
      const q = new QueryBuilder(table);
      q._isMutation = true; q._operation = 'upsert'; q._data = data;
      return q;
    },
    delete() {
      const q = new QueryBuilder(table);
      q._isMutation = true; q._operation = 'delete';
      return q;
    },
  };
}

export const supabaseAdmin = {
  from: (table) => makeTableProxy(table),
  auth: {
    admin: {
      generateLink: (params) => adminPost({ type: 'auth', action: 'generateLink', params }),
      createUser:   (params) => adminPost({ type: 'auth', action: 'createUser',   params }),
      deleteUser:   (userId) => adminPost({ type: 'auth', action: 'deleteUser',   params: { userId } }),
      signIn:       (params) => adminPost({ type: 'auth', action: 'signIn',       params }),
    },
  },
};
