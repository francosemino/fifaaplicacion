/** Centralized API client. Uses EXPO_PUBLIC_BACKEND_URL and always prefixes /api. */
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://fifa-tracker-backend.onrender.com';

const ADMIN_PASSWORD = '4811';

export function requireAdmin(): boolean {
  const pwd = window.prompt('Ingresá la contraseña de administrador:');
  if (pwd !== ADMIN_PASSWORD) {
    if (pwd !== null) window.alert('Contraseña incorrecta');
    return false;
  }
  return true;
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  return res.json();
}

export const api = {
  dashboard: () => request('/dashboard'),
  history: () => request('/history'),
  // Editions
  listEditions: () => request('/editions'),
  createEdition: (body: any) => request('/editions', { method: 'POST', body: JSON.stringify(body) }),
  editionSummary: (id: string) => request(`/editions/${id}/summary`),
  deleteEdition: (id: string) => request(`/editions/${id}`, { method: 'DELETE' }),
  // Players
  listPlayers: () => request('/players'),
  createPlayer: (body: any) => request('/players', { method: 'POST', body: JSON.stringify(body) }),
  getPlayer: (id: string) => request(`/players/${id}`),
  updatePlayer: (id: string, body: any) => request(`/players/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  playerProfile: (id: string) => request(`/players/${id}/profile`),
  deletePlayer: (id: string) => request(`/players/${id}`, { method: 'DELETE' }),
  // Championships
  listChampionships: (editionId?: string) =>
    request(`/championships${editionId ? `?edition_id=${editionId}` : ''}`),
  createChampionship: (body: any) => request('/championships', { method: 'POST', body: JSON.stringify(body) }),
  getChampionship: (id: string) => request(`/championships/${id}`),
  finishChampionship: (id: string) => request(`/championships/${id}/finish`, { method: 'POST' }),
  deleteChampionship: (id: string) => request(`/championships/${id}`, { method: 'DELETE' }),
  // Matches
  createMatch: (body: any) => request('/matches', { method: 'POST', body: JSON.stringify(body) }),
  deleteMatch: (id: string) => request(`/matches/${id}`, { method: 'DELETE' }),
  // Cups
  listCups: (editionId?: string) =>
    request(`/cups${editionId ? `?edition_id=${editionId}` : ''}`),
  createCup: (body: any) => request('/cups', { method: 'POST', body: JSON.stringify(body) }),
  getCup: (id: string) => request(`/cups/${id}`),
  registerCupMatch: (id: string, body: any) =>
    request(`/cups/${id}/match`, { method: 'POST', body: JSON.stringify(body) }),
  deleteCup: (id: string) => request(`/cups/${id}`, { method: 'DELETE' }),
  // Rankings
  rankings: (editionId?: string) =>
    request(`/rankings${editionId ? `?edition_id=${editionId}` : ''}`),
  head2head: (p1: string, p2: string) => request(`/head2head/${p1}/${p2}`),
   // Goals
  listGoals: (
    params: {
      edition_id?: string;
      competition_id?: string;
      competition_type?: 'championship' | 'cup';
      player_id?: string;
      is_puskas?: boolean;
      include_video?: boolean;
    } = {}
  ) => {
    const qs = new URLSearchParams();

    if (params.edition_id) qs.append('edition_id', params.edition_id);
    if (params.competition_id) qs.append('competition_id', params.competition_id);
    if (params.competition_type) qs.append('competition_type', params.competition_type);
    if (params.player_id) qs.append('player_id', params.player_id);

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

  seed: () => request('/seed', { method: 'POST' }),
};
