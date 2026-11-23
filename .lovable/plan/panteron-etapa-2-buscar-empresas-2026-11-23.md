# PANTERON — Etapa 2: Buscar Empresas

Sem Lovable Cloud. Tudo continua no seu Supabase externo. Nada da fundação, login ou visual é redesenhado.

## Pontos de atenção encontrados na fundação
- A tabela `leads` só aceita os status `discovered/lead/client/lost`. Os novos status (Novo lead, Não contatado, Contatado, Em negociação, Cliente conquistado, Sem interesse) exigem ajustar essa regra.
- Faltam em `leads`: país, estado, bairro, endereço, descrição, URL da fonte, situação do website e chave de duplicidade.
- Não há histórico de alterações nem vínculo empresa↔pesquisa além de `search_id`.
- Não consigo confirmar daqui se o arquivo 0001 já foi rodado; o teste final depende disso.

## Nova migração (para sua revisão antes de rodar) — `docs/sql/0002_buscador.sql`
Somente aditiva, nada é apagado:
- `leads`: novas colunas (country, state, neighborhood, address, description, source_url, website_status `confirmed_none | not_informed | unverified | has_site`, raw_data jsonb com a linha original do CSV, normalized_name, normalized_phone, normalized_domain, created_by).
- Troca da regra de status para os 6 novos valores, convertendo os antigos (discovered→novo, lead→nao_contatado, client→cliente, lost→sem_interesse). Dashboard ajustado junto.
- Índices de duplicidade por workspace (nome normalizado, telefone, domínio) — só para detectar, sem bloquear nomes parecidos.
- Tabela `lead_events` (histórico de alterações), preenchida por gatilho em toda edição, com RLS de membros.
- `searches`: colunas `source`, `status` (`completed`/`failed`) e `created_by`; política para cada um excluir apenas suas pesquisas.
- `csv_imports`: registro de cada importação (arquivo, totais encontrados/importados/duplicados/inválidos/ignorados).
- RLS em tudo via `is_workspace_member()`; `workspace_id` sempre checado no banco.

## A página Buscar Empresas
- Cabeçalho com título e descrição pedidos.
- Painel de pesquisa: País, Estado, Cidade, Bairro, Segmento, Palavras-chave, Categoria, filtros (com site, sem site, com telefone, endereço, email, todas).
- Botões: BUSCAR EMPRESAS, IMPORTAR CSV, ADICIONAR EMPRESA MANUALMENTE.
- Busca externa: nenhuma fonte gratuita com uso comercial está configurada, então o botão aplica os filtros sobre as empresas do seu workspace e um aviso claro explica que fontes externas ainda não estão ligadas. Nenhum resultado fictício.
- Tabela de resultados com as colunas pedidas, selos SEM SITE / COM SITE / DADOS INCOMPLETOS / NÃO VERIFICADO (distinguindo "sem site confirmado", "não informado pela fonte" e "não verificado"), seleção múltipla, "Salvar selecionados no CRM", busca interna, ordenação por coluna, paginação no banco.
- Ações por linha: ver detalhes, salvar lead, editar, abrir site, abrir WhatsApp (só com número válido, link wa.me, nada automático), excluir com confirmação.
- Painel de detalhes: todos os campos, fonte, status no CRM, observações, histórico de alterações e os 4 botões.
- Aba Histórico de pesquisas: lista, ver resultados, repetir (quando a fonte existir), excluir as próprias. Só registra pesquisas que realmente rodaram.

## Importação CSV (funcional desde já)
Assistente em etapas: baixar modelo → escolher arquivo → leitura → mapeamento de colunas → pré-visualização → validação → duplicidades (no arquivo e no workspace) → resumo do que será importado → confirmar → salvar → relatório final. Proteção contra fórmulas perigosas (=, +, -, @) e limite de tamanho. Linha original guardada em `raw_data`.

## Cadastro manual e edição
Formulário com todos os campos da seção 10, aviso de possível duplicata antes de salvar.

## Dashboard
Indicadores reais do workspace: empresas encontradas, leads salvos, sem site confirmado, com site, pesquisas realizadas (mantendo sites criados, clientes e receita).

## Camada Lead Provider
Interface comum (`search`, `isAvailable`, licença/atribuição) com provedores registrados: CSV e Manual ativos; OpenStreetMap e APIs futuras listados como "não configurado". Sem Overpass público, sem scraping do Google Maps, sem APIs pagas.

## Testes
- Testes automáticos: validação de telefone/WhatsApp, normalização e detecção de duplicidades, leitura e sanitização de CSV, regra de situação do website.
- Teste no navegador com conta real após você rodar a migração: cadastro manual, importação, filtros, detalhes, salvar lead, persistência após recarregar. Isolamento entre workspaces conferido com duas contas.
- Relatório final no formato da seção 17.

## Detalhes técnicos
- Arquivos novos: `src/lib/leads/` (providers, normalize, csv, whatsapp, queries), `src/components/leads/` (SearchPanel, ResultsTable, LeadDetailsSheet, LeadForm, CsvImportWizard, SearchHistory, WebsiteBadge).
- Alterados: `_app/buscar-empresas.tsx`, `_app/dashboard.tsx`, AGENTS.md.
- CSV lido no navegador com `papaparse`; inserts em lotes pelo cliente anon com sessão do usuário (RLS aplica). Nenhuma service_role no frontend.
- Fluxo: eu entrego o SQL 0002 → você revisa e roda → eu ligo a tela aos novos campos e testo.
