import {
  LayoutDashboard, Radar, Users, KanbanSquare, Wand2, FolderKanban, LayoutTemplate,
  Bot, Megaphone, Handshake, Wallet, Settings, type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  { label: "Prospecção", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/buscar-empresas", label: "Buscar empresas", icon: Radar },
    { to: "/leads", label: "Leads", icon: Users },
    { to: "/crm", label: "CRM", icon: KanbanSquare },
  ]},
  { label: "Produção", items: [
    { to: "/criador-de-sites", label: "Criador de sites", icon: Wand2 },
    { to: "/projetos", label: "Projetos", icon: FolderKanban },
    { to: "/modelos", label: "Modelos de sites", icon: LayoutTemplate },
    { to: "/agentes-ia", label: "Agentes de IA", icon: Bot },
  ]},
  { label: "Relacionamento", items: [
    { to: "/campanhas", label: "Campanhas", icon: Megaphone },
    { to: "/clientes", label: "Clientes", icon: Handshake },
  ]},
  { label: "Gestão", items: [
    { to: "/financeiro", label: "Financeiro", icon: Wallet },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
  ]},
];
