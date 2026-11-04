import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, resolveMediaUrl } from '../api';
import { getInclusiveCalendarDays } from '../utils/date';

// Interface atualizada para espelhar as necessidades do Frontend e Backend
export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  chassis: string;
  owner: string;
  category: 'detran' | 'banco' | 'particular';
  entryDate: string;
  exitDate?: string;
  status: 'Ativo' | 'Liberado' | 'Excluído';
  deletedAt?: string;
  deletedBy?: string | number | null;
  deletedByName?: string;
  notes?: string;
  photos?: string[];
  daysInYard: number; // Propriedade calculada dinamicamente
  infracao_info?: { codigo: string; descricao: string };
  banco_info?: {
    nome: string;
    cnpj: string;
    telefone: string;
    email?: string | null;
    guincho_padrao: string;
    diaria_padrao: string;
  };
  cliente_info?: {
    nome: string;
    cpf: string;
    telefone: string;
    email?: string | null;
    endereco: string;
  };
  autorizado_por?: string | null;
  foto_saida?: string | null;
  [key: string]: any; // <-- ADICIONADO: Permite receber propriedades extras da API (guincho, diaria, banco_info, etc.)
}

interface VehicleContextType {
  vehicles: Vehicle[];
  loading: boolean;
  refreshVehicles: () => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
}

export function mapVehicleApiData(v: any): Vehicle {
  const dias = getInclusiveCalendarDays(v.data_entrada, v.data_saida || new Date());

  return {
    ...v,
    id: String(v.id),
    plate: v.placa,
    brand: v.marca,
    model: v.modelo,
    color: v.cor,
    chassis: v.chassi || '',
    owner: v.proprietario,
    category: v.categoria || 'particular',
    entryDate: v.data_entrada,
    exitDate: v.data_saida,
    status: v.excluido_em
      ? 'Excluído'
      : v.status_veiculo === 'RECOLHIDO'
        ? 'Ativo'
        : 'Liberado',
    deletedAt: v.excluido_em || undefined,
    deletedBy: v.excluido_por,
    deletedByName: v.excluido_por_nome || undefined,
    notes: v.observacoes,
    daysInYard: dias,
    photos: v.fotos?.map((f: any) => resolveMediaUrl(f.caminho)) || [],
  };
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Função central para buscar os dados atualizados do Django
  const refreshVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getVeiculos();
      
      // Mapeia o JSON do Django (snake_case/português) para o React (camelCase/inglês)
      const veiculosFormatados: Vehicle[] = data.map(mapVehicleApiData);

      setVehicles(veiculosFormatados);
    } catch (error) {
      console.error("Erro ao buscar veículos na API:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await api.excluirVeiculo(id);
      await refreshVehicles(); // Recarrega a lista após excluir
    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      throw error;
    }
  };

  // Carrega os veículos automaticamente quando o usuário logar
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshVehicles();
    }
  }, []);

  return (
    <VehicleContext.Provider value={{ vehicles, loading, refreshVehicles, deleteVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicle deve ser usado dentro de um VehicleProvider');
  }
  return context;
}