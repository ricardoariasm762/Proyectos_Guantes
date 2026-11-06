# Herramienta Digital Guantes — Simulador de Técnica Estéril

> **Proyecto de Grado:** *"Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos mediante el uso de una herramienta digital interactiva en estudiantes de enfermería"*  
> **Institución:** Universidad Cooperativa de Colombia — Campus Pasto  
> **Programas:** Ingeniería de Software • Enfermería  

---

## 1. Descripción del Producto

**Herramienta Digital Guantes** es una Aplicación Web Progresiva (**PWA**) orientada al entrenamiento, práctica autónoma y evaluación formativa de la **técnica abierta de postura de guantes quirúrgicos estériles** (protocolo clínico de 6 pasos).

El sistema combina:
- **Práctica Guiada paso a paso** con secuencia animada de 78 fotogramas clínicos precacheados para uso sin conexión tras la primera visita.
- **Simulación por Cámara en Tiempo Real** 100 % en el navegador (privacidad total: ningún fotograma ni video sale del dispositivo), extrayendo 21 puntos anatómicos por mano con MediaPipe Hands y evaluando la postura mediante un motor determinista de reglas clínicas y, opcionalmente, un clasificador neuronal en TensorFlow.js.
- **Simulación Interactiva 2D (Drag & Drop)** y **Modo Desafío contrarreloj** para reforzar zonas estériles y contaminadas.
- **Seguimiento Docente (`/docente`)** y **Administración (`/admin/usuarios`, `/admin/modelos-ia`, `/recolector`)** conectados a la API REST en Spring Boot.

---

## 2. Pila Tecnológica Real

| Capa | Tecnologías |
| :--- | :--- |
| **Núcleo UI** | React 19, TypeScript 6, Vite 8 |
| **Aplicación Web Progresiva (PWA)** | `vite-plugin-pwa` 2 + Workbox (`generateSW`, precaché offline y `NetworkOnly` en `/api/**`) |
| **Estado Global** | Zustand 5 (`useAuthStore`, `usePracticaStore`, `useProgresoStore`) |
| **Enrutamiento y Guardias RBAC** | React Router DOM 7 (`ESTUDIANTE`, `DOCENTE`, `ADMIN`) |
| **Visión por Computador** | `@mediapipe/tasks-vision` (`HandLandmarker` WebAssembly / WebGL) |
| **Aprendizaje Automático en Cliente** | `@tensorflow/tfjs` 4.22 (`LayersModel` sobre vector biomecánico de 79 características) |
| **Animaciones e Interacción** | GSAP 3 + ScrollTrigger, Framer Motion, `@dnd-kit/core` |
| **Visualización y Formularios** | Recharts 3, React Hook Form 7, Zod 3, Lucide React |
| **Comunicación HTTP** | Axios con interceptor JWT Bearer |
| **Pruebas y Cobertura** | Vitest 5 + `@vitest/coverage-v8` |
| **Pipeline de Entrenamiento Offline** | Python 3, TensorFlow/Keras, `tensorflowjs`, `scikit-learn`, `matplotlib` (`ml/`) |

---

## 3. Requisitos Previos

- **Node.js** `>= 20.x` y **npm** `>= 10.x`.
- **Backend activo** (`guantes-backend` en `http://localhost:8080`) para autenticación JWT, registro de intentos y seguimiento docente.
- Cámara web funcional (únicamente para los módulos `/simulacion-camara` y `/recolector`).
- *(Opcional, solo para reentrenar el modelo en `ml/`)*: **Python** `3.10`–`3.12` con entorno virtual (`venv`).

---

## 4. Variables de Entorno

Copia el archivo `.env.example` a `.env` en la raíz del proyecto para personalizar tu entorno local:

```bash
cp .env.example .env
```

| Variable | Valor por defecto | Descripción |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8080` | URL base del backend Spring Boot (sin barra final). |
| `VITE_USAR_MODELO_IA` | `false` | Controla si se carga el modelo neuronal de TensorFlow.js (`"true"`) o si evalúan únicamente las reglas clínicas (`"false"`). |

> Nunca subas archivos `.env` con credenciales o rutas privadas al repositorio.

---

## 5. Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar servidor de desarrollo con recarga en caliente (http://localhost:5173)
npm run dev

# 3. Compilar versión de producción (TypeScript + Vite + Service Worker PWA)
npm run build

# 4. Previsualizar compilación de producción localmente
npm run preview
```

---

## 6. Comandos de Prueba y Cobertura

```bash
# Ejecutar todas las pruebas unitarias una vez
npm test
# equivalente directo:
npx vitest run

# Ejecutar pruebas con reporte de cobertura v8 sobre src/utils/
npm run test:coverage
```

La suite verifica:
- Reglas biomecánicas de los 6 pasos y sus casos límite (`src/utils/validacionTecnica.ts` y `src/utils/umbralesClinicos.ts`).
- Las 5 ramas de arbitraje de validación híbrida (`src/utils/validacionHibrida.ts`).
- Extracción del vector de 79 características e invariancia a traslación y escalado (`src/utils/features.ts`).
- Suavizado EMA, fórmulas de puntuación, agregación docente y telemetría en `usePracticaStore`.

---

## 7. Cómo Activar o Desactivar la IA

El simulador soporta dos modos de evaluación postural en cámara, visibles mediante una etiqueta discreta en la barra superior del simulador:

1. **Evaluación por reglas clínicas (`VITE_USAR_MODELO_IA=false` — modo por defecto):**
   - `iaService.ts` omite la descarga de `public/modelo_tfjs/model.json`.
   - `validacionHibrida.ts` delega el 100 % de las decisiones al motor geométrico determinista (`validacionTecnica.ts`).
   - Recomendado mientras el modelo neuronal disponible provenga de datos sintéticos.

2. **Evaluación híbrida (`VITE_USAR_MODELO_IA=true`):**
   - Carga el modelo TensorFlow.js desde `public/modelo_tfjs/` y fusiona sus predicciones (umbrales de confianza `0.60` y `0.65`) con el motor de reglas clínicas.
   - Recomendado únicamente tras exportar un modelo entrenado con muestras reales recolectadas de múltiples estudiantes.

---

## 8. Cómo Reentrenar el Modelo (`ml/`)

El directorio `ml/` contiene el flujo reproducible para entrenar y exportar el clasificador de 9 clases (`6` pasos correctos + `3` errores críticos de contaminación):

1. **Recolectar muestras reales:** Inicia sesión con rol `ADMIN`, abre `/recolector`, captura sesiones identificando a cada participante en el campo `persona` (se exigen **al menos 3 personas distintas** para garantizar partición estricta por sujeto sin fuga de datos entre entrenamiento, validación y prueba) y coloca el archivo exportado en `ml/dataset.json`.
2. **Crear entorno virtual e instalar dependencias:**
   ```bash
   python -m venv ml/.venv
   # En Linux / macOS:
   ml/.venv/bin/pip install -r ml/requirements.txt
   # En Windows PowerShell:
   ml\.venv\Scripts\pip install -r ml/requirements.txt
   ```
3. **Ejecutar el entrenamiento:**
   ```bash
   # Entrenamiento con datos reales (ml/dataset.json obligatorio, >= 3 personas)
   ml/.venv/bin/python ml/train_model.py --dataset ml/dataset.json

   # Modo explícito de prueba con datos sintéticos (marca origen="sintetico" en model.json)
   ml/.venv/bin/python ml/train_model.py --sintetico
   ```
4. **Artefactos generados:**
   - Modelo web exportado en `public/modelo_tfjs/` (`model.json` y pesos `.bin`).
   - Reportes de evaluación por persona en `ml/reportes/`: `metricas_evaluacion.json`, `metricas_evaluacion.csv` y `matriz_confusion.png`.

---

## 9. Despliegue en AWS (CloudFront + S3 + EC2 + RDS)

La aplicación se encuentra lista para producción en **Amazon Web Services (AWS)** bajo un único dominio HTTPS seguro servido por **Amazon CloudFront**:

- **Distribución CloudFront (*.cloudfront.net):** Centraliza el tráfico bajo HTTPS obligatorio con HTTP/2 y HTTP/3.
  - Comportamiento por defecto (`/*`): Conecta al **Bucket S3 privado** mediante **Origin Access Control (OAC)** con firma SigV4, entregando la PWA y los modelos de IA. Incluye una **CloudFront Function** para el enrutamiento de rutas SPA (`/index.html`) sin reescribir archivos estáticos ni endpoints de la API.
  - Comportamientos dinámicos (`/api/*`, `/swagger-ui/*`, `/v3/api-docs*`, `/actuator/*`): Enrutan directamente a la API Spring Boot en **Amazon EC2** (`t3.small`) en el puerto 8080 con política `CachingDisabled` y paso de cabeceras.
  - Encabezados de seguridad perimetrales: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy: camera=(self)` (esencial para la captura de video de MediaPipe sin advertencias del navegador).

> [!NOTE]
> **Migración desde Vercel**: El archivo `vercel.json` original fue trasladado a [docs/despliegue/legado/vercel.json](file:///c:/Proyecto_grado/Proyectos_Guantes/docs/despliegue/legado/vercel.json) con fines históricos y para evitar conflictos o duplicidad de enrutamiento con la función de CloudFront.

Para la guía paso a paso completa con comandos de AWS CLI, diagramas, costos y preguntas frecuentes para la sustentación, consulta:
👉 **[Guía Integral de Despliegue en AWS](file:///c:/Proyecto_grado/Proyectos_Guantes/docs/despliegue/DESPLIEGUE_AWS.md)**.

---

## 10. Estructura de Carpetas

```text
Proyectos_Guantes/
├── .github/
│   └── workflows/                # Flujo de despliegue continuo (deploy.yml con OIDC)
├── docs/
│   ├── despliegue/
│   │   ├── DESPLIEGUE_AWS.md     # Guía integral de despliegue en AWS (CloudFront + S3 + EC2 + RDS)
│   │   └── legado/
│   │       └── vercel.json       # Configuración histórica de Vercel archivada
│   └── testing/                  # Plan de pruebas, casos, resultados, bugs y evidencias E2E
├── infra/
│   └── aws/
│       ├── frontend.yaml         # Infraestructura como Código (CloudFormation S3 + CloudFront + OAC)
│       ├── github-oidc.yaml      # Configuración de IAM OIDC para GitHub Actions
│       └── scripts/              # Scripts de automatización (desplegar-infra-frontend, publicar-frontend)
├── ml/
│   ├── train_model.py            # Entrenamiento agrupado por persona y generación de reportes
│   └── requirements.txt          # Dependencias de Python para entrenamiento offline
├── public/
│   ├── frames/v2/                # 78 fotogramas WebP 1920x1080 del tutorial (ver scripts/generar-fotogramas.ps1)
│   ├── models/                   # Tarea MediaPipe (hand_landmarker.task)
│   ├── modelo_tfjs/              # Modelo TensorFlow.js (model.json + shards binarios)
│   ├── wasm/                     # Binarios WebAssembly de MediaPipe Tasks Vision
│   └── pwa-*.png                 # Íconos de instalación PWA (192, 512 y maskable)
├── src/
│   ├── components/               # Componentes UI, layout, guardias de ruta y simulador de cámara
│   ├── data/                     # Protocolo clínico de los 6 pasos (pasosTecnica.ts)
│   ├── hooks/                    # Hooks de cámara, seguimiento MediaPipe, validación IA y temporizador
│   ├── pages/                    # Vistas por rol (Login, Dashboard, Práctica, Simulación, Desafío, Docente, Admin)
│   ├── services/                 # Clientes REST Axios (auth, intentos, progreso, docente, usuarios, IA)
│   ├── store/                    # Stores Zustand y pruebas unitarias de estado
│   ├── types/                    # Contratos TypeScript de dominio, MediaPipe e IA
│   └── utils/                    # Geometría 3D, umbrales clínicos, reglas, fusión híbrida, features y pruebas
├── .env.example                  # Plantilla de variables de entorno
└── vite.config.ts                # Configuración de Vite 8 y vite-plugin-pwa (Workbox)
```

