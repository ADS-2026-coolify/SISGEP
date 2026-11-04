import { ArrowLeft, Mail, CheckCircle, Shield, Loader2 } from 'lucide-react'; 
import { useState } from 'react';
import { api } from '../api';

interface PasswordRecoveryProps {
  onBack: () => void;
}

export function PasswordRecovery({ onBack }: PasswordRecoveryProps) {
  const [step, setStep] = useState<'identify' | 'sent'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'cpf' | 'email'>('cpf');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return; 
    
    setIsLoading(true);

    try {
      await api.esqueciSenha(identifier, identifierType);
      setStep('sent'); 
    } catch (error) {
      console.error("Erro", error);
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleIdentifierChange = (value: string) => {
    if (identifierType === 'cpf') {
      setIdentifier(formatCPF(value));
    } else {
      setIdentifier(value);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      {step === 'identify' ? (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-blue-600">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <button
              onClick={onBack}
              disabled={isLoading}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-4 disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar ao Login</span>
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Recuperar Senha</h1>
                <p className="text-blue-100 text-sm mt-1">SISGEP</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <p className="text-gray-700 text-base leading-relaxed">
                Informe seu <strong>CPF</strong> ou <strong>E-mail</strong> cadastrado para receber instruções de recuperação de senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Como deseja recuperar?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isLoading} 
                    onClick={() => {
                      setIdentifierType('cpf');
                      setIdentifier('');
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                      identifierType === 'cpf'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Shield className="w-6 h-6" />
                    <span className="font-semibold text-sm">CPF</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setIdentifierType('email');
                      setIdentifier('');
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                      identifierType === 'email'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Mail className="w-6 h-6" />
                    <span className="font-semibold text-sm">E-mail</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                  {identifierType === 'cpf' ? 'CPF' : 'E-mail'}
                </label>
                <input
                  id="identifier"
                  type={identifierType === 'email' ? 'email' : 'text'}
                  value={identifier}
                  disabled={isLoading}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder={identifierType === 'cpf' ? '000.000.000-00' : 'seu@email.com'}
                  maxLength={identifierType === 'cpf' ? 14 : undefined}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {identifierType === 'cpf' 
                    ? 'Digite o CPF cadastrado no sistema' 
                    : 'Digite o e-mail cadastrado no sistema'}
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Atenção:</strong> As instruções de recuperação serão enviadas para o e-mail cadastrado neste {identifierType === 'cpf' ? 'CPF' : 'e-mail'}.
                </p>
              </div>

              {/* Submit Button Atualizado */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg hover:shadow-xl disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Instruções'
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-green-600">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold">Instruções Enviadas!</h1>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <p className="text-gray-700 text-base leading-relaxed mb-4">
                As instruções para recuperação de senha foram enviadas para:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                <p className="text-lg font-semibold text-gray-900 break-all">
                  {identifier}
                </p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {identifierType === 'cpf' ? (
                  <>Verifique seu <strong>e-mail</strong> e <strong>SMS</strong> para obter o link de recuperação de senha.</>
                ) : (
                  <>Verifique sua <strong>caixa de entrada</strong> e também a pasta de <strong>spam</strong> para obter o link de recuperação de senha.</>
                )}
              </p>
            </div>

            {/* Info Boxes */}
            <div className="space-y-3 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> O link de recuperação é válido por 30 minutos.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Não recebeu?</strong> Aguarde alguns minutos ou entre em contato com o administrador do sistema.
                </p>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-4 rounded-xl text-lg font-bold hover:bg-gray-700 active:bg-gray-800 transition-colors shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}