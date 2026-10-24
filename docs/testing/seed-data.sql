-- ==============================================================================
-- PROYECTO DE GRADO: Simulador de Técnica Estéril
-- Universidad Cooperativa de Colombia - Campus Pasto
-- SCRIPT DE DATOS SEMILLA (SEED DATA) PARA SUITE DE PRUEBAS END-TO-END
-- Base de Datos: guantes_db (PostgreSQL 18)
-- ==============================================================================

-- 1. LIMPIEZA PREVIA DE REGISTROS DE PRUEBAS ANTERIORES (Idempotencia)
DELETE FROM pasos_completados WHERE intento_id IN (
    SELECT id FROM intentos_practica WHERE usuario_id IN (
        SELECT id FROM usuarios WHERE email IN ('testcascada@test.com', 'prueba@ucc.edu.co', 'juan.test@ucc.edu.co', 'estudiante.base@ucc.edu.co')
    )
);

DELETE FROM intentos_practica WHERE usuario_id IN (
    SELECT id FROM usuarios WHERE email IN ('testcascada@test.com', 'prueba@ucc.edu.co', 'juan.test@ucc.edu.co', 'estudiante.base@ucc.edu.co')
);

DELETE FROM progresos WHERE usuario_id IN (
    SELECT id FROM usuarios WHERE email IN ('testcascada@test.com', 'prueba@ucc.edu.co', 'juan.test@ucc.edu.co', 'estudiante.base@ucc.edu.co')
);

DELETE FROM usuarios WHERE email IN ('testcascada@test.com', 'prueba@ucc.edu.co', 'juan.test@ucc.edu.co', 'estudiante.base@ucc.edu.co');

-- 2. USUARIO ADMINISTRADOR BASE (Contraseña: admin123456)
INSERT INTO usuarios (id, nombre, apellido, email, password, rol, activo, fecha_creacion, fecha_actualizacion)
VALUES (
    1,
    'Administrador',
    'Sistema',
    'admin@ucc.edu.co',
    '$2a$10$R5GfLoro1tqa3UEOUpTPwe26vd8hLHPVISgxsg5b4mvy4FrUPD1kC',
    'ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET rol = 'ADMIN', activo = true, password = '$2a$10$R5GfLoro1tqa3UEOUpTPwe26vd8hLHPVISgxsg5b4mvy4FrUPD1kC';

-- Ajustar secuencia de usuarios para evitar colisión de IDs
SELECT setval('usuarios_id_seq', (SELECT COALESCE(MAX(id), 1) FROM usuarios));

-- 3. MODELO DE IA BASE (Versión Activa para Inferencia)
INSERT INTO modelos_ia (id, version, accuracy, num_clases, num_muestras, descripcion, activo, fecha_entrenamiento)
VALUES (
    1,
    'v1.0-2026-10',
    0.87,
    9,
    2500,
    'Modelo base supervisado entrenado con 2,500 muestras de estudiantes de enfermería',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET version = 'v1.0-2026-10', accuracy = 0.87, activo = true;

SELECT setval('modelos_ia_id_seq', (SELECT COALESCE(MAX(id), 1) FROM modelos_ia));

-- 4. USUARIO ESTUDIANTE BASE PARA PRUEBAS (Contraseña: prueba123456)
INSERT INTO usuarios (id, nombre, apellido, email, password, rol, activo, fecha_creacion, fecha_actualizacion)
VALUES (
    2,
    'Estudiante',
    'Semilla',
    'estudiante.base@ucc.edu.co',
    '$2a$10$R5GfLoro1tqa3UEOUpTPwe26vd8hLHPVISgxsg5b4mvy4FrUPD1kC',
    'ESTUDIANTE',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET rol = 'ESTUDIANTE', activo = true;

SELECT setval('usuarios_id_seq', (SELECT COALESCE(MAX(id), 2) FROM usuarios));

-- 5. REGISTRO DE PROGRESO INICIAL PARA EL ESTUDIANTE BASE
INSERT INTO progresos (id, usuario_id, intentos_totales, intentos_exitosos, mejor_puntaje, promedio_puntaje, tiempo_total_segundos, nivel_alcanzado, ultimo_acceso)
VALUES (
    1,
    2,
    1,
    1,
    880.0,
    880.0,
    195,
    'INTERMEDIO',
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET intentos_totales = 1, mejor_puntaje = 880.0;

SELECT setval('progresos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM progresos));

-- 6. REGISTRO DE INTENTO HISTÓRICO CON TELEMETRÍA DE IA
INSERT INTO intentos_practica (
    id, usuario_id, modo_practica, fecha_inicio, fecha_fin, puntaje, duracion_segundos, completado, 
    observaciones, confianza_promedio, fuente_prediccion, version_modelo, detalle_ia
)
VALUES (
    1,
    2,
    'GUIADO',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '56 minutes',
    880.0,
    195,
    true,
    'Intento base inicial verificado',
    0.88,
    'CONSENSO',
    'v1.0-2026-10',
    '{"pasos":[{"numero":1,"correcto":true,"confianza":0.91,"fuente":"CONSENSO"},{"numero":2,"correcto":true,"confianza":0.85,"fuente":"IA"}],"confianzaPromedio":0.88,"fuenteDominante":"CONSENSO","versionModelo":"v1.0-2026-10"}'
)
ON CONFLICT (id) DO UPDATE 
SET puntaje = 880.0, version_modelo = 'v1.0-2026-10';

SELECT setval('intentos_practica_id_seq', (SELECT COALESCE(MAX(id), 1) FROM intentos_practica));

-- 7. PASOS COMPLETADOS DEL INTENTO BASE
INSERT INTO pasos_completados (id, intento_id, numero_paso, nombre_paso, exitoso, tiempo_segundos, precision_obtenida, descripcion, fecha_hora)
VALUES 
    (1, 1, 1, 'Lavado de manos', true, 30, 0.95, 'Lavado quirúrgico ejecutado correctamente', NOW() - INTERVAL '59 minutes'),
    (2, 1, 2, 'Secado con compresa', true, 25, 0.90, 'Secado de dedos a codos sin regresar', NOW() - INTERVAL '58 minutes')
ON CONFLICT (id) DO NOTHING;

SELECT setval('pasos_completados_id_seq', (SELECT COALESCE(MAX(id), 2) FROM pasos_completados));

-- Mensaje de confirmación en consola psql
\echo '---------------------------------------------------------'
\echo 'DATOS SEMILLA CARGADOS EXITOSAMENTE EN guantes_db'
\echo 'Admin: admin@ucc.edu.co (Contraseña: admin123456)'
\echo 'Estudiante: estudiante.base@ucc.edu.co (Contraseña: admin123456)'
\echo 'Modelo IA: v1.0-2026-10 (Activo: true, Accuracy: 87%)'
\echo '---------------------------------------------------------'
