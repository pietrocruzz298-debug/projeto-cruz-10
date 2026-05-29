import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, Mail, Phone, DollarSign, Edit3, Trash2, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { CRMLead, LeadStatus } from '../types';

interface KanbanCardProps {
  key?: React.Key;
  lead: CRMLead;
  onEdit: (lead: CRMLead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
}

export default function KanbanCard({ lead, onEdit, onDelete, onStatusChange }: KanbanCardProps) {
  // Format deal value to Brazilian Real (R$)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const getStatusFlow = (current: LeadStatus): { prev: LeadStatus | null; next: LeadStatus | null } => {
    if (current === 'Não iniciado') return { prev: null, next: 'Em Andamento' };
    if (current === 'Em Andamento') return { prev: 'Não iniciado', next: 'Finalizado' };
    return { prev: 'Em Andamento', next: null };
  };

  const { prev, next } = getStatusFlow(lead.status);

  return (
    <motion.div
      id={`lead-card-${lead.id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-[#1A1A1E] border border-[#29292E] hover:border-indigo-500/50 rounded-xl p-4 shadow-sm hover:shadow-indigo-950/20 transition-all duration-200 group flex flex-col justify-between"
    >
      <div>
        {/* Card Header: Client Name / Status Shift Arrow Buttons */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-[#E1E1E6] text-[15px] group-hover:text-indigo-400 transition-colors break-words leading-snug">
            {lead.title}
          </h4>
          
          <div className="flex items-center space-x-1 opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
            {prev && (
              <button
                id={`prev-status-btn-${lead.id}`}
                title={`Mover para: ${prev}`}
                onClick={() => onStatusChange(lead.id, prev)}
                className="p-1 rounded hover:bg-[#202024] text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}
            {next && (
              <button
                id={`next-status-btn-${lead.id}`}
                title={`Mover para: ${next}`}
                onClick={() => onStatusChange(lead.id, next)}
                className="p-1 rounded hover:bg-[#202024] text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Company Badge */}
        {lead.company && (
          <div className="flex items-center text-xs text-gray-400 mb-3 gap-1.5 font-medium">
            <Briefcase className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}

        {/* Financial Value Deal Badge */}
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold text-xs mb-3">
          <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>{formatCurrency(lead.value)}</span>
        </div>

        {/* Contact Info Indicators */}
        <div className="space-y-1.5 text-xs text-gray-400 border-t border-[#202024] pt-3">
          {lead.email && (
            <div className="flex items-center gap-2 group/contact">
              <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <a 
                href={`mailto:${lead.email}`} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-indigo-400 hover:underline truncate"
              >
                {lead.email}
              </a>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span className="truncate text-gray-300">{lead.phone}</span>
            </div>
          )}
          {lead.description && (
            <p className="text-gray-400 italic text-[11px] line-clamp-2 mt-2 bg-[#121214] p-2 rounded-lg border border-[#202024] leading-relaxed">
              &ldquo;{lead.description}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between border-t border-[#202024] pt-3 mt-4">
        <span className="text-[10px] text-gray-500 font-mono">
          {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </span>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            id={`edit-lead-${lead.id}`}
            title="Editar Lead"
            onClick={() => onEdit(lead)}
            className="p-1 rounded hover:bg-[#202024] text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            id={`delete-lead-${lead.id}`}
            title="Excluir Lead"
            onClick={() => onDelete(lead.id)}
            className="p-1 rounded hover:bg-rose-950/30 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
