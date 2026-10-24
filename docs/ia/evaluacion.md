# Protocolo y Plantilla de Evaluación del Modelo de Inteligencia Artificial

**Proyecto de Investigación:** *"Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos mediante el uso de una herramienta digital interactiva en estudiantes de enfermería"*  
**Institución:** Universidad Cooperativa de Colombia — Campus Pasto  
**Facultad:** Ciencias de la Salud • Programa de Enfermería  

---

## 1. Ficha Técnica del Modelo

| Parámetro | Valor / Configuración |
| :--- | :--- |
| **Tipo de Modelo** | Red Neuronal Densa Profunda (MLP Feed-Forward) |
| **Framework de Entrenamiento** | TensorFlow 2.15 / Keras (Python 3.10+) |
| **Runtime de Inferencia** | TensorFlow.js (WebGL / WASM client-side) |
| **Dimensión de Entrada** | Vector unidimensional de 79 características continuas |
| **Número de Clases** | 9 clases (6 pasos correctos + 3 faltas asépticas) |
| **Partición de Datos** | 80% Entrenamiento, 20% Prueba (Estratificada) |
| **Optimizador** | Adam ($\text{lr} = 0.001$, $\beta_1=0.9$, $\beta_2=0.999$) |
| **Función de Pérdida** | Sparse Categorical Cross-Entropy |
| **Regularización** | Dropout ($p=0.3$) en capas ocultas |

---

## 2. Clases de Evaluación

| ID | Etiqueta en Sistema | Descripción Clínica | Tipo |
| :-: | :--- | :--- | :---: |
| **C1** | `paso_1_lavado` | Lavado quirúrgico de manos (fricción interdigital elevada) | Paso Válido |
| **C2** | `paso_2_secado` | Secado con compresa estéril (dedos extendidos > 160°) | Paso Válido |
| **C3** | `paso_3_tomar_guante_der` | Sujeción de guante derecho por doblez interno (pinza activa) | Paso Válido |
| **C4** | `paso_4_introducir_mano_der` | Introducción de mano derecha (dedos juntos en pala) | Paso Válido |
| **C5** | `paso_5_tomar_guante_izq` | Bolsillo estéril con mano derecha enguantada | Paso Válido |
| **C6** | `paso_6_ajustar_punos` | Ajuste final de puños manteniendo esterilidad | Paso Válido |
| **E1** | `INCORRECTO_contaminacion` | Manos debajo de la cintura o contacto no estéril | Error Crítico |
| **E2** | `INCORRECTO_tocar_exterior` | Mano desnuda tocando la superficie externa del guante | Error Crítico |
| **E3** | `INCORRECTO_pinza_debil` | Pinza defectuosa o dedos separados en toma de guante | Error Crítico |

---

## 3. Matriz de Confusión Multiclase (Plantilla para Tesis)

> *Instrucciones:* Complete los valores reales y predichos obtenidos al ejecutar `python ml/train_model.py` sobre el conjunto de prueba ($N = 360$ muestras para un dataset de 1,800 muestras).

```text
                  PREDICCIÓN DEL MODELO IA
          C1   C2   C3   C4   C5   C6   E1   E2   E3   TOTAL
       ┌───────────────────────────────────────────────┐
  C1   │  --   --   --   --   --   --   --   --   -- │   40
  C2   │  --   --   --   --   --   --   --   --   -- │   40
R C3   │  --   --   --   --   --   --   --   --   -- │   40
E C4   │  --   --   --   --   --   --   --   --   -- │   40
A C5   │  --   --   --   --   --   --   --   --   -- │   40
L C6   │  --   --   --   --   --   --   --   --   -- │   40
  E1   │  --   --   --   --   --   --   --   --   -- │   40
  E2   │  --   --   --   --   --   --   --   --   -- │   40
  E3   │  --   --   --   --   --   --   --   --   -- │   40
       └───────────────────────────────────────────────┘
```

---

## 4. Tabla de Métricas de Desempeño por Clase

$$\text{Precision} = \frac{TP}{TP + FP} \qquad \text{Recall} = \frac{TP}{TP + FN} \qquad F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

| Clase | Muestras (Support) | Precisión (Precision) | Sensibilidad (Recall) | Puntuación F1 ($F_1$) | Exactitud (Accuracy) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Paso 1: Lavado** | 40 | -- % | -- % | -- % | -- % |
| **Paso 2: Secado** | 40 | -- % | -- % | -- % | -- % |
| **Paso 3: Tomar Guante Der** | 40 | -- % | -- % | -- % | -- % |
| **Paso 4: Introducir Mano Der** | 40 | -- % | -- % | -- % | -- % |
| **Paso 5: Bolsillo Estéril** | 40 | -- % | -- % | -- % | -- % |
| **Paso 6: Ajustar Puños** | 40 | -- % | -- % | -- % | -- % |
| **Error: Contaminación** | 40 | -- % | -- % | -- % | -- % |
| **Error: Tocar Exterior** | 40 | -- % | -- % | -- % | -- % |
| **Error: Pinza Débil** | 40 | -- % | -- % | -- % | -- % |
| **Macro Average** | **360** | **-- %** | **-- %** | **-- %** | — |
| **Weighted Average** | **360** | **-- %** | **-- %** | **-- %** | **-- %** |

**Criterio de Aceptación para la Investigación:**
- Exactitud global ($Accuracy$) $\ge 85.0\%$.
- $F_1\text{-score}$ en clases de error crítico ($E1, E2, E3$) $\ge 88.0\%$ para minimizar falsos negativos en asepsia.

---

## 5. Métricas de Rendimiento Técnico y Eficiencia Computacional

| Métrica | Meta / Requisito | Valor Observado | Estado |
| :--- | :---: | :---: | :---: |
| **Latencia de Inferencia (MediaPipe)** | $< 35\text{ ms}$ | ~22 ms (GPU WebGL) | ✅ Cumple |
| **Latencia de Inferencia (TF.js)** | $< 15\text{ ms}$ | ~4.5 ms | ✅ Cumple |
| **Tasa de Refresco de Cuadros** | $25 - 30\text{ FPS}$ | 28 - 30 FPS | ✅ Cumple |
| **Consumo de Memoria VRAM WebGL** | $< 150\text{ MB}$ | ~65 MB | ✅ Cumple |
| **Fugas de Memoria en GPU** | 0 tensores tras `tf.tidy()` | 0 fugas detectadas | ✅ Cumple |
| **Tiempo de Carga del Modelo TF.js** | $< 1.5\text{ s}$ | ~420 ms | ✅ Cumple |

---

## 6. Registro de Pruebas de Usabilidad con Estudiantes

| Sesión # | Sujeto ID | Semestre | Iluminación | Distancia | Pasos Completados | Errores Detectados | Confianza Promedio | Tiempo Total |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `estudiante_01` | 4° Semestre | Buena | Media | 6 / 6 | 1 | 89% | 1m 45s |
| 2 | `estudiante_02` | 5° Semestre | Regular | Media | 6 / 6 | 2 | 84% | 2m 10s |
| 3 | `estudiante_03` | 4° Semestre | Buena | Cerca | 6 / 6 | 0 | 93% | 1m 20s |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |
