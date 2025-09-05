// Inicializar jsPDF
const { jsPDF } = window.jspdf;
let app = {
    photos: {
        general: [],
        turbo: [],
        propane: [],
        controlRoom: [],
        rci: []
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
        document.getElementById('compressorFields').style.display = 'none';
        document.getElementById('recompressorFields').style.display = 'none';
        document.getElementById('turboExpanderDataFields').style.display = 'none';
        
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
        } else if (selectedType === 'Planillas Datos Motocompresores') {
            document.getElementById('compressorFields').style.display = 'block';
        } else if (selectedType === 'Planillas Datos Recompresores') {
            document.getElementById('recompressorFields').style.display = 'block';
        } else if (selectedType === 'Planillas Datos TurboExpander') {
            document.getElementById('turboExpanderDataFields').style.display = 'block';
        } else if (selectedType) {
            document.getElementById('generalFields').style.display = 'block';
        }
    },
    
    setupPhotoInputs: function() {
        const photoInputs = {
            general: document.getElementById('generalPhotoInput'),
            turbo: document.getElementById('turboPhotoInput'),
            propane: document.getElementById('propanePhotoInput'),
            controlRoom: document.getElementById('controlRoomPhotoInput'),
            rci: document.getElementById('rciPhotoInput')
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
        const files = event.target.files;
        if (!files) return;

        const maxPhotos = type === 'rci' ? 6 : 3;
        if (this.photos[type].length + files.length > maxPhotos) {
            alert(`Solo se permiten un máximo de ${maxPhotos} fotografías para este tipo de equipo.`);
            return;
        }

        for (const file of files) {
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
        }
        
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
        } else if (selectedType !== 'Tanques' && selectedType !== 'Carga de Aceite Motocompresores y Recompresores' && selectedType !== 'Prueba Semanal de RCI' && selectedType !== 'Planillas Datos Motocompresores' && selectedType !== 'Planillas Datos Recompresores' && selectedType !== 'Planillas Datos TurboExpander') {
            tagNumber = document.getElementById('tagNumber').value || 'Sin TAG';
        } else {
            tagNumber = 'Informe ' + selectedType;
        }
        
        // Configurar nombre del archivo con el número de TAG
        const fileName = `${tagNumber.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Agregar contenido al PDF
        this.addHeaderToPDF(pdf, selectedType, tagNumber);
        this.addContentToPDF(pdf, selectedType);
        
        // Guardar el PDF y luego reiniciar
        pdf.save(fileName);
        setTimeout(() => {
            window.location.reload();
        }, 1000); // 1 segundo de retraso para que el archivo se descargue
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
        } else if (equipmentType === 'Planillas Datos Motocompresores') {
            this.addCompressorContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Planillas Datos Recompresores') {
            this.addRecompressorContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Planillas Datos TurboExpander') {
            this.addTurboExpanderDataToPDF(pdf, yPosition);
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
            let motorCm = document.getElementById(`${eq.id}MotorCm`);
            let compressorCm = document.getElementById(`${eq.id}CompressorCm`);
            let rc9OilLevel = document.getElementById('rc9OilLevelCm');

            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(eq.name, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');

            if (eq.id === 'rc9') {
                if (rc9OilLevel && rc9OilLevel.value) {
                    pdf.text(`Nivel de Aceite: ${rc9OilLevel.value} cm`, 20, yPosition);
                    yPosition += 7;
                } else {
                    pdf.text(`Nivel de Aceite: N/A`, 20, yPosition);
                    yPosition += 7;
                }
            } else {
                if (motorCm && motorCm.value) {
                    pdf.text(`Nivel Lado Motor: ${motorCm.value} cm`, 20, yPosition);
                    yPosition += 7;
                } else {
                    pdf.text(`Nivel Lado Motor: N/A`, 20, yPosition);
                    yPosition += 7;
                }

                if (compressorCm && compressorCm.value) {
                    pdf.text(`Nivel Lado Compresor: ${compressorCm.value} cm`, 20, yPosition);
                    yPosition += 7;
                } else {
                    pdf.text(`Nivel Lado Compresor: N/A`, 20, yPosition);
                    yPosition += 7;
                }
            }
            
            yPosition += 5;
            
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
                    { id: 'electro120SuctionPressure', label: 'P succión' },
                    { id: 'electro120DischargePressure', label: 'P descarga' },
                    { id: 'electro120Observations', label: 'Observaciones', isTextarea: true }
                ]
            },
            {
                title: 'P-401 ELECTROBOMBA 500 m3',
                inputs: [
                    { id: 'electro500SuctionPressure', label: 'P succión' },
                    { id: 'electro500DischargePressure', label: 'P descarga' },
                    { id: 'electro500Observations', label: 'Observaciones', isTextarea: true }
                ]
            },
            {
                title: 'P-401 B MOTOBOMBA VOLVO',
                inputs: [
                    { id: 'volvoSuctionPressure', label: 'P succión' },
                    { id: 'volvoDischargePressure', label: 'P descarga' },
                    { id: 'volvoOilPressure', label: 'P aceite', unit: 'PSI' },
                    { id: 'volvoCoolantTemp', label: 'Tº refrigerante', unit: 'ºC' },
                    { id: 'volvoRPM', label: 'RPM' },
                    { id: 'volvoAmbientTemp', label: 'T ambiente', unit: 'ºC' },
                    { id: 'volvoCurrent1', label: 'Corriente1', unit: 'Amp' },
                    { id: 'volvoVoltage1', label: 'Voltaje1', unit: 'Volt' },
                    { id: 'volvoCurrent2', label: 'Corriente2', unit: 'Amp' },
                    { id: 'volvoVoltage2', label: 'Voltaje2', unit: 'Volt' },
                    { id: 'volvoGasLevel', label: 'Nivel de Gas Oil', unit: 'lts' },
                    { id: 'volvoCoolantOK', label: 'Nivel de Refrigerante ok?' },
                    { id: 'volvoOilOK', label: 'Nivel de Aceite ok?' },
                    { id: 'volvoObservations', label: 'Observaciones', isTextarea: true }
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

        // Agregar fotos si existen
        if (this.photos.rci.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.rci, yPosition + 10);
        }
    },
    
    addCompressorContentToPDF: function(pdf, yPosition) {
        const mcNumbers = ['1', '2', '3', '5', '6'];
        const fields = [
            { id: 'pi5107SuctionPressure', label: 'PI5107 Presión de succión DCS' },
            { id: 'fi5107Flow', label: 'FI5107 Caudal gas en baja presión' },
            { id: 'suctionPressure', label: 'Presión de Succión' },
            { id: 'dischargePressure1', label: 'Presión descarga 1° etapa' },
            { id: 'dischargePressure2', label: 'Presión descarga 2° etapa' },
            { id: 'dischargePressure3', label: 'Presión descarga 3° etapa' },
            { id: 'motorOilPressure', label: 'Presión Aceite Motor' },
            { id: 'compressorOilPressure', label: 'Presión aceite Compresor' },
            { id: 'mainSystemRefrigerantPressure', label: 'Presión refrigerante Sist. Principal' },
            { id: 'auxSystemRefrigerantPressure', label: 'Presión refrigerante Sist. Aux' },
            { id: 'airManifoldPressureLeft', label: 'Presión manifold de aire Bco.Izq' },
            { id: 'carterPressure', label: 'Presión Carter' },
            { id: 'airManifoldPressureRight', label: 'Presión manifold de aire Bco. Der' },
            { id: 'motorVibrationCoupling', label: 'Vibración Motor Lado Acople' },
            { id: 'motorVibrationFree', label: 'Vibración Motor Lado Libre' },
            { id: 'compressorVibrationCoupling', label: 'Vibración Compresor Lado Acople' },
            { id: 'compressorVibrationFree', label: 'Vibración Compresor Lado Libre' },
            { id: 'coolerVibration', label: 'Vibración Cooler' },
            { id: 'mainSystemRefrigerantTemp', label: 'Temperatura Refrigerante Sist.Principal' },
            { id: 'auxSystemRefrigerantTemp', label: 'Temperatura Refrigerante Sist.Auxiliar' },
            { id: 'compressorOilTemp', label: 'Temperatura Aceite Compresor' },
            { id: 'motorOilTemp', label: 'Temperatura Aceite Motor' },
            { id: 'dischargeTempThrow1', label: 'Temperatura desc. Compresor Throw #1' },
            { id: 'dischargeTempThrow2', label: 'Temperatura desc. Compresor Throw #2' },
            { id: 'dischargeTempThrow3', label: 'Temperatura desc. Compresor Throw #3' },
            { id: 'dischargeTempThrow4', label: 'Temperatura desc. Compresor Throw #4' },
            { id: 'bearingTemp1', label: 'Temperatura Cojinete Bancada Motor #1' },
            { id: 'bearingTemp2', label: 'Temperatura Cojinete Bancada Motor #2' },
            { id: 'bearingTemp3', label: 'Temperatura Cojinete Bancada Motor #3' },
            { id: 'bearingTemp4', label: 'Temperatura Cojinete Bancada Motor #4' },
            { id: 'bearingTemp5', label: 'Temperatura Cojinete Bancada Motor #5' },
            { id: 'bearingTemp6', label: 'Temperatura Cojinete Bancada Motor #6' },
            { id: 'bearingTemp7', label: 'Temperatura Cojinete Bancada Motor #7' },
            { id: 'turboInletTempLeft', label: 'Temperatura entrada Turbo Bco. Izq.' },
            { id: 'turboInletTempRight', label: 'Temperatura entrada Turbo Bco. Der.' },
            { id: 'suctionTemp', label: 'Temperatura Succión' },
            { id: 'ambientTemp', label: 'Temperatura Ambiente' },
            { id: 'exhaustTempCylinder1', label: 'Temperatura Escape cilindro #1' },
            { id: 'exhaustTempCylinder2', label: 'Temperatura Escape cilindro #2' },
            { id: 'exhaustTempCylinder3', label: 'Temperatura Escape cilindro #3' },
            { id: 'exhaustTempCylinder4', label: 'Temperatura Escape cilindro #4' },
            { id: 'exhaustTempCylinder5', label: 'Temperatura Escape cilindro #5' },
            { id: 'exhaustTempCylinder6', label: 'Temperatura Escape cilindro #6' },
            { id: 'exhaustTempCylinder7', label: 'Temperatura Escape cilindro #7' },
            { id: 'exhaustTempCylinder8', label: 'Temperatura Escape cilindro #8' },
            { id: 'exhaustTempCylinder9', label: 'Temperatura Escape cilindro #9' },
            { id: 'exhaustTempCylinder10', label: 'Temperatura Escape cilindro #10' },
            { id: 'exhaustTempCylinder11', label: 'Temperatura Escape cilindro #11' },
            { id: 'exhaustTempCylinder12', label: 'Temperatura Escape cilindro #12' },
            { id: 'compressorFilterPressure', label: 'Presión diferencial Filtros compresor (PSI)' },
            { id: 'motorFilterPressure', label: 'Presión diferencial Filtros motor (PSI)' },
            { id: 'loadPercentage', label: 'Porcentaje de carga (max 85%) ESM' },
            { id: 'motorOilLevel', label: 'Nivel de aceite motor' },
            { id: 'compressorOilLevel', label: 'Nivel aceite compresor' },
            { id: 'mainRefrigerantLevel', label: 'Nivel refrigerante Principal' },
            { id: 'auxRefrigerantLevel', label: 'Nivel refrigerante Auxiliar' }
        ];

        for (const mcNumber of mcNumbers) {
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.text(`MC#${mcNumber}`, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            
            let hasData = false;
            for (const field of fields) {
                const value = document.getElementById(`mc${mcNumber}-${field.id}`).value;
                if (value) {
                    pdf.text(`${field.label}: ${value}`, 20, yPosition);
                    yPosition += 7;
                    hasData = true;
                }
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
            }
            if (!hasData) {
                pdf.text("No se ingresaron datos para este equipo.", 20, yPosition);
                yPosition += 7;
            }
            yPosition += 5;
        }
    },

    addRecompressorContentToPDF: function(pdf, yPosition) {
        const rcNormal = ['4', '7', '8'];
        const rc9 = ['9'];

        const commonFields = [
            { id: 'suctionFlow', label: 'Caudal de Succión' },
            { id: 'ambientTemp', label: 'T. Ambiente' },
            { id: 'motorRPM', label: 'R.P.M. Motor' },
            { id: 'motorOilFilterPressure', label: 'Pres de Dif Filtros Aceite Motor' },
            { id: 'motorOilPressurePanel', label: 'Pres de Aceite Motor Tablero' },
            { id: 'compressorOilPressurePanel', label: 'Pres de Aceite Compresor Tablero' },
            { id: 'compressorOilPressureInlet', label: 'Pres de Aceite Compresor Entrada' },
            { id: 'compressorOilPressureOutlet', label: 'Pres de Aceite Compresor Salida' },
            { id: 'compressorDischargePressure1', label: 'Pres Desc Comp Cilindro 1' },
            { id: 'compressorDischargePressure2', label: 'Pres Desc Comp Cilindro 2' },
            { id: 'dischargeTempLeft', label: 'Temp Descarga Cilindro Izquierdo' },
            { id: 'dischargeTempRight', label: 'Temp Descarga Cilindro Derecho' },
            { id: 'compressorSuctionPressure', label: 'Pres Succión Compresor' },
            { id: 'motorIntakeTempLeft', label: 'Temp Admision Motor Banco Izq.' },
            { id: 'motorIntakeTempRight', label: 'Temp Admision Motor Banco Der.' },
            { id: 'motorOilTemp', label: 'Temperatura Aceite Motor' },
            { id: 'compressorOilTemp', label: 'Temperatura Aceite Compresor' },
            { id: 'mainWaterTemp', label: 'Temperatura Agua Principal' },
            { id: 'intakeManifoldPressureLeft', label: 'Presión Multiple Admisión Izquierdo' },
            { id: 'intakeManifoldPressureRight', label: 'Presión Multiple Admisión Derecho' },
            { id: 'airFilterRight', label: 'Filtros de aire Derecho' },
            { id: 'airFilterLeft', label: 'Filtros de aire Izquierdo' }
        ];

        const rc9Fields = [
            { id: 'suctionFlow', label: 'Caudal de Succión' },
            { id: 'ambientTemp', label: 'T. Ambiente' },
            { id: 'motorOilFilterPressure', label: 'Pres de Dif Filtros Aceite Motor' },
            { id: 'compressorOilPressureInlet', label: 'Pres de Aceite Compresor Entrada' },
            { id: 'compressorOilPressureOutlet', label: 'Pres de Aceite Compresor Salida' },
            { id: 'compressorSuctionPressure1st', label: 'Pres Succión Compresor 1 st' },
            { id: 'compressorDischargePressure1st', label: 'Pres Descarga Compresor 1st' },
            { id: 'compressorOilPressure', label: 'Pres de Aceite Compresor' },
            { id: 'compressorSuctionTemp', label: 'Temp Succión Compresor' },
            { id: 'dischargeTempCylinder1', label: 'Temp Descarga Cilindro 1' },
            { id: 'dischargeTempCylinder2', label: 'Temp Descarga Cilindro 2' },
            { id: 'compressorOilTemp', label: 'Temperatura Aceite Compresor' },
            { id: 'motorRPM', label: 'R.P.M. Motor' },
            { id: 'motorOilPressure', label: 'Pres de Aceite Motor' },
            { id: 'mainWaterTemp', label: 'Temperatura Agua Principal' },
            { id: 'motorOilTemp', label: 'Temperatura Aceite Motor' },
            { id: 'airFilterRight', label: 'Filtros de aire Derecho' },
            { id: 'airFilterLeft', label: 'Filtros de aire Izquierdo' }
        ];

        for (const rcNumber of rcNormal) {
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.text(`RC#${rcNumber}`, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            let hasData = false;
            for (const field of commonFields) {
                const value = document.getElementById(`rc${rcNumber}-${field.id}`).value;
                if (value) {
                    pdf.text(`${field.label}: ${value}`, 20, yPosition);
                    yPosition += 7;
                    hasData = true;
                }
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
            }
            if (!hasData) {
                pdf.text("No se ingresaron datos para este equipo.", 20, yPosition);
                yPosition += 7;
            }
            yPosition += 5;
        }

        // Handle RC#9
        for (const rcNumber of rc9) {
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.text(`RC#${rcNumber}`, 15, yPosition);
            yPosition += 7;

            pdf.setFont(undefined, 'normal');
            let hasData = false;
            for (const field of rc9Fields) {
                const value = document.getElementById(`rc${rcNumber}-${field.id}`).value;
                if (value) {
                    pdf.text(`${field.label}: ${value}`, 20, yPosition);
                    yPosition += 7;
                    hasData = true;
                }
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
            }
            if (!hasData) {
                pdf.text("No se ingresaron datos para este equipo.", 20, yPosition);
                yPosition += 7;
            }
            yPosition += 5;
        }
    },
    
    addTurboExpanderDataToPDF: function(pdf, yPosition) {
        const fields = [
            { id: 'expInP', label: 'Presión Entrada Expansor (Exp. In P) (PIC 301B)' },
            { id: 'expInT', label: 'Temperatura Entrada Expansor (Exp. In T)(TI0314)' },
            { id: 'expOutP', label: 'Presión Salida Expansor (Exp. Out P) (PIC 306)' },
            { id: 'expOutT', label: 'Temperatura Salida Expansor (Exp. Out T)(TI0326)' },
            { id: 'expWheelP', label: 'Presión Rueda Expansor (Exp. Wheel P) PI-4' },
            { id: 'compInP', label: 'Presión Entrada Compresor (Comp. In P) PI-309 (PIC0302)' },
            { id: 'compInT', label: 'Temperatura Entrada Compresor (Comp. In T) TI0301' },
            { id: 'compOutP', label: 'Presión Salida Compresor (Comp. Out P) PI-307' },
            { id: 'compOutT', label: 'Temperatura Salida Compresor (Comp Out T)' },
            { id: 'compWheelP', label: 'Presión Rueda Compresor (Comp. Wheel P) PI-8' },
            { id: 'driveBearingThrust', label: 'Presión Empuje Expansor (Drive Bearing Thrust PI-6)' },
            { id: 'loadBearingThrust', label: 'Presión Empuje Compresor (Load Bearing Thurst PI-7)' },
            { id: 'reservoirP', label: 'Presión Reservorio (Reservoir P) PI-2' },
            { id: 'reservoirT', label: 'Temperatura Reservorio (Reservoir T)' },
            { id: 'lubeOilP', label: 'Presión Aceite Lubricante (Lube Oil P) PI-3' },
            { id: 'lubeOilDP', label: 'Diferencia de Presión Aceite Lubricante (Lube Oil DP)' },
            { id: 'sealGasP', label: 'Presión Gas de Sello (Seal Gas P) PI-5' },
            { id: 'sealGasDP', label: 'Diferencia de Presión Gas de Sello (Seal Gas DP)' },
            { id: 'rpm', label: 'RPM' },
            { id: 'expBrgT', label: 'Temperatura Cojinetes Expansor (Exp. Brg. T)' },
            { id: 'compBrgT', label: 'Temperatura Cojinetes Compresor (Comp. Brg. T)' },
            { id: 'expVibX', label: 'Vibración X Expansor (Exp. Vib. X)' },
            { id: 'compVibX', label: 'Vibración X Compresor (Comp. Vib. X)' },
            { id: 'lubeOilInT', label: 'Temperatura Entrada Aceite Lubricante (Lube Oil In T)' },
            { id: 'oilDrainT', label: 'Temperatura Aceite Drenaje (Oil Drain T)' },
            { id: 'sealGasInT', label: 'Temperatura Entrada Gas de Sello (Seal Gas In T)' },
            { id: 'pic0301B', label: '% Aletas Guías (PIC0301B)' },
            { id: 'pic0301A', label: 'JT % (PIC0301A)' },
            { id: 'recycleFIC0301', label: 'Reciclo FIC0301 (Recycle %)' },
            { id: 'fIC0301Opening', label: 'Porcentaje apertura FIC0301' },
            { id: 'flowPercentage', label: 'Valor de caudal (porcentaje)' },
            { id: 'expFlowFIC0101', label: 'Flujo Expansor (FIC0101)' },
            { id: 'compFlow', label: 'Flujo Compresor (FI0102+FIC0201)' },
            { id: 'ambientTempTI0100', label: 'T° Ambiente (TI0100) (°F)' },
            { id: 'sealGasSupplyP', label: 'Presión Suministro Gas de Sello' },
            { id: 'sealGasSupplyT', label: 'T° Suministro Gas de Sello' },
            { id: 'sealGasFlowFI1', label: 'Caudal Gas de Sello FI-1' },
            { id: 'reservoirOilLevel', label: 'NIVEL ACEITE RESERVORIO' },
            { id: 'flowMMSCFD', label: 'CAUDAL (MMSCFD)' }
        ];

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        
        if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
        }
        pdf.text('TurboExpander', 15, yPosition);
        yPosition += 7;
        
        pdf.setFont(undefined, 'normal');
        
        let hasData = false;
        for (const field of fields) {
            const value = document.getElementById(field.id).value;
            if (value) {
                pdf.text(`${field.label}: ${value}`, 20, yPosition);
                yPosition += 7;
                hasData = true;
            }
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
        }
        if (!hasData) {
            pdf.text("No se ingresaron datos para este equipo.", 20, yPosition);
            yPosition += 7;
        }
        yPosition += 5;
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