document.addEventListener('DOMContentLoaded', () => {

    // Bloqueo de Herramientas de Desarrollador (Disuasión)
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('keydown', event => {
        if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I') || (event.ctrlKey && event.key === 'u')) {
            event.preventDefault();
        }
    });

    // --- ELEMENTOS DEL DOM ---
    const productsContainer = document.getElementById('productsContainer');
    const searchInput = document.getElementById('searchInput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const cartCountSpan = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const processPaymentBtn = document.getElementById('processPaymentBtn');
    const addToCartModalBtn = document.getElementById('addToCartBtnModal');
    const clearCartBtn = document.getElementById('clearCartBtn');

    // --- MODALES DE BOOTSTRAP ---
    const quantityModal = new bootstrap.Modal(document.getElementById('quantityModal'));
    const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

    // --- ESTADO DE LA APLICACIÓN ---
    let vehiclesData = [];
    let cart = [];
    let selectedVehicle = null;

    const API_URL = 'https://raw.githubusercontent.com/Victor-c-tech/Segunda-Base-de-Dato/main/catalogo_maestro_100Actualizado.json';

    // --- FUNCIONES ---
    async function loadVehicles() {
        if (!loadingSpinner || !productsContainer) return;
        loadingSpinner.style.display = 'block';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`Error de red: ${response.status}`);
            vehiclesData = await response.json();
            displayVehicles(vehiclesData);
        } catch (error) {
            console.error('Error al cargar vehículos:', error);
            productsContainer.innerHTML = `<div class="alert alert-danger text-center col-12">No se pudieron cargar los vehículos. Revisa que la URL en la constante API_URL sea correcta y accesible.</div>`;
        } finally {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
        }
    }

    function displayVehicles(vehicles) {
        if (!productsContainer) return;
        productsContainer.innerHTML = '';
        vehicles.forEach(vehicle => {
            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 col-12 mb-4';
            const vehicleType = vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}]/gu, '').trim();
            card.innerHTML = `
                <div class="card h-100">
                    <img src="${vehicle.imagen}" class="card-img-top vehicle-image" alt="Imagen de ${vehicle.marca} ${vehicle.modelo}" data-codigo="${vehicle.codigo}" loading="lazy">
                    <div class="card-body">
                        <div>
                            <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                            <p class="card-text description">
                                <strong>Categoría:</strong> ${vehicle.categoria}<br>
                                <strong>Tipo:</strong> ${vehicleType}
                            </p>
                        </div>
                        <div class="card-footer-wrapper">
                            <p class="h5 text-end fw-bold">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(vehicle.precio_venta)}</p>
                            <button class="btn btn-primary w-100 addToCartBtn" data-codigo="${vehicle.codigo}">Añadir al Carrito</button>
                        </div>
                    </div>
                </div>`;
            productsContainer.appendChild(card);
        });
        addEventListenersToCards();
    }

    function showDetailsModal(vehicle) {
        if(!detailsModal) return;
        document.getElementById('detailsModalLabel').textContent = `${vehicle.marca} ${vehicle.modelo}`;
        document.getElementById('detailsModalBody').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${vehicle.imagen}" class="img-fluid rounded mb-3" alt="Imagen de ${vehicle.marca} ${vehicle.modelo}">
                </div>
                <div class="col-md-6">
                    <table class="table table-striped table-bordered">
                        <tbody>
                            <tr><td>Año</td><td>${vehicle.anio || 'N/A'}</td></tr>
                            <tr><td>Motor</td><td>${vehicle.motor || 'N/A'}</td></tr>
                            <tr><td>Transmisión</td><td>${vehicle.transmision || 'N/A'}</td></tr>
                            <tr><td>Cilindros</td><td>${vehicle.cilindros !== undefined ? vehicle.cilindros : 'N/A'}</td></tr>
                            <tr><td>Potencia</td><td>${vehicle.potencia_hp ? vehicle.potencia_hp + ' HP' : 'N/A'}</td></tr>
                            <tr><td>Consumo</td><td>${vehicle.consumo_km_l ? vehicle.consumo_km_l + ' km/l' : 'N/A'}</td></tr>
                            <tr><td>Stock</td><td>${vehicle.existencia || 'Consultar'}</td></tr>
                        </tbody>
                    </table>
                    <p class="mt-3"><strong>Características:</strong> ${vehicle.caracteristicas || 'No especificadas.'}</p>
                </div>
            </div>`;
        detailsModal.show();
    }

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.textContent = totalItems;
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>El carrito está vacío.</p>';
            if (clearCartBtn) clearCartBtn.style.display = 'none';
        } else {
            if (clearCartBtn) clearCartBtn.style.display = 'block';
            cart.forEach(item => {
                const subtotal = item.precio_venta * item.quantity;
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `<img src="${item.imagen}" alt="${item.marca}" class="cart-item-img"><div class="cart-item-details"><strong>${item.marca} ${item.modelo}</strong><br><span>Cantidad: ${item.quantity}</span></div><div class="text-end fw-bold">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(subtotal)}</div><button class="remove-item-btn" data-codigo="${item.codigo}" aria-label="Eliminar ${item.modelo}"><i class="fas fa-trash"></i></button>`;
                cartItemsContainer.appendChild(itemElement);
            });
        }
        const totalCost = cart.reduce((sum, item) => sum + (item.precio_venta * item.quantity), 0);
        cartTotalSpan.textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalCost);
    }
    
    function drawGarageLogo(doc) {
        const x = 15, y = 12, width = 30, wallHeight = 18, roofHeight = 10;
        
        doc.setLineWidth(0.8);
        doc.setDrawColor(0); // Negro

        // Contorno exterior
        doc.line(x, y + roofHeight, x + width / 2, y);
        doc.line(x + width / 2, y, x + width, y + roofHeight);
        doc.line(x + width, y + roofHeight, x + width, y + roofHeight + wallHeight);
        const floorY = y + roofHeight + wallHeight;
        doc.line(x, floorY, x + width, floorY);
        doc.line(x, y + roofHeight, x, floorY);

        // Coordenadas de la puerta
        const doorMarginX = 5;
        const doorMarginY = 4;
        const doorX1 = x + doorMarginX;
        const doorX2 = x + width - doorMarginX;
        const doorY1 = y + roofHeight + doorMarginY;
        const doorY2 = floorY - doorMarginY;
        
        // DIBUJO DEFINITIVO: Rieles verticales y líneas horizontales
        
        // 1. Dibuja los rieles verticales (el marco de la puerta)
        doc.line(doorX1, doorY1, doorX1, doorY2); // Riel izquierdo
        doc.line(doorX2, doorY1, doorX2, doorY2); // Riel derecho

        // 2. Dibuja las líneas horizontales ENTRE los rieles
        const numHorizontalLines = 4;
        const horizontalSpacing = (doorY2 - doorY1) / (numHorizontalLines - 1);
        for (let i = 0; i < numHorizontalLines; i++) {
            const lineY = doorY1 + (i * horizontalSpacing);
            doc.line(doorX1, lineY, doorX2, lineY);
        }
    }

    function generateInvoice() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const customerName = document.getElementById('customerName').value || "Cliente";
        const invoiceNumber = `INV-${Date.now()}`;
        
        const now = new Date();
        const issueDate = now.toLocaleDateString('es-ES');
        const issueTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // --- DIBUJO MANUAL Y PROFESIONAL DEL LOGO ---
        drawGarageLogo(doc);

        // Posicionamiento del texto junto al logo dibujado
        doc.setFontSize(26); doc.setFont("helvetica", "bold"); doc.text("Garage Online", 50, 25);
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("Calle Los Beisbilista #23, Ciudad Hato Nuevo Manoguay.", 50, 32);
        doc.text("info@garageonline.com | +1 (809) 123-4567", 50, 37);
        
        doc.setFontSize(18); doc.text("FACTURA", 195, 25, { align: 'right' });
        doc.setFontSize(10); doc.text(`Nº Factura: ${invoiceNumber}`, 195, 32, { align: 'right' });
        doc.text(`Fecha y Hora: ${issueDate} ${issueTime}`, 195, 37, { align: 'right' });
        
        doc.line(15, 50, 195, 50);
        doc.setFont("helvetica", "bold"); doc.text("Facturar a:", 15, 58);
        doc.setFont("helvetica", "normal"); doc.text(customerName, 15, 64);
        let y = 75;
        doc.setFont("helvetica", "bold"); doc.setFillColor(230, 230, 230); doc.rect(15, y, 180, 8, 'F');
        doc.text("Artículo", 20, y + 6); doc.text("Cant.", 115, y + 6); doc.text("Precio Unit.", 140, y + 6); doc.text("Subtotal", 190, y + 6, { align: 'right' });
        y += 8;
        doc.setFont("helvetica", "normal");
        cart.forEach(item => {
            const subtotal = item.precio_venta * item.quantity;
            const subtotalFormatted = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(subtotal);
            const priceFormatted = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.precio_venta);
            doc.line(15, y, 195, y);
            doc.text(`${item.marca} ${item.modelo}`, 20, y + 6);
            doc.text(item.quantity.toString(), 118, y + 6);
            doc.text(priceFormatted, 160, y + 6, { align: 'right' });
            doc.text(subtotalFormatted, 190, y + 6, { align: 'right' });
            y += 8;
        });
        doc.line(15, y, 195, y);
        const totalCost = cart.reduce((sum, item) => sum + (item.precio_venta * item.quantity), 0);
        const totalFormatted = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalCost);
        y += 10;
        
        doc.setFontSize(12); doc.setFont("helvetica", "bold");
        doc.text("Total a Pagar:", 145, y, { align: 'right' });
        doc.text(totalFormatted, 190, y, { align: 'right' });

        y = 270;
        doc.line(15, y, 195, y);
        doc.setFontSize(10);
        doc.text("¡Gracias por su compra en Garage Online!", 105, y + 8, { align: 'center' });
        doc.text("Para cualquier consulta, contacte con nuestro servicio de atención al cliente.", 105, y + 13, { align: 'center' });
        doc.save(`factura-garage-online-${invoiceNumber}.pdf`);
    }

    // --- EVENT LISTENERS ---
    function addEventListenersToCards() {
        if (!productsContainer) return;
        productsContainer.addEventListener('click', (event) => {
            const target = event.target;
            const vehicleImage = target.closest('.vehicle-image');
            const addToCartButton = target.closest('.addToCartBtn');

            if (vehicleImage) {
                const vehicleCode = parseInt(vehicleImage.dataset.codigo, 10);
                const vehicle = vehiclesData.find(v => v.codigo === vehicleCode);
                if (vehicle) showDetailsModal(vehicle);
            }
            if (addToCartButton) {
                const vehicleCode = parseInt(addToCartButton.dataset.codigo, 10);
                selectedVehicle = vehiclesData.find(v => v.codigo === vehicleCode);
                if (selectedVehicle) {
                    document.getElementById('quantityInput').value = 1;
                    quantityModal.show();
                }
            }
        });
    }
    
    if (searchInput) { searchInput.addEventListener('input', () => { const query = searchInput.value.toLowerCase().trim(); const filtered = vehiclesData.filter(v => v.marca.toLowerCase().includes(query) || v.modelo.toLowerCase().includes(query) || v.categoria.toLowerCase().includes(query)); displayVehicles(filtered); }); }
    if (addToCartModalBtn) { addToCartModalBtn.addEventListener('click', () => { const quantity = parseInt(document.getElementById('quantityInput').value, 10); if (quantity > 0 && selectedVehicle) { const existingItem = cart.find(item => item.codigo === selectedVehicle.codigo); if (existingItem) { existingItem.quantity += quantity; } else { cart.push({ ...selectedVehicle, quantity }); } updateCartUI(); quantityModal.hide(); } else { alert('Por favor, introduce una cantidad válida.'); } }); }
    if (checkoutBtn) { checkoutBtn.addEventListener('click', () => { if (cart.length === 0) { alert('El carrito está vacío.'); return; } cartModal.hide(); paymentModal.show(); }); }
    
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', () => {
            const activeTab = document.querySelector('#pills-tab .nav-link.active');
            
            if (activeTab.id === 'pills-card-tab') {
                const form = document.getElementById('paymentForm');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
            }

            try {
                if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
                     throw new Error("La librería jsPDF no se ha cargado correctamente.");
                }
                
                generateInvoice();
                cart = [];
                updateCartUI();
                paymentModal.hide();
                alert('¡Pago procesado con éxito!\n\nSe ha iniciado la descarga de su factura.');

            } catch (error) {
                console.error("Error al generar la factura:", error);
                alert(`Ocurrió un error al generar la factura: ${error.message}\nPor favor, contacte con el soporte.`);
            }
        });
    }

    if (clearCartBtn) { clearCartBtn.addEventListener('click', () => { if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) { cart = []; updateCartUI(); } }); }
    if (cartItemsContainer) { cartItemsContainer.addEventListener('click', (event) => { const removeButton = event.target.closest('.remove-item-btn'); if (removeButton) { const codigo = parseInt(removeButton.dataset.codigo, 10); cart = cart.filter(item => item.codigo !== codigo); updateCartUI(); } }); }
    
    // --- INICIO DE LA APLICACIÓN ---
    loadVehicles();
    updateCartUI();
});



