return turboData;
    }
    
    // FUNCIÓN MODIFICADA: generatePDF ahora con integración a Google Sheets
    async generatePDF() {
        if (!this.validateForm()) {
            alert('Por favor complete todos los campos requeridos.');
            return;
        }
        
        const generateBtn = document.getElementById('generatePdfBtn');
        generateBtn.classList.add('loading');
        generateBtn.textContent = 'Procesando...';
        
        try {
            const data = this.collectFormData();
            
            // NUEVA FUNCIONALIDAD: Enviar a Google Sheets si es compatible
            let sheetsResult = null;
            if (this.isSheetCompatibleEquipment(data.equipmentType)) {
                generateBtn.textContent = 'Guardando en Google Sheets...';
                sheetsResult = await this.sendToGoogleSheets(data);
            }
            
            // Generar PDF
            generateBtn.textContent = 'Generando PDF...';
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // PDF Header
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('EQUIPOS Y MANTENIMIENTO PTG', 20, 20);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            let yPosition = 40;
            const lineHeight = 7;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            
            // Basic Information
            doc.setFont('helvetica', 'bold');
            doc.text('INFORMACIÃ"N BÃSICA', 20, yPosition);
            yPosition += lineHeight;
            
            doc.setFont('helvetica', 'normal');
            doc.text(`Operador: ${data.operatorName}`, 20, yPosition);
            yPosition += lineHeight;
            doc.text(`Legajo: ${data.legajo}`, 20, yPosition);
            yPosition += lineHeight;
            doc.text(`Fecha y Hora: ${new Date(data.dateTime).toLocaleString('es-AR')}`, 20, yPosition);
            yPosition += lineHeight;
            doc.text(`Tipo de Equipo: ${data.equipmentType}`, 20, yPosition);
            yPosition += lineHeight * 2;
            
            // Agregar información sobre Google Sheets si fue exitoso
            if (sheetsResult && sheetsResult.success) {
                doc.setFont('helvetica', 'bold');
                doc.text('ESTADO GOOGLE SHEETS', 20, yPosition);
                yPosition += lineHeight;
                doc.setFont('helvetica', 'normal');
                doc.text('✓ Datos guardados exitosamente en Google Sheets', 20, yPosition);
                yPosition += lineHeight * 2;
            }
            
            // Equipment-specific data
            if (data.general) {
                yPosition = this.addGeneralDataToPDF(doc, data.general, yPosition, lineHeight);
            } else if (data.controlRoom) {
                yPosition = this.addControlRoomDataToPDF(doc, data.controlRoom, yPosition, lineHeight);
            } else if (data.tanks) {
                yPosition = this.addTanksDataToPDF(doc, data.tanks, yPosition, lineHeight);
            } else if (data.oil) {
                yPosition = this.addOilDataToPDF(doc, data.oil, yPosition, lineHeight);
            } else if (data.turboExpander) {
                yPosition = this.addTurboExpanderDataToPDF(doc, data.turboExpander, yPosition, lineHeight);
            } else if (data.propaneCompressor) {
                yPosition = this.addPropaneCompressorDataToPDF(doc, data.propaneCompressor, yPosition, lineHeight);
            } else if (data.frick) {
                yPosition = this.addFrickDataToPDF(doc, data.frick, yPosition, lineHeight);
            } else if (data.rci) {
                yPosition = this.addRCIDataToPDF(doc, data.rci, yPosition, lineHeight);
            } else if (data.compressors) {
                yPosition = this.addCompressorsDataToPDF(doc, data.compressors, yPosition, lineHeight);
            } else if (data.recompressors) {
                yPosition = this.addRecompressorsDataToPDF(doc, data.recompressors, yPosition, lineHeight);
            } else if (data.turboExpanderData) {
                yPosition = this.addTurboExpanderDataFieldsToPDF(doc, data.turboExpanderData, yPosition, lineHeight);
            }
            
            // Add photos if any
            await this.addPhotosToPDF(doc, yPosition);
            
            // Generate filename
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `PTG_${data.equipmentType.replace(/\s+/g, '_')}_${timestamp}.pdf`;
            
            // Save PDF
            doc.save(filename);
            
            // Mostrar mensaje de éxito completo
            let successMessage = 'PDF generado exitosamente';
            if (sheetsResult && sheetsResult.success) {
                successMessage += ' y datos guardados en Google Sheets';
            }
            this.showSuccessMessage(successMessage);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Por favor intente nuevamente.');
        } finally {
            generateBtn.classList.remove('loading');
            generateBtn.textContent = 'Generar Informe PDF';
            this.resetApp(); // Reset the form after PDF generation
        }
    }
    
    addGeneralDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DEL EQUIPO', 20, yPosition);
        yPosition += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        if (data.tagNumber) {
            doc.text(`NÃºmero de TAG: ${data.tagNumber}`, 20, yPosition);
            yPosition += lineHeight;
        }
        if (data.priority) {
            doc.text(`Prioridad: ${data.priority}`, 20, yPosition);
            yPosition += lineHeight;
        }
        if (data.location) {
            doc.text(`UbicaciÃ³n: ${data.location}`, 20, yPosition);
            yPosition += lineHeight;
        }
        if (data.equipmentStatus) {
            doc.text(`Estado del Equipo: ${data.equipmentStatus}`, 20, yPosition);
            yPosition += lineHeight;
        }
        if (data.observations) {
            doc.text('Observaciones:', 20, yPosition);
            yPosition += lineHeight;
            const splitText = doc.splitTextToSize(data.observations, 170);
            doc.text(splitText, 20, yPosition);
            yPosition += splitText.length * lineHeight;
        }
        
        return yPosition + lineHeight;
    }
    
    addControlRoomDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('SALA DE CONTROL', 20, yPosition);
        yPosition += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        Object.entries(data).forEach(([key, value]) => {
            if (value) {
                const label = this.getFieldLabel(key);
                if (key === 'observations') {
                    doc.text(`${label}:`, 20, yPosition);
                    yPosition += lineHeight;
                    const splitText = doc.splitTextToSize(value, 170);
                    doc.text(splitText, 20, yPosition);
                    yPosition += splitText.length * lineHeight;
                } else {
                    doc.text(`${label}: ${value}`, 20, yPosition);
                    yPosition += lineHeight;
                }
            }
        });
        
        return yPosition + lineHeight;
    }
    
    addTanksDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DE TANQUES', 20, yPosition);
        yPosition += lineHeight * 2;
        
        const tankNames = {
            tank1: 'Tanque 1 (Propano Fuera de EspecificaciÃ³n)',
            tank2: 'Tanque 2 (Butano Fuera de EspecificaciÃ³n)',
            tank3: 'Tanque 3 (Butano)',
            tank4: 'Tanque 4 (Butano)',
            tank5: 'Tanque 5 (Propano)',
            tank6: 'Tanque 6 (Propano)',
            tank7: 'Tanque 7 (Gasolina)'
        };
        
        Object.entries(data).forEach(([tankKey, tankData]) => {
            if (tankNames[tankKey]) {
                doc.setFont('helvetica', 'bold');
                doc.text(tankNames[tankKey], 20, yPosition);
                yPosition += lineHeight;
                
                doc.setFont('helvetica', 'normal');
                if (tankData.level) doc.text(`Nivel: ${tankData.level} cm`, 25, yPosition), yPosition += lineHeight;
                if (tankData.pressure) doc.text(`PresiÃ³n: ${tankData.pressure} kg/cmÂ²`, 25, yPosition), yPosition += lineHeight;
                if (tankData.temperature) doc.text(`Temperatura: ${tankData.temperature} Â°C`, 25, yPosition), yPosition += lineHeight;
                yPosition += lineHeight;
            }
        });
        
        return yPosition;
    }
    
    addOilDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('CARGA DE ACEITE', 20, yPosition);
        yPosition += lineHeight * 2;
        
        const unitNames = {
            mc1: 'MC#1', mc2: 'MC#2', mc3: 'MC#3', mc5: 'MC#5', mc6: 'MC#6',
            rc4: 'RC#4', rc7: 'RC#7', rc8: 'RC#8', rc9: 'RC#9'
        };
        
        Object.entries(data).forEach(([unitKey, unitData]) => {
            if (unitNames[unitKey]) {
                doc.setFont('helvetica', 'bold');
                doc.text(unitNames[unitKey], 20, yPosition);
                yPosition += lineHeight;
                
                doc.setFont('helvetica', 'normal');
                if (unitData.motorCm) doc.text(`Nivel Lado Motor: ${unitData.motorCm} cm`, 25, yPosition), yPosition += lineHeight;
                if (unitData.compressorCm) doc.text(`Nivel Lado Compresor: ${unitData.compressorCm} cm`, 25, yPosition), yPosition += lineHeight;
                if (unitData.oilLevel) doc.text(`Nivel de Aceite: ${unitData.oilLevel} cm`, 25, yPosition), yPosition += lineHeight;
                yPosition += lineHeight;
            }
        });
        
        if (data.oilTank && data.oilTank.level) {
            doc.setFont('helvetica', 'bold');
            doc.text('Cisterna de Aceite', 20, yPosition);
            yPosition += lineHeight;
            doc.setFont('helvetica', 'normal');
            doc.text(`Nivel: ${data.oilTank.level} cm`, 25, yPosition);
            yPosition += lineHeight * 2;
        }
        
        return yPosition;
    }
    
    addTurboExpanderDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('TURBO EXPANSOR', 20, yPosition);
        yPosition += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        Object.entries(data).forEach(([key, value]) => {
            if (value) {
                const label = this.getFieldLabel(key);
                if (key === 'observations') {
                    doc.text(`${label}:`, 20, yPosition);
                    yPosition += lineHeight;
                    const splitText = doc.splitTextToSize(value, 170);
                    doc.text(splitText, 20, yPosition);
                    yPosition += splitText.length * lineHeight;
                } else {
                    doc.text(`${label}: ${value}`, 20, yPosition);
                    yPosition += lineHeight;
                }
            }
        });
        
        return yPosition + lineHeight;
    }
    
    addPropaneCompressorDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('COMPRESORES DE PROPANO', 20, yPosition);
        yPosition += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        Object.entries(data).forEach(([key, value]) => {
            if (value) {
                const label = this.getFieldLabel(key);
                if (key === 'observations') {
                    doc.text(`${label}:`, 20, yPosition);
                    yPosition += lineHeight;
                    const splitText = doc.splitTextToSize(value, 170);
                    doc.text(splitText, 20, yPosition);
                    yPosition += splitText.length * lineHeight;
                } else {
                    doc.text(`${label}: ${value}`, 20, yPosition);
                    yPosition += lineHeight;
                }
            }
        });
        
        return yPosition + lineHeight;
    }
    
    addFrickDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('PLANILLAS DATOS FRICK K-401', 20, yPosition);
        yPosition += lineHeight * 2;
        
        if (data.equipment) {
            doc.setFont('helvetica', 'bold');
            doc.text(`Equipo: ${data.equipment}`, 20, yPosition);
            yPosition += lineHeight * 2;
        }
        
        doc.setFont('helvetica', 'normal');
        const frickFields = {
            frickSuctionPressure: 'PresiÃ³n de SucciÃ³n (Bar)',
            frickSuctionTemp: 'Temperatura de SucciÃ³n (Â°C)',
            frickDischargePressure: 'PresiÃ³n de Descarga (Bar)',
            frickDischargeTemp: 'Temperatura de Descarga (Â°C)',
            frickOilPressure: 'PresiÃ³n de Aceite Compresor (Bar)',
            frickOilTemp: 'Temperatura de Aceite Compresor (Â°C)',
            frickFilterDifferential: 'Diferencial del Filtro (Bar)',
            frickSeparatorTemp: 'Temperatura de Separador (Â°C)',
            frickMotorAmps: 'Ampers Motor (Amp)',
            frickMaxAmpsPercent: 'MÃ¡xima carga Ampers Motor FLA (%)',
            frickMotorKW: 'Kilowatts del Motor (KW)',
            frickSlipCapacity: 'Capacidad de Deslizamiento (%)',
            frickSlipVolume: 'Volumen de Deslizamiento (%)',
            frickFlow: 'Caudal (MÂ³/dÃ­a)',
            frickAmbientTemp: 'Temperatura Ambiente (Â°C)',
            frickWorkingHours: 'Horas Trabajo Motor (Hs)'
        };
        
        Object.entries(frickFields).forEach(([key, label]) => {
            if (data[key]) {
                doc.text(`${label}: ${data[key]}`, 20, yPosition);
                yPosition += lineHeight;
            }
        });
        
        return yPosition + lineHeight;
    }
    
    addRCIDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('PRUEBA SEMANAL DE RCI', 20, yPosition);
        yPosition += lineHeight * 2;
        
        // Add RCI data sections
        if (data.p402) {
            doc.setFont('helvetica', 'bold');
            doc.text('P-402 ELECTROBOMBA 120 m3', 20, yPosition);
            yPosition += lineHeight;
            doc.setFont('helvetica', 'normal');
            if (data.p402.suctionPressure) doc.text(`P succiÃ³n: ${data.p402.suctionPressure} kg/cmÂ²`, 25, yPosition), yPosition += lineHeight;
            if (data.p402.dischargePressure) doc.text(`P descarga: ${data.p402.dischargePressure} kg/cmÂ²`, 25, yPosition), yPosition += lineHeight;
            if (data.p402.observations) {
                doc.text('Observaciones:', 25, yPosition);
                yPosition += lineHeight;
                const splitText = doc.splitTextToSize(data.p402.observations, 160);
                doc.text(splitText, 25, yPosition);
                yPosition += splitText.length * lineHeight;
            }
            yPosition += lineHeight;
        }
        
        return yPosition;
    }
    
    addCompressorsDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('PLANILLAS DATOS MOTOCOMPRESORES', 20, yPosition);
        yPosition += lineHeight * 2;
        
        Object.entries(data).forEach(([unit, unitData]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(unit.toUpperCase(), 20, yPosition);
            yPosition += lineHeight;
            
            doc.setFont('helvetica', 'normal');
            Object.entries(unitData).forEach(([key, value]) => {
                if (value) {
                    const label = this.getCompressorFieldLabel(key);
                    doc.text(`${label}: ${value}`, 25, yPosition);
                    yPosition += lineHeight;
                    
                    // Check if we need a new page
                    if (yPosition > 270) {
                        doc.addPage();
                        yPosition = 20;
                    }
                }
            });
            yPosition += lineHeight;
        });
        
        return yPosition;
    }
    
    addRecompressorsDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('PLANILLAS DATOS RECOMPRESORES', 20, yPosition);
        yPosition += lineHeight * 2;
        
        Object.entries(data).forEach(([unit, unitData]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(unit.toUpperCase(), 20, yPosition);
            yPosition += lineHeight;
            
            doc.setFont('helvetica', 'normal');
            Object.entries(unitData).forEach(([key, value]) => {
                if (value) {
                    const label = this.getRecompressorFieldLabel(key);
                    doc.text(`${label}: ${value}`, 25, yPosition);
                    yPosition += lineHeight;
                    
                    if (yPosition > 270) {
                        doc.addPage();
                        yPosition = 20;
                    }
                }
            });
            yPosition += lineHeight;
        });
        
        return yPosition;
    }
    
    addTurboExpanderDataFieldsToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('PLANILLAS DATOS TURBOEXPANDER', 20, yPosition);
        yPosition += lineHeight * 2;
        
        doc.setFont('helvetica', 'normal');
        const turboFields = {
            expInP: 'PresiÃ³n Entrada Expansor (PIC 301B)',
            expInT: 'Temperatura Entrada Expansor (TI0314)',
            expOutP: 'PresiÃ³n Salida Expansor (PIC 306)',
            expOutT: 'Temperatura Salida Expansor (TI0326)',
            rpm: 'RPM',
            flowMMSCFD: 'CAUDAL (MMSCFD)'
        };
        
        Object.entries(turboFields).forEach(([key, label]) => {
            if (data[key]) {
                doc.text(`${label}: ${data[key]}`, 20, yPosition);
                yPosition += lineHeight;
                
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
            }
        });
        
        return yPosition + lineHeight;
    }
    
    async addPhotosToPDF(doc, yPosition) {
        const allPhotos = Object.values(this.photos).flat();
        
        if (allPhotos.length > 0) {
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('FOTOGRAFÃAS', 20, 20);
            
            let photoY = 40;
            let photoX = 20;
            const photoWidth = 80;
            const photoHeight = 60;
            const photosPerRow = 2;
            let photoCount = 0;
            
            for (const photo of allPhotos) {
                try {
                    if (photoCount > 0 && photoCount % photosPerRow === 0) {
                        photoY += photoHeight + 20;
                        photoX = 20;
                    }
                    
                    if (photoY + photoHeight > 270) {
                        doc.addPage();
                        photoY = 20;
                        photoX = 20;
                    }
                    
                    doc.addImage(photo.dataUrl, 'JPEG', photoX, photoY, photoWidth, photoHeight);
                    
                    photoX += photoWidth + 10;
                    photoCount++;
                } catch (error) {
                    console.warn('Error adding photo to PDF:', error);
                }
            }
        }
    }
    
    getFieldLabel(key) {
        const labels = {
            tagNumber: 'NÃºmero de TAG',
            priority: 'Prioridad',
            location: 'UbicaciÃ³n',
            equipmentStatus: 'Estado del Equipo',
            status: 'Estado del Equipo',
            observations: 'Observaciones',
            oilLoad: 'Carga de Aceite (litros)'
        };
        
        return labels[key] || key;
    }
    
    getCompressorFieldLabel(key) {
        const labels = {
            dcsSuctionPressure: 'PresiÃ³n de succiÃ³n DCS',
            lowPressureGasFlow: 'Caudal gas en baja presiÃ³n',
            suctionPressure: 'PresiÃ³n de SucciÃ³n',
            dischargePressureCyl1: 'Pres Desc Comp Cilindro 1',
            dischargePressureCyl2: 'Pres Desc Comp Cilindro 2',
            dischargeTempCylLeft: 'Temp Descarga Cilindro Izquierdo',
            dischargeTempCylRight: 'Temp Descarga Cilindro Derecho',
            motorOilTemp: 'Temperatura Aceite Motor',
            compressorOilTemp: 'Temperatura Aceite Compresor',
            mainWaterTemp: 'Temperatura Agua Principal'
        };
        
        return labels[key] || key;
    }
    
    getRecompressorFieldLabel(key) {
        const labels = {
            suctionFlow: 'Caudal de SucciÃ³n',
            ambientTemp: 'T. Ambiente',
            motorRPM: 'R.P.M. Motor',
            oilFilterDiffPressure: 'Pres de Dif Filtros Aceite Motor',
            motorOilPressureBoard: 'Pres de Aceite Motor Tablero',
            compressorOilPressureBoard: 'Pres de Aceite Compresor Tablero'
        };
        
        return labels[key] || key;
    }
    
    resetApp() {
        // Reset form
        document.getElementById('operatorName').value = '';
        document.getElementById('legajo').value = '';
        document.getElementById('equipmentType').value = '';
        
        // Reset datetime to current
        this.setCurrentDateTime();
        
        // Hide all fields
        this.hideAllFields();
        
        // Reset photos
        this.photos = {
            general: [],
            controlRoom: [],
            turbo: [],
            propane: [],
            rci: []
        };
        
        // Clear photo previews
        Object.keys(this.photos).forEach(type => {
            this.updatePhotoPreview(type);
        });
        
        // Clear all form fields
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type !== 'datetime-local') {
                input.value = '';
            }
            input.classList.remove('error', 'success');
        });
        
        // Remove error messages
        document.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PTGApp();
});

// Global function for photo taking (needed for onclick handlers)
window.takePhoto = function(type) {
    if (window.app) {
        window.app.takePhoto(type);
    }
};// AplicaciÃ³n PTG - Equipos y Mantenimiento - INTEGRADA CON GOOGLE SHEETS
class PTGApp {
    constructor() {
        this.photos = {
            general: [],
            controlRoom: [],
            turbo: [],
            propane: [],
            rci: []
        };
        
        this.maxPhotos = {
            general: 3,
            controlRoom: 3,
            turbo: 3,
            propane: 3,
            rci: 6
        };
        
        // URL del Google Apps Script
        this.GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1YUaIcdpf21MQjuvsi3DbHMM0x1NXMcOdB7PUo1E8WJWv7PLguJAJsnO9MrSilR8e/exec';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setCurrentDateTime();
        this.hideAllFields();
    }
    
    setupEventListeners() {
        // Equipment type change
        const equipmentType = document.getElementById('equipmentType');
        if (equipmentType) {
            equipmentType.addEventListener('change', (e) => this.handleEquipmentTypeChange(e));
        }
        
        // Photo inputs
        this.setupPhotoInputs();
        
        // PDF Generation
        const generatePdfBtn = document.getElementById('generatePdfBtn');
        if (generatePdfBtn) {
            generatePdfBtn.addEventListener('click', () => this.generatePDF());
        }
        
        // Form validation
        this.setupFormValidation();
    }
    
    setupPhotoInputs() {
        const photoTypes = ['general', 'controlRoom', 'turbo', 'propane', 'rci'];
        
        photoTypes.forEach(type => {
            const input = document.getElementById(`${type}PhotoInput`);
            if (input) {
                input.addEventListener('change', (e) => this.handlePhotoUpload(e, type));
            }
        });
    }
    
    setCurrentDateTime() {
        const now
