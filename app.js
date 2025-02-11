// Gestione dei dati nel localStorage
function getClients() {
    const clients = localStorage.getItem('clients');
    return clients ? JSON.parse(clients) : [];
}

function saveClients(clients) {
    localStorage.setItem('clients', JSON.stringify(clients));
}

function generateId() {
    return Date.now().toString();
}

// Gestione della UI
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    alertContainer.innerHTML = alert;
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': 'bi-file-pdf',
        'doc': 'bi-file-word',
        'docx': 'bi-file-word',
        'xls': 'bi-file-excel',
        'xlsx': 'bi-file-excel',
        'txt': 'bi-file-text',
        'jpg': 'bi-file-image',
        'jpeg': 'bi-file-image',
        'png': 'bi-file-image',
        'gif': 'bi-file-image'
    };
    return icons[ext] || 'bi-file';
}

function isImageFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
}

function showClientList() {
    const clients = getClients();
    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-4">
                <h2>Clienti</h2>
                <input type="text" id="searchInput" class="form-control" 
                       placeholder="Cerca per nome, telefono o matricola...">
            </div>
            <div class="col-md-6 mb-4 text-end">
                <button onclick="exportToExcel()" class="btn btn-success">
                    <i class="bi bi-file-excel"></i> Esporta in Excel
                </button>
            </div>
        </div>
        <div id="clientsList" class="row">
            ${clients.map(client => getClientCard(client)).join('')}
        </div>
        <div class="text-center mt-4">
            <button onclick="showClientForm()" class="btn btn-primary">Aggiungi Nuovo Cliente</button>
        </div>
    `;

    // Add search functionality with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch(e);
            }
        });
    }
}

function getClientCard(client) {
    return `
        <div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${client.nome} ${client.cognome}</h5>
                    <p class="card-text">
                        <strong>Telefono:</strong> 
                        <a href="tel:${client.telefono}" class="text-decoration-none">
                            <i class="bi bi-telephone"></i> ${client.telefono}
                        </a>
                        <br>
                        <strong>Marca/Modello:</strong> ${client.marca} ${client.modello}<br>
                        <strong>Matricola:</strong> ${client.matricola}
                        ${client.files && client.files.length > 0 ? `
                            <br><strong>Files:</strong>
                            ${client.files.map(file => `<a href="${window.location.origin}/files/${client.id}/${file.name}" target="_blank">${file.name}</a>`).join(', ')}
                        ` : ''}
                    </p>
                    <div class="btn-group">
                        <button onclick="showClientDetail('${client.id}')" class="btn btn-primary">Dettagli</button>
                        <button onclick="showClientForm('${client.id}')" class="btn btn-secondary">Modifica</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const clients = getClients();
    const filtered = clients.filter(client => 
        client.nome?.toLowerCase().includes(query) ||
        client.cognome?.toLowerCase().includes(query) ||
        client.telefono?.toLowerCase().includes(query) ||
        client.matricola?.toLowerCase().includes(query) ||
        client.marca?.toLowerCase().includes(query) ||
        client.modello?.toLowerCase().includes(query) ||
        client.citta?.toLowerCase().includes(query) ||
        client.cap?.toLowerCase().includes(query)
    );

    const clientsList = document.getElementById('clientsList');
    if (clientsList) {
        clientsList.innerHTML = filtered.map(client => getClientCard(client)).join('');
    }
}

function showClientDetail(clientId) {
    const client = getClients().find(c => c.id === clientId);
    if (!client) return;

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-body">
                        <h2 class="card-title">${client.nome} ${client.cognome}</h2>
                        <div class="mt-4">
                            <p>
                                <strong>Telefono:</strong> 
                                <a href="tel:${client.telefono}" class="text-decoration-none">
                                    <i class="bi bi-telephone"></i> ${client.telefono}
                                </a>
                            </p>
                            <p>
                                <strong>Indirizzo:</strong>
                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.indirizzo} ${client.citta} ${client.cap}`)}" 
                                   target="_blank" class="text-decoration-none">
                                    <i class="bi bi-geo-alt"></i> 
                                    ${client.indirizzo}, ${client.citta} (${client.cap})
                                </a>
                            </p>
                            <p><strong>Marca:</strong> ${client.marca}</p>
                            <p><strong>Modello:</strong> ${client.modello}</p>
                            <p><strong>Matricola:</strong> ${client.matricola}</p>
                            <p><strong>Data Installazione:</strong> ${client.dataInstallazione}</p>

                            ${client.custom_fields ? `
                                <h4 class="mt-4">Campi Personalizzati</h4>
                                ${Object.entries(client.custom_fields).map(([key, value]) => `
                                    <p><strong>${key}:</strong> ${value}</p>
                                `).join('')}
                            ` : ''}

                            ${client.files && client.files.length > 0 ? `
                                <h4 class="mt-4">Files</h4>
                                <div class="files-container">
                                    ${client.files.map((file) => `
                                        <div class="file-item">
                                            <div class="file-icon" onclick="showFileModal('${client.id}', '${file.name}')">
                                                <i class="${getFileIcon(file.name)} fs-1"></i>
                                                <div class="file-name">${file.name}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}


                        </div>

                        <div class="mt-4">
                            <button onclick="showClientForm('${client.id}')" class="btn btn-primary">Modifica</button>
                            <button onclick="deleteClient('${client.id}')" class="btn btn-danger">Elimina Cliente</button>
                            <button onclick="showClientList()" class="btn btn-secondary">Torna alla Lista</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showClientForm(clientId = null) {
    const client = clientId ? getClients().find(c => c.id === clientId) : null;
    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <h2 class="mb-4">${client ? 'Modifica' : 'Nuovo'} Cliente</h2>
                <form id="clientForm" onsubmit="handleClientSubmit(event, '${clientId || ''}')">
                    <div class="mb-3">
                        <label for="nome" class="form-label">Nome</label>
                        <input type="text" class="form-control" id="nome" name="nome" required
                               value="${client?.nome || ''}">
                    </div>

                    <div class="mb-3">
                        <label for="cognome" class="form-label">Cognome</label>
                        <input type="text" class="form-control" id="cognome" name="cognome" required
                               value="${client?.cognome || ''}">
                    </div>

                    <div class="mb-3">
                        <label for="indirizzo" class="form-label">Indirizzo</label>
                        <input type="text" class="form-control" id="indirizzo" name="indirizzo" required
                               value="${client?.indirizzo || ''}">
                    </div>

                    <div class="row">
                        <div class="col-md-8 mb-3">
                            <label for="citta" class="form-label">Città</label>
                            <input type="text" class="form-control" id="citta" name="citta" required
                                   value="${client?.citta || ''}">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label for="cap" class="form-label">CAP</label>
                            <input type="text" class="form-control" id="cap" name="cap" required
                                   value="${client?.cap || ''}">
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="telefono" class="form-label">Numero di Telefono</label>
                        <input type="tel" class="form-control" id="telefono" name="telefono" required
                               value="${client?.telefono || ''}">
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="marca" class="form-label">Marca</label>
                            <input type="text" class="form-control" id="marca" name="marca" required
                                   value="${client?.marca || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="modello" class="form-label">Modello</label>
                            <input type="text" class="form-control" id="modello" name="modello" required
                                   value="${client?.modello || ''}">
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="matricola" class="form-label">Matricola</label>
                        <input type="text" class="form-control" id="matricola" name="matricola" required
                               value="${client?.matricola || ''}">
                    </div>

                    <div class="mb-3">
                        <label for="dataInstallazione" class="form-label">Data Installazione</label>
                        <input type="date" class="form-control" id="dataInstallazione" name="dataInstallazione" required
                               value="${client?.dataInstallazione || ''}">
                    </div>

                    <div class="mb-3">
                        <label for="files" class="form-label">Files</label>
                        <input type="file" class="form-control" id="files" name="files" multiple accept="*"
                               onchange="handleFileUpload(event)">
                        ${client?.files && client.files.length > 0 ? `
                            <div class="files-container mt-2">
                                ${client.files.map((file) => `
                                    <div class="file-item">
                                        <div class="file-icon" onclick="showFileModal('${client.id}', '${file.name}')">
                                            <i class="${getFileIcon(file.name)} fs-1"></i>
                                            <div class="file-name">${file.name}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div id="customFields">
                        ${client?.custom_fields ? Object.entries(client.custom_fields).map(([key, value], index) => `
                            <div class="mb-3">
                                <div class="row">
                                    <div class="col">
                                        <input type="text" class="form-control" 
                                               value="${key}"
                                               name="custom_field_name_${index + 1}">
                                    </div>
                                    <div class="col">
                                        <input type="text" class="form-control" 
                                               value="${value}"
                                               name="custom_field_value_${index + 1}">
                                    </div>
                                </div>
                            </div>
                        `).join('') : ''}
                    </div>

                    <button type="button" class="btn btn-secondary mb-3" onclick="addCustomField()">
                        Aggiungi Campo Personalizzato
                    </button>

                    <div class="text-center">
                        <button type="submit" class="btn btn-primary">Salva Cliente</button>
                        <button type="button" onclick="showClientList()" class="btn btn-secondary ms-2">Annulla</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function handleFileUpload(event) {
    const files = event.target.files;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = e.target.result;
            const previewContainer = document.querySelector('.files-container') || 
                                  document.createElement('div');

            if (!previewContainer.classList.contains('files-container')) {
                previewContainer.classList.add('files-container', 'mt-2');
                event.target.parentNode.appendChild(previewContainer);
            }

            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';

            if (isImageFile(file.name)) {
                fileElement.innerHTML = `
                    <img src="${fileData}" class="img-thumbnail" alt="${file.name}"
                         onclick="showFileModal('', '${file.name}')">
                `;
            } else {
                fileElement.innerHTML = `
                    <div class="file-icon" onclick="showFileModal('', '${file.name}')">
                        <i class="${getFileIcon(file.name)} fs-1"></i>
                        <div class="file-name">${file.name}</div>
                    </div>
                `;
            }

            previewContainer.appendChild(fileElement);
        };
        reader.readAsDataURL(file);
    });
}

function handleClientSubmit(event, clientId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const clientData = {};
    const custom_fields = {};

    // Collect form data
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('custom_field_name_')) {
            const index = key.split('_').pop();
            const fieldValue = formData.get(`custom_field_value_${index}`);
            if (value && fieldValue) {
                custom_fields[value] = fieldValue;
            }
        } else if (!key.startsWith('custom_field_value_') && key !== 'files') {
            clientData[key] = value;
        }
    }

    // Add custom fields
    if (Object.keys(custom_fields).length > 0) {
        clientData.custom_fields = custom_fields;
    }

    // Handle files
    const filesContainer = document.querySelector('.files-container');
    if (filesContainer) {
        clientData.files = Array.from(filesContainer.querySelectorAll('.file-item')).map(item => {
            const img = item.querySelector('img');
            const filename = img ? img.alt : item.querySelector('.file-name').textContent;
            return {name: filename};
        });
    }

    // Save or update client
    const clients = getClients();
    if (clientId) {
        // Update existing client
        clientData.id = clientId;
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients[index] = clientData;
        }
    } else {
        // New client
        clientData.id = generateId();
        clients.push(clientData);
    }

    saveClients(clients);
    showAlert(`Cliente ${clientId ? 'aggiornato' : 'aggiunto'} con successo!`);
    showClientList();
}

function deleteClient(clientId) {
    if (!confirm('Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.')) return;

    const clients = getClients();
    const index = clients.findIndex(c => c.id === clientId);
    if (index !== -1) {
        clients.splice(index, 1);
        saveClients(clients);
        showAlert('Cliente eliminato con successo!', 'success');
        showClientList();
    }
}

function addCustomField() {
    const container = document.getElementById('customFields');
    const fieldNum = container.children.length + 1;

    const div = document.createElement('div');
    div.className = 'mb-3';
    div.innerHTML = `
        <div class="row">
            <div class="col">
                <input type="text" class="form-control" 
                       placeholder="Nome campo" 
                       name="custom_field_name_${fieldNum}">
            </div>
            <div class="col">
                <input type="text" class="form-control" 
                       placeholder="Valore" 
                       name="custom_field_value_${fieldNum}">
            </div>
        </div>
    `;

    container.appendChild(div);
}

// Global variables for modal handling
const modalState = {
    currentClientId: '',
    currentImageIndex: 0,
    currentImages: [],
    currentFiles: []
};

function showFileModal(clientId, filename) {
    const client = getClients().find(c => c.id === clientId);
    if (!client || !client.files || client.files.length === 0) return;

    const fileIndex = client.files.findIndex(file => file.name === filename);
    if (fileIndex === -1) return;

    currentClientId = clientId;
    currentIndex = fileIndex;
    clientFiles = client.files;

    const file = clientFiles[currentIndex];
    const fileURL = `${window.location.origin}/files/${clientId}/${file.name}`;
    const modalContent = document.getElementById('fileModalBody');
    modalContent.innerHTML = `<a href="${fileURL}" target="_blank" class="btn btn-primary w-100">${file.name}</a>`;

    const modal = new bootstrap.Modal(document.getElementById('fileModal'));
    modal.show();
}


// Clean up event listener when modal is hidden
document.getElementById('fileModal').addEventListener('hidden.bs.modal', function () {
    document.removeEventListener('keydown', handleKeyPress);
});

function exportToExcel() {
    const clients = getClients();
    let csvContent = "Nome,Cognome,Telefono,Indirizzo,Città,CAP,Marca,Modello,Matricola,Data Installazione,Files\n";

    clients.forEach(client => {
        const fileLinks = client.files ? 
            client.files.map(f => `${window.location.origin}/files/${client.id}/${f.name}`).join('; ') :
            '';

        csvContent += `${client.nome},${client.cognome},${client.telefono},${client.indirizzo},` +
                     `${client.citta},${client.cap},${client.marca},${client.modello},` +
                     `${client.matricola},${client.dataInstallazione},${fileLinks}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "clienti.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    showClientList();

    // Show Android usage instructions modal
    const showInstructions = localStorage.getItem('showAndroidInstructions') !== 'false';
    if (showInstructions && /Android/i.test(navigator.userAgent)) {
        showAndroidInstructions();
    }
});


function showAndroidInstructions() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML += `
        <div class="modal fade" id="androidInstructionsModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Come utilizzare l'app su Android</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>Installazione:</h6>
                        <ol>
                            <li>Apri questa pagina in Chrome su Android</li>
                            <li>Tocca i tre puntini in alto a destra</li>
                            <li>Seleziona "Aggiungi a schermata Home"</li>
                            <li>L'app verrà aggiunta alla schermata principale</li>
                        </ol>
                        <h6>Utilizzo:</h6>
                        <ul>
                            <li>Tocca l'icona sulla schermata Home per aprire l'app</li>
                            <li>Funziona anche offline dopo la prima apertura</li>
                            <li>I dati vengono salvati localmente sul dispositivo</li>
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="localStorage.setItem('showAndroidInstructions', 'false')" data-bs-dismiss="modal">Non mostrare più</button>
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Ho capito</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('androidInstructionsModal'));
    modal.show();
}

function showImageModal(clientId, index) {
    const client = getClients().find(c => c.id === clientId);
    if (!client || !client.images || client.images.length === 0) return;

    currentClientId = clientId;
    currentImageIndex = index;
    currentImages = client.images;

    updateModalImage();
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyPress);
}

function updateModalImage() {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = currentImages[currentImageIndex];
}

function nextImage() {
    if (currentImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    updateModalImage();
}

function prevImage() {
    if (currentImages.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    updateModalImage();
}

function handleKeyPress(event) {
    if (event.key === 'ArrowRight') {
        nextImage();
    } else if (event.key === 'ArrowLeft') {
        prevImage();
    }
}

function deleteCurrentImage() {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return;

    const clients = getClients();
    const clientIndex = clients.findIndex(c => c.id === currentClientId);
    if (clientIndex === -1) return;

    // Remove image from client's images array
    clients[clientIndex].images = clients[clientIndex].images.filter((_, index) => index !== currentImageIndex);
    saveClients(clients);

    // If no more images, close modal
    if (clients[clientIndex].images.length === 0) {
        bootstrap.Modal.getInstance(document.getElementById('imageModal')).hide();
        showClientDetail(currentClientId); // Refresh the detail view
    } else {
        // Show next image
        currentImages = clients[clientIndex].images;
        currentImageIndex = Math.min(currentImageIndex, currentImages.length - 1);
        updateModalImage();
    }
}

// Clean up event listener when modal is hidden
document.getElementById('imageModal').addEventListener('hidden.bs.modal', function () {
    document.removeEventListener('keydown', handleKeyPress);
});

// Initialize the application by showing the client list
document.addEventListener('DOMContentLoaded', showClientList);