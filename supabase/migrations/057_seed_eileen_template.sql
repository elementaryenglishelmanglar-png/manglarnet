-- =====================================================
-- Plantilla de Evaluación: Teachers Primaria (basada en Eileen.html)
-- =====================================================

-- 1. Crear la plantilla principal
INSERT INTO rrhh_templates (id, name, description, active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Evaluación Docentes Primaria 2025-2026',
    'Evaluación de desempeño para Teachers de Primaria',
    true
);

-- =====================================================
-- ÁREA 1: Liderazgo Académico - Gestión Pedagógica y de Aula (40%)
-- =====================================================

INSERT INTO rrhh_areas (id, template_id, name, weight_percentage, order_index)
VALUES (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Liderazgo académico - Gestión pedagógica y de aula',
    40,
    1
);

-- Subárea 1.1: Planificación y Ejecución Curricular (10%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0001-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Planificación y Ejecución Curricular',
    25,
    1
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0001-000000000001', 'Planifica el alcance de competencias de manera oportuna y de acuerdo con el Centro de interés.', 1),
('00000000-0000-0001-0001-000000000001', 'Comparte su planificación en el drive, expresada en forma clara y de acuerdo al diseño de competencias para el grado.', 2),
('00000000-0000-0001-0001-000000000001', 'Existe coherencia entre la planificación y la clase.', 3),
('00000000-0000-0001-0001-000000000001', 'Selecciona y prepara recursos de calidad oportunamente.', 4),
('00000000-0000-0001-0001-000000000001', 'Se evidencia la integración curricular en sus clases favoreciendo el desarrollo de los proyectos.', 5),
('00000000-0000-0001-0001-000000000001', 'Utiliza la plataforma CANVAS para compartir sus clases y material de estudio.', 6),
('00000000-0000-0001-0001-000000000001', 'Implementa y documenta estrategias innovadoras o activas semanalmente.', 7),
('00000000-0000-0001-0001-000000000001', 'Planifica salidas de campo o visitas de invitados especiales para enriquecer sus clases.', 8),
('00000000-0000-0001-0001-000000000001', 'Documenta 5 proyectos o estrategias innovadoras (ABP, gamificación, aprendizaje-servicio, etc.) en un mes de clases.', 9),
('00000000-0000-0001-0001-000000000001', 'Al menos 20% de proyectos o actividades del área evidencian una clara integración de los pilares educativos del colegio (ej: Manglarte, conciencia global, introspección).', 10);

-- Subárea 1.2: Desempeño en el Aula (15%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Desempeño en el Aula',
    37.5,
    2
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0002-000000000001', 'Mantiene el uso del inglés como lengua principal de instrucción en al menos un 90% de la clase, ajustando la velocidad y vocabulario al nivel del grupo.', 1),
('00000000-0000-0001-0002-000000000001', 'Integra de manera equilibrada los bloques de clase con dos rutinas diferentes (Ej. Listening, Speaking) asegurándose de que haya producción de ambas habilidades.', 2),
('00000000-0000-0001-0002-000000000001', 'Aplica técnicas de corrección de errores de manera efectiva sin interrumpir excesivamente la fluidez comunicativa.', 3),
('00000000-0000-0001-0002-000000000001', 'El salón está ordenado y el docente se adueña de la rutina de orden y atención.', 4),
('00000000-0000-0001-0002-000000000001', 'Se inicia la clase con instrucciones claras, anticipando a los estudiantes de lo que se espera de la clase.', 5),
('00000000-0000-0001-0002-000000000001', 'Se observa un modelaje cónsono con la labor docente: código de vestimenta, postura, manejo del espacio físico.', 6),
('00000000-0000-0001-0002-000000000001', 'Utiliza un tono de voz y lenguaje adecuado.', 7),
('00000000-0000-0001-0002-000000000001', '¿Se incluyen en el espacio de inicio, preguntas generadoras? / Se hace el inicio basado en el recuento de saberes previos.', 8),
('00000000-0000-0001-0002-000000000001', '¿Se hace uso de elementos, recursos o estrategias innovadoras? (uso de tecnología, dinámicas, debates, material concreto)', 9),
('00000000-0000-0001-0002-000000000001', 'El desarrollo de la clase refleja preparación previa, el docente domina la competencia.', 10),
('00000000-0000-0001-0002-000000000001', 'Se desarrolla la clase respetando la gestión del tiempo: inicio, desarrollo y cierre.', 11),
('00000000-0000-0001-0002-000000000001', 'La clase se desarrolla siguiendo un hilo conductor claro y pertinente.', 12),
('00000000-0000-0001-0002-000000000001', 'Utiliza "Realia", soporte visual o gestual (TPR) para asegurar la comprensión del vocabulario sin recurrir a la traducción inmediata.', 13),
('00000000-0000-0001-0002-000000000001', '¿Responden los alumnos de forma positiva a las estrategias diseñadas para la clase?', 14),
('00000000-0000-0001-0002-000000000001', 'Se asegura que todos los estudiantes participen en las actividades propuestas.', 15),
('00000000-0000-0001-0002-000000000001', '¿Se atienden en la clase las inquietudes individuales de todos los alumnos?', 16),
('00000000-0000-0001-0002-000000000001', 'Se vincula la clase con el soporte en CANVAS.', 17),
('00000000-0000-0001-0002-000000000001', 'Se corrigen los errores conceptuales que presentan los estudiantes.', 18),
('00000000-0000-0001-0002-000000000001', 'Se realiza atención individualizada a los alumnos con adecuaciones curriculares.', 19),
('00000000-0000-0001-0002-000000000001', 'Cierra la clase asegurándose de cubrir lo esperado, de no ser así, lo deja claro para retomar en una nueva ocasión.', 20),
('00000000-0000-0001-0002-000000000001', 'El cierre evidencia procesos metacognitivos.', 21),
('00000000-0000-0001-0002-000000000001', 'Deja el salón ordenado.', 22);

-- Subárea 1.3: Logro Académico (7%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0003-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Logro Académico',
    17.5,
    3
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0003-000000000001', 'Implementa y da seguimiento a un plan de apoyo específico para los estudiantes identificados con rendimiento por debajo del nivel esperado.', 1),
('00000000-0000-0001-0003-000000000001', 'Al menos el 70% de los estudiantes bajo su supervisión alcanzan el nivel de logro esperado ("B" o superior) en las evaluaciones sumativas estandarizadas del área.', 2),
('00000000-0000-0001-0003-000000000001', 'Mantiene al día el seguimiento de la plataforma de IEDUCA para el seguimiento académico y conductual.', 3),
('00000000-0000-0001-0003-000000000001', 'Diseña e implementa sesiones de refuerzo para aquellas competencias no adquiridas por el grupo.', 4);

-- Subárea 1.4: Evaluación y seguimiento continuo (8%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0004-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Evaluación y seguimiento continuo',
    20,
    4
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0004-000000000001', 'Describe las fortalezas y debilidades de su grupo de alumnos.', 1),
('00000000-0000-0001-0004-000000000001', 'Refuerza positivamente a los alumnos por el uso de los hábitos de estudio.', 2),
('00000000-0000-0001-0004-000000000001', 'Comparte con los niños en el recreo.', 3),
('00000000-0000-0001-0004-000000000001', 'Utiliza instrumentos y estrategias de evaluación diversas que favorecen distintos tipos de aprendizaje.', 4),
('00000000-0000-0001-0004-000000000001', 'Agrupa estudiantes por necesidades específicas para atención focalizada.', 5),
('00000000-0000-0001-0004-000000000001', 'Detecta y atiende las necesidades individuales de sus alumnos.', 6),
('00000000-0000-0001-0004-000000000001', 'Analiza los resultados de evaluaciones para identificar patrones de error.', 7),
('00000000-0000-0001-0004-000000000001', 'Proporciona retroalimentación escrita en evaluaciones y actividades con aspectos a mejorar concretos.', 8),
('00000000-0000-0001-0004-000000000001', 'Mantiene a los padres informados del desarrollo de las evaluaciones en el transcurso del lapso.', 9),
('00000000-0000-0001-0004-000000000001', 'Registra en IEDUCA las notas de forma oportuna.', 10);

-- =====================================================
-- ÁREA 2: Gestión de Relaciones y Ambientes de Aprendizaje (30%)
-- =====================================================

INSERT INTO rrhh_areas (id, template_id, name, weight_percentage, order_index)
VALUES (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Gestión de Relaciones y Ambientes de Aprendizaje',
    30,
    2
);

-- Subárea 2.1: Desarrollo Profesional y Reflexión (10%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0005-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Desarrollo Profesional y Reflexión',
    33.33,
    1
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0005-000000000001', 'Elabora y cumple un Plan de Desarrollo Individual (PDI) basado en su autoevaluación y observación de aula.', 1),
('00000000-0000-0001-0005-000000000001', 'Participa en al menos 2 actividades de desarrollo profesional por lapso (cursos, talleres, comunidades de aprendizaje).', 2),
('00000000-0000-0001-0005-000000000001', 'Aplica en el aula al menos 1 estrategia o conocimiento adquirido en formaciones y lo documenta.', 3),
('00000000-0000-0001-0005-000000000001', 'Comparte con al menos 1 colega una experiencia o recurso derivado de su formación.', 4),
('00000000-0000-0001-0005-000000000001', 'Participa activamente en todas las sesiones de observación y retroalimentación programadas.', 5),
('00000000-0000-0001-0005-000000000001', 'Implementa los ajustes sugeridos en las sesiones de retroalimentación.', 6);

-- Subárea 2.2: Clima de Aula y Relación con Estudiantes (5%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0006-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Clima de Aula y Relación con Estudiantes',
    16.67,
    2
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0006-000000000001', 'Promueve un ambiente de respeto y confianza en el aula, donde los estudiantes se sienten seguros para participar.', 1),
('00000000-0000-0001-0006-000000000001', 'Realiza al menos 1 actividad de integración o reconocimiento grupal por lapso (ej: celebraciones, reconocimientos públicos).', 2),
('00000000-0000-0001-0006-000000000001', 'Mantiene una comunicación positiva y motivadora con todos los estudiantes, especialmente con aquellos con mayores dificultades.', 3),
('00000000-0000-0001-0006-000000000001', 'Refuerza positivamente a los alumnos cuando buscan información.', 4),
('00000000-0000-0001-0006-000000000001', 'Se relaciona positivamente con sus alumnos.', 5);

-- Subárea 2.3: Comunicación Efectiva con Familias y Compañeros (5%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0007-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Comunicación Efectiva con Familias y Compañeros',
    16.67,
    3
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0007-000000000001', 'Publica y cumple con la publicación de las noticias de la semana de forma oportuna.', 1),
('00000000-0000-0001-0007-000000000001', 'Conduce y documenta al menos 1 reunión formal con familias por lapso, con minuta que incluya acuerdos y compromisos.', 2),
('00000000-0000-0001-0007-000000000001', 'Comunica cambios en calendarios, evaluaciones o actividades con al menos 48 horas de anticipación.', 3),
('00000000-0000-0001-0007-000000000001', 'Responde a consultas de familias o colegas en un plazo no mayor a 24 horas hábiles en el 90% de los casos.', 4),
('00000000-0000-0001-0007-000000000001', 'Notifica oportunamente a las familias los registros anecdóticos.', 5),
('00000000-0000-0001-0007-000000000001', 'Conoce y maneja la terminología presente en el manual de convivencia escolar.', 6);

-- Subárea 2.4: Gestión del Tiempo y Recursos del Aula (5%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0008-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Gestión del Tiempo y Recursos del Aula',
    16.67,
    4
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0008-000000000001', 'Cumple con el 100% de las fechas críticas de entrega de planificaciones, evaluaciones y reportes.', 1),
('00000000-0000-0001-0008-000000000001', 'Realiza seguimiento sistemático a los acuerdos y tareas asignadas en reuniones de equipo o nivel.', 2),
('00000000-0000-0001-0008-000000000001', 'Gestiona los recursos del aula (materiales, equipos) de forma eficiente, justificando necesidades pedagógicas.', 3),
('00000000-0000-0001-0008-000000000001', 'Identifica y reporta a coordinación riesgos o desvíos en la ejecución de actividades, proponiendo soluciones.', 4);

-- Subárea 2.5: Resolución Proactiva de Situaciones de Conflicto (5%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0009-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Resolución Proactiva de Situaciones de Conflicto',
    16.67,
    5
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0009-000000000001', 'Documenta y da seguimiento a situaciones de conflicto o incidentes de convivencia en el aula, con registro de acciones.', 1),
('00000000-0000-0001-0009-000000000001', 'Resuelve o da seguimiento al 80% de las situaciones documentadas en el lapso, con evidencia de cierre o mejora.', 2),
('00000000-0000-0001-0009-000000000001', 'Comunica a las partes involucradas (estudiantes, familias) el cierre o avance en la resolución de situaciones.', 3),
('00000000-0000-0001-0009-000000000001', 'Aplica estrategias de mediación o restauración cuando corresponde, fomentando la autonomía emocional en los estudiantes.', 4);

-- =====================================================
-- ÁREA 3: Compromiso Institucional (Sustentabilidad Manglareña) (20%)
-- =====================================================

INSERT INTO rrhh_areas (id, template_id, name, weight_percentage, order_index)
VALUES (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Compromiso Institucional (Sustentabilidad Manglareña)',
    20,
    3
);

-- Subárea 3.1: Filosofía Manglareña (8%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0010-000000000001',
    '00000000-0000-0000-0003-000000000001',
    'Filosofía Manglareña',
    40,
    1
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0010-000000000001', 'Diversifica las actividades ofreciendo opciones y rutas de aprendizaje que permitan elección y ritmos distintos.', 1),
('00000000-0000-0001-0010-000000000001', 'Vincula el desarrollo de sus clases con los valores institucionales.', 2),
('00000000-0000-0001-0010-000000000001', 'Implementa al menos 1 estrategia de reconocimiento emocional por lapso y adapta su trato a las necesidades individuales.', 3),
('00000000-0000-0001-0010-000000000001', 'Promueve la autonomía estudiantil permitiendo que los estudiantes tomen decisiones sobre su aprendizaje en al menos 1 actividad por semana.', 4),
('00000000-0000-0001-0010-000000000001', 'Integra al menos 1 actividad de conciencia ambiental o social por lapso vinculada al currículo.', 5),
('00000000-0000-0001-0010-000000000001', 'Fomenta el pensamiento crítico mediante preguntas abiertas y debates en al menos el 50% de las clases.', 6),
('00000000-0000-0001-0010-000000000001', 'Documenta y comparte al menos 1 experiencia de aprendizaje significativo de sus estudiantes por lapso.', 7),
('00000000-0000-0001-0010-000000000001', 'Participa activamente en al menos 1 iniciativa institucional (eventos, comités, proyectos transversales) por lapso.', 8),
('00000000-0000-0001-0010-000000000001', 'Modela los valores institucionales en su interacción diaria con estudiantes, familias y colegas.', 9);

-- Subárea 3.2: Colaboración y Trabajo en Equipo (6%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0011-000000000001',
    '00000000-0000-0000-0003-000000000001',
    'Colaboración y Trabajo en Equipo',
    30,
    2
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0011-000000000001', 'Participa activamente en reuniones de nivel/área, aportando ideas y soluciones constructivas.', 1),
('00000000-0000-0001-0011-000000000001', 'Colabora con colegas en la planificación de actividades interdisciplinarias o proyectos integrados.', 2),
('00000000-0000-0001-0011-000000000001', 'Comparte recursos, estrategias o materiales con al menos 2 colegas por lapso.', 3),
('00000000-0000-0001-0011-000000000001', 'Asiste puntualmente a todas las reuniones y actividades institucionales programadas.', 4),
('00000000-0000-0001-0011-000000000001', 'Mantiene una actitud positiva y proactiva frente a los desafíos institucionales.', 5);

-- Subárea 3.3: Identidad y Representación Institucional (6%)
INSERT INTO rrhh_subareas (id, area_id, name, relative_weight, order_index)
VALUES (
    '00000000-0000-0001-0012-000000000001',
    '00000000-0000-0000-0003-000000000001',
    'Identidad y Representación Institucional',
    30,
    3
);

INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
('00000000-0000-0001-0012-000000000001', 'Cumple con el código de vestimenta y presentación personal establecido por la institución.', 1),
('00000000-0000-0001-0012-000000000001', 'Representa positivamente a la institución en eventos externos o comunicaciones con familias.', 2),
('00000000-0000-0001-0012-000000000001', 'Conoce y aplica los protocolos institucionales en situaciones académicas y de convivencia.', 3),
('00000000-0000-0001-0012-000000000001', 'Promueve la imagen institucional a través de la calidad de su trabajo y comunicación.', 4),
('00000000-0000-0001-0012-000000000001', 'Participa en la difusión de logros institucionales a través de redes sociales o comunicaciones oficiales.', 5);
