# Registro y Control de Defectos (Bugs Encontrados) 🐞

> **Proyecto:** Simulador de Técnica Estéril — Postura de Guantes Quirúrgicos  
> **Universidad Cooperativa de Colombia — Campus Pasto**  
> **Área:** Aseguramiento de Calidad de Software (QA)

---

## 1. Resumen de Estado de Defectos

| Total Encontrados | Críticos | Altos | Medios | Bajos | Cerrados / Resueltos | Abiertos |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **3** | 0 | 2 | 1 | 0 | **3** | 0 |

---

## 2. Detalle de Defectos

### BUG-001: Ausencia de regla de borrado en cascada (ON DELETE CASCADE) en llaves foráneas de usuario
- **ID:** `BUG-001`
- **Título:** Ausencia de restricción `ON DELETE CASCADE` en claves foráneas de `intentos_practica`, `progresos` y `pasos_completados`
- **Severidad:** Media
- **Prioridad:** Alta
- **Componente:** Base de Datos / Persistencia Relacional
- **Fecha de Detección:** 2026-10-12
- **Caso Asociado:** `DB-03`
- **Pasos para Reproducir:**
  1. Insertar un usuario de prueba en `usuarios`.
  2. Insertar registros asociados en `progresos`, `intentos_practica` y `pasos_completados`.
  3. Ejecutar sentencia de borrado: `DELETE FROM usuarios WHERE email = 'testcascada@test.com';`.
- **Resultado Esperado:** El motor de base de datos debe eliminar en cascada todas las filas asociadas en `intentos_practica`, `pasos_completados` y `progresos` sin dejar tuplas huérfanas.
- **Resultado Obtenido:** Error PostgreSQL `23503: foreign_key_violation` con mensaje:  
  `ERROR: update o delete en «usuarios» viola la llave foránea «fkl5p8og4xym3mkqwofipoik5fb» en la tabla «intentos_practica»`.
- **Evidencia:** [DB-03-cascada-usuarios.txt](file:///c:/Proyecto_grado/docs/testing/evidencias/db/DB-03-cascada-usuarios.txt)
- **Ambiente:**
  - Base de Datos: PostgreSQL 18.3 x64 Windows
  - Esquema: `guantes_db` (public)
- **Causa Raíz:**
  Hibernate generó las claves foráneas por defecto con `delete_rule = NO ACTION`, impidiendo la propagación física de eliminaciones y generando potenciales excepciones `DataIntegrityViolationException` si se ejecutaba una depuración de cuentas desde el panel docente/administrativo.
- **Solución Propuesta y Aplicada:**
  Se actualizaron las 3 restricciones foráneas en la base de datos `guantes_db`:
  ```sql
  ALTER TABLE pasos_completados DROP CONSTRAINT fkgaos39djmre5yjxfuenl578kv;
  ALTER TABLE pasos_completados ADD CONSTRAINT fkgaos39djmre5yjxfuenl578kv 
      FOREIGN KEY (intento_id) REFERENCES intentos_practica(id) ON DELETE CASCADE;

  ALTER TABLE intentos_practica DROP CONSTRAINT fkl5p8og4xym3mkqwofipoik5fb;
  ALTER TABLE intentos_practica ADD CONSTRAINT fkl5p8og4xym3mkqwofipoik5fb 
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

  ALTER TABLE progresos DROP CONSTRAINT fk3rdrf36k70chrnbuskgd8y9tq;
  ALTER TABLE progresos ADD CONSTRAINT fk3rdrf36k70chrnbuskgd8y9tq 
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
  ```
- **Verificación:** Tras la aplicación del script DDL, la sentencia `DELETE FROM usuarios` eliminó de forma atómica y transparente las filas asociadas arrojando conteo exacto de 0 registros residuales.
- **Estado:** **Cerrado / Resuelto**

---

### BUG-002: Falta de endpoint DELETE /api/intentos/{id} y respuesta HTTP 500 ante métodos HTTP no soportados
- **ID:** `BUG-002`
- **Título:** Ausencia de endpoint `DELETE /api/intentos/{id}` y captura defectuosa de `HttpRequestMethodNotSupportedException` generando HTTP 500
- **Severidad:** Alta
- **Prioridad:** Alta
- **Componente:** Backend (Spring Boot: `IntentoController`, `IntentoService`, `GlobalExceptionHandler`)
- **Fecha de Detección:** 2026-10-12
- **Caso Asociado:** `API-10`
- **Pasos para Reproducir:**
  1. Autenticarse como estudiante y obtener token JWT.
  2. Enviar petición HTTP `DELETE http://localhost:8080/api/intentos/{id}`.
- **Resultado Esperado:** HTTP `204 No Content` eliminando el intento y recalculando el progreso, o HTTP `405 Method Not Allowed` en caso de inmutabilidad estricta.
- **Resultado Obtenido:** HTTP `500 Internal Server Error` con el payload:  
  `{"path":"/api/intentos/3","error":"Error interno del servidor","message":"Request method 'DELETE' is not supported","status":500}`.
- **Evidencia:** [API-10-eliminar-intento.txt](file:///c:/Proyecto_grado/docs/testing/evidencias/api/API-10-eliminar-intento.txt)
- **Ambiente:** Spring Boot 3.2, Java 21, Tomcat 11
- **Causa Raíz:**
  1. `IntentoController` carecía del método con `@DeleteMapping("/{id}")`.
  2. `GlobalExceptionHandler` no contaba con un manejador específico para `HttpRequestMethodNotSupportedException.class`, delegando la excepción al manejador genérico `Exception.class` que emitía HTTP 500.
- **Solución Propuesta y Aplicada:**
  1. Se implementó el método `eliminarIntento(Long id, String email)` en `IntentoService` con validación de pertenencia o rol administrativo y llamada a `progresoService.recalcularProgreso(usuarioId)`.
  2. Se expuso `@DeleteMapping("/{id}")` en `IntentoController`.
  3. Se añadió `@ExceptionHandler(HttpRequestMethodNotSupportedException.class)` en `GlobalExceptionHandler` devolviendo código HTTP `405 METHOD_NOT_ALLOWED`.
- **Verificación:** Se re-ejecutó la prueba `API-10`, obteniendo respuesta exitosa HTTP `204 No Content` y sincronización inmediata de estadísticas de progreso.
- **Estado:** **Cerrado / Resuelto**

---

### BUG-003: Incompatibilidad de enum ModoPractica (SIMULACION, DESAFIO) provocando HTTP 500
- **ID:** `BUG-003`
- **Título:** Desalineación de enum `ModoPractica` entre Frontend y Backend provocando error HTTP 500 por captura genérica de excepciones
- **Severidad:** Alta
- **Prioridad:** Alta
- **Componente:** Backend / Base de Datos (`ModoPractica.java`, `GlobalExceptionHandler.java`, PostgreSQL DDL)
- **Fecha de Detección:** 2026-10-12
- **Casos Asociados:** `EDGE-01`, `EDGE-02`
- **Pasos para Reproducir:**
  1. Enviar una petición HTTP `POST /api/intentos` con payload que incluya `"modoPractica": "SIMULACION"` o `"modoPractica": "DESAFIO"` (modos utilizados en la interfaz de React).
- **Resultado Esperado:** HTTP `201 Created` aceptando el modo clínico o HTTP `400 Bad Request` si el valor no fuera parte del dominio.
- **Resultado Obtenido:** HTTP `500 Internal Server Error` debido a fallo de deserialización en Jackson (`Cannot deserialize value of type ModoPractica from String "SIMULACION"`).
- **Evidencia:** [NIVEL-4-estres-y-casos-limite.txt](file:///c:/Proyecto_grado/docs/testing/evidencias/integracion/NIVEL-4-estres-y-casos-limite.txt)
- **Ambiente:** Spring Boot 3.2, PostgreSQL 18, React 19
- **Causa Raíz:**
  1. El enum `ModoPractica.java` en Spring Boot solo contemplaba `GUIADO`, `EVALUACION`, `LIBRE`, `ENTRENAMIENTO`, mientras que el frontend emitía `SIMULACION` y `DESAFIO`.
  2. La restricción CHECK `intentos_practica_modo_practica_check` en PostgreSQL no admitía `SIMULACION` ni `DESAFIO`.
  3. `GlobalExceptionHandler.java` no gestionaba `HttpMessageNotReadableException`, arrojando código 500 ante cualquier valor no deserializable.
- **Solución Propuesta y Aplicada:**
  1. Se expandió `ModoPractica.java` incorporando `SIMULACION` y `DESAFIO`.
  2. Se actualizó la restricción CHECK en PostgreSQL para incluir los nuevos literales:
     ```sql
     ALTER TABLE intentos_practica DROP CONSTRAINT intentos_practica_modo_practica_check;
     ALTER TABLE intentos_practica ADD CONSTRAINT intentos_practica_modo_practica_check 
     CHECK (modo_practica::text = ANY (ARRAY['GUIADO', 'EVALUACION', 'LIBRE', 'ENTRENAMIENTO', 'SIMULACION', 'DESAFIO']::text[]));
     ```
  3. Se añadió `@ExceptionHandler(HttpMessageNotReadableException.class)` en `GlobalExceptionHandler.java` retornando HTTP 400 `BAD_REQUEST`.
- **Verificación:** Re-ejecución de los casos `EDGE-01` y `EDGE-02` completada exitosamente con HTTP `201 Created`.
- **Estado:** **Cerrado / Resuelto**
