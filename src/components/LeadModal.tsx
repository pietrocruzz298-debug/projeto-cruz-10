import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Briefcase, Mail, Phone, DollarSign, FileText } from 'lucide-react';
import { CRMLead, LeadStatus } from '../types';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Omit<CRMLead, 'id' | 'created_at'> & { id?: string }) => void;
  lead?: CRMLead | null; // If editing, this is prefilled
  defaultStatus?: LeadStatus; // If creating, starts in this column
}

export default function LeadModal({ isOpen, onClose, onSave, lead, defaultStatus }: LeadModalProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<LeadStatus>('Não iniciado');
  const [description, setDescription] = useState('');
  
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (lead) {
      setTitle(lead.title);
      setCompany(lead.company || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setValue(lead.value.toString());
      setStatus(lead.status);
      setDescription(lead.description || '');
    } else {
      setTitle('');
      setCompany('');
      setEmail('');
      setPhone('');
      setValue('');
      setStatus(defaultStatus || 'Não iniciado');
      setDescription('');
    }
    setErrors({});
  }, [lead, isOpen, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setErrors({ title: 'O nome do contato é obrigatório' });
      return;
    }

    onSave({
      id: lead?.id,
      title: title.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      value: isNaN(parseFloat(value)) ? 0 : parseFloat(value),
      status,
      description: description.trim(),
    });
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0A0B]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-[#121214] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden z-10 border border-[#202024]"
          >
            {/* Header */}
            <div className="bg-[#1A1A1E] px-6 py-4 flex items-center justify-between border-b border-[#202024]">
              <h2 className="text-base font-bold text-[#E1E1E6] uppercase tracking-wide">
                {lead ? 'Editar Negócio / Lead' : 'Novo Negócio / Lead'}
              </h2>
              <button
                id="close-modal-btn"
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#202024] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Nome do Contato (Required) */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Nome do Contato *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="lead-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className={`w-full pl-9 pr-4 py-2 text-sm bg-[#1A1A1E] border rounded-lg text-[#E1E1E6] placeholder-gray-600 focus:outline-none focus:ring-2 ${
                      errors.title ? 'border-rose-500/50 focus:ring-rose-500/10' : 'border-[#29292E] focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Empresa
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <input
                    id="lead-company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Tech Solutions Ltda"
                    className="w-full pl-9 pr-4 py-2 text-sm bg-[#1A1A1E] border border-[#29292E] rounded-lg text-[#E1E1E6] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Contatos Grid: Email e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="lead-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="joao@empresa.com"
                      className="w-full pl-9 pr-4 py-2 text-sm bg-[#1A1A1E] border border-[#29292E] rounded-lg text-[#E1E1E6] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Telefone
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      id="lead-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full pl-9 pr-4 py-2 text-sm bg-[#1A1A1E] border border-[#29292E] rounded-lg text-[#E1E1E6] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Valor Financieiro do Negócio & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Valor do Negócio (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <DollarSign className="h-4 w-4" />
                    </span>
                    <input
                      id="lead-value"
                      type="number"
                      step="any"
                      min="0"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Ex: 5000"
                      className="w-full pl-9 pr-4 py-2 text-sm bg-[#1A1A1E] border border-[#29292E] rounded-lg text-[#E1E1E6] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Status / Coluna
                  </label>
                  <select
                    id="lead-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 text-sm bg-[#1A1A1E] border border-[#29292E] rounded-lg text-[#E1E1E6] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Não iniciado" className="bg-[#121214] text-[#E1E1E6]">Não iniciado</option>
                    <option value="Em Andamento" className="bg-[#121214] text-[#E1E1E6]">Em Andamento</option>
                    <option value="Finalizado" className="bg-[#121214] text-[#E1E1E6]">Finalizado</option>
                  </select>
                </div>
              </div>

              {/* Observações / Descrição */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Notas / Detalhes do Lead
                </label>
                <div className="relative">
                  <span className="absolute top-2.5 left-3 text-gray-500">
                    <FileText className="h-4 w-4" />
                  </span>
                  <textarea
                    id="lead-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva as principais anotações sobre o lead..."
                    rows={3}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-[#1A1A1E] border border-[#29292E] rounded-lg text-[#E1E1E6] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#202024] flex items-center justify-end space-x-3">
                <button
                  id="cancel-lead-modal"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-[#1A1A1E] border border-[#29292E] rounded-lg hover:bg-[#202024] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="save-lead-modal"
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-550 transition-colors shadow-sm cursor-pointer"
                >
                  Salvar Lead
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
