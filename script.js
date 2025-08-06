document.addEventListener('DOMContentLoaded', () => {

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

    // --- MODALES DE BOOTSTRAP ---
    const quantityModal = new bootstrap.Modal(document.getElementById('quantityModal'));
    const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

    // --- ESTADO DE LA APLICACIÓN ---
    let vehiclesData = [];
    let cart = [];
    let selectedVehicle = null;

    // ¡¡¡ IMPORTANTE !!!
    // REEMPLAZA ESTA LÍNEA CON LA URL "RAW" DE TU PROPIO ARCHIVO JSON EN GITHUB
    const API_URL = 'https://raw.githubusercontent.com/Victor-c-tech/Segunda-Base-de-Dato/refs/heads/main/catalogo_maestro_100Actualizado.json';

    // --- FUNCIONES PRINCIPALES ---

    async function loadVehicles() {
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
            loadingSpinner.style.display = 'none';
        }
    }

    function displayVehicles(vehicles) {
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
                </div>
            `;
            productsContainer.appendChild(card);
        });

        addEventListenersToCards();
    }

    function showDetailsModal(vehicle) {
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

    // ... (El resto de funciones como updateCartUI y generateInvoice no necesitan cambios)

    // --- EVENT LISTENERS ---

    function addEventListenersToCards() {
        productsContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('vehicle-image')) {
                const vehicleCode = parseInt(target.dataset.codigo, 10);
                const vehicle = vehiclesData.find(v => v.codigo === vehicleCode);
                if (vehicle) showDetailsModal(vehicle);
            }
            if (target.classList.contains('addToCartBtn')) {
                const vehicleCode = parseInt(target.dataset.codigo, 10);
                selectedVehicle = vehiclesData.find(v => v.codigo === vehicleCode);
                document.getElementById('quantityInput').value = 1;
                quantityModal.show();
            }
        });
    }
    
    // Verificamos que los elementos existen ANTES de añadirles un listener
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const filtered = vehiclesData.filter(v => 
                v.marca.toLowerCase().includes(query) ||
                v.modelo.toLowerCase().includes(query) ||
                v.categoria.toLowerCase().includes(query)
            );
            displayVehicles(filtered);
        });
    }

    if (addToCartModalBtn) {
        addToCartModalBtn.addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('quantityInput').value, 10);
            if (quantity > 0 && selectedVehicle) {
                const existingItem = cart.find(item => item.codigo === selectedVehicle.codigo);
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cart.push({ ...selectedVehicle, quantity });
                }
                updateCartUI();
                quantityModal.hide();
            } else {
                alert('Por favor, introduce una cantidad válida.');
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('El carrito está vacío.');
                return;
            }
            cartModal.hide();
            paymentModal.show();
        });
    }

    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', () => {
            const form = document.getElementById('paymentForm');
            if (!form.checkValidity()) {
                alert('Por favor, complete todos los campos de pago.');
                return;
            }
            alert('¡Pago procesado con éxito! Generando su factura.');
            generateInvoice();
            cart = [];
            updateCartUI();
            paymentModal.hide();
        });
    }

    // --- INICIO DE LA APLICACIÓN ---
    loadVehicles();
});