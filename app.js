"use strict";

// Учебная сборка с преднамеренными дефектами BUG-001—BUG-007.
const orderForm = document.getElementById("order-form");
const priceInput = document.getElementById("price-input");
const quantityInput = document.getElementById("quantity-input");
const discountInput = document.getElementById("discount-input");
const deliverySelect = document.getElementById("delivery-select");
const formError = document.getElementById("form-error");
const result = document.getElementById("result");
const resultPlaceholder = document.getElementById("result-placeholder");
const exportButton = document.getElementById("export-button");
let lastCalculation = null;

// Во всем расчете деньги представлены целым числом копеек.
function parsePrice(text) {
  const normalized = text.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const parts = normalized.split(".");
  const rubles = Number(parts[0]);
  const kopecks = Number((parts[1] || "").padEnd(2, "0"));
  const price = rubles * 100 + kopecks;
  // BUG-001: нижняя граница ошибочно разрешает ноль копеек.
  if (!Number.isSafeInteger(price) || price < 0 || price > 10000000) return null;
  return price;
}

function parseInteger(text) {
  const normalized = text.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isSafeInteger(value) ? value : null;
}

function formatMoney(kopecks) {
  const rubles = Math.floor(kopecks / 100);
  const rest = String(kopecks % 100).padStart(2, "0");
  return rubles.toLocaleString("ru-RU") + "," + rest + " ₽";
}

function clearError() {
  formError.textContent = "";
  formError.hidden = true;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function invalidateResult() {
  lastCalculation = null;
  result.hidden = true;
  resultPlaceholder.hidden = false;
  exportButton.disabled = true;
}

function initialFields() {
  priceInput.value = "";
  quantityInput.value = "1";
  discountInput.value = "0";
  deliverySelect.value = "pickup";
}

function calculate(event) {
  event.preventDefault();
  invalidateResult();
  clearError();
  const price = parsePrice(priceInput.value);
  if (price === null) {
    showError("Введите цену от 0,01 до 100000,00 ₽, не более двух знаков после запятой");
    return;
  }
  const quantity = parseInteger(quantityInput.value);
  // BUG-002: допустимое граничное количество 100 ошибочно отклоняется.
  if (quantity === null || quantity < 1 || quantity >= 100) {
    showError("Введите целое количество от 1 до 100");
    return;
  }
  const discountPercent = parseInteger(discountInput.value);
  if (discountPercent === null || discountPercent < 0 || discountPercent > 50) {
    showError("Введите целую скидку от 0 до 50 %");
    return;
  }

  const subtotal = price * quantity;
  // BUG-003: основой скидки служит цена одной единицы вместо subtotal.
  // BUG-005: дробная копейка отбрасывается вместо округления половины вверх.
  const discount = Math.floor(price * discountPercent / 100);
  const net = subtotal - discount;
  const deliveryMethod = deliverySelect.value;
  // BUG-004: ровно 3000 рублей после скидки не дают бесплатную доставку.
  const delivery = deliveryMethod === "pickup" || net > 300000 ? 0 : 30000;
  const total = net + delivery;

  lastCalculation = { price, quantity, discountPercent, deliveryMethod, subtotal, discount, net, delivery, total };
  document.getElementById("subtotal-value").textContent = formatMoney(subtotal);
  document.getElementById("discount-value").textContent = formatMoney(discount);
  document.getElementById("net-value").textContent = formatMoney(net);
  document.getElementById("delivery-value").textContent = formatMoney(delivery);
  document.getElementById("total-value").textContent = formatMoney(total);
  result.hidden = false;
  resultPlaceholder.hidden = true;
  exportButton.disabled = false;
}

orderForm.addEventListener("submit", calculate);
[priceInput, quantityInput, discountInput].forEach(function (input) {
  input.addEventListener("input", invalidateResult);
});
deliverySelect.addEventListener("change", invalidateResult);

document.getElementById("reset-button").addEventListener("click", function () {
  initialFields();
  clearError();
  lastCalculation = null;
  exportButton.disabled = true;
  // BUG-006: прежний блок result остается видимым после сброса полей.
});

exportButton.addEventListener("click", function () {
  if (lastCalculation === null || result.hidden) return;
  exportOrder(lastCalculation);
});

// Возврат к исходным значениям, включая повторное открытие и перезагрузку.
window.addEventListener("pageshow", function () {
  initialFields();
  invalidateResult();
  clearError();
});
initialFields();
invalidateResult();
