// frontend/src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const useSocket = (incubationId) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [actuatorData, setActuatorData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Crear conexión socket
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket conectado:', newSocket.id);
      setConnected(true);
      
      // Unirse a la sala de la incubación
      if (incubationId) {
        newSocket.emit('join-incubation', incubationId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setConnected(false);
    });

    // Escuchar actualizaciones de sensores
    newSocket.on('sensor-update', (data) => {
      console.log('📊 Datos de sensor recibidos:', data);
      setSensorData(data);
    });

    // Escuchar actualizaciones de actuadores
    newSocket.on('actuator-update', (data) => {
      console.log('🎮 Actuador actualizado:', data);
      setActuatorData(data);
    });

    // Escuchar notificación de volteo de huevos
    newSocket.on('egg-turned', (data) => {
      console.log('🔄 Huevos volteados:', data);
    });

    // Escuchar nuevas alertas
    newSocket.on('new-alert', (data) => {
      console.log('🔔 Nueva alerta:', data);
      setAlerts((prev) => [data, ...prev]);
    });

    setSocket(newSocket);

    // Cleanup al desmontar
    return () => {
      if (incubationId) {
        newSocket.emit('leave-incubation', incubationId);
      }
      newSocket.disconnect();
    };
  }, [incubationId]);

  return {
    socket,
    connected,
    sensorData,
    actuatorData,
    alerts,
  };
};