# Catálogo Detallado de Casos de Prueba (E2E) 🧪

> **Proyecto:** Simulador de Técnica Estéril — Postura de Guantes Quirúrgicos  
> **Universidad Cooperativa de Colombia — Campus Pasto**  
> **Área:** Calidad de Software & Validación Clínica de IA  
> **Total de Casos Especificados:** 34 Casos (Niveles 1 a 5)

---

## Índice General de Casos de Prueba

| Nivel | Rango de IDs | Cantidad | Descripción |
| :---: | :---: | :---: | :--- |
| **Nivel 1** | `DB-01` a `DB-03` | 3 | Pruebas de Base de Datos y Persistencia Relacional |
| **Nivel 2** | `API-01` a `API-15` | 15 | Pruebas de Servicios API REST y Seguridad JWT |
| **Nivel 3** | `INT-01` a `INT-10` | 10 | Pruebas de Integración E2E (Frontend + IA + Backend + BD) |
| **Nivel 4** | `STRESS-01` a `EDGE-05` | 8 | Pruebas de Carga, Resiliencia y Casos Límite |
| **Nivel 5** | `UX-01` | 1 | Pruebas de Usabilidad con Estudiantes de Enfermería |

---

## NIVEL 1: Pruebas de Base de Datos (Persistencia Aislada)

### Caso DB-01: Verificación de Estructura de Tablas y Columnas de Telemetría IA
- **ID:** `DB-01`
- **Nivel:** Nivel 1 — Base de Datos
- **Objetivo:** Confirmar que todas las 5 tablas existen en el esquema `public` de `guantes_db` y que la tabla `intentos_practica` contiene todas las columnas de telemetría de IA requeridas.
- **Precondiciones:** Servicio PostgreSQL activo en el puerto 5432 con base de datos `guantes_db`.
- **Pasos de Ejecución:**
  1. Conectarse a la base de datos `guantes_db`.
  2. Ejecutar la consulta del catálogo de esquemas:
     ```sql
     SELECT table_name, column_name, data_type, is_nullable 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
       AND table_name IN ('usuarios', 'intentos_practica', 'pasos_completados', 'progresos', 'modelos_ia')
     ORDER BY table_name, ordinal_position;
     ```
  3. Comprobar que en `intentos_practica` figuren: `confianza_promedio`, `fuente_prediccion`, `version_modelo`, `detalle_ia`.
- **Resultado Esperado:** 5 tablas presentes. Las columnas de IA están tipadas correctamente (`double precision`, `varchar`, `text`).
- **Criterio de Aceptación:** 100% de tablas y columnas requeridas coinciden con las entidades JPA.

---

### Caso DB-02: Verificación de Restricciones CHECK para Roles de Usuario
- **ID:** `DB-02`
- **Nivel:** Nivel 1 — Base de Datos
- **Objetivo:** Validar que la base de datos rechace la inserción de roles no tipados mediante la restricción `usuarios_rol_check`.
- **Precondiciones:** Tabla `usuarios` creada con el constraint `usuarios_rol_check`.
- **Pasos de Ejecución:**
  1. Ejecutar sentencia de inserción con un rol no soportado:
     ```sql
     INSERT INTO usuarios (nombre, apellido, email, password, rol, activo) 
     VALUES ('Test', 'Rol', 'testrol@test.com', 'hash123', 'INVALIDO', true);
     ```
- **Resultado Esperado:** PostgreSQL aborta la transacción con código de error `23514 (check_violation)` indicando violación de la restricción `usuarios_rol_check`.
- **Criterio de Aceptación:** Ninguna fila insertada con roles fuera de `ADMIN`, `DOCENTE`, `ESTUDIANTE`.

---

### Caso DB-03: Verificación de Integridad Referencial y Cascada al Eliminar Usuario
- **ID:** `DB-03`
- **Nivel:** Nivel 1 — Base de Datos
- **Objetivo:** Determinar el comportamiento referencial al eliminar un usuario que posee intentos y progreso asociados.
- **Precondiciones:** Usuario `testcascada@test.com` creado con al menos 1 intento y 1 registro de progreso.
- **Pasos de Ejecución:**
  1. Insertar usuario temporal de prueba y un intento vinculado.
  2. Intentar ejecutar `DELETE FROM usuarios WHERE email = 'testcascada@test.com';`.
  3. Analizar si la base de datos ejecuta borrado en cascada DDL o si el comportamiento en cascada está delegado a la capa JPA de Spring Boot (`orphanRemoval = true`).
  4. Si existe restricción `RESTRICT`/`NO ACTION`, verificar el mensaje de violación de clave foránea.
- **Resultado Esperado:** Consistencia referencial garantizada: no deben quedar registros huérfanos en `intentos_practica` ni en `progresos`.
- **Criterio de Aceptación:** La base de datos impide registros inconsistentes huérfanos.

---

## NIVEL 2: Pruebas de API REST (Servicios & Seguridad)

### Caso API-01: Registro Exitoso de un Estudiante
- **ID:** `API-01`
- **Endpoint:** `POST /api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "nombre": "Estudiante",
    "apellido": "Prueba",
    "email": "prueba@ucc.edu.co",
    "password": "prueba123456",
    "rol": "ESTUDIANTE"
  }
  ```
- **Resultado Esperado:** HTTP `201 Created`. El cuerpo retorna `token`, `id`, `nombre`, `email`, y `rol: "ESTUDIANTE"`. En base de datos se genera el usuario y su progreso inicial.

---

### Caso API-02: Registro Rechazado por Email Duplicado
- **ID:** `API-02`
- **Endpoint:** `POST /api/auth/register`
- **Payload:** Mismo cuerpo de `API-01` con `email: "prueba@ucc.edu.co"`.
- **Resultado Esperado:** HTTP `400 Bad Request`. Respuesta JSON con mensaje explicativo de conflicto o correo ya registrado.

---

### Caso API-03: Inicio de Sesión Exitoso (Login)
- **ID:** `API-03`
- **Endpoint:** `POST /api/auth/login`
- **Payload:**
  ```json
  {
    "email": "prueba@ucc.edu.co",
    "password": "prueba123456"
  }
  ```
- **Resultado Esperado:** HTTP `200 OK`. Retorna un JWT válido con `sub: "prueba@ucc.edu.co"` y firma criptográfica verificable.

---

### Caso API-04: Login con Credenciales Inválidas
- **ID:** `API-04`
- **Endpoint:** `POST /api/auth/login`
- **Payload:**
  ```json
  {
    "email": "prueba@ucc.edu.co",
    "password": "password_incorrecto"
  }
  ```
- **Resultado Esperado:** HTTP `401 Unauthorized` o `400 Bad Request` sin emitir token JWT.

---

### Caso API-05: Guardado de Intento sin Metadatos de IA (Compatibilidad Retroactiva)
- **ID:** `API-05`
- **Endpoint:** `POST /api/intentos`
- **Headers:** `Authorization: Bearer <token_estudiante>`
- **Payload:**
  ```json
  {
    "modoPractica": "GUIADO",
    "puntaje": 850.0,
    "duracionSegundos": 225,
    "completado": true,
    "observaciones": "Prueba sin IA",
    "pasos": [
      { "numeroPaso": 1, "nombrePaso": "Verificar empaque", "exitoso": true, "tiempoSegundos": 30 }
    ]
  }
  ```
- **Resultado Esperado:** HTTP `201 Created`. Los campos `confianzaPromedio`, `fuentePrediccion`, `versionModelo` y `detalleIA` persisten como `NULL` sin generar errores en JPA.

---

### Caso API-06: Guardado de Intento con Telemetría Completa de IA
- **ID:** `API-06`
- **Endpoint:** `POST /api/intentos`
- **Headers:** `Authorization: Bearer <token_estudiante>`
- **Payload:**
  ```json
  {
    "modoPractica": "EVALUACION",
    "puntaje": 920.0,
    "duracionSegundos": 180,
    "completado": true,
    "confianzaPromedio": 0.89,
    "fuentePrediccion": "CONSENSO",
    "versionModelo": "v1.0-2026-10",
    "detalleIA": "{\"pasos\":[{\"numero\":1,\"correcto\":true,\"confianza\":0.92,\"fuente\":\"CONSENSO\"}],\"confianzaPromedio\":0.89,\"fuenteDominante\":\"CONSENSO\",\"versionModelo\":\"v1.0-2026-10\"}",
    "pasos": [
      { "numeroPaso": 1, "nombrePaso": "Inspección de paquete", "exitoso": true, "tiempoSegundos": 25, "precision": 0.92 }
    ]
  }
  ```
- **Resultado Esperado:** HTTP `201 Created`. En BD, `confianza_promedio = 0.89`, `fuente_prediccion = 'CONSENSO'`, `version_modelo = 'v1.0-2026-10'`, y `detalle_ia` almacena el JSON completo.

---

### Caso API-07: Validación de Confianza Promedio Fuera de Rango
- **ID:** `API-07`
- **Endpoint:** `POST /api/intentos`
- **Headers:** `Authorization: Bearer <token_estudiante>`
- **Payload:**
  ```json
  {
    "modoPractica": "EVALUACION",
    "puntaje": 500.0,
    "duracionSegundos": 300,
    "confianzaPromedio": 1.50
  }
  ```
- **Resultado Esperado:** HTTP `400 Bad Request` por violación de validación `@DecimalMax("1.0")` en `IntentoRequest` (o advertencia en log si es flexible).

---

### Caso API-08: Listar Intentos Históricos del Usuario
- **ID:** `API-08`
- **Endpoint:** `GET /api/intentos/mis-intentos`
- **Headers:** `Authorization: Bearer <token_estudiante>`
- **Resultado Esperado:** HTTP `200 OK`. Retorna un arreglo JSON con los intentos del usuario autenticado ordenados de manera descendente por fecha.

---

### Caso API-09: Consulta de Progreso y Métricas Consolidadas
- **ID:** `API-09`
- **Endpoint:** `GET /api/progreso/mi-progreso`
- **Headers:** `Authorization: Bearer <token_estudiante>`
- **Resultado Esperado:** HTTP `200 OK`. Retorna métricas acumuladas: `intentosTotales`, `mejorPuntaje`, `promedioPuntaje`, `tiempoTotalSegundos`. Los valores coinciden exactamente con la agregación SQL en `intentos_practica`.

---

### Caso API-10: Intento de Eliminación de Sesión de Práctica
- **ID:** `API-10`
- **Endpoint:** `DELETE /api/intentos/{id}`
- **Headers:** `Authorization: Bearer <token_estudiante>`
- **Resultado Esperado:** Evaluación del soporte del endpoint. Si no está expuesto en `IntentoController`, retorna `405 Method Not Allowed`, confirmando que los intentos clínicos son inmutables por diseño de auditoría académica, o `204 No Content` si se habilita borrado.

---

### Caso API-11: Registro de Nueva Versión de Modelo IA (ADMIN)
- **ID:** `API-11`
- **Endpoint:** `POST /api/ia/version`
- **Headers:** `Authorization: Bearer <token_admin>`
- **Payload:**
  ```json
  {
    "version": "v1.1-2026-11",
    "accuracy": 0.91,
    "numClases": 9,
    "numMuestras": 3200,
    "descripcion": "Modelo reentrenado con aumento de datos en agarre de dobladillo",
    "activo": true
  }
  ```
- **Resultado Esperado:** HTTP `201 Created`. En BD, la versión `v1.1-2026-11` queda como `activo = true`, y la versión previa pasa a `activo = false`.

---

### Caso API-12: Rechazo de Registro de Modelo por Estudiante (Control RBAC)
- **ID:** `API-12`
- **Endpoint:** `POST /api/ia/version`
- **Headers:** `Authorization: Bearer <token_estudiante>`
- **Payload:** Mismo cuerpo de `API-11`.
- **Resultado Esperado:** HTTP `403 Forbidden`. Spring Security bloquea el acceso debido a la restricción `@PreAuthorize("hasRole('ADMIN')")`.

---

### Caso API-13: Consulta de Versión Activa del Modelo IA
- **ID:** `API-13`
- **Endpoint:** `GET /api/ia/version/activa`
- **Headers:** `Authorization: Bearer <token_estudiante>`
- **Resultado Esperado:** HTTP `200 OK`. Retorna la versión vigente marcada con `activo: true` para sincronización con el frontend.

---

### Caso API-14: Invocación de Endpoint Protegido sin Token
- **ID:** `API-14`
- **Endpoint:** `GET /api/intentos/mis-intentos`
- **Headers:** Sin cabecera `Authorization`.
- **Resultado Esperado:** HTTP `401 Unauthorized`. La petición es rechazada por `JwtAuthenticationEntryPoint`.

---

### Caso API-15: Invocación con Token Expirado o Firma Alterada
- **ID:** `API-15`
- **Endpoint:** `GET /api/intentos/mis-intentos`
- **Headers:** `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token_falsificado`
- **Resultado Esperado:** HTTP `401 Unauthorized`. Spring Security detecta firma corrupta y bloquea la solicitud.

---

## NIVEL 3: Pruebas de Integración E2E (Frontend + Backend + BD)

### Caso INT-01: Ciclo Completo de Onboarding de Estudiante
- **ID:** `INT-01`
- **Flujo:** Navegación a `/registro` → Diligenciamiento de formulario → Recepción de JWT → Almacenamiento en `localStorage` → Redirección a `/dashboard` con estado inicial sin intentos.
- **Verificación:** DB: 1 fila en `usuarios` y 1 en `progresos` con 0 intentos.

### Caso INT-02: Práctica Clínica Asistida por IA y Persistencia de Telemetría
- **ID:** `INT-02`
- **Flujo:** Navegar a `/simulacion` → Conceder acceso a webcam → Carga de modelo TF.js → Ejecución de los 6 pasos clínicos de postura estéril → Inferencia en tiempo real → Modal de resumen → POST `/api/intentos` con telemetría.
- **Verificación:** BD: `confianza_promedio` $\in [0, 1]$, `fuente_prediccion` válida, `detalle_ia` JSON estructurado.

### Caso INT-03: Actualización Reactiva del Dashboard
- **ID:** `INT-03`
- **Flujo:** Tras completar la práctica, volver al Dashboard → Verificar que el contador de intentos incrementó, el gráfico de historial proyecta el puntaje y la sección de actividad reciente muestra la práctica.
- **Verificación:** Los datos coinciden con la consulta agregada en PostgreSQL.

### Caso INT-04: Múltiples Sesiones y Cálculo Consistente de Promedios
- **ID:** `INT-04`
- **Flujo:** Ejecutar 3 prácticas con desempeños disímiles → Comprobar el recálculo aritmético del puntaje promedio y mejor tiempo en el frontend vs base de datos.

### Caso INT-05: Eliminación de Sesiones desde Interfaz
- **ID:** `INT-05`
- **Flujo:** Ir a Perfil/Historial → Accionar botón eliminar → Verificar si la interfaz invoca el endpoint o si la política de inmutabilidad académica oculta la acción para preservar la trazabilidad docente.

### Caso INT-06: Persistencia de Sesión ante Recarga del Navegador (F5)
- **ID:** `INT-06`
- **Flujo:** Presionar F5 en `/dashboard` → Verificar que Zustand hidrata el estado con el JWT de `localStorage` sin redirigir al login.

### Caso INT-07: Flujo de Cierre de Sesión (Logout) y Protección de Rutas
- **ID:** `INT-07`
- **Flujo:** Clic en avatar → "Cerrar Sesión" → Purga de `localStorage` → Intento de acceso directo a `/dashboard` → Redirección forzosa a `/login`.

### Caso INT-08: Flujo de Gestión de Modelos para Administrador
- **ID:** `INT-08`
- **Flujo:** Iniciar sesión con `admin@ucc.edu.co` → Visualización de módulo "Modelos IA" en Sidebar → Registro de nueva versión y activación desde la UI.

### Caso INT-09: Restricción de Rutas Administrativas para Estudiantes
- **ID:** `INT-09`
- **Flujo:** Con sesión de estudiante, ingresar en la barra de direcciones `http://localhost:5173/admin/modelos-ia` → El componente `RutaProtegida` intercepta el rol y redirige a `/dashboard`.

### Caso INT-10: Propagación de Versión Activa del Modelo a los Intentos
- **ID:** `INT-10`
- **Flujo:** El Admin activa la versión `v1.1-2026-11` → El estudiante realiza un nuevo intento → El payload y la base de datos guardan `version_modelo: "v1.1-2026-11"`.

---

## NIVEL 4: Pruebas de Estrés, Concurrencia y Casos Límite

### Caso STRESS-01: Carga con Payload de Telemetría Voluminoso (>100 KB)
- **ID:** `STRESS-01`
- **Objetivo:** Verificar la salvaguarda de compactación de telemetría (<10 KB en frontend) o respuesta del backend ante payloads extensos de landmarks.
- **Resultado Esperado:** El sistema trunca o persiste el JSON sin desbordar memoria en la JVM ni provocar error 500.

### Caso STRESS-02: Envío Masivo de Intentos Consecutivos (100 Solicitudes)
- **ID:** `STRESS-02`
- **Objetivo:** Enviar 100 requests de intentos continuos mediante script para verificar estabilidad de la conexión JDBC y tiempos de respuesta.
- **Resultado Esperado:** Tasa de error 0%, tiempo de respuesta promedio < 200 ms por request.

### Caso STRESS-03: Concurrencia Simulada de Múltiples Usuarios
- **ID:** `STRESS-03`
- **Objetivo:** Simular 3 usuarios realizando prácticas en paralelo para validar transaccionalidad e independencia de métricas.

### Caso EDGE-01: Práctica Incompleta o Abandonada
- **ID:** `EDGE-01`
- **Payload:** `pasosCompletados: 3`, `completado: false`, `puntaje: 300.0`.
- **Resultado Esperado:** Guardado exitoso reflejando el abandono clínico sin corromper estadísticas.

### Caso EDGE-02: Intento Perfecto (Desempeño Óptimo)
- **ID:** `EDGE-02`
- **Payload:** `puntaje: 1000.0`, `duracionSegundos: 120`, `confianzaPromedio: 0.98`.
- **Resultado Esperado:** Registro íntegro y actualización de mejor puntaje a 1000.

### Caso EDGE-03: Práctica con Tiempo Cero
- **ID:** `EDGE-03`
- **Payload:** `duracionSegundos: 0`, `puntaje: 0.0`.
- **Resultado Esperado:** Validación controlada sin provocar división por cero en las métricas de promedio.

### Caso EDGE-04: Bloqueo de Cámara Durante la Práctica
- **ID:** `EDGE-04`
- **Flujo:** Revocar permisos de cámara en DevTools mientras la práctica está activa.
- **Resultado Esperado:** La interfaz muestra advertencia amigable ("Cámara desconectada o permiso denegado") sin congelar la app.

### Caso EDGE-05: Pérdida de Red y Sincronización Offline
- **ID:** `EDGE-05`
- **Flujo:** Desconectar red (`Network: Offline`) antes de finalizar la práctica → Intentar guardar.
- **Resultado Esperado:** El intento se resguarda en `localStorage` bajo `intentos_pendientes_sincronizacion` y notifica al usuario para reintento automático al recuperar conexión.

---

## NIVEL 5: Pruebas de Usabilidad con Estudiantes de Enfermería

### Caso UX-01: Protocolo de Evaluación de Usabilidad en Entorno Simulado
- **ID:** `UX-01`
- **Población Objetivo:** 2 a 3 estudiantes de pregrado de Enfermería de la Universidad Cooperativa de Colombia, campus Pasto.
- **Tareas Evaluadas:**
  1. Registro de cuenta e inicio de sesión.
  2. Ajuste de posición corporal y calibración de cámara web.
  3. Ejecución de la técnica aséptica de 6 pasos de postura de guantes.
  4. Interpretación del feedback visual en tiempo real (indicadores verdes/rojos de asepsia).
  5. Consulta de resultados en el resumen y dashboard de progreso.
- **Métricas Registradas:**
  - Tiempo medio de ejecución de técnica (segundos).
  - Tasa de finalización de pasos (completitud técnica).
  - Tasa de errores asépticos detectados por la IA.
  - Puntaje en la escala SUS (System Usability Scale) [0 - 100].
  - Nivel de satisfacción cualitativa (Escala Likert 1 a 5).
