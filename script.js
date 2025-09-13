/**
 * APPS SCRIPT PARA INTEGRACIÓN CON PLANILLAS DE GOOGLE SHEETS PTG
 * Adaptado específicamente para la aplicación PTG de equipos
 * Versión Completa con manejo robusto de errores
 */

// IDs de las planillas de Google Sheets - ACTUALIZADOS
const SHEET_IDS = {
  FRICK: '1AkOmXJnrrVzRJfca2ARF52fNAK-XgDdvT_ENg2a5nVU',
  MOTOCOMPRESORES: '1fkiiLq8gnFKpj35XmfF7yfsxD-6OBWF2M9dk2dCZ__I', 
  RECOMPRESORES: '1-1VD_VUwy27yPprZcCUoq755yZWUGsdo0_saTteOLlE',
  TURBOEXPANSOR: '1s9XXiYPN5EMEORGhEGS6DAeV6JsIjWEOM5P26KNOu1U'
};

// Configuración de horarios para las columnas
const SCHEDULE_CONFIG = {
  MORNING: { start: 8, end: 14, column: 'C' },    // 08:00 a 14:00 -> Columna C
  EVENING: { start: 20, end: 24, column: 'D' },   // 20:00 a 24:00 -> Columna D
  NIGHT: { start: 0, end: 2, column: 'D' }        // 00:00 a 02:00 -> Columna D
};

// Mapeo de campos para cada tipo de equipo
const FIELD_MAPPINGS = {
  FRICK: {
    'frickSuctionPressure': 6,      // Presión de Succión (Bar)
    'frickSuctionTemp': 7,          // Temperatura de Succión (°C)
    'frickDischargePressure': 8,    // Presión de Descarga (Bar)
    'frickDischargeTemp': 9,        // Temperatura de Descarga (°C)
    'frickOilPressure': 10,         // Presión de Aceite Compresor (Bar)
    'frickOilTemp': 11,             // Temperatura de Aceite Compresor (°C)
    'frickFilterDifferential': 12,  // Diferencial del Filtro (Bar)
    'frickSeparatorTemp': 13,       // Temperatura de Separador (°C)
    'frickMotorAmps': 14,           // Ampers Motor (Amp)
    'frickMaxAmpsPercent': 15,      // Máxima carga Amps Motor (FLA) %
    'frickMotorKW': 16,             // Kilowatts del Motor (KW)
    'frickSlipCapacity': 17,        // Capacidad de Deslizamiento (%)
    'frickSlipVolume': 18,          // Volumen de Deslizamiento (%)
    'frickFlow': 19,                // Caudal (M³/día)
    'frickAmbientTemp': 20,         // Temperatura Ambiente (°C)
    'frickWorkingHours': 21         // Horas Trabajo Motor (Hs)
  },
  
  MOTOCOMPRESORES: {
    'dcsSuctionPressure': 6,           // PI5107 Presión de succión DCS
    'lowPressureGasFlow': 7,           // FI5107 Caudal gas en baja presión
    'suctionPressure': 8,              // Presión de Succión
    'dischargePressureCyl1': 9,        // Pres Desc Comp Cilindro 1
    'dischargePressureCyl2': 10,       // Pres Desc Comp Cilindro 2
    'dischargeTempCylLeft': 11,        // Temp Descarga Cilindro Izquierdo
    'dischargeTempCylRight': 12,       // Temp Descarga Cilindro Derecho
    'motorIntakeTempLeft': 13,         // Temp Admisión Motor Banco Izq.
    'motorIntakeTempRight': 14,        // Temp Admisión Motor Banco Der.
    'motorOilTemp': 15,                // Temperatura Aceite Motor
    'compressorOilTemp': 16,           // Temperatura Aceite Compresor
    'mainWaterTemp': 17,               // Temperatura Agua Principal
    'intakeManifoldPressureLeft': 18,  // Presión Múltiple Admisión Izquierdo
    'intakeManifoldPressureRight': 19, // Presión Múltiple Admisión Derecho
    'airFiltersRight': 20,             // Filtros de aire Derecho
    'airFiltersLeft': 21               // Filtros de aire Izquierdo
  },
  
  RECOMPRESORES_COMMON: {
    'suctionFlow': 6,                      // Caudal de Succión
    'ambientTemp': 7,                      // T. Ambiente
    'motorRPM': 8,                         // R.P.M. Motor
    'oilFilterDiffPressure': 9,            // Pres de Dif Filtros Aceite Motor
    'motorOilPressureBoard': 10,           // Pres de Aceite Motor Tablero
    'compressorOilPressureBoard': 11,      // Pres de Aceite Compresor Tablero
    'compressorOilPressureIn': 12,         // Pres de Aceite Compresor Entrada
    'compressorOilPressureOut': 13,        // Pres de Aceite Compresor Salida
    'dischargePressureCyl1': 14,           // Pres Desc Comp Cilindro 1
    'dischargePressureCyl2': 15,           // Pres Desc Comp Cilindro 2
    'dischargeTempCylLeft': 16,            // Temp Descarga Cilindro Izquierdo
    'dischargeTempCylRight': 17,           // Temp Descarga Cilindro Derecho
    'compressorSuctionPressure': 18,       // Pres Succión Compresor
    'motorIntakeTempLeft': 19,             // Temp Admisión Motor Banco Izq.
    'motorIntakeTempRight': 20,            // Temp Admisión Motor Banco Der.
    'motorOilTemp': 21,                    // Temperatura Aceite Motor
    'compressorOilTemp': 22,               // Temperatura Aceite Compresor
    'mainWaterTemp': 23,                   // Temperatura Agua Principal
    'intakeManifoldPressureLeft': 24,      // Presión Múltiple Admisión Izquierdo
    'intakeManifoldPressureRight': 25,     // Presión Múltiple Admisión Derecho
    'airFiltersRight': 26,                 // Filtros de aire Derecho
    'airFiltersLeft': 27                   // Filtros de aire Izquierdo
  },
  
  RECOMPRESORES_RC9: {
    'suctionFlow': 6,                      // Caudal de Succión
    'ambientTemp': 7,                      // T. Ambiente
    'oilFilterDiffPressure': 8,            // Pres de Dif Filtros Aceite Motor
    'compressorOilPressureIn': 9,          // Pres de Aceite Compresor Entrada
    'compressorOilPressureOut': 10,        // Pres de Aceite Compresor Salida
    'compressorSuctionPressure1st': 11,    // Pres Succión Compresor 1st
    'compressorDischargePressure1st': 12,  // Pres Descarga Compresor 1st
    'compressorOilPressure': 13,           // Pres de Aceite Compresor
    'compressorSuctionTemp': 14,           // Temp Succión Compresor
    'dischargeTempCylinder1': 15,          // Temp Descarga Cilindro 1
    'dischargeTempCylinder2': 16,          // Temp Descarga Cilindro 2
    'compressorOilTemp': 17,               // Temperatura Aceite Compresor
    'motorRPM': 18,                        // R.P.M. Motor
    'motorOilPressure': 19,                // Pres de Aceite Motor
    'mainWaterTemp': 20,                   // Temperatura Agua Principal
    'motorOilTemp': 21,                    // Temperatura Aceite Motor
    'airFiltersRight': 22,                 // Filtros de aire Derecho
    'airFiltersLeft': 23                   // Filtros de aire Izquierdo
  },
  
  TURBOEXPANSOR: {
    'expInP': 6,                    // Presión Entrada Expansor (Exp. In P)
    'expInT': 7,                    // Temperatura Entrada Expansor (Exp. In T)
    'expOutP': 8,                   // Presión Salida Expansor (Exp. Out P)
    'expOutT': 9,                   // Temperatura Salida Expansor (Exp. Out T)
    'expWheelP': 10,                // Presión Rueda Expansor (Exp. Wheel P)
    'compInP': 11,                  // Presión Entrada Compresor (Comp. In P)
    'compInT': 12,                  // Temperatura Entrada Compresor (Comp. In T)
    'compOutP': 13,                 // Presión Salida Compresor (Comp. Out P)
    'compOutT': 14,                 // Temperatura Salida Compresor
    'compWheelP': 15,               // Presión Rueda Compresor (Comp. Wheel P)
    'driveBearingThrust': 16,       // Presión Empuje Expansor
    'loadBearingThrust': 17,        // Presión Empuje Compresor
    'reservoirP': 18,               // Presión Reservorio
    'reservoirT': 19,               // Temperatura Reservorio
    'lubeOilP': 20,                 // Presión Aceite Lubricante
    'lubeOilDP': 21,                // Diferencia de Presión Aceite Lubricante
    'sealGasP': 22,                 // Presión Gas de Sello
    'sealGasDP': 23,                // Diferencia de Presión Gas de Sello
    'rpm': 24,                      // RPM
    'expBrgT': 25,                  // Temperatura Cojinetes Expansor
    'compBrgT': 26,                 // Temperatura Cojinetes Compresor
    'expVibX': 27,                  // Vibración X Expansor
    'compVibX': 28,                 // Vibración X Compresor
    'lubeOilInT': 29,               // Temperatura Entrada Aceite Lubricante
    'oilDrainT': 30,                // Temperatura Aceite Drenaje
    'sealGasInT': 31,               // Temperatura Entrada Gas de Sello
    'pic0301B': 32,                 // % Aletas Guías
    'pic0301A': 33,                 // JT %
    'recycleFIC0301': 34,           // Reciclo FIC0301
    'fIC0301Opening': 35,           // Porcentaje apertura FIC0301
    'flowPercentage': 36,           // Valor de caudal (porcentaje)
    'expFlowFIC0101': 37,           // Flujo Expansor
    'compFlow': 38,                 // Flujo Compresor
    'ambientTempTI0100': 39,        // T° Ambiente
    'sealGasSupplyP': 40,           // Presión Suministro Gas de Sello
    'sealGasSupplyT': 41,           // T° Suministro Gas de Sello
    'sealGasFlowFI1': 42,           // Caudal Gas de Sello FI-1
    'reservoirOilLevel': 43,        // NIVEL ACEITE RESERVORIO
    'flowMMSCFD': 44                // CAUDAL (MMSCFD)
  }
};

/**
 * Función para manejar solicitudes GET (necesaria para la aplicación web)
 */
function doGet(e) {
  try {
    Logger.log('Solicitud GET recibida en PTG Web App');
    
    // Respuesta para verificar que la aplicación web esté funcionando
    const response = {
      success: true,
      message: 'Aplicación PTG Web App funcionando correctamente',
      timestamp: new Date().toISOString(),
      version: '2.0',
      service: 'PTG Equipment Data Integration',
      endpoints: ['POST / - Para enviar datos de equipos']
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.error('Error en doGet: %s', error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función principal para recibir datos desde la aplicación web PTG
 */
function doPost(e) {
  let requestData = null;
  
  try {
    Logger.log('=== INICIO DE PROCESAMIENTO PTG ===');
    Logger.log('Solicitud POST recibida en PTG Web App');
    
    // Verificar si hay datos POST
    if (!e) {
      throw new Error('No se recibió objeto de solicitud');
    }
    
    if (!e.postData) {
      throw new Error('No se recibieron datos POST en la solicitud');
    }
    
    if (!e.postData.contents) {
      throw new Error('Los datos POST están vacíos');
    }
    
    Logger.log('Datos POST recibidos: %s', e.postData.contents);
    
    // Parsear los datos JSON recibidos
    try {
      requestData = JSON.parse(e.postData.contents);
      Logger.log('Datos parseados correctamente');
    } catch (parseError) {
      throw new Error('Error al parsear JSON: ' + parseError.message);
    }
    
    // Validar datos obligatorios
    if (!requestData.equipmentType) {
      throw new Error('Falta el campo obligatorio: equipmentType');
    }
    
    if (!requestData.equipmentData) {
      throw new Error('Falta el campo obligatorio: equipmentData');
    }
    
    if (!requestData.operatorName) {
      throw new Error('Falta el campo obligatorio: operatorName');
    }
    
    if (!requestData.dateTime) {
      throw new Error('Falta el campo obligatorio: dateTime');
    }
    
    Logger.log('Procesando datos para equipo: %s', requestData.equipmentType);
    Logger.log('Operador: %s', requestData.operatorName);
    Logger.log('Fecha/Hora: %s', requestData.dateTime);
    
    let result;
    
    // Procesar según el tipo de equipo PTG
    switch(requestData.equipmentType) {
      case 'Planillas Datos Frick K-401':
        Logger.log('Procesando datos para Frick K-401');
        result = updateFrickSheet(requestData);
        break;
      case 'Planillas Datos Motocompresores':
        Logger.log('Procesando datos para Motocompresores');
        result = updateMotocompresoresSheet(requestData);
        break;
      case 'Planillas Datos Recompresores':
        Logger.log('Procesando datos para Recompresores');
        result = updateRecompresoresSheet(requestData);
        break;
      case 'Planillas Datos TurboExpander':
        Logger.log('Procesando datos para TurboExpander');
        result = updateTurboexpansorSheet(requestData);
        break;
      default:
        throw new Error('Tipo de equipo no compatible con integración de planillas: ' + requestData.equipmentType);
    }
    
    Logger.log('Procesamiento completado exitosamente');
    Logger.log('=== FIN DE PROCESAMIENTO PTG ===');
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Datos guardados exitosamente en Google Sheets',
        timestamp: new Date().toISOString(),
        details: result
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.error('Error al procesar datos PTG: %s', error.toString());
    Logger.log('=== FIN DE PROCESAMIENTO PTG CON ERROR ===');
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        receivedData: requestData
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Determina la columna según la hora del registro
 */
function getTimeColumn(dateTime) {
  const hour = new Date(dateTime).getHours();
  
  if (hour >= SCHEDULE_CONFIG.MORNING.start && hour < SCHEDULE_CONFIG.MORNING.end) {
    return SCHEDULE_CONFIG.MORNING.column;
  } else if ((hour >= SCHEDULE_CONFIG.EVENING.start && hour < SCHEDULE_CONFIG.EVENING.end) || 
             (hour >= SCHEDULE_CONFIG.NIGHT.start && hour < SCHEDULE_CONFIG.NIGHT.end)) {
    return SCHEDULE_CONFIG.EVENING.column;
  } else {
    // Por defecto para horarios no cubiertos
    return SCHEDULE_CONFIG.MORNING.column;
  }
}

/**
 * Función para actualizar planilla de Frick K-401
 */
function updateFrickSheet(data) {
  Logger.log('Iniciando actualización de planilla Frick');
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_IDS.FRICK);
    const frickData = data.equipmentData.frick;
    
    if (!frickData) {
      throw new Error('No se encontraron datos específicos de Frick');
    }
    
    // Determinar la hoja según el equipo seleccionado
    let sheetName;
    if (frickData.equipment === 'Frick K-401A') {
      sheetName = 'K-401A';
    } else if (frickData.equipment === 'Frick K-401B') {
      sheetName = 'K-401B';
    } else {
      throw new Error(`Equipo Frick no reconocido: ${frickData.equipment}`);
    }
    
    Logger.log('Usando hoja: %s', sheetName);
    
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Hoja no encontrada: ${sheetName}`);
    }
    
    const timeColumn = getTimeColumn(data.dateTime);
    Logger.log('Columna de tiempo determinada: %s', timeColumn);
    
    let updatedFields = 0;
    const updateResults = [];
    
    // Actualizar cada campo
    Object.entries(FIELD_MAPPINGS.FRICK).forEach(([fieldKey, row]) => {
      if (frickData[fieldKey] !== undefined && frickData[fieldKey] !== null && frickData[fieldKey] !== '') {
        const cellAddress = `${timeColumn}${row}`;
        try {
          const value = parseFloat(frickData[fieldKey]) || frickData[fieldKey];
          sheet.getRange(cellAddress).setValue(value);
          updatedFields++;
          
          updateResults.push({
            field: fieldKey,
            cell: cellAddress,
            value: value,
            status: 'success'
          });
          
          Logger.log('Frick: Actualizado %s = %s', cellAddress, value);
        } catch (error) {
          Logger.error('Error actualizando Frick %s: %s', cellAddress, error.toString());
          
          updateResults.push({
            field: fieldKey,
            cell: cellAddress,
            value: frickData[fieldKey],
            status: 'error',
            error: error.message
          });
        }
      }
    });
    
    const result = {
      equipment: frickData.equipment,
      sheetName: sheetName,
      dateTime: data.dateTime,
      timeColumn: timeColumn,
      updatedFields: updatedFields,
      totalPossibleFields: Object.keys(FIELD_MAPPINGS.FRICK).length,
      updateResults: updateResults
    };
    
    Logger.log('Actualización Frick completada: %s campos actualizados', updatedFields);
    return result;
    
  } catch (error) {
    Logger.error('Error en updateFrickSheet: %s', error.toString());
    throw error;
  }
}

/**
 * Función para actualizar planilla de Motocompresores
 */
function updateMotocompresoresSheet(data) {
  Logger.log('Iniciando actualización de planilla Motocompresores');
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_IDS.MOTOCOMPRESORES);
    const compressorsData = data.equipmentData.compressors;
    
    if (!compressorsData) {
      throw new Error('No se encontraron datos específicos de Motocompresores');
    }
    
    const timeColumn = getTimeColumn(data.dateTime);
    Logger.log('Columna de tiempo determinada: %s', timeColumn);
    
    let results = [];
    let totalUpdatedFields = 0;
    
    // Procesar cada motocompresor
    Object.entries(compressorsData).forEach(([unitKey, unitData]) => {
      const sheetName = unitKey.toUpperCase(); // mc1 -> MC1
      Logger.log('Procesando unidad: %s', sheetName);
      
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        Logger.warn('Hoja no encontrada para: %s', sheetName);
        results.push({
          unit: sheetName,
          status: 'error',
          error: 'Hoja no encontrada',
          updatedFields: 0
        });
        return;
      }
      
      let updatedFields = 0;
      const unitResults = [];
      
      Object.entries(FIELD_MAPPINGS.MOTOCOMPRESORES).forEach(([fieldKey, row]) => {
        if (unitData[fieldKey] !== undefined && unitData[fieldKey] !== null && unitData[fieldKey] !== '') {
          const cellAddress = `${timeColumn}${row}`;
          try {
            const value = parseFloat(unitData[fieldKey]) || unitData[fieldKey];
            sheet.getRange(cellAddress).setValue(value);
            updatedFields++;
            
            unitResults.push({
              field: fieldKey,
              cell: cellAddress,
              value: value,
              status: 'success'
            });
            
            Logger.log('MC %s: Actualizado %s = %s', sheetName, cellAddress, value);
          } catch (error) {
            Logger.error('Error actualizando MC %s %s: %s', sheetName, cellAddress, error.toString());
            
            unitResults.push({
              field: fieldKey,
              cell: cellAddress,
              value: unitData[fieldKey],
              status: 'error',
              error: error.message
            });
          }
        }
      });
      
      totalUpdatedFields += updatedFields;
      
      results.push({
        unit: sheetName,
        status: 'success',
        updatedFields: updatedFields,
        details: unitResults
      });
    });
    
    const result = {
      equipmentType: 'Motocompresores',
      dateTime: data.dateTime,
      timeColumn: timeColumn,
      results: results,
      totalUnits: results.length,
      totalUpdatedFields: totalUpdatedFields
    };
    
    Logger.log('Actualización Motocompresores completada: %s campos actualizados en total', totalUpdatedFields);
    return result;
    
  } catch (error) {
    Logger.error('Error en updateMotocompresoresSheet: %s', error.toString());
    throw error;
  }
}

/**
 * Función para actualizar planilla de Recompresores
 */
function updateRecompresoresSheet(data) {
  Logger.log('Iniciando actualización de planilla Recompresores');
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_IDS.RECOMPRESORES);
    const recompressorsData = data.equipmentData.recompressors;
    
    if (!recompressorsData) {
      throw new Error('No se encontraron datos específicos de Recompresores');
    }
    
    const timeColumn = getTimeColumn(data.dateTime);
    Logger.log('Columna de tiempo determinada: %s', timeColumn);
    
    let results = [];
    let totalUpdatedFields = 0;
    
    // Procesar cada recompresor
    Object.entries(recompressorsData).forEach(([unitKey, unitData]) => {
      const sheetName = unitKey.toUpperCase(); // rc4 -> RC4
      Logger.log('Procesando unidad: %s', sheetName);
      
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        Logger.warn('Hoja no encontrada para: %s', sheetName);
        results.push({
          unit: sheetName,
          status: 'error',
          error: 'Hoja no encontrada',
          updatedFields: 0
        });
        return;
      }
      
      // Usar mapeo específico según el equipo
      const fieldMapping = (sheetName === 'RC9') ? 
        FIELD_MAPPINGS.RECOMPRESORES_RC9 : 
        FIELD_MAPPINGS.RECOMPRESORES_COMMON;
      
      let updatedFields = 0;
      const unitResults = [];
      
      Object.entries(fieldMapping).forEach(([fieldKey, row]) => {
        if (unitData[fieldKey] !== undefined && unitData[fieldKey] !== null && unitData[fieldKey] !== '') {
          const cellAddress = `${timeColumn}${row}`;
          try {
            const value = parseFloat(unitData[fieldKey]) || unitData[fieldKey];
            sheet.getRange(cellAddress).setValue(value);
            updatedFields++;
            
            unitResults.push({
              field: fieldKey,
              cell: cellAddress,
              value: value,
              status: 'success'
            });
            
            Logger.log('RC %s: Actualizado %s = %s', sheetName, cellAddress, value);
          } catch (error) {
            Logger.error('Error actualizando RC %s %s: %s', sheetName, cellAddress, error.toString());
            
            unitResults.push({
              field: fieldKey,
              cell: cellAddress,
              value: unitData[fieldKey],
              status: 'error',
              error: error.message
            });
          }
        }
      });
      
      totalUpdatedFields += updatedFields;
      
      results.push({
        unit: sheetName,
        status: 'success',
        updatedFields: updatedFields,
        details: unitResults
      });
    });
    
    const result = {
      equipmentType: 'Recompresores',
      dateTime: data.dateTime,
      timeColumn: timeColumn,
      results: results,
      totalUnits: results.length,
      totalUpdatedFields: totalUpdatedFields
    };
    
    Logger.log('Actualización Recompresores completada: %s campos actualizados en total', totalUpdatedFields);
    return result;
    
  } catch (error) {
    Logger.error('Error en updateRecompresoresSheet: %s', error.toString());
    throw error;
  }
}

/**
 * Función para actualizar planilla de TurboExpander
 */
function updateTurboexpansorSheet(data) {
  Logger.log('Iniciando actualización de planilla TurboExpander');
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_IDS.TURBOEXPANSOR);
    const turboData = data.equipmentData.turboExpanderData;
    
    if (!turboData) {
      throw new Error('No se encontraron datos específicos de TurboExpander');
    }
    
    const sheetName = 'TE-201'; // Hoja del TurboExpander
    Logger.log('Usando hoja: %s', sheetName);
    
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Hoja no encontrada: ${sheetName}`);
    }
    
    const timeColumn = getTimeColumn(data.dateTime);
    Logger.log('Columna de tiempo determinada: %s', timeColumn);
    
    let updatedFields = 0;
    const updateResults = [];
    
    // Actualizar cada campo
    Object.entries(FIELD_MAPPINGS.TURBOEXPANSOR).forEach(([fieldKey, row]) => {
      if (turboData[fieldKey] !== undefined && turboData[fieldKey] !== null && turboData[fieldKey] !== '') {
        const cellAddress = `${timeColumn}${row}`;
        try {
          const value = parseFloat(turboData[fieldKey]) || turboData[fieldKey];
          sheet.getRange(cellAddress).setValue(value);
          updatedFields++;
          
          updateResults.push({
            field: fieldKey,
            cell: cellAddress,
            value: value,
            status: 'success'
          });
          
          Logger.log('TurboExpander: Actualizado %s = %s', cellAddress, value);
        } catch (error) {
          Logger.error('Error actualizando TurboExpander %s: %s', cellAddress, error.toString());
          
          updateResults.push({
            field: fieldKey,
            cell: cellAddress,
            value: turboData[fieldKey],
            status: 'error',
            error: error.message
          });
        }
      }
    });
    
    const result = {
      equipment: 'TurboExpander TE-201',
      sheetName: sheetName,
      dateTime: data.dateTime,
      timeColumn: timeColumn,
      updatedFields: updatedFields,
      totalPossibleFields: Object.keys(FIELD_MAPPINGS.TURBOEXPANSOR).length,
      updateResults: updateResults
    };
    
    Logger.log('Actualización TurboExpander completada: %s campos actualizados', updatedFields);
    return result;
    
  } catch (error) {
    Logger.error('Error en updateTurboexpansorSheet: %s', error.toString());
    throw error;
  }
}

/**
 * Función de prueba para verificar la configuración
 */
function testConfiguration() {
  Logger.log('=== INICIO PRUEBA DE CONFIGURACIÓN PTG ===');
  Logger.log('Fecha: %s', new Date().toISOString());
  
  const testResults = {
    sheets: {},
    overall: 'success',
    errors: []
  };
  
  try {
    // Probar acceso a cada planilla
    Object.entries(SHEET_IDS).forEach(([key, sheetId]) => {
      try {
        Logger.log('Probando acceso a planilla: %s', key);
        const spreadsheet = SpreadsheetApp.openById(sheetId);
        
        // Listar hojas disponibles
        const sheets = spreadsheet.getSheets();
        const sheetNames = sheets.map(sheet => sheet.getName());
        
        testResults.sheets[key] = {
          status: 'success',
          name: spreadsheet.getName(),
          sheets: sheetNames,
          sheetCount: sheets.length
        };
        
        Logger.log('✓ Acceso exitoso a planilla %s: %s', key, spreadsheet.getName());
        Logger.log('  Hojas disponibles: %s', sheetNames.join(', '));
        
      } catch (error) {
        Logger.error('✗ Error accediendo a planilla %s: %s', key, error.toString());
        
        testResults.sheets[key] = {
          status: 'error',
          error: error.message
        };
        
        testResults.overall = 'error';
        testResults.errors.push(`Error en ${key}: ${error.message}`);
      }
    });
    
    // Probar función de columna de tiempo
    Logger.log('Probando función getTimeColumn...');
    const testTimes = [
      { time: '2025-09-12T10:00:00', expected: 'C' },
      { time: '2025-09-12T22:00:00', expected: 'D' },
      { time: '2025-09-12T01:00:00', expected: 'D' }
    ];
    
    testResults.timeTests = [];
    
    testTimes.forEach((test, index) => {
      try {
        const result = getTimeColumn(test.time);
        const passed = result === test.expected;
        
        testResults.timeTests.push({
          test: index + 1,
          time: test.time,
          expected: test.expected,
          actual: result,
          passed: passed
        });
        
        if (passed) {
          Logger.log('✓ Test tiempo %d: %s -> %s (correcto)', index + 1, test.time, result);
        } else {
          Logger.log('✗ Test tiempo %d: %s -> %s (esperaba %s)', index + 1, test.time, result, test.expected);
          testResults.overall = 'error';
        }
      } catch (error) {
        Logger.error('Error en test tiempo %d: %s', index + 1, error.toString());
        testResults.overall = 'error';
      }
    });
    
  } catch (error) {
    Logger.error('Error general en testConfiguration: %s', error.toString());
    testResults.overall = 'error';
    testResults.errors.push(`Error general: ${error.message}`);
  }
  
  Logger.log('=== FIN PRUEBA DE CONFIGURACIÓN PTG ===');
  Logger.log('Resultado general: %s', testResults.overall);
  
  if (testResults.overall === 'error') {
    Logger.log('Errores encontrados: %s', testResults.errors.join('; '));
  }
  
  return testResults;
}

/**
 * Función para obtener la URL del web app desplegado
 */
function getWebAppUrl() {
  try {
    const url = ScriptApp.getService().getUrl();
    Logger.log('URL del Web App PTG: %s', url);
    Logger.log('Usar esta URL en tu aplicación PTG');
    
    return {
      success: true,
      url: url,
      message: 'Copia esta URL y pégala en tu aplicación web PTG'
    };
    
  } catch (error) {
    Logger.error('Error obteniendo URL: %s', error.toString());
    
    return {
      success: false,
      error: error.message,
      message: 'Asegúrate de que la aplicación web esté desplegada correctamente'
    };
  }
}

/**
 * Función para limpiar datos de prueba (solo para desarrollo)
 */
function clearTestData() {
  Logger.log('Iniciando limpieza de datos de prueba');
  
  try {
    const sheetsToClear = ['MC1', 'MC2', 'MC3', 'MC5', 'MC6', 'RC4', 'RC7', 'RC8', 'RC9', 'K-401A', 'K-401B', 'TE-201'];
    const columnsToClear = ['C', 'D'];
    const startRow = 6;
    const endRow = 50;
    
    let totalCleared = 0;
    
    // Limpiar todas las planillas
    Object.entries(SHEET_IDS).forEach(([key, sheetId]) => {
      try {
        const spreadsheet = SpreadsheetApp.openById(sheetId);
        
        sheetsToClear.forEach(sheetName => {
          const sheet = spreadsheet.getSheetByName(sheetName);
          if (sheet) {
            columnsToClear.forEach(column => {
              const range = sheet.getRange(`${column}${startRow}:${column}${endRow}`);
              range.clearContent();
              totalCleared += endRow - startRow + 1;
            });
            Logger.log('Limpieza completada en %s', sheetName);
          }
        });
        
      } catch (error) {
        Logger.error('Error limpiando planilla %s: %s', key, error.toString());
      }
    });
    
    Logger.log('Limpieza completada. Total de celdas limpiadas: %s', totalCleared);
    return {
      success: true,
      clearedCells: totalCleared,
      message: 'Datos de prueba limpiados exitosamente'
    };
    
  } catch (error) {
    Logger.error('Error en clearTestData: %s', error.toString());
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Función para verificar el estado del servicio
 */
function getServiceStatus() {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      service: 'PTG Google Sheets Integration',
      version: '2.0',
      status: 'operational',
      sheetsAccess: {},
      lastDeployment: ScriptApp.getService().getLastDeploymentId()
    };
    
    // Verificar acceso a planillas
    Object.entries(SHEET_IDS).forEach(([key, sheetId]) => {
      try {
        const spreadsheet = SpreadsheetApp.openById(sheetId);
        status.sheetsAccess[key] = {
          status: 'accessible',
          name: spreadsheet.getName()
        };
      } catch (error) {
        status.sheetsAccess[key] = {
          status: 'inaccessible',
          error: error.message
        };
        status.status = 'degraded';
      }
    });
    
    Logger.log('Estado del servicio: %s', status.status);
    return status;
    
  } catch (error) {
    Logger.error('Error obteniendo estado del servicio: %s', error.toString());
    
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    };
  }
}