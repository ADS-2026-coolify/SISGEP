import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api';
import { getCalendarDateKey } from '../utils/date';

export interface ClientData {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: string;
}

export interface InfractionData {
  id: string;
  code: string;
  description: string;
  createdAt?: string;
}

export interface BankData {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  towingFee: string;
  dailyRate: string;
  createdAt?: string;
}

export interface DetranTableData {
  id: string;
  towingFee: string;
  dailyRate: string;
  effectiveDate: string;
}

interface ConfigContextType {
  clients: ClientData[];
  infractions: InfractionData[];
  banks: BankData[];
  detranTables: DetranTableData[];
  detranTowingFee: string;
  detranDailyRate: string;
  loading: boolean;
  refreshConfigs: () => Promise<void>;
  addClient: (client: ClientData) => Promise<void>;
  updateClient: (id: string, client: ClientData) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addInfraction: (infraction: InfractionData) => Promise<void>;
  updateInfraction: (id: string, infraction: InfractionData) => Promise<void>;
  deleteInfraction: (id: string) => Promise<void>;
  addBank: (bank: BankData) => Promise<void>;
  updateBank: (id: string, bank: BankData) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  setDetranTowingFee: (value: string) => void;
  setDetranDailyRate: (value: string) => void;
  updateDetranValues: (towingFee: string, dailyRate: string) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [infractions, setInfractions] = useState<InfractionData[]>([]);
  const [banks, setBanks] = useState<BankData[]>([]);
  const [detranTables, setDetranTables] = useState<DetranTableData[]>([]);
  const [loading, setLoading] = useState(true);

  const [detranTowingFee, setDetranTowingFee] = useState('285.50');
  const [detranDailyRate, setDetranDailyRate] = useState('42.80');

  const refreshConfigs = async () => {
    setLoading(true);
    try {
      const [clientesData, bancosData, infracoesData, tabelaDetranData] = await Promise.all([
        api.getClientes(),
        api.getBancos(),
        api.getInfracoes(),
        api.getTabelasDetran()
      ]);

      setClients(clientesData.map((c: any) => ({
        id: String(c.id),
        name: c.nome,
        cpf: c.cpf,
        phone: c.telefone,
        email: c.email || '',
        address: c.endereco || ''
      })));

      setBanks(bancosData.map((b: any) => ({
        id: String(b.id),
        name: b.nome,
        cnpj: b.cnpj,
        phone: b.telefone,
        email: b.email || '',
        towingFee: String(b.guincho_padrao),
        dailyRate: String(b.diaria_padrao)
      })));

      setInfractions(infracoesData.map((i: any) => ({
        id: String(i.id),
        code: i.codigo,
        description: i.descricao
      })));

      const tabelasOrdenadas = (tabelaDetranData || [])
        .map((tabela: any) => ({
          id: String(tabela.id),
          towingFee: String(tabela.guincho),
          dailyRate: String(tabela.estadia),
          effectiveDate: tabela.ano_vigente,
        }))
        .sort((a: DetranTableData, b: DetranTableData) => b.effectiveDate.localeCompare(a.effectiveDate));
      setDetranTables(tabelasOrdenadas);

      if (tabelasOrdenadas.length > 0) {
        const todayKey = getCalendarDateKey(new Date());
        const tabelaAtual = tabelasOrdenadas.find((tabela) => tabela.effectiveDate <= todayKey)
          || tabelasOrdenadas[tabelasOrdenadas.length - 1];
        setDetranTowingFee(tabelaAtual.towingFee);
        setDetranDailyRate(tabelaAtual.dailyRate);
      } else {
        setDetranTowingFee('285.50');
        setDetranDailyRate('42.80');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da API:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshConfigs();
    }
  }, []);

  const addClient = async (client: ClientData) => {
    await api.createCliente({
      nome: client.name,
      cpf: client.cpf,
      telefone: client.phone,
      email: client.email,
      endereco: client.address,
    });
    await refreshConfigs();
  };

  const updateClient = async (id: string, client: ClientData) => {
    await api.updateCliente(id, {
      nome: client.name,
      cpf: client.cpf,
      telefone: client.phone,
      email: client.email,
      endereco: client.address,
    });
    await refreshConfigs();
  };

  const deleteClient = async (id: string) => {
    await api.deleteCliente(id);
    await refreshConfigs();
  };

  const addInfraction = async (infraction: InfractionData) => {
    await api.createInfraction({
      codigo: infraction.code,
      descricao: infraction.description,
    });
    await refreshConfigs();
  };

  const updateInfraction = async (id: string, infraction: InfractionData) => {
    await api.updateInfraction(id, {
      codigo: infraction.code,
      descricao: infraction.description,
    });
    await refreshConfigs();
  };

  const deleteInfraction = async (id: string) => {
    await api.deleteInfraction(id);
    await refreshConfigs();
  };

  const addBank = async (bank: BankData) => {
    await api.createBanco({
      nome: bank.name,
      cnpj: bank.cnpj,
      telefone: bank.phone,
      email: bank.email,
      guincho_padrao: bank.towingFee,
      diaria_padrao: bank.dailyRate,
    });
    await refreshConfigs();
  };

  const updateBank = async (id: string, bank: BankData) => {
    await api.updateBanco(id, {
      nome: bank.name,
      cnpj: bank.cnpj,
      telefone: bank.phone,
      email: bank.email,
      guincho_padrao: bank.towingFee,
      diaria_padrao: bank.dailyRate,
    });
    await refreshConfigs();
  };

  const deleteBank = async (id: string) => {
    await api.deleteBanco(id);
    await refreshConfigs();
  };

  const updateDetranValues = async (towingFee: string, dailyRate: string) => {
    const effectiveDate = getCalendarDateKey(new Date());
    const payload = {
      guincho: towingFee,
      estadia: dailyRate,
      ano_vigente: effectiveDate,
    };
    const tableForToday = detranTables.find((table) => table.effectiveDate === effectiveDate);

    if (tableForToday) {
      await api.updateTabelaDetran(tableForToday.id, payload);
    } else {
      await api.createTabelaDetran(payload);
    }

    await refreshConfigs();
  };

  return (
    <ConfigContext.Provider
      value={{
        clients,
        infractions,
        banks,
        detranTables,
        detranTowingFee,
        detranDailyRate,
        loading,
        refreshConfigs,
        addClient,
        updateClient,
        deleteClient,
        addInfraction,
        updateInfraction,
        deleteInfraction,
        addBank,
        updateBank,
        deleteBank,
        setDetranTowingFee,
        setDetranDailyRate,
        updateDetranValues,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}