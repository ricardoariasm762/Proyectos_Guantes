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

5. **🖐️ Simulación Interactiva Háptica (Drag & Drop):**
   - Espacio de trabajo delimitado por **Campo Quirúrgico Estéril** (zona segura esmeralda) y **Borde Contaminado / Suelo** (zonas de peligro carmesí).
   - Arrastre fluido con **@dnd-kit/core** de guantes e insumos.
   - Detección inmediata de colisiones asépticas con retroalimentación sonora sintetizada mediante **Web Audio API** (sin dependencias de archivos externos).
   - Cálculo de porcentaje de precisión en tiempo real.

6. **🏆 Modo Desafío (Evaluación Contrarreloj):**
   - Examen práctico con cuenta regresiva de **5:00 minutos**.
   - Escenarios clínicos de toma de decisión rápida sin ayudas visuales.
   - Cálculo ponderado con bonificación de velocidad y penalizaciones por contaminación.
   - **Leaderboard local** con el cuadro de honor de las mejores marcas del estudiante.

7. **👤 Perfil del Estudiante e Historial Editable:**
   - Ficha del estudiante con opción de modificación de nombre, semestre y grupo.
   - Historial detallado con filtros por modalidad (`Guiado`, `Simulación`, `Desafío`).
   - Capacidad de eliminar intentos individuales y reinicio general del progreso con confirmación.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Núcleo Frontend** | React 19, TypeScript, Vite |
| **Enrutamiento** | React Router DOM v7 |
| **Estado Global y Persistencia** | Zustand con middleware `persist` (`localStorage`) |
| **Gráficos 3D** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **Interactividad Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/utilities` |
| **Visualización de Datos** | Recharts (Responsive Area Chart) |
| **Formularios y Validación** | React Hook Form, Zod, `@hookform/resolvers` |
| **Audio Feedback** | Web Audio API (sintetizador de frecuencias C5/E5/G5 y buzzer) |
| **Iconografía y Estética** | Lucide React, Paleta Médica Salud UCC (#023E8A, #0077B6, #00B4D8, #CAF0F8) |

---

## 📁 Estructura del Código

```text
herramienta-guantes/
├── public/
│   └── favicon.svg
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
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── ProgressBar.tsx
│   │       └── StatCard.tsx
│   ├── data/
│   │   ├── erroresComunes.ts
│   │   ├── pasosTecnica.ts
│   │   └── zonasSensibles.ts
│   ├── hooks/
│   │   └── useTimer.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── ModoDesafio.tsx
│   │   ├── Perfil.tsx
│   │   ├── PracticaGuiada.tsx
│   │   ├── SimulacionInteractiva.tsx
│   │   └── Tutorial3D.tsx
│   ├── store/
│   │   ├── useAuthStore.ts
│   │   ├── usePracticaStore.ts
│   │   └── useProgresoStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── puntuacion.ts
│   │   └── sound.ts
│   ├── App.tsx
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

## 🔮 Hoja de Ruta para Integraciones Futuras

### 1. Integración con Backend (Firebase)
- **Firebase Authentication:**
  - Sustituir la función `login()` de `useAuthStore` por `signInWithEmailAndPassword` o autenticación institucional vía Google Workspace UCC.
  - Manejo de roles: `estudiante` y `docente_evaluador`.
- **Cloud Firestore:**
  - Crear colección `intentos_practica` para almacenar de forma centralizada los intentos de cada estudiante.
  - Sincronización en tiempo real con `onSnapshot` para que los docentes consulten el tablero analítico de la cohorte.

### 2. Integración con Visión por Computador (Google MediaPipe Hands)
- **Detección por Cámara Web:**
  - El simulador ya cuenta con la arquitectura modular preparada para recibir landmarks de manos.
  - Integrar `@mediapipe/tasks-vision` para capturar los 21 puntos anatómicos clave de las manos en vivo.
  - Detección de altura relativa: validar que las muñecas y dedos no desciendan por debajo del límite de la cintura ni de los codos.
  - Detección de proximidad: calcular la distancia euclidiana entre el pulgar dominante y la piel de la muñeca contralateral para alertar de contaminación en tiempo real antes de tocar.

---

## 👥 Equipo de Investigación y Créditos
- **Proyecto de Grado:** Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos mediante el uso de una herramienta digital interactiva en estudiantes de enfermería.
- **Universidad:** Universidad Cooperativa de Colombia — Campus Pasto.
- **Año:** 2025 / 2026.
