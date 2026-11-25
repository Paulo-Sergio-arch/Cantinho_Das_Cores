import { useEffect, useState } from "react";
import { recadoDaSemana } from "../services/relatorios";

// Recado e desafio do último relatório da criança ativa. Visitante, sem criança ou erro → null.
export default function useRecadoDaSemana(criancaId, visitante) {
  const [resposta, setResposta] = useState({ id: null, dados: null });
  const ativo = criancaId && !visitante;
  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    recadoDaSemana(criancaId)
      .then((d) => vivo && setResposta({ id: criancaId, dados: d && (d.recado || d.desafio) ? d : null }))
      .catch(() => vivo && setResposta({ id: criancaId, dados: null }));
    return () => {
      vivo = false;
    };
  }, [ativo, criancaId]);
  return ativo && resposta.id === criancaId ? resposta.dados : null;
}
