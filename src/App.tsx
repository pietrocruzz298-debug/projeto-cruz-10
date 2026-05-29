import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  fetchLeads, 
  insertLead, 
  updateLeadInDb, 
  deleteLeadFromDb, 
  isSupabaseConfigured 
} from './supabase';
import { CRMLead, LeadStatus } from './types';
import KanbanColumn from './components/KanbanColumn';
import LeadModal from './components/LeadModal';
import SupabaseHelp from './components/SupabaseHelp';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Database,
  Building,
  CheckCircle2,
  Trash2,
  Lock,
  Moon
} from 'lucide-react';

export default function App() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'supabase' | 'local'>('local');
  const [syncError, setSyncError] = useState<string | undefined>(undefined);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [valueFilter, setValueFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'value_desc' | 'value_asc'>('newest');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  const [defaultStatusForNewLead, setDefaultStatusForNewLead] = useState<LeadStatus | undefined>(undefined);

  // Load leads
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setSyncError(undefined);
    try {
      const response = await fetchLeads();
      setLeads(response.data);
      setSource(response.source);
      if (response.error) {
        setSyncError(response.error);
      }
    } catch (err: any) {
      setSyncError('Erro inesperado ao carregar os leads.');
      setSource('local');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quick status shift from Cards (e.g. clicking quick Arrow left/right)
  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    // Optimistic Update
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
    );

    const result = await updateLeadInDb(id, { status: newStatus });
    if (result.error) {
      // In case of error we reload standard list to roll back
      loadData();
      alert(result.error);
    }
  };

  // Add or Edit save trigger
  const handleSaveLead = async (leadData: Omit<CRMLead, 'id' | 'created_at'> & { id?: string }) => {
    if (leadData.id) {
      // Editing Lead
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadData.id
            ? { 
                ...lead, 
                title: leadData.title,
                company: leadData.company,
                email: leadData.email,
                phone: leadData.phone,
                value: leadData.value,
                status: leadData.status,
                description: leadData.description,
              }
            : lead
        )
      );

      const result = await updateLeadInDb(leadData.id, {
        title: leadData.title,
        company: leadData.company,
        email: leadData.email,
        phone: leadData.phone,
        value: leadData.value,
        status: leadData.status,
        description: leadData.description,
      });

      if (result.error) {
        loadData();
        alert(result.error);
      }
    } else {
      // Creating Lead
      const generateId = () => {
        try {
          return self.crypto.randomUUID();
        } catch {
          return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
      };

      const newLead: Omit<CRMLead, 'created_at'> = {
        id: generateId(),
        title: leadData.title,
        company: leadData.company,
        email: leadData.email,
        phone: leadData.phone,
        value: leadData.value,
        status: leadData.status,
        description: leadData.description,
      };

      // Optimistic prepending
      setLeads((prev) => [{ ...newLead, created_at: new Date().toISOString() }, ...prev]);

      const result = await insertLead(newLead);
      if (result.error) {
        loadData();
        alert(result.error);
      }
    }
  };

  // Deleting deal lead
  const handleDeleteLead = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este lead definitivamente?')) {
      // Optimistic delete
      setLeads((prev) => prev.filter((lead) => lead.id !== id));

      const result = await deleteLeadFromDb(id);
      if (result.error) {
        loadData();
        alert(result.error);
      }
    }
  };

  // Handlers for starting dialogs
  const handleOpenAddModal = (status?: LeadStatus) => {
    setEditingLead(null);
    setDefaultStatusForNewLead(status);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lead: CRMLead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  // Computation of filtered and sorted leads
  const processedLeads = useMemo(() => {
    let result = [...leads];

    // 1. Query search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (lead) =>
          lead.title.toLowerCase().includes(q) ||
          (lead.company && lead.company.toLowerCase().includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q))
      );
    }

    // 2. Filter by value
    if (valueFilter !== 'all') {
      result = result.filter((lead) => {
        if (valueFilter === 'high') return lead.value >= 25000;
        if (valueFilter === 'medium') return lead.value >= 5000 && lead.value < 25000;
        return lead.value < 5000;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'value_desc') {
        return b.value - a.value;
      }
      if (sortBy === 'value_asc') {
        return a.value - b.value;
      }
      return 0;
    });

    return result;
  }, [leads, searchQuery, valueFilter, sortBy]);

  // Compute stats indicators
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const activeLeads = leads.filter((l) => l.status !== 'Finalizado').length;
    const closedLeads = leads.filter((l) => l.status === 'Finalizado').length;
    
    const pipelineTotal = leads.reduce((sum, lead) => sum + lead.value, 0);
    const closedValue = leads.filter((l) => l.status === 'Finalizado').reduce((sum, lead) => sum + lead.value, 0);
    
    const conversionRate = totalLeads ? Math.round((closedLeads / totalLeads) * 100) : 0;
    const avgTicket = totalLeads ? Math.round(pipelineTotal / totalLeads) : 0;

    return {
      totalLeads,
      activeLeads,
      closedLeads,
      pipelineTotal,
      closedValue,
      conversionRate,
      avgTicket,
    };
  }, [leads]);

  // Group current processed leads per column status
  const columnsData = useMemo(() => {
    return {
      'Não iniciado': processedLeads.filter((l) => l.status === 'Não iniciado'),
      'Em Andamento': processedLeads.filter((l) => l.status === 'Em Andamento'),
      'Finalizado': processedLeads.filter((l) => l.status === 'Finalizado'),
    };
  }, [processedLeads]);

  const currencyFormatter = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div id="crm-app-root" className="min-h-screen bg-[#0A0A0B] text-[#E1E1E6] flex flex-col antialiased">
      {/* Top Header */}
      <header className="bg-[#121214] border-b border-[#202024] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Status */}
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-xs shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">CRM Kanban</span>
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#1A1A1E] text-gray-400 border border-[#202024]">v1.2</span>
                </div>
                <p className="text-xs text-gray-400 font-medium">Gestão Comercial Simples e Direta</p>
              </div>
            </div>

            {/* CTA Headers */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg text-xs bg-[#1A1A1E] border border-[#202024] text-gray-300 gap-1.5 font-medium">
                <Database className={`h-3.5 w-3.5 ${source === 'supabase' ? 'text-emerald-400' : 'text-amber-500'}`} />
                <span>
                  Banco: {source === 'supabase' ? 'Supabase' : 'Offline / Local'}
                </span>
              </div>

              {/* Novo Lead Principal Btn */}
              <button
                id="create-lead-main-btn"
                onClick={() => handleOpenAddModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Lead</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Supabase connection guide block (expanded manually or when warning) */}
        <SupabaseHelp 
          currentSource={source} 
          syncError={syncError}
          onRefresh={loadData}
          isInitialLoading={isLoading}
        />

        {/* Stats Grid Dashboard Summary Widgets */}
        <div id="stats-dashboard-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Pipeline Total */}
          <div className="bg-[#121214] border border-[#202024] p-4 rounded-xl shadow-xs hover:border-[#29292E] transition-colors">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Pipeline Total</span>
              <div className="p-1.5 bg-[#1A1A1E] text-indigo-400 rounded-lg border border-[#202024]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {currencyFormatter(stats.pipelineTotal)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Soma de todos os negócios</p>
          </div>

          {/* Card 2: Leads Ativos */}
          <div className="bg-[#121214] border border-[#202024] p-4 rounded-xl shadow-xs hover:border-[#29292E] transition-colors">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Leads Ativos</span>
              <div className="p-1.5 bg-[#1A1A1E] text-blue-400 rounded-lg border border-[#202024]">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {stats.activeLeads}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Em triagem ou negociação</p>
          </div>

          {/* Card 3: Taxa de Conversão */}
          <div className="bg-[#121214] border border-[#202024] p-4 rounded-xl shadow-xs hover:border-[#29292E] transition-colors">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Conversão</span>
              <div className="p-1.5 bg-[#1A1A1E] text-emerald-400 rounded-lg border border-[#202024]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {stats.conversionRate}%
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Taxa de leads finalizados ({stats.closedLeads})</p>
          </div>

          {/* Card 4: Ticket Médio */}
          <div className="bg-[#121214] border border-[#202024] p-4 rounded-xl shadow-xs hover:border-[#29292E] transition-colors">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Ticket Médio</span>
              <div className="p-1.5 bg-[#1A1A1E] text-amber-400 rounded-lg border border-[#202024]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {currencyFormatter(stats.avgTicket)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Valor médio por negócio</p>
          </div>

        </div>

        {/* Filter and Filters bar controls */}
        <div id="filters-toolbar" className="bg-[#121214] border border-[#202024] p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-85">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="global-lead-search"
              type="text"
              placeholder="Buscar por nome, empresa ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#29292E] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-[#1A1A1E] text-[#E1E1E6] placeholder-gray-650"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Value range filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4 text-gray-500 shrink-0" />
              <select
                id="value-size-filter"
                value={valueFilter}
                onChange={(e) => setValueFilter(e.target.value as any)}
                className="w-full sm:w-auto text-xs font-medium text-gray-300 bg-[#1A1A1E] hover:bg-[#202024] border border-[#29292E] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#121214]">Filtro de Valor: Todos</option>
                <option value="high" className="bg-[#121214]">Valor Alto (≥ R$25k)</option>
                <option value="medium" className="bg-[#121214]">Valor Médio (R$5k - R$25k)</option>
                <option value="low" className="bg-[#121214]">Valor Baixo (≤ R$5k)</option>
              </select>
            </div>

            {/* Sorter */}
            <select
              id="leads-sorter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto text-xs font-medium text-gray-300 bg-[#1A1A1E] hover:bg-[#202024] border border-[#29292E] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#121214]">Mais Novos</option>
              <option value="oldest" className="bg-[#121214]">Mais Antigos</option>
              <option value="value_desc" className="bg-[#121214]">Valor: Maior para Menor</option>
              <option value="value_asc" className="bg-[#121214]">Valor: Menor para Maior</option>
            </select>

            {/* Clear Filters Reset */}
            {(searchQuery || valueFilter !== 'all') && (
              <button
                id="clear-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setValueFilter('all');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold py-1.5 px-3 rounded-lg hover:bg-[#1A1A1E] cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Board column rows rendering */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-500">Buscando informações prontas de negócio...</p>
          </div>
        ) : (
          <div 
            id="kanban-board-workspace"
            className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 items-start scrollbar-thin"
          >
            {/* Status: Não iniciado */}
            <KanbanColumn
              status="Não iniciado"
              leads={columnsData['Não iniciado']}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteLead}
              onStatusChange={handleStatusChange}
              onAddLeadClick={handleOpenAddModal}
            />

            {/* Status: Em Andamento */}
            <KanbanColumn
              status="Em Andamento"
              leads={columnsData['Em Andamento']}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteLead}
              onStatusChange={handleStatusChange}
              onAddLeadClick={handleOpenAddModal}
            />

            {/* Status: Finalizado */}
            <KanbanColumn
              status="Finalizado"
              leads={columnsData['Finalizado']}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteLead}
              onStatusChange={handleStatusChange}
              onAddLeadClick={handleOpenAddModal}
            />
          </div>
        )}
      </main>

      {/* Editor/Creation Lead Popup modal dialog form */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        lead={editingLead}
        defaultStatus={defaultStatusForNewLead}
      />
    </div>
  );
}
