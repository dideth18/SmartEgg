// frontend/src/pages/Dashboard.jsx
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { incubationAPI, sensorAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, TrendingUp, Egg, Calendar, AlertTriangle } from 'lucide-react';
import AlertBadge from '../components/Alerts/AlertBadge';
import AlertToastContainer from '../components/Alerts/AlertToastContainer';
import { useNavigate } from 'react-router-dom';


const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [incubations, setIncubations] = useState([]);
  const [selectedIncubation, setSelectedIncubation] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncubations();
  }, []);

  useEffect(() => {
    if (selectedIncubation) {
      loadSensorData(selectedIncubation.id);
      loadChartData(selectedIncubation.id);
      
      // Actualizar cada 30 segundos
      const interval = setInterval(() => {
        loadSensorData(selectedIncubation.id);
        loadChartData(selectedIncubation.id);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [selectedIncubation]);

  const loadIncubations = async () => {
    try {
      const response = await incubationAPI.getAll();
      const incubationsList = response.data.data.incubations;
      setIncubations(incubationsList);
      
      if (incubationsList.length > 0) {
        setSelectedIncubation(incubationsList[0]);
      }
    } catch (error) {
      console.error('Error loading incubations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSensorData = async (incubationId) => {
    try {
      const response = await sensorAPI.getLatest(incubationId);
      setSensorData(response.data.data.sensorData);
    } catch (error) {
      console.error('Error loading sensor data:', error);
    }
  };

  const loadChartData = async (incubationId) => {
    try {
      const response = await sensorAPI.getHistory(incubationId, 24);
      const data = response.data.data.sensorData.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        temperatura: parseFloat(item.temperature),
        humedad: parseFloat(item.humidity),
      }));
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const getStageInfo = (stage) => {
    const stages = {
      1: { name: 'Calentamiento Inicial', emoji: '🥚', color: 'bg-yellow-100 text-yellow-800' },
      2: { name: 'Desarrollo', emoji: '🐣', color: 'bg-blue-100 text-blue-800' },
      3: { name: 'Maduración', emoji: '🥚', color: 'bg-purple-100 text-purple-800' },
      4: { name: 'Eclosión', emoji: '🐥', color: 'bg-green-100 text-green-800' },
    };
    return stages[stage] || stages[1];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (incubations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-2xl">🐣</span>
                <span className="ml-2 text-xl font-bold text-gray-900">SmartEgg</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user?.name}</span>
                <button onClick={logout} className="text-sm text-red-600 hover:text-red-700">
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto h-32 w-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6">
              <span className="text-6xl">🐣</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Bienvenido a SmartEgg!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              No tienes incubaciones activas. Crea una para comenzar.
            </p>
            <Link
              to="/incubations/new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Crear Nueva Incubación
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stageInfo = getStageInfo(selectedIncubation?.current_stage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          {selectedIncubation && (
            <AlertBadge 
              incubationId={selectedIncubation.id}
              onClick={() => navigate(`/alerts/${selectedIncubation.id}`)}
            />
          )}
          <button
            onClick={() => navigate('/profile')}
            className="text-gray-700 hover:text-indigo-600 transition"
          >
            {user?.name}
          </button>
          <button onClick={logout} className="text-sm text-red-600 hover:text-red-700">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header con botones */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitoreo en tiempo real de tu incubadora
            </p>
          </div>
          
          {selectedIncubation && (
            <div className="flex space-x-3">
              <Link
                to={`/growth/${selectedIncubation.id}`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg transition shadow-lg hover:shadow-xl font-semibold"
              >
                <span className="mr-2 text-xl">🐣</span>
                Ver Crecimiento
              </Link>
              
              <Link
                to={`/control/${selectedIncubation.id}`}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-lg hover:shadow-xl font-semibold"
              >
                <span className="mr-2 text-xl">🎮</span>
                Control Manual
              </Link>
            </div>
          )}
        </div>

        {/* Selector de incubación */}
        {incubations.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedIncubation?.id || ''}
              onChange={(e) => {
                const incubation = incubations.find(i => i.id === parseInt(e.target.value));
                setSelectedIncubation(incubation);
              }}
              className="block w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              {incubations.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.name} - Día {inc.days_elapsed}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tarjetas de Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Temperatura */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Temperatura</span>
              <Thermometer className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {sensorData?.temperature ? `${sensorData.temperature}°C` : '--'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Rango: 37.0 - 37.8°C</p>
          </div>

          {/* Humedad */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Humedad</span>
              <Droplets className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {sensorData?.humidity ? `${sensorData.humidity}%` : '--'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Rango: 50 - 60%</p>
          </div>

          {/* Días Transcurridos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Progreso</span>
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              Día {selectedIncubation?.days_elapsed || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {21 - (selectedIncubation?.days_elapsed || 0)} días restantes
            </p>
          </div>

          {/* Etapa Actual */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Etapa</span>
              <span className="text-2xl">{stageInfo.emoji}</span>
            </div>
            <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${stageInfo.color}`}>
              {stageInfo.name}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {selectedIncubation?.number_of_eggs} huevos
            </p>
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfica de Temperatura */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Temperatura (Últimas 24h)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[35, 40]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="temperatura" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica de Humedad */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Humedad (Últimas 24h)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[40, 70]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="humedad" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado de Sensores */}
        {sensorData && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estado Actual de Sensores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Wind className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Nivel de Gas</p>
                  <p className="font-semibold">{sensorData.gas_level} ppm</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Droplets className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Nivel de Agua</p>
                  <p className="font-semibold">{sensorData.water_level}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Última Lectura</p>
                  <p className="font-semibold">
                    {new Date(sensorData.timestamp).toLocaleTimeString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;