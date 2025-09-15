// Aplicación PTG - Equipos y Mantenimiento con Integración Google Sheets
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
        
        // URL del Google Apps Script - REEMPLAZAR con tu URL real después del despliegue
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3zqxvWHe0Zpi-WaKm3VCwvp77NaWaPQcsjFQ_Md20AvBiuYo2quyIFGk9xPHBCkso/exec';
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.setCurrentDateTime();
                this.hideAllFields();
            });
        } else {
            this.setupEventListeners();
            this.setCurrentDateTime();
            this.hideAllFields();
        }
    }
    
    setupEventListeners() {
        // Equipment type change
        const equipmentType = document.getElementById('equipmentType');
        if (equipmentType) {
            equipmentType.addEventListener('change', (e) => this.handleEquipmentTypeChange(e));
        }
        
        // Photo inputs
        this.setupPhotoInputs();
        
        // PDF Generation - El botón ya existe en el HTML
        const generatePdfBtn = document.getElementById('generatePdfBtn');
        if (generatePdfBtn) {
            generatePdfBtn.addEventListener('click', () => this.generatePDF());
        }
        
        // Form validation
        this.setupFormValidation();
        
        // Tank loading checkboxes - Faltan en el HTML, pero mantenemos el código
        this.setupTankLoadingCheckboxes();
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
    
    setupTankLoadingCheckboxes() {
        // Setup event listeners for tank loading checkboxes
        for (let i = 1; i <= 7; i++) {
            const checkbox = document.getElementById(`tank${i}Loading`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => this.handleTankLoadingChange(e, i));
            }
        }
    }
    
    handleTankLoadingChange(event, tankNumber) {
        const tankGroup = event.target.closest('.tank-group');
        if (tankGroup) {
            if (event.target.checked) {
                tankGroup.classList.add('loading-active');
            } else {
                tankGroup.classList.remove('loading-active');
            }
        }
    }
    
    setCurrentDateTime() {
        setTimeout(() => {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
            const formattedDateTime = localDateTime.toISOString().slice(0, 16);
            
            const dateTimeInput = document.getElementById('dateTime');
            if (dateTimeInput) {
                dateTimeInput.value = formattedDateTime;
            }
        }, 100);
    }
    
    hideAllFields() {
        const fieldGroups = [
            'generalFields',
            'controlRoomFields', 
            'tankFields',
            'oilFields',
            'turboExpanderFields',
            'propaneCompressorFields',
            'frickFields',
            'rciFields',
            'compressorFields',
            'recompressorFields',
            'turboExpanderDataFields'
        ];
        
        fieldGroups.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.display = 'none';
            }
        });
    }
    
    handleEquipmentTypeChange(event) {
        const selectedValue = event.target.value;
        console.log('Equipo seleccionado:', selectedValue); // Debug
        
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
        
        // Show appropriate fields with animation - Mapeo corregido para HTML actual
        const fieldMapping = {
            'Sala de Control': 'controlRoomFields',
            'Tanques': 'tankFields',
            'Carga de Aceite Motocompresores y Recompresores': 'oilFields',
            'Turbo Expansor': 'turboExpanderFields',
            'Compresores de Propano': 'propaneCompressorFields',
            'Planillas Datos Frick K-401': 'frickFields',
            'Prueba Semanal de RCI': 'rciFields',
            'Planillas Datos Motocompresores': 'compressorFields',
            'Planillas Datos Recompresores': 'recompressorFields',
            'Planillas Datos TurboExpander': 'turboExpanderDataFields'
        };
        
        const targetField = fieldMapping[selectedValue];
        console.log('Campo objetivo:', targetField); // Debug
        
        if (targetField) {
            this.showField(targetField);
        } else if (selectedValue && selectedValue !== '') {
            this.showField('generalFields');
        }
    }
    
    showField(fieldId) {
        console.log('Mostrando campo:', fieldId); // Debug
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.display = 'block';
            field.classList.add('fade-in');
            console.log('Campo mostrado exitosamente'); // Debug
            
            // Remove animation class after animation completes
            setTimeout(() => {
                field.classList.remove('fade-in');
            }, 500);
        } else {
            console.log('Campo no encontrado:', fieldId); // Debug
        }
    }
    
    takePhoto(type) {
        const input = document.getElementById(`${type}PhotoInput`);
        if (input) {
            input.click();
        }
    }
    
    handlePhotoUpload(event, type) {
        const files = Array.from(event.target.files);
        const maxPhotos = this.maxPhotos[type] || 3;
        
        if (this.photos[type].length + files.length > maxPhotos) {
            alert(`Máximo ${maxPhotos} fotos permitidas para esta sección.`);
            return;
        }
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.photos[type].push({
                        file: file,
                        dataUrl: e.target.result,
                        name: file.name
                    });
                    this.updatePhotoPreview(type);
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Reset input
        event.target.value = '';
    }
    
    updatePhotoPreview(type) {
        const preview = document.getElementById(`${type}PhotoPreview`);
        if (!preview) return;
        
        preview.innerHTML = '';
        
        this.photos[type].forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo.dataUrl}" alt="Foto ${index + 1}" />
                <button class="photo-remove" onclick="app.removePhoto('${type}', ${index})" type="button">×</button>
            `;
            preview.appendChild(photoItem);
        });
    }
    
    removePhoto(type, index) {
        this.photos[type].splice(index, 1);
        this.updatePhotoPreview(type);
    }
    
    setupFormValidation() {
        const requiredFields = ['operatorName', 'legajo', 'dateTime', 'equipmentType'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => this.clearFieldError(field));
            }
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const isValid = value !== '';
        
        if (isValid) {
            field.classList.remove('error');
            field.classList.add('success');
            this.removeErrorMessage(field);
        } else {
            field.classList.remove('success');
            field.classList.add('error');
            this.showErrorMessage(field, 'Este campo es requerido');
        }
        
        return isValid;
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        this.removeErrorMessage(field);
    }
    
    showErrorMessage(field, message) {
        this.removeErrorMessage(field);
        const errorDiv = document.createElement('span');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
    
    removeErrorMessage(field) {
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    validateForm() {
        const requiredFields = ['operatorName', 'legajo', 'dateTime', 'equipmentType'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    collectFormData() {
        const data = {};
        const equipmentType = document.getElementById('equipmentType').value;
        
        // Basic info
        data.operatorName = document.getElementById('operatorName')?.value || '';
        data.legajo = document.getElementById('legajo')?.value || '';
        data.dateTime = document.getElementById('dateTime')?.value || '';
        data.equipmentType = equipmentType;
        
        // Conditional fields based on equipment type
        if (equipmentType === 'Sala de Control') {
            data.controlRoom = this.collectControlRoomData();
        } else if (equipmentType === 'Tanques') {
            data.tanks = this.collectTanksData();
        } else if (equipmentType === 'Carga de Aceite Motocompresores y Recompresores') {
            data.oil = this.collectOilData();
        } else if (equipmentType === 'Turbo Expansor') {
            data.turboExpander = this.collectTurboExpanderData();
        } else if (equipmentType === 'Compresores de Propano') {
            data.propaneCompressor = this.collectPropaneCompressorData();
        } else if (equipmentType === 'Planillas Datos Frick K-401') {
            data.frick = this.collectFrickData();
        } else if (equipmentType === 'Prueba Semanal de RCI') {
            data.rci = this.collectRCIData();
        } else if (equipmentType === 'Planillas Datos Motocompresores') {
            data.compressors = this.collectCompressorsData();
        } else if (equipmentType === 'Planillas Datos Recompresores') {
            data.recompressors = this.collectRecompressorsData();
        } else if (equipmentType === 'Planillas Datos TurboExpander') {
            data.turboExpanderData = this.collectTurboExpanderDataFields();
        } else {
            data.general = this.collectGeneralData();
        }
        
        return data;
    }
    
    collectGeneralData() {
        return {
            tagNumber: document.getElementById('tagNumber')?.value || '',
            priority: document.getElementById('priority')?.value || '',
            location: document.getElementById('location')?.value || '',
            equipmentStatus: document.getElementById('equipmentStatus')?.value || '',
            observations: document.getElementById('observations')?.value || ''
        };
    }
    
    collectControlRoomData() {
        return {
            tagNumber: document.getElementById('controlRoomTagNumber')?.value || '',
            priority: document.getElementById('priorityControlRoom')?.value || '',
            status: document.getElementById('controlRoomStatus')?.value || '',
            observations: document.getElementById('controlRoomObservations')?.value || ''
        };
    }
    
    collectTanksData() {
        const tanks = {};
        for (let i = 1; i <= 7; i++) {
            tanks[`tank${i}`] = {
                level: document.getElementById(`tank${i}Level`)?.value || '',
                pressure: document.getElementById(`tank${i}Pressure`)?.value || '',
                temperature: document.getElementById(`tank${i}Temperature`)?.value || '',
                loading: document.getElementById(`tank${i}Loading`)?.checked || false
            };
        }
        return tanks;
    }
    
    collectOilData() {
        const oil = {};
        const units = ['mc1', 'mc2', 'mc3', 'mc5', 'mc6', 'rc4', 'rc7', 'rc8'];
        
        units.forEach(unit => {
            oil[unit] = {
                motorCm: document.getElementById(`${unit}MotorCm`)?.value || '',
                compressorCm: document.getElementById(`${unit}CompressorCm`)?.value || ''
            };
        });
        
        oil.rc9 = {
            oilLevel: document.getElementById('rc9OilLevel')?.value || ''
        };
        
        oil.oilTank = {
            level: document.getElementById('oilTankLevel')?.value || ''
        };
        
        return oil;
    }
    
    collectTurboExpanderData() {
        return {
            tagNumber: document.getElementById('tagNumberTurbo')?.value || '',
            priority: document.getElementById('priorityTurbo')?.value || '',
            location: document.getElementById('locationTurbo')?.value || '',
            status: document.getElementById('turboStatus')?.value || '',
            oilLoad: document.getElementById('turboOilLoad')?.value || '',
            observations: document.getElementById('turboObservations')?.value || ''
        };
    }
    
    collectPropaneCompressorData() {
        return {
            tagNumber: document.getElementById('tagNumberPropane')?.value || '',
            priority: document.getElementById('priorityPropane')?.value || '',
            location: document.getElementById('locationPropane')?.value || '',
            status: document.getElementById('propaneStatus')?.value || '',
            oilLoad: document.getElementById('propaneOilLoad')?.value || '',
            observations: document.getElementById('propaneObservations')?.value || ''
        };
    }
    
    collectFrickData() {
        const frickData = {
            equipment: document.getElementById('frickEquipment')?.value || ''
        };
        
        const fields = [
            'frickSuctionPressure', 'frickSuctionTemp', 'frickDischargePressure',
            'frickDischargeTemp', 'frickOilPressure', 'frickOilTemp',
            'frickFilterDifferential', 'frickSeparatorTemp', 'frickMotorAmps',
            'frickMaxAmpsPercent', 'frickMotorKW', 'frickSlipCapacity',
            'frickSlipVolume', 'frickFlow', 'frickAmbientTemp', 'frickWorkingHours'
        ];
        
        fields.forEach(field => {
            frickData[field] = document.getElementById(field)?.value || '';
        });
        
        return frickData;
    }
    
    collectRCIData() {
        const rciData = {};
        
        // P-402 data
        rciData.p402 = {
            suctionPressure: document.getElementById('p402SuctionPressure')?.value || '',
            dischargePressure: document.getElementById('p402DischargePressure')?.value || '',
            observations: document.getElementById('p402Observations')?.value || ''
        };
        
        // P-401 data
        rciData.p401 = {
            suctionPressure: document.getElementById('p401SuctionPressure')?.value || '',
            dischargePressure: document.getElementById('p401DischargePressure')?.value || '',
            observations: document.getElementById('p401Observations')?.value || ''
        };
        
        return rciData;
    }
    
    collectCompressorsData() {
        const compressors = {};
        const units = ['mc1', 'mc2', 'mc3', 'mc5', 'mc6'];
        
        units.forEach(unit => {
            compressors[unit] = {};
            const fields = [
                'dcsSuctionPressure', 'lowPressureGasFlow', 'suctionPressure',
                'dischargePressureCyl1', 'dischargePressureCyl2', 'dischargeTempCylLeft',
                'dischargeTempCylRight', 'motorIntakeTempLeft', 'motorIntakeTempRight',
                'motorOilTemp', 'compressorOilTemp', 'mainWaterTemp',
                'intakeManifoldPressureLeft', 'intakeManifoldPressureRight',
                'airFiltersRight', 'airFiltersLeft'
            ];
            
            fields.forEach(field => {
                compressors[unit][field] = document.getElementById(`${unit}-${field}`)?.value || '';
            });
        });
        
        return compressors;
    }
    
    collectRecompressorsData() {
        const recompressors = {};
        const units = ['rc4', 'rc7', 'rc8', 'rc9'];
        
        units.forEach(unit => {
            recompressors[unit] = {};
            
            // Campos comunes para RC4, RC7, RC8
            const commonFields = [
                'suctionFlow', 'ambientTemp', 'motorRPM', 'oilFilterDiffPressure',
                'motorOilPressureBoard', 'compressorOilPressureBoard', 'compressorOilPressureIn',
                'compressorOilPressureOut', 'dischargePressureCyl1', 'dischargePressureCyl2',
                'dischargeTempCylLeft', 'dischargeTempCylRight', 'compressorSuctionPressure',
                'motorIntakeTempLeft', 'motorIntakeTempRight', 'motorOilTemp',
                'compressorOilTemp', 'mainWaterTemp', 'intakeManifoldPressureLeft',
                'intakeManifoldPressureRight', 'airFiltersRight', 'airFiltersLeft'
            ];
            
            // Campos específicos para RC9
            const rc9Fields = [
                'suctionFlow', 'ambientTemp', 'oilFilterDiffPressure', 'compressorOilPressureIn',
                'compressorOilPressureOut', 'compressorSuctionPressure1st', 'compressorDischargePressure1st',
                'compressorOilPressure', 'compressorSuctionTemp', 'dischargeTempCylinder1',
                'dischargeTempCylinder2', 'compressorOilTemp', 'motorRPM', 'motorOilPressure',
                'mainWaterTemp', 'motorOilTemp', 'airFiltersRight', 'airFiltersLeft'
            ];
            
            const fieldsToUse = (unit === 'rc9') ? rc9Fields : commonFields;
            
            fieldsToUse.forEach(field => {
                recompressors[unit][field] = document.getElementById(`${unit}-${field}`)?.value || '';
            });
        });
        
        return recompressors;
    }
    
    collectTurboExpanderDataFields() {
        const turboData = {};
        const fields = [
            'expInP', 'expInT', 'expOutP', 'expOutT', 'expWheelP',
            'compInP', 'compInT', 'compOutP', 'compOutT', 'compWheelP',
            'driveBearingThrust', 'loadBearingThrust', 'reservoirP', 'reservoirT',
            'lubeOilP', 'lubeOilDP', 'sealGasP', 'sealGasDP', 'rpm',
            'expBrgT', 'compBrgT', 'expVibX', 'compVibX', 'lubeOilInT',
            'oilDrainT', 'sealGasInT', 'pic0301B', 'pic0301A', 'recycleFIC0301',
            'fIC0301Opening', 'flowPercentage', 'expFlowFIC0101', 'compFlow',
            'ambientTempTI0100', 'sealGasSupplyP', 'sealGasSupplyT',
            'sealGasFlowFI1', 'reservoirOilLevel', 'flowMMSCFD'
        ];
        
        fields.forEach(field => {
            turboData[field] = document.getElementById(field)?.value || '';
        });
        
        return turboData;
    }

    // ========== FUNCIONES DE INTEGRACIÓN CON GOOGLE SHEETS ==========
    
    async sendDataToGoogleSheets(formData) {
        try {
            const equipmentType = formData.equipmentType;
            
            // Solo procesar tipos de equipo que se integran con Google Sheets
            const integratedEquipmentTypes = [
                'Planillas Datos Frick K-401',
                'Planillas Datos Motocompresores',
                'Planillas Datos Recompresores',
                'Planillas Datos TurboExpander'
            ];
            
            if (!integratedEquipmentTypes.includes(equipmentType)) {
                console.log(`Tipo de equipo "${equipmentType}" no requiere integración con Google Sheets`);
                return { success: true, message: 'Datos guardados localmente' };
            }
            
            // Preparar datos para enviar a Apps Script
            const dataToSend = {
                operatorName: formData.operatorName,
                legajo: formData.legajo,
                dateTime: formData.dateTime,
                equipmentType: equipmentType,
                equipmentData: {}
            };
            
            // Agregar datos específicos del equipo
            if (equipmentType === 'Planillas Datos Frick K-401') {
                dataToSend.equipmentData.frick = formData.frick;
            } else if (equipmentType === 'Planillas Datos Motocompresores') {
                dataToSend.equipmentData.compressors = formData.compressors;
            } else if (equipmentType === 'Planillas Datos Recompresores') {
                dataToSend.equipmentData.recompressors = formData.recompressors;
            } else if (equipmentType === 'Planillas Datos TurboExpander') {
                dataToSend.equipmentData.turboExpanderData = formData.turboExpanderData;
            }
            
            console.log('Enviando datos a Google Sheets:', dataToSend);
            
            // Realizar petición POST al Apps Script
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });
            
            console.log('Datos enviados exitosamente a Google Sheets');
            
            return { 
                success: true, 
                message: 'Datos enviados a Google Sheets exitosamente',
                equipmentType: equipmentType 
            };
            
        } catch (error) {
            console.error('Error enviando datos a Google Sheets:', error);
            
            return { 
                success: false, 
                error: error.message,
                message: 'Error al enviar datos a Google Sheets. Los datos se guardaron localmente.' 
            };
        }
    }
    
    showIntegrationNotification(result) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `integration-notification ${result.success ? 'success' : 'error'}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${result.success ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
        `;
        
        if (result.success) {
            notification.innerHTML = `
                <strong>✓ Integración Exitosa</strong><br>
                ${result.message}
                ${result.equipmentType ? `<br><small>Equipo: ${result.equipmentType}</small>` : ''}
            `;
        } else {
            notification.innerHTML = `
                <strong>⚠ Error de Integración</strong><br>
                ${result.message}
            `;
        }
        
        document.body.appendChild(notification);
        
        // Remover notificación después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // ========== GENERACIÓN DE PDF ==========
    
    async generatePDF() {
        if (!this.validateForm()) {
            alert('Por favor complete todos los campos requeridos.');
            return;
        }
        
        const generateBtn = document.getElementById('generatePdfBtn');
        generateBtn.classList.add('loading');
        generateBtn.textContent = 'Generando PDF y enviando datos...';
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const data = this.collectFormData();
            
            // Integración con Google Sheets
            try {
                const integrationResult = await this.sendDataToGoogleSheets(data);
                this.showIntegrationNotification(integrationResult);
            } catch (integrationError) {
                console.error('Error en integración con Google Sheets:', integrationError);
                this.showIntegrationNotification({
                    success: false,
                    message: 'Error al conectar con Google Sheets. Datos guardados localmente.'
                });
            }
            
            // PDF Header
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('EQUIPOS Y MANTENIMIENTO PTG', 20, 20);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            let yPosition = 40;
            const lineHeight = 7;
            
            // Basic Information
            doc.setFont('helvetica', 'bold');
            doc.text('INFORMACIÓN BÁSICA', 20, yPosition);
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
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Por favor intente nuevamente.');
        } finally {
            generateBtn.classList.remove('loading');
            generateBtn.textContent = 'Generar Informe PDF';
            this.resetApp();
        }
    }
    
    // ========== FUNCIONES PARA PDF ==========
    
    addGeneralDataToPDF(doc, data, yPosition, lineHeight) {
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DEL EQUIPO', 20, yPosition);
        yPosition += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        if (data.tagNumber) {
            doc.text(`Número de TAG: ${data.tagNumber}`, 20, yPosition);
            yPosition += lineHeight;
        }
        if (data.priority) {
            doc.text(`Prioridad: ${data.priority}`, 20, yPosition);
            yPosition += lineHeight;
        }
        if (data.location) {
            doc.text(`Ubicación: ${data.location}`, 20, yPosition);
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
            tank1: 'Tanque 1 (Propano Fuera de Especificación)',
            tank2: 'Tanque 2 (Butano Fuera de Especificación)',
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
                if (tankData.loading) {
                    doc.text(' (EN CARGA)', 20, yPosition + lineHeight);
                    yPosition += lineHeight;
                }
                yPosition += lineHeight;
                
                doc.setFont('helvetica', 'normal');
                if (tankData.level) doc.text(`Nivel: ${tankData.level} cm`, 25, yPosition), yPosition += lineHeight;
                if (tankData.pressure) doc.text(`Presión: ${tankData.pressure} kg/cm²`, 25, yPosition), yPosition += lineHeight;
                if (tankData.temperature) doc.text(`Temperatura: ${tankData.temperature} °C`, 25, yPosition), yPosition += lineHeight;
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
            frickSuctionPressure: 'Presión de Succión (Bar)',
            frickSuctionTemp: 'Temperatura de Succión (°C)',
            frickDischargePressure: 'Presión de Descarga (Bar)',
            frickDischargeTemp: 'Temperatura de Descarga (°C)',
            frickOilPressure: 'Presión de Aceite Compresor (Bar)',
            frickOilTemp: 'Temperatura de Aceite Compresor (°C)',
            frickFilterDifferential: 'Diferencial del Filtro (Bar)',
            frickSeparatorTemp: 'Temperatura de Separador (°C)',
            frickMotorAmps: 'Ampers Motor (Amp)',
            frickMaxAmpsPercent: 'Máxima carga Ampers Motor FLA (%)',
            frickMotorKW: 'Kilowatts del Motor (KW)',
            frickSlipCapacity: 'Capacidad de Deslizamiento (%)',
            frickSlipVolume: 'Volumen de Deslizamiento (%)',
            frickFlow: 'Caudal (M³/día)',
            frickAmbientTemp: 'Temperatura Ambiente (°C)',
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
        
        if (data.p402) {
            doc.setFont('helvetica', 'bold');
            doc.text('P-402 ELECTROBOMBA 120 m3', 20, yPosition);
            yPosition += lineHeight;
            doc.setFont('helvetica', 'normal');
            if (data.p402.suctionPressure) doc.text(`P succión: ${data.p402.suctionPressure} kg/cm²`, 25, yPosition), yPosition += lineHeight;
            if (data.p402.dischargePressure) doc.text(`P descarga: ${data.p402.dischargePressure} kg/cm²`, 25, yPosition), yPosition += lineHeight;
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
        
        // TODOS los campos del TurboExpander
        const turboFields = {
            expInP: 'Presión Entrada Expansor (PIC 301B)',
            expInT: 'Temperatura Entrada Expansor (TI0314)',
            expOutP: 'Presión Salida Expansor (PIC 306)',
            expOutT: 'Temperatura Salida Expansor (TI0326)',
            expWheelP: 'Presión Rueda Expansor',
            compInP: 'Presión Entrada Compresor',
            compInT: 'Temperatura Entrada Compresor',
            compOutP: 'Presión Salida Compresor',
            compOutT: 'Temperatura Salida Compresor',
            compWheelP: 'Presión Rueda Compresor',
            driveBearingThrust: 'Presión Empuje Expansor',
            loadBearingThrust: 'Presión Empuje Compresor',
            reservoirP: 'Presión Reservorio',
            reservoirT: 'Temperatura Reservorio',
            lubeOilP: 'Presión Aceite Lubricante',
            lubeOilDP: 'Diferencia Presión Aceite Lubricante',
            sealGasP: 'Presión Gas de Sello',
            sealGasDP: 'Diferencia Presión Gas de Sello',
            rpm: 'RPM',
            expBrgT: 'Temperatura Cojinetes Expansor',
            compBrgT: 'Temperatura Cojinetes Compresor',
            expVibX: 'Vibración X Expansor',
            compVibX: 'Vibración X Compresor',
            lubeOilInT: 'Temperatura Entrada Aceite Lubricante',
            oilDrainT: 'Temperatura Aceite Drenaje',
            sealGasInT: 'Temperatura Entrada Gas de Sello',
            pic0301B: '% Aletas Guías',
            pic0301A: 'JT %',
            recycleFIC0301: 'Reciclo FIC0301',
            fIC0301Opening: 'Porcentaje apertura FIC0301',
            flowPercentage: 'Valor de caudal (porcentaje)',
            expFlowFIC0101: 'Flujo Expansor',
            compFlow: 'Flujo Compresor',
            ambientTempTI0100: 'T° Ambiente',
            sealGasSupplyP: 'Presión Suministro Gas de Sello',
            sealGasSupplyT: 'T° Suministro Gas de Sello',
            sealGasFlowFI1: 'Caudal Gas de Sello FI-1',
            reservoirOilLevel: 'Nivel Aceite Reservorio',
            flowMMSCFD: 'Caudal (MMSCFD)'
        };
        
        Object.entries(turboFields).forEach(([key, label]) => {
            if (data[key] && data[key] !== '') {
                doc.text(`${label}: ${data[key]}`, 20, yPosition);
                yPosition += lineHeight;
                
                // Nueva página si es necesario
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
            doc.text('FOTOGRAFÍAS', 20, 20);
            
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
            tagNumber: 'Número de TAG',
            priority: 'Prioridad',
            location: 'Ubicación',
            equipmentStatus: 'Estado del Equipo',
            status: 'Estado del Equipo',
            observations: 'Observaciones',
            oilLoad: 'Carga de Aceite (litros)'
        };
        
        return labels[key] || key;
    }
    
    getCompressorFieldLabel(key) {
        const labels = {
            dcsSuctionPressure: 'Presión de succión DCS',
            lowPressureGasFlow: 'Caudal gas en baja presión',
            suctionPressure: 'Presión de Succión',
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
            suctionFlow: 'Caudal de Succión',
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
                if (input.type === 'checkbox') {
                    input.checked = false;
                }
            }
            input.classList.remove('error', 'success');
        });
        
        // Remove loading-active class from tank groups
        document.querySelectorAll('.tank-group').forEach(tankGroup => {
            tankGroup.classList.remove('loading-active');
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
};