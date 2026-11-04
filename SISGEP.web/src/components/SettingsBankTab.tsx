import { Plus, X, Check, Trash2, Building2, Phone, Mail, ArrowLeft, DollarSign, Edit2, FileText } from 'lucide-react';
import { useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';

interface SettingsBankTabProps {
  onBack: () => void;
}

export function SettingsBankTab({ onBack }: SettingsBankTabProps) {
  const { banks, addBank, updateBank, deleteBank } = useConfig();
  
  const [showAddBank, setShowAddBank] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [newBankName, setNewBankName] = useState('');
  const [newBankCnpj, setNewBankCnpj] = useState('');
  const [newBankPhone, setNewBankPhone] = useState('');
  const [newBankEmail, setNewBankEmail] = useState('');
  const [newBankTowingFee, setNewBankTowingFee] = useState('');
  const [newBankDailyRate, setNewBankDailyRate] = useState('');

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    const newBank = {
      id: String(Date.now()),
      name: newBankName,
      cnpj: newBankCnpj,
      phone: newBankPhone,
      email: newBankEmail,
      towingFee: newBankTowingFee,
      dailyRate: newBankDailyRate,
      createdAt: new Date().toISOString()
    };
    addBank(newBank);
    resetForm();
    alert(`Instituição ${newBankName} cadastrada com sucesso!`);
  };

  const handleUpdateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBankId) {
      const updatedBank = {
        id: editingBankId,
        name: newBankName,
        cnpj: newBankCnpj,
        phone: newBankPhone,
        email: newBankEmail,
        towingFee: newBankTowingFee,
        dailyRate: newBankDailyRate,
        createdAt: banks.find(b => b.id === editingBankId)?.createdAt || new Date().toISOString()
      };
      updateBank(editingBankId, updatedBank);
      resetForm();
      alert(`Instituição atualizada com sucesso!`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (editingBankId) {
      handleUpdateBank(e);
    } else {
      handleAddBank(e);
    }
  };

  const handleDeleteBank = (bankId: string) => {
    if (confirm('Tem certeza que deseja excluir esta instituição financeira?')) {
      deleteBank(bankId);
    }
  };

  const resetForm = () => {
    setNewBankName('');
    setNewBankCnpj('');
    setNewBankPhone('');
    setNewBankEmail('');
    setNewBankTowingFee('');
    setNewBankDailyRate('');
    setEditingBankId(null);
    setShowAddBank(false);
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
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Instituições Financeiras</h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Bancos e Financeiras</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddBank(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Instituição</span>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 pt-6 max-w-7xl mx-auto space-y-6">
        
        {/* Banks List */}
        {banks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">Nenhuma instituição cadastrada</p>
            <p className="text-sm text-gray-500">Clique em "Nova Instituição" para começar.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {banks.map((bank) => (
                <div key={bank.id} className="p-5 hover:bg-gray-50 transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    {/* Informações Principais */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900">{bank.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">CNPJ: {bank.cnpj}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {bank.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {bank.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloco de Taxas Financeiras e Ações */}
                    <div className="flex flex-col items-start md:items-end justify-between min-w-[200px] bg-gray-50 md:bg-transparent rounded-lg p-3 md:p-0">
                      <div className="space-y-1 w-full md:w-auto">
                        <div className="flex justify-between md:justify-end items-center gap-3 text-sm">
                          <span className="text-gray-500 font-medium">Guincho:</span>
                          <span className="font-bold text-gray-900">R$ {bank.towingFee}</span>
                        </div>
                        <div className="flex justify-between md:justify-end items-center gap-3 text-sm">
                          <span className="text-gray-500 font-medium">Diária:</span>
                          <span className="font-bold text-gray-900">R$ {bank.dailyRate}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity w-full md:w-auto justify-end">
                        <button
                          onClick={() => {
                            setEditingBankId(bank.id);
                            setNewBankName(bank.name);
                            setNewBankCnpj(bank.cnpj);
                            setNewBankPhone(bank.phone);
                            setNewBankEmail(bank.email);
                            setNewBankTowingFee(bank.towingFee);
                            setNewBankDailyRate(bank.dailyRate);
                            setShowAddBank(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteBank(bank.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-md hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showAddBank && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingBankId ? 'Editar Instituição' : 'Nova Instituição'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Dados cadastrais e taxas vigentes</p>
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
              <form id="bankForm" onSubmit={handleSubmit} className="space-y-5">
                
                {/* Nome e CNPJ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Nome da Instituição *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white"
                        required
                        placeholder="Ex: Banco do Brasil"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      CNPJ *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={newBankCnpj}
                        onChange={(e) => setNewBankCnpj(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white"
                        required
                        placeholder="00.000.000/0001-00"
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
                        value={newBankPhone}
                        onChange={(e) => setNewBankPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white"
                        required
                        placeholder="(11) 3000-0000"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Full Width para ocupar o lugar do contato removido) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    E-mail *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={newBankEmail}
                      onChange={(e) => setNewBankEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-gray-50 focus:bg-white"
                      required
                      placeholder="contato@banco.com.br"
                    />
                  </div>
                </div>

                {/* Valores de Taxas em bloco destacado */}
                <div className="mt-6 pt-5 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Taxas Negociadas (Padrão)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Taxa de Guincho (R$) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={newBankTowingFee}
                          onChange={(e) => setNewBankTowingFee(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm font-bold border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white"
                          required
                          placeholder="350.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Taxa Diária (R$) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={newBankDailyRate}
                          onChange={(e) => setNewBankDailyRate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm font-bold border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white"
                          required
                          placeholder="50.00"
                        />
                      </div>
                    </div>
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
                form="bankForm"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                {editingBankId ? 'Atualizar Instituição' : 'Cadastrar Instituição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}