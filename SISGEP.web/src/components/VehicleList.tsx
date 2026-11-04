import { useState } from 'react';
import { ArrowLeft, Search, Filter, Car, Calendar, X } from 'lucide-react';
import { useVehicle } from '../contexts/VehicleContext';
import { getCalendarDateKey } from '../utils/date';
import { LoadingState } from './LoadingState';

interface VehicleListProps {
  onBack: () => void;
  onVehicleClick: (vehicleId: string) => void;
  initialFilter?: 'all' | 'detran' | 'banco' | 'particular';
}

export function VehicleList({ onBack, onVehicleClick, initialFilter = 'all' }: VehicleListProps) {
  const { vehicles, loading } = useVehicle();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'detran' | 'banco' | 'particular'>(initialFilter);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const veiculosNoPatio = vehicles.filter(v => v.status === 'Ativo');

  const filteredVehicles = veiculosNoPatio.filter((vehicle) => {
    const matchesSearch =
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.chassis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.owner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || vehicle.category === filterCategory;
    const entryDate = getCalendarDateKey(vehicle.entryDate);
    const matchesDate =
      (!startDate || entryDate >= startDate) &&
      (!endDate || entryDate <= endDate);

    return matchesSearch && matchesCategory && matchesDate;
  });

  const hasActiveFilters = filterCategory !== 'all' || startDate !== '' || endDate !== '' || searchTerm !== '';

  const clearFilters = () => {
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} às ${timeStr}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'detran':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'banco':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'particular':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case 'detran':
        return 'DETRAN';
      case 'banco':
        return 'Banco';
      case 'particular':
        return 'Particular';
      default:
        return 'Outro';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Veículos no Pátio</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading ? 'Carregando...' : `${filteredVehicles.length} ${filteredVehicles.length === 1 ? 'veículo encontrado' : 'veículos encontrados'}`}
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
              placeholder="Buscar por placa, chassi, marca, modelo ou proprietário..."
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
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterCategory('detran')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterCategory === 'detran'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                DETRAN
              </button>
              <button
                onClick={() => setFilterCategory('banco')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterCategory === 'banco'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Banco
              </button>
              <button
                onClick={() => setFilterCategory('particular')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterCategory === 'particular'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Particular
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inventory-start-date" className="mb-2 block text-sm font-medium text-gray-700">
                  Data inicial
                </label>
                <input
                  id="inventory-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="inventory-end-date" className="mb-2 block text-sm font-medium text-gray-700">
                  Data final
                </label>
                <input
                  id="inventory-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <LoadingState message="Carregando o inventário..." />
          ) : filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-900 mb-1">Nenhum veículo encontrado</p>
              <p className="text-sm text-gray-500">Tente ajustar os filtros ou a busca</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Table Header - Desktop */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Placa</div>
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Marca</div>
                <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Modelo</div>
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Categoria</div>
                <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Data Entrada</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => onVehicleClick(vehicle.id)}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left group"
                  >
                    {/* Desktop View */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-2 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {vehicle.plate}
                      </div>
                      <div className="col-span-2 text-sm text-gray-700">{vehicle.brand}</div>
                      <div className="col-span-3 text-sm text-gray-700">{vehicle.model}</div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getCategoryColor(vehicle.category)}`}>
                          {getCategoryLabel(vehicle.category)}
                        </span>
                      </div>
                      <div className="col-span-3 text-sm text-gray-600">{formatDateTime(vehicle.entryDate)}</div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-600">{vehicle.plate}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getCategoryColor(vehicle.category)}`}>
                          {getCategoryLabel(vehicle.category)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">{vehicle.brand} {vehicle.model}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(vehicle.entryDate)}
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