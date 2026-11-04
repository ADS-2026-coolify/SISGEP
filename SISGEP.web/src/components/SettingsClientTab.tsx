import { Plus, X, Check, Trash2, User, MapPin, Mail, Phone, IdCard, ArrowLeft, Edit2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';

interface SettingsClientTabProps {
  onBack: () => void;
}

export function SettingsClientTab({ onBack }: SettingsClientTabProps) {
  const { clients, addClient, updateClient, deleteClient } = useConfig();
  
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCpf, setNewClientCpf] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient = {
      id: String(Date.now()),
      name: newClientName,
      cpf: newClientCpf,
      phone: newClientPhone,
      email: newClientEmail,
      address: newClientAddress,
      createdAt: new Date().toISOString()
    };
    addClient(newClient);
    resetForm();
    alert(`Cliente ${newClientName} cadastrado com sucesso!`);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClientId) {
      const updatedClient = {
        id: editingClientId,
        name: newClientName,
        cpf: newClientCpf,
        phone: newClientPhone,
        email: newClientEmail,
        address: newClientAddress,
        createdAt: clients.find(c => c.id === editingClientId)?.createdAt || new Date().toISOString()
      };
      updateClient(editingClientId, updatedClient);
      resetForm();
      alert(`Cliente atualizado com sucesso!`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (editingClientId) {
      handleUpdateClient(e);
    } else {
      handleAddClient(e);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteClient(clientId);
    }
  };

  const resetForm = () => {
    setNewClientName('');
    setNewClientCpf('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientAddress('');
    setEditingClientId(null);
    setShowAddClient(false);
  };

  return (
    <div className="flex-1 overflow-auto w-full bg-gray-50 min-h-screen pb-8">
      {/* Header Superior - Padrão Clean */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Clientes</h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Particulares</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Cliente</span>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 pt-6 max-w-7xl mx-auto space-y-6">
        
        {/* Listagem em Cards Modernos */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">Nenhum cliente cadastrado</p>
            <p className="text-sm text-gray-500">Clique em "Novo Cliente" para começar.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {clients.map((client) => (
                <div key={client.id} className="p-5 hover:bg-gray-50 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{client.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <IdCard className="w-3.5 h-3.5 text-gray-400" />
                            {client.cpf}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {client.phone}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingClientId(client.id);
                          setNewClientName(client.name);
                          setNewClientCpf(client.cpf);
                          setNewClientPhone(client.phone);
                          setNewClientEmail(client.email || '');
                          setNewClientAddress(client.address);
                          setShowAddClient(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-md hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Cliente */}
      {showAddClient && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Preencha os dados do proprietário</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="clientForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white"
                      required
                      placeholder="Ex: João Silva"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      CPF *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <IdCard className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={newClientCpf}
                        onChange={(e) => setNewClientCpf(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white"
                        required
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Telefone *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white"
                        required
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white"
                      placeholder="joao@exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Endereço Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white min-h-[80px]"
                      required
                      placeholder="Rua, Número, Bairro, Cidade - Estado"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="clientForm"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                {editingClientId ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}