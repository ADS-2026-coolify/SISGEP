import { useState } from 'react';
import { Lock, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import loginBackground from '../assets/loginBackground.png';

export function DefinirSenha() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const backgroundStyle = {
    backgroundImage: `url(${loginBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  // Lógica simples para pegar os parâmetros da URL sem precisar de bibliotecas extras
  const pathParts = window.location.pathname.split('/');
  const uid = pathParts[2];
  const token = pathParts[3];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      setStatus('error');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      // Em produção (Render), defina VITE_API_URL nas variáveis de ambiente do build
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/auth/';

      // Fazendo o POST para a rota configurada no Django
      const response = await fetch(`${apiBaseUrl}usuarios/redefinir_senha/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          token: token,
          senha: password
        })
      });

      if (response.ok) {
        setStatus('success');
      } else {
        throw new Error('Falha ao redefinir a senha');
      }
    } catch (error) {
      setErrorMessage('O link é inválido ou já expirou. Solicite uma nova recuperação.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>
        <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-green-500">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Senha definida com sucesso!</h2>
          <p className="text-gray-600 mb-6">Sua conta agora está segura. Você já pode acessar o sistema.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={backgroundStyle}
    >
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>
      <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-600">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Criar senha</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">Digite sua senha de acesso ao SISGEP abaixo</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {status === 'error' && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                placeholder="Mínimo de 6 caracteres"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Confirmar senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                placeholder="Repita sua senha"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-blue-600 text-white py-4 text-lg font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>SALVAR SENHA <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}