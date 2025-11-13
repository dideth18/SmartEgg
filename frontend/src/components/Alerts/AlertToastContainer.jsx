// frontend/src/components/Alerts/AlertToastContainer.jsx
import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import AlertToast from './AlertToast';

const AlertToastContainer = ({ incubationId }) => {
  const { alerts } = useSocket(incubationId);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      // Agregar nuevas alertas como toasts
      const newToasts = alerts.map(alert => ({
        ...alert,
        id: `${alert.id}-${Date.now()}`, // ID único para cada toast
      }));
      setToasts(prev => [...newToasts, ...prev].slice(0, 5)); // Máximo 5 toasts
    }
  }, [alerts]);

  const handleCloseToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
      {toasts.map(toast => (
        <AlertToast
          key={toast.id}
          alert={toast}
          onClose={() => handleCloseToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default AlertToastContainer;