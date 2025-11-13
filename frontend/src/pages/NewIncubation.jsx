// frontend/src/pages/NewIncubation.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incubationAPI } from '../services/api';
import { ArrowLeft, Egg } from 'lucide-react';

const NewIncubation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    numberOfEggs: 12,
    tempMin: 37.0,
    tempMax: 37.8,
    humidityMin: 50,
    humidityMax: 60,
    turnIntervalHours: 4,
  });

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || formData.numberOfEggs < 1) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      
      const response = await incubationAPI.create({
        name: formData.name,
        numberOfEggs: formData.numberOfEggs,
        settings: {
          tempMin: formData.tempMin,
          tempMax: formData.tempMax,
          humidityMin: formData.humidityMin,
          humidityMax: formData.humidityMax,
          turnIntervalHours: formData.turnIntervalHours,
        }
      });

      if (response.data.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear incubación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Incubación</h1>
              <p className="text-sm text-gray-500">Configura tu nueva incubadora</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Egg className="h-5 w-5 mr-2 text-indigo-600" />
                Información Básica
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Lote *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Lote Primavera 2024"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="numberOfEggs" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Huevos *
                  </label>
                  <input
                    type="number"
                    id="numberOfEggs"
                    name="numberOfEggs"
                    required
                    min="1"
                    max="100"
                    value={formData.numberOfEggs}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Configuración de Temperatura */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🌡️ Configuración de Temperatura
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tempMin" className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura Mínima (°C)
                  </label>
                  <input
                    type="number"
                    id="tempMin"
                    name="tempMin"
                    step="0.1"
                    min="35"
                    max="40"
                    value={formData.tempMin}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tempMax" className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura Máxima (°C)
                  </label>
                  <input
                    type="number"
                    id="tempMax"
                    name="tempMax"
                    step="0.1"
                    min="35"
                    max="40"
                    value={formData.tempMax}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Rango recomendado: 37.0°C - 37.8°C
              </p>
            </div>

            {/* Configuración de Humedad */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                💧 Configuración de Humedad
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="humidityMin" className="block text-sm font-medium text-gray-700 mb-1">
                    Humedad Mínima (%)
                  </label>
                  <input
                    type="number"
                    id="humidityMin"
                    name="humidityMin"
                    min="0"
                    max="100"
                    value={formData.humidityMin}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="humidityMax" className="block text-sm font-medium text-gray-700 mb-1">
                    Humedad Máxima (%)
                  </label>
                  <input
                    type="number"
                    id="humidityMax"
                    name="humidityMax"
                    min="0"
                    max="100"
                    value={formData.humidityMax}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Rango recomendado: 50% - 60%
              </p>
            </div>

            {/* Configuración de Volteo */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🔄 Configuración de Volteo
              </h2>
              
              <div>
                <label htmlFor="turnIntervalHours" className="block text-sm font-medium text-gray-700 mb-1">
                  Intervalo de Volteo (horas)
                </label>
                <input
                  type="number"
                  id="turnIntervalHours"
                  name="turnIntervalHours"
                  min="1"
                  max="12"
                  value={formData.turnIntervalHours}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Recomendado: 4 horas
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Incubación'}
              </button>
            </div>
          </form>
        </div>

        {/* Info adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• La incubación durará 21 días automáticamente</li>
            <li>• El sistema calculará la etapa actual basándose en los días transcurridos</li>
            <li>• Podrás ajustar estas configuraciones más tarde</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NewIncubation;