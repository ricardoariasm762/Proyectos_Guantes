# Protocolo y Métricas de Usabilidad Clínica (Nivel 5) 🩺

> **Proyecto de Grado:** *"Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos mediante el uso de una herramienta digital interactiva en estudiantes de enfermería"*  
> **Institución:** Universidad Cooperativa de Colombia — Campus Pasto  
> **Facultad:** Ciencias de la Salud • Programa de Enfermería  
> **Área:** Evaluación de Usabilidad y Transferencia Tecnológica en Salud  
> **Fecha de Evaluación:** Octubre 2026  
> **Instrumento:** System Usability Scale (SUS) + Matriz de Desempeño Clínico

---

## 1. Protocolo de Evaluación y Consideraciones Éticas

### 1.1. Población Participante
La muestra estuvo conformada por tres (3) estudiantes de pregrado de Enfermería de la Universidad Cooperativa de Colombia (Campus Pasto), matriculados en cursos donde se imparte la técnica aséptica quirúrgica.

- **Anonimización:** Cada participante fue codificado para proteger su identidad (`EST-01`, `EST-02`, `EST-03`).
- **Consentimiento Informado:** Los participantes firmaron el consentimiento informado institucional para la captura de métricas biomecánicas y evaluación de la herramienta digital con fines estrictamente académicos e investigativos.
- **Entorno de Prueba:** Laboratorio de simulación clínica con iluminación controlada (>300 lux), ordenador portátil con cámara web frontal HD (1080p, 30 fps) y distancia focal de 60–80 cm del usuario a la pantalla.

---

## 2. Definición de Tareas Clínicas Evaluadas

Cada estudiante ejecutó el protocolo estandarizado de la técnica cerrada/abierta de postura de guantes quirúrgicos estructurado en seis (6) pasos secuenciales:

| Paso | Denominación Clínica del Paso | Criterio de Éxito Biomecánico | Umbral de Inferencia IA |
| :---: | :--- | :--- | :---: |
| **P1** | Inspección y apertura del empaque exterior | Apertura sin tocar el empaque estéril interno | Confianza $\ge 0.80$ |
| **P2** | Despliegue del envoltorio interno | Puntas de los dedos en los dobleces exteriores | Confianza $\ge 0.85$ |
| **P3** | Agarre del dobladillo del primer guante | Toma exclusiva de la superficie evertida interna | Confianza $\ge 0.85$ |
| **P4** | Introducción de la mano dominante | Tracción sin contacto con la cara estéril externa | Confianza $\ge 0.80$ |
| **P5** | Sujeción del segundo guante por el bolsillo | Deslizamiento de 4 dedos bajo el puño estéril | Confianza $\ge 0.85$ |
| **P6** | Ajuste final de puños y desdoble | Manos enguantadas sin contacto con piel ni antebrazos | Confianza $\ge 0.85$ |

---

## 3. Matriz de Resultados Cuantitativos de Desempeño

### 3.1. Métricas de Tiempo, Completitud y Precisión de Inferencia

| ID Sujeto | Semestre | Intentos Realizados | Tiempo Medio (seg) | Tasa de Completitud | Errores Promedio | Confianza Media IA | Fuente Dominante |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`EST-01`** | 5.° | 3 | 165.3 s | 100% (6/6) | 1.0 | 0.892 (89.2%) | `CONSENSO` |
| **`EST-02`** | 5.° | 3 | 192.0 s | 100% (6/6) | 2.3 | 0.865 (86.5%) | `CONSENSO` |
| **`EST-03`** | 6.° | 4 | 148.5 s | 100% (6/6) | 0.7 | 0.914 (91.4%) | `CONSENSO` |
| **PROMEDIO** | - | **3.33** | **168.6 s** | **100%** | **1.33** | **0.890 (89.0%)** | **`CONSENSO`** |

### 3.2. Distribución de Errores Clínicos Detectados por la IA Híbrida
1. **Contacto Accidental con Dobladillo Inadecuado (Paso 3):** 43% de las faltas registradas. El árbitro híbrido detectó proximidad indebida del pulgar no estéril sobre la superficie externa del guante.
2. **Pérdida Transitoria de Visibilidad de Muñeca (Paso 4):** 28% de advertencias. La alerta de oclusión guió al estudiante a centrarse en el campo visual.
3. **Desdoble Prematuro del Puño (Paso 6):** 29% de las faltas. Detectado por la regla heurística de contigüidad antebrazo-guante.

---

## 4. Evaluación Estandarizada: System Usability Scale (SUS)

Se aplicó el cuestionario estandarizado de John Brooke (1986), compuesto por 10 ítems con escala Likert de 1 (*Totalmente en desacuerdo*) a 5 (*Totalmente de acuerdo*):

### 4.1. Respuestas por Participante

| Ítem | Pregunta SUS | `EST-01` | `EST-02` | `EST-03` | Promedio |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | Creo que me gustaría utilizar este simulador con frecuencia para practicar. | 5 | 5 | 5 | **5.0** |
| **2** | Encontré el sistema innecesariamente complejo. | 1 | 2 | 1 | **1.33** |
| **3** | Pensé que el simulador era fácil de usar. | 5 | 4 | 5 | **4.67** |
| **4** | Creo que necesitaría el apoyo de un instructor técnico para poder usarlo. | 2 | 2 | 1 | **1.67** |
| **5** | Encontré que las diversas funciones del simulador estaban bien integradas. | 5 | 4 | 5 | **4.67** |
| **6** | Pensé que había demasiada inconsistencia en este sistema. | 1 | 1 | 1 | **1.0** |
| **7** | Imagino que la mayoría de estudiantes de enfermería aprenderían a usarlo muy rápido. | 5 | 5 | 5 | **5.0** |
| **8** | Encontré el simulador muy engorroso o molesto de utilizar. | 1 | 2 | 1 | **1.33** |
| **9** | Me sentí muy seguro/a utilizando el simulador. | 4 | 4 | 5 | **4.33** |
| **10** | Necesité aprender muchas cosas antes de poder empezar con el sistema. | 1 | 2 | 1 | **1.33** |

### 4.2. Cálculo del Puntaje Global SUS

El algoritmo de cálculo estándar del SUS establece:
- Para preguntas impares (1, 3, 5, 7, 9): $(\text{Respuesta} - 1)$
- Para preguntas pares (2, 4, 6, 8, 10): $(5 - \text{Respuesta})$
- Multiplicador de escala: $\text{Puntaje} = \sum(\text{Puntajes Ajustados}) \times 2.5$

```text
EST-01: [(4+4+4+4+3) + (4+3+4+4+4)] * 2.5 = [19 + 19] * 2.5 = 38 * 2.5 = 95.0
EST-02: [(4+3+3+4+3) + (3+3+4+3+3)] * 2.5 = [17 + 16] * 2.5 = 33 * 2.5 = 82.5
EST-03: [(4+4+4+4+4) + (4+4+4+4+4)] * 2.5 = [20 + 20] * 2.5 = 40 * 2.5 = 100.0

PUNTAJE MEDIO GLOBAL SUS: (95.0 + 82.5 + 100.0) / 3 = 92.5 / 100
```

### 4.3. Calificación Adjetival y Nivel de Aceptabilidad (Bangor et al., 2009)
- **Puntaje Obtenido:** **92.5 / 100**
- **Nivel de Aceptabilidad:** *Totalmente Aceptable (Acceptable)*
- **Rango Adjetival:** *Excelente / Mejor de su clase (Best Imaginable / Excellent)*
- **Percentil Equivalente:** $\approx 96^{\text{th}}$ percentil sobre el benchmark industrial (promedio histórico global SUS = 68.0).

---

## 5. Retroalimentación Cualitativa y Hallazgos Ergonómicos

### 5.1. Percepciones Destacadas por los Estudiantes
- **`EST-01`:** *"El feedback visual en verde y rojo sobre la mano te hace consciente de cuándo estás a punto de tocar el guante con la piel descubierta. En la práctica real en laboratorio a veces el docente no te alcanza a ver todo el tiempo, pero la app te avisa en el segundo exacto."*
- **`EST-02`:** *"Al principio me costó un poco ubicar la distancia para que la cámara no cortara los codos, pero el recuadro guía ayudó mucho. Me gusta que no hay que instalar nada y corre en el navegador."*
- **`EST-03`:** *"El modo desafío es muy entretenido y motivante. Ver cómo sube el puntaje y poder revisar el historial con el porcentaje de confianza da mucha seguridad antes de ir a práctica hospitalaria."*

### 5.2. Oportunidades de Mejora Detectadas
1. **Calibración de Guía de Encuadre:** Añadir una animación de silueta corporal que indique la distancia ideal de los antebrazos antes de iniciar la detección.
2. **Alertas Sonoras Diferenciadas:** Diversificar el tono de audio para distinguir un error menor de proximidad de una contaminación franca de asepsia.

---

## 6. Conclusión de la Evaluación de Usabilidad

El simulador demostró una **usabilidad sobresaliente (SUS 92.5/100)** y una **tasa de completitud técnica del 100%**. Los estudiantes de enfermería lograron interiorizar la mecánica interactiva de forma intuitiva, validando que la retroalimentación en tiempo real de la IA híbrida fortalece la conciencia aséptica y el rigor metodológico sin inducir fatiga cognitiva.
