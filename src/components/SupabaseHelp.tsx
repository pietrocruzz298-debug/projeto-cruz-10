import React, { useState } from 'react';
import { Database, CheckCircle, Copy, AlertCircle, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { isSupabaseConfigured, SUPABASE_SQL_SETUP } from '../supabase';

interface SupabaseHelpProps {
  currentSource: 'supabase' | 'local';
  syncError?: string;
  onRefresh: () => void;
  isInitialLoading: boolean;
}

export default function SupabaseHelp({ currentSource, syncError, onRefresh, isInitialLoading }: SupabaseHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSupabaseLive = currentSource === 'supabase';

  return (
    <div id="supabase-help-container" className="bg-[#121214] border border-[#202024] rounded-xl overflow-hidden mb-6 shadow-xs">
      <div 
        id="supabase-help-header"
        className="flex items-center justify-between p-4 cursor-pointer bg-[#1A1A1E] hover:bg-[#202024] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          <Database className={`h-5 w-5 ${isSupabaseLive ? 'text-[#10b981] animate-pulse' : 'text-amber-500'}`} />
          <div>
            <h3 className="text-sm font-medium text-[#E1E1E6] flex items-center gap-2">
              Status de Sincronização: 
              {isSupabaseLive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Nuvem Supabase Ativa
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Modo Local (Offline)
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              {isSupabaseLive 
                ? 'Os dados do seu CRM estão sendo armazenados diretamente no seu Supabase.' 
                : 'Salvar em nuvem requer chaves no painel de Segredos (Secrets) do AI Studio.'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            id="refresh-db-btn"
            title="Atualizar dados da Nuvem"
            disabled={isInitialLoading}
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#26262B] rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isInitialLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {isOpen && (
        <div id="supabase-instructions-pane" className="border-t border-[#202024] p-4 bg-[#121214] text-sm text-[#E1E1E6] space-y-4">
          {!isSupabaseConfigured ? (
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-3 flex gap-3 text-amber-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider mb-1">Como Ativar Sincronização em Nuvem:</p>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-amber-200">
                  <li>No menu ou painel de configurações à direita, localize a seção de <strong>Segredos / Secrets</strong>.</li>
                  <li>Adicione estas duas variáveis de ambiente correspondentes ao seu projeto do Supabase:</li>
                </ol>
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs font-mono">
                  <code className="bg-[#1A1A1E] border border-[#29292E] p-1.5 rounded block text-amber-400">VITE_SUPABASE_URL = &quot;Sua URL do Supabase&quot;</code>
                  <code className="bg-[#1A1A1E] border border-[#29292E] p-1.5 rounded block text-amber-400">VITE_SUPABASE_ANON_KEY = &quot;Sua Chave Anon de API&quot;</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3 flex gap-3 text-emerald-300 text-xs">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
              <div>
                <p className="font-medium text-xs">Variáveis de ambiente do Supabase detectadas com sucesso!</p>
                <p className="text-xs text-emerald-400/80 mt-1">Conectado a URL: <code className="bg-[#1A1A1E] border border-[#29292E] px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[11px]">{import.meta.env.VITE_SUPABASE_URL}</code></p>
              </div>
            </div>
          )}

          {syncError && (
            <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-3 flex gap-3 text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider mb-1">Aviso da Conexão:</p>
                <p className="text-xs text-rose-200/90">{syncError}</p>
                <p className="text-xs font-semibold mt-1 text-rose-300">Isso geralmente ocorre se a tabela <code className="bg-rose-950 px-1 rounded font-mono text-rose-200">leads</code> ainda não existe no seu banco de dados Supabase.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider text-gray-400">Script de Configuração SQL:</span>
              <button
                id="copy-sql-btn"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar SQL
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Entre no painel do <strong>Supabase</strong>, vá na seção <strong>SQL Editor</strong>, clique em <strong>New Query</strong>, cole o código abaixo e clique em <strong>Run</strong>:
            </p>
            <pre className="p-3 bg-black/50 border border-[#202024] text-[11px] font-mono text-gray-300 rounded-lg overflow-x-auto max-h-48 leading-relaxed">
              {SUPABASE_SQL_SETUP}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
