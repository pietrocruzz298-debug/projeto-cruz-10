import React from 'react';
import { Plus, BarChart3, AlertCircle } from 'lucide-react';
import KanbanCard from './KanbanCard';
import { CRMLead, LeadStatus } from '../types';

interface KanbanColumnProps {
  status: LeadStatus;
  leads: CRMLead[];
  onEdit: (lead: CRMLead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  onAddLeadClick: (status: LeadStatus) => void;
}

export default function KanbanColumn({
  status,
  leads,
  onEdit,
  onDelete,
  onStatusChange,
  onAddLeadClick,
}: KanbanColumnProps) {
  // Sum up CRM total pipeline value of column
  const totalValue = leads.reduce((acc, lead) => acc + (lead.value || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0, // Keeps board uncluttered by suppressing decimals on totals
    }).format(val);
  };

  // Status mapping for background colors, badges, border gradients
  const statusStyles: Record<LeadStatus, {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    text: string;
    indicator: string;
  }> = {
    'Não iniciado': {
      bg: 'bg-[#121214]',
      border: 'border-[#202024]',
      badgeBg: 'bg-[#202024]',
      badgeText: 'text-gray-400',
      text: 'text-gray-300',
      indicator: 'bg-gray-400',
    },
    'Em Andamento': {
      bg: 'bg-[#121214]', // transparent overlays can be used
      border: 'border-[#202024]',
      badgeBg: 'bg-[#202024]',
      badgeText: 'text-blue-400/70',
      text: 'text-blue-400',
      indicator: 'bg-blue-400',
    },
    'Finalizado': {
      bg: 'bg-[#121214]',
      border: 'border-[#202024]',
      badgeBg: 'bg-[#202024]',
      badgeText: 'text-emerald-400/70',
      text: 'text-emerald-400',
      indicator: 'bg-emerald-400',
    },
  };

  const style = statusStyles[status];

  return (
    <div
      id={`kanban-column-${status.replace(/\s+/g, '-').toLowerCase()}`}
      className={`flex flex-col flex-1 min-w-[280px] max-w-full md:max-w-sm rounded-xl border ${style.border} ${style.bg} p-4 h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden shadow-xs`}
    >
      {/* Column Header */}
      <div className="flex flex-col mb-4 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${style.indicator}`} />
            <h3 className={`font-bold text-xs uppercase tracking-wider ${style.text}`}>{status}</h3>
            <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${style.badgeBg} ${style.badgeText}`}>
              {leads.length.toString().padStart(2, '0')}
            </span>
          </div>

          <button
            id={`add-lead-to-${status.replace(/\s+/g, '-').toLowerCase()}`}
            title="Criar lead nesta coluna"
            onClick={() => onAddLeadClick(status)}
            className="p-1 text-gray-500 hover:text-white hover:bg-[#1A1A1E] rounded-lg transition-all border border-transparent shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Finance Stats Subheader */}
        <div className="flex items-center justify-between text-xs text-gray-400 bg-[#1A1A1E] py-1.5 px-3 rounded-lg border border-[#202024] shadow-xs">
          <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
            <BarChart3 className="h-3.5 w-3.5 text-gray-500" />
            Total:
          </span>
          <span className="font-bold text-gray-300">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Cards List Scroller */}
      <div 
        id={`cards-list-${status.replace(/\s+/g, '-').toLowerCase()}`}
        className={`flex-1 overflow-y-auto pr-1 space-y-3 cursor-default custom-scrollbar scroll-smooth ${status === 'Em Andamento' ? 'bg-blue-500/[0.02] -mx-4 px-4 pt-1 rounded-b-xl' : ''}`}
      >
        {leads.length > 0 ? (
          leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#202024] rounded-xl bg-[#1A1A1E]/50 p-4 mt-1">
            <AlertCircle className="h-7 w-7 text-[#29292E] mb-2" />
            <p className="text-xs text-slate-500 font-medium font-sans">Nenhum lead nesta etapa</p>
            <button
              onClick={() => onAddLeadClick(status)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold mt-2 hover:underline cursor-pointer"
            >
              Criar um agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
