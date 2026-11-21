# PANTERON — Fundação (Etapa 1)

Sem Lovable Cloud. Todo backend em um projeto Supabase externo seu.

## 1. Identidade visual
- Símbolo: cabeça de pantera negra emergindo da escuridão, olhos verde-esmeralda, estilo premium (gerado por IA, refinado em versões grande e ícone pequeno/favicon).
- Tipografia: Space Grotesk (títulos/marca) + IBM Plex Sans (interface).
- Paleta: #050505, #101114, #191B20, #9297A1, #F3F4F6, verde #00C982 só em destaques.
- Dark mode, cards com raio discreto, bordas sutis, animações leves.

## 2. Estrutura do app
- Menu lateral fixo (recolhível, vira gaveta no celular) agrupado:
  - Prospecção: Dashboard, Buscar empresas, Leads, CRM
  - Produção: Criador de sites, Projetos, Modelos de sites, Agentes de IA
  - Relacionamento: Campanhas, Clientes
  - Gestão: Financeiro, Configurações
- Cada área ganha sua própria página com estado vazio honesto ("em breve nesta etapa"), sem funcionalidades falsas.
- Dashboard: 6 indicadores (empresas encontradas, leads, empresas sem site, sites criados, clientes, receita recorrente) lendo contagens reais do workspace — mostram 0/estado vazio até haver dados.

## 3. Autenticação (Supabase Auth externo)
- Telas: login, cadastro, esqueci a senha, redefinir senha.
- Rotas internas protegidas; sessão persistente; página de perfil em Configurações.
- Após cadastro: criação automática de perfil + workspace pessoal (o usuário vira dono).

## 4. Multi-tenant (apresentado antes de aplicar)
Entrego um arquivo SQL para você rodar no seu Supabase, contendo:
- Tabelas: profiles, workspaces, workspace_members (papéis owner/admin/member), subscriptions, leads, lead_contacts, lead_sources, searches, projects, websites, website_templates, website_pages, campaigns, messages, ai_generations, usage_logs.
- Todas as tabelas privadas com `workspace_id`.
- RLS em todas: acesso só para membros do workspace, via função `is_workspace_member()` (security definer, evita recursão). website_templates permite modelos públicos (somente leitura).
- Gatilho no cadastro criando profile + workspace + membro owner.

## Detalhes técnicos
- Cliente Supabase com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave pública; nenhuma chave secreta no frontend).
- Rotas TanStack: `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, layout `_app` protegido com as 12 áreas; `/` redireciona para dashboard ou login.
- Contexto de workspace ativo (preparado para múltiplos workspaces).
- SQL em `supabase/migrations/0001_foundation.sql`; regras de arquitetura no AGENTS.md.

## O que preciso de você
- URL do projeto Supabase e a chave anon (pública).
- Rodar o SQL no SQL Editor do Supabase (ou me autorizar a orientar passo a passo).

## Fora desta etapa
APIs pagas, WhatsApp, geração de sites por IA, Stripe, campanhas automáticas, integrações de prospecção.
