const loginForm = document.querySelector("#login-form");
const loginPanel = document.querySelector("#login-panel");
const calculatorPanel = document.querySelector("#calculator-panel");
const loginThanks = document.querySelector("#login-thanks");
const form = document.querySelector("#calculator-form");
const results = document.querySelector("#results");
const helpDialog = document.querySelector("#help-dialog");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!loginForm.reportValidity()) {
    return;
  }

  const name = new FormData(loginForm).get("userName").trim();
  const phone = loginForm.elements.phone;
  const phoneDigits = phone.value.replace(/\D/g, "");

  if (!name) {
    loginForm.elements.userName.setCustomValidity("Digite seu nome para continuar.");
    loginForm.reportValidity();
    loginForm.elements.userName.setCustomValidity("");
    return;
  }

  if (phoneDigits.length < 8) {
    phone.setCustomValidity("Digite um telefone com pelo menos 8 números.");
    loginForm.reportValidity();
    phone.setCustomValidity("");
    return;
  }

  loginThanks.textContent = `Obrigado pelo seu login, ${name}!`;
  loginPanel.hidden = true;
  calculatorPanel.hidden = false;
  document.querySelector("#men").focus();
});

loginForm.elements.userName.addEventListener("input", (event) => {
  event.currentTarget.setCustomValidity("");
});

loginForm.elements.phone.addEventListener("input", (event) => {
  event.currentTarget.setCustomValidity("");
});

document.querySelector("#help-button").addEventListener("click", () => {
  helpDialog.showModal();
});

document.querySelector("#help-close").addEventListener("click", () => {
  helpDialog.close();
});

const formatQuantity = (value) =>
  new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const men = Number(formData.get("men"));
  const women = Number(formData.get("women"));
  const children = Number(formData.get("children"));

  const meatKg = (men * 500 + women * 400 + children * 250) / 1000;
  const beerLiters = (men + women) * 1.5;
  const softDrinkLiters = men + women + children;
  const totalPeople = men + women + children;

  document.querySelector("#meat-result").textContent = `${formatQuantity(meatKg)} kg`;
  document.querySelector("#beer-result").textContent = `${formatQuantity(beerLiters)} L`;
  document.querySelector("#soft-drink-result").textContent = `${formatQuantity(softDrinkLiters)} L`;
  document.querySelector("#charcoal-result").textContent = `${formatQuantity(meatKg)} kg`;
  document.querySelector("#people-count").textContent =
    `${totalPeople} ${totalPeople === 1 ? "pessoa" : "pessoas"}`;

  results.hidden = false;
});
