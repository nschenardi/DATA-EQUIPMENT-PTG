// AplicaciÃ³n PTG - Equipos y Mantenimiento con integración Google Sheets
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

        // Configuración para Google Sheets
        this.googleSheetsConfig = {
            scriptUrl: 'https://script.google.com/macros/s/AKfycby1YUaIcdpf21MQjuvsi3DbHMM0x1NXMcOdB7PUo1E8WJWv7PLguJAJsnO9MrSilR8e/exec',
            spreadsheetIds: {
                'Planillas Datos Frick K-401': '1AkOmXJnrrVzRJfca2ARF52fNAK-XgDdvT_ENg2a5nVU',
                'Planillas Datos Motocompresores': '1fkiiLq8gnFKpj35XmfF7yfsxD-6OBWF2M9dk2dCZ__I',
                'Planillas Datos Recompresores': '1-1VD_VUwy27yPprZcCUoq755yZWUGsdo0_saTteOLlE',
                'Planillas Datos TurboExpander': '1s9XSiYPN5EMEORGhEGS6DAeV6JsIjWEOM5P26KNOu1U'
            },
            sheetNames: {
                'Planillas Datos Frick K-401': this.getCurrentDay().toString(), // 1, 2, 3... hasta el día actual del mes
                'Planillas Datos Motocompresores': ['MC#1', 'MC#2', 'MC#3', 'MC#5', 'MC#6'],
                'Planillas Datos Recompresores': ['RC #4', 'RC #7', 'RC #8', 'RC #9'],
                'Planillas Datos TurboExpander': '2025'
            }
        };
        
        this.init();
    }

    getCurrentDay() {
        return new Date().getDate();
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
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const formattedDateTime = localDateTime.toISOString().slice(0, 16);
        
        const dateTimeInput = document.getElementById('dateTime');
        if (dateTimeInput) {
            dateTimeInput.value = formattedDateTime;
        }
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
        
        // Show appropriate fields with animation
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
        
        if (targetField) {
            this.showField(targetField);
        } else if (selectedValue && selectedValue !== '') {
            this.showField('generalFields');
        }
    }
    
    showField(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.display = 'block';
            field.classList.add('fade-in');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                field.classList.remove('fade-in');
            }, 500);
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
            alert(`MÃ¡ximo ${maxPhotos} fotos permitidas para esta secciÃ³n.`);
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
                <button class="photo-remove" onclick="app.removePhoto('${type}', ${index})" type="button">Ã—</button>
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
                temperature: document.getElementById(`tank${i}Temperature`)?.value || ''
            };
        }
        return tanks;
    }
    
    collectOilData() {
        const oil = {};