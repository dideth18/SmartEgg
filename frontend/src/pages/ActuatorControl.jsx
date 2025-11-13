// frontend/src/pages/ActuatorControl.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { actuatorAPI, incubationAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { 
  Power, 
  Wind, 
  RotateCw, 
  Zap, 
  AlertCircle, 
  ArrowLeft,
  Thermometer,
  Activity
} from 'lucide-react';

const ActuatorControl = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { connected, actuatorData } = useSocket(id);
  
  const [incubation, setIncubation] = useState(null);
  const [actuators, setActuators] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (actuatorData) {
      setActuators(actuatorData);
    }
  }, [actuatorData]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar incubación
      const incubationRes = await incubationAPI.getOne(id);
      setIncubation(incubationRes.data.data.incubation);
      
      // Cargar estado de actuadores
      const actuatorsRes = await actuatorAPI.getState(id);
      setActuators(actuatorsRes.data.data.actuator);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActuator = async (field, currentValue) => {
    try {
      setUpdating(true);
      
      const updateData = {
        [field]: !currentValue,
        manual_mode: actuators?.manual_mode || false
      };
      
      const response = await actuatorAPI.update(id, updateData);
      setActuators(response.data.data.actuator);
      
    } catch (error) {
      console.error('Error updating actuator:', error);
      alert('Error al actualizar el actuador');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleManualMode = async () => {
    try {
      setUpdating(true);
      
      const updateData = {
        manual_mode: !actuators?.manual_mode
      };
      
      const response = await actuatorAPI.update(id, updateData);
      setActuators(response.data.data.actuator);
      
    } catch (error) {
      console.error('Error toggling manual mode:', error);
      alert('Error al cambiar modo');
    } finally {
      setUpdating(false);
    }
  };

  const handleTurnEggs = async () => {
    try {
      setUpdating(true);
      await actuatorAPI.turnEggs(id);
      alert('✅ Huevos volteados correctamente');
      loadData();
    } catch (error) {
      console.error('Error turning eggs:', error);
      alert('Error al voltear huevos');
    } finally {
      setUpdating(false);
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Control de Actuadores</h1>
                <p className="text-sm text-gray-500">{incubation?.name}</p>
              </div>
            </div>
            
            {/* Estado de conexión */}
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Modo Manual/Automático */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">
                  Modo: {actuators?.manual_mode ? 'Manual' : 'Automático'}
                </h2>
                <p className="text-sm opacity-90">
                  {actuators?.manual_mode 
                    ? 'Control manual activado - Los actuadores no responderán automáticamente'
                    : 'Control automático - El sistema regula temperatura y humedad automáticamente'
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={handleToggleManualMode}
              disabled={updating}
              className={`
                px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 disabled:opacity-50
                ${actuators?.manual_mode 
                  ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' 
                  : 'bg-white text-indigo-600 hover:bg-gray-100'
                }
              `}
            >
              {actuators?.manual_mode ? 'Cambiar a Automático' : 'Cambiar a Manual'}
            </button>
          </div>
        </div>

        {/* Alerta de Modo Manual */}
        {actuators?.manual_mode && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <p className="text-sm text-yellow-800">
                <strong>Atención:</strong> El modo manual está activo. Los controles automáticos están deshabilitados.
              </p>
            </div>
          </div>
        )}

        {/* Grid de Actuadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Calefactor */}
          <div className={`
            bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl
            ${actuators?.heater_active ? 'ring-2 ring-red-500' : ''}
          `}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`
                  p-3 rounded-lg
                  ${actuators?.heater_active ? 'bg-red-100' : 'bg-gray-100'}
                `}>
                  <Thermometer className={`h-6 w-6 ${actuators?.heater_active ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Calefactor</h3>
                  <p className="text-sm text-gray-500">
                    {actuators?.heater_active ? 'Encendido' : 'Apagado'}
                  </p>
                </div>
              </div>
              
              <div className={`
                h-12 w-12 rounded-full flex items-center justify-center
                ${actuators?.heater_active ? 'bg-red-500' : 'bg-gray-300'}
              `}>
                <Power className={`h-6 w-6 ${actuators?.heater_active ? 'text-white' : 'text-gray-600'}`} />
              </div>
            </div>
            
            <button
              onClick={() => handleToggleActuator('heater_active', actuators?.heater_active)}
              disabled={updating || !actuators?.manual_mode}
              className={`
                w-full py-3 px-4 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
                ${actuators?.heater_active 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }
              `}
            >
              {actuators?.heater_active ? 'Apagar' : 'Encender'}
            </button>
            
            {!actuators?.manual_mode && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Solo disponible en modo manual
              </p>
            )}
          </div>

          {/* Ventilación */}
          <div className={`
            bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl
            ${actuators?.ventilation_active ? 'ring-2 ring-blue-500' : ''}
          `}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`
                  p-3 rounded-lg
                  ${actuators?.ventilation_active ? 'bg-blue-100' : 'bg-gray-100'}
                `}>
                  <Wind className={`h-6 w-6 ${actuators?.ventilation_active ? 'text-blue-600 animate-pulse' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ventilación</h3>
                  <p className="text-sm text-gray-500">
                    {actuators?.ventilation_active ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
              </div>
              
              <div className={`
                h-12 w-12 rounded-full flex items-center justify-center
                ${actuators?.ventilation_active ? 'bg-blue-500' : 'bg-gray-300'}
              `}>
                <Zap className={`h-6 w-6 ${actuators?.ventilation_active ? 'text-white' : 'text-gray-600'}`} />
              </div>
            </div>
            
            <button
              onClick={() => handleToggleActuator('ventilation_active', actuators?.ventilation_active)}
              disabled={updating || !actuators?.manual_mode}
              className={`
                w-full py-3 px-4 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
                ${actuators?.ventilation_active 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }
              `}
            >
              {actuators?.ventilation_active ? 'Desactivar' : 'Activar'}
            </button>
            
            {!actuators?.manual_mode && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Solo disponible en modo manual
              </p>
            )}
          </div>

          {/* Volteo de Huevos */}
          <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-purple-100">
                  <RotateCw className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Volteo de Huevos</h3>
                  <p className="text-sm text-gray-500">
                    {actuators?.egg_turn_count || 0} volteos
                  </p>
                </div>
              </div>
            </div>
            
            {actuators?.last_egg_turn && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Último volteo:</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(actuators.last_egg_turn).toLocaleString('es-ES')}
                </p>
              </div>
            )}
            
            <button
              onClick={handleTurnEggs}
              disabled={updating}
              className="w-full py-3 px-4 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-2">
                <RotateCw className="h-5 w-5" />
                <span>Voltear Ahora</span>
              </div>
            </button>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Disponible en cualquier modo
            </p>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Última actualización</p>
              <p className="font-medium text-gray-900">
                {actuators?.timestamp 
                  ? new Date(actuators.timestamp).toLocaleString('es-ES')
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de volteos</p>
              <p className="font-medium text-gray-900">{actuators?.egg_turn_count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado de conexión</p>
              <p className="font-medium text-gray-900">
                {connected ? '✅ Conectado' : '❌ Desconectado'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActuatorControl;