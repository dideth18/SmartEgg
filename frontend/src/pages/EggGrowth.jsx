// frontend/src/pages/EggGrowth.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incubationAPI } from '../services/api';
import { ArrowLeft, Calendar, TrendingUp, Heart, Zap } from 'lucide-react';

const EggGrowth = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incubation, setIncubation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncubation();
  }, [id]);

  const loadIncubation = async () => {
    try {
      const response = await incubationAPI.getOne(id);
      setIncubation(response.data.data.incubation);
    } catch (error) {
      console.error('Error loading incubation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageData = (daysElapsed) => {
    if (daysElapsed <= 7) {
      return {
        stage: 1,
        name: 'Calentamiento Inicial',
        emoji: '🥚',
        color: 'from-yellow-400 to-orange-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-900',
        description: 'Formación embrionaria temprana',
        details: [
          'El embrión comienza a formarse',
          'Las células se dividen rápidamente',
          'Se forma el sistema circulatorio primitivo',
          'Temperatura crítica: mantener 37.5°C'
        ],
        progress: (daysElapsed / 7) * 100,
        icon: '🌱'
      };
    } else if (daysElapsed <= 14) {
      return {
        stage: 2,
        name: 'Desarrollo',
        emoji: '🐣',
        color: 'from-blue-400 to-indigo-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        description: 'Formación de órganos vitales',
        details: [
          'El corazón comienza a latir (día 3-4)',
          'Se forman los ojos y el pico',
          'Desarrollo del sistema nervioso',
          'Aumento del consumo de oxígeno',
          'Los vasos sanguíneos son visibles'
        ],
        progress: ((daysElapsed - 7) / 7) * 100,
        icon: '❤️'
      };
    } else if (daysElapsed <= 18) {
      return {
        stage: 3,
        name: 'Maduración',
        emoji: '🥚',
        color: 'from-purple-400 to-pink-500',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-900',
        description: 'Crecimiento rápido del polluelo',
        details: [
          'El polluelo ocupa casi todo el huevo',
          'Se forma el plumón',
          'El saco vitelino se absorbe',
          'Movimientos más frecuentes',
          'Preparación para la eclosión'
        ],
        progress: ((daysElapsed - 14) / 4) * 100,
        icon: '🌟'
      };
    } else {
      return {
        stage: 4,
        name: 'Eclosión',
        emoji: '🐥',
        color: 'from-green-400 to-emerald-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        description: '¡El polluelo está listo para nacer!',
        details: [
          'El polluelo pica el cascarón desde adentro',
          'Proceso puede durar 12-24 horas',
          'No intervenir - dejar que salga solo',
          'Mantener humedad alta (65-70%)',
          '¡Pronto tendrás polluelos! 🎉'
        ],
        progress: ((daysElapsed - 18) / 3) * 100,
        icon: '🎊'
      };
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

  const daysElapsed = incubation?.days_elapsed || 0;
  const stageData = getStageData(daysElapsed);
  const daysRemaining = 21 - daysElapsed;
  const totalProgress = (daysElapsed / 21) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow sticky top-0 z-10">
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
                  Crecimiento de los Huevos
                </h1>
                <p className="text-sm text-gray-500">{incubation?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Día</p>
                <p className="text-2xl font-bold text-indigo-600">{daysElapsed}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Faltan</p>
                <p className="text-2xl font-bold text-orange-600">{daysRemaining}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Barra de Progreso General */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Progreso General
            </h2>
            <span className="text-3xl font-bold text-indigo-600">
              {totalProgress.toFixed(0)}%
            </span>
          </div>
          
          <div className="relative">
            <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${stageData.color} transition-all duration-1000 ease-out flex items-center justify-end pr-4`}
                style={{ width: `${totalProgress}%` }}
              >
                <span className="text-white font-semibold text-sm">
                  {daysElapsed} días
                </span>
              </div>
            </div>
            
            {/* Marcadores de etapas */}
            <div className="flex justify-between mt-2">
              {[0, 7, 14, 18, 21].map((day, idx) => (
                <div key={day} className="text-center">
                  <div className={`h-2 w-2 rounded-full mx-auto mb-1 ${daysElapsed >= day ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500">Día {day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Etapa Actual */}
        <div className={`${stageData.bgColor} border-2 ${stageData.borderColor} rounded-2xl p-8 mb-8 shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-6xl animate-bounce">
                {stageData.emoji}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Etapa {stageData.stage} de 4
                  </span>
                  <span className="text-2xl">{stageData.icon}</span>
                </div>
                <h2 className={`text-3xl font-bold ${stageData.textColor}`}>
                  {stageData.name}
                </h2>
                <p className="text-gray-700 mt-1">{stageData.description}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-5xl font-bold ${stageData.textColor}`}>
                {stageData.progress.toFixed(0)}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Progreso de etapa
              </p>
            </div>
          </div>

          {/* Detalles de la Etapa */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              ¿Qué está pasando ahora?
            </h3>
            <ul className="space-y-2">
              {stageData.details.map((detail, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-indigo-600 mt-1">✓</span>
                  <span className="text-gray-700">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Visualización de Huevos */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-indigo-600" />
            Tus {incubation?.number_of_eggs} Huevos
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: incubation?.number_of_eggs || 12 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div 
                  className={`
                    relative w-20 h-24 rounded-full bg-gradient-to-br ${stageData.color}
                    flex items-center justify-center shadow-lg
                    transform hover:scale-110 transition-all duration-300
                    animate-pulse
                  `}
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    animationDuration: '2s'
                  }}
                >
                  <span className="text-3xl">{stageData.emoji}</span>
                  
                  {/* Efecto de "latido" para etapa 2+ */}
                  {stageData.stage >= 2 && (
                    <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75"></div>
                  )}
                  
                  {/* Efecto de "movimiento" para etapa 3+ */}
                  {stageData.stage >= 3 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    </div>
                  )}
                  
                  {/* Grietas para etapa 4 */}
                  {stageData.stage === 4 && (
                    <div className="absolute inset-0">
                      <div className="absolute top-1/4 left-1/2 w-0.5 h-8 bg-gray-800 transform -rotate-45"></div>
                      <div className="absolute top-1/3 right-1/3 w-0.5 h-6 bg-gray-800 transform rotate-12"></div>
                    </div>
                  )}
                </div>
                
                <span className="text-sm text-gray-500 mt-2">Huevo {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Línea de Tiempo */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Línea de Tiempo del Desarrollo
          </h2>

          <div className="space-y-6">
            {[
              { days: '1-7', title: 'Calentamiento Inicial', emoji: '🥚', desc: 'Formación del embrión', active: daysElapsed <= 7 },
              { days: '8-14', title: 'Desarrollo', emoji: '❤️', desc: 'Corazón late, órganos se forman', active: daysElapsed > 7 && daysElapsed <= 14 },
              { days: '15-18', title: 'Maduración', emoji: '🌟', desc: 'Crecimiento rápido, plumón', active: daysElapsed > 14 && daysElapsed <= 18 },
              { days: '19-21', title: 'Eclosión', emoji: '🐥', desc: '¡Nacimiento del polluelo!', active: daysElapsed > 18 },
            ].map((stage, idx) => (
              <div 
                key={idx} 
                className={`
                  flex items-center space-x-4 p-4 rounded-xl transition-all
                  ${stage.active 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-md' 
                    : 'bg-gray-50 border-2 border-gray-200'
                  }
                `}
              >
                <div className={`text-4xl ${stage.active ? 'animate-bounce' : 'opacity-50'}`}>
                  {stage.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{stage.title}</span>
                    <span className="text-sm text-gray-500">• Días {stage.days}</span>
                    {stage.active && (
                      <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">
                        Actual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{stage.desc}</p>
                </div>
                {stage.active && (
                  <Heart className="h-6 w-6 text-red-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 mt-8 text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Zap className="h-6 w-6 mr-2" />
            Consejos para esta Etapa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">🌡️ Temperatura</p>
              <p className="text-sm opacity-90">
                Mantener entre 37.0°C y 37.8°C constantemente
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">💧 Humedad</p>
              <p className="text-sm opacity-90">
                {stageData.stage < 4 ? '50-60% durante desarrollo' : '65-70% para eclosión'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">🔄 Volteo</p>
              <p className="text-sm opacity-90">
                {stageData.stage < 4 ? 'Cada 4 horas hasta el día 18' : 'NO voltear después del día 18'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">👀 Observación</p>
              <p className="text-sm opacity-90">
                Revisa alertas y mantén condiciones estables
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EggGrowth;