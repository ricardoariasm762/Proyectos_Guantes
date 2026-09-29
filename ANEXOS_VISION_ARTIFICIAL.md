# ANEXO TÉCNICO: MÓDULO DE VISIÓN POR COMPUTADOR Y ANÁLISIS BIOMECÁNICO EN TIEMPO REAL

> **Proyecto de Investigación:** *"Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos mediante el uso de una herramienta digital interactiva en estudiantes de enfermería"*  
> **Universidad Cooperativa de Colombia — Campus Pasto**  
> **Facultad de Ciencias de la Salud • Programa de Enfermería**  
> **Autor / Investigador:** Ricardo Arias M.  

---

## 1. Fundamentación Técnica y Arquitectura

El módulo de visión artificial tiene como propósito evaluar cuantitativamente y en tiempo real la postura, separación digital y coordinación bimanual del estudiante de enfermería durante la ejecución de la técnica abierta de postura de guantes quirúrgicos estériles.

```
┌──────────────────────┐
│  Cámara Web (Local)  │ 640x480 @ 30 FPS (Modo Espejo)
└──────────┬───────────┘
           │ getUserMedia (Nativo HTML5)
           ▼
┌────────────────────────────────────────────────────────┐
│  MediaPipe Tasks Vision (Google HandLandmarker)        │
│  - WASM + WebGL GPU Acceleration (Fallback CPU)        │
│  - Detección de hasta 2 manos simultáneas              │
│  - Inferencia de 21 landmarks 3D normalizados [0.0-1.0]│
└──────────┬─────────────────────────────────────────────┘
           │ 21 Landmarks brutos
           ▼
┌────────────────────────────────────────────────────────┐
│  Filtro Híbrido de Suavizado (SMA + EMA)               │
│  - Búfer de ventana móvil temporal (N = 5 frames)      │
│  - Media Móvil Exponencial (alfa = 0.65)               │
└──────────┬─────────────────────────────────────────────┘
           │ Landmarks estabilizados
           ▼
┌────────────────────────────────────────────────────────┐
│  Motor Biomecánico de Validación (6 Pasos Clínicos)    │
│  - Distancias euclidianas 3D                           │
│  - Ángulos articulares interdigitales (MCP-PIP-TIP)    │
│  - Clasificación de gestos (Pinza, Mano en pala)       │
└──────────┬─────────────────────────────┬───────────────┘
           │ Feedback visual/auditivo    │ Estado del paso
           ▼                             ▼
┌──────────────────────┐       ┌────────────────────────┐
│  VideoCanvas Overlay │       │  Máquina de Estados    │
│  - Líneas anatómicas │       │  - Avance en 1.5s OK   │
│  - Puntos coloreados │       │  - Penalización en 3s  │
│  - Aviso privacidad  │       │  - Cronómetro activo   │
└──────────────────────┘       └─────────┬──────────────┘
                                         │ Al finalizar
                                         ▼
                               ┌────────────────────────┐
                               │  Backend Spring Boot   │
                               │  POST /api/intentos    │
                               │  Bearer JWT            │
                               └────────────────────────┘
```

---

## 2. Topología Anatómica de MediaPipe Hands (21 Puntos Clave)

Cada mano detectada provee un vector ordenado de 21 puntos normalizados $P_i = (x_i, y_i, z_i)$ donde $x, y \in [0.0, 1.0]$ y $z$ representa la profundidad relativa con respecto a la muñeca:

| Índice | Denominación Anatómica | Función en la Técnica de Guantes |
| :---: | :--- | :--- |
| **0** | Muñeca (*Wrist*) | Referencia espacial y delimitación de puño estéril |
| **1** | Pulgar CMC (*Carpometacarpal*) | Base del primer metacarpiano |
| **2** | Pulgar MCP (*Metacarpophalangeal*) | Articulación metacarpofalángica del pulgar |
| **3** | Pulgar IP (*Interphalangeal*) | Articulación interfalángica del pulgar |
| **4** | Pulgar TIP (*Thumb Tip*) | Vértice de pinza para sujeción del doblez |
| **5** | Índice MCP | Base del nudillo índice |
| **6** | Índice PIP | Articulación interfalángica proximal |
| **7** | Índice DIP | Articulación interfalángica distal |
| **8** | Índice TIP | Vértice de pinza para sujeción del doblez |
| **9** | Medio MCP | Nudillo medio central |
| **10** | Medio PIP | Articulación interfalángica proximal |
| **11** | Medio DIP | Articulación interfalángica distal |
| **12** | Medio TIP | Alineación de pala quirúrgica |
| **13** | Anular MCP | Nudillo anular |
| **14** | Anular PIP | Articulación interfalángica proximal |
| **15** | Anular DIP | Articulación interfalángica distal |
| **16** | Anular TIP | Alineación de pala quirúrgica |
| **17** | Meñique MCP | Nudillo del quinto dedo |
| **18** | Meñique PIP | Articulación interfalángica proximal |
| **19** | Meñique DIP | Articulación interfalángica distal |
| **20** | Meñique TIP | Borde cubital y verificación de separación |

---

## 3. Fórmulas Matemáticas Implementadas

### 3.1. Distancia Euclidiana Tridimensional
Calculada entre dos puntos anatómicos $A = (x_a, y_a, z_a)$ y $B = (x_b, y_b, z_b)$:

$$d(A, B) = \sqrt{(x_a - x_b)^2 + (y_a - y_b)^2 + (z_a - z_b)^2}$$

### 3.2. Ángulo Articular de los Dedos
Para determinar si un dedo está extendido o flexionado, se calcula el ángulo formado por tres puntos articulares consecutivos $\vec{BA} = A - B$ y $\vec{BC} = C - B$ con vértice en la articulación media $B$:

$$\cos(\theta) = \frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|}$$

$$\theta = \arccos\left(\text{clamp}\left(\cos(\theta), -1.0, 1.0\right)\right) \times \frac{180^\circ}{\pi}$$

- **Dedo Extendido:** $\theta > 160^\circ$ (dedos 2 a 5) o $\theta > 150^\circ$ (pulgar).
- **Dedo Flexionado:** $\theta < 90^\circ$.

### 3.3. Filtro Híbrido de Suavizado (SMA + EMA)
Para eliminar el temblor (*jitter*) inherente a cámaras de consumo masivo, se combinan:

1. **Media Móvil Simple (SMA) en ventana deslizante de $N=5$ frames:**
   $$\bar{P}_t = \frac{1}{N} \sum_{k=0}^{N-1} P_{t-k}$$

2. **Media Móvil Exponencial (EMA) sobre el promedio:**
   $$\hat{P}_t = \alpha \cdot \bar{P}_t + (1 - \alpha) \cdot \hat{P}_{t-1}, \quad \text{con } \alpha = 0.65$$

---

## 4. Matriz de Reglas por Paso de la Técnica Quirúrgica

| Paso | Nombre Clínico | Condición Biomecánica Evaluada | Mensaje de Retroalimentación |
| :---: | :--- | :--- | :--- |
| **1** | Lavado quirúrgico de manos | - Ambas manos en encuadre.<br>- Distancia interdigital mínima $< 0.15$. | *"Entrecruza los dedos y frota palmas y espacios interdigitales."* |
| **2** | Secado con compresa estéril | - Ambas manos en encuadre.<br>- Todos los 5 dedos extendidos en ambas manos ($\theta > 160^\circ$). | *"Mantén todos los dedos de ambas manos bien extendidos para el secado."* |
| **3** | Tomar guante derecho por doblez | - Mano izquierda en pinza ($d(4, 8) < 0.08$).<br>- Pulgar e índice extendidos. | *"Haz pinza con el pulgar e índice sobre la cara interna del doblez."* |
| **4** | Introducir mano derecha | - Dedos de mano derecha extendidos.<br>- Puntas consecutivas juntas ($d < 0.06$, pala quirúrgica). | *"Junta los dedos de la mano derecha formando una pala para no rozar el exterior."* |
| **5** | Repetir con mano izquierda (Bolsillo) | - Mano derecha enguantada en pinza / bolsillo ($d < 0.09$).<br>- Pulgar en abducción protegiendo la asepsia. | *"Introduce los dedos de la mano derecha bajo el doblez (bolsillo estéril)."* |
| **6** | Ajustar puños manteniendo esterilidad | - Ambas manos visibles.<br>- Dedos de ambas manos completamente extendidos a nivel del pecho. | *"Extiende todos los dedos para verificar el ajuste uniforme de ambos guantes."* |

---

## 5. Dinámica Temporal y Evaluación

- **Avance Automático:** El estudiante debe sostener la postura correcta durante **1.5 segundos consecutivos**. Una barra verde en el panel lateral visualiza el progreso del tiempo sostenido; al completarse, suena un acorde armónico ascendente (`soundManager.playSuccess()`) y el simulador avanza al siguiente paso.
- **Detección de Falla:** Si la postura incumple las reglas asépticas durante **3.0 segundos acumulados**, se registra automáticamente **1 error** y suena una alerta quirúrgica (`soundManager.playError()`).
- **Fórmula de Calificación:**
  $$\text{Puntaje} = \max\left(0, \text{round}\left(1000 \times \frac{\text{Pasos}}{6} - 50 \times \text{Errores} - \max(0, \text{Tiempo} - 120)\right)\right)$$

---

## 6. Integración con Backend Spring Boot

Al finalizar el paso 6, el modal de resumen expone las métricas y permite persistir el intento. La petición se envía con el estándar HTTP REST:

- **Endpoint:** `POST http://localhost:8080/api/intentos`
- **Cabeceras:** `Content-Type: application/json`, `Authorization: Bearer <jwt_token>`
- **Payload:**
  ```json
  {
    "puntaje": 950,
    "tiempoSegundos": 84,
    "errores": 1,
    "modo": "SIMULACION",
    "pasosCompletados": 6
  }
  ```
- **Tolerancia a Fallos:** Si el backend no se encuentra iniciado o no hay conectividad, el cliente captura el evento sin interrumpir la experiencia de usuario y respalda el intento en el almacenamiento local seguro del navegador (`localStorage` sincronizado con Zustand).
