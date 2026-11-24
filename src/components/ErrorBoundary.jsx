import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: false };
  }

  static getDerivedStateFromError() {
    return { erro: true };
  }

  componentDidCatch(erro, info) {
    console.error("Erro inesperado capturado pelo ErrorBoundary:", erro, info);
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="cc">
          <main className="tela" role="alert">
            <div className="pais-bloco" style={{ textAlign: "center", maxWidth: "480px", marginTop: "40px" }}>
              <h1 className="pais-titulo">Ops! Algo inesperado aconteceu</h1>
              <p className="pais-subtitulo" style={{ margin: "12px 0 18px" }}>
                Não se preocupe: seus dados estão seguros. Clique abaixo para recarregar o Cantinho das Cores.
              </p>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  this.setState({ erro: false });
                  window.location.reload();
                }}
              >
                Recarregar aplicação
              </button>
            </div>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}
