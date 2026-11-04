import { ArrowLeft, DollarSign, Users, Save, Plus, Trash2, Shield, User, Check, X, UserPlus, AlertTriangle, Building2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { SettingsClientTab } from './SettingsClientTab';
import { SettingsInfractionTab } from './SettingsInfractionTab';
import { SettingsBankTab } from './SettingsBankTab';
import { useConfig } from '../contexts/ConfigContext';
import { SettingsUserTab } from './SettingsUserTab';

interface SettingsProps {
  onBack: () => void;
}

interface UserData {
  id: string;
  name: string;
  username: string;
  cpf: string;
  email: string;
  phone: string;
  role: 'admin' | 'operator';
  createdAt: string;
}

interface ClientData {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

interface InfractionData {
  id: string;
  code: string;
  description: string;
  location: string;
  createdAt: string;
}

interface BankData {
  id: string;
  name: string;
  cnpj: string;
  contact: string;
  phone: string;
  email: string;
  towingFee: string;
  dailyRate: string;
  createdAt: string;
}

export function Settings({ onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'detran' | 'users' | 'clients' | 'infractions' | 'banks' | 'general'>('detran');
  
  const { detranTowingFee, detranDailyRate, setDetranTowingFee, setDetranDailyRate, updateDetranValues } = useConfig();
  
  // User management
  const [users, setUsers] = useState<UserData[]>([
    {
      id: '1',
      name: 'Admin Sistema',
      username: 'admin',
      cpf: '000.000.000-00',
      email: 'admin@example.com',
      phone: '(11) 99999-9999',
      role: 'admin',
      createdAt: '2026-01-01T10:00:00'
    },
    {
      id: '2',
      name: 'João Silva',
      username: 'joao.silva',
      cpf: '111.111.111-11',
      email: 'joao.silva@example.com',
      phone: '(11) 88888-8888',
      role: 'operator',
      createdAt: '2026-01-15T14:30:00'
    }
  ]);
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserCpf, setNewUserCpf] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operator'>('operator');

  const handleSaveDetranValues = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDetranValues(detranTowingFee, detranDailyRate);
      alert(`Nova vigência DETRAN salva a partir de hoje.\nGuincho: R$ ${detranTowingFee}\nDiária: R$ ${detranDailyRate}`);
    } catch (error) {
      console.error('Erro ao salvar tabela DETRAN:', error);
      alert('Não foi possível salvar os valores DETRAN na API.');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserData = {
      id: String(users.length + 1),
      name: newUserName,
      username: newUserUsername,
      cpf: newUserCpf,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserCpf('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserRole('operator');
    setShowAddUser(false);
    alert(`Usuário ${newUserName} criado com sucesso!`);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(u => u.id !== userId));
      alert('Usuário excluído com sucesso!');
    }
  };

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gerencie o sistema SISGEP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('detran')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'detran'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="hidden sm:inline">Valores DETRAN</span>
                <span className="sm:hidden">DETRAN</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">Usuários</span>
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'clients'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden sm:inline">Clientes</span>
                <span className="sm:hidden">Clientes</span>
              </button>
              <button
                onClick={() => setActiveTab('infractions')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'infractions'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="hidden sm:inline">Infrações</span>
                <span className="sm:hidden">Infrações</span>
              </button>
              <button
                onClick={() => setActiveTab('banks')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'banks'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="hidden sm:inline">Bancos</span>
                <span className="sm:hidden">Bancos</span>
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'general'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="hidden sm:inline">Geral</span>
                <span className="sm:hidden">Geral</span>
              </button>
            </div>
          </div>

          {/* DETRAN Values Tab */}
          {activeTab === 'detran' && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Tabela de Valores DETRAN</h2>
                <p className="text-sm text-gray-500 mt-1">Configure os valores oficiais da tabela DETRAN-SP</p>
              </div>
              <form onSubmit={handleSaveDetranValues} className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Atenção:</strong> Os novos valores passam a valer a partir de hoje. As tabelas anteriores são preservadas para manter os cálculos históricos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="towingFee" className="block text-sm font-semibold text-gray-700 mb-2">
                      Taxa de Guincho (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                      <input
                        id="towingFee"
                        type="text"
                        value={detranTowingFee}
                        onChange={(e) => setDetranTowingFee(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Valor cobrado pela remoção do veículo</p>
                  </div>

                  <div>
                    <label htmlFor="dailyRate" className="block text-sm font-semibold text-gray-700 mb-2">
                      Taxa Diária (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                      <input
                        id="dailyRate"
                        type="text"
                        value={detranDailyRate}
                        onChange={(e) => setDetranDailyRate(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Valor cobrado por dia de permanência</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Exemplo de Cálculo:</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>• Taxa de Guincho: <span className="font-semibold">R$ {detranTowingFee}</span></p>
                    <p>• Taxa Diária: <span className="font-semibold">R$ {detranDailyRate}</span></p>
                    <p>• Veículo com 10 dias no pátio: <span className="font-semibold">R$ {detranTowingFee} + (10 × R$ {detranDailyRate}) = R$ {(parseFloat(detranTowingFee) + (10 * parseFloat(detranDailyRate))).toFixed(2)}</span></p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <SettingsUserTab onBack={() => setActiveTab('detran')} />
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Configurações Gerais</h2>
                <p className="text-sm text-gray-500 mt-1">Outras configurações do sistema</p>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Em Desenvolvimento</h3>
                  <p className="text-sm text-gray-500">
                    Outras configurações estarão disponíveis em breve
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <SettingsClientTab onBack={() => setActiveTab('detran')} />
          )}

          {/* Infractions Tab */}
          {activeTab === 'infractions' && (
            <SettingsInfractionTab onBack={() => setActiveTab('detran')} />
          )}

          {/* Banks Tab */}
          {activeTab === 'banks' && (
            <SettingsBankTab onBack={() => setActiveTab('detran')} />
          )}
        </div>
      </div>
    </div>
  );
}