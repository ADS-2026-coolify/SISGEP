import { LogOut, TrendingUp, TrendingDown, X, Menu, Settings, PlusCircle, FileText, Package, List, Users, Building2, AlertTriangle, DollarSign, Gavel, Shield } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useState, useMemo } from 'react';
import { useVehicle } from '../contexts/VehicleContext';
import { addCalendarDays, getCalendarDateKey } from '../utils/date';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (screen: string, filter?: 'all' | 'detran' | 'banco' | 'particular') => void;
  usuario: { tipo_usuario: 'ADMINISTRADOR' | 'OPERADOR' } | null;
}

export function Dashboard({ onLogout, onNavigate, usuario }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdministrador = usuario?.tipo_usuario === 'ADMINISTRADOR';
  
  const { vehicles } = useVehicle();

  const maxCapacity = 1200; // Capacidade do pátio de assis, deixei hardcoded mesmo
  
  const activeVehicles = useMemo(() => vehicles.filter(v => v.status === 'Ativo'), [vehicles]);
  const totalVehicles = activeVehicles.length;
  const occupancyPercentage = Math.round((totalVehicles / maxCapacity) * 100) || 0;

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    
    const entriesToday = vehicles.filter(v => new Date(v.entryDate).toDateString() === today).length;
    const exitsToday = vehicles.filter(v => v.exitDate && new Date(v.exitDate).toDateString() === today).length;

    return { entriesToday, exitsToday };
  }, [vehicles]);

  const categoryData = useMemo(() => {
    return [
      { name: 'DETRAN', value: activeVehicles.filter(v => v.category?.toLowerCase() === 'detran').length, color: '#3B82F6', filter: 'detran' as const },
      { name: 'Banco', value: activeVehicles.filter(v => v.category?.toLowerCase() === 'banco').length, color: '#10B981', filter: 'banco' as const },
      { name: 'Particular', value: activeVehicles.filter(v => v.category?.toLowerCase() === 'particular').length, color: '#F59E0B', filter: 'particular' as const },
    ];
  }, [activeVehicles]);

  const weeklyData = useMemo(() => {
    const today = getCalendarDateKey(new Date());

    return Array.from({ length: 7 }, (_, index) => {
      const dateKey = addCalendarDays(today, index - 6);
      const date = new Date(`${dateKey}T12:00:00Z`);
      const weekday = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short',
        timeZone: 'America/Sao_Paulo',
      }).format(date);
      const dayOfMonth = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).format(date);

      const entries = vehicles.filter(
        (vehicle) => getCalendarDateKey(vehicle.entryDate) === dateKey,
      ).length;
      const exits = vehicles.filter(
        (vehicle) => vehicle.exitDate && getCalendarDateKey(vehicle.exitDate) === dateKey,
      ).length;

      return { day: `${weekday} ${dayOfMonth}`, entries, exits };
    });
  }, [vehicles]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Padrão Clean */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm lg:shadow-none transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header Limpo */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SISGEP</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Gestão de Pátios</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          <button
            onClick={() => { setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold transition-colors text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => { onNavigate('vehicleEntry'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Entrada</span>
          </button>
          
          {isAdministrador && (
            <button
              onClick={() => { onNavigate('vehicleExit'); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Registrar Saída</span>
            </button>
          )}
          
          <button
            onClick={() => { onNavigate('inventory'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            <Package className="w-4 h-4" />
            <span>Inventário</span>
          </button>
          
          <button
            onClick={() => { onNavigate('allRecords'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            <List className="w-4 h-4" />
            <span>Todos os Registros</span>
          </button>
          
          {isAdministrador && (
            <button
              onClick={() => { onNavigate('financialReport'); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
            >
              <DollarSign className="w-4 h-4" />
              <span>Extrato Financeiro</span>
            </button>
          )}
          
          {isAdministrador && (
            <>
              <div className="py-2">
                <div className="h-px bg-gray-100"></div>
              </div>

              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                Gerenciar
              </p>
          
          <button
            onClick={() => { onNavigate('settingsClients'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
          </button>
          
          <button
            onClick={() => { onNavigate('settingsBanks'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            <Building2 className="w-4 h-4" />
            <span>Bancos</span>
          </button>
          
          <button
            onClick={() => { onNavigate('settingsInfractions'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Infrações</span>
          </button>
          
          <button
            onClick={() => { onNavigate('settingsUsers'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            <Users className="w-4 h-4" />
            <span>Usuários</span>
          </button>
          
          <button
            onClick={() => { onNavigate('settingsDetran'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            <DollarSign className="w-4 h-4" />
            <span>Valores DETRAN</span>
          </button>
            </>
          )}
          
          <div className="py-2">
            <div className="h-px bg-gray-100"></div>
          </div>
          
          {isAdministrador && (
            <>
              <button
                onClick={() => { onNavigate('auctionReport'); setSidebarOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
              >
                <div className="flex items-center gap-3">
                  <Gavel className="w-4 h-4" />
                  <span>Relatório Leilão</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">+60</span>
              </button>

              <button
                onClick={() => { onNavigate('settings'); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </button>
            </>
          )}
        </nav>
        
        {/* Logout Button */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => { onLogout(); setSidebarOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto w-full bg-gray-50 pb-8">
        {/* Header Superior */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
              <p className="text-xs text-gray-500 font-medium">Visão geral do pátio</p>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="px-4 lg:px-8 pt-6 max-w-7xl mx-auto space-y-6">
          
          {/* Card de Ocupação - Estilo Clean com Gradiente Suave */}
          <button
            onClick={() => onNavigate('inventory', 'all')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 shadow-sm border border-blue-900/20 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow text-left"
          >
            <div>
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Ocupação do Pátio</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">{totalVehicles}</span>
                <span className="text-lg text-blue-200 font-medium">/ {maxCapacity} veículos</span>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="flex justify-between text-xs font-medium text-blue-200 mb-2">
                <span>Capacidade atingida</span>
                <span>{occupancyPercentage}%</span>
              </div>
              <div className="w-full bg-blue-900/40 rounded-full h-2 overflow-hidden border border-blue-900/30">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
            </div>
          </button>

          {/* Grid de Estatísticas Pequenas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entradas Hoje</p>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.entriesToday}</p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saídas Hoje</p>
                <TrendingDown className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.exitsToday}</p>
            </div>

            {/* Reuso de cards para outras estatísticas úteis */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pátio - Detran</p>
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{categoryData.find(c => c.filter === 'detran')?.value || 0}</p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pátio - Banco</p>
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{categoryData.find(c => c.filter === 'banco')?.value || 0}</p>
            </div>
          </div>

          {/* Ações Rápidas (Cards modernos) */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Ações Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => onNavigate('vehicleEntry')}
                className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors w-fit">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">Nova Entrada</span>
                <span className="text-xs text-gray-500 mt-1">Registrar veículo no pátio</span>
              </button>

              <button
                onClick={() => onNavigate('vehicleExit')}
                className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="p-2.5 bg-gray-50 text-gray-600 rounded-lg mb-4 group-hover:bg-gray-800 group-hover:text-white transition-colors w-fit">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">Registrar Saída</span>
                <span className="text-xs text-gray-500 mt-1">Registrar saída de veículo</span>
              </button>

              <button
                onClick={() => onNavigate('inventory')}
                className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors w-fit">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">Inventário</span>
                <span className="text-xs text-gray-500 mt-1">Ver veículos recolhidos</span>
              </button>

              <button
                onClick={() => onNavigate('allRecords')}
                className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors w-fit">
                  <List className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">Histórico Completo</span>
                <span className="text-xs text-gray-500 mt-1">Relatórios e pesquisas</span>
              </button>
            </div>
          </div>

          {/* Gráficos e Categorias */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Categorias - Ocupa 1 coluna */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Por Categoria</h3>
              <div className="space-y-3">
                {categoryData.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => onNavigate('inventory', item.filter)}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-10 rounded-full bg-gray-200 group-hover:scale-y-110 transition-transform"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {item.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gráfico de Entradas/Saídas - Ocupa 2 colunas */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Movimentação - Últimos 7 Dias</h3>
                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                    <span className="text-xs text-gray-600 font-medium">Entradas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-gray-700"></div>
                    <span className="text-xs text-gray-600 font-medium">Saídas</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '13px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      cursor={{fill: '#F3F4F6'}}
                    />
                    <Bar dataKey="entries" name="Entradas" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="exits" name="Saídas" fill="#374151" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}