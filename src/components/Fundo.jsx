export default function Fundo() {
  return (
    <div className="fundo" aria-hidden="true">
      <svg
        className="fundo-ceu"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <radialGradient id="halo-sol-suave" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF7CC" stopOpacity="0.95" />
            <stop offset="52%" stopColor="#FFE484" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="678" cy="82" r="78" fill="url(#halo-sol-suave)" />
        <circle cx="678" cy="82" r="42" fill="#FFD95A" />

        <g fill="#fff" opacity=".88">
          <ellipse cx="118" cy="118" rx="54" ry="21" />
          <ellipse cx="150" cy="100" rx="34" ry="23" />
          <ellipse cx="90" cy="106" rx="28" ry="17" />

          <ellipse cx="486" cy="182" rx="46" ry="18" />
          <ellipse cx="514" cy="166" rx="30" ry="19" />

          <ellipse cx="176" cy="322" rx="44" ry="16" />
          <ellipse cx="202" cy="308" rx="26" ry="17" />

          <ellipse cx="672" cy="296" rx="48" ry="17" />
          <ellipse cx="646" cy="282" rx="28" ry="18" />
        </g>
      </svg>

      <svg
        className="fundo-grama"
        viewBox="0 0 800 200"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0 78 Q180 18 400 68 T800 42 V200 H0Z"
          fill="#A6E3A1"
        />
        <path
          d="M0 122 Q220 72 460 116 T800 94 V200 H0Z"
          fill="#6FD08A"
        />
        <g>
          {[
            [64, 158, "#FF6FB1"],
            [176, 140, "#FFC93C"],
            [310, 162, "#F25C54"],
            [455, 144, "#fff"],
            [590, 164, "#8E6CEF"],
            [725, 146, "#FF9A2E"],
          ].map(([x, y, c], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="7.5" fill={c} />
              <circle cx={x} cy={y} r="2.8" fill="#FFF3B0" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
