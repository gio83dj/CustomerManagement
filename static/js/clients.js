
// Global variables for modal handling
let currentClientId = '';
let currentImageIndex = 0;
let currentImages = [];
let currentFileName = '';

function initializeEventListeners() {
    // Client form handling
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(clientForm);

            try {
                const response = await fetch(clientForm.getAttribute('action') || '/add_client', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Modal event listener
    const fileModal = document.getElementById('fileModal');
    if (fileModal) {
        fileModal.addEventListener('hidden.bs.modal', function () {
            document.removeEventListener('keydown', handleKeyPress);
        });
    }
}

async function deleteCurrentFile() {
    if (!confirm('Sei sicuro di voler eliminare questo file?')) return;

    try {
        const response = await fetch(`/delete_client_file/${currentClientId}/${currentFileName}`, {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('fileModal'));
            modal.hide();
            location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function showFileModal(clientId, filename) {
    currentClientId = clientId;
    currentFileName = filename;
    const fileUrl = `/data/${clientId}/${filename}`;
    const ext = filename.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
    
    const modalBody = document.getElementById('fileModalBody');
    
    if (isImage) {
        const fileElements = document.querySelectorAll('.file-item img');
        currentImages = Array.from(fileElements).map(img => img.alt);
        currentImageIndex = currentImages.indexOf(filename);
        
        modalBody.innerHTML = `
            <div class="position-relative">
                <img src="${fileUrl}" class="img-fluid" alt="${filename}">
                ${currentImages.length > 1 ? `
                    <button class="btn btn-outline-light position-absolute top-50 start-0 translate-middle-y" onclick="prevImage()" style="margin-left: 10px;">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                    <button class="btn btn-outline-light position-absolute top-50 end-0 translate-middle-y" onclick="nextImage()" style="margin-right: 10px;">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                ` : ''}
            </div>
        `;
    } else {
        modalBody.innerHTML = `
            <div class="text-center">
                <a href="${fileUrl}" target="_blank" class="btn btn-primary">
                    <i class="bi bi-download"></i> Scarica ${filename}
                </a>
            </div>
        `;
    }

    const modal = new bootstrap.Modal(document.getElementById('fileModal'));
    modal.show();
    
    document.addEventListener('keydown', handleKeyPress);
}

function prevImage() {
    if (!currentImages || currentImages.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    currentFileName = currentImages[currentImageIndex];
    const fileUrl = `/data/${currentClientId}/${currentFileName}`;
    const modalBody = document.getElementById('fileModalBody');
    modalBody.querySelector('img').src = fileUrl;
    modalBody.querySelector('img').alt = currentFileName;
}

function nextImage() {
    if (!currentImages || currentImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    currentFileName = currentImages[currentImageIndex];
    const fileUrl = `/data/${currentClientId}/${currentFileName}`;
    const modalBody = document.getElementById('fileModalBody');
    modalBody.querySelector('img').src = fileUrl;
    modalBody.querySelector('img').alt = currentFileName;
}

function handleKeyPress(event) {
    if (event.key === 'ArrowLeft') {
        prevImage();
    } else if (event.key === 'ArrowRight') {
        nextImage();
    }
}

function exportToExcel() {
    window.location.href = '/export_excel';
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    const clientsList = document.getElementById('clientsList');

    if (!query) {
        window.location.reload();
        return;
    }

    fetch(`/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(clients => {
            clientsList.innerHTML = clients.map(client => `
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
                            </p>
                            <div class="btn-group">
                                <a href="/client/${client.id}" class="btn btn-primary">Dettagli</a>
                                <a href="/edit_client/${client.id}" class="btn btn-secondary">Modifica</a>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => console.error('Error:', error));
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

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEventListeners);
