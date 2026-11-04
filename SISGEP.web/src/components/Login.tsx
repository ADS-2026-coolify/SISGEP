import { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';

interface LoginProps {
  onLogin: () => void;
  onForgotPassword: () => void;
}

export function Login({ onLogin, onForgotPassword }: LoginProps) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Máscara simples para CPF visual no input
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})(\d{1,2})/, '$1-$2');
      setCpf(value);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedCpf = cpf.replace(/\D/g, '');
      const data = await api.login(normalizedCpf, password);
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      window.location.reload();
      
      onLogin();
    } catch (err) {
      setError('CPF ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      {/* Card Principal */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Logo e Título */}
        <div className="px-8 py-12 text-center bg-gradient-to-br from-gray-50 to-white">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
            SISGEP
          </h1>
          <div className="h-1 w-16 bg-blue-600 mx-auto rounded-full mb-3"></div>
          <p className="text-base text-gray-600 font-medium">
            Sistema de Gestão de Pátios
          </p>
        </div>

        {/* Formulário */}
        <div className="px-8 py-10 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Exibição de erro */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Campo CPF */}
            <div>
              <label 
                htmlFor="cpf" 
                className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide"
              >
                CPF
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
                </div>
                <input
                  id="cpf"
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="w-full pl-12 pr-4 py-4 text-base font-medium border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base font-medium border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 text-lg font-bold rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-8 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  ENTRAR NO SISTEMA
                  <ArrowRight className="w-5 h-5" strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-gray-700 font-semibold hover:text-blue-600 transition-colors inline-flex items-center gap-1"
          >
            Esqueceu sua senha?
            <span className="text-blue-600">Clique aqui</span>
          </button>
        </div>
      </div>
    </div>
  );
}