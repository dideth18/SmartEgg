-- database/schema.sql
-- Schema completo para SmartEgg con PostgreSQL

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS sensor_data CASCADE;
DROP TABLE IF EXISTS actuators CASCADE;
DROP TABLE IF EXISTS incubations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    telegram_chat_id VARCHAR(100),
    notification_email BOOLEAN DEFAULT true,
    notification_telegram BOOLEAN DEFAULT false,
    notification_push BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de incubaciones
CREATE TABLE incubations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Lote sin nombre',
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_hatch_date TIMESTAMP NOT NULL,
    number_of_eggs INTEGER NOT NULL CHECK (number_of_eggs > 0),
    current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 4),
    days_elapsed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
    
    -- Configuración de temperatura
    temp_min DECIMAL(4,2) DEFAULT 37.0,
    temp_max DECIMAL(4,2) DEFAULT 37.8,
    
    -- Configuración de humedad
    humidity_min INTEGER DEFAULT 50,
    humidity_max INTEGER DEFAULT 60,
    
    -- Configuración de volteo
    turn_interval_hours INTEGER DEFAULT 4,
    
    notes TEXT,
    hatched_eggs INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de datos de sensores
CREATE TABLE sensor_data (
    id SERIAL PRIMARY KEY,
    incubation_id INTEGER NOT NULL REFERENCES incubations(id) ON DELETE CASCADE,
    temperature DECIMAL(4,2) NOT NULL,
    humidity DECIMAL(5,2) NOT NULL,
    gas_level INTEGER DEFAULT 0,
    water_level VARCHAR(10) DEFAULT 'Medio' CHECK (water_level IN ('Bajo', 'Medio', 'Alto')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX idx_sensor_data_incubation ON sensor_data(incubation_id);
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX idx_sensor_data_incubation_timestamp ON sensor_data(incubation_id, timestamp DESC);

-- Tabla de actuadores
CREATE TABLE actuators (
    id SERIAL PRIMARY KEY,
    incubation_id INTEGER NOT NULL REFERENCES incubations(id) ON DELETE CASCADE,
    heater_active BOOLEAN DEFAULT false,
    humidifier_active BOOLEAN DEFAULT false,
    ventilation_active BOOLEAN DEFAULT false,
    last_egg_turn TIMESTAMP,
    egg_turn_count INTEGER DEFAULT 0,
    manual_mode BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solo un registro de actuador por incubación
CREATE UNIQUE INDEX idx_actuators_incubation ON actuators(incubation_id);

-- Tabla de alertas
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    incubation_id INTEGER NOT NULL REFERENCES incubations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('temperature', 'humidity', 'gas', 'water', 'stage', 'system')),
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    value TEXT,
    read BOOLEAN DEFAULT false,
    sent_telegram BOOLEAN DEFAULT false,
    sent_email BOOLEAN DEFAULT false,
    sent_push BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para alertas
CREATE INDEX idx_alerts_incubation ON alerts(incubation_id);
CREATE INDEX idx_alerts_user_read ON alerts(user_id, read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en incubations
CREATE TRIGGER update_incubations_updated_at BEFORE UPDATE ON incubations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular días transcurridos y etapa actual
CREATE OR REPLACE FUNCTION update_incubation_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular días transcurridos
    NEW.days_elapsed := EXTRACT(DAY FROM (CURRENT_TIMESTAMP - NEW.start_date));
    
    -- Calcular etapa actual basada en días
    IF NEW.days_elapsed <= 7 THEN
        NEW.current_stage := 1;
    ELSIF NEW.days_elapsed <= 14 THEN
        NEW.current_stage := 2;
    ELSIF NEW.days_elapsed <= 18 THEN
        NEW.current_stage := 3;
    ELSE
        NEW.current_stage := 4;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar progreso de incubación
CREATE TRIGGER calculate_incubation_progress 
BEFORE INSERT OR UPDATE ON incubations
    FOR EACH ROW EXECUTE FUNCTION update_incubation_progress();

-- Vista para estadísticas rápidas de incubación
CREATE OR REPLACE VIEW incubation_stats AS
SELECT 
    i.id,
    i.name,
    i.user_id,
    i.days_elapsed,
    i.current_stage,
    i.status,
    i.number_of_eggs,
    i.hatched_eggs,
    21 - i.days_elapsed as days_remaining,
    ROUND((i.days_elapsed::numeric / 21) * 100, 1) as progress_percentage,
    
    -- Última lectura de sensores
    (SELECT temperature FROM sensor_data WHERE incubation_id = i.id ORDER BY timestamp DESC LIMIT 1) as current_temperature,
    (SELECT humidity FROM sensor_data WHERE incubation_id = i.id ORDER BY timestamp DESC LIMIT 1) as current_humidity,
    (SELECT water_level FROM sensor_data WHERE incubation_id = i.id ORDER BY timestamp DESC LIMIT 1) as current_water_level,
    
    -- Promedio últimas 24 horas
    (SELECT AVG(temperature) FROM sensor_data WHERE incubation_id = i.id AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as avg_temp_24h,
    (SELECT AVG(humidity) FROM sensor_data WHERE incubation_id = i.id AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as avg_humidity_24h,
    
    -- Conteo de alertas no leídas
    (SELECT COUNT(*) FROM alerts WHERE incubation_id = i.id AND read = false) as unread_alerts,
    
    -- Estado de actuadores
    (SELECT heater_active FROM actuators WHERE incubation_id = i.id LIMIT 1) as heater_active,
    (SELECT last_egg_turn FROM actuators WHERE incubation_id = i.id LIMIT 1) as last_egg_turn,
    (SELECT egg_turn_count FROM actuators WHERE incubation_id = i.id LIMIT 1) as egg_turn_count
    
FROM incubations i;

-- Insertar usuario de prueba (contraseña: password123)
-- Nota: La contraseña será hasheada en la aplicación
INSERT INTO users (email, password, name, role) VALUES 
('admin@smartegg.com', '$2a$10$XqM5nXQZxGHzQVHJvzOUZ.qLR3.LS3HYvYhB9iKHDZJZGXQMm5LYK', 'Administrador', 'admin');

-- Datos de ejemplo (opcional)
/*
INSERT INTO incubations (user_id, name, number_of_eggs, start_date, expected_hatch_date) VALUES
(1, 'Lote de Prueba 1', 12, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '16 days');

INSERT INTO sensor_data (incubation_id, temperature, humidity, gas_level, water_level) VALUES
(1, 37.5, 58, 120, 'Medio');

INSERT INTO actuators (incubation_id) VALUES (1);
*/

-- Comentarios para documentación
COMMENT ON TABLE users IS 'Usuarios del sistema SmartEgg';
COMMENT ON TABLE incubations IS 'Lotes de incubación de huevos';
COMMENT ON TABLE sensor_data IS 'Lecturas de sensores (temperatura, humedad, gas, agua)';
COMMENT ON TABLE actuators IS 'Estado de actuadores (calefactor, humidificador, ventilación)';
COMMENT ON TABLE alerts IS 'Alertas y notificaciones del sistema';

-- Mostrar resumen
SELECT 'Base de datos SmartEgg creada exitosamente!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;