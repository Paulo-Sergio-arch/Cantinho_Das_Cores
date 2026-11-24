function Svg({ size = 18, className = "", children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconVozOn(p) {
  return (
    <Svg {...p}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.8 5.8a9 9 0 0 1 0 12.4" />
    </Svg>
  );
}

export function IconVozOff(p) {
  return (
    <Svg {...p}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m22 9-6 6" />
      <path d="m16 9 6 6" />
    </Svg>
  );
}

export function IconAjustes(p) {
  return (
    <Svg {...p}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2.2" fill="currentColor" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2.2" fill="currentColor" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="11" cy="18" r="2.2" fill="currentColor" />
    </Svg>
  );
}

export function IconSair(p) {
  return (
    <Svg {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );
}

export function IconUsuario(p) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Svg>
  );
}

export function IconGamepad(p) {
  return (
    <Svg {...p}>
      <rect x="2.5" y="7" width="19" height="11" rx="5.5" />
      <line x1="8" y1="10.5" x2="8" y2="14.5" />
      <line x1="6" y1="12.5" x2="10" y2="12.5" />
      <circle cx="15.5" cy="11.2" r="0.9" fill="currentColor" />
      <circle cx="17.5" cy="13.5" r="0.9" fill="currentColor" />
    </Svg>
  );
}

export function IconBlocos(p) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <circle cx="17" cy="17" r="4" />
    </Svg>
  );
}

export function IconCriancas(p) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="16.8" cy="10" r="2.4" />
      <path d="M15.5 19.5h5a4 4 0 0 0-3.7-4" />
    </Svg>
  );
}

export function IconGrafico(p) {
  return (
    <Svg {...p}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="5.5" y="12" width="3.2" height="8" rx="1" />
      <rect x="10.4" y="8" width="3.2" height="12" rx="1" />
      <rect x="15.3" y="4.5" width="3.2" height="15.5" rx="1" />
    </Svg>
  );
}

export function IconFonte(p) {
  return (
    <Svg {...p}>
      <path d="M4 18 9.5 6 15 18" />
      <line x1="6.2" y1="14" x2="12.8" y2="14" />
      <line x1="18" y1="8" x2="18" y2="14" />
      <line x1="15" y1="11" x2="21" y2="11" />
    </Svg>
  );
}

export function IconContraste(p) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconNuvemCalma(p) {
  return (
    <Svg {...p}>
      <path d="M7.5 18h9.5a4 4 0 0 0 .5-7.95A5.5 5.5 0 0 0 6.8 9.2 4.2 4.2 0 0 0 7.5 18Z" />
    </Svg>
  );
}

export function IconSinoOn(p) {
  return (
    <Svg {...p}>
      <path d="M6 16h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v3.5L6 16Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Svg>
  );
}

export function IconSinoOff(p) {
  return (
    <Svg {...p}>
      <path d="M9.2 6.2A4.5 4.5 0 0 1 16.5 10v3.5l1.5 2.5h-4" />
      <path d="M7.5 10.5v3L6 16h6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </Svg>
  );
}

export function IconVelocidade(p) {
  return (
    <Svg {...p}>
      <path d="M4.5 16.5a8 8 0 1 1 15 0" />
      <line x1="12" y1="15" x2="15.5" y2="10.5" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </Svg>
  );
}

export function IconEstrela(p) {
  return (
    <Svg {...p}>
      <polygon points="12 3.5 14.6 8.8 20.5 9.6 16.2 13.8 17.2 19.6 12 16.8 6.8 19.6 7.8 13.8 3.5 9.6 9.4 8.8 12 3.5" />
    </Svg>
  );
}

export function IconOlhoAberto(p) {
  return (
    <Svg {...p}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Svg>
  );
}

export function IconOlhoFechado(p) {
  return (
    <Svg {...p}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16.5 16.5 0 0 1-3.1 3.9" />
      <path d="M6.5 7.5A15.6 15.6 0 0 0 2.5 12s3.5 6 9.5 6a9.6 9.6 0 0 0 4.3-1" />
    </Svg>
  );
}

export function IconCasa(p) {
  return (
    <Svg {...p}>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3.5v-5.5h3V20H17a1 1 0 0 0 1-1V9.5" />
    </Svg>
  );
}

export function IconCheck(p) {
  return (
    <Svg {...p}>
      <polyline points="4.5 12.5 9.5 17.5 19.5 6.5" />
    </Svg>
  );
}

export function IconCadeado(p) {
  return (
    <Svg {...p}>
      <rect x="5" y="11" width="14" height="9.5" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

export function IconFechar(p) {
  return (
    <Svg {...p}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </Svg>
  );
}

export function IconMais(p) {
  return (
    <Svg {...p}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  );
}

export function IconChacoalhar(p) {
  return (
    <Svg {...p}>
      <path d="M4 12a8 8 0 0 1 14-5.2" />
      <polyline points="18 3.5 18 7.5 14 7.5" />
      <path d="M20 12a8 8 0 0 1-14 5.2" />
      <polyline points="6 20.5 6 16.5 10 16.5" />
    </Svg>
  );
}

export function IconCubo(p) {
  return (
    <Svg {...p}>
      <polygon points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3" />
      <polyline points="4 7.5 12 12 20 7.5" />
      <line x1="12" y1="12" x2="12" y2="21" />
    </Svg>
  );
}

export function IconQuadrado(p) {
  return (
    <Svg {...p}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
    </Svg>
  );
}

export function IconReiniciar(p) {
  return (
    <Svg {...p}>
      <path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.5" />
      <polyline points="4 4 4 8.5 8.5 8.5" />
    </Svg>
  );
}

export function IconEditar(p) {
  return (
    <Svg {...p}>
      <path d="M15.5 4.5 19.5 8.5 9 19H5v-4L15.5 4.5Z" />
    </Svg>
  );
}

export function IconLixeira(p) {
  return (
    <Svg {...p}>
      <polyline points="4 7 20 7" />
      <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
      <path d="M6.5 7 7.5 19a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </Svg>
  );
}

export function IconCopiar(p) {
  return (
    <Svg {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 3h9a1.5 1.5 0 0 1 1.5 1.5V6" />
    </Svg>
  );
}

export function IconImprimir(p) {
  return (
    <Svg {...p}>
      <path d="M6 9V4h12v5" />
      <rect x="3.5" y="9" width="17" height="7" rx="2" />
      <rect x="6.5" y="14" width="11" height="6" rx="1" fill="none" />
    </Svg>
  );
}

export function IconDownload(p) {
  return (
    <Svg {...p}>
      <path d="M12 4v11" />
      <polyline points="7.5 10.5 12 15 16.5 10.5" />
      <path d="M4 19.5h16" />
    </Svg>
  );
}

export function IconEnviar(p) {
  return (
    <Svg {...p}>
      <path d="M21 4 10 14" />
      <polygon points="21 4 14.5 20.5 10 14 3.5 9.5 21 4" />
    </Svg>
  );
}

export function IconFala(p) {
  return (
    <Svg {...p}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" />
      <circle cx="9" cy="10" r="0.9" fill="currentColor" />
      <circle cx="12" cy="10" r="0.9" fill="currentColor" />
      <circle cx="15" cy="10" r="0.9" fill="currentColor" />
    </Svg>
  );
}

export function IconSetaDireita(p) {
  return (
    <Svg {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </Svg>
  );
}

export function IconEscudo(p) {
  return (
    <Svg {...p}>
      <path d="M12 3.5 5 6.5v5.3c0 4.5 3 7.7 7 8.7 4-1 7-4.2 7-8.7V6.5l-7-3Z" />
      <polyline points="9 12.2 11.2 14.4 15.5 9.8" />
    </Svg>
  );
}
