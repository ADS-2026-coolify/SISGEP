import { useState } from 'react';
import { Plus, X, Check, Trash2, AlertTriangle, FileText, ArrowLeft, Edit2, Search } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

interface SettingsInfractionTabProps {
  onBack?: () => void;
}

export function SettingsInfractionTab({ onBack }: SettingsInfractionTabProps) {
  const { infractions, addInfraction, updateInfraction, deleteInfraction } = useConfig();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddInfraction, setShowAddInfraction] = useState(false);
  const [editingInfractionId, setEditingInfractionId] = useState<string | null>(null);
  const [newInfractionCode, setNewInfractionCode] = useState('');
  const [newInfractionDescription, setNewInfractionDescription] = useState('');

  // Lógica de filtro para a barra de pesquisa
  const filteredInfractions = infractions.filter(infraction => 
    infraction.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    infraction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (infraction?: any) => {
    if (infraction) {
      setEditingInfractionId(infraction.id);
      setNewInfractionCode(infraction.code);
      setNewInfractionDescription(infraction.description);
    } else {
      setEditingInfractionId(null);
      setNewInfractionCode('');
      setNewInfractionDescription('');
    }
    setShowAddInfraction(true);
  };

  const closeModal = () => {
    setShowAddInfraction(false);
    setEditingInfractionId(null);
  };

  const handleAddInfraction = (e: React.FormEvent) => {
    e.preventDefault();
    const newInfraction = {
      id: String(Date.now()),
      code: newInfractionCode.toUpperCase(),
      description: newInfractionDescription,
      createdAt: new Date().toISOString()
    };
    addInfraction(newInfraction);
    closeModal();
  };

  const handleUpdateInfraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInfractionId) {
      const updatedInfraction = {
        id: editingInfractionId,
        code: newInfractionCode.toUpperCase(),
        description: newInfractionDescription,
        createdAt: infractions.find(i => i.id === editingInfractionId)?.createdAt || new Date().toISOString()
      };
      updateInfraction(editingInfractionId, updatedInfraction);
      closeModal();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (editingInfractionId) {
      handleUpdateInfraction(e);
    } else {
      handleAddInfraction(e);
    }
  };

  const handleDeleteInfraction = (infractionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta infração?')) {
      deleteInfraction(infractionId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Padronizado */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Gerenciar Infrações</h1>
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nova Infração
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Barra de Pesquisa Moderna */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            placeholder="Pesquisar por código ou descrição..."
          />
        </div>

        {/* Lista de Infrações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredInfractions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <AlertTriangle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-lg font-semibold text-gray-900 mb-1">Nenhuma infração encontrada</p>
              <p className="text-sm">Tente ajustar a busca ou adicione um novo registro.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInfractions.map((infraction) => (
                <div key={infraction.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Destaque visual (Badge vermelho) para o Código da Infração */}
                      <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-bold tracking-wider">
                        {infraction.code}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {infraction.description}
                    </p>
                  </div>
                  
                  {/* Botões de Ação Reduzidos e Modernos */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openModal(infraction)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteInfraction(infraction.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Nova/Editar Infração (Mesmo visual da tela de Usuários) */}
      {showAddInfraction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingInfractionId ? 'Editar Infração' : 'Nova Infração'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="infracaoForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Código / Artigo *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={newInfractionCode}
                      onChange={(e) => setNewInfractionCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                      placeholder="Ex: ART. 165 CTB"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Descrição da Infração *
                  </label>
                  <textarea
                    value={newInfractionDescription}
                    onChange={(e) => setNewInfractionDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all min-h-[120px] resize-y"
                    placeholder="Descreva a infração (ex: Estacionar o veículo nas esquinas...)"
                    required
                  />
                </div>

              </form>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 text-gray-700 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="infracaoForm"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                {editingInfractionId ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}