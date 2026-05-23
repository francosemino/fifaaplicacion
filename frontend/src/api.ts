/** Centralized API client. Uses EXPO_PUBLIC_BACKEND_URL and always prefixes /api. */

const BASE =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://fifa-tracker-backend.onrender.com';

const ADMIN_PASSWORD = '4811';

const CACHE_TTL_MS = 60_000;

type ApiOptions = RequestInit & {
  skipCache?: boolean;
};

const cache = new Map<string, { time: number; data: any }>();
const inflight = new Map<string, Promise<any>>();

function clearApiCache() {
  cache.clear();
  inflight.clear();
}

export function requireAdmin(): boolean {
  const pwd = window.prompt('Ingresá la contraseña de administrador:');

  if (pwd !== ADMIN_PASSWORD) {
    if (pwd !== null) window.alert('Contraseña incorrecta');
    return false;
  }

  return true;
}

async function request(path: string, options: ApiOptions = {}) {
  const url = `${BASE}/api${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (isGet && !options.skipCache) {
    const hit = cache.get(url);

    if (hit && Date.now() - hit.time < CACHE_TTL_MS) {
      return hit.data;
    }

    const pending = inflight.get(url);

    if (pending) {
      return pending;
    }
  }

  const promise = fetch(url, {
    ...options,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const txt = await res.text();

    if (!res.ok) {
      throw new Error(`API ${res.status}: ${txt}`);
    }

    const data = txt ? JSON.parse(txt) : null;

    if (isGet && !options.skipCache) {
      cache.set(url, {
        time: Date.now(),
        data,
      });
    } else if (!isGet) {
      clearApiCache();
    }

    return data;
  }).finally(() => {
    if (isGet) {
      inflight.delete(url);
    }
  });

  if (isGet && !options.skipCache) {
    inflight.set(url, promise);
  }

  return promise;
}

export const api = {
  dashboard: () => request('/dashboard'),
  history: () => request('/history'),

  // Editions
  listEditions: () => request('/editions'),
  createEdition: (body: any) =>
    request('/editions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  editionSummary: (id: string) => request(`/editions/${id}/summary`),
  deleteEdition: (id: string) =>
    request(`/editions/${id}`, {
      method: 'DELETE',
    }),

  // Players
  listPlayers: () => request('/players'),
  createPlayer: (body: any) =>
    request('/players', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getPlayer: (id: string) => request(`/players/${id}`),
  updatePlayer: (id: string, body: any) =>
    request(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  playerProfile: (id: string) => request(`/players/${id}/profile`),
  deletePlayer: (id: string) =>
    request(`/players/${id}`, {
      method: 'DELETE',
    }),

  // Championships
  listChampionships: (editionId?: string) =>
    request(`/championships${editionId ? `?edition_id=${editionId}` : ''}`),
  createChampionship: (body: any) =>
    request('/championships', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getChampionship: (id: string) => request(`/championships/${id}`),
  finishChampionship: (id: string) =>
    request(`/championships/${id}/finish`, {
      method: 'POST',
    }),
  deleteChampionship: (id: string) =>
    request(`/championships/${id}`, {
      method: 'DELETE',
    }),

  // Matches
  createMatch: (body: any) =>
    request('/matches', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteMatch: (id: string) =>
    request(`/matches/${id}`, {
      method: 'DELETE',
    }),

  // Cups
  listCups: (editionId?: string) =>
    request(`/cups${editionId ? `?edition_id=${editionId}` : ''}`),
  createCup: (body: any) =>
    request('/cups', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getCup: (id: string) => request(`/cups/${id}`),
  registerCupMatch: (id: string, body: any) =>
    request(`/cups/${id}/match`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteCup: (id: string) =>
    request(`/cups/${id}`, {
      method: 'DELETE',
    }),

  // Rankings
  rankings: (editionId?: string) =>
    request(`/rankings${editionId ? `?edition_id=${editionId}` : ''}`),
  head2head: (p1: string, p2: string) =>
    request(`/head2head/${p1}/${p2}`),

  // Goals
  listGoals: (
    params: {
      edition_id?: string;
      competition_id?: string;
      competition_type?: 'championship' | 'cup';
      player_id?: string;
      is_tournament_best?: boolean;
      is_puskas?: boolean;
      include_video?: boolean;
    } = {}
  ) => {
    const qs = new URLSearchParams();

    if (params.edition_id) qs.append('edition_id', params.edition_id);
    if (params.competition_id) qs.append('competition_id', params.competition_id);
    if (params.competition_type) qs.append('competition_type', params.competition_type);
    if (params.player_id) qs.append('player_id', params.player_id);

    if (typeof params.is_tournament_best === 'boolean') {
      qs.append('is_tournament_best', String(params.is_tournament_best));
    }

    if (typeof params.is_puskas === 'boolean') {
      qs.append('is_puskas', String(params.is_puskas));
    }

    if (typeof params.include_video === 'boolean') {
      qs.append('include_video', String(params.include_video));
    }

    const s = qs.toString();

    return request(`/goals${s ? `?${s}` : ''}`);
  },

  getGoal: (id: string) => request(`/goals/${id}`),

  createGoal: (body: any) =>
    request('/goals', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteGoal: (id: string) =>
    request(`/goals/${id}`, {
      method: 'DELETE',
    }),

  deleteGoalVideo: (id: string) =>
    request(`/goals/${id}/video`, {
      method: 'DELETE',
    }),

  markTournamentBest: (id: string) =>
    request(`/goals/${id}/mark-tournament-best`, {
      method: 'POST',
    }),

  markPuskas: (id: string) =>
    request(`/goals/${id}/mark-puskas`, {
      method: 'POST',
    }),

  getCurrentPuskas: (editionId?: string, includeVideo: boolean = true) => {
    const qs = new URLSearchParams();

    if (editionId) qs.append('edition_id', editionId);
    qs.append('include_video', String(includeVideo));

    const s = qs.toString();

    return request(`/goals/puskas/current${s ? `?${s}` : ''}`);
  },

  seed: () =>
    request('/seed', {
      method: 'POST',
    }),
};