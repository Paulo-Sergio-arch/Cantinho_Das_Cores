import { api } from "./api";

const fusoMinutos = () => -new Date().getTimezoneOffset();

export const gerarRelatorio = (childId, inicio, fim) =>
  api.post("/api/reports", {
    child_id: String(childId),
    period_start: inicio,
    period_end: fim,
    tz_offset_minutes: fusoMinutos(),
  });
export const listarRelatorios = (childId) => api.get("/api/reports", { child_id: childId });
export const obterRelatorio = (id) => api.get(`/api/reports/${id}`);
export const metricasRelatorio = (id) =>
  api.get(`/api/reports/${id}/metrics`, { tz_offset_minutes: fusoMinutos() });
export const statusRelatorio = (id) => api.get(`/api/reports/${id}/status`);
export const excluirRelatorio = (id) => api.del(`/api/reports/${id}`);
// Envia ou reenvia o relatório pelo canal configurado no backend (Resend, Brevo, SMTP, webhook ou caixa de saída).
export const registrarEnvio = (id, opcoes) => api.post(`/api/reports/${id}/sent`, opcoes);
export const enviarRelatorio = (id, opcoes) => api.post(`/api/reports/${id}/send`, opcoes);
// Recado e desafio do último relatório, para a área da criança (só lê o que já foi gravado; não chama a IA).
export const recadoDaSemana = (childId) => api.get("/api/reports/recado-da-semana", { child_id: childId });
