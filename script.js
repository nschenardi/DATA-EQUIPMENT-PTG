class IndustrialEquipmentApp {
    constructor() {
        this.generalPhotos = [];
        this.rciPhotos = {
            p402: [],
            p401: [],
            p401b: [],
            cummins: [],
            calfrac: []
        };
        this.maxPhotos = 3;
        this.oilEquipmentList = ["MC#1", "MC#2", "MC#3", "MC#5", "MC#6", "RC#4", "RC#7", "RC#8", "RC#9"];
        this.rciEquipmentList = ["p402", "p401", "p401b", "cummins", "calfrac"];
        this.init();
    }

    init() {
        this.setCurrentDateTime();
        this.bindEvents();
        this.checkAppAccess();
    }

    setCurrentDateTime() {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        document.getElementById('dateTime').value = localDateTime;
    }

    bindEvents() {
        document.getElementById('equipmentType').addEventListener('change', (e) => {
            this.handleEquipmentTypeChange(e.target.value);
        });

        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetApp();
        });

        this.setupPhotoListeners();
        
        setInterval(() => {
            this.setCurrentDateTime();
        }, 60000);
    }
    
    setupPhotoListeners() {
        document.getElementById('generalPhotoInput').addEventListener('change', (e) => {
            this.handlePhotoSelection(e, 'general');
        });
        this.rciEquipmentList.forEach(equipmentId => {
            document.getElementById(`${equipmentId}PhotoInput`).addEventListener('change', (e) => {
                this.handlePhotoSelection(e, equipmentId);
            });
        });
    }

    handleEquipmentTypeChange(equipmentType) {
        const generalFields = document.getElementById('generalFields');
        const tankFields = document.getElementById('tankFields');
        const oilFields = document.getElementById('oilFields');
        const rciFields = document.getElementById('rciFields');

        generalFields.style.display = 'none';
        tankFields.style.display = 'none';
        oilFields.style.display = 'none';
        rciFields.style.display = 'none';
        
        this.clearAllFields();

        if (equipmentType === 'Tanques') {
            tankFields.style.display = 'block';
        } else if (equipmentType === 'Carga de Aceite Motocompresores y Recompresores') {
            oilFields.style.display = 'block';
        } else if (equipmentType === 'Prueba Semanal de RCI') {
            rciFields.style.display = 'block';
        } else {
            generalFields.style.display = 'block';
        }
    }

    clearAllFields() {
        // Clear general fields
        document.getElementById('tagNumber').value = '';
        document.getElementById('location').value = '';
        document.getElementById('equipmentStatus').value = '';
        document.getElementById('observations').value = '';

        // Clear all tank fields
        for (let i = 1; i <= 7; i++) {
            const levelField = document.getElementById(`tank${i}Level`);
            const pressureField = document.getElementById(`tank${i}Pressure`);
            const temperatureField = document.getElementById(`tank${i}Temperature`);
            
            if (levelField) levelField.value = '';
            if (pressureField) pressureField.value = '';
            if (temperatureField) temperatureField.value = '';
        }

        // Clear oil fields
        this.oilEquipmentList.forEach(equipment => {
            const motorField = document.getElementById(`${equipment.toLowerCase().replace('#', '')}MotorLitros`);
            const compressorField = document.getElementById(`${equipment.toLowerCase().replace('#', '')}CompressorLitros`);
            if (motorField) motorField.value = '';
            if (compressorField) compressorField.value = '';
        });

        // Clear RCI fields
        this.rciEquipmentList.forEach(equipmentId => {
            const inputs = document.querySelectorAll(`#rciFields input, #rciFields select, #rciFields textarea`);
            inputs.forEach(input => {
                if (input.type === 'text' || input.type === 'number' || input.tagName === 'TEXTAREA') {
                    input.value = '';
                } else if (input.tagName === 'SELECT') {
                    input.value = '';
                }
            });
        });

        // Reset photos
        this.generalPhotos = [];
        this.rciPhotos = { p402: [], p401: [], p401b: [], cummins: [], calfrac: [] };
        this.updatePhotoPreview('general');
        this.rciEquipmentList.forEach(equipmentId => this.updatePhotoPreview(equipmentId));
    }

    takePhoto(equipmentId) {
        let photoArray = equipmentId === 'general' ? this.generalPhotos : this.rciPhotos[equipmentId];
        if (photoArray.length >= this.maxPhotos) {
            alert(`Máximo ${this.maxPhotos} fotografías permitidas por equipo.`);
            return;
        }
        document.getElementById(`${equipmentId}PhotoInput`).click();
    }

    handlePhotoSelection(event, equipmentId) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.processAndAddPhoto(e.target.result, equipmentId);
        };
        reader.readAsDataURL(file);
        
        event.target.value = '';
    }

    processAndAddPhoto(dataUrl, equipmentId) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 900;
            
            let { width, height } = img;
            
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = width * (MAX_HEIGHT / height);
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            const correctedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            this.addPhoto(correctedDataUrl, equipmentId);
        };

        img.src = dataUrl;
    }

    addPhoto(dataUrl, equipmentId) {
        let photoArray = equipmentId === 'general' ? this.generalPhotos : this.rciPhotos[equipmentId];
        if (photoArray.length >= this.maxPhotos) return;

        photoArray.push(dataUrl);
        this.updatePhotoPreview(equipmentId);
    }

    removePhoto(equipmentId, index) {
        let photoArray = equipmentId === 'general' ? this.generalPhotos : this.rciPhotos[equipmentId];
        photoArray.splice(index, 1);
        this.updatePhotoPreview(equipmentId);
    }

    updatePhotoPreview(equipmentId) {
        const previewId = `${equipmentId}PhotoPreview`;
        const preview = document.getElementById(previewId);
        if (!preview) return;

        let photoArray = equipmentId === 'general' ? this.generalPhotos : this.rciPhotos[equipmentId];
        preview.innerHTML = '';

        photoArray.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo}" alt="Foto ${index + 1}">
                <button type="button" class="remove-photo" onclick="app.removePhoto('${equipmentId}', ${index})">×</button>
            `;
            preview.appendChild(photoItem);
        });

        const btn = document.querySelector(`#${equipmentId}PhotoInput`).parentElement.querySelector('.photo-btn');
        btn.textContent = `📷 Tomar Foto (${photoArray.length}/${this.maxPhotos})`;
        btn.disabled = photoArray.length >= this.maxPhotos;
    }

    validateForm() {
        const requiredFields = ['operatorName', 'legajo', 'equipmentType'];
        const equipmentType = document.getElementById('equipmentType').value;

        for (let field of requiredFields) {
            const value = document.getElementById(field).value.trim();
            if (!value) {
                alert(`El campo ${document.querySelector(`label[for="${field}"]`).textContent} es obligatorio.`);
                return false;
            }
        }

        if (equipmentType === 'Tanques') {
            let hasData = false;
            for (let i = 1; i <= 7; i++) {
                const levelField = document.getElementById(`tank${i}Level`);
                if (levelField && levelField.value && levelField.value.trim()) {
                    hasData = true;
                    break;
                }
            }
            if (!hasData) {
                alert('Debe completar al menos un tanque con su nivel.');
                return false;
            }
        } else if (equipmentType === 'Carga de Aceite Motocompresores y Recompresores') {
            let hasData = false;
            this.oilEquipmentList.forEach(equipment => {
                const motorField = document.getElementById(`${equipment.toLowerCase().replace('#', '')}MotorLitros`);
                const compressorField = document.getElementById(`${equipment.toLowerCase().replace('#', '')}CompressorLitros`);
                if (motorField.value.trim() || compressorField.value.trim()) {
                    hasData = true;
                }
            });
            if (!hasData) {
                alert('Debe completar los litros de aceite de al menos un equipo.');
                return false;
            }
        } else if (equipmentType === 'Prueba Semanal de RCI') {
            let hasData = false;
            const rciGroups = document.querySelectorAll('.rci-group');
            for (const group of rciGroups) {
                const inputs = group.querySelectorAll('input, select, textarea');
                for (const input of inputs) {
                    if (input.value.trim() !== '') {
                        hasData = true;
                        break;
                    }
                }
                if (hasData) break;
            }
            if (!hasData) {
                alert('Debe completar los datos de al menos una bomba de RCI.');
                return false;
            }
        } else {
            const tagNumber = document.getElementById('tagNumber').value.trim();
            const location = document.getElementById('location').value.trim();
            const status = document.getElementById('equipmentStatus').value;
            if (!tagNumber || !location || !status) {
                alert('Número de TAG, ubicación y estado son obligatorios.');
                return false;
            }
        }
        return true;
    }

    collectFormData() {
        const equipmentType = document.getElementById('equipmentType').value;
        const data = {
            operatorName: document.getElementById('operatorName').value,
            legajo: document.getElementById('legajo').value,
            dateTime: document.getElementById('dateTime').value,
            equipmentType: equipmentType
        };

        if (equipmentType === 'Tanques') {
            data.tanks = [];
            const tankNames = [
                'Tanque 1 (Propano Fuera de Especificación)', 'Tanque 2 (Butano Fuera de Especificación)', 'Tanque 3 (Butano)', 'Tanque 4 (Butano)',
                'Tanque 5 (Propano)', 'Tanque 6 (Propano)', 'Tanque 7 (Gasolina)'
            ];
            for (let i = 1; i <= 7; i++) {
                const levelField = document.getElementById(`tank${i}Level`);
                const level = levelField ? levelField.value.trim() : '';
                if (level) {
                    const pressure = document.getElementById(`tank${i}Pressure`).value.trim() || '';
                    const temperature = document.getElementById(`tank${i}Temperature`).value.trim() || '';
                    data.tanks.push({
                        name: tankNames[i - 1], level, pressure, temperature
                    });
                }
            }
        } else if (equipmentType === 'Carga de Aceite Motocompresores y Recompresores') {
            data.oilData = [];
            this.oilEquipmentList.forEach(equipment => {
                const motorLitros = document.getElementById(`${equipment.toLowerCase().replace('#', '')}MotorLitros`).value.trim();
                const compressorLitros = document.getElementById(`${equipment.toLowerCase().replace('#', '')}CompressorLitros`).value.trim();
                if (motorLitros || compressorLitros) {
                    data.oilData.push({ equipment, motorLitros: motorLitros || '0', compressorLitros: compressorLitros || '0' });
                }
            });
        } else if (equipmentType === 'Prueba Semanal de RCI') {
            data.rciData = [];
            const rciPumps = [
                { id: 'p402', name: 'P-402 ELECTROBOMBA 120 m3', fields: ['p402SuctionPressure', 'p402DischargePressure', 'p402Observations'] },
                { id: 'p401', name: 'P-401 ELECTROBOMBA 500 m3', fields: ['p401SuctionPressure', 'p401DischargePressure', 'p401Observations'] },
                { id: 'p401b', name: 'P-401 B MOTOBOMBA VOLVO', fields: ['p401bSuctionPressure', 'p401bDischargePressure', 'p401bOilPressure', 'p401bCoolantTemp', 'p401bRPM', 'p401bAmbientTemp', 'p401bCurrent1', 'p401bVoltage1', 'p401bCurrent2', 'p401bVoltage2', 'p401bGasLevel', 'p401bCoolantOK', 'p401bOilOK', 'p401bObservations'] },
                { id: 'cummins', name: 'MOTOBOMBA CUMMINS', fields: ['cumminsDischargePressure', 'cumminsOilPressure', 'cumminsCoolantTemp', 'cumminsHorometer', 'cumminsChargerCurrent', 'cumminsGasLevel', 'cumminsRPM', 'cumminsCoolantOK', 'cumminsOilOK', 'cumminsObservations'] },
                { id: 'calfrac', name: 'MOTOBOMBA CAL-FRAC', fields: ['calfracSuctionPressure', 'calfracDischargePressure', 'calfracCoolantOK', 'calfracOilOK', 'calfracObservations'] }
            ];

            rciPumps.forEach(pump => {
                let pumpData = { id: pump.id, name: pump.name, data: {}, photos: this.rciPhotos[pump.id] };
                let hasData = false;
                pump.fields.forEach(fieldId => {
                    const element = document.getElementById(fieldId);
                    if (element && element.value.trim() !== '') {
                        pumpData.data[fieldId] = element.value.trim();
                        hasData = true;
                    }
                });
                if (hasData || pumpData.photos.length > 0) {
                    data.rciData.push(pumpData);
                }
            });
        } else {
            data.tagNumber = document.getElementById('tagNumber').value;
            data.location = document.getElementById('location').value;
            data.status = document.getElementById('equipmentStatus').value;
            data.observations = document.getElementById('observations').value;
            data.photos = this.generalPhotos;
        }

        return data;
    }

    generateReport() {
        if (!this.validateForm()) {
            return;
        }

        const data = this.collectFormData();
        
        const generateBtn = document.getElementById('generateReportBtn');
        
        generateBtn.classList.add('loading');
        generateBtn.textContent = 'Generando...';

        setTimeout(() => {
            try {
                this.createPDF(data);
            } catch (error) {
                console.error('Error al generar el informe:', error);
                alert('Error al generar el informe: ' + error.message);
            } finally {
                generateBtn.classList.remove('loading');
                generateBtn.textContent = '📄 Generar Informe PDF';
            }
        }, 500);
    }

    createPDF(data) {
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error('jsPDF library not loaded');
            }
            
            const doc = new jsPDF();
            let yPosition = 45;
            const lineHeight = 8;
            const leftMargin = 20;
            const rightMargin = 190;
            const pageHeight = doc.internal.pageSize.getHeight();
            const photoWidth = 50;
            const photoHeight = 40;
            const photosPerRow = 3;
            
            doc.setFillColor(25, 118, 210);
            doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('Equipos y Mantenimiento PTG', 105, 20, { align: 'center' });
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            
            const addField = (label, value) => {
                if (value !== null && value !== undefined && value !== '') {
                    const textLines = doc.splitTextToSize(String(value), rightMargin - (leftMargin + 50));
                    const fieldHeight = (textLines.length * 5) + 5;
                    
                    if (yPosition + fieldHeight > pageHeight - 20) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.setFont(undefined, 'bold');
                    doc.text(`${label}:`, leftMargin, yPosition);
                    doc.setFont(undefined, 'normal');
                    
                    doc.text(textLines, leftMargin + 50, yPosition);
                    
                    yPosition += fieldHeight;
                    doc.setDrawColor(200, 200, 200);
                    doc.line(leftMargin, yPosition, rightMargin, yPosition);
                    yPosition += 8;
                }
            };
            
            const addPhotosToPDF = (photos, startY) => {
                let currentY = startY;
                let pageNumber = doc.internal.pages.length;

                photos.forEach((photo, index) => {
                    const row = Math.floor(index / photosPerRow);
                    const col = index % photosPerRow;
                    const xPosition = leftMargin + (col * (photoWidth + 5));
                    const yPos = currentY + (row * (photoHeight + 10));

                    if (yPos + photoHeight > pageHeight - 20) {
                        doc.addPage();
                        currentY = 20;
                        yPosition = 20;
                        doc.setFont(undefined, 'bold');
                        doc.text('Fotografías (continuación):', leftMargin, yPosition);
                        yPosition += 10;
                        const newYPos = currentY + (0 * (photoHeight + 10));
                        doc.addImage(photo, 'JPEG', xPosition, newYPos, photoWidth, photoHeight, `foto_${index + 1}`, 'FAST', { quality: 1.0 });
                    } else {
                        doc.addImage(photo, 'JPEG', xPosition, yPos, photoWidth, photoHeight, `foto_${index + 1}`, 'FAST', { quality: 1.0 });
                    }
                });
                
                const finalY = currentY + (Math.ceil(photos.length / photosPerRow) * (photoHeight + 10));
                return finalY;
            };
            
            const date = new Date(data.dateTime);
            const formattedDate = date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            const formattedDateTime = `${formattedDate}, ${formattedTime}`;

            addField('Operador', data.operatorName);
            addField('Legajo', data.legajo);
            addField('Fecha y Hora', formattedDateTime);
            addField('Tipo de Equipo', data.equipmentType);
            
            if (data.equipmentType === 'Prueba Semanal de RCI') {
                const fieldLabels = {
                    p402SuctionPressure: 'P succión (kg/cm²)', p402DischargePressure: 'P descarga (kg/cm²)', p402Observations: 'Observaciones',
                    p401SuctionPressure: 'P succión (kg/cm²)', p401DischargePressure: 'P descarga (kg/cm²)', p401Observations: 'Observaciones',
                    p401bSuctionPressure: 'P succión (kg/cm²)', p401bDischargePressure: 'P descarga (kg/cm²)', p401bOilPressure: 'P aceite (PSI)', p401bCoolantTemp: 'Tº refrigerante (ºC)', p401bRPM: 'RPM', p401bAmbientTemp: 'T ambiente (ºC)', p401bCurrent1: 'Corriente1 (Amp)', p401bVoltage1: 'Voltaje1 (Volt)', p401bCurrent2: 'Corriente2 (Amp)', p401bVoltage2: 'Voltaje2 (Volt)', p401bGasLevel: 'Nivel de Gas Oil (lts)', p401bCoolantOK: 'Nivel de Refrigerante ok?', p401bOilOK: 'Nivel de Aceite ok?', p401bObservations: 'Observaciones',
                    cumminsDischargePressure: 'P descarga (kg/cm²)', cumminsOilPressure: 'P aceite (kg/cm²)', cumminsCoolantTemp: 'Tº Refrigerante (ºC)', cumminsHorometer: 'Horómetro (hr)', cumminsChargerCurrent: 'Corriente en Cargador Batería (Amp)', cumminsGasLevel: 'Nivel de Gas Oil (lts)', cumminsRPM: 'RPM', cumminsCoolantOK: 'Nivel de Refrigerante ok?', cumminsOilOK: 'Nivel de Aceite ok?', cumminsObservations: 'Observaciones',
                    calfracSuctionPressure: 'P succión (Kg/cm²)', calfracDischargePressure: 'P descarga (Kg/cm²)', calfracCoolantOK: 'Nivel de Refrigerante ok?', calfracOilOK: 'Nivel de Aceite ok?', calfracObservations: 'Observaciones'
                };
            
                if (data.rciData && data.rciData.length > 0) {
                    yPosition += 5;
                    doc.setFont(undefined, 'bold');
                    doc.text('Datos de Prueba Semanal de RCI:', leftMargin, yPosition);
                    yPosition += 10;
            
                    for(const pump of data.rciData) {
                        const pumpDataText = [`  • Equipo: ${pump.name}`];
                        for (const fieldId in pump.data) {
                            if (pump.data[fieldId]) {
                                const label = fieldLabels[fieldId] || fieldId;
                                pumpDataText.push(`  • ${label}: ${pump.data[fieldId]}`);
                            }
                        }
                        
                        const pumpTextHeight = pumpDataText.length * 5 + 5;
                        const photosHeight = pump.photos.length > 0 ? (Math.ceil(pump.photos.length / photosPerRow) * (photoHeight + 10)) : 0;
                        
                        if (yPosition + pumpTextHeight + photosHeight > pageHeight - 20) {
                            doc.addPage();
                            yPosition = 20;
                        }
                        
                        doc.setFont(undefined, 'bold');
                        doc.text(pump.name, leftMargin, yPosition);
                        yPosition += 6;
                        doc.setFont(undefined, 'normal');
                        
                        doc.text(pumpDataText, leftMargin + 5, yPosition);
                        yPosition += (pumpDataText.length - 1) * 5;
                        yPosition += 5;
            
                        if (pump.photos && pump.photos.length > 0) {
                            if (yPosition + photosHeight > pageHeight - 20) {
                                doc.addPage();
                                yPosition = 20;
                            }
                            doc.setFont(undefined, 'bold');
                            doc.text(`Fotografías de ${pump.name}:`, leftMargin, yPosition);
                            yPosition += 10;
                            yPosition = addPhotosToPDF(pump.photos, yPosition);
                        }
            
                        doc.setDrawColor(200, 200, 200);
                        doc.line(leftMargin, yPosition + 2, rightMargin, yPosition + 2);
                        yPosition += 8;
                    }
                }
            } else if (data.equipmentType === 'Tanques') {
                if (yPosition + (data.tanks.length * 25) > pageHeight - 20) {
                    doc.addPage();
                    yPosition = 20;
                }
                data.tanks.forEach(tank => {
                    doc.setFont(undefined, 'bold');
                    doc.text(tank.name, leftMargin, yPosition);
                    yPosition += 6;
                    doc.setFont(undefined, 'normal');
                    doc.text(`  • Nivel: ${tank.level} cm`, leftMargin + 5, yPosition);
                    yPosition += 5;
                    if(tank.pressure) {
                        doc.text(`  • Presión: ${tank.pressure} kg/cm²`, leftMargin + 5, yPosition);
                        yPosition += 5;
                    }
                    if(tank.temperature) {
                        doc.text(`  • Temperatura: ${tank.temperature} °C`, leftMargin + 5, yPosition);
                        yPosition += 5;
                    }
                    doc.setDrawColor(200, 200, 200);
                    doc.line(leftMargin, yPosition + 2, rightMargin, yPosition + 2);
                    yPosition += 8;
                });
            } else if (data.equipmentType === 'Carga de Aceite Motocompresores y Recompresores') {
                if (yPosition + (data.oilData.length * 15) > pageHeight - 20) {
                    doc.addPage();
                    yPosition = 20;
                }
                data.oilData.forEach(oil => {
                    doc.setFont(undefined, 'bold');
                    doc.text(oil.equipment, leftMargin, yPosition);
                    yPosition += 6;
                    doc.setFont(undefined, 'normal');
                    doc.text(`  • Litros Lado Motor: ${oil.motorLitros}`, leftMargin + 5, yPosition);
                    yPosition += 5;
                    doc.text(`  • Litros Lado Compresor: ${oil.compressorLitros}`, leftMargin + 5, yPosition);
                    yPosition += 5;
                    doc.setDrawColor(200, 200, 200);
                    doc.line(leftMargin, yPosition + 2, rightMargin, yPosition + 2);
                    yPosition += 8;
                });
            } else {
                addField('Número de TAG', data.tagNumber);
                addField('Ubicación', data.location);
                addField('Estado del Equipo', data.status);
                addField('Observaciones', data.observations);
                
                if (data.photos && data.photos.length > 0) {
                    if (yPosition + 10 + (Math.ceil(data.photos.length / photosPerRow) * (photoHeight + 10)) > pageHeight - 20) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    doc.setFont(undefined, 'bold');
                    doc.text('Fotografías:', leftMargin, yPosition);
                    yPosition += 10;
                    yPosition = addPhotosToPDF(data.photos, yPosition);
                }
            }
            
            const fileName = `Informe_${data.operatorName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
            const isMobileApp = window.navigator.userAgent.includes('wv') || window.location.protocol === 'file:' || !window.location.hostname;
            
            if (isMobileApp) {
                const pdfBlob = doc.output('blob');
                const blobUrl = URL.createObjectURL(pdfBlob);
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
                    try {
                        navigator.share({ title: 'Informe PTG', text: 'Informe de equipos industriales', files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] }).then(() => console.log('PDF shared')).catch((error) => this.fallbackDownload(blobUrl, fileName, pdfBlob, doc));
                    } catch (error) { this.fallbackDownload(blobUrl, fileName, pdfBlob, doc); }
                } else {
                    this.fallbackDownload(blobUrl, fileName, pdfBlob, doc);
                }
            } else {
                doc.save(fileName);
            }
            this.resetApp();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el informe PDF: ' + error.message + '. Por favor, intente nuevamente.');
            throw error;
        }
    }

    resetApp() {
        document.getElementById('equipmentForm').reset();
        this.clearAllFields();
        document.getElementById('generalFields').style.display = 'block';
        document.getElementById('tankFields').style.display = 'none';
        document.getElementById('oilFields').style.display = 'none';
        document.getElementById('rciFields').style.display = 'none';
        this.setCurrentDateTime();
    }

    fallbackDownload(blobUrl, fileName, pdfBlob, doc) {
        try {
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
            alert('Informe generado. Si no se descarga automáticamente, revise la carpeta de Descargas o el área de notificaciones.');
        } catch (error1) {
            try {
                const newWindow = window.open(blobUrl, '_blank');
                if (newWindow) {
                    setTimeout(() => { alert('PDF generado en nueva ventana. Use el botón "Compartir" o "Descargar" del navegador para guardar el archivo.'); }, 1000);
                } else {
                    throw new Error('Popup blocked');
                }
            } catch (error2) {
                try {
                    const pdfDataUrl = doc.output('dataurlstring');
                    window.location.href = pdfDataUrl;
                    setTimeout(() => { alert('PDF generado. Use el botón "Compartir" o "Descargar" del navegador para guardar el archivo.'); }, 1000);
                } catch (error3) {
                    alert(`No se pudo descargar automáticamente el PDF. 
                    
Instrucciones:
1. Copie este enlace temporal: ${blobUrl}
2. Péguelo en el navegador 
3. Use "Compartir" o "Descargar" para guardar el archivo

El archivo se llama: ${fileName}`);
                }
            }
        }
    }

    checkAppAccess() {
        const isAccessGranted = localStorage.getItem('ptg_app_access') === 'granted';
        if (!isAccessGranted) {
            const accessCode = prompt('Ingrese el código de acceso para usar la aplicación:');
            if (accessCode === 'PTG2024') {
                localStorage.setItem('ptg_app_access', 'granted');
            } else {
                alert('Código de acceso incorrecto. La aplicación se cerrará.');
                document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;"><h2>Acceso Denegado</h2><p>Contacte al administrador del sistema.</p></div>';
                return;
            }
        }
    }

    disableApp() {
        localStorage.removeItem('ptg_app_access');
        document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;"><h2>Aplicación Deshabilitada</h2><p>La aplicación ha sido deshabilitada por el administrador.</p></div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new IndustrialEquipmentApp();
});

window.removePhoto = (equipmentId, index) => {
    if (window.app) {
        window.app.removePhoto(equipmentId, index);
    }
};