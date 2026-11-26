import { useState, useRef } from "react";

export default function Arrasta({
  onSolta,
  onToque,
  onSobre,
  onMovimento,
  disabled,
  className = "",
  label,
  cru,
  style,
  dataEsq,
  buttonRef,
  children,
}) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const ignorarClickRef = useRef(false);

  const alvoEm = (x, y) => {
    for (const el of document.elementsFromPoint(x, y)) {
      const a = el.closest("[data-alvo]");
      if (a) return a.dataset.alvo;
    }
    return null;
  };

  const down = (e) => {
    if (disabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignora caso o ponteiro não suporte captura
    }
    ref.current = { x: e.clientX, y: e.clientY, mov: false, s: null };
  };

  const move = (e) => {
    const r = ref.current;
    if (!r) return;
    const dx = e.clientX - r.x;
    const dy = e.clientY - r.y;
    if (!r.mov && Math.abs(dx) + Math.abs(dy) > 10) r.mov = true;
    if (r.mov) {
      setPos({ x: dx, y: dy });
      onMovimento?.({ clientX: e.clientX, clientY: e.clientY });
      const s = alvoEm(e.clientX, e.clientY);
      if (s !== r.s) {
        r.s = s;
        onSobre?.(s);
      }
    }
  };

  const up = (e) => {
    const r = ref.current;
    if (!r) return;
    ref.current = null;
    setPos(null);
    onSobre?.(null);
    onMovimento?.(null);
    ignorarClickRef.current = true;
    setTimeout(() => {
      ignorarClickRef.current = false;
    }, 0);
    if (r.mov) {
      onSolta?.(alvoEm(e.clientX, e.clientY));
    } else {
      onToque?.();
    }
  };

  const cancela = () => {
    ref.current = null;
    setPos(null);
    onSobre?.(null);
    onMovimento?.(null);
  };

  const clicar = () => {
    if (disabled) return;
    if (ignorarClickRef.current) {
      ignorarClickRef.current = false;
      return;
    }
    onToque?.();
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      data-esq={dataEsq}
      className={`${cru ? "cru" : "ficha"} ${className} ${pos ? "arrastando" : ""}`}
      aria-label={label}
      disabled={disabled}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancela}
      onClick={clicar}
      style={{
        ...style,
        touchAction: "none",
        transform: pos ? `translate(${pos.x}px,${pos.y}px) scale(1.08)` : undefined,
        zIndex: pos ? 50 : undefined,
      }}
    >
      {children}
    </button>
  );
}
