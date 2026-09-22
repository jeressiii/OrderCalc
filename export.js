"use strict";

function exportOrder(calculation) {
  const lines = [
    "Калькулятор заказа — расчет",
    "Цена за единицу: " + formatMoney(calculation.price),
    "Количество: " + calculation.quantity,
    "Скидка, %: " + calculation.discountPercent,
    "Способ доставки: " + (calculation.deliveryMethod === "pickup" ? "Самовывоз" : "Курьер"),
    "",
    "Товары: " + formatMoney(calculation.subtotal),
    "Скидка: " + formatMoney(calculation.discount),
    "После скидки: " + formatMoney(calculation.net),
    "Доставка: " + formatMoney(calculation.delivery),
    // BUG-007: вместо окончательного total экспортируется subtotal.
    "Итого: " + formatMoney(calculation.subtotal)
  ];
  const file = new Blob([lines.join("\n") + "\n"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "order.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}
