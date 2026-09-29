# Simulador de Técnica Estéril 🧤

> **Proyecto de Investigación:** *"Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos mediante el uso de una herramienta digital interactiva en estudiantes de enfermería"*  
> **Institución:** Universidad Cooperativa de Colombia — Campus Pasto  
> **Facultad:** Ciencias de la Salud • Programa de Enfermería  

---

## 📋 Descripción del Proyecto

El **Simulador de Técnica Estéril** es una aplicación web interactiva y progresiva (PWA) diseñada para el entrenamiento, evaluación y consolidación de las competencias clínicas de los estudiantes de enfermería en la **técnica abierta de postura de guantes quirúrgicos**.

La herramienta proporciona una experiencia inmersiva libre de riesgos, con retroalimentación inmediata sobre la cadena aséptica, detección de zonas de contaminación y registro analítico del desempeño estudiantil.

---

## 🚀 Módulos Funcionales

1. **🔐 Autenticación Simulada y Rutas Protegidas:**
   - Validación reactiva mediante **React Hook Form** y esquemas **Zod** (nombre, semestre, grupo y credencial).
   - Persistencia de sesión en `localStorage` con middleware `persist` de **Zustand**.
   - Guardias de navegación (`ProtectedRoute`) que redirigen accesos no autorizados al login.

2. **📊 Dashboard Analítico de Desempeño:**
   - Visualización de métricas reales consolidadas: total de prácticas, porcentaje de precisión promedio, tiempo récord y racha actual de intentos sin errores.
   - Gráfico de área interactivo con **Recharts** que expone la curva de aprendizaje de los últimos 10 intentos.
   - Lista cronológica de actividad reciente con distintivos por modalidad.

3. **🧊 Tutorial 3D con Cinemática Quirúrgica:**
   - Visor 3D funcional construido con **Three.js**, **@react-three/fiber** y **@react-three/drei**.
   - Controles de cámara orbital (`OrbitControls`): rotación 360°, zoom milimétrico y paneo.
   - Animación de la técnica paso a paso con selector de velocidad (0.5x, 1x, 1.5x, 2x), reproducción/pausa y puntos de interés tridimensionales (**Hotspots 3D**) con anotaciones asépticas.

4. **📋 Práctica Guiada (Paso a Paso):**
   - Progresión secuencial estricta donde cada paso requiere verificación de criterios asépticos para desbloquear el siguiente.
   - Puntos críticos basados en normativas de la OMS y guías de enfermería quirúrgica.
   - Temporizador activo en vivo, barra de avance porcentual y registro didáctico de dudas o infracciones.
   - Cálculo automático de puntaje y celebración con confeti al finalizar.

5. **🖐️ Simulación Interactiva Háptica (Drag & Drop 2D):**
   - Espacio de trabajo delimitado por **Campo Quirúrgico Estéril** (zona segura esmeralda) y **Borde Contaminado / Suelo** (zonas de peligro carmesí).
   - Arrastre fluido con **@dnd-kit/core** de guantes e insumos.
   - Detección inmediata de colisiones asépticas con retroalimentación sonora sintetizada mediante **Web Audio API** (sin dependencias de archivos externos).
   - Cálculo de porcentaje de precisión en tiempo real.

6. **👁️ Módulo de Visión Artificial en Tiempo Real (MediaPipe Hands):**
   - **Procesamiento 100% Client-Side:** Inferencia local en WebAssembly y aceleración WebGL GPU sin envío de video a servidores externos, garantizando el principio ético de privacidad estricta.
   - **Detección Biomecánica:** Extracción y seguimiento continuo de 21 landmarks tridimensionales por mano a 30 FPS.
   - **Filtro de Suavizado SMA + EMA:** Búfer de ventana móvil ($N=5$) y Media Móvil Exponencial ($\alpha=0.65$) para eliminar el temblor (*jitter*) en la detección.
   - **Motor de Validación de 6 Pasos:** Verificación automática de lavado, secado, pinza en doblez interno, mano en pala para inserción, bolsillo estéril y ajuste simétrico de puños.
   - **Avance Automático:** Transición al siguiente paso al mantener la postura correcta durante 1.5 segundos consecutivos.
   - **Penalización por Falla Sostenida:** Registro de error cada 3.0 segundos acumulados de postura incorrecta o violación de límites.
   - **Sincronización REST con Spring Boot:** Envío automático del intento a `POST http://localhost:8080/api/intentos` con token JWT (`Authorization: Bearer`), y persistencia de respaldo en Zustand/localStorage.

7. **🏆 Modo Desafío (Evaluación Contrarreloj):**
   - Examen práctico con cuenta regresiva de **5:00 minutos**.
   - Escenarios clínicos de toma de decisión rápida sin ayudas visuales.
   - Cálculo ponderado con bonificación de velocidad y penalizaciones por contaminación.
   - **Leaderboard local** con el cuadro de honor de las mejores marcas del estudiante.

8. **👤 Perfil del Estudiante e Historial Editable:**
   - Ficha del estudiante con opción de modificación de nombre, semestre y grupo.
   - Historial detallado con filtros por modalidad (`Guiado`, `Simulación`, `Desafío`).
   - Capacidad de eliminar intentos individuales y reinicio general del progreso con confirmación.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Núcleo Frontend** | React 19, TypeScript, Vite |
| **Visión por Computador** | `@mediapipe/tasks-vision` (HandLandmarker en modo VIDEO con WebGL/CPU) |
| **Enrutamiento** | React Router DOM v7 |
| **Estado Global y Persistencia** | Zustand con middleware `persist` (`localStorage`) |
| **Backend REST & Seguridad** | Java Spring Boot (`http://localhost:8080`), Autenticación JWT Bearer |
| **Gráficos 3D** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **Interactividad Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/utilities` |
| **Visualización de Datos** | Recharts (Responsive Area Chart) |
| **Formularios y Validación** | React Hook Form, Zod, `@hookform/resolvers` |
| **Audio Feedback** | Web Audio API (sintetizador de acordes C5/E5/G5 y alarmas asépticas) |
| **Efectos Visuales** | `canvas-confetti` |
| **Iconografía y Estética** | Lucide React, Paleta Quirúrgica (#0077B6, #00B4D8, #F0F4F8, #10B981) |

---

## 📁 Estructura del Código

```text
herramienta-guantes/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── three/
│   │   │   └── SurgicalScene.tsx
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── StatCard.tsx
│   │   ├── ControlesSimulacion.tsx   # Botonera de control (Iniciar, Pausar, Reiniciar, Guardar)
│   │   ├── PanelFeedback.tsx         # Panel lateral con métricas en tiempo real y pasos
│   │   ├── SimulacionCamara.tsx      # Orquestador principal de la práctica con cámara
│   │   └── VideoCanvas.tsx           # Video en espejo + overlay de 21 landmarks en Canvas
│   ├── data/
│   │   ├── erroresComunes.ts
│   │   ├── pasosTecnica.ts           # Protocolo clínico y reglas PASOS_SIMULACION_VISION
│   │   └── zonasSensibles.ts
│   ├── hooks/
│   │   ├── useHandTracking.ts        # Ciclo de vida de MediaPipe + cámara web a 30 FPS
│   │   └── useTimer.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── ModoDesafio.tsx
│   │   ├── Perfil.tsx
│   │   ├── PracticaGuiada.tsx
│   │   ├── SimulacionCamaraPage.tsx  # Vista de simulación por visión y sync con Spring Boot
│   │   ├── SimulacionInteractiva.tsx
│   │   └── Tutorial3D.tsx
│   ├── store/
│   │   ├── useAuthStore.ts
│   │   ├── usePracticaStore.ts       # Máquina de estados en memoria (avanzarPaso, errores)
│   │   └── useProgresoStore.ts       # Historial de intentos con persistencia local
│   ├── types/
│   │   ├── index.ts
│   │   └── mediapipe.ts              # Tipos 3D, lateralidad, landmarks y validación
│   ├── utils/
│   │   ├── api.ts                   # Cliente HTTP REST con inyección de JWT Bearer
│   │   ├── geometria.ts             # Cálculos euclidianos 3D, ángulos de articulación
│   │   ├── puntuacion.ts            # Fórmulas de puntaje clínico y formateo
│   │   ├── sound.ts                 # Sintetizador Web Audio API
│   │   ├── suavizado.ts             # Filtro híbrido SMA + EMA para landmarks
│   │   └── validacionTecnica.ts     # Motor de validación de los 6 pasos
│   ├── App.tsx                      # Rutas protegidas (incluye /simulacion-camara)
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 💻 Instrucciones de Ejecución

### Prerrequisitos
- **Node.js**: v18.0.0 o superior (recomendado v20+ o v22+).
- **npm**: v9+ o superior.
- **Backend (Opcional pero recomendado)**: Spring Boot activo en `http://localhost:8080`.

### 1. Clonar o acceder al repositorio
```bash
cd c:\Proyecto_grado\Proyectos_Guantes
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible inmediatamente en `http://localhost:5173`.

### 4. Compilar para producción
```bash
npm run build
```

### 5. Ejecutar análisis estático (Linter)
```bash
npm run lint
```

---

## 🔒 Consideraciones Éticas, Privacidad y Limitaciones

### Privacidad y Protección de Datos
- **100% Local:** Todo el procesamiento de imágenes ocurre dentro de la memoria RAM del navegador del estudiante a través de WebAssembly.
- **Sin Transmisión de Video:** Ningún fotograma ni flujo de video sale del dispositivo ni se transmite a servidores externos.
- Solo los datos numéricos consolidados del intento (tiempo total, número de errores, pasos aprobados y puntaje calculado) se envían a la base de datos del proyecto de investigación.

### Limitaciones Conocidas del Modelo de Visión
1. **Condiciones de Iluminación:** Ambientes con contraluz severo o iluminación deficiente (< 100 lux) pueden provocar pérdida momentánea de landmarks (el sistema detecta esto y muestra una alerta amarilla de iluminación).
2. **Oclusión Completa:** Si una mano cubre enteramente a la otra durante un ángulo no frontal, MediaPipe puede inferir temporalmente una sola mano. Se recomienda mantener las manos elevadas y orientadas hacia la cámara.
3. **Hardware sin Aceleración WebGL:** En navegadores muy antiguos sin soporte WebGL, el detector automáticamente activa el modo CPU de respaldo, pudiendo experimentar una reducción en la tasa de FPS (el sistema adapta dinámicamente la resolución a 320x240 para compensar).

---

## 👥 Equipo de Investigación y Créditos
- **Proyecto de Grado:** Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos mediante el uso de una herramienta digital interactiva en estudiantes de enfermería.
- **Universidad:** Universidad Cooperativa de Colombia — Campus Pasto.
- **Año:** 2025 / 2026.
