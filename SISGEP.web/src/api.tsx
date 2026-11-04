import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/auth/';

export const resolveMediaUrl = (path: string) => {
  const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;

  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('//')) {
    return path;
  }

  return new URL(path.startsWith('/') ? path : `/${path}`, `${apiOrigin}/`).toString();
};

// Instância base do Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptador: injeta o JWT automaticamente em cada requisição
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptador: lida com tokens expirados sem quebrar a tela de login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Evita dar reload se o erro 401 for na tentativa de fazer login com senha errada
    const isLoginRequest = error.config?.url?.includes('login/');
    
    if (error.response?.status === 401 && !isLoginRequest) {
      // Se o token expirar durante o uso do sistema, limpa o storage e recarrega
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const api = {
  // === AUTENTICAÇÃO (UC01 / UC02) ===
  login: async (cpf: string, password: string) => {
    const response = await apiClient.post('login/', {
      cpf,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  getUsuarioAtual: async () => {
    const response = await apiClient.get('usuarios/me/');
    return response.data;
  },

  esqueciSenha: async (identificador: string, tipo: 'cpf' | 'email') => {
    const response = await apiClient.post('usuarios/esqueci_minha_senha/', { 
      identificador, 
      tipo 
    });
    return response.data;
  },

  redefinirSenha: async (uid: string, token: string, senha: string) => {
    const response = await apiClient.post('usuarios/redefinir_senha/', { 
      uid, 
      token, 
      senha 
    });
    return response.data;
  },

  // === VEÍCULOS ===
  getVeiculos: async () => {
    const response = await apiClient.get('veiculos/');
    return response.data;
  },

  getRegistrosAdministrativos: async () => {
    const response = await apiClient.get('veiculos/registros-administrativos/');
    return response.data;
  },

  getRegistroAdministrativo: async (id: string) => {
    const response = await apiClient.get(`veiculos/${id}/registro-administrativo/`);
    return response.data;
  },

  getVehicleDocumentUrl: async (
    id: string,
    tipo: 'apreensao' | 'liberacao' | 'custodia',
  ): Promise<{ url: string }> => {
    const response = await apiClient.get<{ url: string }>(`veiculos/${id}/documento-url/`, {
      params: { tipo },
    });
    return response.data;
  },

  getInventario: async () => {
    const response = await apiClient.get('veiculos/inventario/');
    return response.data;
  },

  getLeilao: async () => {
    const response = await apiClient.get('veiculos/leilao/');
    return response.data;
  },

  registrarEntrada: async (dados: FormData) => {
    const response = await apiClient.post('veiculos/', dados, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  registrarSaida: async (id: string, dados: FormData) => {
    const response = await apiClient.post(`veiculos/${id}/registrar_saida/`, dados, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  excluirVeiculo: async (id: string) => {
    const response = await apiClient.delete(`veiculos/${id}/`);
    return response.data;
  },

  // === USUÁRIOS (UC20) ===
  getUsuarios: async () => (await apiClient.get('usuarios/')).data,
  createUsuario: async (dados: Record<string, unknown>) => (await apiClient.post('usuarios/', dados)).data,
  updateUsuario: async (id: string, dados: Record<string, unknown>) => (await apiClient.put(`usuarios/${id}/`, dados)).data,
  deleteUsuario: async (id: string) => (await apiClient.delete(`usuarios/${id}/`)).data,

  // === CLIENTES (UC17) ===
  getClientes: async () => (await apiClient.get('clientes/')).data,
  createCliente: async (dados: Record<string, unknown>) => (await apiClient.post('clientes/', dados)).data,
  updateCliente: async (id: string, dados: Record<string, unknown>) => (await apiClient.put(`clientes/${id}/`, dados)).data,
  deleteCliente: async (id: string) => (await apiClient.delete(`clientes/${id}/`)).data,

  // === BANCOS / INSTITUIÇÕES (UC19) ===
  getBancos: async () => (await apiClient.get('bancos/')).data,
  createBanco: async (dados: Record<string, unknown>) => (await apiClient.post('bancos/', dados)).data,
  updateBanco: async (id: string, dados: Record<string, unknown>) => (await apiClient.put(`bancos/${id}/`, dados)).data,
  deleteBanco: async (id: string) => (await apiClient.delete(`bancos/${id}/`)).data,

  // === INFRAÇÕES (UC15) ===
  getInfracoes: async () => (await apiClient.get('infracoes/')).data,
  createInfraction: async (dados: Record<string, unknown>) => (await apiClient.post('infracoes/', dados)).data,
  updateInfraction: async (id: string, dados: Record<string, unknown>) => (await apiClient.put(`infracoes/${id}/`, dados)).data,
  deleteInfraction: async (id: string) => (await apiClient.delete(`infracoes/${id}/`)).data,

  // === TABELA DETRAN (UC18) ===
  getTabelasDetran: async () => (await apiClient.get('tabela-detran/')).data,
  createTabelaDetran: async (dados: Record<string, unknown>) => (await apiClient.post('tabela-detran/', dados)).data,
  updateTabelaDetran: async (id: string, dados: Record<string, unknown>) => (await apiClient.put(`tabela-detran/${id}/`, dados)).data,
};