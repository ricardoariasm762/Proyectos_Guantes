#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de entrenamiento de Red Neuronal para clasificación de técnica de postura de guantes quirúrgicos.
Exportación directa al formato TensorFlow.js para inferencia client-side en el navegador.

Proyecto de Investigación:
"Fortalecimiento de competencias técnicas en la postura de guantes quirúrgicos
mediante el uso de una herramienta digital interactiva en estudiantes de enfermería"
Universidad Cooperativa de Colombia - Campus Pasto.
"""

import os
import sys
import csv
import json
import argparse
import numpy as np

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
LEARNING_RATE = 0.001
SEMILLA_ALEATORIA = 42


def generar_dataset_sintetico(n_muestras_por_clase=200, n_personas=6):
    """
    Genera un dataset sintético biomecánicamente coherente únicamente cuando se invoca
    de forma explícita con la bandera --sintetico.
    """
    print(
        f"[INFO] Modo --sintetico activo: generando dataset sintético "
        f"({n_muestras_por_clase} muestras por clase, {n_personas} personas simuladas)..."
    )
    muestras = []
    rng = np.random.RandomState(SEMILLA_ALEATORIA)

    for nombre_clase in CLASES_OFICIALES:
        for i in range(n_muestras_por_clase):
            coords = rng.normal(loc=0.0, scale=0.35, size=63)

            if "secado" in nombre_clase or "ajustar_punos" in nombre_clase:
                angulos = rng.uniform(0.85, 1.0, size=5)
            elif "pinza" in nombre_clase or "tomar_guante" in nombre_clase:
                angulos = np.array([
                    rng.uniform(0.80, 0.95),
                    rng.uniform(0.75, 0.90),
                    rng.uniform(0.20, 0.40),
                    rng.uniform(0.20, 0.40),
                    rng.uniform(0.20, 0.40),
                ])
            else:
                angulos = rng.uniform(0.40, 0.90, size=5)

            if "pinza" in nombre_clase and "debil" not in nombre_clase:
                dist_puntas = rng.uniform(0.01, 0.07, size=10)
                dist_puntas[0] = rng.uniform(0.01, 0.05)
            elif "pinza_debil" in nombre_clase:
                dist_puntas = rng.uniform(0.12, 0.35, size=10)
                dist_puntas[0] = rng.uniform(0.15, 0.30)
            else:
                dist_puntas = rng.uniform(0.05, 0.45, size=10)

            orientacion = [rng.uniform(-0.8, 0.8)]
            vector = np.concatenate([coords, angulos, dist_puntas, orientacion]).tolist()

            muestras.append({
                "features": vector,
                "label": nombre_clase,
                "timestamp": 1700000000000 + i,
                "metadata": {
                    "persona": f"sintetico_{i % n_personas + 1}",
                    "iluminacion": "buena",
                    "distancia": "media",
                },
            })

    return muestras


def extraer_persona(item):
    """
    Obtiene el identificador de persona desde item['metadata']['persona'] o item['persona'].
    """
    metadata = item.get("metadata")
    if isinstance(metadata, dict):
        persona = metadata.get("persona")
        if persona is not None and str(persona).strip():
            return str(persona).strip()

    persona_directa = item.get("persona")
    if persona_directa is not None and str(persona_directa).strip():
        return str(persona_directa).strip()

    return ""


def cargar_datos(ruta_dataset, usar_sintetico=False):
    """
    Carga el dataset real desde JSON o genera datos sintéticos solo si usar_sintetico=True.
    Retorna X, y, grupos (identificador de persona por muestra) y origen ('real' o 'sintetico').
    """
    if usar_sintetico:
        muestras_raw = generar_dataset_sintetico(200)
        origen = "sintetico"
    else:
        if not os.path.exists(ruta_dataset):
            print(
                f"[ERROR] No se encontró el archivo de dataset en '{ruta_dataset}'.\n"
                "        Captura datos reales con el Recolector o pasa --sintetico explícitamente para calibración.",
                file=sys.stderr,
            )
            sys.exit(1)

        with open(ruta_dataset, "r", encoding="utf-8") as f:
            contenido = json.load(f)

        if isinstance(contenido, list):
            muestras_raw = contenido
        elif isinstance(contenido, dict) and "data" in contenido:
            muestras_raw = contenido["data"]
        else:
            raise ValueError(f"Formato de dataset desconocido en {ruta_dataset}")
        origen = "real"

    X = []
    y = []
    grupos = []
    sin_persona = 0

    mapeo_clase_a_idx = {nombre: i for i, nombre in enumerate(CLASES_OFICIALES)}

    for item in muestras_raw:
        features = item.get("features", [])
        label = item.get("label", "")
        persona = extraer_persona(item)

        if len(features) == NUM_FEATURES and label in mapeo_clase_a_idx:
            if not persona:
                sin_persona += 1
                continue
            X.append(features)
            y.append(mapeo_clase_a_idx[label])
            grupos.append(persona)

    if sin_persona > 0:
        print(f"[AVISO] Se omitieron {sin_persona} muestras sin identificador 'persona'.")

    if len(X) == 0:
        print("[ERROR] No se encontraron muestras válidas con etiqueta oficial y campo 'persona'.", file=sys.stderr)
        sys.exit(1)

    personas_unicas = sorted(set(grupos))
    if len(personas_unicas) < 3:
        print(
            f"[ERROR] Se requieren al menos 3 personas distintas para separar entrenamiento, "
            f"validación y prueba sin fuga de datos (encontradas: {len(personas_unicas)}: {personas_unicas}).",
            file=sys.stderr,
        )
        sys.exit(1)

    X_arr = np.array(X, dtype=np.float32)
    y_arr = np.array(y, dtype=np.int32)
    grupos_arr = np.array(grupos)

    print(
        f"[INFO] Datos ({origen}) cargados: {len(X_arr)} muestras, "
        f"{len(personas_unicas)} personas distintas, {NUM_FEATURES} características."
    )
    return X_arr, y_arr, grupos_arr, origen


def _particionar_grupos(X, y, grupos, n_splits_objetivo, semilla):
    """
    Divide índices en dos subconjuntos disjuntos por persona usando StratifiedGroupKFold
    (con respaldo a GroupShuffleSplit cuando el número de grupos o muestras por clase es muy pequeño).
    """
    from sklearn.model_selection import StratifiedGroupKFold, GroupShuffleSplit

    personas_unicas = np.unique(grupos)
    n_grupos = len(personas_unicas)
    n_splits = min(n_splits_objetivo, n_grupos)

    conteos_clase = np.bincount(y)
    clases_no_vacias = conteos_clase[conteos_clase > 0]

    if n_splits >= 2 and len(clases_no_vacias) > 1 and np.min(clases_no_vacias) >= n_splits:
        sgkf = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=semilla)
        for idx_mayor, idx_menor in sgkf.split(X, y, groups=grupos):
            if len(idx_mayor) > 0 and len(idx_menor) > 0:
                return idx_mayor, idx_menor

    test_size = 1 if n_grupos <= 4 else 0.20
    gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=semilla)
    idx_mayor, idx_menor = next(gss.split(X, y, groups=grupos))
    return idx_mayor, idx_menor


def dividir_por_persona(X, y, grupos, semilla=SEMILLA_ALEATORIA):
    """
    Separa el dataset en entrenamiento, validación y prueba garantizando que ninguna
    persona aparezca en más de un subconjunto.
    """
    personas_unicas = sorted(set(grupos.tolist()))
    if len(personas_unicas) < 3:
        raise ValueError(
            f"Se requieren al menos 3 personas distintas para particionar por grupo (actual: {len(personas_unicas)})."
        )

    # 1. Separar conjunto de prueba (test) por persona (~20% o al menos 1 persona)
    n_splits_ext = 5 if len(personas_unicas) >= 5 else len(personas_unicas)
    idx_train_val, idx_test = _particionar_grupos(X, y, grupos, n_splits_ext, semilla)

    X_tv, y_tv, grupos_tv = X[idx_train_val], y[idx_train_val], grupos[idx_train_val]
    X_test, y_test, grupos_test = X[idx_test], y[idx_test], grupos[idx_test]

    # 2. Separar entrenamiento y validación por persona a partir de train_val
    personas_tv = sorted(set(grupos_tv.tolist()))
    n_splits_int = 5 if len(personas_tv) >= 5 else len(personas_tv)
    idx_train_rel, idx_val_rel = _particionar_grupos(X_tv, y_tv, grupos_tv, n_splits_int, semilla + 1)

    X_train, y_train, grupos_train = X_tv[idx_train_rel], y_tv[idx_train_rel], grupos_tv[idx_train_rel]
    X_val, y_val, grupos_val = X_tv[idx_val_rel], y_tv[idx_val_rel], grupos_tv[idx_val_rel]

    set_train = set(grupos_train.tolist())
    set_val = set(grupos_val.tolist())
    set_test = set(grupos_test.tolist())

    if (set_train & set_val) or (set_train & set_test) or (set_val & set_test):
        raise RuntimeError("Fuga de datos detectada: intersección no vacía de personas entre conjuntos.")

    return (X_train, y_train, grupos_train), (X_val, y_val, grupos_val), (X_test, y_test, grupos_test)


def construir_modelo(num_clases=9):
    """
    Construye la arquitectura de la red neuronal feed-forward para clasificación biomecánica:
    79 -> Dense 128 ReLU -> Dropout 0.3 -> Dense 64 ReLU -> Dropout 0.3 -> Softmax 9.
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
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    return modelo


def graficar_metricas(historia, ruta_salida):
    """
    Genera gráficos de precisión y función de pérdida durante el entrenamiento.
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    plt.figure(figsize=(12, 5))

    plt.subplot(1, 2, 1)
    plt.plot(historia.history["accuracy"], label="Entrenamiento", color="#0077B6", lw=2)
    plt.plot(historia.history["val_accuracy"], label="Validación", color="#16A34A", lw=2)
    plt.title("Precisión del Modelo (Accuracy)", fontsize=12, fontweight="bold")
    plt.xlabel("Épocas")
    plt.ylabel("Precisión")
    plt.grid(True, alpha=0.3)
    plt.legend()

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


def graficar_matriz_confusion(cm, ruta_salida):
    """
    Grafica la matriz de confusión multiclase en formato PNG.
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    plt.figure(figsize=(10, 8))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title("Matriz de Confusión - Técnica Quirúrgica", fontsize=14, fontweight="bold")
    plt.colorbar()

    nombres_cortos = [c.replace("paso_", "P").replace("INCORRECTO_", "ERR:") for c in CLASES_OFICIALES]
    tick_marks = np.arange(len(nombres_cortos))
    plt.xticks(tick_marks, nombres_cortos, rotation=45, ha="right", fontsize=9)
    plt.yticks(tick_marks, nombres_cortos, fontsize=9)

    umbral = cm.max() / 2.0 if cm.size > 0 else 0.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(
                j,
                i,
                format(int(cm[i, j]), "d"),
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


def inyectar_metadatos_model_json(ruta_model_json, origen):
    """
    Agrega metadatos trazables al archivo model.json exportado a TensorFlow.js,
    incluyendo origen="sintetico" cuando se entrena con --sintetico.
    """
    if not os.path.exists(ruta_model_json):
        return

    with open(ruta_model_json, "r", encoding="utf-8") as f:
        contenido = json.load(f)

    metadatos = contenido.get("userDefinedMetadata")
    if not isinstance(metadatos, dict):
        metadatos = {}

    metadatos["origen"] = origen
    contenido["userDefinedMetadata"] = metadatos

    with open(ruta_model_json, "w", encoding="utf-8") as f:
        json.dump(contenido, f, indent=2, ensure_ascii=False)


def guardar_reportes_evaluacion(
    directorio_reportes,
    y_test,
    y_pred,
    grupos_train,
    grupos_val,
    grupos_test,
    hiperparametros,
    origen,
    test_loss=None,
):
    """
    Calcula y guarda en ml/reportes/ los reportes en JSON, CSV y PNG con:
    - precisión, sensibilidad, F1 y soporte por clase;
    - F1 macro y exactitud;
    - matriz de confusión;
    - número de personas y muestras en cada conjunto;
    - hiperparámetros.
    """
    from sklearn.metrics import (
        accuracy_score,
        confusion_matrix,
        f1_score,
        precision_recall_fscore_support,
    )

    os.makedirs(directorio_reportes, exist_ok=True)
    etiquetas_idx = list(range(len(CLASES_OFICIALES)))

    precision, sensibilidad, f1_por_clase, soporte = precision_recall_fscore_support(
        y_test, y_pred, labels=etiquetas_idx, zero_division=0
    )
    exactitud = float(accuracy_score(y_test, y_pred))
    f1_macro = float(f1_score(y_test, y_pred, labels=etiquetas_idx, average="macro", zero_division=0))
    cm = confusion_matrix(y_test, y_pred, labels=etiquetas_idx)

    personas_train = sorted(set(grupos_train.tolist()))
    personas_val = sorted(set(grupos_val.tolist()))
    personas_test = sorted(set(grupos_test.tolist()))

    metricas_clases = []
    for idx, nombre_clase in enumerate(CLASES_OFICIALES):
        metricas_clases.append({
            "clase": nombre_clase,
            "precision": round(float(precision[idx]), 6),
            "sensibilidad": round(float(sensibilidad[idx]), 6),
            "f1": round(float(f1_por_clase[idx]), 6),
            "soporte": int(soporte[idx]),
        })

    reporte_json = {
        "origen": origen,
        "exactitud": round(exactitud, 6),
        "f1_macro": round(f1_macro, 6),
        "perdida_test": round(float(test_loss), 6) if test_loss is not None else None,
        "por_clase": metricas_clases,
        "matriz_confusion": cm.tolist(),
        "conjuntos": {
            "entrenamiento": {
                "personas": len(personas_train),
                "muestras": int(len(grupos_train)),
                "ids_personas": personas_train,
            },
            "validacion": {
                "personas": len(personas_val),
                "muestras": int(len(grupos_val)),
                "ids_personas": personas_val,
            },
            "prueba": {
                "personas": len(personas_test),
                "muestras": int(len(grupos_test)),
                "ids_personas": personas_test,
            },
        },
        "hiperparametros": hiperparametros,
    }

    ruta_json = os.path.join(directorio_reportes, "metricas_evaluacion.json")
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(reporte_json, f, indent=2, ensure_ascii=False)

    ruta_csv = os.path.join(directorio_reportes, "metricas_evaluacion.csv")
    with open(ruta_csv, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["seccion", "clave", "precision", "sensibilidad", "f1", "soporte", "valor"])

        for item in metricas_clases:
            writer.writerow([
                "por_clase",
                item["clase"],
                item["precision"],
                item["sensibilidad"],
                item["f1"],
                item["soporte"],
                "",
            ])

        writer.writerow(["resumen", "exactitud", "", "", "", int(len(y_test)), round(exactitud, 6)])
        writer.writerow(["resumen", "f1_macro", "", "", round(f1_macro, 6), int(len(y_test)), round(f1_macro, 6)])
        writer.writerow(["resumen", "origen", "", "", "", "", origen])

        for nombre_split, info in reporte_json["conjuntos"].items():
            writer.writerow(["conjunto_personas", nombre_split, "", "", "", "", info["personas"]])
            writer.writerow(["conjunto_muestras", nombre_split, "", "", "", "", info["muestras"]])

        for hp_clave, hp_valor in hiperparametros.items():
            writer.writerow(["hiperparametro", hp_clave, "", "", "", "", hp_valor])

        for idx_fila, fila_cm in enumerate(cm.tolist()):
            writer.writerow([
                "matriz_confusion",
                CLASES_OFICIALES[idx_fila],
                "",
                "",
                "",
                int(soporte[idx_fila]),
                json.dumps(fila_cm),
            ])

    ruta_png = os.path.join(directorio_reportes, "matriz_confusion.png")
    graficar_matriz_confusion(cm, ruta_png)

    print(f"[INFO] Reporte JSON guardado en: {ruta_json}")
    print(f"[INFO] Reporte CSV guardado en:  {ruta_csv}")
    return reporte_json


def main():
    parser = argparse.ArgumentParser(description="Entrenamiento de modelo de IA para postura de guantes")
    parser.add_argument("--dataset", type=str, default="ml/dataset.json", help="Ruta al dataset JSON real")
    parser.add_argument(
        "--sintetico",
        action="store_true",
        help="Genera explícitamente un dataset sintético de calibración (etiqueta model.json con origen='sintetico')",
    )
    parser.add_argument("--output", type=str, default="public/modelo_tfjs", help="Directorio destino TF.js")
    parser.add_argument("--reportes-dir", type=str, default="ml/reportes", help="Directorio para reportes de evaluación")
    parser.add_argument("--epochs", type=int, default=50, help="Número de épocas")
    parser.add_argument("--batch-size", type=int, default=32, help="Tamaño de lote")
    args = parser.parse_args()

    print("================================================================================")
    print(" INICIANDO ENTRENAMIENTO: SIMULADOR DE TÉCNICA ESTÉRIL (IA HÍBRIDA)")
    print(" Universidad Cooperativa de Colombia - Campus Pasto")
    print("================================================================================")

    # 1. Cargar datos y validar mínimo 3 personas
    X, y, grupos, origen = cargar_datos(args.dataset, usar_sintetico=args.sintetico)

    # 2. Partición Train / Validación / Test estrictamente separada por persona
    (X_train, y_train, grupos_train), (X_val, y_val, grupos_val), (X_test, y_test, grupos_test) = (
        dividir_por_persona(X, y, grupos, semilla=SEMILLA_ALEATORIA)
    )

    print(
        f"[INFO] Entrenamiento: {len(X_train)} muestras ({len(set(grupos_train))} personas) | "
        f"Validación: {len(X_val)} muestras ({len(set(grupos_val))} personas) | "
        f"Prueba: {len(X_test)} muestras ({len(set(grupos_test))} personas)"
    )

    # 3. Construir modelo (arquitectura fija requerida por el frontend)
    modelo = construir_modelo(len(CLASES_OFICIALES))
    modelo.summary()

    # 4. Entrenar red neuronal usando el conjunto de validación separado por persona
    print(f"[INFO] Entrenando durante {args.epochs} épocas con batch size {args.batch_size}...")
    historia = modelo.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        verbose=1,
    )

    # 5. Evaluación en el conjunto de prueba
    test_loss, test_acc = modelo.evaluate(X_test, y_test, verbose=0)
    print("\n--------------------------------------------------------------------------------")
    print(" RESULTADOS FINALES EN CONJUNTO DE PRUEBA (TEST)")
    print(f" -> Pérdida (Loss):    {test_loss:.4f}")
    print(f" -> Exactitud (Acc):   {test_acc * 100:.2f}%")
    print("--------------------------------------------------------------------------------\n")

    # 6. Predicciones y generación de reportes en ml/reportes/
    from sklearn.metrics import classification_report

    y_pred_probs = modelo.predict(X_test)
    y_pred = np.argmax(y_pred_probs, axis=1)

    print("REPORTE DETALLADO DE CLASIFICACIÓN:")
    print(
        classification_report(
            y_test,
            y_pred,
            labels=list(range(len(CLASES_OFICIALES))),
            target_names=CLASES_OFICIALES,
            digits=3,
            zero_division=0,
        )
    )

    hiperparametros = {
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "learning_rate": LEARNING_RATE,
        "optimizer": "Adam",
        "loss": "sparse_categorical_crossentropy",
        "arquitectura": "79 -> Dense(128, relu) -> Dropout(0.3) -> Dense(64, relu) -> Dropout(0.3) -> Dense(9, softmax)",
        "particion": "StratifiedGroupKFold por persona",
        "semilla": SEMILLA_ALEATORIA,
    }

    os.makedirs(args.reportes_dir, exist_ok=True)
    graficar_metricas(historia, os.path.join(args.reportes_dir, "curvas_entrenamiento.png"))
    guardar_reportes_evaluacion(
        directorio_reportes=args.reportes_dir,
        y_test=y_test,
        y_pred=y_pred,
        grupos_train=grupos_train,
        grupos_val=grupos_val,
        grupos_test=grupos_test,
        hiperparametros=hiperparametros,
        origen=origen,
        test_loss=test_loss,
    )

    # 7. Exportación a formato TensorFlow.js
    os.makedirs(args.output, exist_ok=True)

    ruta_labels_ml = "ml/labels.json"
    ruta_labels_public = os.path.join(args.output, "labels.json")

    with open(ruta_labels_ml, "w", encoding="utf-8") as f:
        json.dump(CLASES_OFICIALES, f, indent=2, ensure_ascii=False)

    with open(ruta_labels_public, "w", encoding="utf-8") as f:
        json.dump(CLASES_OFICIALES, f, indent=2, ensure_ascii=False)

    print(f"[INFO] Etiquetas guardadas en: {ruta_labels_public}")

    try:
        import tensorflowjs as tfjs

        print(f"[INFO] Exportando modelo a formato TensorFlow.js en: {args.output}...")
        tfjs.converters.save_keras_model(modelo, args.output)
        inyectar_metadatos_model_json(os.path.join(args.output, "model.json"), origen)
        print(" [OK] Exportación a TensorFlow.js exitosa (model.json + shards binarios listos).")
    except ImportError:
        print("[AVISO] 'tensorflowjs' no está instalado en el entorno de Python.")
        print("[AVISO] Para exportar a TF.js en un entorno virtual, ejecuta: pip install tensorflowjs")
        ruta_keras = os.path.join(args.reportes_dir, "modelo_keras.keras")
        print(f"[INFO] Guardando modelo Keras nativo en '{ruta_keras}'...")
        modelo.save(ruta_keras)
        inyectar_metadatos_model_json(os.path.join(args.output, "model.json"), origen)

    print("\n================================================================================")
    print(" PROCESO DE ENTRENAMIENTO COMPLETADO EXITOSAMENTE")
    print("================================================================================")


if __name__ == "__main__":
    main()
