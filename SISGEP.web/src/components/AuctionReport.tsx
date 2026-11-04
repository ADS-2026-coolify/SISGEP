import { ArrowLeft, Gavel, FileSpreadsheet, AlertCircle, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useConfig } from '../contexts/ConfigContext';
import { getInclusiveCalendarDays } from '../utils/date';
import { calculateDetranCost } from '../utils/detranCosts';
import { downloadExcel, getLocalDateStamp } from '../utils/exportExcel';
import { LoadingState } from './LoadingState';

interface AuctionReportProps {
  onBack: () => void;
  onVehicleClick: (vehicleId: string) => void;
}

interface VehicleForAuction {
  id: string;
  plate: string;
  brand: string;
  model: string;
  category: 'detran' | 'banco' | 'particular';
  entryDate: string;
  daysInYard: number;
  towingFee: number;
  dailyRate: number;
  storageCost: number;
  totalCost: number;
}

export function AuctionReport({ onBack, onVehicleClick }: AuctionReportProps) {
  const [vehiclesForAuction, setVehiclesForAuction] = useState<VehicleForAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const { detranTables } = useConfig();

  useEffect(() => {
    const carregarLeilao = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setVehiclesForAuction([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await api.getLeilao();
        const mapped = data
          .filter((vehicle: any) =>
            vehicle.categoria === 'detran' && vehicle.status_veiculo === 'RECOLHIDO')
          .map((vehicle: any) => {
            const endDate = new Date();
            const diffDays = getInclusiveCalendarDays(vehicle.data_entrada, endDate);
            const category = vehicle.categoria as VehicleForAuction['category'];
            const detranCost = category === 'detran'
              ? calculateDetranCost(
                vehicle.data_entrada,
                endDate,
                detranTables,
                vehicle.tabela,
                vehicle.tabela_info,
              )
              : null;
            const towingFee = detranCost?.towingFee ?? Number(vehicle.guincho || 0);
            const dailyRate = detranCost?.dailyRate ?? Number(vehicle.diaria || 0);
            const storageCost = detranCost?.storageCost ?? diffDays * dailyRate;

            return {
              id: String(vehicle.id),
              plate: vehicle.placa,
              brand: vehicle.marca,
              model: vehicle.modelo,
              category,
              entryDate: vehicle.data_entrada,
              daysInYard: diffDays,
              towingFee,
              dailyRate,
              storageCost,
              totalCost: towingFee + storageCost,
            };
          })
          .filter((vehicle: VehicleForAuction) => vehicle.daysInYard > 60);

        setVehiclesForAuction(mapped);
      } catch (error) {
        console.error('Erro ao carregar relatório de leilão:', error);
        setVehiclesForAuction([]);
      } finally {
        setLoading(false);
      }
    };

    carregarLeilao();
  }, [detranTables]);

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getCategoryColor = (category: 'detran' | 'banco' | 'particular') => {
    switch (category) {
      case 'detran': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'banco': return 'bg-green-50 text-green-700 border-green-200';
      case 'particular': return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getCategoryLabel = (category: 'detran' | 'banco' | 'particular') => {
    switch (category) {
      case 'detran': return 'DETRAN';
      case 'banco': return 'Banco';
      case 'particular': return 'Particular';
    }
  };

  const handleExport = async () => {
    try {
      const averageDays = vehiclesForAuction.reduce((sum, vehicle) => sum + vehicle.daysInYard, 0)
        / vehiclesForAuction.length;
      const totalCost = vehiclesForAuction.reduce((sum, vehicle) => sum + vehicle.totalCost, 0);
      const rows = vehiclesForAuction.map((vehicle) => ({
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        category: getCategoryLabel(vehicle.category),
        entryDate: new Date(vehicle.entryDate),
        daysInYard: vehicle.daysInYard,
        towingFee: vehicle.towingFee,
        dailyRate: vehicle.dailyRate,
        storageCost: vehicle.storageCost,
        totalCost: vehicle.totalCost,
      }));

      await downloadExcel({
        filename: `relatorio_leilao_${getLocalDateStamp()}.xlsx`,
        title: 'Relatório de Leilão',
        subtitle: `${vehiclesForAuction.length} veículos aptos • permanência superior a 60 dias`,
        worksheetName: 'Veículos para leilão',
        summary: [
          { label: 'Veículos aptos', value: vehiclesForAuction.length, numberFormat: '0' },
          { label: 'Média de dias no pátio', value: averageDays, numberFormat: '0.0' },
          { label: 'Custo estimado total', value: totalCost, numberFormat: '"R$" #,##0.00' },
        ],
        columns: [
          { key: 'plate', header: 'Placa', width: 13 },
          { key: 'brand', header: 'Marca', width: 18 },
          { key: 'model', header: 'Modelo', width: 24 },
          { key: 'category', header: 'Categoria', width: 15 },
          { key: 'entryDate', header: 'Data de entrada', width: 19, numberFormat: 'dd/mm/yyyy hh:mm' },
          { key: 'daysInYard', header: 'Dias no pátio', width: 15, numberFormat: '0' },
          { key: 'towingFee', header: 'Guincho', width: 16, numberFormat: '"R$" #,##0.00' },
          { key: 'dailyRate', header: 'Última diária', width: 16, numberFormat: '"R$" #,##0.00' },
          { key: 'storageCost', header: 'Estadia acumulada', width: 20, numberFormat: '"R$" #,##0.00' },
          { key: 'totalCost', header: 'Custo estimado', width: 18, numberFormat: '"R$" #,##0.00' },
        ],
        rows,
        totals: {
          label: 'TOTAL DO RELATÓRIO',
          labelKey: 'model',
          sumKeys: ['daysInYard', 'towingFee', 'storageCost', 'totalCost'],
        },
      });
    } catch (error) {
      console.error('Erro ao exportar relatório de leilão:', error);
      alert('Não foi possível gerar o relatório de leilão. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Relatório de Leilão</h1>
              <p className="text-sm text-gray-500 mt-0.5">Veículos com mais de 60 dias no pátio</p>
            </div>
            <button
              onClick={handleExport}
              disabled={vehiclesForAuction.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:bg-green-800 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {loading ? (
          <LoadingState message="Carregando veículos aptos para leilão..." />
        ) : (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {vehiclesForAuction.length} {vehiclesForAuction.length === 1 ? 'veículo apto' : 'veículos aptos'} para leilão
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Veículos que permanecem no pátio por mais de 60 dias podem ser destinados a leilão público
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle List */}
        {!loading && vehiclesForAuction.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-900 mb-1">Nenhum veículo apto para leilão</p>
            <p className="text-sm text-gray-500">Todos os veículos têm menos de 60 dias no pátio</p>
          </div>
        ) : !loading ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Placa</div>
              <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Veículo</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Categoria</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Entrada</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Dias/Custo</div>
              <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wide"></div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {vehiclesForAuction.map((vehicle) => (
                <div key={vehicle.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-2 font-semibold text-gray-900">{vehicle.plate}</div>
                    <div className="col-span-3 text-sm text-gray-700">{vehicle.brand} {vehicle.model}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getCategoryColor(vehicle.category)}`}>
                        {getCategoryLabel(vehicle.category)}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">{formatDateTime(vehicle.entryDate)}</div>
                    <div className="col-span-2">
                      <div className="text-sm font-semibold text-amber-700">{vehicle.daysInYard} dias</div>
                      <div className="text-xs text-gray-600">R$ {vehicle.totalCost.toFixed(2)}</div>
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => onVehicleClick(vehicle.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Ver
                      </button>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{vehicle.plate}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getCategoryColor(vehicle.category)}`}>
                        {getCategoryLabel(vehicle.category)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">{vehicle.brand} {vehicle.model}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      Entrada: {formatDateTime(vehicle.entryDate)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-amber-700">{vehicle.daysInYard} dias no pátio</span>
                      <span className="text-sm font-semibold text-gray-900">R$ {vehicle.totalCost.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => onVehicleClick(vehicle.id)}
                      className="text-sm font-semibold text-blue-600"
                    >
                      Ver Detalhes →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Summary */}
        {vehiclesForAuction.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo do Leilão</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Total de Veículos</p>
                <p className="text-3xl font-extrabold text-blue-900 mt-1">{vehiclesForAuction.length}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Média de Dias</p>
                <p className="text-3xl font-extrabold text-amber-900 mt-1">
                  {Math.round(vehiclesForAuction.reduce((sum, v) => sum + v.daysInYard, 0) / vehiclesForAuction.length)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Custo Total</p>
                <p className="text-3xl font-extrabold text-green-900 mt-1">
                  R$ {vehiclesForAuction.reduce((sum, v) => sum + v.totalCost, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
