import { ArrowLeft, DollarSign, Calendar, Filter, CheckCircle, Clock, TrendingUp, Download, Search } from 'lucide-react';
import { useState } from 'react';
import { useVehicle } from '../contexts/VehicleContext';
import { useConfig } from '../contexts/ConfigContext';
import { downloadExcel, getLocalDateStamp } from '../utils/exportExcel';
import { getInclusiveCalendarDays } from '../utils/date';
import { calculateDetranCost } from '../utils/detranCosts';

interface FinancialReportProps {
  onBack: () => void;
}

export function FinancialReport({ onBack }: FinancialReportProps) {
  const { vehicles } = useVehicle();
  const { detranTables } = useConfig();
  
  const [filterCategory, setFilterCategory] = useState<'all' | 'detran' | 'banco' | 'particular'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'patio' | 'released'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calcula os custos de um veículo
  const calculateVehicleCost = (vehicle: any) => {
    const endDate = vehicle.exitDate ? new Date(vehicle.exitDate) : new Date();
    const daysStored = getInclusiveCalendarDays(vehicle.entryDate, endDate);
    
    let towingFee = 0;
    let dailyRate = 0;
    let storageCost = 0;
    
    const category = vehicle.category?.toLowerCase() || '';

    if (category === 'detran') {
      const detranCost = calculateDetranCost(
        vehicle.entryDate,
        endDate,
        detranTables,
        vehicle.tabela,
        vehicle.tabela_info,
      );
      towingFee = detranCost.towingFee;
      dailyRate = detranCost.dailyRate;
      storageCost = detranCost.storageCost;
    } else {
      towingFee = Number(vehicle.guincho || vehicle.guincho_negociado || 0);
      dailyRate = Number(vehicle.diaria || vehicle.diaria_negociada || 0);
      storageCost = dailyRate * daysStored;
    }
    
    const totalCost = towingFee + storageCost;
    
    return {
      towingFee,
      dailyRate,
      daysStored,
      storageCost,
      totalCost
    };
  };

  // Filtra veículos
  const filteredVehicles = vehicles.filter(vehicle => {
    if (filterCategory !== 'all' && vehicle.category?.toLowerCase() !== filterCategory) return false;
    if (filterStatus === 'patio' && vehicle.exitDate) return false;
    if (filterStatus === 'released' && !vehicle.exitDate) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matches = 
        vehicle.plate?.toLowerCase().includes(search) ||
        vehicle.chassis?.toLowerCase().includes(search) ||
        vehicle.model?.toLowerCase().includes(search) ||
        vehicle.owner?.toLowerCase().includes(search);
      if (!matches) return false;
    }
    
    if (startDate) {
      const vehicleDate = new Date(vehicle.entryDate);
      const filterDate = new Date(startDate);
      if (vehicleDate < filterDate) return false;
    }
    
    if (endDate) {
      const vehicleDate = new Date(vehicle.entryDate);
      const filterDate = new Date(endDate);
      filterDate.setHours(23, 59, 59);
      if (vehicleDate > filterDate) return false;
    }
    
    return true;
  });

  // Calcula totais
  const totals = filteredVehicles.reduce((acc, vehicle) => {
    const cost = calculateVehicleCost(vehicle);
    acc.totalValue += cost.totalCost;
    
    if (vehicle.exitDate) {
      acc.releasedValue += cost.totalCost;
      acc.releasedCount += 1;
    } else {
      acc.inYardValue += cost.totalCost;
      acc.inYardCount += 1;
    }
    
    return acc;
  }, {
    totalValue: 0,
    releasedValue: 0,
    releasedCount: 0,
    inYardValue: 0,
    inYardCount: 0
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleExport = async () => {
    try {
      const rows = filteredVehicles.map((vehicle) => {
        const cost = calculateVehicleCost(vehicle);
        return {
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          owner: vehicle.owner || 'Não identificado',
          category: vehicle.category,
          status: vehicle.exitDate ? 'Liberado' : 'No pátio',
          entryDate: new Date(vehicle.entryDate),
          exitDate: vehicle.exitDate ? new Date(vehicle.exitDate) : null,
          daysStored: cost.daysStored,
          towingFee: cost.towingFee,
          dailyRate: cost.dailyRate,
          storageCost: cost.storageCost,
          totalCost: cost.totalCost,
        };
      });

      await downloadExcel({
        filename: `extrato_financeiro_${getLocalDateStamp()}.xlsx`,
        title: 'Extrato Financeiro',
        subtitle: `${filteredVehicles.length} veículos • dados conforme os filtros aplicados`,
        worksheetName: 'Extrato financeiro',
        summary: [
          { label: 'Total geral', value: totals.totalValue, numberFormat: '"R$" #,##0.00' },
          { label: 'Receita de liberados', value: totals.releasedValue, numberFormat: '"R$" #,##0.00' },
          { label: 'Acumulado no pátio', value: totals.inYardValue, numberFormat: '"R$" #,##0.00' },
        ],
        columns: [
          { key: 'plate', header: 'Placa', width: 13 },
          { key: 'brand', header: 'Marca', width: 18 },
          { key: 'model', header: 'Modelo', width: 24 },
          { key: 'owner', header: 'Proprietário', width: 28 },
          { key: 'category', header: 'Categoria', width: 14 },
          { key: 'status', header: 'Status', width: 14 },
          { key: 'entryDate', header: 'Entrada', width: 19, numberFormat: 'dd/mm/yyyy hh:mm' },
          { key: 'exitDate', header: 'Saída', width: 19, numberFormat: 'dd/mm/yyyy hh:mm' },
          { key: 'daysStored', header: 'Dias no pátio', width: 14, numberFormat: '0' },
          { key: 'towingFee', header: 'Guincho', width: 16, numberFormat: '"R$" #,##0.00' },
          { key: 'dailyRate', header: 'Última diária', width: 16, numberFormat: '"R$" #,##0.00' },
          { key: 'storageCost', header: 'Estadia acumulada', width: 20, numberFormat: '"R$" #,##0.00' },
          { key: 'totalCost', header: 'Total', width: 17, numberFormat: '"R$" #,##0.00' },
        ],
        rows,
        totals: {
          label: 'TOTAL DO RELATÓRIO',
          labelKey: 'owner',
          sumKeys: ['towingFee', 'storageCost', 'totalCost'],
        },
      });
    } catch (error) {
      console.error('Erro ao exportar extrato financeiro:', error);
      alert('Não foi possível gerar o extrato financeiro. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Voltar</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Extrato Financeiro</h1>
            <p className="text-sm text-gray-500">Resumo de receitas e custos dos veículos</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredVehicles.length === 0}
            aria-label={`Exportar extrato financeiro de ${filteredVehicles.length} veículos filtrados`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Geral</p>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalValue)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredVehicles.length} veículos registrados</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Receita Liberados</p>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.releasedValue)}</p>
              <p className="text-xs text-gray-500 mt-1">{totals.releasedCount} veículos (pagos)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acumulado no Pátio</p>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.inYardValue)}</p>
              <p className="text-xs text-gray-500 mt-1">{totals.inYardCount} veículos (rendendo)</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filtros de Busca</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar placa, modelo, dono..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
              >
                <option value="all">Todas Categorias</option>
                <option value="detran">DETRAN</option>
                <option value="banco">Banco</option>
                <option value="particular">Particular</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
              >
                <option value="all">Todos os Status</option>
                <option value="patio">No Pátio</option>
                <option value="released">Liberados</option>
              </select>
            </div>

            <div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
                  title="Data Inicial"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
                  title="Data Final"
                />
              </div>
            </div>

            {(filterCategory !== 'all' || filterStatus !== 'all' || searchTerm || startDate || endDate) && (
              <div className="lg:col-span-2 flex items-center justify-end">
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterStatus('all');
                    setSearchTerm('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Listagem em Tabela - Com largura garantida */}
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-900">Nenhum veículo encontrado.</p>
            <p className="text-sm text-gray-500 mt-1">Ajuste os filtros de busca para ver os resultados financeiros.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto w-full">
              {/* Largura mínima agressiva para impedir que colunas esmaguem umas às outras */}
              <div className="min-w-[1280px]">
                
                {/* Header da Tabela */}
                <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr_1fr_0.5fr_1.5fr_1fr_1fr] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Placa</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Modelo</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Proprietário</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Categoria</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Entrada</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Saída</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Dias</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Custos Base</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Total</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0">Status</div>
                </div>

                {/* Linhas da Tabela */}
                <div className="divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => {
                    const cost = calculateVehicleCost(vehicle);
                    const isLiberado = vehicle.status === 'Liberado';
                    
                    return (
                      <div key={vehicle.id} className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr_1fr_0.5fr_1.5fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                        
                        {/* Placa */}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">{vehicle.plate}</p>
                        </div>

                        {/* Modelo */}
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500 truncate" title={vehicle.model}>{vehicle.model}</p>
                        </div>
                        
                        {/* Proprietário */}
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate" title={vehicle.owner}>{vehicle.owner || '-'}</p>
                        </div>
                        
                        {/* Categoria */}
                        <div className="min-w-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${
                            vehicle.category?.toLowerCase() === 'detran' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            vehicle.category?.toLowerCase() === 'banco' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {vehicle.category}
                          </span>
                        </div>
                        
                        {/* Entrada */}
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600 whitespace-nowrap">{formatDate(vehicle.entryDate)}</p>
                        </div>

                        {/* Saída */}
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600 whitespace-nowrap">
                            {isLiberado ? formatDate(vehicle.exitDate || '') : '-'}
                          </p>
                        </div>
                        
                        {/* Dias */}
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700">{cost.daysStored}</p>
                        </div>
                        
                        {/* Custos Base */}
                        <div className="text-xs text-gray-600 space-y-0.5 w-full pr-2 min-w-0">
                          <div className="flex justify-between items-center whitespace-nowrap">
                            <span>Guincho:</span>
                            <span className="font-medium text-gray-900 ml-2">{formatCurrency(cost.towingFee)}</span>
                          </div>
                          <div className="flex justify-between items-center whitespace-nowrap">
                            <span>Diária:</span>
                            <span className="font-medium text-gray-900 ml-2">{formatCurrency(cost.storageCost)}</span>
                          </div>
                        </div>
                        
                        {/* Total Final */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(cost.totalCost)}</p>
                        </div>
                        
                        {/* Status (Apenas o Badge) */}
                        <div className="min-w-0">
                          {isLiberado ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Liberado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5" />
                              No Pátio
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}