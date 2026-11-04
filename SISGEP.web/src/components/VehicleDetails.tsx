import { ArrowLeft, Car, Calendar, MapPin, User, FileText, Camera, Check, X, AlertTriangle, DollarSign, Building2, Phone, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, resolveMediaUrl } from '../api';
import { mapVehicleApiData, useVehicle, Vehicle } from '../contexts/VehicleContext';
import { useConfig } from '../contexts/ConfigContext';
import { calculateDetranCost } from '../utils/detranCosts';
import { LoadingState } from './LoadingState';

interface VehicleDetailsProps {
  vehicleId: string;
  onBack: () => void;
  onDelete?: () => void;
  isAdmin: boolean;
}

export function VehicleDetails({ vehicleId, onBack, onDelete, isAdmin }: VehicleDetailsProps) {
  const { vehicles, deleteVehicle } = useVehicle();
  const { detranTables } = useConfig();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [archivedVehicle, setArchivedVehicle] = useState<Vehicle | null>(null);
  const [archivedVehicleLoading, setArchivedVehicleLoading] = useState(false);
  const [archivedVehicleError, setArchivedVehicleError] = useState(false);

  const vehicle = vehicles.find(v => v.id === vehicleId) || archivedVehicle;

  const [towingFee, setTowingFee] = useState<number>(0);
  const [dailyRate, setDailyRate] = useState<number>(0);

  useEffect(() => {
    const vehicleIsAlreadyLoaded = vehicles.some((item) => item.id === vehicleId);
    if (!isAdmin || vehicleIsAlreadyLoaded) {
      setArchivedVehicle(null);
      setArchivedVehicleError(false);
      setArchivedVehicleLoading(false);
      return;
    }

    let isCurrent = true;
    setArchivedVehicle(null);
    setArchivedVehicleLoading(true);
    setArchivedVehicleError(false);

    api.getRegistroAdministrativo(vehicleId)
      .then((data) => {
        if (isCurrent) setArchivedVehicle(mapVehicleApiData(data));
      })
      .catch((error) => {
        console.error('Erro ao carregar detalhes administrativos do veículo:', error);
        if (isCurrent) setArchivedVehicleError(true);
      })
      .finally(() => {
        if (isCurrent) setArchivedVehicleLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isAdmin, vehicleId, vehicles]);

  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  useEffect(() => {
    if (vehicle) {
      const fee = (vehicle as any).guincho || (vehicle as any).guincho_negociado || 0;
      const rate = (vehicle as any).diaria || (vehicle as any).diaria_negociada || 0;
      setTowingFee(Number(fee));
      setDailyRate(Number(rate));
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4">
        {archivedVehicleLoading ? (
          <div className="w-full max-w-md">
            <LoadingState message="Carregando detalhes do veículo..." />
          </div>
        ) : (
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {archivedVehicleError ? 'Não foi possível carregar o veículo' : 'Veículo não encontrado'}
            </h2>
            {archivedVehicleError && (
              <p className="text-sm text-gray-600 mb-4">Verifique sua permissão e tente novamente.</p>
            )}
          </div>
        )}
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Voltar à Lista
        </button>
      </div>
    );
  }


  const calculateCosts = () => {
    const daysInImpound = vehicle.daysInYard || 1;

    if (vehicle.category.toLowerCase() === 'detran') {
      const detranCost = calculateDetranCost(
        vehicle.entryDate,
        vehicle.exitDate || new Date(),
        detranTables,
        vehicle.tabela,
        vehicle.tabela_info,
      );
      return {
        towingFee: detranCost.towingFee,
        dailyRate: detranCost.dailyRate,
        dailyTotal: detranCost.storageCost,
        total: detranCost.totalCost,
        daysInImpound,
        hasMultipleDailyRates: detranCost.hasMultipleDailyRates,
      };
    } else {
      const dailyTotal = daysInImpound * dailyRate;
      const total = towingFee + dailyTotal;
      return { towingFee, dailyRate, dailyTotal, total, daysInImpound, hasMultipleDailyRates: false };
    }
  };

  const costs = calculateCosts();

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteVehicle(vehicleId);
      alert('Veículo removido das consultas. O registro foi preservado no histórico.');
      onBack();
    } catch (error) {
      alert('Ocorreu um erro ao excluir o veículo. Verifique se possui permissões.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDateTime = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getCategoryColor = () => {
    switch (vehicle.category.toLowerCase()) {
      case 'detran': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'banco': return 'bg-green-50 text-green-700 border-green-200';
      case 'particular': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryLabel = () => {
    switch (vehicle.category.toLowerCase()) {
      case 'detran': return 'DETRAN';
      case 'banco': return 'Banco';
      case 'particular': return 'Particular';
      default: return 'Outro';
    }
  };

  const getSpecificData = (key: string) => (vehicle as any)[key] || '-';
  const isDeleted = vehicle.status === 'Excluído';

  const openVehicleDocument = async (tipo: 'apreensao' | 'liberacao' | 'custodia') => {
    const downloadWindow = window.open('about:blank', '_blank');
    if (downloadWindow) downloadWindow.opener = null;

    try {
      const { url } = await api.getVehicleDocumentUrl(vehicleId, tipo);
      if (downloadWindow) {
        downloadWindow.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (error) {
      downloadWindow?.close();
      console.error('Erro ao gerar link atualizado para o documento:', error);
      alert('Não foi possível abrir o documento. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <div className="flex-1 flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Detalhes do Veículo</h1>
              <span className={`px-3 py-1 rounded-md text-xs font-medium border uppercase ${getCategoryColor()}`}>
                {getCategoryLabel()}
              </span>
              <span className={`px-3 py-1 rounded-md text-xs font-medium border ${vehicle.status === 'Ativo' ? 'bg-blue-100 text-blue-800 border-blue-300' : isDeleted ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                {vehicle.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-2 space-y-6">

            {isDeleted && (
              <section
                aria-label="Informações da exclusão lógica"
                className="rounded-lg border border-amber-300 bg-amber-50 p-5"
              >
                <p className="text-sm text-amber-900">
                  Este veículo foi removido das consultas operacionais. Os dados e anexos foram preservados para auditoria.
                </p>
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-amber-800">Excluído em</dt>
                    <dd className="mt-1 text-sm font-semibold text-amber-950">{formatDateTime(vehicle.deletedAt || '')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-amber-800">Excluído por</dt>
                    <dd className="mt-1 text-sm font-semibold text-amber-950">
                      {vehicle.deletedByName || `Usuário #${vehicle.deletedBy ?? '-'}`}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

  
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Placa</dt>
                    <dd className="text-base font-semibold text-gray-900">{vehicle.plate}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Marca</dt>
                    <dd className="text-base font-semibold text-gray-900">{vehicle.brand}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Modelo</dt>
                    <dd className="text-base font-semibold text-gray-900">{vehicle.model}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cor</dt>
                    <dd className="text-base font-semibold text-gray-900">{vehicle.color}</dd>
                  </div>
                  {vehicle.chassis && (
                    <div className="md:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Chassi</dt>
                      <dd className="text-base font-semibold text-gray-900 font-mono">{vehicle.chassis}</dd>
                    </div>
                  )}
                  {vehicle.owner && (
                    <div className="md:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Proprietário</dt>
                      <dd className="text-base font-semibold text-gray-900">{vehicle.owner}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Data de Entrada</dt>
                    <dd className="text-base font-semibold text-gray-900">{formatDateTime(vehicle.entryDate)}</dd>
                  </div>
                  {vehicle.exitDate && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Data de Saída</dt>
                      <dd className="text-base font-semibold text-green-700">{formatDateTime(vehicle.exitDate)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {vehicle.category.toLowerCase() === 'detran' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Informações DETRAN</h2>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nº da Apreensão</dt>
                      <dd className="text-base font-semibold text-gray-900 font-mono">{getSpecificData('n_apreensao')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Município da Apreensão</dt>
                      <dd className="text-base font-semibold text-gray-900">{getSpecificData('municipio_info')}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Local Exato</dt>
                      <dd className="text-base font-semibold text-gray-900">{getSpecificData('local')}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Infração / Motivo da Apreensão</dt>
                      <dd className="text-base font-semibold text-gray-900">
                        {vehicle.infracao_info ? (
                          <>
                            {vehicle.infracao_info.codigo} — {vehicle.infracao_info.descricao}
                          </>
                        ) : (
                          `Infração #${getSpecificData('infracao')}`
                        )}
                      </dd>
                    </div>
                    {getSpecificData('autorizado_por') !== '-' && (
                      <div className="md:col-span-2">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Responsável pela Liberação</dt>
                        <dd className="text-base font-semibold text-gray-900">{getSpecificData('autorizado_por')}</dd>
                      </div>
                    )}
                  </dl>

                  {(getSpecificData('documento_apreensao') !== '-' ||
                    (vehicle.status === 'Liberado' && getSpecificData('documento_liberacao') !== '-')) && (
                    <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-5">
                      {getSpecificData('documento_apreensao') !== '-' && (
                        <button
                          type="button"
                          onClick={() => void openVehicleDocument('apreensao')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-100 transition-all border border-blue-200 w-full sm:w-auto justify-center shadow-sm"
                        >
                          <FileText className="w-5 h-5" />
                          Baixar Termo de Apreensão
                        </button>
                      )}
                      {vehicle.status === 'Liberado' && getSpecificData('documento_liberacao') !== '-' && (
                        <button
                          type="button"
                          onClick={() => void openVehicleDocument('liberacao')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-xl hover:bg-green-100 transition-all border border-green-200 w-full sm:w-auto justify-center shadow-sm"
                        >
                          <FileText className="w-5 h-5" />
                          Baixar Documento de Liberação
                        </button>
                      )}
                    </div>
                  )}
                  {getSpecificData('documento_apreensao') === '-' && (
                    <p className="mt-6 border-t border-gray-200 pt-5 text-sm text-gray-500">
                      Nenhum termo de apreensão foi anexado.
                    </p>
                  )}
                </div>
              </div>
            )}

            {vehicle.category.toLowerCase() === 'banco' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Informações Bancárias</h2>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Instituição Financeira</dt>
                      <dd className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {vehicle.banco_info?.nome || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">CNPJ</dt>
                      <dd className="text-base font-semibold text-gray-900">{vehicle.banco_info?.cnpj || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Telefone</dt>
                      <dd className="text-base font-semibold text-gray-900">{vehicle.banco_info?.telefone || '-'}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">E-mail</dt>
                      <dd className="text-base font-semibold text-gray-900">{vehicle.banco_info?.email || '-'}</dd>
                    </div>
                  </dl>
                  {getSpecificData('documento_custodia') !== '-' ? (
                    <div className="mt-6 border-t border-gray-200 pt-5">
                      <button
                        type="button"
                        onClick={() => void openVehicleDocument('custodia')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-2.5 text-sm font-bold text-green-700 shadow-sm transition-all hover:bg-green-100 sm:w-auto"
                      >
                        <FileText className="h-5 w-5" />
                        Baixar Mandado de Busca/Custódia
                      </button>
                    </div>
                  ) : (
                    <p className="mt-6 border-t border-gray-200 pt-5 text-sm text-gray-500">
                      Nenhum mandado de busca/custódia foi anexado.
                    </p>
                  )}
                  {vehicle.foto_saida && (
                    <div className="mt-6 border-t border-gray-200 pt-5">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Foto do Veículo na Saída</p>
                      <a
                        href={resolveMediaUrl(vehicle.foto_saida)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={resolveMediaUrl(vehicle.foto_saida)}
                          alt={`Foto de saída do veículo ${vehicle.plate}`}
                          className="max-h-64 rounded-lg border border-gray-200 object-contain"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {vehicle.category.toLowerCase() === 'particular' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Informações do Cliente</h2>
                </div>
                <div className="p-6">
                  {vehicle.cliente_info ? (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nome</dt>
                        <dd className="text-base font-semibold text-gray-900">{vehicle.cliente_info.nome}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">CPF</dt>
                        <dd className="text-base font-semibold text-gray-900">{vehicle.cliente_info.cpf || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Telefone</dt>
                        <dd className="text-base font-semibold text-gray-900">{vehicle.cliente_info.telefone || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">E-mail</dt>
                        <dd className="text-base font-semibold text-gray-900">{vehicle.cliente_info.email || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Endereço</dt>
                        <dd className="text-base font-semibold text-gray-900">{vehicle.cliente_info.endereco || '-'}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-gray-500">Não há dados do cliente neste registro.</p>
                  )}
                </div>
              </div>
            )}

            {/* Damage Observations */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Observações de Avarias</h2>
              </div>
              <div className="p-6">
                {vehicle.notes ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{vehicle.notes}</p>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma observação registrada.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Fotos de Vistoria</h2>
              </div>
              <div className="p-6">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vehicle.photos.map((photo, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        aria-label={`Ampliar foto da vistoria ${index + 1}`}
                        className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img
                          src={photo}
                          alt={`Foto da vistoria ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Sem registros fotográficos.</p>
                  </div>
                )}
              </div>
            </div>

            {/* UC09 - Zona Perigosa (Excluir Veículo) - Movido para a coluna principal */}
            {!isDeleted && isAdmin && (
            <div className="pt-2 pb-8">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white text-base font-bold rounded-xl hover:bg-red-700 active:bg-red-800 transition-all shadow-md border-2 border-red-700"
              >
                <Trash2 className="w-5 h-5" />
                Excluir do Sistema
              </button>
            </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Financial Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-24">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50/50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Resumo Financeiro
                </h2>
              </div>
              <div className="p-6 space-y-4">
                
                {/* Days in impound */}
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Dias no Pátio</p>
                  <p className="text-3xl font-bold text-gray-900">{costs.daysInImpound}</p>
                </div>

                {/* Fees */}
                {vehicle.category.toLowerCase() === 'detran' ? (
                  <>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Taxa de Guincho</p>
                      <p className="text-sm text-gray-600">Tabela DETRAN-SP</p>
                      <p className="text-lg font-semibold text-gray-900">R$ {costs.towingFee.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Taxa Diária</p>
                      <p className="text-sm text-gray-600">Tabela DETRAN-SP</p>
                      <p className="text-lg font-semibold text-gray-900">R$ {costs.dailyRate.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Diárias</p>
                      <p className="text-sm text-gray-600">
                        {costs.hasMultipleDailyRates
                          ? 'Aplicação da tabela vigente em cada dia'
                          : `${costs.daysInImpound} × R$ ${costs.dailyRate.toFixed(2)}`}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">R$ {costs.dailyTotal.toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Taxa de Guincho Aplicada</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={towingFee}
                          onChange={(e) => setTowingFee(parseFloat(e.target.value) || 0)}
                          disabled={vehicle.status !== 'Ativo'}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Taxa Diária Aplicada</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={dailyRate}
                          onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                          disabled={vehicle.status !== 'Ativo'}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Diárias Acumuladas</p>
                      <p className="text-sm text-gray-600">{costs.daysInImpound} × R$ {costs.dailyRate.toFixed(2)}</p>
                      <p className="text-lg font-semibold text-gray-900">R$ {costs.dailyTotal.toFixed(2)}</p>
                    </div>
                  </>
                )}

                {/* Total */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {vehicle.status === 'Liberado' ? 'Total Faturado' : 'Total a Pagar (Até o momento)'}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">R$ {costs.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto da vistoria ampliada"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Fechar foto ampliada"
            onClick={() => setSelectedPhoto(null)}
            className="absolute inset-0 bg-black/80"
          />
          <div className="relative z-10 flex max-h-full max-w-full flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Fechar foto ampliada"
              className="mb-3 self-end rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Foto da vistoria ampliada"
              className="max-h-[85vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && isAdmin && !isDeleted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-red-500">
            <div className="px-6 py-6 border-b border-gray-200 bg-red-50">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Confirmar Exclusão</h3>
            </div>
            
            <div className="px-6 py-6">
              <p className="text-base text-gray-700 mb-4 text-center">
                Você está prestes a excluir a placa <strong className="text-gray-900">{vehicle.plate}</strong>.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">Esta ação irá:</p>
                <ul className="text-sm text-red-700 space-y-2 list-disc list-inside">
                  <li>Remover o veículo das consultas, inventário e relatórios</li>
                  <li>Preservar o registro e os anexos no histórico do sistema</li>
                  <li>Registrar a data e o administrador responsável pela exclusão</li>
                </ul>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}