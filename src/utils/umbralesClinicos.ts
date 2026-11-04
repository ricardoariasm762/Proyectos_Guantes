// Umbrales geométricos y clínicos del motor de validación biomecánica
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

/**
 * Paso 1 (Lavado quirúrgico): distancia euclidiana 3D máxima (en espacio normalizado MediaPipe)
 * entre puntas de dedos de manos opuestas para considerar fricción interdigital activa.
 */
export const UMBRAL_DISTANCIA_LAVADO = 0.15;

/**
 * Pasos 2, 3, 4 y 6: ángulo articular mínimo en grados (MCP -> PIP -> TIP)
 * para considerar extendidos los dedos trifalángicos (índice, medio, anular y meñique).
 */
export const UMBRAL_EXTENSION_DEDOS = 160;

/**
 * Ángulo articular mínimo en grados (MCP -> IP -> TIP) para considerar extendido el pulgar.
 */
export const UMBRAL_EXTENSION_PULGAR = 150;

/**
 * Paso 3 (Tomar guante derecho por el doblez interno): distancia máxima normalizada
 * entre punta del pulgar (4) y punta del índice (8) para considerar pinza activa.
 */
export const UMBRAL_PINZA_BORDE = 0.08;

/**
 * Umbral base en `dedosJuntos` para distancia máxima entre puntas consecutivas
 * de los cuatro dedos trifalángicos.
 */
export const UMBRAL_DEDOS_JUNTOS = 0.05;

/**
 * Paso 4 (Introducir mano derecha): tolerancia aplicada en `validarPaso4IntroducirManoDerecha`
 * al evaluar `dedosJuntos`. Se conserva 0.06 para no alterar el comportamiento actual.
 */
export const UMBRAL_DEDOS_JUNTOS_PASO_4 = 0.06; // VALIDAR con expertos clínicos

/**
 * Paso 5 (Repetir con mano izquierda / bolsillo estéril): distancia máxima normalizada
 * entre punta del pulgar (4) y punta del índice (8) de la mano enguantada.
 */
export const UMBRAL_PINZA_BOLSILLO = 0.09; // VALIDAR con expertos clínicos
