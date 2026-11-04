import { useEffect, useState } from 'react';
import { api } from './api';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { VehicleEntryForm } from './components/VehicleEntryForm';
import { VehicleExitForm } from './components/VehicleExitForm';
import { VehicleList } from './components/VehicleList';
import { VehicleDetails } from './components/VehicleDetails';
import { AllRecords } from './components/AllRecords';
import { Settings } from './components/Settings';
import { PasswordRecovery } from './components/PasswordRecovery';
import { SettingsClientTab } from './components/SettingsClientTab';
import { SettingsBankTab } from './components/SettingsBankTab';
import { SettingsInfractionTab } from './components/SettingsInfractionTab';
import { SettingsUserTab } from './components/SettingsUserTab';
import { SettingsDetranTab } from './components/SettingsDetranTab';
import { AuctionReport } from './components/AuctionReport';
import { FinancialReport } from './components/FinancialReport';
import { ConfigProvider } from './contexts/ConfigContext';
import { VehicleProvider } from './contexts/VehicleContext';
import { DefinirSenha } from './components/DefinirSenha'; // <-- Importação do novo componente
import { LoadingState } from './components/LoadingState';
import loginBackground from './assets/loginBackground.png';

export default function App() {
  // 1. Intercepta a rota pública de redefinição de senha antes de qualquer verificação
  const isResetPasswordRoute = window.location.pathname.startsWith('/definir-senha/');

  if (isResetPasswordRoute) {
    return <DefinirSenha />;
  }

  // 2. Fluxo normal do sistema
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('access_token'));
  const [usuario, setUsuario] = useState<{ tipo_usuario: 'ADMINISTRADOR' | 'OPERADOR' } | null>(null);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'vehicleEntry' | 'vehicleExit' | 'vehicleList' | 'vehicleDetails' | 'allRecords' | 'settings' | 'settingsClients' | 'settingsBanks' | 'settingsInfractions' | 'settingsUsers' | 'settingsDetran' | 'auctionReport' | 'financialReport'>('dashboard');
  const [detailReturnScreen, setDetailReturnScreen] = useState<'vehicleList' | 'allRecords' | 'auctionReport'>('vehicleList');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [initialFilter, setInitialFilter] = useState<'all' | 'detran' | 'banco' | 'particular'>('all');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      setAuthLoading(false);
      return;
    }

    api.getUsuarioAtual()
      .then((dados) => {
        setUsuario(dados);
        setIsLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUsuario(null);
        setIsLoggedIn(false);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowPasswordRecovery(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUsuario(null);
    setIsLoggedIn(false);
    setCurrentScreen('dashboard');
  };

  const handleForgotPassword = () => {
    setShowPasswordRecovery(true);
  };

  const handleBackToLogin = () => {
    setShowPasswordRecovery(false);
  };

  const handleNavigate = (screen: string, filter?: 'all' | 'detran' | 'banco' | 'particular') => {
    const telasAdministrativas = new Set([
      'vehicleExit',
      'settings',
      'settingsClients',
      'settingsBanks',
      'settingsInfractions',
      'settingsUsers',
      'settingsDetran',
      'auctionReport',
      'financialReport',
    ]);

    if (telasAdministrativas.has(screen) && usuario?.tipo_usuario !== 'ADMINISTRADOR') {
      return;
    }

    if (screen === 'vehicleEntry') {
      setCurrentScreen('vehicleEntry');
    } else if (screen === 'vehicleExit') {
      setCurrentScreen('vehicleExit');
    } else if (screen === 'inventory') {
      setInitialFilter(filter || 'all');
      setCurrentScreen('vehicleList');
    } else if (screen === 'allRecords') {
      setCurrentScreen('allRecords');
    } else if (screen === 'settings') {
      setCurrentScreen('settings');
    } else if (screen === 'settingsClients') {
      setCurrentScreen('settingsClients');
    } else if (screen === 'settingsBanks') {
      setCurrentScreen('settingsBanks');
    } else if (screen === 'settingsInfractions') {
      setCurrentScreen('settingsInfractions');
    } else if (screen === 'settingsUsers') {
      setCurrentScreen('settingsUsers');
    } else if (screen === 'settingsDetran') {
      setCurrentScreen('settingsDetran');
    } else if (screen === 'auctionReport') {
      setCurrentScreen('auctionReport');
    } else if (screen === 'financialReport') {
      setCurrentScreen('financialReport');
    }
  };

  const handleBack = () => {
    setCurrentScreen('dashboard');
    setSelectedVehicleId(null);
  };

  const handleBackToList = () => {
    setCurrentScreen(detailReturnScreen);
    setSelectedVehicleId(null);
  };

  const handleVehicleClick = (vehicleId: string) => {
    if (currentScreen === 'vehicleList' || currentScreen === 'allRecords' || currentScreen === 'auctionReport') {
      setDetailReturnScreen(currentScreen);
    }
    setSelectedVehicleId(vehicleId);
    setCurrentScreen('vehicleDetails');
  };

  const handleDeleteVehicle = () => {
    alert(`Veículo ${selectedVehicleId} foi apagado permanentemente do sistema!`);
    setCurrentScreen('dashboard');
    setSelectedVehicleId(null);
  };

  return (
    <ConfigProvider>
      <VehicleProvider>
        <div className="min-h-screen bg-gray-100">
          {/* Login and Password Recovery Screens */}
          {authLoading ? (
            <LoadingState message="Carregando sessão..." fullScreen />
          ) : !isLoggedIn ? (
            <div 
              className="min-h-screen flex items-center justify-center p-6 relative"
              style={{
                backgroundImage: `url(${loginBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Blur overlay */}
              <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>
              
              {!showPasswordRecovery ? (
                <Login onLogin={handleLogin} onForgotPassword={handleForgotPassword} />
              ) : (
                <PasswordRecovery onBack={handleBackToLogin} />
              )}
            </div>
          ) : (
            <>
              {currentScreen === 'dashboard' && (
                <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} usuario={usuario} />
              )}
              {currentScreen === 'vehicleEntry' && (
                <VehicleEntryForm onBack={handleBack} usuario={usuario} />
              )}
              {currentScreen === 'vehicleExit' && (
                <VehicleExitForm onBack={handleBack} />
              )}
              {currentScreen === 'vehicleList' && (
                <VehicleList onBack={handleBack} onVehicleClick={handleVehicleClick} initialFilter={initialFilter} />
              )}
              {currentScreen === 'vehicleDetails' && selectedVehicleId && (
                <VehicleDetails
                  vehicleId={selectedVehicleId}
                  onBack={handleBackToList}
                  onDelete={handleDeleteVehicle}
                  isAdmin={usuario?.tipo_usuario === 'ADMINISTRADOR'}
                />
              )}
              {currentScreen === 'allRecords' && (
                <AllRecords
                  onBack={handleBack}
                  onVehicleClick={handleVehicleClick}
                  isAdmin={usuario?.tipo_usuario === 'ADMINISTRADOR'}
                />
              )}
              {currentScreen === 'settings' && (
                <Settings onBack={handleBack} />
              )}
              {currentScreen === 'settingsClients' && (
                <SettingsClientTab onBack={handleBack} />
              )}
              {currentScreen === 'settingsBanks' && (
                <SettingsBankTab onBack={handleBack} />
              )}
              {currentScreen === 'settingsInfractions' && (
                <SettingsInfractionTab onBack={handleBack} />
              )}
              {currentScreen === 'settingsUsers' && (
                <SettingsUserTab onBack={handleBack} />
              )}
              {currentScreen === 'settingsDetran' && (
                <SettingsDetranTab onBack={handleBack} />
              )}
              {currentScreen === 'auctionReport' && (
                <AuctionReport onBack={handleBack} onVehicleClick={handleVehicleClick} />
              )}
              {currentScreen === 'financialReport' && (
                <FinancialReport onBack={handleBack} />
              )}
            </>
          )}
        </div>
      </VehicleProvider>
    </ConfigProvider>
  );
}