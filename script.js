const cart = [];
let products = [];
let whatsappPhone = '';

const categoryFilter = document.querySelector('#categoryFilter');
const sortProducts = document.querySelector('#sortProducts');
const searchInput = document.querySelector('#searchInput');
const productGrid = document.querySelector('#productGrid');
const cartItems = document.querySelector('#cartItems');
const cartCountNode = document.querySelector('#cartCount');
const subtotalValue = document.querySelector('#subtotalValue');
const totalValue = document.querySelector('#totalValue');
const cartPanel = document.querySelector('#cartPanel');
const productModal = document.querySelector('#productModal');
const modalBody = document.querySelector('#modalBody');
const whatsappCartBtn = document.querySelector('#whatsappCartBtn');
const topSearch = document.querySelector('#topSearch');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatKSh(value) {
  return `KSh ${Number(value).toLocaleString('en-KE')}`;
}

function computeSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderCategories(categories) {
  categoryFilter.replaceChildren(new Option('All categories', 'all'));
  categories.forEach((category) => {
    categoryFilter.add(new Option(category.name, category.name));
  });
}

function getFilteredProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const sortValue = sortProducts.value;

  let filtered = products.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm) ||
      item.color.toLowerCase().includes(searchTerm) ||
      item.material.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (sortValue) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return Number(b.new) - Number(a.new);
      default:
        return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
    }
  });

  return filtered;
}

function renderProducts() {
  const filtered = getFilteredProducts();

  if (!filtered.length) {
    productGrid.innerHTML = '<p class="empty-state">No products match your filters.</p>';
    return;
  }

  productGrid.innerHTML = filtered
    .map((product) => `
      <article class="product-card">
        <div class="product-image">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
          <span class="badge">${escapeHtml(product.tags)}</span>
        </div>
        <div class="product-body">
          <div class="product-meta">
            <span>${escapeHtml(product.category)}</span>
            <span>${product.stock} in stock</span>
          </div>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <div class="product-pricing">
            <span class="price">${formatKSh(product.price)}</span>
            <span class="original-price">${formatKSh(product.originalPrice)}</span>
          </div>
          <div class="product-footer">
            <span class="rating">★ ${Number(product.rating).toFixed(1)}</span>
            <div class="product-actions">
              <button class="view-btn" type="button" data-view="${product.id}">View Details</button>
              <button class="add-btn" type="button" data-add="${product.id}" ${product.stock < 1 ? 'disabled' : ''}>Add to Cart</button>
            </div>
          </div>
        </div>
      </article>
    `)
    .join('');
}

function addToCart(productId, quantity = 1) {
  const product = products.find((item) => item.id === Number(productId));
  if (!product || product.stock < 1) return;

  const existingItem = cart.find((item) => item.id === Number(productId));
  if ((existingItem?.quantity ?? 0) + quantity > product.stock) {
    window.alert('There is not enough stock for that quantity.');
    return;
  }

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  updateCartUI();
  cartPanel.classList.add('open');
}

function updateCartUI() {
  cartCountNode.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = computeSubtotal();
  subtotalValue.textContent = formatKSh(subtotal);
  totalValue.textContent = formatKSh(subtotal);

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty. Add a few pieces to get started.</p>';
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />
      <div>
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(item.color)}</p>
        <div class="quantity-controls">
          <button class="quantity-button" type="button" data-qty="decrease" data-id="${item.id}">−</button>
          <span>${item.quantity}</span>
          <button class="quantity-button" type="button" data-qty="increase" data-id="${item.id}">+</button>
        </div>
      </div>
      <div class="item-total">
        <span>${formatKSh(item.price * item.quantity)}</span>
        <button type="button" data-remove="${item.id}">Remove</button>
      </div>
    </div>
  `).join('');
}

function changeQuantity(productId, delta) {
  const item = cart.find((cartItem) => cartItem.id === Number(productId));
  if (!item) return;

  const product = products.find((current) => current.id === item.id);
  if (delta > 0 && item.quantity + delta > product.stock) {
    window.alert('There is not enough stock for that quantity.');
    return;
  }

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart.splice(cart.indexOf(item), 1);
  }
  updateCartUI();
}

function openModal(productId) {
  const product = products.find((item) => item.id === Number(productId));
  if (!product) return;

  const gallery = product.images.map((image) =>
    `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)} image" />`
  ).join('');
  const message = encodeURIComponent(
    `Hello Furniture Hub, I would like to enquire about ordering this furniture:\n\nProduct: ${product.name}\nProduct ID: ${product.code}\nPrice: ${formatKSh(product.price)}\nQuantity: 1\nSelected colour: ${product.color}\nProduct link: ${window.location.href}\n\nPlease confirm availability, delivery charges, expected delivery time and payment arrangements. Thank you.`
  );

  modalBody.innerHTML = `
    <div class="product-detail">
      <div class="detail-gallery">${gallery}</div>
      <div class="detail-content">
        <div class="detail-meta">
          <span>${escapeHtml(product.category)}</span><span>•</span>
          <span>Product code: ${escapeHtml(product.code)}</span>
        </div>
        <h2 id="modalTitle">${escapeHtml(product.name)}</h2>
        <div class="detail-price">
          <span class="price">${formatKSh(product.price)}</span>
          <span class="original-price">${formatKSh(product.originalPrice)}</span>
        </div>
        <div class="detail-actions">
          <button class="buy-btn" type="button" data-add="${product.id}" ${product.stock < 1 ? 'disabled' : ''}>Add to Cart</button>
          ${whatsappPhone
            ? `<a class="whatsapp-link" href="https://wa.me/${whatsappPhone}?text=${message}" target="_blank" rel="noreferrer">Order via WhatsApp</a>`
            : '<span class="whatsapp-unavailable">WhatsApp ordering unavailable</span>'}
        </div>
        <p class="detail-copy">${escapeHtml(product.description)}</p>
        <ul class="detail-list">
          <li><strong>Color:</strong> ${escapeHtml(product.color)}</li>
          <li><strong>Material:</strong> ${escapeHtml(product.material)}</li>
          <li><strong>Availability:</strong> ${product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}</li>
          <li><strong>Delivery:</strong> Contact us to confirm delivery charges</li>
        </ul>
      </div>
    </div>
  `;

  productModal.classList.remove('hidden');
  productModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  productModal.classList.add('hidden');
  productModal.setAttribute('aria-hidden', 'true');
}

function buildWhatsAppCartMessage() {
  if (!cart.length) return '';

  return encodeURIComponent([
    'Hello Furniture Hub, I would like to enquire about ordering my cart:',
    '',
    ...cart.map((item) => `- ${item.name} (${item.code}) x${item.quantity} @ ${formatKSh(item.price)} = ${formatKSh(item.price * item.quantity)}`),
    '',
    `Subtotal: ${formatKSh(computeSubtotal())}`,
    'Please confirm delivery charges, expected delivery time and payment arrangements. Thank you.'
  ].join('\n'));
}

function handleCartWhatsApp() {
  const message = buildWhatsAppCartMessage();
  if (message && whatsappPhone) {
    window.open(`https://wa.me/${whatsappPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  } else if (message) {
    window.alert('WhatsApp ordering is not configured for this store yet.');
  }
}

function loadStoreData() {
  const catalog = window.FURNITURE_HUB_CATALOG;
  if (!catalog || !Array.isArray(catalog.products) || !Array.isArray(catalog.categories)) {
    productGrid.innerHTML = '<p class="error-state">The product catalog could not be loaded. Check that catalog.js is available.</p>';
    return;
  }

  products = catalog.products.map((product) => ({
    ...product,
    new: product.newArrival
  }));
  whatsappPhone = String(catalog.whatsappPhone || '').replace(/\D/g, '');
  document.querySelector('#storePhone').textContent = whatsappPhone
    ? `+${whatsappPhone}`
    : 'WhatsApp ordering unavailable';
  renderCategories(catalog.categories);
  renderProducts();
}

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add]');
  if (addButton) addToCart(addButton.dataset.add);

  const viewButton = event.target.closest('[data-view]');
  if (viewButton) openModal(viewButton.dataset.view);

  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    const item = cart.find((cartItem) => cartItem.id === Number(removeButton.dataset.remove));
    if (item) changeQuantity(item.id, -item.quantity);
  }

  const qtyButton = event.target.closest('[data-qty]');
  if (qtyButton) {
    changeQuantity(qtyButton.dataset.id, qtyButton.dataset.qty === 'increase' ? 1 : -1);
  }

  if (event.target.closest('.close-cart')) cartPanel.classList.remove('open');
  if (event.target.closest('[data-close="modal"]') || event.target.closest('.modal-close')) closeModal();
  if (event.target.closest('.cart-button')) cartPanel.classList.toggle('open');
});

searchInput.addEventListener('input', renderProducts);
topSearch.addEventListener('input', (event) => {
  searchInput.value = event.target.value;
  renderProducts();
});
categoryFilter.addEventListener('change', renderProducts);
sortProducts.addEventListener('change', renderProducts);
whatsappCartBtn.addEventListener('click', handleCartWhatsApp);
document.querySelector('.newsletter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  window.alert('Newsletter signups will be connected in a later phase.');
});
updateCartUI();
loadStoreData();
