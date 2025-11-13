// SmartEgg - Código ESP32
// Sistema Inteligente de Incubación de Huevos

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP32Servo.h>

// ==================== CONFIGURACIÓN ====================

// WiFi
const char* WIFI_SSID = "TU_WIFI_AQUI";          // Cambiar
const char* WIFI_PASSWORD = "TU_PASSWORD_AQUI";   // Cambiar

// Backend API
const char* API_URL = "http://TU_IP_PC:3000/api/sensors/data";  // Cambiar TU_IP_PC
const char* API_KEY = "smartegg_esp32_key";
int INCUBATION_ID = 1;  // ID de tu incubación (obtener del backend)

// Pines
#define DHT_PIN 4
#define MQ135_PIN 34
#define TRIG_PIN 5
#define ECHO_PIN 18
#define RELAY_PIN 19
#define SERVO_PIN 23
#define MOTOR_IN1 25
#define MOTOR_IN2 26
#define LED_PIN 2

// Configuración DHT
#define DHT_TYPE DHT11  // Cambiar a DHT22 si usas ese sensor
DHT dht(DHT_PIN, DHT_TYPE);

// Servo
Servo servoMotor;
int servoPosition = 0;

// Intervalos de tiempo (milisegundos)
const unsigned long SENSOR_INTERVAL = 60000;      // Leer sensores cada 1 minuto
const unsigned long EGG_TURN_INTERVAL = 14400000; // Voltear huevos cada 4 horas
const unsigned long WIFI_CHECK_INTERVAL = 30000;  // Verificar WiFi cada 30 segundos

// Variables de control
unsigned long lastSensorRead = 0;
unsigned long lastEggTurn = 0;
unsigned long lastWifiCheck = 0;

// Estados de actuadores
bool heaterActive = false;
bool ventilationActive = false;

// Configuración de temperatura (rango ideal)
const float TEMP_MIN = 37.0;
const float TEMP_MAX = 37.8;
const int HUMIDITY_MIN = 50;
const int HUMIDITY_MAX = 60;
const int GAS_THRESHOLD = 300;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║   🐣 SmartEgg - Sistema de Incubación ║");
  Serial.println("║        ESP32 IoT Controller           ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.println();

  // Configurar pines
  pinMode(LED_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_IN2, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);

  // Estado inicial de actuadores
  digitalWrite(RELAY_PIN, LOW);  // Relay apagado (calefactor OFF)
  digitalWrite(MOTOR_IN1, LOW);  // Motor apagado
  digitalWrite(MOTOR_IN2, LOW);
  digitalWrite(LED_PIN, LOW);

  // Inicializar sensores
  dht.begin();
  Serial.println("✓ Sensor DHT11 inicializado");

  // Inicializar servo
  servoMotor.attach(SERVO_PIN);
  servoMotor.write(0);
  Serial.println("✓ Servo motor inicializado");

  // Conectar a WiFi
  connectWiFi();

  Serial.println("\n✅ Sistema inicializado correctamente");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ==================== LOOP PRINCIPAL ====================

void loop() {
  unsigned long currentMillis = millis();

  // Verificar conexión WiFi periódicamente
  if (currentMillis - lastWifiCheck >= WIFI_CHECK_INTERVAL) {
    checkWiFiConnection();
    lastWifiCheck = currentMillis;
  }

  // Leer sensores y enviar datos al backend
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    readAndSendSensors();
    lastSensorRead = currentMillis;
  }

  // Voltear huevos automáticamente cada 4 horas
  if (currentMillis - lastEggTurn >= EGG_TURN_INTERVAL) {
    turnEggs();
    lastEggTurn = currentMillis;
  }

  // Control automático de temperatura
  automaticTemperatureControl();

  // Parpadeo LED para indicar que está activo
  blinkStatusLED();

  delay(100);
}

// ==================== FUNCIONES WiFi ====================

void connectWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi conectado!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ No se pudo conectar a WiFi");
    Serial.println("   Reintentando en 30 segundos...");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi desconectado. Reconectando...");
    connectWiFi();
  }
}

// ==================== FUNCIONES DE SENSORES ====================

void readAndSendSensors() {
  Serial.println("\n📊 Leyendo sensores...");
  
  // Leer DHT11 (temperatura y humedad)
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Leer sensor de gas MQ-135
  int gasLevel = analogRead(MQ135_PIN);
  
  // Leer nivel de agua (HC-SR04)
  String waterLevel = readWaterLevel();
  
  // Verificar lecturas válidas
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("✗ Error leyendo DHT11");
    temperature = 0;
    humidity = 0;
  }

  // Mostrar en consola
  Serial.println("┌─────────────────────────────────┐");
  Serial.print("│ Temperatura: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("│ Humedad:     "); Serial.print(humidity); Serial.println(" %");
  Serial.print("│ Gas (MQ135): "); Serial.println(gasLevel);
  Serial.print("│ Nivel Agua:  "); Serial.println(waterLevel);
  Serial.println("└─────────────────────────────────┘");

  // Enviar al backend
  sendDataToBackend(temperature, humidity, gasLevel, waterLevel);

  // Control automático basado en lecturas
  controlVentilation(gasLevel);
}

String readWaterLevel() {
  // Enviar pulso ultrasónico
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Medir tiempo de retorno
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  // Calcular distancia en cm
  float distance = duration * 0.034 / 2;
  
  // Clasificar nivel de agua
  if (distance < 5) return "Alto";
  else if (distance < 10) return "Medio";
  else return "Bajo";
}

// ==================== ENVÍO DE DATOS AL BACKEND ====================

void sendDataToBackend(float temperature, float humidity, int gasLevel, String waterLevel) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi no conectado. No se puede enviar datos.");
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  // Crear JSON con los datos
  StaticJsonDocument<256> doc;
  doc["incubationId"] = INCUBATION_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["gasLevel"] = gasLevel;
  doc["waterLevel"] = waterLevel;
  doc["apiKey"] = API_KEY;

  String jsonData;
  serializeJson(doc, jsonData);

  Serial.println("\n📤 Enviando datos al backend...");
  Serial.println(jsonData);

  // Enviar POST
  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("✓ Respuesta del servidor (");
    Serial.print(httpResponseCode);
    Serial.println("):");
    Serial.println(response);
  } else {
    Serial.print("✗ Error en la petición: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// ==================== CONTROL AUTOMÁTICO ====================

void automaticTemperatureControl() {
  float temperature = dht.readTemperature();
  
  if (isnan(temperature)) return;

  // Si temperatura está baja, encender calefactor
  if (temperature < TEMP_MIN && !heaterActive) {
    digitalWrite(RELAY_PIN, HIGH);
    heaterActive = true;
    Serial.println("🔥 Calefactor ENCENDIDO");
  }
  
  // Si temperatura está alta, apagar calefactor
  if (temperature > TEMP_MAX && heaterActive) {
    digitalWrite(RELAY_PIN, LOW);
    heaterActive = false;
    Serial.println("❄️  Calefactor APAGADO");
  }
}

void controlVentilation(int gasLevel) {
  // Si el nivel de gas es alto, activar ventilación
  if (gasLevel > GAS_THRESHOLD && !ventilationActive) {
    digitalWrite(MOTOR_IN1, HIGH);
    digitalWrite(MOTOR_IN2, LOW);
    ventilationActive = true;
    Serial.println("💨 Ventilación ACTIVADA (gas elevado)");
  }
  
  // Si el gas está normal, apagar ventilación
  if (gasLevel < GAS_THRESHOLD && ventilationActive) {
    digitalWrite(MOTOR_IN1, LOW);
    digitalWrite(MOTOR_IN2, LOW);
    ventilationActive = false;
    Serial.println("✓ Ventilación DESACTIVADA");
  }
}

// ==================== VOLTEO DE HUEVOS ====================

void turnEggs() {
  Serial.println("\n🔄 Volteando huevos...");
  
  // Voltear servo a 45°
  servoMotor.write(45);
  delay(1000);
  
  // Volver a posición original
  servoMotor.write(0);
  delay(1000);
  
  Serial.println("✓ Huevos volteados exitosamente");
  
  // Notificar al backend
  notifyEggTurn();
}

void notifyEggTurn() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String("http://") + String(API_URL).substring(7, String(API_URL).indexOf("/api")) + 
               "/api/actuators/" + String(INCUBATION_ID) + "/turn";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<64> doc;
  doc["apiKey"] = API_KEY;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode > 0) {
    Serial.println("✓ Volteo registrado en el backend");
  }
  
  http.end();
}

// ==================== UTILIDADES ====================

void blinkStatusLED() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  if (millis() - lastBlink >= 2000) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastBlink = millis();
  }
}

// ==================== FUNCIONES DE DEBUG ====================

void printSystemStatus() {
  Serial.println("\n═══════════ ESTADO DEL SISTEMA ═══════════");
  Serial.print("WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Conectado" : "Desconectado");
  Serial.print("Calefactor: ");
  Serial.println(heaterActive ? "ON" : "OFF");
  Serial.print("Ventilación: ");
  Serial.println(ventilationActive ? "ON" : "OFF");
  Serial.print("Temperatura: ");
  Serial.print(dht.readTemperature());
  Serial.println(" °C");
  Serial.print("Humedad: ");
  Serial.print(dht.readHumidity());
  Serial.println(" %");
  Serial.println("════════════════════════════════════════════\n");
}
