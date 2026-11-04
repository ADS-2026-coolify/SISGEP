import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Filter, Car, Calendar, FileSpreadsheet, X, User } from 'lucide-react';
import { api } from '../api';
import { LoadingState } from './LoadingState';
import { mapVehicleApiData, useVehicle, Vehicle } from '../contexts/VehicleContext';
import { downloadExcel, getLocalDateStamp } from '../utils/exportExcel';
import { getCalendarDateKey } from '../utils/date';

interface AllRecordsProps {
  onBack: () => void;
  onVehicleClick: (vehicleId: string) => void;
  isAdmin: boolean;
}

export function AllRecords({ onBack, onVehicleClick, isAdmin }: AllRecordsProps) {
  const { vehicles, loading } = useVehicle();
  const [administrativeRecords, setAdministrativeRecords] = useState<Vehicle[] | null>(null);
  const [administrativeLoading, setAdministrativeLoading] = useState(false);
  const [administrativeError, setAdministrativeError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'released' | 'deleted'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'detran' | 'banco' | 'particular'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    let isCurrent = true;
    setAdministrativeLoading(true);
    setAdministrativeError(false);

    api.getRegistrosAdministrativos()
      .then((data) => {
        if (isCurrent) {
          setAdministrativeRecords(data.map(mapVehicleApiData));
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar registros administrativos:', error);
        if (isCurrent) setAdministrativeError(true);
      })
      .finally(() => {
        if (isCurrent) setAdministrativeLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isAdmin]);

  const records = isAdmin ? administrativeRecords ?? [] : vehicles;
  const isLoading = isAdmin ? administrativeLoading : loading;

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.chassis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.owner?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && record.status === 'Ativo') ||
      (filterStatus === 'released' && record.status === 'Liberado') ||
      (filterStatus === 'deleted' && record.status === 'Excluído');

    const matchesCategory =
      filterCategory === 'all' ||
      record.category.toLowerCase() === filterCategory;

    const entryDate = getCalendarDateKey(record.entryDate);
    const matchesDate =
      (!filterDateFrom || entryDate >= filterDateFrom) &&
      (!filterDateTo || entryDate <= filterDateTo);

    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} às ${timeStr}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'detran': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'banco': return 'bg-green-50 text-green-700 border border-green-200';
      case 'particular': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Excluído') {
      return 'bg-red-100 text-red-800 border border-red-300';
    }

    return status === 'Ativo' 
      ? 'bg-blue-100 text-blue-800 border border-blue-300'
      : 'bg-green-100 text-green-800 border border-green-300';
  };

  const activeCount = records.filter((r) => r.status === 'Ativo').length;
  const releasedCount = records.filter((r) => r.status === 'Liberado').length;
  const deletedCount = records.filter((r) => r.status === 'Excluído').length;

  const handleExportRecords = async () => {
    try {
      const rows = filteredRecords.map((record) => ({
        plate: record.plate,
        brand: record.brand,
        model: record.model,
        category: record.category.toUpperCase(),
        status: record.status,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        owner: record.owner || 'Não identificado',
        entryDate: new Date(record.entryDate),
        exitDate: record.exitDate ? new Date(record.exitDate) : null,
        daysInYard: record.daysInYard,
      }));

      await downloadExcel({
        filename: `registros_sisgep_${getLocalDateStamp()}.xlsx`,
        title: 'Registro de Veículos',
        subtitle: `${filteredRecords.length} registros • resultado da busca e dos filtros atuais`,
        worksheetName: 'Veículos',
        summary: [
          { label: 'Registros no relatório', value: filteredRecords.length, numberFormat: '#,##0' },
          {
            label: 'No pátio',
            value: filteredRecords.filter((record) => record.status === 'Ativo').length,
            numberFormat: '#,##0',
          },
          {
            label: 'Liberados',
            value: filteredRecords.filter((record) => record.status === 'Liberado').length,
            numberFormat: '#,##0',
          },
        ],
        columns: [
          { key: 'plate', header: 'Placa', width: 14 },
          { key: 'brand', header: 'Marca', width: 20 },
          { key: 'model', header: 'Modelo', width: 28 },
          { key: 'category', header: 'Categoria', width: 16 },
          { key: 'status', header: 'Status', width: 16 },
          { key: 'deletedAt', header: 'Data da exclusão', width: 21, numberFormat: 'dd/mm/yyyy hh:mm' },
          { key: 'owner', header: 'Proprietário', width: 32 },
          { key: 'entryDate', header: 'Data de entrada', width: 21, numberFormat: 'dd/mm/yyyy hh:mm' },
          { key: 'exitDate', header: 'Data de saída', width: 21, numberFormat: 'dd/mm/yyyy hh:mm' },
          { key: 'daysInYard', header: 'Dias no pátio', width: 16, numberFormat: '0' },
        ],
        rows,
      });
    } catch (error) {
      console.error('Erro ao exportar registros:', error);
      alert('Não foi possível gerar a planilha de registros. Tente novamente.');
    }
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus !== 'all' || filterCategory !== 'all' || filterDateFrom !== '' || filterDateTo !== '' || searchTerm !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Todos os Registros</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isLoading ? 'Carregando...' : `${filteredRecords.length} registros encontrados`}
              </p>
            </div>
            <button
              onClick={handleExportRecords}
              disabled={filteredRecords.length === 0 || loading}
              aria-label={`Exportar ${filteredRecords.length} registros visíveis para Excel`}
              title="Exportar os registros que correspondem à busca e aos filtros"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
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
              placeholder="Pesquisar por placa, chassi, marca, modelo ou proprietário..."
            />
          </div>
        </div>
      </div>

      {/* Filters Area */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {/* Controles de Status e Categoria */}
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 text-sm font-medium rounded-md ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Todos</button>
              <button onClick={() => setFilterStatus('active')} className={`px-4 py-2 text-sm font-medium rounded-md ${filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Ativos ({activeCount})</button>
              <button onClick={() => setFilterStatus('released')} className={`px-4 py-2 text-sm font-medium rounded-md ${filterStatus === 'released' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Liberados ({releasedCount})</button>
              {isAdmin && (
                <button onClick={() => setFilterStatus('deleted')} className={`px-4 py-2 text-sm font-medium rounded-md ${filterStatus === 'deleted' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Excluídos ({deletedCount})</button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="records-category-filter" className="mb-2 block text-sm font-medium text-gray-700">
                  Categoria
                </label>
                <select
                  id="records-category-filter"
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value as typeof filterCategory)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as categorias</option>
                  <option value="detran">DETRAN</option>
                  <option value="banco">Banco</option>
                  <option value="particular">Particular</option>
                </select>
              </div>
              <div>
                <label htmlFor="records-start-date" className="mb-2 block text-sm font-medium text-gray-700">
                  Data inicial
                </label>
                <input
                  id="records-start-date"
                  type="date"
                  value={filterDateFrom}
                  onChange={(event) => setFilterDateFrom(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="records-end-date" className="mb-2 block text-sm font-medium text-gray-700">
                  Data final
                </label>
                <input
                  id="records-end-date"
                  type="date"
                  value={filterDateTo}
                  onChange={(event) => setFilterDateTo(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all">
                  <X className="w-4 h-4" strokeWidth={2.5} />
                  <span>Limpar Filtros</span>
                </button>
            )}
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <LoadingState message="Carregando registros..." />
          ) : administrativeError ? (
            <div role="alert" className="bg-white rounded-lg p-12 text-center border border-red-200">
              <p className="text-base font-medium text-red-700 mb-1">Não foi possível carregar os registros administrativos.</p>
              <p className="text-sm text-gray-600">Atualize a tela e tente novamente.</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-900 mb-1">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Table Rows */}
              <div className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => onVehicleClick(record.id)}
                    className={`w-full px-6 py-4 text-left group transition-colors ${record.status === 'Excluído' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                  >
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                      <div className={`col-span-2 font-semibold ${record.status === 'Excluído' ? 'text-red-800 group-hover:text-red-900' : 'text-gray-900 group-hover:text-blue-600'}`}>{record.plate}</div>
                      <div className="col-span-2 text-sm text-gray-700">{record.brand} {record.model}</div>
                      <div className="col-span-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium uppercase ${getCategoryColor(record.category)}`}>
                          {record.category}
                        </span>
                        {record.owner && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{record.owner}</span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-600">{formatDateTime(record.entryDate)}</div>
                      <div className="col-span-2 text-sm text-gray-600">
                        {record.exitDate ? (
                          <div>
                            <div className="font-medium">{formatDateTime(record.exitDate)}</div>
                            <div className="text-xs text-gray-500">{record.daysInYard} dias</div>
                          </div>
                        ) : (
                          <div className="font-medium">{record.daysInYard} dias no pátio</div>
                        )}
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${record.status === 'Excluído' ? 'text-red-800 group-hover:text-red-900' : 'text-gray-900 group-hover:text-blue-600'}`}>{record.plate}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">{record.brand} {record.model}</div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium uppercase ${getCategoryColor(record.category)}`}>
                          {record.category}
                        </span>
                        {record.owner && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            <span className="truncate">{record.owner}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(record.entryDate)}
                        {record.exitDate ? ` • saída em ${formatDateTime(record.exitDate)}` : ` • ${record.daysInYard} dias no pátio`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}