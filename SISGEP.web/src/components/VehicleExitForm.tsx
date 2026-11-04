import { useState, useMemo } from 'react';
import { ArrowLeft, Upload, X, Search, Filter, Car, Calendar, Loader2 } from 'lucide-react';
import { useVehicle, Vehicle } from '../contexts/VehicleContext';
import { api } from '../api';

interface VehicleExitFormProps {
  onBack: () => void;
}

export function VehicleExitForm({ onBack }: VehicleExitFormProps) {
  const { vehicles, refreshVehicles } = useVehicle();
  const [loading, setLoading] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'detran' | 'banco' | 'particular'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Campos do Formulário
  const [exitDateTime, setExitDateTime] = useState(getLocalDateTimeInputValue);
  const [detranAuthorizer, setDetranAuthorizer] = useState('');
  const [detranDocument, setDetranDocument] = useState<File | null>(null);
  const [bankExitPhoto, setBankExitPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState('');

  // UC05 - Apenas veículos recolhidos podem ter a saída registrada
  const activeVehicles = useMemo(() => vehicles.filter(v => v.status === 'Ativo'), [vehicles]);

  const filteredVehicles = activeVehicles.filter(v => {
    const matchesSearch = 
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || v.category.toLowerCase() === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} às ${timeStr}`;
  };

  function getLocalDateTimeInputValue() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'detran': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'banco': return 'bg-green-50 text-green-700 border border-green-200';
      case 'particular': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case 'detran': return 'DETRAN';
      case 'banco': return 'Banco';
      case 'particular': return 'Particular';
      default: return 'Outro';
    }
  };

  const isAllowedFileType = (file: File, allowedExtensions: string[], allowedMimeTypes: string[]) => {
    const name = file.name.toLowerCase();
    const extension = name.includes('.') ? `.${name.split('.').pop()}` : '';
    const mimeType = file.type.toLowerCase();

    return allowedExtensions.includes(extension) || allowedMimeTypes.includes(mimeType);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'detran' | 'bank') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = type === 'detran' ? ['.pdf', '.jpg', '.jpeg', '.png', '.webp'] : ['.jpg', '.jpeg', '.png', '.webp'];
    const allowedMimeTypes = type === 'detran'
      ? ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
      : ['image/jpeg', 'image/png', 'image/webp'];

    if (!isAllowedFileType(file, allowedExtensions, allowedMimeTypes)) {
      alert(type === 'detran'
        ? 'Formato de arquivo inválido. Use apenas PDF, JPG, JPEG, PNG ou WEBP.'
        : 'Formato de arquivo inválido. Use apenas JPG, JPEG, PNG ou WEBP.');
      e.target.value = '';
      if (type === 'detran') setDetranDocument(null); else setBankExitPhoto(null);
      return;
    }

    if (type === 'detran') {
      setDetranDocument(file);
    } else {
      setBankExitPhoto(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    
    setLoading(true);

    try {
      const formData = new FormData();
      
      if (notes) formData.append('observacoes', notes);

      // Validação e Anexos específicos por Categoria
      const cat = selectedVehicle.category.toLowerCase();
      
      if (cat === 'detran') {
        if (!detranDocument || !detranAuthorizer) {
          alert('Por favor, preencha o nome do responsável e anexe o ofício de liberação.');
          setLoading(false);
          return;
        }
        formData.append('autorizado_por', detranAuthorizer);
        formData.append('documento_liberacao', detranDocument);
        
      } else if (cat === 'banco') {
        if (!bankExitPhoto) {
          alert('Por favor, anexe uma foto do veículo no momento da saída.');
          setLoading(false);
          return;
        }
        formData.append('foto_saida', bankExitPhoto);
      }

      // Envia os dados para a nossa API no Django
      const response = await api.registrarSaida(selectedVehicle.id, formData);

      // Apresenta o custo final calculado pelo Backend (RF13)
      alert(`Saída registrada com sucesso!\n\nVeículo permaneceu: ${response.dias_no_patio} dias.\nCusto Total: R$ ${response.custo_total}`);
      
      await refreshVehicles(); // Atualiza a lista global de veículos
      
      // Limpar formulário
      setSelectedVehicle(null);
      setExitDateTime(getLocalDateTimeInputValue());
      setDetranAuthorizer('');
      setDetranDocument(null);
      setBankExitPhoto(null);
      setNotes('');
      
    } catch (error: any) {
      console.error("Erro ao registrar saída:", error);
      const errorMsg = error.response?.data?.erro || 'Ocorreu um erro ao registrar a saída. Tente novamente.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedVehicle ? (
        <>
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Voltar</span>
                </button>
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Registrar Saída</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {filteredVehicles.length} {filteredVehicles.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}
                  </p>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filtros</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar por placa, marca, modelo..."
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
              <div className="max-w-7xl mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterCategory('all')} className={`px-4 py-2 text-sm font-medium rounded-md ${filterCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Todos</button>
                  <button onClick={() => setFilterCategory('detran')} className={`px-4 py-2 text-sm font-medium rounded-md ${filterCategory === 'detran' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>DETRAN</button>
                  <button onClick={() => setFilterCategory('banco')} className={`px-4 py-2 text-sm font-medium rounded-md ${filterCategory === 'banco' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Banco</button>
                  <button onClick={() => setFilterCategory('particular')} className={`px-4 py-2 text-sm font-medium rounded-md ${filterCategory === 'particular' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Particular</button>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle List */}
          <div className="px-4 md:px-6 py-6">
            <div className="max-w-7xl mx-auto">
              {filteredVehicles.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
                  <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-base font-medium text-gray-900 mb-1">Nenhum veículo ativo encontrado</p>
                  <p className="text-sm text-gray-500">Apenas veículos atualmente no pátio podem ser selecionados para saída.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Placa</div>
                    <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Marca/Modelo</div>
                    <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Categoria</div>
                    <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Data Entrada</div>
                    <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Dias no Pátio</div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {filteredVehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => {
                          setExitDateTime(getLocalDateTimeInputValue());
                          setSelectedVehicle(vehicle);
                        }}
                        className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                          <div className="col-span-2 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {vehicle.plate}
                          </div>
                          <div className="col-span-3 text-sm text-gray-700">
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium uppercase ${getCategoryColor(vehicle.category)}`}>
                              {vehicle.category}
                            </span>
                          </div>
                          <div className="col-span-3 text-sm text-gray-600">
                            {formatDateTime(vehicle.entryDate)}
                          </div>
                          <div className="col-span-2 text-sm font-medium text-gray-900">
                            {vehicle.daysInYard} dias
                          </div>
                        </div>

                        <div className="md:hidden space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 group-hover:text-blue-600">{vehicle.plate}</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium uppercase ${getCategoryColor(vehicle.category)}`}>
                              {vehicle.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">{vehicle.brand} {vehicle.model}</div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateTime(vehicle.entryDate)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.daysInYard} dias no pátio
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Exit Form */
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 lg:px-6 py-6 shadow-lg">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Voltar à Lista</span>
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Registrar Saída</h1>
              <p className="text-sm lg:text-base text-blue-100 mt-2">
                Preencha os dados de saída do veículo
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedVehicle.plate}</h2>
                  <p className="text-gray-600">{selectedVehicle.brand} {selectedVehicle.model}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold uppercase ${getCategoryColor(selectedVehicle.category)}`}>
                      {selectedVehicle.category}
                    </span>
                    <span className="text-sm text-gray-600">{selectedVehicle.daysInYard} dias no pátio</span>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedVehicle(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data e horário da saída</label>
                <input type="datetime-local" value={exitDateTime} onChange={(e) => setExitDateTime(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none" disabled />
                <p className="text-xs text-gray-500 mt-1">O sistema registra automaticamente a data e o horário atuais no servidor ao confirmar.</p>
              </div>

              {selectedVehicle.category.toLowerCase() === 'detran' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Responsável pela Liberação DETRAN *</label>
                    <input type="text" value={detranAuthorizer} onChange={(e) => setDetranAuthorizer(e.target.value)} placeholder="Nome do funcionário ou autoridade" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ofício de Liberação *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,image/pdf,image/jpeg,image/png,image/webp" onChange={(e) => handleFileChange(e, 'detran')} required className="hidden" id="detran-doc" />
                      <label htmlFor="detran-doc" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">{detranDocument ? detranDocument.name : 'Clique para anexar o ofício de liberação'}</p>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {selectedVehicle.category.toLowerCase() === 'banco' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Foto do Veículo na Saída *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => handleFileChange(e, 'bank')} required className="hidden" id="bank-photo" />
                    <label htmlFor="bank-photo" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{bankExitPhoto ? bankExitPhoto.name : 'Clique para fazer upload da foto'}</p>
                    </label>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observações</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Adicione observações sobre a saída..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-4">
                <button type="button" disabled={loading} onClick={() => setSelectedVehicle(null)} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md disabled:bg-blue-400">
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Registrar Saída
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}