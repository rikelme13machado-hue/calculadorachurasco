const loginForm = document.querySelector("#login-form");
const loginPanel = document.querySelector("#login-panel");
const calculatorPanel = document.querySelector("#calculator-panel");
const loginThanks = document.querySelector("#login-thanks");
const form = document.querySelector("#calculator-form");
const results = document.querySelector("#results");
const extraTools = document.querySelector("#extra-tools");
const helpDialog = document.querySelector("#help-dialog");

const HISTORY_KEY = "churrasco-na-medida-history-v1";
const CURRENT_KEY = "churrasco-na-medida-current-v1";
const meatNames = {
  picanha: "Picanha",
  alcatra: "Alcatra",
  costela: "Costela",
  maminha: "Maminha",
  linguica: "Linguiça",
  frango: "Frango",
  coracao: "Coração de frango",
  costelinha: "Costelinha suína",
};
const drinkNames = {
  water: "Água",
  soda: "Refrigerante",
  juice: "Suco",
  other: "Outra bebida",
};
const sideNames = {
  rice: "Arroz",
  "garlic-bread": "Pão de alho",
  farofa: "Farofa",
  vinaigrette: "Vinagrete",
  "potato-salad": "Salada de maionese",
};

const formatQuantity = (value) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;

let shoppingItems = [];
let currentCalculation = null;
let historyItems = [];

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!loginForm.reportValidity()) return;

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

document.querySelector("#help-button").addEventListener("click", () => helpDialog.showModal());
document.querySelector("#help-close").addEventListener("click", () => helpDialog.close());

const otherDrinkCheckbox = form.querySelector('input[value="other"]');
const otherDrinkName = form.elements.otherDrinkName;

otherDrinkCheckbox.addEventListener("change", () => {
  otherDrinkName.disabled = !otherDrinkCheckbox.checked;
  otherDrinkName.required = otherDrinkCheckbox.checked;
  if (!otherDrinkCheckbox.checked) otherDrinkName.value = "";
});
otherDrinkName.addEventListener("input", () => otherDrinkName.setCustomValidity(""));

form.querySelector("#economy-mode").addEventListener("change", (event) => {
  if (!event.currentTarget.checked) return;

  form.querySelectorAll('input[name="meats"]').forEach((input) => {
    input.checked = ["frango", "linguica"].includes(input.value);
  });
  form.querySelectorAll('input[name="sides"]').forEach((input) => {
    if (["rice", "farofa"].includes(input.value)) input.checked = true;
  });
});

const selectedValues = (name) =>
  [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);

const getFormValues = () => ({
  men: Number(form.elements.men.value),
  women: Number(form.elements.women.value),
  children: Number(form.elements.children.value),
  duration: Number(form.elements.duration.value),
  meats: selectedValues("meats"),
  sides: selectedValues("sides"),
  drinks: selectedValues("drinks"),
  otherDrinkName: form.elements.otherDrinkName.value.trim(),
  economyMode: form.elements.economyMode.checked,
});

const setFormValues = (values) => {
  form.elements.men.value = values.men ?? 0;
  form.elements.women.value = values.women ?? 0;
  form.elements.children.value = values.children ?? 0;
  form.elements.duration.value = values.duration ?? 4;
  form.elements.economyMode.checked = Boolean(values.economyMode);
  form.elements.otherDrinkName.value = values.otherDrinkName ?? "";

  for (const input of form.querySelectorAll('input[name="meats"], input[name="sides"], input[name="drinks"]')) {
    const valuesForInput = values[input.name] ?? [];
    input.checked = valuesForInput.includes(input.value);
  }

  otherDrinkName.disabled = !otherDrinkCheckbox.checked;
  otherDrinkName.required = otherDrinkCheckbox.checked;
};

const calculateQuantities = (values) => {
  const adults = values.men + values.women;
  const totalPeople = adults + values.children;

  // Mantém as porções da calculadora original.
  const meatKg = (values.men * 500 + values.women * 400 + values.children * 250) / 1000;
  const beerLiters = adults * 1.5;
  const nonAlcoholicLiters =
    (adults * 0.3 + values.children * 0.4) * values.duration;
  const drinkCount = values.drinks.length;
  const litersPerDrink = drinkCount ? nonAlcoholicLiters / drinkCount : 0;
  const preferredMeats = new Set(["frango", "linguica"]);
  const meatWeights = values.meats.map((meat) =>
    values.economyMode && preferredMeats.has(meat) ? 2 : 1,
  );
  const totalMeatWeight = meatWeights.reduce((sum, weight) => sum + weight, 0);
  const meatBreakdown = values.meats.map((meat, index) => ({
    name: meatNames[meat],
    quantity: totalMeatWeight ? (meatKg * meatWeights[index]) / totalMeatWeight : 0,
    unit: "kg",
  }));
  const drinkBreakdown = values.drinks.map((drink) => ({
    name: drink === "other" ? values.otherDrinkName || drinkNames.other : drinkNames[drink],
    quantity: litersPerDrink,
    unit: "L",
  }));

  return { adults, totalPeople, meatKg, beerLiters, nonAlcoholicLiters, meatBreakdown, drinkBreakdown };
};

const sideQuantities = (values) => {
  const adults = values.men + values.women;
  const quantities = {
    rice: { quantity: (adults * 150 + values.children * 75) / 1000, unit: "kg" },
    "garlic-bread": { quantity: adults + values.children * 0.5, unit: "unidades" },
    farofa: { quantity: adults * 50 + values.children * 25, unit: "g" },
    vinaigrette: { quantity: adults * 50 + values.children * 25, unit: "g" },
    "potato-salad": { quantity: (adults * 150 + values.children * 100) / 1000, unit: "kg" },
  };
  return values.sides.map((side) => ({ name: sideNames[side], ...quantities[side] }));
};

const buildShoppingList = (values, calculation) => {
  const items = [];
  const addItem = (name, quantity, unit, category) => {
    items.push({
      id: makeId(),
      name,
      quantity: Number(quantity.toFixed(2)),
      unit,
      category,
      checked: false,
    });
  };

  calculation.meatBreakdown.forEach((meat) =>
    addItem(meat.name, meat.quantity, meat.unit, "Carnes"),
  );
  addItem("Cerveja", calculation.beerLiters, "L", "Bebidas");
  calculation.drinkBreakdown.forEach((drink) =>
    addItem(drink.name, drink.quantity, drink.unit, "Bebidas"),
  );
  sideQuantities(values).forEach((side) =>
    addItem(side.name, side.quantity, side.unit, "Acompanhamentos"),
  );
  addItem("Carvão", calculation.meatKg, "kg", "Churrasco");
  addItem("Sal grosso", calculation.meatKg * 0.03, "kg", "Churrasco");
  addItem("Pratos descartáveis", calculation.totalPeople * 2, "unidades", "Descartáveis");
  addItem("Copos descartáveis", calculation.totalPeople * 4, "unidades", "Descartáveis");
  addItem("Guardanapos", calculation.totalPeople * 3, "unidades", "Descartáveis");
  addItem("Sacos para lixo", Math.ceil(calculation.totalPeople / 10), "unidades", "Outros");

  return items;
};

const reconcileShoppingList = (generatedItems) => {
  const previousItems = new Map(
    shoppingItems
      .filter((item) => !item.manual)
      .map((item) => [`${item.category}:${item.name.toLocaleLowerCase("pt-BR")}`, item]),
  );
  const updatedItems = generatedItems.map((item) => {
    const previous = previousItems.get(
      `${item.category}:${item.name.toLocaleLowerCase("pt-BR")}`,
    );
    return previous
      ? {
          ...item,
          id: previous.id,
          checked: previous.checked,
          quantity: previous.quantityEdited ? previous.quantity : item.quantity,
          quantityEdited: Boolean(previous.quantityEdited),
        }
      : item;
  });
  return [...updatedItems, ...shoppingItems.filter((item) => item.manual)];
};

const createDetail = ({ name, quantity, unit }) => {
  const item = document.createElement("div");
  item.className = "result-detail";
  const label = document.createElement("span");
  label.textContent = name;
  const amount = document.createElement("strong");
  amount.textContent = `${formatQuantity(quantity)} ${unit}`;
  item.append(label, amount);
  return item;
};

const renderBreakdowns = (calculation) => {
  const meatBreakdown = document.querySelector("#meat-breakdown");
  const drinkBreakdown = document.querySelector("#drink-breakdown");
  meatBreakdown.replaceChildren(...calculation.meatBreakdown.map(createDetail));
  drinkBreakdown.replaceChildren(...calculation.drinkBreakdown.map(createDetail));

  document.querySelector("#meat-result").textContent = `${formatQuantity(calculation.meatKg)} kg`;
  document.querySelector("#beer-result").textContent = `${formatQuantity(calculation.beerLiters)} L`;
  document.querySelector("#soft-drink-result").textContent =
    `${formatQuantity(calculation.nonAlcoholicLiters)} L`;
  document.querySelector("#charcoal-result").textContent = `${formatQuantity(calculation.meatKg)} kg`;
  document.querySelector("#people-count").textContent =
    `${calculation.totalPeople} ${calculation.totalPeople === 1 ? "pessoa" : "pessoas"}`;

  const values = currentCalculation.values;
  document.querySelector("#people-breakdown").textContent =
    `${calculation.adults} ${calculation.adults === 1 ? "adulto" : "adultos"} · ${values.children} ${values.children === 1 ? "criança" : "crianças"} · ${values.duration}h de duração`;

  for (const side of Object.keys(sideNames)) {
    const row = document.querySelector(`#${side}-result-item`);
    const value = sideQuantities(values).find((item) => item.name === sideNames[side]);
    row.hidden = !value;
    if (value) {
      document.querySelector(`#${side}-result`).textContent =
        `${formatQuantity(value.quantity)} ${value.unit}`;
    }
  }
};

const shoppingListElement = document.querySelector("#shopping-list");
const shoppingStatus = document.querySelector("#shopping-status");

const persistCurrentPlan = () => {
  if (!currentCalculation) return;

  try {
    localStorage.setItem(
      CURRENT_KEY,
      JSON.stringify({
        values: currentCalculation.values,
        shoppingItems,
        invitation: getInvitationValues(),
      }),
    );
    shoppingStatus.textContent = "";
  } catch {
    shoppingStatus.textContent = "Não foi possível salvar neste navegador. Confira o espaço disponível.";
  }
};

const updateShoppingStatus = () => {
  const remaining = shoppingItems.filter((item) => !item.checked).length;
  shoppingStatus.textContent = shoppingItems.length
    ? `${shoppingItems.length - remaining} de ${shoppingItems.length} itens marcados como comprados.`
    : "";
};

const renderShoppingList = () => {
  shoppingListElement.replaceChildren();

  if (!shoppingItems.length) {
    const empty = document.createElement("li");
    empty.className = "shopping-empty";
    empty.textContent = "Nenhum item na lista.";
    shoppingListElement.append(empty);
    updateShoppingStatus();
    return;
  }

  for (const item of shoppingItems) {
    const row = document.createElement("li");
    row.className = `shopping-row${item.checked ? " is-checked" : ""}`;

    const purchasedLabel = document.createElement("label");
    purchasedLabel.className = "shopping-check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(item.checked);
    checkbox.setAttribute("aria-label", `Marcar ${item.name} como comprado`);
    const name = document.createElement("span");
    name.className = "shopping-name";
    name.textContent = item.name;
    const category = document.createElement("small");
    category.className = "shopping-category";
    category.textContent = item.category;
    purchasedLabel.append(checkbox, name, category);

    const quantityLabel = document.createElement("label");
    quantityLabel.className = "shopping-quantity";
    quantityLabel.setAttribute("aria-label", `Quantidade de ${item.name}`);
    const quantity = document.createElement("input");
    quantity.type = "number";
    quantity.min = "0";
    quantity.step = "any";
    quantity.value = item.quantity;
    quantity.setAttribute("aria-label", `Quantidade de ${item.name}`);
    const unit = document.createElement("span");
    unit.textContent = item.unit;
    quantityLabel.append(quantity, unit);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-item-button";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Excluir ${item.name} da lista`);
    removeButton.addEventListener("click", () => {
      shoppingItems = shoppingItems.filter((shoppingItem) => shoppingItem.id !== item.id);
      renderShoppingList();
      persistCurrentPlan();
    });

    checkbox.addEventListener("change", () => {
      item.checked = checkbox.checked;
      row.classList.toggle("is-checked", item.checked);
      updateShoppingStatus();
      persistCurrentPlan();
    });
    quantity.addEventListener("change", () => {
      item.quantity = Number(quantity.value);
      item.quantityEdited = true;
      persistCurrentPlan();
    });

    row.append(purchasedLabel, quantityLabel, removeButton);
    shoppingListElement.append(row);
  }
  updateShoppingStatus();
};

const getInvitationValues = () => {
  const data = new FormData(document.querySelector("#invitation-form"));
  return {
    eventName: data.get("eventName").trim(),
    eventDate: data.get("eventDate"),
    eventTime: data.get("eventTime"),
    eventLocation: data.get("eventLocation").trim(),
    eventMessage: data.get("eventMessage").trim(),
  };
};

const updateInvitationPreview = () => {
  const values = getInvitationValues();
  const preview = document.querySelector("#invitation-preview");
  const valid = values.eventName && values.eventDate && values.eventTime && values.eventLocation;
  if (!valid) {
    preview.hidden = true;
    return;
  }

  const date = new Date(`${values.eventDate}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  document.querySelector("#preview-name").textContent = values.eventName;
  document.querySelector("#preview-date").textContent = `${date} · ${values.eventTime}`;
  document.querySelector("#preview-location").textContent = `📍 ${values.eventLocation}`;
  document.querySelector("#preview-message").textContent = values.eventMessage;
  const inviteText = [
    `🔥 ${values.eventName}`,
    `📅 ${date} às ${values.eventTime}`,
    `📍 ${values.eventLocation}`,
    values.eventMessage,
  ]
    .filter(Boolean)
    .join("\n");
  document.querySelector("#whatsapp-link").href =
    `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
  preview.hidden = false;
};

document.querySelector("#invitation-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const invitationForm = event.currentTarget;
  if (!invitationForm.reportValidity()) return;
  const invitationValues = getInvitationValues();
  const nameInput = invitationForm.elements.eventName;
  const locationInput = invitationForm.elements.eventLocation;
  nameInput.setCustomValidity(invitationValues.eventName ? "" : "Digite o nome do churrasco.");
  locationInput.setCustomValidity(invitationValues.eventLocation ? "" : "Digite o local do churrasco.");
  if (!invitationForm.reportValidity()) return;
  updateInvitationPreview();
  persistCurrentPlan();
});
document.querySelector("#invitation-form").addEventListener("input", () => {
  for (const input of document.querySelectorAll("#invitation-form input, #invitation-form textarea")) {
    input.setCustomValidity("");
  }
  if (!document.querySelector("#invitation-preview").hidden) updateInvitationPreview();
  persistCurrentPlan();
});

const renderHistory = () => {
  const historyList = document.querySelector("#history-list");
  const historyEmpty = document.querySelector("#history-empty");
  historyList.replaceChildren();
  historyEmpty.hidden = historyItems.length > 0;

  historyItems.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = "history-row";
    const summary = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.invitation?.eventName || "Meu churrasco";
    const detail = document.createElement("small");
    const people = item.calculation?.totalPeople ?? 0;
    const date = new Date(item.savedAt).toLocaleDateString("pt-BR");
    detail.textContent = `${people} ${people === 1 ? "pessoa" : "pessoas"} · salvo em ${date}`;
    summary.append(title, detail);

    const actions = document.createElement("div");
    actions.className = "history-actions";
    const loadButton = document.createElement("button");
    loadButton.className = "secondary-button";
    loadButton.type = "button";
    loadButton.textContent = "Reutilizar";
    loadButton.addEventListener("click", () => loadHistoryItem(item));
    const deleteButton = document.createElement("button");
    deleteButton.className = "remove-item-button";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", "Excluir planejamento salvo");
    deleteButton.addEventListener("click", () => {
      historyItems.splice(index, 1);
      persistHistory();
      renderHistory();
    });
    actions.append(loadButton, deleteButton);
    row.append(summary, actions);
    historyList.append(row);
  });
};

const persistHistory = () => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems));
    document.querySelector("#storage-status").textContent = "";
    return true;
  } catch {
    document.querySelector("#storage-status").textContent =
      "Não foi possível salvar o histórico neste navegador. Confira o espaço disponível.";
    return false;
  }
};

const loadHistoryItem = (item) => {
  setFormValues(item.values);
  currentCalculation = {
    values: item.values,
    ...calculateQuantities(item.values),
  };
  shoppingItems = structuredClone(item.shoppingItems ?? []);
  renderBreakdowns(currentCalculation);
  renderShoppingList();
  if (item.invitation) {
    const invitationForm = document.querySelector("#invitation-form");
    Object.entries(item.invitation).forEach(([key, value]) => {
      if (invitationForm.elements[key]) invitationForm.elements[key].value = value ?? "";
    });
    updateInvitationPreview();
  }
  results.hidden = false;
  extraTools.hidden = false;
  persistCurrentPlan();
  results.scrollIntoView({ behavior: "smooth", block: "start" });
};

const calculate = (values, existingShoppingItems = null) => {
  const calculation = calculateQuantities(values);
  currentCalculation = { values, ...calculation };
  renderBreakdowns(currentCalculation);
  const generatedItems = buildShoppingList(values, currentCalculation);
  shoppingItems = existingShoppingItems ?? reconcileShoppingList(generatedItems);
  renderShoppingList();
  results.hidden = false;
  extraTools.hidden = false;
  persistCurrentPlan();
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const status = document.querySelector("#calculator-status");
  status.textContent = "";

  if (!form.reportValidity()) return;
  const values = getFormValues();
  if (!values.meats.length) {
    status.textContent = "Selecione ao menos um tipo de carne.";
    form.querySelector('input[name="meats"]').focus();
    return;
  }
  if (values.drinks.includes("other") && !values.otherDrinkName) {
    otherDrinkName.setCustomValidity("Digite o nome da outra bebida.");
    form.reportValidity();
    return;
  }
  otherDrinkName.setCustomValidity("");
  calculate(values);
});

document.querySelector("#add-item-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const addForm = event.currentTarget;
  if (!addForm.reportValidity()) return;
  const data = new FormData(addForm);
  const itemName = data.get("itemName").trim();
  if (!itemName) {
    shoppingStatus.textContent = "Digite o nome do produto que deseja adicionar.";
    addForm.elements.itemName.focus();
    return;
  }
  shoppingItems.push({
    id: makeId(),
    name: itemName,
    quantity: Number(data.get("itemQuantity")),
    unit: data.get("itemUnit").trim() || "unidades",
    category: "Outros",
    checked: false,
    manual: true,
  });
  addForm.reset();
  addForm.elements.itemQuantity.value = 1;
  addForm.elements.itemUnit.value = "unidades";
  renderShoppingList();
  persistCurrentPlan();
  addForm.elements.itemName.focus();
});

document.querySelector("#save-plan-button").addEventListener("click", () => {
  if (!currentCalculation) return;
  historyItems.unshift({
    values: currentCalculation.values,
    calculation: {
      totalPeople: currentCalculation.totalPeople,
      meatKg: currentCalculation.meatKg,
    },
    shoppingItems: structuredClone(shoppingItems),
    invitation: getInvitationValues(),
    savedAt: new Date().toISOString(),
  });
  if (persistHistory()) {
    document.querySelector("#storage-status").textContent = "Planejamento salvo neste navegador.";
    renderHistory();
  }
});

document.querySelector("#export-pdf-button").addEventListener("click", () => window.print());

const restoreSavedData = () => {
  try {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    historyItems = savedHistory ? JSON.parse(savedHistory) : [];
    if (!Array.isArray(historyItems)) {
      historyItems = [];
      document.querySelector("#storage-status").textContent =
        "O histórico salvo está em um formato inválido e não pôde ser carregado.";
    }
    renderHistory();

    const savedCurrent = localStorage.getItem(CURRENT_KEY);
    if (!savedCurrent) return;
    const current = JSON.parse(savedCurrent);
    if (!current.values || !Array.isArray(current.shoppingItems)) {
      document.querySelector("#storage-status").textContent =
        "O planejamento salvo está incompleto e não pôde ser carregado.";
      return;
    }

    setFormValues(current.values);
    currentCalculation = { values: current.values, ...calculateQuantities(current.values) };
    shoppingItems = current.shoppingItems;
    renderBreakdowns(currentCalculation);
    renderShoppingList();
    results.hidden = false;
    extraTools.hidden = false;

    if (current.invitation) {
      const invitationForm = document.querySelector("#invitation-form");
      Object.entries(current.invitation).forEach(([key, value]) => {
        if (invitationForm.elements[key]) invitationForm.elements[key].value = value ?? "";
      });
      updateInvitationPreview();
    }
  } catch {
    document.querySelector("#storage-status").textContent =
      "Os dados salvos não puderam ser lidos. Um novo planejamento ainda pode ser criado.";
  }
};

restoreSavedData();
