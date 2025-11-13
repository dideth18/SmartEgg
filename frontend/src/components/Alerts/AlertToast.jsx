// frontend/src/components/Alerts/AlertToast.jsx
import { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const AlertToast = ({ alert, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto cerrar después de 5 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          textColor: 'text-red-900',
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-900',
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        };
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-900',
          icon: <Info className="h-5 w-5 text-blue-600" />,
        };
    }
  };

  const config = getSeverityConfig(alert.severity);

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} 
        border-l-4 rounded-lg shadow-lg p-4 mb-3
        animate-slide-in-right
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {config.icon}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${config.textColor}`}>
              {alert.title}
            </h4>
            <p className="text-sm text-gray-700 mt-1">
              {alert.message}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(alert.created_at).toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AlertToast;