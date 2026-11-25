import { jsPDF } from "jspdf";
import fredokaFontUrl from "../assets/fonts/Fredoka-SemiBold.ttf?url";
import atkinsonRegUrl from "../assets/fonts/AtkinsonHyperlegible-Regular.ttf?url";
import atkinsonBoldUrl from "../assets/fonts/AtkinsonHyperlegible-Bold.ttf?url";
import {
  corAvatar,
  corDoJogo,
  formatarDataCompleta,
  formatarDataHora,
  formatarTempoCurto,
  gerarNarrativaNuvi,
} from "./relatorioDados";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 13;
const CONTENT_W = PAGE_W - MARGIN * 2; // 184mm
const FOOTER_Y = 286;
const SAFE_BOTTOM_Y = 274;

const COR = {
  ink: "#1F2D4D",
  muted: "#5B6880",
  cream: "#FCFBF8",
  paper: "#F7F4EC",
  border: "#E2DACB",
  track: "#EFEBE2",
  blue: "#5B82BA",
  blueSoft: "#EAF1FC",
  mint: "#3B9B7E",
  mintSoft: "#E7F6F0",
  gold: "#E0AE4C",
  goldDeep: "#A67518",
  goldSoft: "#FDF3DA",
  lavender: "#9A82D1",
  lavenderSoft: "#EFE9FA",
  terracota: "#DE8668",
  terracotaSoft: "#FBECE6",
  coral: "#E58A78",
  rose: "#D47B8B",
};

let cacheFontes = null;

function arrayBufferParaBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = "";
  const bloco = 0x8000;
  for (let i = 0; i < bytes.length; i += bloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + bloco));
  }
  return btoa(binario);
}

async function carregarFontesMarca(doc) {
  try {
    if (!cacheFontes) {
      const [bufFredoka, bufAtkReg, bufAtkBold] = await Promise.all([
        fetch(fredokaFontUrl).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("Fredoka")))),
        fetch(atkinsonRegUrl).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("AtkinsonReg")))),
        fetch(atkinsonBoldUrl).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("AtkinsonBold")))),
      ]);
      cacheFontes = {
        fredoka: arrayBufferParaBase64(bufFredoka),
        atkReg: arrayBufferParaBase64(bufAtkReg),
        atkBold: arrayBufferParaBase64(bufAtkBold),
      };
    }

    doc.addFileToVFS("Fredoka-SemiBold.ttf", cacheFontes.fredoka);
    doc.addFont("Fredoka-SemiBold.ttf", "Fredoka", "normal");
    doc.addFont("Fredoka-SemiBold.ttf", "Fredoka", "bold");

    doc.addFileToVFS("Atkinson-Regular.ttf", cacheFontes.atkReg);
    doc.addFont("Atkinson-Regular.ttf", "Atkinson", "normal");

    doc.addFileToVFS("Atkinson-Bold.ttf", cacheFontes.atkBold);
    doc.addFont("Atkinson-Bold.ttf", "Atkinson", "bold");

    return { display: "Fredoka", sans: "Atkinson", utf8: true };
  } catch {
    return { display: "helvetica", sans: "helvetica", utf8: false };
  }
}

function hexRgb(hex) {
  const limpo = String(hex || "#1F2D4D").replace("#", "");
  const full = limpo.length === 3 ? limpo.split("").map((c) => c + c).join("") : limpo;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(hex, pesoBranco = 0.85) {
  const [r, g, b] = hexRgb(hex);
  const mr = Math.round(r + (255 - r) * pesoBranco);
  const mg = Math.round(g + (255 - g) * pesoBranco);
  const mb = Math.round(b + (255 - b) * pesoBranco);
  return `#${[mr, mg, mb].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function setFill(doc, hex) {
  const [r, g, b] = hexRgb(hex);
  doc.setFillColor(r, g, b);
}

function setStroke(doc, hex) {
  const [r, g, b] = hexRgb(hex);
  doc.setDrawColor(r, g, b);
}

function setTextCol(doc, hex) {
  const [r, g, b] = hexRgb(hex);
  doc.setTextColor(r, g, b);
}

function limparTexto(str, utf8 = true) {
  const s = String(str ?? "");
  if (utf8) return s;
  return s.replace(/[—–]/g, "-").replace(/·/g, "|").replace(/…/g, "...");
}

function truncarTexto(doc, texto, maxLarguraMm) {
  if (doc.getTextWidth(texto) <= maxLarguraMm) return texto;
  let t = texto;
  while (t.length > 3 && doc.getTextWidth(`${t}...`) > maxLarguraMm) {
    t = t.slice(0, -1);
  }
  return `${t.trimEnd()}...`;
}

// =====================================================================
// DESENHOS HIGH-DPI EM CANVAS (Nuvi, banner celeste e gráficos nítidos)
// =====================================================================

function criarCanvas(larguraPx, alturaPx, escala = 3) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(larguraPx * escala);
  canvas.height = Math.round(alturaPx * escala);
  const ctx = canvas.getContext("2d");
  ctx.scale(escala, escala);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  return { canvas, ctx };
}

function desenharRetanguloArredondado(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function desenharEstrelaCanvas(ctx, cx, cy, raioExt, raioInt, cor, rotacao = -Math.PI / 2) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? raioExt : raioInt;
    const ang = rotacao + (i * Math.PI) / 5;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.restore();
}

function desenharBrilhoQuatroPontas(ctx, cx, cy, r, cor) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.16, cy - r * 0.16, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.16, cy + r * 0.16, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.16, cy + r * 0.16, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.16, cy - r * 0.16, cx, cy - r);
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.restore();
}

/**
 * Desenha a mascote Nuvi (a nuvem do Cantinho das Cores!) fiel ao SVG NuviMascote.
 * Coordenadas originais: viewBox 0 0 124 98 (com pés) ou 0 0 120 84 (sem pés).
 */
function desenharNuvi(ctx, x, y, largura, { comPes = true } = {}) {
  const vbW = comPes ? 124 : 120;
  const s = largura / vbW;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  if (comPes) {
    // Sombra suave no chão
    ctx.beginPath();
    ctx.ellipse(62, 92, 34, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(181, 198, 220, 0.55)";
    ctx.fill();

    // Pés fofinhos
    ctx.fillStyle = "#E3ECF5";
    ctx.strokeStyle = "#84A3C4";
    ctx.lineWidth = 2.8;

    // Pé esquerdo
    ctx.beginPath();
    ctx.moveTo(48, 73);
    ctx.lineTo(48, 84);
    ctx.arc(44, 84, 4, 0, Math.PI, false);
    ctx.lineTo(40, 75);
    ctx.fill();
    ctx.stroke();

    // Pé direito
    ctx.beginPath();
    ctx.moveTo(76, 73);
    ctx.lineTo(76, 84);
    ctx.arc(80, 84, 4, Math.PI, 0, true);
    ctx.lineTo(84, 75);
    ctx.fill();
    ctx.stroke();
  }

  // Halo celeste sutil atrás da Nuvi
  const gradHalo = ctx.createRadialGradient(62, 46, 12, 62, 46, 54);
  gradHalo.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  gradHalo.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradHalo;
  ctx.beginPath();
  ctx.arc(62, 46, 54, 0, Math.PI * 2);
  ctx.fill();

  // Contorno externo da nuvem (3 círculos + base preenchida)
  ctx.strokeStyle = "#84A3C4";
  ctx.lineWidth = 5.4;
  ctx.fillStyle = "#F8FBFE";
  for (const [cx, cy, r] of [
    [38, 48, 23],
    [62, 34, 27],
    [86, 49, 21],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Base da nuvem com contorno inferior suave
  desenharRetanguloArredondado(ctx, 29, 48, 67, 23, 11.5);
  ctx.stroke();

  // Preenchimento branco fofinho cobrindo as junções internas
  ctx.fillStyle = "#F8FBFE";
  for (const [cx, cy, r] of [
    [38, 48, 22.8],
    [62, 34, 26.8],
    [86, 49, 20.8],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  desenharRetanguloArredondado(ctx, 30, 48, 66, 22.8, 11.4);
  ctx.fill();

  // Sombra azul-bebê na base da nuvem
  ctx.beginPath();
  ctx.moveTo(27, 66.5);
  ctx.lineTo(97, 66.5);
  ctx.strokeStyle = "#DCE9F6";
  ctx.lineWidth = 4.6;
  ctx.stroke();

  // Olhos sorridentes
  ctx.strokeStyle = "#273654";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(46, 49);
  ctx.quadraticCurveTo(50, 44, 54, 49);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(70, 49);
  ctx.quadraticCurveTo(74, 44, 78, 49);
  ctx.stroke();

  // Sorriso carinhoso
  ctx.beginPath();
  ctx.moveTo(57, 54);
  ctx.quadraticCurveTo(62, 59.5, 67, 54);
  ctx.stroke();

  // Bochechinhas rosadas
  ctx.fillStyle = "#F2B8B5";
  ctx.beginPath();
  ctx.ellipse(43, 56, 5, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(81, 56, 5, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderBannerHeaderCanvas() {
  const W = 736; // ~184mm * 4
  const H = 204; // ~51mm * 4
  const { canvas, ctx } = criarCanvas(W, H, 2.5);

  ctx.save();
  desenharRetanguloArredondado(ctx, 1, 1, W - 2, H - 2, 22);
  ctx.clip();

  // Gradiente celeste acolhedor do Cantinho das Cores
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#D9EEFF");
  grad.addColorStop(0.5, "#EDF6FF");
  grad.addColorStop(1, "#FAF6EB");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Colina suave cremosa na base
  ctx.beginPath();
  ctx.moveTo(0, H - 30);
  ctx.bezierCurveTo(W * 0.28, H - 56, W * 0.62, H - 14, W, H - 36);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = "rgba(252, 251, 248, 0.72)";
  ctx.fill();

  // Nuvens decorativas translúcidas no fundo
  ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
  for (const [cx, cy, r] of [
    [458, 36, 18],
    [478, 30, 22],
    [498, 38, 16],
    [682, 46, 16],
    [700, 40, 19],
    [716, 48, 14],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Formas lúdicas & estrelinhas pastel da marca (inspiradas na nuvi-login-hero)
  // Fica à direita do selo de nível (que pode ir até ~632px), sem cobrir o texto dele.
  desenharEstrelaCanvas(ctx, 652, 22, 9, 4.3, "#F7CF63");
  desenharBrilhoQuatroPontas(ctx, 704, 86, 8.5, "#F29999");
  desenharEstrelaCanvas(ctx, 540, 160, 8, 3.8, "#8AD4B7");

  ctx.fillStyle = "#B9A7E6";
  ctx.beginPath();
  ctx.arc(708, 148, 7.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8DC2F2";
  ctx.beginPath();
  ctx.arc(544, 86, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#F5B89E";
  desenharRetanguloArredondado(ctx, 686, 170, 13, 13, 4);
  ctx.fill();

  // Faixa superior arco-íris suave da identidade visual (4 cores)
  const faixaCores = ["#5C89C7", "#3B9B7E", "#E0AE4C", "#DE8668"];
  const segW = W / faixaCores.length;
  faixaCores.forEach((cor, idx) => {
    ctx.fillStyle = cor;
    ctx.fillRect(idx * segW, 0, segW + 1, 9);
  });

  // Mascote Nuvi em destaque no lado direito!
  desenharNuvi(ctx, 562, 46, 142, { comPes: true });

  ctx.restore();

  // Borda externa delicada
  desenharRetanguloArredondado(ctx, 1, 1, W - 2, H - 2, 22);
  ctx.strokeStyle = "#CBE0F5";
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

function renderMiniNuviCanvas() {
  const { canvas, ctx } = criarCanvas(120, 84, 2.5);
  desenharNuvi(ctx, 0, 0, 120, { comPes: false });
  return canvas.toDataURL("image/png");
}

function desenharDonut(ctx, cx, cy, raio, espessura, fracao, corPrincipal, corResto, centroTexto, subTexto, temDados) {
  // Trilho de fundo
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.strokeStyle = "#ECE7DC";
  ctx.lineWidth = espessura;
  ctx.stroke();

  if (temDados) {
    const start = -Math.PI / 2;
    const clamped = Math.max(0, Math.min(1, fracao));

    // Parte secundária (erros / abandonadas)
    if (clamped < 1) {
      ctx.beginPath();
      ctx.arc(cx, cy, raio, start + clamped * Math.PI * 2, start + Math.PI * 2);
      ctx.strokeStyle = corResto;
      ctx.lineWidth = espessura;
      ctx.lineCap = "butt";
      ctx.stroke();
    }

    // Parte principal (acertos / concluídas)
    if (clamped > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, raio, start, start + clamped * Math.PI * 2);
      ctx.strokeStyle = corPrincipal;
      ctx.lineWidth = espessura;
      ctx.lineCap = clamped >= 0.995 ? "butt" : "round";
      ctx.stroke();
    }
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COR.ink;
  ctx.font = '600 18px "Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.fillText(centroTexto, cx, cy - 4);

  ctx.fillStyle = COR.muted;
  ctx.font = '700 8.5px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.fillText(subTexto, cx, cy + 12);
}

function renderDonutsCanvas(summary, precisao) {
  const W = 340;
  const H = 178;
  const { canvas, ctx } = criarCanvas(W, H, 3);

  const temTentativas = summary.total_correct + summary.total_errors > 0;
  const temPartidas = summary.total_matches > 0;

  // Divisor vertical suave entre os dois donuts
  ctx.strokeStyle = "#EDE8DC";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(W / 2, 16);
  ctx.lineTo(W / 2, H - 16);
  ctx.stroke();

  // Donut 1: Precisão (Acertos x Erros)
  const cx1 = W * 0.25;
  const cy = 74;
  desenharDonut(
    ctx,
    cx1,
    cy,
    43,
    12,
    temTentativas ? (precisao ?? 0) / 100 : 0,
    COR.mint,
    COR.coral,
    temTentativas ? `${precisao}%` : "—",
    "precisão",
    temTentativas
  );

  // Legenda Donut 1
  const leg1Y = 140;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = '700 10px "Atkinson Hyperlegible", system-ui, sans-serif';

  ctx.fillStyle = COR.mint;
  ctx.beginPath();
  ctx.arc(cx1 - 54, leg1Y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COR.ink;
  ctx.fillText(`${summary.total_correct} acertos`, cx1 - 46, leg1Y);

  ctx.fillStyle = COR.coral;
  ctx.beginPath();
  ctx.arc(cx1 - 54, leg1Y + 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COR.muted;
  ctx.fillText(`${summary.total_errors} erros`, cx1 - 46, leg1Y + 16);

  // Donut 2: Taxa de conclusão
  const cx2 = W * 0.75;
  desenharDonut(
    ctx,
    cx2,
    cy,
    43,
    12,
    temPartidas ? summary.completion_rate / 100 : 0,
    COR.blue,
    COR.gold,
    temPartidas ? `${summary.completion_rate}%` : "—",
    "conclusão",
    temPartidas
  );

  // Legenda Donut 2
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = '700 10px "Atkinson Hyperlegible", system-ui, sans-serif';

  ctx.fillStyle = COR.blue;
  ctx.beginPath();
  ctx.arc(cx2 - 54, leg1Y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COR.ink;
  ctx.fillText(`${summary.completed_matches} concluídas`, cx2 - 46, leg1Y);

  ctx.fillStyle = COR.gold;
  ctx.beginPath();
  ctx.arc(cx2 - 54, leg1Y + 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COR.muted;
  ctx.fillText(`${summary.abandoned_matches} abandonadas`, cx2 - 46, leg1Y + 16);

  return canvas.toDataURL("image/png");
}

function renderEvolucaoCanvas(evolution) {
  const W = 360;
  const H = 178;
  const { canvas, ctx } = criarCanvas(W, H, 3);

  const padL = 42;
  const padR = 18;
  const padT = 24;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Grade horizontal 0..100
  ctx.font = '700 9.5px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (const val of [0, 25, 50, 75, 100]) {
    const y = padT + plotH - (val / 100) * plotH;
    ctx.strokeStyle = val === 0 ? "#D7CFC0" : "#EAE4D8";
    ctx.lineWidth = 1;
    ctx.setLineDash(val === 0 ? [] : [3, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COR.muted;
    ctx.fillText(val === 100 ? "100%" : `${val}`, padL - 7, y);
  }

  const pts = evolution.map((p, idx) => {
    const x =
      evolution.length === 1
        ? padL + plotW / 2
        : padL + (idx / (evolution.length - 1)) * plotW;
    const y = padT + plotH - (Math.max(0, Math.min(100, p.taxa)) / 100) * plotH;
    return { ...p, x, y };
  });

  // Área com gradiente azul editorial
  const gradArea = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  gradArea.addColorStop(0, "rgba(91, 130, 186, 0.36)");
  gradArea.addColorStop(1, "rgba(91, 130, 186, 0.03)");

  ctx.beginPath();
  ctx.moveTo(pts[0].x, padT + plotH);
  ctx.lineTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    ctx.bezierCurveTo(midX, pts[i].y, midX, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
  }
  ctx.lineTo(pts[pts.length - 1].x, padT + plotH);
  ctx.closePath();
  ctx.fillStyle = gradArea;
  ctx.fill();

  // Linha curva principal
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    ctx.bezierCurveTo(midX, pts[i].y, midX, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
  }
  ctx.strokeStyle = COR.blue;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Pontos + valores + datas
  const passoRotulo = pts.length > 7 ? 2 : 1;
  pts.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4.6, 0, Math.PI * 2);
    ctx.fillStyle = COR.blue;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    if (idx % passoRotulo === 0 || idx === pts.length - 1) {
      const labelX =
        idx === 0 && pts.length > 1
          ? Math.max(pt.x + 8, padL + 10)
          : idx === pts.length - 1 && pts.length > 1
            ? Math.min(pt.x - 4, W - padR - 4)
            : pt.x;

      ctx.fillStyle = COR.ink;
      ctx.font = '700 9.5px "Atkinson Hyperlegible", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${pt.taxa}%`, labelX, Math.max(13, pt.y - 7));

      ctx.fillStyle = COR.muted;
      ctx.font = '700 9px "Atkinson Hyperlegible", system-ui, sans-serif';
      ctx.textBaseline = "top";
      ctx.fillText(pt.rotulo, pt.x, padT + plotH + 8);
    }
  });

  return canvas.toDataURL("image/png");
}

function renderTempoPorJogoCanvas(jogados, larguraPx = 360) {
  const W = larguraPx;
  const H = 178;
  const { canvas, ctx } = criarCanvas(W, H, 3);

  const lista = jogados.filter((g) => g.average_duration_seconds !== null).slice(0, 6);
  const padL = 36;
  const padR = 16;
  const padT = 24;
  const padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxSeg = Math.max(30, ...lista.map((g) => g.average_duration_seconds || 0));
  const topo = Math.ceil(maxSeg / 20) * 20;

  ctx.font = '700 9px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 3; i++) {
    const val = Math.round((topo * i) / 3);
    const y = padT + plotH - (val / topo) * plotH;
    ctx.strokeStyle = i === 0 ? "#D7CFC0" : "#EAE4D8";
    ctx.lineWidth = 1;
    ctx.setLineDash(i === 0 ? [] : [3, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COR.muted;
    ctx.fillText(`${val}s`, padL - 5, y);
  }

  const slotW = plotW / Math.max(1, lista.length);
  const barW = Math.min(34, slotW * 0.54);

  lista.forEach((g, idx) => {
    const seg = g.average_duration_seconds || 0;
    const bh = Math.max(6, (seg / topo) * plotH);
    const x = padL + idx * slotW + (slotW - barW) / 2;
    const y = padT + plotH - bh;
    const cor = g.color || corDoJogo(g.game_id, g.name);

    desenharRetanguloArredondado(ctx, x, y, barW, bh, 7);
    ctx.fillStyle = cor;
    ctx.fill();

    // Valor no topo
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = COR.ink;
    ctx.font = '700 9.5px "Atkinson Hyperlegible", system-ui, sans-serif';
    ctx.fillText(formatarTempoCurto(seg), x + barW / 2, y - 4);

    // Rótulo embaixo: quebra por palavra na largura da coluna (até 2 linhas), sem cortar palavras ao meio.
    ctx.fillStyle = COR.muted;
    ctx.font = '700 8.8px "Atkinson Hyperlegible", system-ui, sans-serif';
    ctx.textBaseline = "top";
    const larguraRotulo = Math.max(barW, slotW - 6);
    const linhasRotulo = [];
    for (const palavra of g.name.split(" ")) {
      const atual = linhasRotulo[linhasRotulo.length - 1];
      if (atual !== undefined && ctx.measureText(`${atual} ${palavra}`).width <= larguraRotulo) {
        linhasRotulo[linhasRotulo.length - 1] = `${atual} ${palavra}`;
      } else {
        linhasRotulo.push(palavra);
      }
    }
    if (linhasRotulo.length > 2) linhasRotulo.splice(1, linhasRotulo.length, linhasRotulo.slice(1).join(" "));
    linhasRotulo.forEach((texto, i) => {
      let t = texto;
      while (t.length > 3 && ctx.measureText(t).width > larguraRotulo) t = t.slice(0, -1);
      ctx.fillText(t === texto ? t : `${t.slice(0, -1)}…`, x + barW / 2, padT + plotH + 7 + i * 11);
    });
  });

  return canvas.toDataURL("image/png");
}

// =====================================================================
// VETORES AUXILIARES NO PDF (Logo, estrelas, badges, rodapé)
// =====================================================================

function desenharLogoQuatroBolinhas(doc, x, y, tamanho = 6.5) {
  const r = tamanho * 0.21;
  const off1 = tamanho * 0.27;
  const off2 = tamanho * 0.73;
  setFill(doc, "#D9534F");
  doc.circle(x + off1, y + off1, r, "F");
  setFill(doc, "#E8B638");
  doc.circle(x + off2, y + off1, r, "F");
  setFill(doc, "#2F6FD6");
  doc.circle(x + off1, y + off2, r, "F");
  setFill(doc, "#2D8A56");
  doc.circle(x + off2, y + off2, r, "F");
}

function desenharEstrelaVetor(doc, cx, cy, rExt, corPreenchimento, corBorda = null) {
  const rInt = rExt * 0.46;
  const pontos = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rExt : rInt;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    pontos.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
  }
  const deltas = [];
  for (let i = 1; i < pontos.length; i++) {
    deltas.push([pontos[i][0] - pontos[i - 1][0], pontos[i][1] - pontos[i - 1][1]]);
  }
  setFill(doc, corPreenchimento);
  if (corBorda) {
    setStroke(doc, corBorda);
    doc.setLineWidth(0.22);
    doc.lines(deltas, pontos[0][0], pontos[0][1], [1, 1], "FD", true);
  } else {
    doc.lines(deltas, pontos[0][0], pontos[0][1], [1, 1], "F", true);
  }
}

function desenharCabecalhoContinuacao(doc, fontes, dados) {
  // Faixa colorida sutil no topo da página 2+
  const faixaCores = ["#5C89C7", "#3B9B7E", "#E0AE4C", "#DE8668"];
  const segW = PAGE_W / faixaCores.length;
  faixaCores.forEach((c, i) => {
    setFill(doc, c);
    doc.rect(i * segW, 0, segW + 0.5, 2.4, "F");
  });

  desenharLogoQuatroBolinhas(doc, MARGIN, 9.5, 5.5);
  doc.setFont(fontes.display, "bold");
  doc.setFontSize(11);
  setTextCol(doc, COR.ink);
  doc.text("Cantinho das Cores", MARGIN + 7.2, 13.7);

  doc.setFont(fontes.sans, "normal");
  doc.setFontSize(8.5);
  setTextCol(doc, COR.muted);
  const sub = limparTexto(`${dados.childName}  ·  ${dados.periodLabel}`, fontes.utf8);
  doc.text(sub, PAGE_W - MARGIN, 13.5, { align: "right" });

  setStroke(doc, COR.border);
  doc.setLineWidth(0.35);
  doc.line(MARGIN, 17.5, PAGE_W - MARGIN, 17.5);
  return 23;
}

function desenharRodapes(doc, fontes, miniNuviDataUrl, dados) {
  const totalPaginas = doc.getNumberOfPages();
  const emitido = formatarDataHora(dados.generatedAt);

  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    setStroke(doc, COR.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, FOOTER_Y - 5.5, PAGE_W - MARGIN, FOOTER_Y - 5.5);

    doc.addImage(miniNuviDataUrl, "PNG", MARGIN, FOOTER_Y - 3.6, 8.6, 6);

    doc.setFont(fontes.display, "bold");
    doc.setFontSize(8.5);
    setTextCol(doc, COR.ink);
    doc.text("Cantinho das Cores", MARGIN + 10.5, FOOTER_Y + 0.4);

    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(7.8);
    setTextCol(doc, COR.muted);
    doc.text(
      limparTexto(`·  Relatório Pedagógico  ·  Emitido em ${emitido}`, fontes.utf8),
      MARGIN + 40.5,
      FOOTER_Y + 0.4
    );

    doc.setFont(fontes.sans, "bold");
    doc.setFontSize(8);
    setTextCol(doc, COR.blue);
    doc.text(`Página ${p} de ${totalPaginas}`, PAGE_W - MARGIN, FOOTER_Y + 0.4, { align: "right" });
  }
}

// =====================================================================
// CONSTRUTOR PRINCIPAL DO PDF PEDAGÓGICO
// =====================================================================

export async function exportarRelatorioPdf(dados, { nomeArquivo } = {}) {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => {});
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const fontes = await carregarFontesMarca(doc);
  const narrativa = gerarNarrativaNuvi(dados);
  const { summary } = dados;

  // Fundo editorial creme muito suave na Página 1
  const pintarFundoPagina = () => {
    setFill(doc, COR.cream);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  };
  pintarFundoPagina();

  const garantirEspaco = (yAtual, alturaNecessaria) => {
    if (yAtual + alturaNecessaria <= SAFE_BOTTOM_Y) return yAtual;
    doc.addPage();
    pintarFundoPagina();
    return desenharCabecalhoContinuacao(doc, fontes, dados);
  };

  // -------------------------------------------------------------------
  // 1. BANNER ILUSTRADO COM A MARCA E A NUVEM NUVI
  // -------------------------------------------------------------------
  const bannerY = 10;
  const bannerH = 51;
  const bannerImg = renderBannerHeaderCanvas();
  doc.addImage(bannerImg, "PNG", MARGIN, bannerY, CONTENT_W, bannerH);

  // Marca Cantinho das Cores (topo esquerdo do banner)
  desenharLogoQuatroBolinhas(doc, MARGIN + 6, bannerY + 6.5, 6.4);
  doc.setFont(fontes.display, "bold");
  doc.setFontSize(12.5);
  setTextCol(doc, COR.ink);
  doc.text("Cantinho das Cores", MARGIN + 14.2, bannerY + 11.2);

  // Etiqueta RELATÓRIO PEDAGÓGICO
  setFill(doc, "#FFFFFF");
  setStroke(doc, "#BBD6F2");
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN + 57, bannerY + 6.8, 41.5, 5.8, 2.9, 2.9, "FD");
  doc.setFont(fontes.sans, "bold");
  doc.setFontSize(6.8);
  setTextCol(doc, COR.blue);
  doc.text("RELATÓRIO PEDAGÓGICO", MARGIN + 77.75, bannerY + 10.6, { align: "center" });

  // Avatar circular colorido + Nome da criança + Idade + Período
  const avX = MARGIN + 12.2;
  const avY = bannerY + 23.2;
  setFill(doc, corAvatar(dados.childName));
  doc.circle(avX, avY, 6.2, "F");
  doc.setFont(fontes.display, "bold");
  doc.setFontSize(13);
  setTextCol(doc, "#FFFFFF");
  const inicial = (dados.childName || "C").trim().charAt(0).toUpperCase();
  doc.text(inicial, avX, avY + 1.5, { align: "center" });

  doc.setFont(fontes.display, "bold");
  doc.setFontSize(18.5);
  setTextCol(doc, COR.ink);
  const nomeExibicao = truncarTexto(doc, limparTexto(dados.childName, fontes.utf8), 76);
  doc.text(nomeExibicao, MARGIN + 21, bannerY + 22.8);

  // Subtítulo com idade e período
  doc.setFont(fontes.sans, "normal");
  doc.setFontSize(8.8);
  setTextCol(doc, COR.muted);
  const metaLinha = [
    dados.childAge ? `${dados.childAge} anos` : null,
    `Período: ${dados.periodLabel}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(limparTexto(metaLinha, fontes.utf8), MARGIN + 21, bannerY + 28.1);

  // Selo de conquista colorido
  setFill(doc, narrativa.selo.fundo);
  setStroke(doc, mixHex(narrativa.selo.cor, 0.45));
  doc.setLineWidth(0.3);
  doc.setFont(fontes.sans, "bold");
  doc.setFontSize(7.6);
  const seloTxt = truncarTexto(doc, limparTexto(narrativa.selo.titulo, fontes.utf8), 54 - 11);
  const seloW = Math.min(54, doc.getTextWidth(seloTxt) + 11);
  doc.roundedRect(MARGIN + 104, bannerY + 6.7, seloW, 6, 3, 3, "FD");
  desenharEstrelaVetor(doc, MARGIN + 107.6, bannerY + 9.7, 1.8, narrativa.selo.cor);
  setTextCol(doc, narrativa.selo.cor);
  doc.text(seloTxt, MARGIN + 111.2, bannerY + 10.6);

  // Balão de fala da Nuvi (apontando para a mascote à direita!)
  const balaoX = MARGIN + 6;
  const balaoY = bannerY + 32.8;
  const balaoW = 128;
  const balaoH = 14.2;
  setFill(doc, "#FFFFFF");
  setStroke(doc, "#C7DCF2");
  doc.setLineWidth(0.35);
  doc.roundedRect(balaoX, balaoY, balaoW, balaoH, 4, 4, "FD");

  // Pontinha do balão voltada para a Nuvi
  setFill(doc, "#FFFFFF");
  doc.triangle(
    balaoX + balaoW - 0.4,
    balaoY + 4.8,
    balaoX + balaoW + 4.4,
    balaoY + 6.8,
    balaoX + balaoW - 0.4,
    balaoY + 9.2,
    "F"
  );
  setStroke(doc, "#C7DCF2");
  doc.line(balaoX + balaoW, balaoY + 4.8, balaoX + balaoW + 4.4, balaoY + 6.8);
  doc.line(balaoX + balaoW + 4.4, balaoY + 6.8, balaoX + balaoW, balaoY + 9.2);

  doc.setFont(fontes.sans, "bold");
  doc.setFontSize(7.4);
  setTextCol(doc, COR.blue);
  doc.text("Nuvi diz:", balaoX + 4, balaoY + 4.8);

  doc.setFont(fontes.sans, "normal");
  setTextCol(doc, COR.ink);
  // Fala longa (nome ou jogo comprido): diminui a letra para caber em até 3 linhas, sem cortar no meio.
  const falaLimpa = limparTexto(narrativa.fala, fontes.utf8);
  let tamFala = 8;
  doc.setFontSize(tamFala);
  let linhasFala = doc.splitTextToSize(falaLimpa, balaoW - 19);
  if (linhasFala.length > 2) {
    tamFala = 7;
    doc.setFontSize(tamFala);
    linhasFala = doc.splitTextToSize(falaLimpa, balaoW - 19);
  }
  if (linhasFala.length > 3) {
    linhasFala = [...linhasFala.slice(0, 2), truncarTexto(doc, `${linhasFala.slice(2).join(" ")}`, balaoW - 19)];
  }
  doc.text(linhasFala, balaoX + 16.5, balaoY + (linhasFala.length > 2 ? 4.3 : 4.8), { lineHeightFactor: tamFala < 8 ? 1.25 : 1.32 });

  let y = bannerY + bannerH + 5.5;

  // -------------------------------------------------------------------
  // ESTADO VAZIO ACOLHEDOR (quando não há partidas no período)
  // -------------------------------------------------------------------
  if (summary.total_matches === 0) {
    setFill(doc, "#FFFFFF");
    setStroke(doc, COR.border);
    doc.setLineWidth(0.35);
    doc.roundedRect(MARGIN, y, CONTENT_W, 56, 4.5, 4.5, "FD");

    doc.setFont(fontes.display, "bold");
    doc.setFontSize(14);
    setTextCol(doc, COR.ink);
    doc.text("Ainda não há partidas registradas neste período", PAGE_W / 2, y + 18, { align: "center" });

    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(9.5);
    setTextCol(doc, COR.muted);
    const convite = doc.splitTextToSize(
      limparTexto(
        `Assim que ${dados.childName} brincar nos jogos do Cantinho das Cores, este relatório trará gráficos coloridos de desempenho, evolução diária, precisão e dicas personalizadas da Nuvi.`,
        fontes.utf8
      ),
      CONTENT_W - 28
    );
    doc.text(convite, PAGE_W / 2, y + 27, { align: "center", lineHeightFactor: 1.45 });

    // Pílulas dos 6 jogos convidando a explorar
    const jogosConvite = [
      { id: "cores", nome: "Acerte a cor" },
      { id: "encaixe", nome: "Encaixe as formas" },
      { id: "corforma", nome: "Cor e forma" },
      { id: "ligar", nome: "Ligue ao nome" },
      { id: "falar", nome: "Vamos falar" },
      { id: "frutas", nome: "Bloquinho de Frutas" },
    ];
    let px = MARGIN + 10;
    const py = y + 43;
    doc.setFont(fontes.sans, "bold");
    doc.setFontSize(7.4);
    jogosConvite.forEach((jg) => {
      const cor = corDoJogo(jg.id, jg.nome);
      const pw = doc.getTextWidth(jg.nome) + 6.5;
      if (px + pw <= PAGE_W - MARGIN - 6) {
        setFill(doc, mixHex(cor, 0.86));
        setStroke(doc, mixHex(cor, 0.45));
        doc.setLineWidth(0.25);
        doc.roundedRect(px, py, pw, 6.2, 3.1, 3.1, "FD");
        setTextCol(doc, cor);
        doc.text(jg.nome, px + pw / 2, py + 4.1, { align: "center" });
        px += pw + 2.4;
      }
    });

    const miniNuvi = renderMiniNuviCanvas();
    desenharRodapes(doc, fontes, miniNuvi, dados);
    const slugVazio = (dados.childName || "crianca").toLowerCase().replace(/[^a-z0-9]+/gi, "-");
    doc.save(nomeArquivo || `relatorio-cantinho-das-cores-${slugVazio}.pdf`);
    return;
  }

  // -------------------------------------------------------------------
  // 2. QUATRO CARTÕES DE KPI COLORIDOS
  // -------------------------------------------------------------------
  const gapKpi = 3.5;
  const kpiW = (CONTENT_W - gapKpi * 3) / 4;
  const kpiH = 24.5;

  const kpis = [
    {
      rotulo: "Partidas Concluídas",
      valor: `${summary.completed_matches}`,
      sub:
        summary.abandoned_matches > 0
          ? `de ${summary.total_matches} · ${summary.abandoned_matches} aband.`
          : `de ${summary.total_matches} jogadas`,
      cor: COR.lavender,
      fundo: COR.lavenderSoft,
    },
    {
      rotulo: "Pontuação Média",
      valor: summary.average_score === null ? "—" : `${summary.average_score}/100`,
      sub: null,
      estrelas: narrativa.estrelas,
      cor: COR.gold,
      fundo: COR.goldSoft,
    },
    {
      rotulo: "Tempo Médio",
      valor: formatarTempoCurto(summary.average_duration_seconds),
      sub: "por partida concluída",
      cor: COR.blue,
      fundo: COR.blueSoft,
    },
    {
      rotulo: "Taxa de Conclusão",
      valor: `${summary.completion_rate}%`,
      sub: `${summary.total_correct} acertos · ${summary.total_errors} erros`,
      cor: COR.mint,
      fundo: COR.mintSoft,
    },
  ];

  kpis.forEach((k, idx) => {
    const kx = MARGIN + idx * (kpiW + gapKpi);
    setFill(doc, "#FFFFFF");
    setStroke(doc, COR.border);
    doc.setLineWidth(0.32);
    doc.roundedRect(kx, y, kpiW, kpiH, 3.6, 3.6, "FD");

    // Barra superior colorida no cartão
    setFill(doc, k.cor);
    doc.roundedRect(kx + 0.6, y + 0.4, kpiW - 1.2, 2.2, 1.1, 1.1, "F");

    // Etiqueta
    doc.setFont(fontes.sans, "bold");
    doc.setFontSize(7.4);
    setTextCol(doc, COR.muted);
    doc.text(limparTexto(k.rotulo, fontes.utf8), kx + 3.6, y + 7.2);

    // Valor principal em Fredoka
    doc.setFont(fontes.display, "bold");
    doc.setFontSize(15.5);
    setTextCol(doc, COR.ink);
    doc.text(limparTexto(k.valor, fontes.utf8), kx + 3.6, y + 15.6);

    // Estrelinhas ou legenda auxiliar
    if (k.estrelas !== undefined) {
      for (let e = 0; e < 5; e++) {
        desenharEstrelaVetor(
          doc,
          kx + 5.2 + e * 4.4,
          y + 20.6,
          1.7,
          e < k.estrelas ? "#F4BC33" : "#E6DFD1"
        );
      }
    } else if (k.sub) {
      doc.setFont(fontes.sans, "normal");
      doc.setFontSize(7.2);
      setTextCol(doc, COR.muted);
      doc.text(truncarTexto(doc, limparTexto(k.sub, fontes.utf8), kpiW - 7), kx + 3.6, y + 21.3);
    }
  });

  y += kpiH + 5;

  // -------------------------------------------------------------------
  // 3. LINHA DE GRÁFICOS (DONUTS DE PRECISÃO/CONCLUSÃO + EVOLUÇÃO/TEMPO)
  // -------------------------------------------------------------------
  const chartRowH = 57;
  const colGap = 4;
  const leftColW = 88;
  const rightColW = CONTENT_W - leftColW - colGap; // 92mm

  // Card Esquerdo: Precisão & Conclusão
  setFill(doc, "#FFFFFF");
  setStroke(doc, COR.border);
  doc.setLineWidth(0.32);
  doc.roundedRect(MARGIN, y, leftColW, chartRowH, 4, 4, "FD");

  doc.setFont(fontes.display, "bold");
  doc.setFontSize(10.5);
  setTextCol(doc, COR.ink);
  doc.text("Precisão e Engajamento", MARGIN + 4.5, y + 7.2);

  doc.setFont(fontes.sans, "normal");
  doc.setFontSize(7.4);
  setTextCol(doc, COR.muted);
  doc.text("Acertos vs. erros e taxa de conclusão", MARGIN + 4.5, y + 11.4);

  const donutsImg = renderDonutsCanvas(summary, narrativa.precisao);
  doc.addImage(donutsImg, "PNG", MARGIN + 2.5, y + 12.6, leftColW - 5, 42.5);

  // Card Direito: Evolução da Pontuação (se 2+ dias) OU Tempo Médio por Jogo
  const rightX = MARGIN + leftColW + colGap;
  setFill(doc, "#FFFFFF");
  setStroke(doc, COR.border);
  doc.setLineWidth(0.32);
  doc.roundedRect(rightX, y, rightColW, chartRowH, 4, 4, "FD");

  const usarEvolucao = dados.evolution && dados.evolution.length >= 2;
  const temTempoJogos = narrativa.jogados.some((g) => g.average_duration_seconds !== null);

  doc.setFont(fontes.display, "bold");
  doc.setFontSize(10.5);
  setTextCol(doc, COR.ink);
  doc.text(
    usarEvolucao ? "Evolução da Pontuação" : "Ritmo Médio por Jogo",
    rightX + 4.5,
    y + 7.2
  );

  doc.setFont(fontes.sans, "normal");
  doc.setFontSize(7.4);
  setTextCol(doc, COR.muted);
  doc.text(
    usarEvolucao
      ? "Média diária nas partidas concluídas"
      : "Tempo médio por partida concluída",
    rightX + 4.5,
    y + 11.4
  );

  if (usarEvolucao) {
    const evoImg = renderEvolucaoCanvas(dados.evolution);
    doc.addImage(evoImg, "PNG", rightX + 2.5, y + 12.6, rightColW - 5, 42.5);
  } else if (temTempoJogos) {
    const tempoImg = renderTempoPorJogoCanvas(narrativa.jogados);
    doc.addImage(tempoImg, "PNG", rightX + 2.5, y + 12.6, rightColW - 5, 42.5);
  } else {
    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(8.5);
    setTextCol(doc, COR.muted);
    doc.text(
      "Conclua partidas para acompanhar o ritmo.",
      rightX + rightColW / 2,
      y + 34,
      { align: "center" }
    );
  }

  y += chartRowH + 5;

  // -------------------------------------------------------------------
  // 4. GRÁFICO DE BARRAS HORIZONTAIS — DESEMPENHO POR JOGO & HABILIDADES
  // -------------------------------------------------------------------
  const jogadosOrdenados = [...narrativa.jogados].sort(
    (a, b) => (b.average_score ?? 0) - (a.average_score ?? 0)
  );
  const temOutrosJogos = narrativa.naoJogados.length > 0 || narrativa.soAbandonados.length > 0;
  const linhaJogoH = 11.6;
  const jogosCardH =
    15 +
    Math.max(1, jogadosOrdenados.length) * linhaJogoH +
    (temOutrosJogos ? 10 : 3);

  y = garantirEspaco(y, jogosCardH);

  setFill(doc, "#FFFFFF");
  setStroke(doc, COR.border);
  doc.setLineWidth(0.32);
  doc.roundedRect(MARGIN, y, CONTENT_W, jogosCardH, 4, 4, "FD");

  doc.setFont(fontes.display, "bold");
  doc.setFontSize(11);
  setTextCol(doc, COR.ink);
  doc.text("Desempenho por Jogo e Habilidades", MARGIN + 5, y + 7.5);

  doc.setFont(fontes.sans, "normal");
  doc.setFontSize(7.6);
  setTextCol(doc, COR.muted);
  doc.text(
    "Somente partidas concluídas entram na pontuação e tempo médio",
    PAGE_W - MARGIN - 5,
    y + 7.3,
    { align: "right" }
  );

  let jy = y + 13.5;
  if (jogadosOrdenados.length === 0) {
    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(8.8);
    setTextCol(doc, COR.muted);
    doc.text(
      "Nenhuma atividade concluída ainda neste período. Incentive a concluir uma partida completa!",
      MARGIN + 5,
      jy + 4
    );
    jy += linhaJogoH;
  } else {
    const colNomeW = 62;
    const barX = MARGIN + 5 + colNomeW + 2;
    const barW = 73;
    const metaX = barX + barW + 4;

    jogadosOrdenados.forEach((g) => {
      const cor = g.color || corDoJogo(g.game_id, g.name);
      const pct = Math.max(0, Math.min(100, g.average_score ?? 0));

      // Bolinha colorida do jogo
      setFill(doc, cor);
      doc.circle(MARGIN + 7.2, jy + 3.2, 1.8, "F");

      // Nome do jogo + habilidade pedagógica
      doc.setFont(fontes.sans, "bold");
      doc.setFontSize(8.8);
      setTextCol(doc, COR.ink);
      doc.text(truncarTexto(doc, limparTexto(g.name, fontes.utf8), colNomeW - 6), MARGIN + 10.6, jy + 3.8);

      doc.setFont(fontes.sans, "normal");
      doc.setFontSize(7);
      setTextCol(doc, COR.muted);
      doc.text(
        truncarTexto(doc, limparTexto(g.skill || "", fontes.utf8), colNomeW - 6),
        MARGIN + 10.6,
        jy + 7.7
      );

      // Trilho da barra horizontal
      setFill(doc, COR.track);
      doc.roundedRect(barX, jy + 2.2, barW, 4.6, 2.3, 2.3, "F");

      // Barra preenchida com a cor do jogo
      const fillW = Math.max(4.8, (pct / 100) * barW);
      setFill(doc, cor);
      doc.roundedRect(barX, jy + 2.2, fillW, 4.6, 2.3, 2.3, "F");

      // Pílula de pontuação
      setFill(doc, mixHex(cor, 0.85));
      doc.roundedRect(metaX, jy + 1.2, 14.5, 6.4, 3.2, 3.2, "F");
      doc.setFont(fontes.display, "bold");
      doc.setFontSize(8.4);
      setTextCol(doc, cor);
      doc.text(`${pct}%`, metaX + 7.25, jy + 5.4, { align: "center" });

      // Partidas e tempo médio
      doc.setFont(fontes.sans, "normal");
      doc.setFontSize(7.4);
      setTextCol(doc, COR.muted);
      const infoTxt = limparTexto(
        `${g.completed_matches}x · ${formatarTempoCurto(g.average_duration_seconds)}`,
        fontes.utf8
      );
      doc.text(infoTxt, PAGE_W - MARGIN - 5, jy + 5.2, { align: "right" });

      jy += linhaJogoH;
    });
  }

  if (temOutrosJogos) {
    setFill(doc, COR.paper);
    doc.roundedRect(MARGIN + 4.5, jy + 0.5, CONTENT_W - 9, 6.8, 2.5, 2.5, "F");
    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(7.3);
    setTextCol(doc, COR.muted);
    const partes = [];
    if (narrativa.soAbandonados.length > 0) {
      partes.push(`Em andamento: ${narrativa.soAbandonados.map((g) => g.name).join(", ")}`);
    }
    if (narrativa.naoJogados.length > 0) {
      partes.push(`Para explorar: ${narrativa.naoJogados.map((g) => g.name).join(", ")}`);
    }
    doc.text(
      truncarTexto(doc, limparTexto(partes.join("   ·   "), fontes.utf8), CONTENT_W - 15),
      MARGIN + 7.5,
      jy + 4.8
    );
  }

  y += jogosCardH + 5;

  // -------------------------------------------------------------------
  // 5. DESTAQUES PEDAGÓGICOS DA NUVI + OBSERVAÇÕES
  // -------------------------------------------------------------------
  const temDestaques = Boolean(narrativa.melhorJogo || narrativa.jogoAtencao);
  // Quebra as linhas com a MESMA fonte usada ao desenhar; senão a linha passa da borda do cartão.
  doc.setFont(fontes.sans, "normal");
  doc.setFontSize(8.2);
  const obsLinhasPreparadas = narrativa.observacoes.map((o) =>
    doc.splitTextToSize(limparTexto(o, fontes.utf8), CONTENT_W - 16)
  );
  const obsAlturaTexto = obsLinhasPreparadas.reduce((acc, ls) => acc + ls.length * 4.1 + 1.8, 0);
  const blocoObsH = Math.max(18, 12 + obsAlturaTexto);
  const blocoDestaquesH = temDestaques ? 28.5 : 0;
  const blocoTotalPedagogico = blocoDestaquesH + (temDestaques ? 4 : 0) + blocoObsH;

  y = garantirEspaco(y, blocoTotalPedagogico);

  if (temDestaques) {
    const destGap = 4;
    const destW = narrativa.jogoAtencao ? (CONTENT_W - destGap) / 2 : CONTENT_W;

    if (narrativa.melhorJogo) {
      const mj = narrativa.melhorJogo;
      setFill(doc, COR.mintSoft);
      setStroke(doc, "#BCE2CC");
      doc.setLineWidth(0.32);
      doc.roundedRect(MARGIN, y, destW, blocoDestaquesH, 4, 4, "FD");

      desenharEstrelaVetor(doc, MARGIN + 6.5, y + 6.4, 2.3, COR.gold);
      doc.setFont(fontes.sans, "bold");
      doc.setFontSize(7.6);
      setTextCol(doc, "#227557");
      doc.text("SUPER DESTAQUE DO PERÍODO", MARGIN + 10.6, y + 7.3);

      doc.setFont(fontes.display, "bold");
      doc.setFontSize(11.5);
      setTextCol(doc, COR.ink);
      doc.text(
        truncarTexto(doc, limparTexto(`${mj.name} (${mj.average_score}/100)`, fontes.utf8), destW - 10),
        MARGIN + 5,
        y + 13.8
      );

      doc.setFont(fontes.sans, "normal");
      doc.setFontSize(7.6);
      setTextCol(doc, COR.muted);
      const linhasMj = doc
        .splitTextToSize(limparTexto(`Habilidade em brilho: ${mj.skill}.`, fontes.utf8), destW - 10)
        .slice(0, 2);
      doc.text(linhasMj, MARGIN + 5, y + 19.2, { lineHeightFactor: 1.32 });
    }

    if (narrativa.jogoAtencao) {
      const ja = narrativa.jogoAtencao;
      const dx = MARGIN + destW + destGap;
      setFill(doc, COR.terracotaSoft);
      setStroke(doc, "#F0C8BA");
      doc.setLineWidth(0.32);
      doc.roundedRect(dx, y, destW, blocoDestaquesH, 4, 4, "FD");

      setFill(doc, COR.terracota);
      doc.circle(dx + 6.5, y + 6.4, 2.1, "F");
      doc.setFont(fontes.sans, "bold");
      doc.setFontSize(7.6);
      setTextCol(doc, "#B65336");
      doc.text("VALE PRATICAR COM CARINHO", dx + 10.6, y + 7.3);

      doc.setFont(fontes.display, "bold");
      doc.setFontSize(11.5);
      setTextCol(doc, COR.ink);
      const rotuloJa =
        ja.average_score !== null ? `${ja.name} (${ja.average_score}/100)` : `${ja.name} (em andamento)`;
      doc.text(truncarTexto(doc, limparTexto(rotuloJa, fontes.utf8), destW - 10), dx + 5, y + 13.8);

      doc.setFont(fontes.sans, "normal");
      doc.setFontSize(7.6);
      setTextCol(doc, COR.muted);
      const linhasJa = doc
        .splitTextToSize(
          limparTexto(`Brincar com calma reforça ${ja.skill.toLowerCase()}.`, fontes.utf8),
          destW - 10
        )
        .slice(0, 2);
      doc.text(linhasJa, dx + 5, y + 19.2, { lineHeightFactor: 1.32 });
    }

    y += blocoDestaquesH + 4.5;
  }

  // Observações Pedagógicas
  if (obsLinhasPreparadas.length > 0) {
    setFill(doc, COR.paper);
    setStroke(doc, COR.border);
    doc.setLineWidth(0.32);
    doc.roundedRect(MARGIN, y, CONTENT_W, blocoObsH, 4, 4, "FD");

    doc.setFont(fontes.display, "bold");
    doc.setFontSize(10.2);
    setTextCol(doc, COR.ink);
    doc.text("Observações Pedagógicas", MARGIN + 5, y + 7.2);

    let oy = y + 12.6;
    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(8.2);
    setTextCol(doc, COR.ink);
    const bulletCores = [COR.blue, COR.mint, COR.gold, COR.lavender, COR.terracota];
    obsLinhasPreparadas.forEach((linhas, i) => {
      setFill(doc, bulletCores[i % bulletCores.length]);
      doc.circle(MARGIN + 6.8, oy - 1.1, 1.15, "F");
      doc.text(linhas, MARGIN + 10.4, oy, { lineHeightFactor: 1.38 });
      oy += linhas.length * 4.1 + 1.8;
    });

    y += blocoObsH + 5;
  }

  // -------------------------------------------------------------------
  // 5B. GRÁFICO EXTRA DE RITMO POR JOGO (quando Página 1 exibiu Evolução)
  // -------------------------------------------------------------------
  if (usarEvolucao && temTempoJogos && narrativa.jogados.length >= 2) {
    const ritmoH = 54;
    y = garantirEspaco(y, ritmoH);

    setFill(doc, "#FFFFFF");
    setStroke(doc, COR.border);
    doc.setLineWidth(0.32);
    doc.roundedRect(MARGIN, y, CONTENT_W, ritmoH, 4, 4, "FD");

    doc.setFont(fontes.display, "bold");
    doc.setFontSize(10.6);
    setTextCol(doc, COR.ink);
    doc.text("Ritmo Médio por Atividade", MARGIN + 5, y + 7.2);

    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(7.4);
    setTextCol(doc, COR.muted);
    doc.text(
      "Tempo médio gasto em cada jogo concluído (ajuda a perceber onde há maior fluidez ou concentração)",
      MARGIN + 5,
      y + 11.4
    );

    const ritmoImg = renderTempoPorJogoCanvas(jogadosOrdenados, 700);
    doc.addImage(ritmoImg, "PNG", MARGIN + 4, y + 13, CONTENT_W - 8, 39);

    y += ritmoH + 5;
  }

  // -------------------------------------------------------------------
  // 6. HISTÓRICO RECENTE DE ATIVIDADES
  // -------------------------------------------------------------------
  const recentes = (dados.recentMatches || []).slice(0, 12);
  if (recentes.length > 0) {
    const tabelaCabH = 16;
    const linhaTabH = 7.2;
    const tabelaH = tabelaCabH + recentes.length * linhaTabH + 4;

    y = garantirEspaco(y, Math.min(tabelaH, 68));

    setFill(doc, "#FFFFFF");
    setStroke(doc, COR.border);
    doc.setLineWidth(0.32);
    const alturaCardTabela = Math.min(tabelaH, SAFE_BOTTOM_Y - y - 22);
    const maxLinhasCabem = Math.max(1, Math.floor((alturaCardTabela - tabelaCabH - 3) / linhaTabH));
    const linhasExibir = recentes.slice(0, maxLinhasCabem);
    const cardRealH = tabelaCabH + linhasExibir.length * linhaTabH + 3.5;

    doc.roundedRect(MARGIN, y, CONTENT_W, cardRealH, 4, 4, "FD");

    doc.setFont(fontes.display, "bold");
    doc.setFontSize(10.8);
    setTextCol(doc, COR.ink);
    doc.text("Histórico Recente de Atividades", MARGIN + 5, y + 7.2);

    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(7.4);
    setTextCol(doc, COR.muted);
    doc.text(
      `Últimas ${linhasExibir.length} atividade(s) do período`,
      PAGE_W - MARGIN - 5,
      y + 7.1,
      { align: "right" }
    );

    // Cabeçalho da tabela
    const thY = y + 10.2;
    setFill(doc, COR.paper);
    doc.rect(MARGIN + 1, thY, CONTENT_W - 2, 6, "F");
    doc.setFont(fontes.sans, "bold");
    doc.setFontSize(7.4);
    setTextCol(doc, COR.muted);
    doc.text("Jogo", MARGIN + 6, thY + 4.1);
    doc.text("Data", MARGIN + 72, thY + 4.1);
    doc.text("Acertos / Erros", MARGIN + 100, thY + 4.1);
    doc.text("Tempo", MARGIN + 132, thY + 4.1);
    doc.text("Nota", MARGIN + 150, thY + 4.1);
    doc.text("Status", PAGE_W - MARGIN - 6, thY + 4.1, { align: "right" });

    let ry = thY + 6;
    linhasExibir.forEach((m, idx) => {
      if (idx % 2 === 1) {
        setFill(doc, "#FAF8F3");
        doc.rect(MARGIN + 1, ry, CONTENT_W - 2, linhaTabH, "F");
      }

      const cor = corDoJogo(m.game_id, m.game_name);
      setFill(doc, cor);
      doc.circle(MARGIN + 7.2, ry + 3.6, 1.35, "F");

      doc.setFont(fontes.sans, "bold");
      doc.setFontSize(8);
      setTextCol(doc, COR.ink);
      doc.text(truncarTexto(doc, limparTexto(m.game_name, fontes.utf8), 58), MARGIN + 10.2, ry + 4.5);

      doc.setFont(fontes.sans, "normal");
      doc.setFontSize(7.8);
      setTextCol(doc, COR.muted);
      doc.text(formatarDataCompleta(m.played_at) || "—", MARGIN + 72, ry + 4.5);
      doc.text(`${m.correct_answers ?? 0} / ${m.incorrect_answers ?? 0}`, MARGIN + 100, ry + 4.5);
      doc.text(formatarTempoCurto(m.duration_seconds), MARGIN + 132, ry + 4.5);

      doc.setFont(fontes.sans, "bold");
      setTextCol(doc, COR.ink);
      doc.text(m.completed ? `${m.score}%` : "—", MARGIN + 150, ry + 4.5);

      // Pílula de status
      const stW = 20;
      const stX = PAGE_W - MARGIN - 5 - stW;
      setFill(doc, m.completed ? COR.mintSoft : COR.goldSoft);
      doc.roundedRect(stX, ry + 1.3, stW, 4.6, 2.3, 2.3, "F");
      doc.setFont(fontes.sans, "bold");
      doc.setFontSize(6.8);
      setTextCol(doc, m.completed ? "#227557" : COR.goldDeep);
      doc.text(m.completed ? "Concluída" : "Abandonada", stX + stW / 2, ry + 4.4, { align: "center" });

      ry += linhaTabH;
    });

    y += cardRealH + 5;
  }

  // -------------------------------------------------------------------
  // 6B. RECADINHO FINAL DA NUVI (quando há espaço confortável)
  // -------------------------------------------------------------------
  const miniNuvi = renderMiniNuviCanvas();
  if (y + 18 <= SAFE_BOTTOM_Y) {
    setFill(doc, "#EDF6FF");
    setStroke(doc, "#C7DCF2");
    doc.setLineWidth(0.32);
    doc.roundedRect(MARGIN, y, CONTENT_W, 17, 4, 4, "FD");
    doc.addImage(miniNuvi, "PNG", MARGIN + 4.5, y + 2.8, 16, 11.2);

    doc.setFont(fontes.display, "bold");
    doc.setFontSize(9.5);
    setTextCol(doc, COR.ink);
    doc.text("Dica carinhosa da Nuvi para família e escola", MARGIN + 23.5, y + 6.6);

    doc.setFont(fontes.sans, "normal");
    doc.setFontSize(7.8);
    setTextCol(doc, COR.muted);
    const dica = limparTexto(
      `Celebrar cada tentativa de ${dados.childName} fortalece a confiança e o prazer em aprender. Use o Modo Calmo sempre que quiser sessões ainda mais tranquilas!`,
      fontes.utf8
    );
    const linhasDica = doc.splitTextToSize(dica, CONTENT_W - 29).slice(0, 2);
    doc.text(linhasDica, MARGIN + 23.5, y + 10.9, { lineHeightFactor: 1.3 });
  }

  // -------------------------------------------------------------------
  // 7. RODAPÉ DA MARCA COM MINI NUVI EM TODAS AS PÁGINAS
  // -------------------------------------------------------------------
  desenharRodapes(doc, fontes, miniNuvi, dados);

  const slug = (dados.childName || "crianca")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  doc.save(nomeArquivo || `relatorio-cantinho-das-cores-${slug || "crianca"}.pdf`);
}
