-- Migration: Seed English Indicators (Hierarchical)
-- Description: Populates English indicators with Routines and Competency-Indicator hierarchy based on user provided document
-- Date: 2025-01-24

-- Function to seed hierarchical indicators
CREATE OR REPLACE FUNCTION seed_hierarchical_indicators(
    subject_pattern TEXT,
    grade_pattern TEXT,
    routine_name TEXT,
    data JSONB
) RETURNS VOID AS $$
DECLARE
    class_record RECORD;
    comp_record JSONB;
    ind_record JSONB;
    comp_id UUID;
    comp_order INTEGER;
    ind_order INTEGER;
BEGIN
    -- Find classes matching subject and grade
    FOR class_record IN 
        SELECT id_clase, nombre_materia, grado_asignado 
        FROM clases 
        WHERE nombre_materia ILIKE subject_pattern 
        AND (grade_pattern IS NULL OR grado_asignado ILIKE grade_pattern)
    LOOP
        comp_order := 1;
        
        -- Loop through competencies
        FOR comp_record IN SELECT * FROM jsonb_array_elements(data) LOOP
            
            -- Insert Competency
            INSERT INTO maestra_indicadores (
                id_clase, categoria, descripcion, orden, activo, rutina
            ) VALUES (
                class_record.id_clase,
                'Competencia',
                (comp_record->>'competency'),
                comp_order,
                true,
                routine_name
            ) RETURNING id_indicador INTO comp_id;

            -- Insert Indicators for this Competency
            ind_order := 1;
            FOR ind_record IN SELECT * FROM jsonb_array_elements(comp_record->'indicators') LOOP
                INSERT INTO maestra_indicadores (
                    id_clase, categoria, descripcion, orden, activo, rutina, id_padre
                ) VALUES (
                    class_record.id_clase,
                    'Indicador',
                    (ind_record->>'text'),
                    ind_order,
                    true,
                    routine_name,
                    comp_id
                );
                ind_order := ind_order + 1;
            END LOOP;

            comp_order := comp_order + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Seed English 1st Grade (USE OF ENGLISH)
SELECT seed_hierarchical_indicators(
    '%Inglés%', -- Subject pattern
    '%1er%',    -- Grade pattern (adjust as needed, e.g. '%1er%' for 1er Grado)
    'USE OF ENGLISH', -- Routine
    '[
        {
            "competency": "Identifies and uses words that name actions, directions, positions, sequences, categories, and locations",
            "indicators": [
                {"text": "Uses verbs to describe actions in pictures and real life"},
                {"text": "Labels action verbs in different sentences"},
                {"text": "Responds appropriately to simple instructions with action verbs"}
            ]
        },
        {
            "competency": "Identifies and uses singular, plural, common, and proper nouns, including gender-specific articles.",
            "indicators": [
                {"text": "Correctly forms plurals of regular nouns by adding -s or -es"},
                {"text": "Uses singular and plural nouns appropriately in sentences"},
                {"text": "Understands the difference between common nouns and proper nouns"},
                {"text": "Uses common and proper nouns appropriately in sentences"}
            ]
        },
        {
            "competency": "Uses adjectives, including articles, and adverbs that convey time.",
            "indicators": [
                {"text": "Recognizes adjectives in spoken and written language."},
                {"text": "Uses adjectives to compare objects"},
                {"text": "Describes people, animal or places"},
                {"text": "Correctly places adjectives before the nouns they describe"},
                {"text": "Recognizes the definite article \"the\" and indefinite articles \"a\" and \"an.\""},
                {"text": "Understands when to use \"a\" or \"an\" based on the sound of the following word."},
                {"text": "Recognizes common time adverbs (e.g., now, today, yesterday, tomorrow, soon, later)."},
                {"text": "Places time adverbs appropriately in sentences to indicate when an action happens or will happen"}
            ]
        },
        {
            "competency": "Uses prepositions and pronouns, including personal and possessive pronouns.",
            "indicators": [
                {"text": "Recognizes common prepositions in spoken and written language"},
                {"text": "Uses prepositions correctly in sentences to describe the location of objects or people"},
                {"text": "Physically demonstrates understanding of prepositions through movement or manipulation of objects."},
                {"text": "Uses personal pronouns correctly in sentences to replace nouns"},
                {"text": "Replaces nouns with appropriate pronouns to avoid repetition in sentences"},
                {"text": "Uses possessive pronouns correctly to show ownership"},
                {"text": "Distinguishes between possessive pronouns and possessive adjectives"}
            ]
        },
        {
            "competency": "Identifies \"there is , there are\" in simple sentences",
            "indicators": [
                {"text": "Distinguishes between \"there is\" and \"there are\" in spoken and written language."},
                {"text": "Points to or verbally identifies sentences that use \"there is\" or \"there are.\""},
                {"text": "Fills in the blank with the correct form of \"there is/are\" in simple sentences"},
                {"text": "Uses \"there is\" and \"there are\" to describe the presence of objects or people in a location"},
                {"text": "Asks and answers questions using \"there is\" and \"there are\""},
                {"text": "Builds simple sentences using \"there is\" and \"there are\" to describe their surroundings or pictures."}
            ]
        },
        {
            "competency": "Recognizes the distinguishing features of a sentence",
            "indicators": [
                {"text": "Completes sentence fragments by adding missing words to make a complete sentence."},
                {"text": "Distinguishes between a sentence and a phrase or a random string of words."},
                {"text": "Identifies the subject of a sentence"},
                {"text": "Identifies the verb in a sentence"},
                {"text": "Identifies the object of a sentence"},
                {"text": "Builds simple sentences with a subject and a verb"}
            ]
        }
    ]'::jsonb
);

-- Seed English 1st Grade (LISTENING - Example Generic)
SELECT seed_hierarchical_indicators(
    '%Inglés%', 
    '%1er%', 
    'LISTENING', 
    '[
        {
            "competency": "Understands simple oral instructions",
            "indicators": [
                {"text": "Follows one-step instructions"},
                {"text": "Follows two-step instructions"},
                {"text": "Identifies key words in a story read aloud"}
            ]
        }
    ]'::jsonb
);

-- Cleanup
DROP FUNCTION seed_hierarchical_indicators(TEXT, TEXT, TEXT, JSONB);
