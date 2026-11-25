# Ligar a IA (Groq) nos relatórios — passo a passo para a ONG

O Cantinho das Cores funciona **com ou sem** a IA. Sem ela, os relatórios usam textos revisados pela equipe. Com ela, cada relatório ganha textos escritos para a evolução daquela criança.

## 1. Criar a conta e a chave (uma vez)
1. Acesse **console.groq.com** e crie uma conta com um e-mail **da ONG** (não pessoal), para não perder o acesso quando alguém sair.
2. No menu **API Keys**, clique em **Create API Key**, dê um nome (ex.: "Cantinho das Cores") e copie a chave. Ela aparece uma vez só.
3. Guarde a chave num lugar seguro da ONG. **Nunca** envie por e-mail, chat ou cole em arquivos do projeto.

## 2. Colocar a chave no servidor
No painel da hospedagem do **backend** (por exemplo, Render → serviço da API → **Environment**):
1. Adicione a variável `GROQ_API_KEY` com a chave copiada.
2. Confira que `IA_AO_VIVO` está `true` (ou ausente).
3. Salve. O serviço reinicia sozinho.

Pronto: o próximo relatório gerado já usa a IA. No fim dele aparece "Parte deste relatório foi escrita com ajuda de inteligência artificial."

## 3. Desligar ou trocar
- **Desligar a IA:** mude `IA_AO_VIVO` para `false` (ou apague `GROQ_API_KEY`). Os relatórios voltam a usar só os textos revisados.
- **Trocar a chave:** crie outra no console da Groq, substitua `GROQ_API_KEY` e apague a antiga no console.
- **Limite de uso:** o plano gratuito da Groq tem limites. O app faz no máximo `IA_TETO_DIARIO` (300) chamadas por dia e, se a Groq recusar, pausa 10 minutos e usa os textos revisados. A família nunca vê erro.

## O que a IA recebe
Só um resumo anônimo: o nível ("Fácil", "Médio" ou "Avançado") e, para cada jogo, se está fácil, no ponto ou difícil, se melhorou em relação ao período anterior e se a criança jogou poucas ou muitas vezes. **Nunca** nome, idade, e-mail ou dados do responsável.
