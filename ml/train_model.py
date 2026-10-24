#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de entrenamiento de Red Neuronal para clasificación de técnica de postura de guantes quirúrgicos
Exportación directa al formato TensorFlow.js para inferencia client-side en el navegador.

Proyecto de Investigación:
"Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos
mediante el uso de una herramienta digital interactiva en estudiantes de enfermería"
Universidad Cooperativa de Colombia - Campus Pasto.
"""

import os
import sys
import json
import argparse
import numpy as np
import matplotlib.pyplot as plt

# Clases oficiales del clasificador (orden estricto coincidente con TypeScript)
CLASES_OFICIALES = [
    "paso_1_lavado",
    "paso_2_secado",
    "paso_3_tomar_guante_der",
    "paso_4_introducir_mano_der",
    "paso_5_tomar_guante_izq",
    "paso_6_ajustar_punos",
    "INCORRECTO_contaminacion",
    "INCORRECTO_tocar_exterior",
    "INCORRECTO_pinza_debil",
]

NUM_FEATURES = 79


def generar_dataset_sintetico(n_muestras_por_clase=200):
    """
    Genera un dataset sintético biomecánicamente coherente para calibración
    inicial del pipeline cuando no se disponga de capturas de video previas.
    """
    print(f"[INFO] Generando dataset sintético de calibración ({n_muestras_por_clase} muestras por clase)...")
    muestras = []
    rng = np.random.RandomState(42)

    for idx_clase, nombre_clase in enumerate(CLASES_OFICIALES):
        for i in range(n_muestras_por_clase):
            # 63 coordenadas normalizadas centradas en 0 con dispersión natural
            coords = rng.normal(loc=0.0, scale=0.35, size=63)

            # 5 ángulos de dedos [0.0 - 1.0] (normalizados sobre 180°)
            if "secado" in nombre_clase or "ajustar_punos" in nombre_clase:
                angulos = rng.uniform(0.85, 1.0, size=5)  # Dedos bien extendidos (>150°)
            elif "pinza" in nombre_clase or "tomar_guante" in nombre_clase:
                angulos = np.array([
                    rng.uniform(0.80, 0.95),  # Pulgar
                    rng.uniform(0.75, 0.90),  # Índice
                    rng.uniform(0.20, 0.40),  # Medio flexionado
                    rng.uniform(0.20, 0.40),  # Anular
                    rng.uniform(0.20, 0.40),  # Meñique
                ])
            else:
                angulos = rng.uniform(0.40, 0.90, size=5)

            # 10 distancias inter-puntas
            if "pinza" in nombre_clase and "debil" not in nombre_clase:
                dist_puntas = rng.uniform(0.01, 0.07, size=10)
                dist_puntas[0] = rng.uniform(0.01, 0.05)  # Pulgar e índice muy juntos
            elif "pinza_debil" in nombre_clase:
                dist_puntas = rng.uniform(0.12, 0.35, size=10)
                dist_puntas[0] = rng.uniform(0.15, 0.30)  # Pulgar e índice separados
            else:
                dist_puntas = rng.uniform(0.05, 0.45, size=10)

            # 1 orientación de muñeca [-1.0, 1.0]
            orientacion = [rng.uniform(-0.8, 0.8)]

            vector = np.concatenate([coords, angulos, dist_puntas, orientacion]).tolist()

            muestras.append({
                "features": vector,
                "label": nombre_clase,
                "timestamp": 1700000000000 + i,
                "metadata": {
                    "persona": f"sintetico_{i % 3 + 1}",
                    "iluminacion": "buena",
                    "distancia": "media",
                }
            })

    return muestras


def cargar_datos(ruta_dataset):
    """
    Carga el dataset desde el archivo JSON exportado por el Recolector del frontend.
    """
    if not os.path.exists(ruta_dataset):
        print(f"[AVISO] No se encontró el archivo: '{ruta_dataset}'.")
        print("[AVISO] Utilizando generador sintético para inicializar el modelo...")
        muestras_raw = generar_dataset_sintetico(200)
    else:
        with open(ruta_dataset, "r", encoding="utf-8") as f:
            contenido = json.load(f)

        if isinstance(contenido, list):
            muestras_raw = contenido
        elif isinstance(contenido, dict) and "data" in contenido:
            muestras_raw = contenido["data"]
        else:
            raise ValueError(f"Formato de dataset desconocido en {ruta_dataset}")

    X = []
    y = []

    mapeo_clase_a_idx = {nombre: i for i, nombre in enumerate(CLASES_OFICIALES)}

    for item in muestras_raw:
        features = item.get("features", [])
        label = item.get("label", "")

        if len(features) == NUM_FEATURES and label in mapeo_clase_a_idx:
            X.append(features)
            y.append(mapeo_clase_a_idx[label])

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)

    print(f"[INFO] Datos cargados exitosamente: {len(X)} muestras con {NUM_FEATURES} características.")
    return X, y


def construir_modelo(num_clases=9):
    """
    Construye la arquitectura de la red neuronal feed-forward para clasificación biomecánica.
    """
    import tensorflow as tf

    modelo = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(NUM_FEATURES,), name="vector_features_79"),
        tf.keras.layers.Dense(128, activation="relu", name="capa_densa_128"),
        tf.keras.layers.Dropout(0.3, name="dropout_1"),
        tf.keras.layers.Dense(64, activation="relu", name="capa_densa_64"),
        tf.keras.layers.Dropout(0.3, name="dropout_2"),
        tf.keras.layers.Dense(num_clases, activation="softmax", name="probabilidades_clases"),
    ])

    modelo.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    return modelo


def graficar_metricas(historia, ruta_salida):
    """
    Genera gráficos de precisión y función de pérdida durante el entrenamiento.
    """
    plt.figure(figsize=(12, 5))

    # Gráfico de Accuracy
    plt.subplot(1, 2, 1)
    plt.plot(historia.history["accuracy"], label="Entrenamiento", color="#0077B6", lw=2)
    plt.plot(historia.history["val_accuracy"], label="Validación", color="#16A34A", lw=2)
    plt.title("Precisión del Modelo (Accuracy)", fontsize=12, fontweight="bold")
    plt.xlabel("Épocas")
    plt.ylabel("Precisión")
    plt.grid(True, alpha=0.3)
    plt.legend()

    # Gráfico de Loss
    plt.subplot(1, 2, 2)
    plt.plot(historia.history["loss"], label="Entrenamiento", color="#DC2626", lw=2)
    plt.plot(historia.history["val_loss"], label="Validación", color="#EA580C", lw=2)
    plt.title("Pérdida (Loss)", fontsize=12, fontweight="bold")
    plt.xlabel("Épocas")
    plt.ylabel("Pérdida")
    plt.grid(True, alpha=0.3)
    plt.legend()

    plt.tight_layout()
    plt.savefig(ruta_salida, dpi=200)
    plt.close()
    print(f"[INFO] Gráficos de entrenamiento guardados en: {ruta_salida}")


def graficar_matriz_confusion(y_real, y_pred, ruta_salida):
    """
    Calcula y grafica la matriz de confusión multiclase.
    """
    from sklearn.metrics import confusion_matrix

    cm = confusion_matrix(y_real, y_pred)

    plt.figure(figsize=(10, 8))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title("Matriz de Confusión - Técnica Quirúrgica", fontsize=14, fontweight="bold")
    plt.colorbar()

    nombres_cortos = [c.replace("paso_", "P").replace("INCORRECTO_", "ERR:") for c in CLASES_OFICIALES]
    tick_marks = np.arange(len(nombres_cortos))
    plt.xticks(tick_marks, nombres_cortos, rotation=45, ha="right", fontsize=9)
    plt.yticks(tick_marks, nombres_cortos, fontsize=9)

    umbral = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(
                j, i, format(cm[i, j], "d"),
                horizontalalignment="center",
                color="white" if cm[i, j] > umbral else "black",
                fontsize=9,
            )

    plt.ylabel("Clase Real (Ground Truth)")
    plt.xlabel("Predicción del Modelo")
    plt.tight_layout()
    plt.savefig(ruta_salida, dpi=200)
    plt.close()
    print(f"[INFO] Matriz de confusión guardada en: {ruta_salida}")


def main():
    parser = argparse.ArgumentParser(description="Entrenamiento de modelo de IA para postura de guantes")
    parser.add_argument("--dataset", type=str, default="ml/dataset.json", help="Ruta al dataset JSON")
    parser.add_argument("--output", type=str, default="public/modelo_tfjs", help="Directorio destino TF.js")
    parser.add_argument("--epochs", type=int, default=50, help="Número de épocas")
    parser.add_argument("--batch-size", type=int, default=32, help="Tamaño de lote")
    args = parser.parse_args()

    print("================================================================================")
    print(" INICIANDO ENTRENAMIENTO: SIMULADOR DE TÉCNICA ESTÉRIL (IA HÍBRIDA)")
    print(" Universidad Cooperativa de Colombia - Campus Pasto")
    print("================================================================================")

    # 1. Cargar datos
    X, y = cargar_datos(args.dataset)

    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report

    # 2. Partición Train / Test (80% / 20%) estratificada
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"[INFO] Conjunto de entrenamiento: {len(X_train)} muestras")
    print(f"[INFO] Conjunto de prueba (test): {len(X_test)} muestras")

    # 3. Construir modelo
    modelo = construir_modelo(len(CLASES_OFICIALES))
    modelo.summary()

    # 4. Entrenar red neuronal
    print(f"[INFO] Entrenando durante {args.epochs} épocas con batch size {args.batch_size}...")
    historia = modelo.fit(
        X_train,
        y_train,
        validation_split=0.15,
        epochs=args.epochs,
        batch_size=args.batch_size,
        verbose=1,
    )

    # 5. Evaluación en el conjunto de prueba
    test_loss, test_acc = modelo.evaluate(X_test, y_test, verbose=0)
    print("\n--------------------------------------------------------------------------------")
    print(f" RESULTADOS FINALES EN CONJUNTO DE PRUEBA (TEST)")
    print(f" -> Pérdida (Loss):    {test_loss:.4f}")
    print(f" -> Precisión (Acc):   {test_acc * 100:.2f}%")
    print("--------------------------------------------------------------------------------\n")

    # 6. Reporte de clasificación y matriz de confusión
    y_pred_probs = modelo.predict(X_test)
    y_pred = np.argmax(y_pred_probs, axis=1)

    print("REPORTE DETALLADO DE CLASIFICACIÓN:")
    print(classification_report(y_test, y_pred, target_names=CLASES_OFICIALES, digits=3))

    os.makedirs("ml", exist_ok=True)
    graficar_metricas(historia, "ml/training_metrics.png")
    graficar_matriz_confusion(y_test, y_pred, "ml/confusion_matrix.png")

    # 7. Exportación a formato TensorFlow.js
    os.makedirs(args.output, exist_ok=True)

    # Guardar labels.json
    ruta_labels_ml = "ml/labels.json"
    ruta_labels_public = os.path.join(args.output, "labels.json")

    with open(ruta_labels_ml, "w", encoding="utf-8") as f:
        json.dump(CLASES_OFICIALES, f, indent=2, ensure_ascii=False)

    with open(ruta_labels_public, "w", encoding="utf-8") as f:
        json.dump(CLASES_OFICIALES, f, indent=2, ensure_ascii=False)

    print(f"[INFO] Etiquetas guardadas en: {ruta_labels_public}")

    # Guardar pesos y topología en TF.js
    try:
        import tensorflowjs as tfjs
        print(f"[INFO] Exportando modelo a formato TensorFlow.js en: {args.output}...")
        tfjs.converters.save_keras_model(modelo, args.output)
        print(" [OK] Exportación a TensorFlow.js exitosa (model.json + shards binarios listos).")
    except ImportError:
        print("[AVISO] 'tensorflowjs' no está instalado en el entorno de Python.")
        print("[AVISO] Para exportar a TF.js, ejecuta: pip install tensorflowjs")
        print(f"[INFO] Guardando modelo Keras nativo en 'ml/modelo_keras.keras'...")
        modelo.save("ml/modelo_keras.keras")

    print("\n================================================================================")
    print(" PROCESO DE ENTRENAMIENTO COMPLETADO EXITOSAMENTE")
    print("================================================================================")


if __name__ == "__main__":
    main()
