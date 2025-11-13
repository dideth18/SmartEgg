// frontend/src/components/Alerts/AlertBadge.jsx
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { alertAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const AlertBadge = ({ incubationId, onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { alerts } = useSocket(incubationId);

  useEffect(() => {
    loadUnreadCount();
  }, [incubationId]);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      loadUnreadCount();
      // Reproducir sonido (opcional)
      playNotificationSound();
    }
  }, [alerts]);

  const loadUnreadCount = async () => {
    try {
      const response = await alertAPI.getAll({ 
        read: false,
        incubationId 
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const playNotificationSound = () => {
    // Crear un beep simple
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio no disponible');
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition"
    >
      <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'text-red-600 animate-bounce' : 'text-gray-600'}`} />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default AlertBadge;