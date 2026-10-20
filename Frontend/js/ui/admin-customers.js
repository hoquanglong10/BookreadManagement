import { addCell, makeButton } from "./common.js";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export function renderCustomerTable(customers, query, { onEdit, onDelete }) {
  const filtered = customers.filter(customer =>
    [customer.fullName, customer.phone, customer.email, customer.address]
      .some(value => String(value || "").toLocaleLowerCase("vi-VN").includes(query.toLocaleLowerCase("vi-VN"))));
  const rows = document.getElementById("customer-rows");
  rows.replaceChildren();
  document.getElementById("customer-count").textContent = String(customers.length);
  document.getElementById("result-count").textContent = query
    ? `${filtered.length} kết quả phù hợp` : `${customers.length} khách hàng`;
  document.getElementById("empty-state").hidden = filtered.length > 0;
  document.getElementById("empty-description").textContent = query
    ? "Không tìm thấy khách hàng phù hợp. Thử từ khóa khác."
    : "Hãy thêm khách hàng đầu tiên để bắt đầu.";

  for (const customer of filtered) {
    const row = document.createElement("tr");
    const nameCell = addCell(row);
    const name = document.createElement("span");
    name.className = "customer-name";
    name.textContent = customer.fullName;
    const id = document.createElement("span");
    id.className = "customer-id";
    id.textContent = `ID #${customer.id}`;
    nameCell.append(name, id);

    const contactCell = addCell(row);
    for (const value of [customer.email, customer.phone]) {
      const line = document.createElement("span");
      line.className = "contact-line";
      line.textContent = value || "";
      contactCell.append(line);
    }
    addCell(row, customer.address || "—", "address-cell");
    const date = customer.createdAt ? new Date(customer.createdAt) : null;
    addCell(row, date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : "—", "date-cell");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      makeButton("Sửa", "row-button", `Sửa ${customer.fullName}`, () => onEdit(customer.id)),
      makeButton("Xóa", "row-button delete", `Xóa ${customer.fullName}`, () => onDelete(customer))
    );
    addCell(row).append(actions);
    rows.append(row);
  }
}

export function fillCustomerForm(form, customer) {
  form.elements.fullName.value = customer.fullName || "";
  form.elements.phone.value = customer.phone || "";
  form.elements.email.value = customer.email || "";
  form.elements.address.value = customer.address || "";
}

export function setCustomerDialogMode(editing) {
  document.getElementById("dialog-title").textContent = editing ? "Sửa khách hàng" : "Thêm khách hàng";
  document.getElementById("save-button").textContent = editing ? "Lưu thay đổi" : "Thêm khách hàng";
}
