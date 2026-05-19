---
name: project-blog-pendencias
description: Decisões e detalhes pendentes para implementação do blog com Decap CMS
metadata:
  type: project
---

No formulário do Decap CMS, além da categoria principal, adicionar campo opcional "Serviços relacionados" com múltipla escolha. O script gera links no rodapé do post para todos os serviços marcados — o principal em destaque, os relacionados como secundários.

**Why:** um post raramente pertence a exatamente um serviço. Sem esse campo, o link automático vai para um único serviço e ignora outros relevantes.

**How to apply:** implementar no config.yml do Decap CMS como campo `relation` ou `select` com múltipla escolha, e no scripts/build-post.js mapear os valores para as URLs dos serviços.

Mapeamento de categorias → URLs:
- Saúde Vocal → /voz-clinica/
- Oratória → /oratoria-comunicacao/
- Voz Artística → /voz-artistica/
- Harmonização Vocal → /harmonizacao-vocal-trans/
- Motricidade Orofacial → /motricidade-orofacial/
- Empresarial → /move-voz-empresarial/
