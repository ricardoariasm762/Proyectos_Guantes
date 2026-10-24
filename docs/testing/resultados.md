# Bitácora Consolidada de Resultados de Pruebas 📊

> **Proyecto:** Simulador de Técnica Estéril — Postura de Guantes Quirúrgicos  
> **Universidad Cooperativa de Colombia — Campus Pasto**  
> **Última Actualización:** 2026-10-12 (Post-Ejecución Fase 2: Nivel 1)

---

## 1. Métricas Globales de Ejecución

| Nivel de Prueba | Casos Planificados | Casos Ejecutados | Exitosos | Fallidos | Tasa de Éxito | Estado |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Nivel 1: Base de Datos** | 3 | 3 | 3 | 0 | **100%** | **Completado** |
| **Nivel 2: API REST** | 15 | 15 | 15 | 0 | **100%** | **Completado** |
| **Nivel 3: Integración E2E** | 10 | 10 | 10 | 0 | **100%** | **Completado** |
| **Nivel 4: Carga y Casos Límite** | 8 | 8 | 8 | 0 | **100%** | **Completado** |
| **Nivel 5: Usabilidad Clínica** | 1 | 1 | 1 | 0 | **100%** | **Completado** |
| **TOTAL CONSOLIDADO** | **37** | **37** | **37** | **0** | **100%** | **COMPLETADO** |

---

## 2. Resultados Detallados — NIVEL 1: Pruebas de Base de Datos

### Caso `DB-01`: Estructura de Tablas y Metadatos de IA
- **Fecha de Ejecución:** 2026-10-12 22:22:38
- **Herramienta:** PostgreSQL 18 `psql` CLI
- **Resultado Esperado:** 5 tablas con columnas correspondientes y tipos adecuados para telemetría de IA.
- **Resultado Obtenido:** Las 5 tablas existen en el esquema `public`. La tabla `intentos_practica` contiene exactamente las 4 columnas de IA requeridas (`confianza_promedio: double precision`, `fuente_prediccion: varchar`, `version_modelo: varchar`, `detalle_ia: text`). Total de 49 columnas mapeadas.
- **Veredicto:** 🟢 **EXITOSO**
- **Evidencia:** [DB-01-estructura-tablas.txt](file:///c:/Proyecto_grado/docs/testing/evidencias/db/DB-01-estructura-tablas.txt)

---

### Caso `DB-02`: Constraint CHECK para Roles de Usuario
- **Fecha de Ejecución:** 2026-10-12 22:22:46
- **Herramienta:** PostgreSQL 18 `psql` CLI
- **Resultado Esperado:** Transacción abortada con error de restricción de dominio `usuarios_rol_check`.
- **Resultado Obtenido:** Inserción abortada arrojando error PostgreSQL `23514: check_violation` al intentar registrar `rol = 'INVALIDO'`. El motor de persistencia protege la integridad del enum JPA.
- **Veredicto:** 🟢 **EXITOSO**
- **Evidencia:** [DB-02-constraint-rol.txt](file:///c:/Proyecto_grado/docs/testing/evidencias/db/DB-02-constraint-rol.txt)

---

### Caso `DB-03`: Integridad Referencial y Borrado en Cascada
- **Fecha de Ejecución:** 2026-10-12 22:24:58
- **Herramienta:** PostgreSQL 18 `psql` CLI
- **Resultado Esperado:** La eliminación de un usuario remueve atómicamente sus intentos, progreso y pasos completados sin dejar datos huérfanos.
- **Resultado Obtenido:**
  - *Inicial:* Identificado defecto `BUG-001` (claves foráneas con `NO ACTION` que bloqueaban el borrado arrojando error 23503).
  - *Post-Mitigación:* Se aplicó migración DDL configurando `ON DELETE CASCADE` en las 3 claves foráneas. La re-ejecución confirmó 0 intentos, 0 progresos y 0 pasos restantes tras eliminar el usuario.
- **Veredicto:** 🟢 **EXITOSO (Corregido y Validado)**
- **Evidencia:** [DB-03-cascada-usuarios.txt](file:///c:/Proyecto_grado/docs/testing/evidencias/db/DB-03-cascada-usuarios.txt)
- **Defecto Asociado:** [BUG-001](file:///c:/Proyecto_grado/docs/testing/bugs-encontrados.md#bug-001) (Cerrado)

---

## 3. Resultados Detallados — NIVEL 2: Pruebas de API REST

| Caso ID | Endpoint / Operación | Status Esperado | Status Obtenido | Veredicto | Resumen de Validación |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **`API-01`** | `POST /api/auth/register` | 201 | 201 | 🟢 EXITOSO | Crea usuario, emite JWT válido y genera registro inicial de progreso en BD. |
| **`API-02`** | `POST /api/auth/register` (Duplicado) | 400 | 400 | 🟢 EXITOSO | Rechaza email repetido con mensaje "Ya existe un usuario registrado con el email...". |
| **`API-03`** | `POST /api/auth/login` | 200 | 200 | 🟢 EXITOSO | Retorna token Bearer con `sub` del estudiante y expiración válida. |
| **`API-04`** | `POST /api/auth/login` (Credenciales Inválidas) | 401 | 401 | 🟢 EXITOSO | Rechaza clave errónea con mensaje "Credenciales incorrectas". |
| **`API-05`** | `POST /api/intentos` (Sin IA / Legacy) | 201 | 201 | 🟢 EXITOSO | Persiste intento legacy con `confianzaPromedio` y `fuentePrediccion` nulos sin error JPA. |
| **`API-06`** | `POST /api/intentos` (Con Metadatos IA) | 201 | 201 | 🟢 EXITOSO | Persiste `confianzaPromedio: 0.89`, `fuentePrediccion: CONSENSO`, `versionModelo: v1.0-2026-10` y `detalleIA` (JSON). |
| **`API-07`** | `POST /api/intentos` (Confianza > 1.0) | 400 | 400 | 🟢 EXITOSO | La anotación `@DecimalMax("1.0")` rechaza el valor 1.50 con HTTP 400. |
| **`API-08`** | `GET /api/intentos/mis-intentos` | 200 | 200 | 🟢 EXITOSO | Retorna historial cronológico de prácticas del estudiante autenticado. |
| **`API-09`** | `GET /api/progreso/mi-progreso` | 200 | 200 | 🟢 EXITOSO | Retorna indicadores consolidados (`intentosTotales`, `mejorPuntaje`, `promedioPuntaje`). |
| **`API-10`** | `DELETE /api/intentos/{id}` | 204 | 204 | 🟢 EXITOSO | Detectado y resuelto **BUG-002**. El intento se elimina y el progreso se recalcula. |
| **`API-11`** | `POST /api/ia/version` [ADMIN] | 201 | 201 | 🟢 EXITOSO | Registra `v1.1-2026-11` como activa y conmuta la versión previa a inactiva en BD. |
| **`API-12`** | `POST /api/ia/version` [ESTUDIANTE] | 403 | 403 | 🟢 EXITOSO | Spring Security bloquea acceso por regla RBAC `@PreAuthorize("hasRole('ADMIN')")`. |
| **`API-13`** | `GET /api/ia/version/activa` | 200 | 200 | 🟢 EXITOSO | Retorna la versión vigente con `activo: true` (`v1.1-2026-11`). |
| **`API-14`** | `GET /api/intentos/mis-intentos` (Sin Token) | 403 | 403 | 🟢 EXITOSO | Bloqueado por `SecurityConfig.anyRequest().authenticated()`. |
| **`API-15`** | `GET /api/intentos/mis-intentos` (Token Inválido) | 403 | 403 | 🟢 EXITOSO | Firma JWT falsificada detectada y rechazada por `JwtAuthenticationFilter`. |

*Todas las respuestas crudas e hipervínculos a los archivos de log se encuentran en el directorio [docs/testing/evidencias/api/](file:///c:/Proyecto_grado/docs/testing/evidencias/api/).*

---

## 4. Resultados Detallados — NIVEL 3: Pruebas de Integración E2E

| Caso ID | Flujo E2E Evaluado | Componentes Involucrados | Veredicto | Resumen de Validación |
| :---: | :--- | :--- | :---: | :--- |
| **`INT-01`** | Onboarding Completo de Estudiante | React UI $\leftrightarrow$ Spring Boot $\leftrightarrow$ PostgreSQL | 🟢 EXITOSO | Registro en formulario web, emisión de JWT en localStorage y redirección fluida a Dashboard con estado inicial consistente. |
| **`INT-02`** | Práctica Clínica Asistida por IA | React + TF.js $\leftrightarrow$ REST API $\leftrightarrow$ PostgreSQL | 🟢 EXITOSO | Inferencia de landmarks serializada y guardada en BD con `confianzaPromedio: 0.90`, `fuente: CONSENSO` y `version: v1.1-2026-11`. |
| **`INT-03`** | Actualización Reactiva de Dashboard | Zustand Store $\leftrightarrow$ REST API $\leftrightarrow$ PostgreSQL | 🟢 EXITOSO | Tras completar la práctica, el Dashboard consulta `/api/progreso/mi-progreso` e incrementa métricas y gráfico en tiempo real. |
| **`INT-04`** | Múltiples Sesiones y Consistencia Matemática | React UI $\leftrightarrow$ Spring Boot JPA $\leftrightarrow$ PostgreSQL | 🟢 EXITOSO | Tras 4 intentos disímiles, el promedio acumulado coincidió exactamente: $(950 + 800 + 900 + 750)/4 = 850.0$. |
| **`INT-05`** | Eliminación de Intento y Recálculo | React UI $\leftrightarrow$ Spring Boot $\leftrightarrow$ PostgreSQL | 🟢 EXITOSO | Eliminación mediante `DELETE /api/intentos/{id}` con borrado atómico y recálculo automático de promedio a 883.33 (3 intentos). |
| **`INT-06`** | Persistencia de Sesión ante Recarga (F5) | Browser Session $\leftrightarrow$ Zustand localStorage | 🟢 EXITOSO | Recarga forzada de página en `/dashboard` mantiene al estudiante logueado sin interrupción ni redirección a `/login`. |
| **`INT-07`** | Logout y Protección de Rutas | Zustand Auth Store $\leftrightarrow$ React Router DOM | 🟢 EXITOSO | Acción de "Salir" purga token de localStorage; acceso directo forzado a `/dashboard` es interceptado y redirige a `/login`. |
| **`INT-08`** | Flujo y Menú de Administrador | React UI $\leftrightarrow$ RBAC Guards $\leftrightarrow$ Spring Boot | 🟢 EXITOSO | Login con credenciales de Administrador habilita enlaces exclusivos ("Modelos IA", "Recolector") y permite gestión de versiones. |
| **`INT-09`** | Restricción de Rutas Admin para Estudiante | `RutaProtegida.tsx` $\leftrightarrow$ React Router | 🟢 EXITOSO | Intento de navegar a `/admin/modelos-ia` con rol `ESTUDIANTE` es interceptado y redirigido a `/dashboard`. |
| **`INT-10`** | Propagación de Versión Activa de IA | Spring Boot IA Service $\leftrightarrow$ `useVersionModelo` $\leftrightarrow$ BD | 🟢 EXITOSO | La versión activa vigente en backend (`v1.1-2026-11`) se propaga al frontend e indexa todos los nuevos intentos de práctica. |

*Evidencia multimedia interactiva:*
- 📹 Video de grabación E2E: [flujo_frontend_e2e.webp](file:///c:/Proyecto_grado/docs/testing/evidencias/integracion/flujo_frontend_e2e.webp)
- 📸 Captura Login: [login_page.png](file:///c:/Proyecto_grado/docs/testing/evidencias/frontend/login_page.png)
- 📸 Captura Dashboard: [dashboard_page.png](file:///c:/Proyecto_grado/docs/testing/evidencias/frontend/dashboard_page.png)
- 📸 Captura Panel Admin IA: [admin_modelos_ia_page.png](file:///c:/Proyecto_grado/docs/testing/evidencias/frontend/admin_modelos_ia_page.png)
- 📄 Log de Validación Cruzada: [INT-01-a-10-consolidado-integracion.txt](file:///c:/Proyecto_grado/docs/testing/evidencias/integracion/INT-01-a-10-consolidado-integracion.txt)

---

## 5. Resultados Detallados — NIVEL 4: Pruebas de Estrés y Casos Límite

| Caso ID | Escenario Límite / Carga | Carga / Parámetros | Veredicto | Resumen de Validación y Métricas |
| :---: | :--- | :--- | :---: | :--- |
| **`STRESS-01`** | Telemetría IA Masiva en Payload | `detalleIA: 67.1 KB` (250 frames) | 🟢 EXITOSO | Procesado y persistido en PostgreSQL en 222 ms sin desborde de memoria JVM. |
| **`STRESS-02`** | Ráfaga Secuencial de Intentos | 100 requests consecutivos | 🟢 EXITOSO | 100/100 exitosos en 1.91 s. Latencia media: 18.59 ms/req. Throughput: 52.3 req/s. 0% errores. |
| **`STRESS-03`** | Concurrencia de Múltiples Usuarios | 3 usuarios simultáneos (30 txs) | 🟢 EXITOSO | 30/30 transacciones completadas concurrentemente con aislamiento ACID íntegro. |
| **`EDGE-01`** | Práctica Incompleta (Abandono) | `pasos: 3/6`, `completado: false` | 🟢 EXITOSO | Detectado y resuelto **BUG-003** (modo `SIMULACION`). Guardado exitoso reflejando abandono. |
| **`EDGE-02`** | Intento Perfecto (Desempeño Óptimo) | `puntaje: 1000`, `errores: 0`, `conf: 0.98` | 🟢 EXITOSO | Detectado y resuelto **BUG-003** (modo `DESAFIO`). Registro de puntaje perfecto y mejor puntaje. |
| **`EDGE-03`** | Duración 0 Segundos | `duracionSegundos: 0`, `puntaje: 0` | 🟢 EXITOSO | Operación completada sin excepciones de división por cero en fórmulas agregadas. |
| **`EDGE-04`** | Cámara Bloqueada / Permiso Denegado | Simulación de excepción MediaPipe | 🟢 EXITOSO | Manejo defensivo en `VideoCanvas`: muestra banner amigable con opción de reintento sin congelar UI. |
| **`EDGE-05`** | Conexión Offline y Respaldo Local | Simulación Network Offline | 🟢 EXITOSO | El intento se respalda en `localStorage` (`intentos_pendientes_sincronizacion`) y se sincroniza al recuperar red. |

*Archivo de log detallado:* [NIVEL-4-estres-y-casos-limite.txt](file:///c:/Proyecto_grado/docs/testing/evidencias/integracion/NIVEL-4-estres-y-casos-limite.txt)

---

## 6. Resultados Detallados — NIVEL 5: Usabilidad Clínica con Estudiantes

| Caso ID | Sujetos Evaluados | Instrumento | Veredicto | Resumen de Validación y Métricas |
| :---: | :--- | :--- | :---: | :--- |
| **`UX-01`** | 3 Estudiantes de Enfermería UCC Pasto (`EST-01`, `EST-02`, `EST-03`) | System Usability Scale (SUS) + Matriz de Desempeño Clínico | 🟢 EXITOSO | - **Tasa de Completitud:** 100% (6/6 pasos clínicos completados).<br>- **Tiempo Promedio:** 168.6 segundos.<br>- **Confianza Media IA:** 89.0% (`CONSENSO`).<br>- **Puntaje Global SUS:** **92.5 / 100** (*Excelente / Percentil 96*). |

*Documento detallado de usabilidad:* [docs/testing/metricas-usabilidad.md](file:///c:/Proyecto_grado/docs/testing/metricas-usabilidad.md)
