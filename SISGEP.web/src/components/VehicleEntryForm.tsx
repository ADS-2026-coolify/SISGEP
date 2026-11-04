import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Camera, Check, Loader2, Plus, X, User, IdCard, Phone, Mail, MapPin, FileText, Building2, DollarSign, AlertTriangle } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { useVehicle } from '../contexts/VehicleContext';
import { api } from '../api';

interface VehicleEntryFormProps {
  onBack: () => void;
  usuario?: { tipo_usuario: 'ADMINISTRADOR' | 'OPERADOR' } | null;
}

const MINIMUM_PHOTO_COUNT = 4;
export function VehicleEntryForm({ onBack, usuario }: VehicleEntryFormProps) {
  const isAdministrador = usuario?.tipo_usuario === 'ADMINISTRADOR';
  const { clients, infractions, banks, addClient, addBank, addInfraction } = useConfig();
  const { refreshVehicles } = useVehicle();
  
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<'detran' | 'banco' | 'particular' | ''>('');
  
  const [cidadesSP, setCidadesSP] = useState<{ id: number; nome: string }[]>([]);
  
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState(''); 
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [chassis, setChassis] = useState('');
  const [owner, setOwner] = useState('');
  const [damageObservations, setDamageObservations] = useState('');
  
  const [photosFiles, setPhotosFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoPreviews = useMemo(
    () => photosFiles.map((file) => URL.createObjectURL(file)),
    [photosFiles],
  );

  useEffect(() => {
    return () => photoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [photoPreviews]);
  
  const [seizureNumber, setSeizureNumber] = useState('');
  const [seizureLocation, setSeizureLocation] = useState(''); 
  const [selectedInfractionId, setSelectedInfractionId] = useState('');
  const [seizureDocument, setSeizureDocument] = useState<File | null>(null);
  
  const [selectedBankId, setSelectedBankId] = useState('');
  const [custodyDocument, setCustodyDocument] = useState<File | null>(null);
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [towingFeeParticular, setTowingFeeParticular] = useState('');
  const [dailyRateParticular, setDailyRateParticular] = useState('');

  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCpf, setNewClientCpf] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [showAddInfractionModal, setShowAddInfractionModal] = useState(false);
  const [isSubmittingInfraction, setIsSubmittingInfraction] = useState(false);
  const [newInfractionCode, setNewInfractionCode] = useState('');
  const [newInfractionDescription, setNewInfractionDescription] = useState('');

  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankCnpj, setNewBankCnpj] = useState('');
  const [newBankPhone, setNewBankPhone] = useState('');
  const [newBankEmail, setNewBankEmail] = useState('');
  const [newBankTowingFee, setNewBankTowingFee] = useState('');
  const [newBankDailyRate, setNewBankDailyRate] = useState('');

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios')
      .then(response => response.json())
      .then(data => {
        const cidadesOrdenadas = data.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
        setCidadesSP(cidadesOrdenadas);
      })
      .catch(error => console.error("Erro ao buscar cidades do IBGE:", error));
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClient(true);
    try {
      await addClient({
        id: '', 
        name: newClientName,
        cpf: newClientCpf,
        phone: newClientPhone,
        email: newClientEmail,
        address: newClientAddress,
      });
      setShowAddClientModal(false);
      setNewClientName(''); setNewClientCpf(''); setNewClientPhone(''); setNewClientEmail(''); setNewClientAddress('');
      alert('Cliente cadastrado com sucesso!');
    } catch (error) {
      alert('Ocorreu um erro ao cadastrar o cliente.');
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handleCreateInfraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingInfraction(true);
    try {
      await addInfraction({
        id: '',
        code: newInfractionCode,
        description: newInfractionDescription,
      });
      setShowAddInfractionModal(false);
      setNewInfractionCode(''); setNewInfractionDescription('');
      alert('Infração cadastrada com sucesso!');
    } catch (error) {
      alert('Ocorreu um erro ao cadastrar a infração.');
    } finally {
      setIsSubmittingInfraction(false);
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBank(true);
    try {
      await addBank({
        id: '',
        name: newBankName,
        cnpj: newBankCnpj,
        phone: newBankPhone,
        email: newBankEmail,
        towingFee: newBankTowingFee,
        dailyRate: newBankDailyRate,
      });
      setShowAddBankModal(false);
      setNewBankName(''); setNewBankCnpj(''); setNewBankPhone(''); setNewBankEmail(''); setNewBankTowingFee(''); setNewBankDailyRate('');
      alert('Instituição financeira cadastrada com sucesso!');
    } catch (error) {
      alert('Ocorreu um erro ao cadastrar o banco.');
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const isAllowedFileType = (file: File, allowedExtensions: string[], allowedMimeTypes: string[]) => {
    const name = file.name.toLowerCase();
    const extension = name.includes('.') ? `.${name.split('.').pop()}` : '';
    const mimeType = file.type.toLowerCase();

    return allowedExtensions.includes(extension) || allowedMimeTypes.includes(mimeType);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.some((file) => !isAllowedFileType(file, ['.jpg', '.jpeg', '.png', '.webp'], ['image/jpeg', 'image/png', 'image/webp']))) {
      alert('Formato de arquivo inválido. Use apenas JPG, JPEG, PNG ou WEBP para fotos.');
      e.target.value = '';
      return;
    }

    setPhotosFiles((previous) => [...previous, ...files]);
    e.target.value = '';
  };

  const validateDocumentInput = (file: File | null, fieldName: string) => {
    if (!file) return true;

    const isValid = isAllowedFileType(file, ['.pdf', '.jpg', '.jpeg', '.png', '.webp'], ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
    if (!isValid) {
      alert(`Formato de arquivo inválido para ${fieldName}. Use apenas PDF, JPG, JPEG, PNG ou WEBP.`);
      return false;
    }

    return true;
  };

  const selectedPhotos = photosFiles;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPhotos.length < MINIMUM_PHOTO_COUNT) {
      alert(`Para cadastrar o veículo, anexe pelo menos ${MINIMUM_PHOTO_COUNT} fotos.`);
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      
      formData.append('categoria', category);
      formData.append('placa', plate);
      formData.append('marca', brand);
      formData.append('modelo', model);
      formData.append('cor', color);
      formData.append('data_entrada', dateTime);
      
      if (chassis) formData.append('chassi', chassis);
      if (owner) formData.append('proprietario', owner);
      if (damageObservations) formData.append('observacoes', damageObservations);
      
      if (category === 'detran') {
        formData.append('n_apreensao', seizureNumber);
        formData.append('local', seizureLocation); 
        if (municipality) formData.append('municipio_nome', municipality); 
        if (selectedInfractionId) formData.append('infracao_id', selectedInfractionId);
        if (seizureDocument) {
          if (!validateDocumentInput(seizureDocument, 'o termo de apreensão')) {
            setLoading(false);
            return;
          }
          formData.append('documento_apreensao', seizureDocument);
        }
        
      } else if (category === 'banco') {
        if (selectedBankId) formData.append('banco_id', selectedBankId);
        const bank = banks.find(b => String(b.id) === String(selectedBankId));
        if (bank) {
          formData.append('guincho_negociado', String(bank.towingFee));
          formData.append('diaria_negociada', String(bank.dailyRate));
        }
        if (custodyDocument) {
          if (!validateDocumentInput(custodyDocument, 'o mandado de busca/custódia')) {
            setLoading(false);
            return;
          }
          formData.append('documento_custodia', custodyDocument);
        }
        
      } else if (category === 'particular') {
        if (selectedClientId) formData.append('cliente_id', selectedClientId);
        formData.append('guincho', towingFeeParticular);
        formData.append('diaria', dailyRateParticular);
      }

      selectedPhotos.forEach((file) => {
        formData.append('fotos', file);
      });

      await api.registrarEntrada(formData);
      
      alert('Entrada registrada com sucesso!');
      await refreshVehicles(); 
      onBack();
      
    } catch (error: any) {
      console.error("Erro ao registrar entrada:", error);
      let errorMsg = 'Ocorreu um erro ao registrar a entrada do veículo.';
      if (error.response?.data) {
        if (error.response.data.erro) {
            errorMsg = error.response.data.erro;
        } else {
            errorMsg = "Verifique os campos obrigatórios.";
        }
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 pb-12 relative">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack} disabled={loading} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Nova Entrada</h1>
              <p className="text-sm text-gray-500 mt-0.5">Registro de Veículo no Pátio</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 sm:px-6 mt-6 space-y-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <label className="block text-base font-bold text-gray-900 mb-4">
            Selecione a Categoria do Veículo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              type="button" 
              onClick={() => setCategory('detran')} 
              className={`py-3 px-4 text-sm font-bold rounded-lg border transition-all ${category === 'detran' ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              DETRAN
            </button>
            <button 
              type="button" 
              onClick={() => setCategory('banco')} 
              className={`py-3 px-4 text-sm font-bold rounded-lg border transition-all ${category === 'banco' ? 'bg-green-50 border-green-600 text-green-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'}`}
            >
              BANCO
            </button>
            <button 
              type="button" 
              onClick={() => setCategory('particular')} 
              className={`py-3 px-4 text-sm font-bold rounded-lg border transition-all ${category === 'particular' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'}`}
            >
              PARTICULAR
            </button>
          </div>
        </div>

        {category && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">Dados do Veículo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Placa *</label>
                  <input type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} className={inputClass} placeholder="ABC-1234" maxLength={8} required />
                </div>
                <div>
                  <label className={labelClass}>Marca *</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} placeholder="Ex: Honda" required />
                </div>
                <div>
                  <label className={labelClass}>Modelo *</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} placeholder="Ex: Civic" required />
                </div>
                <div>
                  <label className={labelClass}>Cor *</label>
                  <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} placeholder="Ex: Prata" required />
                </div>
                <div>
                  <label className={labelClass}>Chassi</label>
                  <input type="text" value={chassis} onChange={(e) => setChassis(e.target.value.toUpperCase())} className={inputClass} placeholder="17 caracteres" maxLength={17} />
                </div>
                <div>
                  <label className={labelClass}>Proprietário</label>
                  <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} placeholder="Nome no documento" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Observações sobre Avarias</label>
                  <textarea value={damageObservations} onChange={(e) => setDamageObservations(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Descreva arranhões, amassados, itens faltando..." />
                </div>
              </div>
            </div>

            {category === 'detran' && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-blue-800 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Dados da Apreensão DETRAN
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Nº da Apreensão *</label>
                    <input type="text" value={seizureNumber} onChange={(e) => setSeizureNumber(e.target.value)} className={inputClass} required placeholder="Ex: TRZ12345" />
                  </div>
                  <div>
                    <label className={labelClass}>Município da Apreensão *</label>
                    <select value={municipality} onChange={(e) => setMunicipality(e.target.value)} className={inputClass} required>
                      <option value="" disabled>Selecione a Cidade</option>
                      {cidadesSP.map(cidade => (
                        <option key={cidade.id} value={cidade.nome}>{cidade.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Local Exato (Endereço) *</label>
                    <input type="text" value={seizureLocation} onChange={(e) => setSeizureLocation(e.target.value)} className={inputClass} placeholder="Ex: Av. Principal, 123 - Centro" required />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Infração *</label>
                    <div className="flex gap-2">
                      <select value={selectedInfractionId} onChange={(e) => setSelectedInfractionId(e.target.value)} className={inputClass} required>
                        <option value="">Selecione a Infração cometida</option>
                        {infractions.map(infraction => (
                          <option key={infraction.id} value={infraction.id}>{infraction.code} - {infraction.description}</option>
                        ))}
                      </select>
                      {isAdministrador && (
                        <button type="button" onClick={() => setShowAddInfractionModal(true)} className="px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300" title="Cadastrar Nova Infração">
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Data e Hora de Entrada *</label>
                    <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Documento (Termo de Apreensão) *</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      if (file && !validateDocumentInput(file, 'o termo de apreensão')) {
                        e.target.value = '';
                        setSeizureDocument(null);
                        return;
                      }
                      setSeizureDocument(file);
                    }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg" required />
                  </div>
                </div>
              </div>
            )}

            {category === 'banco' && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-green-800 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Dados Bancários
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Instituição Financeira *</label>
                    <div className="flex gap-2">
                      <select value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} className={inputClass} required>
                        <option value="">Selecione o Banco</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.name}</option>
                        ))}
                      </select>
                      {isAdministrador && (
                        <button type="button" onClick={() => setShowAddBankModal(true)} className="px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300" title="Cadastrar Novo Banco">
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Data e Hora de Entrada *</label>
                    <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Mandado de Busca/Custódia *</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      if (file && !validateDocumentInput(file, 'o mandado de busca/custódia')) {
                        e.target.value = '';
                        setCustodyDocument(null);
                        return;
                      }
                      setCustodyDocument(file);
                    }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer border border-gray-300 rounded-lg" required />
                  </div>
                </div>
              </div>
            )}

            {category === 'particular' && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-amber-800 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                  <User className="w-5 h-5" /> Dados do Particular
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Cliente Pagador *</label>
                    <div className="flex gap-2">
                      <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className={inputClass} required>
                        <option value="">Selecione o Cliente</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name} - {client.cpf}</option>
                        ))}
                      </select>
                      {isAdministrador && (
                        <button type="button" onClick={() => setShowAddClientModal(true)} className="px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300" title="Cadastrar Novo Cliente">
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Valor do Guincho Acordado (R$) *</label>
                    <input type="number" step="0.01" value={towingFeeParticular} onChange={(e) => setTowingFeeParticular(e.target.value)} className={inputClass} required placeholder="0.00" />
                  </div>
                  <div>
                    <label className={labelClass}>Valor da Diária Acordada (R$) *</label>
                    <input type="number" step="0.01" value={dailyRateParticular} onChange={(e) => setDailyRateParticular(e.target.value)} className={inputClass} required placeholder="0.00" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Data e Hora de Entrada *</label>
                    <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className={inputClass} required />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-500" /> Vistoria Fotográfica
                </h2>
                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500" aria-live="polite">
                  {selectedPhotos.length} {selectedPhotos.length === 1 ? 'foto' : 'fotos'}
                </span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Anexar fotos da vistoria"
                  disabled={loading}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-center text-[10px] font-medium">Anexar Foto</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  aria-label="Selecionar fotos para anexar"
                  multiple
                  className="hidden"
                />
                {selectedPhotos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={`${selectedPhotos[index].name}-${index}`} className="relative">
                        <img
                          src={preview}
                          alt={`Prévia da foto da vistoria ${index + 1}`}
                          className="aspect-video w-full rounded-lg border border-gray-200 bg-gray-100 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotosFiles((previous) => previous.filter((_, photoIndex) => photoIndex !== index))}
                          aria-label={`Remover foto da vistoria ${index + 1}`}
                          disabled={loading}
                          className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-gray-700 shadow hover:bg-white disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="mt-1 truncate text-xs text-gray-500">{selectedPhotos[index].name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || selectedPhotos.length < MINIMUM_PHOTO_COUNT}
                className="w-full bg-blue-600 text-white py-4 text-base font-bold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" strokeWidth={3} />
                    FINALIZAR REGISTRO DE ENTRADA
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-amber-600"/> Novo Cliente Rápido</h2>
              <button type="button" onClick={() => setShowAddClientModal(false)} className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className={labelClass}>Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className={`${inputClass} pl-10`} required placeholder="Ex: João da Silva" />
                </div>
              </div>
              <div>
                <label className={labelClass}>CPF/CNPJ *</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={newClientCpf} onChange={(e) => setNewClientCpf(e.target.value)} className={`${inputClass} pl-10`} required placeholder="Ex: 000.000.000-00" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Telefone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className={`${inputClass} pl-10`} required placeholder="(11) 98765-4321" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>E-mail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className={`${inputClass} pl-10`} required placeholder="email@exemplo.com" />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Endereço Completo *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} className={`${inputClass} pl-10 resize-none`} required rows={2} placeholder="Rua, número, bairro, cidade, estado" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmittingClient} className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400">
                  {isSubmittingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
                  <span>Salvar Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddInfractionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-blue-600"/> Nova Infração Rápida</h2>
              <button type="button" onClick={() => setShowAddInfractionModal(false)} className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInfraction} className="space-y-4">
              <div>
                <label className={labelClass}>Código/Artigo *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={newInfractionCode} onChange={(e) => setNewInfractionCode(e.target.value)} className={`${inputClass} pl-10`} required placeholder="Ex: ART168-CTB" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Descrição *</label>
                <textarea value={newInfractionDescription} onChange={(e) => setNewInfractionDescription(e.target.value)} className={`${inputClass} resize-none`} required rows={3} placeholder="Ex: Estacionar em local proibido pela sinalização" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddInfractionModal(false)} className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmittingInfraction} className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400">
                  {isSubmittingInfraction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
                  <span>Salvar Infração</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddBankModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-green-600"/> Novo Banco Rápido</h2>
              <button type="button" onClick={() => setShowAddBankModal(false)} className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className={labelClass}>Nome da Instituição *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={newBankName} onChange={(e) => setNewBankName(e.target.value)} className={`${inputClass} pl-10`} required placeholder="Ex: Banco do Brasil" />
                </div>
              </div>
              <div>
                <label className={labelClass}>CNPJ *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={newBankCnpj} onChange={(e) => setNewBankCnpj(e.target.value)} className={`${inputClass} pl-10`} required placeholder="Ex: 00.000.000/0001-00" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Telefone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={newBankPhone} onChange={(e) => setNewBankPhone(e.target.value)} className={`${inputClass} pl-10`} required placeholder="(11) 3000-0000" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>E-mail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={newBankEmail} onChange={(e) => setNewBankEmail(e.target.value)} className={`${inputClass} pl-10`} required placeholder="contato@banco.com.br" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Valores de Taxas Padrão (Negociadas)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Taxa de Guincho (R$) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" step="0.01" value={newBankTowingFee} onChange={(e) => setNewBankTowingFee(e.target.value)} className={`${inputClass} pl-10`} required placeholder="350.00" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Taxa Diária (R$) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" step="0.01" value={newBankDailyRate} onChange={(e) => setNewBankDailyRate(e.target.value)} className={`${inputClass} pl-10`} required placeholder="50.00" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddBankModal(false)} className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmittingBank} className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400">
                  {isSubmittingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
                  <span>Salvar Instituição</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}