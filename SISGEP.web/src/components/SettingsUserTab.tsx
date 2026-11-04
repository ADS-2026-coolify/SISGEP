import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { api } from '../api';


interface SettingsUserTabProps {
  onBack: () => void;
}

interface User {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string;
  email: string;
  tipo_usuario: 'ADMINISTRADOR' | 'OPERADOR';
}

export function SettingsUserTab({ onBack }: SettingsUserTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'ADMINISTRADOR' | 'OPERADOR'>('OPERADOR');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsuarios();
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && Array.isArray(data.results)) {
        setUsers(data.results);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsers([]); 
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];
  
  const filteredUsers = safeUsers.filter(user => {
    const search = searchTerm.toLowerCase();
    const nomeStr = user.nome_completo || '';
    const cpfStr = user.cpf || '';
    return nomeStr.toLowerCase().includes(search) || cpfStr.includes(search);
  });

  const formatCpfView = (cpfValue?: string) => {
    if (!cpfValue) return 'Não informado';
    return cpfValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})(\d{1,2})/, '$1-$2');
      setCpf(value);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2')
                   .replace(/(\d)(\d{4})$/, '$1-$2');
      setTelefone(value);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setNomeCompleto(user.nome_completo || '');
      setCpf(user.cpf || '');
      setTelefone(user.telefone || '');
      setEmail(user.email || '');
      setTipoUsuario(user.tipo_usuario || 'OPERADOR');
    } else {
      setEditingUser(null);
      setNomeCompleto('');
      setCpf('');
      setTelefone('');
      setEmail('');
      setTipoUsuario('OPERADOR');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      alert("Por favor, informe um CPF válido com 11 dígitos.");
      return;
    }

    const userData = {
      nome_completo: nomeCompleto,
      cpf: cleanCpf,
      telefone: telefone.replace(/\D/g, ''),
      email: email,
      tipo_usuario: tipoUsuario,
    };

    try {
      if (editingUser) {
        await api.updateUsuario(editingUser.id, userData);
      } else {
        const criado = await api.createUsuario(userData);
        alert(criado?.aviso || "Usuário criado com sucesso! Um e-mail com instruções para definição de senha foi enviado.");
      }
      
      await loadUsers();
      closeModal();
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      const dadosErro = error.response?.data;
      const mensagemDetalhada = dadosErro && typeof dadosErro === 'object'
        ? Object.entries(dadosErro).map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`).join('\n')
        : null;
      alert(mensagemDetalhada || dadosErro?.erro || "Erro ao salvar o usuário. Verifique se o CPF ou e-mail já estão cadastrados.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.deleteUsuario(id);
        await loadUsers();
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Erro ao excluir usuário. Ele pode estar vinculado a algum registro do pátio.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Gerenciar Usuários</h1>
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            placeholder="Pesquisar por nome ou CPF..."
          />
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900">{user.nome_completo || 'Sem Nome'}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        user.tipo_usuario === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.tipo_usuario || 'DESCONHECIDO'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {/* Utilizando a função de formatação segura aqui */}
                      <p>CPF: {formatCpfView(user.cpf)}</p>
                      <p>E-mail: {user.email || 'Não informado'}</p>
                      <p>Telefone: {user.telefone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openModal(user)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
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

      {/* Modal - Create/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    CPF (Usado para Login) *
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={handleCpfChange}
                    disabled={!!editingUser} 
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                      editingUser 
                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-white border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
                    }`}
                    placeholder="000.000.000-00"
                    required
                  />
                  {editingUser && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      O CPF não pode ser alterado após o cadastro.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="Ex: joao@empresa.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="Ex: (11) 98765-4321"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Perfil/Permissão *
                  </label>
                  <select
                    value={tipoUsuario}
                    onChange={(e) => setTipoUsuario(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-700"
                  >
                    <option value="OPERADOR">Operador (Somente Consulta + Entrada/Saída)</option>
                    <option value="ADMINISTRADOR">Administrador (Acesso Total)</option>
                  </select>
                </div>

                {/* Box de Informação sobre a Senha */}
                {!editingUser ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Sobre a Senha:</strong> O usuário receberá um e-mail com instruções para definir sua senha de acesso inicial de forma segura.
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2">
                    <p className="text-sm text-gray-600 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>
                        Para redefinir a senha deste usuário, peça para ele utilizar a opção "Esqueceu sua senha?" na tela de login inicial.
                      </span>
                    </p>
                  </div>
                )}

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
                form="userForm"
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                {editingUser ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}