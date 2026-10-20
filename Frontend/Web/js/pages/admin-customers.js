import { createCustomer, deleteCustomer, getCustomer, listCustomers, updateCustomer } from "../api/customers.js";
import { adminErrorMessage } from "../core/admin.js";
import { clearSession, requireAdmin, watchAdminSession } from "../core/session.js";
import { fillCustomerForm, renderCustomerTable, setCustomerDialogMode } from "../ui/admin-customers.js";
import { showNotice } from "../ui/common.js";

const auth = requireAdmin();
if (auth) startAdmin(auth);

function startAdmin(session) {
  const searchInput = document.getElementById("search-input");
  const notice = document.getElementById("admin-notice");
  const formNotice = document.getElementById("form-notice");
  const dialog = document.getElementById("customer-dialog");
  const form = document.getElementById("customer-form");
  const saveButton = document.getElementById("save-button");
  let customers = [];
  let editingId = null;
  let loadSequence = 0;

  document.getElementById("admin-name").textContent = session.user.username;
  watchAdminSession(session);

  function signOut() {
    clearSession();
    window.location.replace("./account.html");
  }

  function render() {
    renderCustomerTable(customers, searchInput.value.trim(), { onEdit: openEdit, onDelete: removeCustomer });
  }

  async function loadCustomers() {
    const requestId = ++loadSequence;
    document.getElementById("refresh-button").disabled = true;
    try {
      const data = await listCustomers(session.token);
      if (requestId !== loadSequence) return false;
      if (!Array.isArray(data)) throw new Error("API trả dữ liệu danh sách không hợp lệ.");
      customers = data.sort((a, b) => b.id - a.id);
      render();
      showNotice(notice, "");
      return true;
    } catch (error) {
      if (requestId === loadSequence) {
        showNotice(notice, adminErrorMessage(error), true);
        document.getElementById("result-count").textContent = "Không tải được dữ liệu";
      }
      return false;
    } finally {
      if (requestId === loadSequence) document.getElementById("refresh-button").disabled = false;
    }
  }

  function openCreate() {
    editingId = null;
    form.reset();
    showNotice(formNotice, "");
    setCustomerDialogMode(false);
    dialog.showModal();
    form.elements.fullName.focus();
  }

  async function openEdit(id) {
    showNotice(notice, "");
    try {
      const customer = await getCustomer(id, session.token);
      editingId = id;
      fillCustomerForm(form, customer);
      showNotice(formNotice, "");
      setCustomerDialogMode(true);
      dialog.showModal();
      form.elements.fullName.focus();
    } catch (error) {
      showNotice(notice, adminErrorMessage(error), true);
    }
  }

  async function removeCustomer(customer) {
    if (!window.confirm(`Xóa khách hàng “${customer.fullName}”? Thao tác này không thể hoàn tác.`)) return;
    showNotice(notice, "");
    try {
      await deleteCustomer(customer.id, session.token);
      if (await loadCustomers()) showNotice(notice, `Đã xóa khách hàng “${customer.fullName}”.`);
    } catch (error) {
      showNotice(notice, adminErrorMessage(error), true);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    showNotice(formNotice, "");
    const body = {
      fullName: form.elements.fullName.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      address: form.elements.address.value.trim()
    };
    if (Object.values(body).some(value => !value) || !form.elements.email.checkValidity()) {
      showNotice(formNotice, "Vui lòng nhập đầy đủ thông tin và email hợp lệ.", true);
      return;
    }
    saveButton.disabled = true;
    try {
      const wasEditing = editingId !== null;
      if (wasEditing) await updateCustomer(editingId, body, session.token);
      else await createCustomer(body, session.token);
      dialog.close();
      if (await loadCustomers()) showNotice(notice, wasEditing ? "Đã cập nhật khách hàng." : "Đã thêm khách hàng.");
    } catch (error) {
      showNotice(formNotice, adminErrorMessage(error), true);
    } finally {
      saveButton.disabled = false;
    }
  });

  document.getElementById("add-button").addEventListener("click", openCreate);
  document.getElementById("refresh-button").addEventListener("click", loadCustomers);
  document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
  document.getElementById("cancel-dialog").addEventListener("click", () => dialog.close());
  document.getElementById("logout-button").addEventListener("click", signOut);
  searchInput.addEventListener("input", render);
  loadCustomers();
}
