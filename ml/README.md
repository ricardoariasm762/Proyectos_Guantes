# Módulo de Entrenamiento del Modelo de Inteligencia Artificial (TF.js)

**Proyecto:** *Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos mediante el uso de una herramienta digital interactiva en estudiantes de enfermería*  
**Institución:** Universidad Cooperativa de Colombia - Campus Pasto.

---

## 1. Requisitos Previos

Asegúrate de contar con Python 3.10 o superior instalado en tu sistema. Se recomienda crear un entorno virtual:

```bash
# Crear entorno virtual
python -m venv venv

# Activar en Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Activar en Linux/macOS:
source venv/bin/activate
```

Instala las dependencias necesarias:
```bash
pip install -r ml/requirements.txt
```

---

## 2. Flujo de Trabajo

### Paso 1: Recolección de Datos en la Aplicación Web
1. Inicia el frontend con `npm run dev`.
2. Ingresa a la sección **Recolector IA** (`/recolector`).
3. Para cada una de las 9 clases:
   - Selecciona la etiqueta en el desplegable.
   - Posiciona las manos frente a la cámara.
   - Presiona **"Grabar 5s"** para capturar ~100 frames a 20 FPS.
   - Repite con al menos **3 personas diferentes** y variando iluminación/distancia hasta alcanzar mínimo **200 muestras por clase** (1,800 muestras totales).
4. Haz clic en **"Exportar dataset.json"**.
5. Mueve el archivo descargado a la carpeta `ml/dataset.json`.

---

### Paso 2: Ejecutar el Entrenamiento del Modelo
Ejecuta el script:
```bash
python ml/train_model.py
```

O con parámetros personalizados:
```bash
python ml/train_model.py --dataset ml/dataset.json --epochs 60 --batch-size 32
```

> **Nota:** Si ejecutas el script antes de recolectar datos reales, el script detectará la ausencia de `dataset.json` y generará un dataset de calibración sintético inicial para permitir probar el pipeline de extremo a extremo.

---

### Paso 3: Resultados y Exportación
Al finalizar el entrenamiento, el script:
1. Divide el dataset en **80% Entrenamiento y 20% Prueba** estratificado.
2. Muestra el reporte de clasificación (Precision, Recall, F1-Score).
3. Genera gráficos para tu tesis:
   - `ml/training_metrics.png`: Curvas de evolución de precisión (Accuracy) y pérdida (Loss).
   - `ml/confusion_matrix.png`: Matriz de confusión multiclase (9x9).
4. Exporta el modelo convertido a TensorFlow.js directamente en la carpeta:
   ```
   public/modelo_tfjs/
   ├── model.json               # Topología de la red neuronal
   ├── group1-shard1of1.bin     # Pesos sinápticos cuantizados
   └── labels.json              # Lista ordenada de las 9 clases
   ```

Una vez exportado, el frontend de React cargará el modelo en tiempo real automáticamente al ingresar a la simulación por cámara.
