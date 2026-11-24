import { api } from "./api";

const fusoMinutos = () => -new Date().getTimezoneOffset();

const p = (childId, days, extra = {}) => ({
  child_id: childId,
  days,
  tz_offset_minutes: fusoMinutos(),
  ...extra,
});

export const resumo = (childId, days) => api.get("/api/dashboard/summary", p(childId, days));
export const porJogo = (childId, days) => api.get("/api/dashboard/games", p(childId, days));
export const evolucao = (childId, days, gameId) =>
  api.get("/api/dashboard/evolution", p(childId, days, { game_id: gameId }));
export const historico = (childId, gameId, limit = 15, offset = 0, days) =>
  api.get("/api/dashboard/history", p(childId, days, { game_id: gameId, limit, offset }));
