class IndustrialEquipmentApp {
    constructor() {
        this.photos = [];
        this.maxPhotos = 3;
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
        // Equipment type change handler
        document.getElementById('equipmentType').addEventListener('change', (e) => {
            this.handleEquipmentTypeChange(e.target.value);
        });

        // Photo handling
        document.getElementById('takePhotoBtn').addEventListener('click', () => {
            this.takePhoto();
        });

        document.getElementById('photoInput').addEventListener('change', (e) => {
            this.handlePhotoSelection(e);
        });

        // Form actions
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetApp();
        });

        // Auto-update date/time every minute
        setInterval(() => {
            this.setCurrentDateTime();
        }, 60000);
    }

    handleEquipmentTypeChange(equipmentType) {
        const generalFields = document.getElementById('generalFields');
        const tankFields = document.getElementById('tankFields');
        const photoSection = document.getElementById('photoSection');

        if (equipmentType === 'Tanques') {
            generalFields.style.display = 'none';
            tankFields.style.display = 'block';
            photoSection.style.display = 'none';
            
            // Clear general fields
            document.getElementById('tagNumber').value = '';
            document.getElementById('location').value = '';
            document.getElementById('equipmentStatus').value = '';
            document.getElementById('observations').value = '';
        } else {
            generalFields.style.display = 'block';
            tankFields.style.display = 'none';
            photoSection.style.display = 'block';
            
            // Clear all tank fields
            for (let i = 1; i <= 7; i++) {
                const levelField = document.getElementById(`tank${i}Level`);
                const pressureField = document.getElementById(`tank${i}Pressure`);
                const temperatureField = document.getElementById(`tank${i}Temperature`);
                
                if (levelField) levelField.value = '';
                if (pressureField) pressureField.value = '';
                if (temperatureField) temperatureField.value = '';
            }
        }
    }

    takePhoto() {
        if (this.photos.length >= this.maxPhotos) {
            alert(`Máximo ${this.maxPhotos} fotografías permitidas.`);
            return;
        }
        document.getElementById('photoInput').click();
    }

    handlePhotoSelection(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.processAndAddPhoto(e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Reset input
        event.target.value = '';
    }

    processAndAddPhoto(dataUrl) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Set canvas size
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 600;
            
            let { width, height } = img;
            
            // Resize if needed
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
            
            // Draw image on canvas (this will correct orientation)
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get corrected image data
            const correctedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            this.addPhoto(correctedDataUrl);
        };

        img.src = dataUrl;
    }

    addPhoto(dataUrl) {
        if (this.photos.length >= this.maxPhotos) return;

        this.photos.push(dataUrl);
        this.updatePhotoPreview();
    }

    removePhoto(index) {
        this.photos.splice(index, 1);
        this.updatePhotoPreview();
    }

    updatePhotoPreview() {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = '';

        this.photos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo}" alt="Foto ${index + 1}">
                <button type="button" class="remove-photo" onclick="app.removePhoto(${index})">×</button>
            `;
            preview.appendChild(photoItem);
        });

        // Update button text
        const btn = document.getElementById('takePhotoBtn');
        btn.textContent = `📷 Tomar Foto (${this.photos.length}/${this.maxPhotos})`;
        btn.disabled = this.photos.length >= this.maxPhotos;
    }

    validateForm() {
        const requiredFields = ['operatorName', 'legajo', 'equipmentType'];
        const equipmentType = document.getElementById('equipmentType').value;

        // Validate basic fields
        for (let field of requiredFields) {
            const value = document.getElementById(field).value.trim();
            if (!value) {
                alert(`El campo ${document.querySelector(`label[for="${field}"]`).textContent} es obligatorio.`);
                return false;
            }
        }

        // Validate specific fields based on equipment type
        if (equipmentType === 'Tanques') {
            // Check if at least one tank has level data
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
        } else {
            // Validate general equipment fields
            const tagNumber = document.getElementById('tagNumber').value.trim();
            const location = document.getElementById('location').value.trim();
            const status = document.getElementById('equipmentStatus').value;

            if (!tagNumber) {
                alert('El número de TAG es obligatorio.');
                return false;
            }

            if (!location) {
                alert('La ubicación es obligatoria.');
                return false;
            }

            if (!status) {
                alert('El estado del equipo es obligatorio.');
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
                'Tanque 1 (Propano Fuera de Especificación)',
                'Tanque 2 (Butano Fuera de Especificación)',
                'Tanque 3 (Butano)',
                'Tanque 4 (Butano)',
                'Tanque 5 (Propano)',
                'Tanque 6 (Propano)',
                'Tanque 7 (Gasolina)'
            ];

            for (let i = 1; i <= 7; i++) {
                const levelField = document.getElementById(`tank${i}Level`);
                const pressureField = document.getElementById(`tank${i}Pressure`);
                const temperatureField = document.getElementById(`tank${i}Temperature`);

                const level = levelField ? levelField.value.trim() : '';
                const pressure = pressureField ? pressureField.value.trim() : '';
                const temperature = temperatureField ? temperatureField.value.trim() : '';

                // Include tank if it has at least level data
                if (level) {
                    const tankData = {
                        name: tankNames[i - 1],
                        level: level,
                        pressure: i === 7 ? 'N/A' : (pressure || ''),
                        temperature: i === 7 ? 'N/A' : (temperature || '')
                    };
                    data.tanks.push(tankData);
                }
            }
            console.log('Tanks data collected:', data.tanks); // Debug line
        } else {
            data.tagNumber = document.getElementById('tagNumber').value;
            data.location = document.getElementById('location').value;
            data.status = document.getElementById('equipmentStatus').value;
            data.observations = document.getElementById('observations').value;
        }

        data.photos = this.photos;
        console.log('Form data collected:', data); // Debug line
        return data;
    }

    generateReport() {
        console.log('Starting report generation...'); // Debug
        
        if (!this.validateForm()) {
            console.log('Form validation failed'); // Debug
            return;
        }

        const data = this.collectFormData();
        console.log('Data collected for PDF:', data); // Debug
        
        const generateBtn = document.getElementById('generateReportBtn');
        
        generateBtn.classList.add('loading');
        generateBtn.textContent = 'Generando...';

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                this.createPDF(data);
            } catch (error) {
                console.error('Error in generateReport:', error);
                alert('Error al generar el informe: ' + error.message);
            } finally {
                generateBtn.classList.remove('loading');
                generateBtn.textContent = '📄 Generar Informe PDF';
            }
        }, 500);
    }

    createPDF(data) {
        try {
            console.log('Creating PDF with data:', data); // Debug
            
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error('jsPDF library not loaded');
            }
            
            const doc = new jsPDF();
            
            // Header
            doc.setFillColor(25, 118, 210);
            doc.rect(0, 0, 210, 30, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('Equipos y Mantenimiento PTG', 105, 20, { align: 'center' });
            
            // Reset color and add content
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            
            let yPosition = 45;
            const lineHeight = 8;
            const leftMargin = 20;
            const rightMargin = 190;

            // Add form data
            const addField = (label, value) => {
                if (value !== null && value !== undefined && value !== '') {
                    doc.setFont(undefined, 'bold');
                    doc.text(`${label}:`, leftMargin, yPosition);
                    doc.setFont(undefined, 'normal');
                    doc.text(String(value), leftMargin + 50, yPosition);
                    
                    // Add line separator
                    doc.setDrawColor(200, 200, 200);
                    doc.line(leftMargin, yPosition + 2, rightMargin, yPosition + 2);
                    yPosition += lineHeight;
                }
            };

            addField('Operador', data.operatorName);
            addField('Legajo', data.legajo);
            addField('Fecha y Hora', new Date(data.dateTime).toLocaleString('es-AR'));
            addField('Tipo de Equipo', data.equipmentType);

            if (data.equipmentType === 'Tanques') {
                console.log('Processing tanks data:', data.tanks); // Debug
                
                if (data.tanks && data.tanks.length > 0) {
                    yPosition += 5;
                    doc.setFont(undefined, 'bold');
                    doc.text('Datos de Tanques:', leftMargin, yPosition);
                    yPosition += 10;

                    data.tanks.forEach((tank, index) => {
                        console.log(`Processing tank ${index}:`, tank); // Debug
                        
                        doc.setFont(undefined, 'bold');
                        doc.text(tank.name, leftMargin, yPosition);
                        yPosition += 6;
                        doc.setFont(undefined, 'normal');

                        if (tank.level && tank.level !== '') {
                            doc.text(`  • Nivel: ${tank.level} cm`, leftMargin + 5, yPosition);
                            yPosition += 5;
                        }
                        if (tank.pressure && tank.pressure !== 'N/A' && tank.pressure !== '') {
                            doc.text(`  • Presión: ${tank.pressure} kg/cm²`, leftMargin + 5, yPosition);
                            yPosition += 5;
                        }
                        if (tank.temperature && tank.temperature !== 'N/A' && tank.temperature !== '') {
                            doc.text(`  • Temperatura: ${tank.temperature} °C`, leftMargin + 5, yPosition);
                            yPosition += 5;
                        }

                        // Add separator line
                        doc.setDrawColor(200, 200, 200);
                        doc.line(leftMargin, yPosition + 2, rightMargin, yPosition + 2);
                        yPosition += 8;
                    });
                } else {
                    console.log('No tanks data found'); // Debug
                    doc.text('No se encontraron datos de tanques', leftMargin, yPosition);
                    yPosition += 10;
                }
            } else {
                addField('Número de TAG', data.tagNumber);
                addField('Ubicación', data.location);
                addField('Estado', data.status);
                if (data.observations && data.observations.trim()) {
                    doc.setFont(undefined, 'bold');
                    doc.text('Observaciones:', leftMargin, yPosition);
                    doc.setFont(undefined, 'normal');
                    
                    const splitObservations = doc.splitTextToSize(data.observations, rightMargin - leftMargin - 50);
                    doc.text(splitObservations, leftMargin + 50, yPosition);
                    yPosition += (splitObservations.length * 5) + 5;
                    
                    doc.setDrawColor(200, 200, 200);
                    doc.line(leftMargin, yPosition + 2, rightMargin, yPosition + 2);
                    yPosition += lineHeight;
                }

                // Add photos if not tanks and photos exist
                if (data.photos && data.photos.length > 0) {
                    yPosition += 10;
                    doc.setFont(undefined, 'bold');
                    doc.text('Fotografías:', leftMargin, yPosition);
                    yPosition += 10;

                    const photoWidth = 50;
                    const photoHeight = 40;
                    const photosPerRow = 3;

                    data.photos.forEach((photo, index) => {
                        const row = Math.floor(index / photosPerRow);
                        const col = index % photosPerRow;
                        const xPosition = leftMargin + (col * (photoWidth + 5));
                        const yPos = yPosition + (row * (photoHeight + 10));

                        // Check if we need a new page
                        if (yPos + photoHeight > 280) {
                            doc.addPage();
                            yPosition = 20;
                            doc.setFont(undefined, 'bold');
                            doc.text('Fotografías (continuación):', leftMargin, yPosition);
                            yPosition += 10;
                            
                            const newRow = 0;
                            const newCol = index % photosPerRow;
                            const newXPosition = leftMargin + (newCol * (photoWidth + 5));
                            const newYPos = yPosition + (newRow * (photoHeight + 10));
                            
                            try {
                                doc.addImage(photo, 'JPEG', newXPosition, newYPos, photoWidth, photoHeight, `foto_${index + 1}`, 'FAST');
                            } catch (e) {
                                console.warn('Error adding image:', e);
                            }
                        } else {
                            try {
                                doc.addImage(photo, 'JPEG', xPosition, yPos, photoWidth, photoHeight, `foto_${index + 1}`, 'FAST');
                            } catch (e) {
                                console.warn('Error adding image:', e);
                                // Try without alias
                                try {
                                    doc.addImage(photo, 'JPEG', xPosition, yPos, photoWidth, photoHeight);
                                } catch (e2) {
                                    console.warn('Error adding image without alias:', e2);
                                }
                            }
                        }
                    });
                }
            }

            // Save the PDF - Different approach for mobile apps
            const fileName = `Informe_${data.operatorName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
            
            // Check if we're in a mobile app environment
            const isMobileApp = window.navigator.userAgent.includes('wv') || 
                               window.location.protocol === 'file:' || 
                               !window.location.hostname;

            if (isMobileApp) {
                // For mobile apps, create a blob URL and try multiple methods
                const pdfBlob = doc.output('blob');
                const blobUrl = URL.createObjectURL(pdfBlob);
                
                // Try to use Web Share API if available (modern mobile browsers)
                if (navigator.share && navigator.canShare && navigator.canShare({files: [new File([pdfBlob], fileName, {type: 'application/pdf'})]})) {
                    try {
                        const fileToShare = new File([pdfBlob], fileName, {type: 'application/pdf'});
                        navigator.share({
                            title: 'Informe PTG',
                            text: 'Informe de equipos industriales',
                            files: [fileToShare]
                        }).then(() => {
                            console.log('PDF shared successfully');
                        }).catch((error) => {
                            console.log('Error sharing PDF:', error);
                            this.fallbackDownload(blobUrl, fileName, pdfBlob, doc);
                        });
                    } catch (error) {
                        console.log('Web Share API failed:', error);
                        this.fallbackDownload(blobUrl, fileName, pdfBlob, doc);
                    }
                } else {
                    // Fallback methods for mobile
                    this.fallbackDownload(blobUrl, fileName, pdfBlob, doc);
                }
            } else {
                // For web browsers, use normal download
                doc.save(fileName);
            }

            alert('Informe generado correctamente');
            this.resetApp();

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el informe PDF: ' + error.message + '. Por favor, intente nuevamente.');
            throw error; // Re-throw to be caught by generateReport
        }
    }

    resetApp() {
        // Reset form
        document.getElementById('equipmentForm').reset();
        
        // Reset photos
        this.photos = [];
        this.updatePhotoPreview();
        
        // Reset tank fields specifically
        for (let i = 1; i <= 7; i++) {
            const levelField = document.getElementById(`tank${i}Level`);
            const pressureField = document.getElementById(`tank${i}Pressure`);
            const temperatureField = document.getElementById(`tank${i}Temperature`);
            
            if (levelField) levelField.value = '';
            if (pressureField) pressureField.value = '';
            if (temperatureField) temperatureField.value = '';
        }
        
        // Reset fields visibility
        document.getElementById('generalFields').style.display = 'block';
        document.getElementById('tankFields').style.display = 'none';
        document.getElementById('photoSection').style.display = 'block';
        
        // Reset date/time
        this.setCurrentDateTime();
        
        alert('Aplicación reiniciada correctamente');
    }

    fallbackDownload(blobUrl, fileName, pdfBlob, doc) {
        // Multiple fallback methods for mobile apps
        try {
            // Method 1: Try direct download link
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up blob URL after some time
            setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
            
            // Show success message with instructions
            alert('Informe generado. Si no se descarga automáticamente, revise la carpeta de Descargas o el área de notificaciones.');
            
        } catch (error1) {
            console.log('Download link method failed:', error1);
            
            try {
                // Method 2: Try to open in new window
                const newWindow = window.open(blobUrl, '_blank');
                if (newWindow) {
                    // Give user instructions
                    setTimeout(() => {
                        alert('PDF generado en nueva ventana. Use el botón "Compartir" o "Descargar" del navegador para guardar el archivo.');
                    }, 1000);
                } else {
                    throw new Error('Popup blocked');
                }
            } catch (error2) {
                console.log('New window method failed:', error2);
                
                try {
                    // Method 3: Create a data URL and try to navigate to it
                    const pdfDataUrl = doc.output('dataurlstring');
                    window.location.href = pdfDataUrl;
                    
                    // Show instructions
                    setTimeout(() => {
                        alert('PDF generado. Use el botón "Compartir" o "Descargar" del navegador para guardar el archivo.');
                    }, 1000);
                    
                } catch (error3) {
                    console.log('Data URL method failed:', error3);
                    
                    // Method 4: Last resort - show instructions for manual save
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

    // App access control
    checkAppAccess() {
        // Simple access control - can be enhanced with GitHub integration
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

    // Method to disable app remotely (for GitHub integration)
    disableApp() {
        localStorage.removeItem('ptg_app_access');
        document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;"><h2>Aplicación Deshabilitada</h2><p>La aplicación ha sido deshabilitada por el administrador.</p></div>';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IndustrialEquipmentApp();
});

// Global function for photo removal (needed for onclick handler)
window.removePhoto = (index) => {
    if (window.app) {
        window.app.removePhoto(index);
    }
};