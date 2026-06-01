DO $$
DECLARE
    v_idemision              BIGINT := 244;
    v_iddocumento           BIGINT := 1;
    v_documento             VARCHAR(250) := 'DOCUMENTO DE RESPALDO';
    v_referencia            VARCHAR(250) := 'Informe / memorando de respaldo';
    v_motivo                TEXT := 'Anulacion manual de la emision 244 para regularizacion y visualizacion en el registro de auditoria.';
    v_usuario               BIGINT := 1;
    v_ip                    VARCHAR(100) := '127.0.0.1';
    v_equipo                VARCHAR(150) := 'SCRIPT_SQL';
    v_estado_anterior       INTEGER;
    v_facturas_actualizadas INTEGER := 0;
    v_rubros_actualizados   INTEGER := 0;
BEGIN
    SELECT e.estado
      INTO v_estado_anterior
      FROM emisiones e
     WHERE e.idemision = v_idemision
     FOR UPDATE;

    IF v_estado_anterior IS NULL THEN
        RAISE EXCEPTION 'No existe la emision %', v_idemision;
    END IF;

    IF v_estado_anterior NOT IN (1, 2) THEN
        RAISE EXCEPTION 'La emision % no esta en estado permitido para anular. Estado actual: %', v_idemision, v_estado_anterior;
    END IF;

    UPDATE emisiones e
       SET estado                         = 3,
           motivo_anulacion               = v_motivo,
           iddocumento_anulacion          = v_iddocumento,
           documento_anulacion            = v_documento,
           referencia_documento_anulacion = v_referencia,
           usuario_anulacion              = v_usuario,
           fechaanulacion                 = NOW(),
           usumodi                        = v_usuario,
           fecmodi                        = NOW()
     WHERE e.idemision = v_idemision;

    INSERT INTO auditoria_generica (
        entidad,
        entidad_id,
        usumodi,
        fecmodi,
        tipo,
        observacion,
        object_json
    )
    VALUES (
        'EMISIONES',
        v_idemision,
        v_usuario,
        NOW(),
        'MODIFICACION',
        v_motivo,
        jsonb_build_object(
            'modulo', 'EMISIONES',
            'accion', 'ANULAR',
            'tabla_afectada', 'emisiones',
            'idregistro', v_idemision,
            'estado_anterior', v_estado_anterior,
            'estado_nuevo', 'ANULADA',
            'observacion', v_motivo,
            'iddocumento', v_iddocumento,
            'documento', v_documento,
            'referencia_documento', v_referencia,
            'usuario', v_usuario,
            'fecha', NOW(),
            'ip', v_ip,
            'equipo', v_equipo,
            'json_nuevo', jsonb_build_object(
                'idemision', v_idemision,
                'estado', 3,
                'motivoAnulacion', v_motivo,
                'iddocumentoAnulacion', v_iddocumento,
                'documentoAnulacion', v_documento,
                'referenciaDocumentoAnulacion', v_referencia,
                'usuarioAnulacion', v_usuario,
                'fechaanulacion', NOW(),
                'facturasActualizadas', v_facturas_actualizadas,
                'rubrosActualizados', v_rubros_actualizados
            )
        )
    );

        RAISE NOTICE 'Emision % anulada correctamente. Facturas actualizadas: %, rubros actualizados: %.',
        v_idemision, v_facturas_actualizadas, v_rubros_actualizados;
END $$;

-- Verificacion rapida
-- select idemision, estado, motivo_anulacion, documento_anulacion, referencia_documento_anulacion, usuario_anulacion, fechaanulacion
-- from emisiones
-- where idemision = 244;
--
-- select count(*) as facturas_emision, sum(totaltarifa) as total_tarifa, sum(valorbase) as total_base
-- from facturas f
-- join lecturas l on l.idfactura = f.idfactura
-- where l.idemision = 244;
--
-- select count(*) as rubros_activos
-- from rubroxfac rf
-- where rf.idfactura_facturas in (
--   select l.idfactura from lecturas l where l.idemision = 244
-- ) and coalesce(rf.estado, 1) <> 0;
--
-- select idauditoria, entidad, entidad_id, usumodi, fecmodi, observacion
-- from auditoria_generica
-- where entidad_id = 244 and entidad in ('EMISIONES', 'EMISION')
-- order by fecmodi desc;
