// Pictogramas SVG coloridos e consistentes para os jogos "Ligue ao nome" e "Vamos falar".
// Elimina inconsistências de emojis entre sistemas operacionais (ex.: gato monocromático no Linux/Chrome).

const INK = "#2B3A67";

function renderPictograma(id) {
  switch (id) {
    case "bola":
      return (
        <>
          <circle cx="32" cy="32" r="23" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
          <polygon points="32,20 41,27 38,38 26,38 23,27" fill={INK} />
          <path d="M32 20V9M41 27l11-4M38 38l8 10M26 38l-8 10M23 27l-11-4" stroke={INK} strokeWidth="2.8" />
          <circle cx="32" cy="32" r="23" fill="none" stroke={INK} strokeWidth="3" />
        </>
      );
    case "gato":
      return (
        <>
          <polygon points="14,12 24,22 13,28" fill="#FFAB4C" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="50,12 40,22 51,28" fill="#FFAB4C" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="16,17 22,22 16,25" fill="#FF9EB5" />
          <polygon points="48,17 42,22 48,25" fill="#FF9EB5" />
          <ellipse cx="32" cy="36" rx="20" ry="18" fill="#FFBA60" stroke={INK} strokeWidth="3" />
          <circle cx="24.5" cy="34" r="2.8" fill={INK} />
          <circle cx="39.5" cy="34" r="2.8" fill={INK} />
          <polygon points="29,39 35,39 32,43" fill="#FF6F91" />
          <path d="M26 45q3 3 6 0q3 3 6 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M10 37h9M10 42h9M45 37h9M45 42h9" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </>
      );
    case "casa":
      return (
        <>
          <polygon points="32,10 56,30 8,30" fill="#F25C54" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="14" y="30" width="36" height="24" rx="3" fill="#FFF2CC" stroke={INK} strokeWidth="3" />
          <rect x="27" y="38" width="10" height="16" rx="2" fill="#8E5B3A" stroke={INK} strokeWidth="2.6" />
          <rect x="18" y="35" width="6" height="6" rx="1" fill="#6EC6FF" stroke={INK} strokeWidth="2.2" />
          <rect x="40" y="35" width="6" height="6" rx="1" fill="#6EC6FF" stroke={INK} strokeWidth="2.2" />
        </>
      );
    case "maçã":
      return (
        <>
          <path d="M32 19c0-6 4-10 9-10" fill="none" stroke="#6E4427" strokeWidth="3.2" strokeLinecap="round" />
          <ellipse cx="39" cy="14" rx="6" ry="3.4" transform="rotate(-24 39 14)" fill="#3CC46E" stroke={INK} strokeWidth="2.2" />
          <path d="M32 22c-6-6-18-3-18 11 0 12 8 22 15 22 2 0 3-1 3-1s1 1 3 1c7 0 15-10 15-22 0-14-12-17-18-11Z" fill="#F25C54" stroke={INK} strokeWidth="3" />
          <ellipse cx="23" cy="31" rx="3.2" ry="6" transform="rotate(-14 23 31)" fill="#FFFFFF" opacity="0.4" />
        </>
      );
    case "sol":
      return (
        <>
          <g stroke="#FF9A2E" strokeWidth="4" strokeLinecap="round">
            <line x1="32" y1="6" x2="32" y2="12" />
            <line x1="32" y1="52" x2="32" y2="58" />
            <line x1="6" y1="32" x2="12" y2="32" />
            <line x1="52" y1="32" x2="58" y2="32" />
            <line x1="13.5" y1="13.5" x2="18" y2="18" />
            <line x1="46" y1="46" x2="50.5" y2="50.5" />
            <line x1="50.5" y1="13.5" x2="46" y2="18" />
            <line x1="18" y1="46" x2="13.5" y2="50.5" />
          </g>
          <circle cx="32" cy="32" r="15" fill="#FFC93C" stroke={INK} strokeWidth="3" />
          <circle cx="27" cy="30" r="2" fill={INK} />
          <circle cx="37" cy="30" r="2" fill={INK} />
          <path d="M27 36q5 4 10 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case "peixe":
      return (
        <>
          <polygon points="44,32 57,20 57,44" fill="#FF9A2E" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="28" cy="32" rx="18" ry="13" fill="#3E8EF0" stroke={INK} strokeWidth="3" />
          <path d="M27 19c4-6 10-6 12-1" fill="#FFC93C" stroke={INK} strokeWidth="2.5" />
          <circle cx="19" cy="29" r="3" fill="#FFFFFF" />
          <circle cx="18.5" cy="29" r="1.6" fill={INK} />
          <path d="M31 24q4 8 0 16M37 26q3 6 0 12" fill="none" stroke="#9AD6FF" strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
    case "flor":
      return (
        <>
          <line x1="32" y1="34" x2="32" y2="56" stroke="#24A159" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="41" cy="48" rx="6.5" ry="3.5" transform="rotate(-20 41 48)" fill="#3CC46E" stroke={INK} strokeWidth="2.2" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle
              key={a}
              cx={32 + Math.cos((a * Math.PI) / 180) * 12}
              cy={26 + Math.sin((a * Math.PI) / 180) * 12}
              r="7.5"
              fill="#FF6FB1"
              stroke={INK}
              strokeWidth="2.4"
            />
          ))}
          <circle cx="32" cy="26" r="7.5" fill="#FFC93C" stroke={INK} strokeWidth="2.6" />
        </>
      );
    case "pão":
      return (
        <>
          <path d="M10 38c0-13 10-20 22-20s22 7 22 20c0 6-4 10-10 10H20c-6 0-10-4-10-10Z" fill="#E9A858" stroke={INK} strokeWidth="3" />
          <path d="M21 25l-3 7M32 23l-3 8M43 25l-3 7" stroke="#A66524" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "leite":
      return (
        <>
          <polygon points="20,16 32,8 44,16 44,54 20,54" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="20" y="25" width="24" height="14" fill="#3E8EF0" stroke={INK} strokeWidth="2.6" />
          <path d="M20 16h24" stroke={INK} strokeWidth="2.6" />
          <circle cx="32" cy="32" r="4" fill="#FFFFFF" />
        </>
      );
    case "carro":
      return (
        <>
          <path d="M16 32 22 19h20l6 13Z" fill="#7CC4FF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="8" y="31" width="48" height="15" rx="6" fill="#F25C54" stroke={INK} strokeWidth="3" />
          <circle cx="20" cy="47" r="6.5" fill={INK} stroke="#FFFFFF" strokeWidth="2.2" />
          <circle cx="44" cy="47" r="6.5" fill={INK} stroke="#FFFFFF" strokeWidth="2.2" />
          <circle cx="51" cy="37" r="2.6" fill="#FFC93C" />
        </>
      );
    case "livro":
      return (
        <>
          <path d="M10 16c8 0 16 2 22 6 6-4 14-6 22-6v32c-8 0-16 2-22 6-6-4-14-6-22-6V16Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M10 16h22v32H10Z" fill="#E8F2FF" opacity="0.5" />
          <line x1="32" y1="22" x2="32" y2="54" stroke={INK} strokeWidth="3" />
          <line x1="15" y1="26" x2="26" y2="28" stroke="#3E8EF0" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="15" y1="34" x2="26" y2="36" stroke="#3E8EF0" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="38" y1="28" x2="49" y2="26" stroke="#3CC46E" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="38" y1="36" x2="49" y2="34" stroke="#3CC46E" strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
    case "cachorro":
      return (
        <>
          <ellipse cx="14" cy="31" rx="7" ry="14" transform="rotate(14 14 31)" fill="#A9714B" stroke={INK} strokeWidth="3" />
          <ellipse cx="50" cy="31" rx="7" ry="14" transform="rotate(-14 50 31)" fill="#A9714B" stroke={INK} strokeWidth="3" />
          <circle cx="32" cy="34" r="18" fill="#D99B66" stroke={INK} strokeWidth="3" />
          <ellipse cx="32" cy="42" rx="10" ry="7.5" fill="#FFF2DC" />
          <circle cx="25" cy="30" r="2.7" fill={INK} />
          <circle cx="39" cy="30" r="2.7" fill={INK} />
          <ellipse cx="32" cy="38" rx="4.2" ry="3" fill={INK} />
          <path d="M29 44q3 4 6 0" fill="none" stroke="#F25C54" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "elefante":
      return (
        <>
          <ellipse cx="14" cy="31" rx="9" ry="13" fill="#9BB5D6" stroke={INK} strokeWidth="3" />
          <ellipse cx="50" cy="31" rx="9" ry="13" fill="#9BB5D6" stroke={INK} strokeWidth="3" />
          <circle cx="32" cy="31" r="16" fill="#A9C4E4" stroke={INK} strokeWidth="3" />
          <path d="M32 36v13c0 4 5 5 7 2" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <path d="M32 36v13c0 4 5 5 7 2" fill="none" stroke="#A9C4E4" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="26" cy="28" r="2.4" fill={INK} />
          <circle cx="38" cy="28" r="2.4" fill={INK} />
        </>
      );
    case "borboleta":
      return (
        <>
          <ellipse cx="20" cy="25" rx="12" ry="10" fill="#8E6CEF" stroke={INK} strokeWidth="3" />
          <ellipse cx="44" cy="25" rx="12" ry="10" fill="#8E6CEF" stroke={INK} strokeWidth="3" />
          <ellipse cx="21" cy="41" rx="9" ry="8" fill="#FF6FB1" stroke={INK} strokeWidth="3" />
          <ellipse cx="43" cy="41" rx="9" ry="8" fill="#FF6FB1" stroke={INK} strokeWidth="3" />
          <rect x="29" y="18" width="6" height="30" rx="3" fill={INK} />
          <path d="M30 18c-3-6-6-7-8-6M34 18c3-6 6-7 8-6" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="19" cy="24" r="3" fill="#FFC93C" />
          <circle cx="45" cy="24" r="3" fill="#FFC93C" />
        </>
      );
    case "tartaruga":
      return (
        <>
          <circle cx="51" cy="35" r="7" fill="#6FD08A" stroke={INK} strokeWidth="3" />
          <circle cx="53" cy="33.5" r="1.6" fill={INK} />
          <ellipse cx="20" cy="47" rx="5" ry="4" fill="#6FD08A" stroke={INK} strokeWidth="2.6" />
          <ellipse cx="38" cy="47" rx="5" ry="4" fill="#6FD08A" stroke={INK} strokeWidth="2.6" />
          <path d="M11 42c0-14 9-22 19-22s18 8 18 22H11Z" fill="#24A159" stroke={INK} strokeWidth="3" />
          <polygon points="24,28 34,28 37,36 21,36" fill="#A6E3A1" stroke={INK} strokeWidth="2" />
        </>
      );
    case "bicicleta":
      return (
        <>
          <circle cx="17" cy="43" r="10" fill="#FFFFFF" stroke={INK} strokeWidth="3.2" />
          <circle cx="47" cy="43" r="10" fill="#FFFFFF" stroke={INK} strokeWidth="3.2" />
          <path d="M17 43 27 25h12l8 18M27 25l7 18H17M39 25l3-6h5M23 21h8" fill="none" stroke="#3E8EF0" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "morango":
      return (
        <>
          <path d="M32 54C19 46 15 32 18 23c2-6 8-8 14-8s12 2 14 8c3 9-1 23-14 31Z" fill="#F25C54" stroke={INK} strokeWidth="3" />
          <path d="M21 17l6 4 5-6 5 6 6-4-4-5H25Z" fill="#24A159" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="26" cy="30" r="1.8" fill="#FFF3B0" />
          <circle cx="38" cy="30" r="1.8" fill="#FFF3B0" />
          <circle cx="32" cy="37" r="1.8" fill="#FFF3B0" />
          <circle cx="28" cy="43" r="1.8" fill="#FFF3B0" />
          <circle cx="36" cy="43" r="1.8" fill="#FFF3B0" />
        </>
      );
    case "abacaxi":
      return (
        <>
          <path d="M32 8l-4 13-7-8 3 11h16l3-11-7 8-4-13Z" fill="#24A159" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          <ellipse cx="32" cy="39" rx="15" ry="17" fill="#FFC93C" stroke={INK} strokeWidth="3" />
          <path d="M21 31l22 14M21 45l22-14" stroke="#D9910B" strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case "girafa":
      return (
        <>
          <line x1="27" y1="10" x2="27" y2="17" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <line x1="37" y1="10" x2="37" y2="17" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="27" cy="9.5" r="2.5" fill="#A9714B" />
          <circle cx="37" cy="9.5" r="2.5" fill="#A9714B" />
          <rect x="26" y="34" width="12" height="22" rx="5" fill="#FFC93C" stroke={INK} strokeWidth="3" />
          <ellipse cx="32" cy="26" rx="13" ry="11" fill="#FFC93C" stroke={INK} strokeWidth="3" />
          <circle cx="27" cy="24" r="2.2" fill={INK} />
          <circle cx="37" cy="24" r="2.2" fill={INK} />
          <circle cx="30" cy="44" r="3" fill="#B56E2E" />
          <circle cx="35" cy="50" r="2.4" fill="#B56E2E" />
        </>
      );
    case "foguete":
      return (
        <>
          <path d="M24 44l-8 8 4-13Z" fill="#F25C54" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M40 44l8 8-4-13Z" fill="#F25C54" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M32 8c9 8 12 20 10 36H22c-2-16 1-28 10-36Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 17h12l-6-9Z" fill="#F25C54" />
          <circle cx="32" cy="29" r="6" fill="#3E8EF0" stroke={INK} strokeWidth="2.6" />
          <path d="M27 46l5 10 5-10Z" fill="#FF9A2E" />
        </>
      );
    case "mochila":
      return (
        <>
          <path d="M24 17a8 8 0 0 1 16 0" fill="none" stroke={INK} strokeWidth="3.2" />
          <rect x="15" y="17" width="34" height="36" rx="11" fill="#3E8EF0" stroke={INK} strokeWidth="3" />
          <rect x="21" y="33" width="22" height="14" rx="5" fill="#FFC93C" stroke={INK} strokeWidth="2.6" />
          <line x1="25" y1="38" x2="39" y2="38" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case "palhaço":
      return (
        <>
          <circle cx="14" cy="26" r="7" fill="#F25C54" stroke={INK} strokeWidth="2.6" />
          <circle cx="50" cy="26" r="7" fill="#3E8EF0" stroke={INK} strokeWidth="2.6" />
          <circle cx="32" cy="34" r="17" fill="#FFF5E1" stroke={INK} strokeWidth="3" />
          <polygon points="22,19 32,7 42,19" fill="#FFC93C" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx="26" cy="31" r="2.4" fill={INK} />
          <circle cx="38" cy="31" r="2.4" fill={INK} />
          <circle cx="32" cy="37" r="4.5" fill="#F25C54" stroke={INK} strokeWidth="2" />
          <path d="M25 44q7 5 14 0" fill="none" stroke="#F25C54" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "helicóptero":
      return (
        <>
          <line x1="12" y1="15" x2="52" y2="15" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
          <line x1="32" y1="15" x2="32" y2="23" stroke={INK} strokeWidth="3" />
          <path d="M12 31h14v7H12l-4-3.5Z" fill="#FFC93C" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          <ellipse cx="36" cy="33" rx="15" ry="10" fill="#3CC46E" stroke={INK} strokeWidth="3" />
          <path d="M36 25c6 0 11 3 12 8H36Z" fill="#9AD6FF" stroke={INK} strokeWidth="2.2" />
          <line x1="24" y1="48" x2="48" y2="48" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="30" y1="43" x2="30" y2="48" stroke={INK} strokeWidth="2.6" />
          <line x1="42" y1="43" x2="42" y2="48" stroke={INK} strokeWidth="2.6" />
        </>
      );
    case "dinossauro":
      return (
        <>
          <path d="M14 48c3-10 12-14 20-14 4 0 6-4 7-12 1-7 6-10 10-9 4 1 5 5 3 8-2 2-5 2-6 5v22h-6v-8H28v8h-6v-6c-4 2-6 5-8 6Z" fill="#3CC46E" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="48" cy="18" r="1.8" fill={INK} />
          <circle cx="30" cy="38" r="2.6" fill="#A6E3A1" />
          <circle cx="37" cy="40" r="2.2" fill="#A6E3A1" />
        </>
      );
    case "computador":
      return (
        <>
          <rect x="10" y="13" width="44" height="29" rx="4" fill="#3E8EF0" stroke={INK} strokeWidth="3" />
          <rect x="15" y="18" width="34" height="19" rx="2" fill="#E8F4FF" />
          <line x1="25" y1="42" x2="23" y2="51" stroke={INK} strokeWidth="3" />
          <line x1="39" y1="42" x2="41" y2="51" stroke={INK} strokeWidth="3" />
          <line x1="18" y1="51" x2="46" y2="51" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
        </>
      );
    case "melancia":
      return (
        <>
          <path d="M10 26a22 22 0 0 0 44 0Z" fill="#24A159" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M15 26a17 17 0 0 0 34 0Z" fill="#F25C54" />
          <circle cx="25" cy="32" r="2" fill={INK} />
          <circle cx="32" cy="35" r="2" fill={INK} />
          <circle cx="39" cy="32" r="2" fill={INK} />
        </>
      );
    case "passarinho":
      return (
        <>
          <polygon points="48,26 57,29 48,33" fill="#FF9A2E" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <ellipse cx="32" cy="34" rx="17" ry="13" fill="#3E8EF0" stroke={INK} strokeWidth="3" />
          <path d="M18 33c6-6 14-4 18 2-6 5-13 4-18-2Z" fill="#8FD0FF" stroke={INK} strokeWidth="2.4" />
          <circle cx="40" cy="29" r="2.5" fill={INK} />
          <line x1="28" y1="47" x2="28" y2="54" stroke="#FF9A2E" strokeWidth="3" strokeLinecap="round" />
          <line x1="36" y1="47" x2="36" y2="54" stroke="#FF9A2E" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "astronauta":
      return (
        <>
          <circle cx="32" cy="27" r="16" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
          <rect x="21" y="20" width="22" height="14" rx="7" fill="#3E8EF0" stroke={INK} strokeWidth="2.6" />
          <path d="M17 53c0-8 7-12 15-12s15 4 15 12Z" fill="#E8F2FF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="32" cy="47" r="2.8" fill="#F25C54" />
        </>
      );
    case "telescópio":
      return (
        <>
          <path d="M12 24 46 13l5 12-34 11Z" fill="#3E8EF0" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <line x1="31" y1="30" x2="20" y2="54" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="31" y1="30" x2="43" y2="54" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="31" y1="30" x2="31" y2="54" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="52" cy="14" r="3" fill="#FFC93C" />
        </>
      );
    case "jacaré":
      return (
        <>
          <rect x="10" y="30" width="44" height="14" rx="7" fill="#24A159" stroke={INK} strokeWidth="3" />
          <circle cx="24" cy="27" r="5" fill="#3CC46E" stroke={INK} strokeWidth="2.6" />
          <circle cx="24" cy="27" r="2" fill={INK} />
          <path d="M36 44l3-4 3 4 3-4 3 4" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="18" y1="44" x2="18" y2="51" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="40" y1="44" x2="40" y2="51" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        </>
      );
    case "violão":
      return (
        <>
          <line x1="38" y1="26" x2="52" y2="12" stroke="#8E5B3A" strokeWidth="6" strokeLinecap="round" />
          <circle cx="25" cy="40" r="14" fill="#E99A4C" stroke={INK} strokeWidth="3" />
          <circle cx="34" cy="31" r="9" fill="#E99A4C" stroke={INK} strokeWidth="3" />
          <circle cx="27" cy="38" r="4.5" fill={INK} />
          <line x1="20" y1="45" x2="27" y2="49" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "borracha":
      return (
        <>
          <g transform="rotate(-24 32 32)">
            <rect x="12" y="21" width="40" height="22" rx="5" fill="#FF8AB5" stroke={INK} strokeWidth="3" />
            <rect x="12" y="21" width="16" height="22" rx="4" fill="#3E8EF0" stroke={INK} strokeWidth="3" />
          </g>
        </>
      );

    // ===== FALA (8, 9 e 10 anos) =====
    case "água":
      return (
        <>
          <path d="M32 10C21 26 15 34 15 41a17 17 0 0 0 34 0c0-7-6-15-17-31Z" fill="#3E8EF0" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M24 41a7 7 0 0 0 5 6" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </>
      );
    case "mais":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#3CC46E" stroke={INK} strokeWidth="3" />
          <line x1="32" y1="19" x2="32" y2="45" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          <line x1="19" y1="32" x2="45" y2="32" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        </>
      );
    case "ajuda":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#FFE8A3" stroke={INK} strokeWidth="3" />
          <path d="M16 35l9-7 7 6 8-7 8 7-11 11a5 5 0 0 1-7 0Z" fill="#FF9A2E" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        </>
      );
    case "acabou":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#24A159" stroke={INK} strokeWidth="3" />
          <polyline points="20,33 28,41 45,23" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "mamãe":
      return (
        <>
          <circle cx="32" cy="27" r="15" fill="#7C4A2D" stroke={INK} strokeWidth="3" />
          <circle cx="32" cy="30" r="12" fill="#FFD3B0" stroke={INK} strokeWidth="2.6" />
          <circle cx="28" cy="29" r="2" fill={INK} />
          <circle cx="36" cy="29" r="2" fill={INK} />
          <path d="M28 35q4 3.5 8 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18 53c0-7 6-11 14-11s14 4 14 11Z" fill="#FF6FB1" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </>
      );
    case "papai":
      return (
        <>
          <path d="M19 25c0-9 6-13 13-13s13 4 13 13Z" fill="#5A3926" stroke={INK} strokeWidth="2.6" />
          <circle cx="32" cy="29" r="12" fill="#F2C099" stroke={INK} strokeWidth="2.6" />
          <circle cx="28" cy="28" r="2" fill={INK} />
          <circle cx="36" cy="28" r="2" fill={INK} />
          <path d="M28 34q4 3.5 8 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18 53c0-7 6-11 14-11s14 4 14 11Z" fill="#3E8EF0" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </>
      );
    case "quero":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#E8F2FF" stroke={INK} strokeWidth="3" />
          <path d="M24 44V24a3 3 0 0 1 6 0v8m0-11a3 3 0 0 1 6 0v11m0-9a3 3 0 0 1 6 0v16c0 6-4 9-10 9h-4c-5 0-8-3-8-8v-7a3 3 0 0 1 4 0" fill="#FFC93C" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "oi":
      return (
        <>
          <path d="M14 16h36a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H28l-10 8v-8h-4a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6Z" fill="#FFC93C" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <text x="32" y="36" textAnchor="middle" fontSize="18" fontWeight="700" fill={INK} fontFamily="Fredoka, sans-serif">
            OI!
          </text>
        </>
      );
    case "tchau":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#FFF3C4" stroke={INK} strokeWidth="3" />
          <path d="M16 17c-4 4-4 10 0 14M48 17c4 4 4 10 0 14" fill="none" stroke="#3E8EF0" strokeWidth="2.8" strokeLinecap="round" />
          <rect x="23" y="25" width="18" height="20" rx="8" fill="#FFBA60" stroke={INK} strokeWidth="2.6" />
          <line x1="27" y1="18" x2="27" y2="28" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="16" x2="32" y2="28" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <line x1="37" y1="18" x2="37" y2="28" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "obrigado":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#FFE6EF" stroke={INK} strokeWidth="3" />
          <path d="M32 46S17 36 17 26a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 10-15 20-15 20Z" fill="#F25C54" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
        </>
      );
    case "escola":
      return (
        <>
          <polygon points="32,10 54,24 10,24" fill="#F25C54" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="12" y="24" width="40" height="28" fill="#FFF2CC" stroke={INK} strokeWidth="3" />
          <rect x="27" y="36" width="10" height="16" fill="#3E8EF0" stroke={INK} strokeWidth="2.6" />
          <circle cx="32" cy="20" r="3" fill="#FFC93C" stroke={INK} strokeWidth="2" />
          <rect x="17" y="30" width="6" height="6" fill="#9AD6FF" stroke={INK} strokeWidth="2" />
          <rect x="41" y="30" width="6" height="6" fill="#9AD6FF" stroke={INK} strokeWidth="2" />
        </>
      );
    case "amigo":
      return (
        <>
          <circle cx="23" cy="24" r="8" fill="#FFC93C" stroke={INK} strokeWidth="2.8" />
          <circle cx="41" cy="24" r="8" fill="#8FD0FF" stroke={INK} strokeWidth="2.8" />
          <path d="M12 49c0-7 5-11 11-11s11 4 11 11Z" fill="#3CC46E" stroke={INK} strokeWidth="2.8" />
          <path d="M30 49c0-7 5-11 11-11s11 4 11 11Z" fill="#8E6CEF" stroke={INK} strokeWidth="2.8" />
        </>
      );
    case "lanche":
      return (
        <>
          <polygon points="14,34 32,14 50,34" fill="#F4C77B" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="12" y="34" width="40" height="6" rx="3" fill="#3CC46E" stroke={INK} strokeWidth="2.4" />
          <rect x="14" y="40" width="36" height="8" rx="3" fill="#E9A858" stroke={INK} strokeWidth="2.8" />
        </>
      );
    case "brincar":
      return (
        <>
          <rect x="12" y="14" width="18" height="18" rx="4" fill="#F25C54" stroke={INK} strokeWidth="3" />
          <rect x="34" y="14" width="18" height="18" rx="4" fill="#FFC93C" stroke={INK} strokeWidth="3" />
          <rect x="12" y="36" width="18" height="18" rx="4" fill="#3E8EF0" stroke={INK} strokeWidth="3" />
          <circle cx="43" cy="45" r="9" fill="#3CC46E" stroke={INK} strokeWidth="3" />
        </>
      );
    case "desculpa":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#FFF6D6" stroke={INK} strokeWidth="3" />
          <path d="M32 45S19 36 19 27a7 7 0 0 1 13-3.5A7 7 0 0 1 45 27c0 9-13 18-13 18Z" fill="#FFC93C" stroke={INK} strokeWidth="2.8" />
        </>
      );
    case "esperar":
      return (
        <>
          <line x1="18" y1="12" x2="46" y2="12" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="18" y1="52" x2="46" y2="52" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M21 12c0 12 11 16 11 20s-11 8-11 20h22c0-12-11-16-11-20s11-8 11-20Z" fill="#E8F4FF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="24,49 40,49 32,39" fill="#FFC93C" />
        </>
      );
    case "calma":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#DFF5FF" stroke={INK} strokeWidth="3" />
          <path d="M16 28q8-6 16 0t16 0" fill="none" stroke="#3E8EF0" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M18 37q7-5 14 0t14 0" fill="none" stroke="#24A159" strokeWidth="3.2" strokeLinecap="round" />
        </>
      );
    case "biblioteca":
      return (
        <>
          <rect x="12" y="16" width="11" height="36" rx="2" fill="#F25C54" stroke={INK} strokeWidth="2.8" />
          <rect x="26" y="12" width="11" height="40" rx="2" fill="#3E8EF0" stroke={INK} strokeWidth="2.8" />
          <rect x="40" y="19" width="11" height="33" rx="2" fill="#3CC46E" stroke={INK} strokeWidth="2.8" />
          <line x1="8" y1="53" x2="56" y2="53" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
        </>
      );
    case "importante":
      return (
        <>
          <polygon points="32,8 39,23 55,25 43,36 46,52 32,44 18,52 21,36 9,25 25,23" fill="#FFC93C" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </>
      );
    case "comunidade":
      return (
        <>
          <circle cx="32" cy="32" r="21" fill="#3E8EF0" stroke={INK} strokeWidth="3" />
          <path d="M18 23c6 0 10 4 8 9-2 4 4 8 2 14-6-2-12-8-12-16 0-3 1-5 2-7Z" fill="#3CC46E" />
          <path d="M38 15c6 3 10 9 10 16 0 4-2 8-4 11-4-2-7-6-5-11 2-5-3-10-1-16Z" fill="#3CC46E" />
        </>
      );
    case "respeito":
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="#E6F8EC" stroke={INK} strokeWidth="3" />
          <path d="M18 35c4-7 10-7 14 0 4-7 10-7 14 0l-14 13Z" fill="#24A159" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx="24" cy="23" r="4" fill="#FFC93C" stroke={INK} strokeWidth="2.2" />
          <circle cx="40" cy="23" r="4" fill="#3E8EF0" stroke={INK} strokeWidth="2.2" />
        </>
      );
    case "concentração":
      return (
        <>
          <circle cx="32" cy="32" r="21" fill="#FFFFFF" stroke="#F25C54" strokeWidth="5" />
          <circle cx="32" cy="32" r="12" fill="#FFFFFF" stroke="#3E8EF0" strokeWidth="4.5" />
          <circle cx="32" cy="32" r="5" fill="#F25C54" />
        </>
      );
    case "sentimento":
      return (
        <>
          <path d="M32 52S12 39 12 25a11 11 0 0 1 20-6 11 11 0 0 1 20 6c0 14-20 27-20 27Z" fill="#3E8EF0" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="26" cy="28" r="2.2" fill="#FFFFFF" />
          <circle cx="38" cy="28" r="2.2" fill="#FFFFFF" />
          <path d="M27 35q5 4 10 0" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
    case "organizar":
      return (
        <>
          <rect x="11" y="18" width="42" height="34" rx="5" fill="#FFC93C" stroke={INK} strokeWidth="3" />
          <path d="M11 22v-6a3 3 0 0 1 3-3h13l4 5h19a3 3 0 0 1 3 3v1Z" fill="#FF9A2E" stroke={INK} strokeWidth="2.8" />
          <line x1="20" y1="31" x2="44" y2="31" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <line x1="20" y1="39" x2="36" y2="39" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
        </>
      );
    case "curiosidade":
      return (
        <>
          <circle cx="28" cy="28" r="15" fill="#E8F4FF" stroke={INK} strokeWidth="3.5" />
          <line x1="39" y1="39" x2="53" y2="53" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="24" cy="24" r="3" fill="#FFFFFF" />
        </>
      );
    default:
      return (
        <>
          <circle cx="32" cy="32" r="20" fill="#FFC93C" stroke={INK} strokeWidth="3" />
          <text x="32" y="38" textAnchor="middle" fontSize="18" fontWeight="700" fill={INK}>
            ★
          </text>
        </>
      );
  }
}

export default function Pictograma({ id, tam = 52, className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={tam}
      height={tam}
      className={`pictograma-svg ${className}`.trim()}
      aria-hidden="true"
    >
      {renderPictograma(id)}
    </svg>
  );
}
