import { Component } from "react";
import { RotateCcw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro) {
    if (typeof console !== "undefined") console.error("Erro capturado pelo ErrorBoundary:", erro);
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="cc area-institucional justify-center p-6">
          <main
            className="w-full max-w-md rounded-3xl border border-inst-border bg-inst-surface p-8 text-center shadow-lg"
            role="alert"
          >
            <h1 className="font-display text-2xl font-semibold text-ink m-0">
              Ops! Algo inesperado aconteceu
            </h1>
            <p className="mt-3 mb-6 text-sm text-ink-muted leading-relaxed">
              Não se preocupe, nenhum dado foi perdido. Toque no botão abaixo para recarregar o Cantinho das Cores.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                this.setState({ erro: null });
                window.location.reload();
              }}
            >
              <RotateCcw size={18} aria-hidden="true" />
              Recarregar aplicativo
            </button>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}
