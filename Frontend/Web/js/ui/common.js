export function showNotice(element, message, error = false) {
  element.textContent = message;
  element.classList.toggle("error", Boolean(error));
  element.hidden = !message;
}

export function addCell(row, content = "", className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = content;
  row.append(cell);
  return cell;
}

export function makeButton(text, className, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}
