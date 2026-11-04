import { ArrowLeft, DollarSign, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';

interface SettingsDetranTabProps {
  onBack: () => void;
}

export function SettingsDetranTab({ onBack }: SettingsDetranTabProps) {
  const { detranTowingFee, detranDailyRate, loading, updateDetranValues } = useConfig();
  const [towingFee, setTowingFee] = useState(detranTowingFee);
  const [dailyFee, setDailyFee] = useState(detranDailyRate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTowingFee(detranTowingFee);
    setDailyFee(detranDailyRate);
  }, [detranTowingFee, detranDailyRate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDetranValues(towingFee, dailyFee);
      alert(`Nova tabela DETRAN salva!\nGuincho: R$ ${towingFee}\nDiária: R$ ${dailyFee}`);
    } catch (error) {
      console.error('Erro ao salvar tabela DETRAN:', error);
      alert('Não foi possível salvar os valores DETRAN. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Valores DETRAN</h1>
          <p className="text-sm text-gray-500 mt-1">Configure os valores oficiais do DETRAN. As alterações passam a valer a partir de hoje e preservam as vigências anteriores.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Taxa de Guincho (R$) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={towingFee}
                  onChange={(e) => setTowingFee(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Valor fixo cobrado pela remoção do veículo</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Taxa Diária (R$) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dailyFee}
                  onChange={(e) => setDailyFee(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Valor cobrado por dia de permanência no pátio</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Cálculo Automático</h3>
              <p className="text-sm text-blue-700 mb-4">
                Total = Taxa de Guincho + (Taxa Diária × Dias no Pátio)
              </p>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(parseFloat(towingFee) + (parseFloat(dailyFee) * 10)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 mt-1">Exemplo: 10 dias no pátio</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="w-5 h-5" strokeWidth={2.5} />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
