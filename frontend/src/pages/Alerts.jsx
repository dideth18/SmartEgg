// frontend/src/pages/Alerts.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { alertAPI, incubationAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { 
  ArrowLeft, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Filter
} from 'lucide-react';

const Alerts = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alerts: newAlerts } = useSocket(id);
  
  const [incubation, setIncubation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    severity: 'all',
    type: 'all',
    read: 'all'
  });

  useEffect(() => {
    loadData();
  }, [id, filter]);

  useEffect(() => {
    if (newAlerts && newAlerts.length > 0) {
      loadData();
    }
  }, [newAlerts]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const incubationRes = await incubationAPI.getOne(id);
      setIncubation(incubationRes.data.data.incubation);
      
      const params = { incubationId: id };
      if (filter.severity !== 'all') params.severity = filter.severity;
      if (filter.read !== 'all') params.read = filter.read;
      
      const alertsRes = await alertAPI.getAll(params);
      let alertsList = alertsRes.data.data.alerts;
      
      // Filtrar por tipo si es necesario
      if (filter.type !== 'all') {
        alertsList = alertsList.filter(a => a.type === filter.type);
      }
      
      setAlerts(alertsList);
      
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertAPI.markAsRead(alertId);
      loadData();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertAPI.markAllAsRead(id);
      loadData();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getAlertIcon = (type) => {
    const icons = {
      temperature: <Thermometer className="h-5 w-5" />,
      humidity: <Droplets className="h-5 w-5" />,
      gas: <Wind className="h-5 w-5" />,
      water: <Droplets className="h-5 w-5" />,
      stage: <Zap className="h-5 w-5" />,
      system: <Info className="h-5 w-5" />,
    };
    return icons[type] || <Info className="h-5 w-5" />;
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      critical: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        textColor: 'text-red-900',
        badgeColor: 'bg-red-600',
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />
      },
      warning: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-900',
        badgeColor: 'bg-yellow-600',
        icon: <AlertCircle className="h-5 w-5 text-yellow-600" />
      },
      info: {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-900',
        badgeColor: 'bg-blue-600',
        icon: <Info className="h-5 w-5 text-blue-600" />
      }
    };
    return configs[severity] || configs.info;
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Alertas y Notificaciones
                </h1>
                <p className="text-sm text-gray-500">{incubation?.name}</p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Marcar todas como leídas ({unreadCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <Info className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sin Leer</p>
                <p className="text-2xl font-bold text-indigo-600">{unreadCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Críticas</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Advertencias</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(a => a.severity === 'warning').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severidad
              </label>
              <select
                value={filter.severity}
                onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todas</option>
                <option value="critical">Críticas</option>
                <option value="warning">Advertencias</option>
                <option value="info">Información</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos</option>
                <option value="temperature">Temperatura</option>
                <option value="humidity">Humedad</option>
                <option value="gas">Gas</option>
                <option value="water">Agua</option>
                <option value="stage">Etapa</option>
                <option value="system">Sistema</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filter.read}
                onChange={(e) => setFilter({ ...filter, read: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todas</option>
                <option value="false">Sin leer</option>
                <option value="true">Leídas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Alertas */}
        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Todo en orden!
            </h3>
            <p className="text-gray-600">
              No hay alertas que mostrar con los filtros seleccionados
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const config = getSeverityConfig(alert.severity);
              
              return (
                <div
                  key={alert.id}
                  className={`
                    ${config.bgColor} ${config.borderColor}
                    border-l-4 rounded-lg shadow p-4 transition-all
                    ${!alert.read ? 'ring-2 ring-indigo-300' : ''}
                    hover:shadow-lg
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {config.icon}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-semibold ${config.textColor}`}>
                            {alert.title}
                          </h4>
                          
                          {!alert.read && (
                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                              Nueva
                            </span>
                          )}
                          
                          <span className={`px-2 py-0.5 ${config.badgeColor} text-white text-xs rounded-full`}>
                            {alert.type}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">
                          {alert.message}
                        </p>
                        
                        {alert.value && (
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            Valor: {alert.value}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          {new Date(alert.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                    
                    {!alert.read && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="ml-4 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded text-sm text-gray-700 transition"
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;