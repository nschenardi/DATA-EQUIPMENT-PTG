// Inicializar jsPDF
const { jsPDF } = window.jspdf;
let app = {
    photos: {
        general: [],
        turbo: [],
        propane: [],
        controlRoom: []
    },
    
    init: function() {
        this.setupEventListeners();
        this.setCurrentDateTime();
    },
    
    setupEventListeners: function() {
        const equipmentTypeSelect = document.getElementById('equipmentType');
        equipmentTypeSelect.addEventListener('change', this.handleEquipmentTypeChange.bind(this));
        
        const generatePdfBtn = document.getElementById('generatePdfBtn');
        generatePdfBtn.addEventListener('click', this.generatePDF.bind(this));
        
        // Configurar inputs de fotos
        this.setupPhotoInputs();
    },
    
    setCurrentDateTime: function() {
        const now = new Date();
        // Ajustar para timezone local
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, -1);
        document.getElementById('dateTime').value = localISOTime.substring(0, 16);
    },
    
    handleEquipmentTypeChange: function(event) {
        const selectedType = event.target.value;
        
        // Ocultar todos los campos específicos primero
        document.getElementById('generalFields').style.display = 'none';
        document.getElementById('tankFields').style.display = 'none';
        document.getElementById('oilFields').style.display = 'none';
        document.getElementById('turboExpanderFields').style.display = 'none';
        document.getElementById('propaneCompressorFields').style.display = 'none';
        document.getElementById('rciFields').style.display = 'none';
        document.getElementById('controlRoomFields').style.display = 'none';
        
        // Mostrar campos según el tipo seleccionado
        if (selectedType === 'Tanques') {
            document.getElementById('tankFields').style.display = 'block';
        } else if (selectedType === 'Carga de Aceite Motocompresores y Recompresores') {
            document.getElementById('oilFields').style.display = 'block';
        } else if (selectedType === 'Turbo Expansor') {
            document.getElementById('turboExpanderFields').style.display = 'block';
        } else if (selectedType === 'Compresores de Propano') {
            document.getElementById('propaneCompressorFields').style.display = 'block';
        } else if (selectedType === 'Prueba Semanal de RCI') {
            document.getElementById('rciFields').style.display = 'block';
        } else if (selectedType === 'Sala de Control') {
            document.getElementById('controlRoomFields').style.display = 'block';
        } else if (selectedType) {
            document.getElementById('generalFields').style.display = 'block';
        }
    },
    
    setupPhotoInputs: function() {
        const photoInputs = {
            general: document.getElementById('generalPhotoInput'),
            turbo: document.getElementById('turboPhotoInput'),
            propane: document.getElementById('propanePhotoInput'),
            controlRoom: document.getElementById('controlRoomPhotoInput')
        };
        
        for (const [type, input] of Object.entries(photoInputs)) {
            input.addEventListener('change', (e) => {
                this.handlePhotoUpload(e, type);
            });
        }
    },
    
    takePhoto: function(type) {
        const inputId = `${type}PhotoInput`;
        document.getElementById(inputId).click();
    },
    
    handlePhotoUpload: function(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (this.photos[type].length >= 3) {
            alert('Solo se permiten un máximo de 3 fotografías');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoData = {
                src: e.target.result,
                name: file.name
            };
            
            this.photos[type].push(photoData);
            this.updatePhotoPreview(type);
        };
        reader.readAsDataURL(file);
        
        // Reset input para permitir cargar la misma imagen otra vez
        event.target.value = '';
    },
    
    updatePhotoPreview: function(type) {
        const previewContainer = document.getElementById(`${type}PhotoPreview`);
        previewContainer.innerHTML = '';
        
        this.photos[type].forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = 'Foto';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = 'X';
            deleteBtn.onclick = () => {
                this.photos[type].splice(index, 1);
                this.updatePhotoPreview(type);
            };
            
            photoItem.appendChild(img);
            photoItem.appendChild(deleteBtn);
            previewContainer.appendChild(photoItem);
        });
    },
    
    generatePDF: function() {
        const selectedType = document.getElementById('equipmentType').value;
        
        if (!selectedType) {
            alert('Por favor, seleccione un tipo de equipo');
            return;
        }
        
        // Crear instancia de jsPDF
        const pdf = new jsPDF();
        
        // Obtener el número de TAG según el tipo de equipo
        let tagNumber = '';
        if (selectedType === 'Sala de Control') {
            tagNumber = document.getElementById('controlRoomTagNumber').value || 'Sin TAG';
        } else if (selectedType === 'Turbo Expansor') {
            tagNumber = document.getElementById('tagNumberTurbo').value || 'Sin TAG';
        } else if (selectedType === 'Compresores de Propano') {
            tagNumber = document.getElementById('tagNumberPropane').value || 'Sin TAG';
        } else if (selectedType !== 'Tanques' && selectedType !== 'Carga de Aceite Motocompresores y Recompresores' && selectedType !== 'Prueba Semanal de RCI') {
            tagNumber = document.getElementById('tagNumber').value || 'Sin TAG';
        } else {
            tagNumber = 'Informe ' + selectedType;
        }
        
        // Configurar nombre del archivo con el número de TAG
        const fileName = `${tagNumber.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Agregar contenido al PDF
        this.addHeaderToPDF(pdf, selectedType, tagNumber);
        this.addContentToPDF(pdf, selectedType);
        
        // Guardar el PDF
        pdf.save(fileName);
    },
    
    addHeaderToPDF: function(pdf, equipmentType, tagNumber) {
        pdf.setFillColor(44, 62, 80);
        pdf.rect(0, 0, 210, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.text('Equipos y Mantenimiento PTG', 105, 15, { align: 'center' });
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.text(`Operador: ${document.getElementById('operatorName').value}`, 15, 40);
        pdf.text(`Legajo: ${document.getElementById('legajo').value}`, 15, 47);
        pdf.text(`Fecha y Hora: ${document.getElementById('dateTime').value}`, 15, 54);
        pdf.text(`Tipo de Equipo: ${equipmentType}`, 15, 61);
        
        if (tagNumber && tagNumber !== 'Sin TAG') {
            pdf.text(`Número de TAG: ${tagNumber}`, 15, 68);
        }
        
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, 75, 195, 75);
    },
    
    addContentToPDF: function(pdf, equipmentType) {
        let yPosition = 85;
        
        if (equipmentType === 'Tanques') {
            this.addTankContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Carga de Aceite Motocompresores y Recompresores') {
            this.addOilContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Turbo Expansor') {
            this.addTurboContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Compresores de Propano') {
            this.addPropaneContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Prueba Semanal de RCI') {
            this.addRCIContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Sala de Control') {
            this.addControlRoomContentToPDF(pdf, yPosition);
        } else {
            this.addGeneralContentToPDF(pdf, yPosition);
        }
    },
    
    addGeneralContentToPDF: function(pdf, yPosition) {
        const location = document.getElementById('location').value;
        const status = document.getElementById('equipmentStatus').value;
        const observations = document.getElementById('observations').value;
        
        if (location) {
            pdf.text(`Ubicación: ${location}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (status) {
            pdf.text(`Estado: ${status}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (observations) {
            yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 15, yPosition + 10, 180);
        }
        
        // Agregar fotos si existen
        if (this.photos.general.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.general, yPosition + 10);
        }
    },
    
    addControlRoomContentToPDF: function(pdf, yPosition) {
        const status = document.getElementById('controlRoomStatus').value;
        const observations = document.getElementById('controlRoomObservations').value;
        
        if (status) {
            pdf.text(`Estado: ${status}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (observations) {
            yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 15, yPosition + 10, 180);
        }
        
        // Agregar fotos si existen
        if (this.photos.controlRoom.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.controlRoom, yPosition + 10);
        }
    },
    
    addTankContentToPDF: function(pdf, yPosition) {
        const tanks = [
            { id: 'tank1', name: 'Tanque 1 (Propano Fuera de Especificación)' },
            { id: 'tank2', name: 'Tanque 2 (Butano Fuera de Especificación)' },
            { id: 'tank3', name: 'Tanque 3 (Butano)' },
            { id: 'tank4', name: 'Tanque 4 (Butano)' },
            { id: 'tank5', name: 'Tanque 5 (Propano)' },
            { id: 'tank6', name: 'Tanque 6 (Propano)' },
            { id: 'tank7', name: 'Tanque 7 (Gasolina)' }
        ];
        
        for (const tank of tanks) {
            const level = document.getElementById(`${tank.id}Level`).value;
            const pressure = document.getElementById(`${tank.id}Pressure`) ? document.getElementById(`${tank.id}Pressure`).value : 'N/A';
            const temperature = document.getElementById(`${tank.id}Temperature`) ? document.getElementById(`${tank.id}Temperature`).value : 'N/A';
            
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(tank.name, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            pdf.text(`Nivel: ${level || 'N/A'} cm`, 20, yPosition);
            yPosition += 7;
            
            if (tank.id !== 'tank7') {
                pdf.text(`Presión: ${pressure || 'N/A'} kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Temperatura: ${temperature || 'N/A'} °C`, 20, yPosition);
                yPosition += 7;
            }
            
            yPosition += 5;
            
            // Verificar si necesitamos una nueva página
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
        }
    },
    
    addOilContentToPDF: function(pdf, yPosition) {
        const equipment = [
            { id: 'mc1', name: 'MC#1' },
            { id: 'mc2', name: 'MC#2' },
            { id: 'mc3', name: 'MC#3' },
            { id: 'mc5', name: 'MC#5' },
            { id: 'mc6', name: 'MC#6' },
            { id: 'rc4', name: 'RC#4' },
            { id: 'rc7', name: 'RC#7' },
            { id: 'rc8', name: 'RC#8' },
            { id: 'rc9', name: 'RC#9' }
        ];
        
        for (const eq of equipment) {
            const motorCm = document.getElementById(`${eq.id}MotorCm`).value;
            const compressorCm = document.getElementById(`${eq.id}CompressorCm`).value;
            
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(eq.name, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            pdf.text(`Nivel Lado Motor: ${motorCm || 'N/A'} cm`, 20, yPosition);
            yPosition += 7;
            pdf.text(`Nivel Lado Compresor: ${compressorCm || 'N/A'} cm`, 20, yPosition);
            yPosition += 10;
            
            // Verificar si necesitamos una nueva página
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
        }
        
        // Agregar nivel de cisterna de aceite
        const cisternLevel = document.getElementById('oilCisternLevel').value;
        if (cisternLevel) {
            pdf.setFont(undefined, 'bold');
            pdf.text('Cisterna de Aceite', 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            pdf.text(`Nivel: ${cisternLevel} cm`, 20, yPosition);
            yPosition += 10;
        }
    },
    
    addTurboContentToPDF: function(pdf, yPosition) {
        const location = document.getElementById('locationTurbo').value;
        const status = document.getElementById('equipmentStatusTurbo').value;
        const oilLevel = document.getElementById('turboOilLevel').value;
        const observations = document.getElementById('observationsTurbo').value;
        
        if (location) {
            pdf.text(`Ubicación: ${location}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (status) {
            pdf.text(`Estado: ${status}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (oilLevel) {
            pdf.text(`Carga de Aceite: ${oilLevel} litros`, 15, yPosition);
            yPosition += 7;
        }
        
        if (observations) {
            yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 15, yPosition + 10, 180);
        }
        
        // Agregar fotos si existen
        if (this.photos.turbo.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.turbo, yPosition + 10);
        }
    },
    
    addPropaneContentToPDF: function(pdf, yPosition) {
        const location = document.getElementById('locationPropane').value;
        const status = document.getElementById('equipmentStatusPropane').value;
        const oilLevel = document.getElementById('propaneOilLevel').value;
        const observations = document.getElementById('observationsPropane').value;
        
        if (location) {
            pdf.text(`Ubicación: ${location}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (status) {
            pdf.text(`Estado: ${status}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (oilLevel) {
            pdf.text(`Carga de Aceite: ${oilLevel} litros`, 15, yPosition);
            yPosition += 7;
        }
        
        if (observations) {
            yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 15, yPosition + 10, 180);
        }
        
        // Agregar fotos si existen
        if (this.photos.propane.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.propane, yPosition + 10);
        }
    },
    
    addRCIContentToPDF: function(pdf, yPosition) {
        const rciSections = [
            {
                title: 'P-402 ELECTROBOMBA 120 m3',
                inputs: [
                    { id: 'p402SuctionPressure', label: 'P succión' },
                    { id: 'p402DischargePressure', label: 'P descarga' },
                    { id: 'p402Observations', label: 'Observaciones', isTextarea: true }
                ]
            },
            {
                title: 'P-401 ELECTROBOMBA 500 m3',
                inputs: [
                    { id: 'p401SuctionPressure', label: 'P succión' },
                    { id: 'p401DischargePressure', label: 'P descarga' },
                    { id: 'p401Observations', label: 'Observaciones', isTextarea: true }
                ]
            },
            {
                title: 'P-401 B MOTOBOMBA VOLVO',
                inputs: [
                    { id: 'p401bSuctionPressure', label: 'P succión' },
                    { id: 'p401bDischargePressure', label: 'P descarga' },
                    { id: 'p401bOilPressure', label: 'P aceite', unit: 'PSI' },
                    { id: 'p401bCoolantTemp', label: 'Tº refrigerante', unit: 'ºC' },
                    { id: 'p401bRPM', label: 'RPM' },
                    { id: 'p401bAmbientTemp', label: 'T ambiente', unit: 'ºC' },
                    { id: 'p401bCurrent1', label: 'Corriente1', unit: 'Amp' },
                    { id: 'p401bVoltage1', label: 'Voltaje1', unit: 'Volt' },
                    { id: 'p401bCurrent2', label: 'Corriente2', unit: 'Amp' },
                    { id: 'p401bVoltage2', label: 'Voltaje2', unit: 'Volt' },
                    { id: 'p401bGasLevel', label: 'Nivel de Gas Oil', unit: 'lts' },
                    { id: 'p401bCoolantOK', label: 'Nivel de Refrigerante ok?' },
                    { id: 'p401bOilOK', label: 'Nivel de Aceite ok?' },
                    { id: 'p401bObservations', label: 'Observaciones', isTextarea: true }
                ]
            },
            {
                title: 'MOTOBOMBA CUMMINS',
                inputs: [
                    { id: 'cumminsDischargePressure', label: 'P descarga' },
                    { id: 'cumminsOilPressure', label: 'P aceite' },
                    { id: 'cumminsCoolantTemp', label: 'Tº Refrigerante', unit: 'ºC' },
                    { id: 'cumminsHorometer', label: 'Horómetro', unit: 'hr' },
                    { id: 'cumminsChargerCurrent', label: 'Corriente en Cargador Batería', unit: 'Amp' },
                    { id: 'cumminsGasLevel', label: 'Nivel de Gas Oil', unit: 'lts' },
                    { id: 'cumminsRPM', label: 'RPM' },
                    { id: 'cumminsCoolantOK', label: 'Nivel de Refrigerante ok?' },
                    { id: 'cumminsOilOK', label: 'Nivel de Aceite ok?' },
                    { id: 'cumminsObservations', label: 'Observaciones', isTextarea: true }
                ]
            },
            {
                title: 'MOTOBOMBA CAL-FRAC',
                inputs: [
                    { id: 'calfracSuctionPressure', label: 'P succión' },
                    { id: 'calfracDischargePressure', label: 'P descarga' },
                    { id: 'calfracCoolantOK', label: 'Nivel de Refrigerante ok?' },
                    { id: 'calfracOilOK', label: 'Nivel de Aceite ok?' },
                    { id: 'calfracObservations', label: 'Observaciones', isTextarea: true }
                ]
            },
            {
                title: 'EQUIPAMIENTOS ADICIONALES',
                inputs: [
                    { id: 'hydrantObservations', label: 'Observaciones de hidrantes, mangueras y otros equipamientos', isTextarea: true }
                ]
            }
        ];
        
        for (const section of rciSections) {
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            
            // Verificar si necesitamos una nueva página
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            
            pdf.text(section.title, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            
            for (const input of section.inputs) {
                const value = document.getElementById(input.id).value;
                
                if (value) {
                    let text = `${input.label}: ${value}`;
                    if (input.unit) {
                        text += ` ${input.unit}`;
                    }
                    
                    if (input.isTextarea) {
                        yPosition = this.addWrappedText(pdf, text, 20, yPosition, 175);
                        yPosition += 5;
                    } else {
                        pdf.text(text, 20, yPosition);
                        yPosition += 7;
                    }
                }
                
                // Verificar si necesitamos una nueva página
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
            }
            
            yPosition += 5;
        }
    },
    
    addWrappedText: function(pdf, text, x, y, maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * 7);
    },
    
    addPhotosToPDF: function(pdf, photos, yPosition) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Fotografías:', 15, yPosition);
        yPosition += 10;
        
        const imgWidth = 80;
        const imgHeight = 60;
        const spacing = 10;
        
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            
            // Verificar si necesitamos una nueva página
            if (yPosition + imgHeight > 280) {
                pdf.addPage();
                yPosition = 20;
            }
            
            try {
                pdf.addImage(photo.src, 'JPEG', 15, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + spacing;
                
                // Verificar si necesitamos una nueva página después de agregar la imagen
                if (yPosition > 250 && i < photos.length - 1) {
                    pdf.addPage();
                    yPosition = 20;
                }
            } catch (error) {
                console.error('Error al agregar imagen al PDF:', error);
                pdf.text('Error al cargar la imagen', 15, yPosition);
                yPosition += 20;
            }
        }
        
        return yPosition;
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});