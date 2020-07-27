document.addEventListener("DOMContentLoaded", function () {
  (async function () {
    const calculator = document.getElementById("calculator");
    if (!calculator) return;
    const result = calculator.querySelector("#result");
    const submitBtn = calculator.querySelector("#calculator-submit");
    // Ставим только числовой ввод

    const onlyNumericInputs = Array.from(
      calculator.querySelectorAll(".only-numeric")
    );
    onlyNumericInputs.forEach((input) => {
      input.addEventListener("input", () => {
        const value = input.value;
        input.value = value.replace(/[^\d]+/g, "");
      });
    });

    // Запрашиваем данные из JSON

    const dataURL = calculator.getAttribute("data-calculator");
    if (!dataURL) throw new Error("No calculator data provided");

    const response = await axios.get(dataURL);
    const data = response.data;

    // Формируем группы полей

    const fields = {
      form: {
        select: calculator.querySelector("#shape-select"),
      },
      size: {
        select: calculator.querySelector("#size-select"),
        customModeCheckbox: calculator.querySelector("#custom-size"),
        customSizeInputs: {
          length: calculator.querySelector("#length"),
          width: calculator.querySelector("#width"),
          horCount: calculator.querySelector("#hor"),
          verCount: calculator.querySelector("#ver"),
          tAmount: calculator.querySelector("#T"),
          kAmount: calculator.querySelector("#K"),
        },
      },
      material: {
        select: calculator.querySelector("#material-select"),
      },
      tirage: {
        amount: calculator.querySelector("#tirage"),
      },
      marginal: {
        amount: calculator.querySelector("#marginal"),
      },
      colors: {
        select: calculator.querySelector("#colors-select"),
      },
    };

    const customDimensionsFields = [];

    for (let key of Object.keys(fields.size.customSizeInputs)) {
      customDimensionsFields.push(fields.size.customSizeInputs[key]);
    }

    // Формируем селект формы на основе данных

    const forms = Array.from(new Set(data.map((item) => item.Form)));
    const optionsData = forms.map((form) => {
      switch (form) {
        case "rectangle":
          return {
            text: "Прямоугольная",
            value: form,
          };

        case "circle":
          return {
            text: "Круглая",
            value: form,
          };

        case "ellipse":
          return {
            text: "Эллипс",
            value: form,
          };
        case "figured":
          return {
            text: "Фигурная",
            value: form,
          };
        default:
          return {
            text: form,
            value: form,
          };
      }
    });

    const newFormOptions = optionsData.map((data) => {
      const optionElement = document.createElement("option");
      optionElement.textContent = data.text;
      optionElement.value = data.value;
      return optionElement;
    });

    const createPlaceholderOption = (text) => {
      const optionElement = document.createElement("option");
      optionElement.textContent = text;
      optionElement.value = "";
      optionElement.hidden = true;
      optionElement.disabled = true;
      optionElement.selected = true;
      return optionElement;
    };

    newFormOptions.unshift(createPlaceholderOption("Выберите форму"));

    const oldFormOptions = Array.from(fields.form.select.options);
    oldFormOptions.forEach((option) => fields.form.select.remove(option));

    newFormOptions.forEach((option) => fields.form.select.add(option));

    // Формируем селект с размерами

    let sizes = Array.from(new Set(data.map((item) => item.BxL)));

    sizes.sort((a, b) => {
      const firstItem = a.split("x");
      const secondItem = b.split("x");
      if (parseFloat(firstItem[0]) < parseFloat(secondItem[0])) {
        return -1;
      }
      if (parseFloat(firstItem[0]) > parseFloat(secondItem[0])) {
        return 1;
      }
      if (parseFloat(firstItem[1]) < parseFloat(secondItem[1])) {
        return -1;
      }
      if (parseFloat(firstItem[1]) > parseFloat(secondItem[1])) {
        return 1;
      }
      return 0;
    });

    const sizesOptions = sizes.map((size) => {
      const optionElement = document.createElement("option");
      optionElement.textContent = size;
      optionElement.value = size;
      return optionElement;
    });

    sizesOptions.unshift(createPlaceholderOption("Выберите размер"));

    const oldSizeOptions = Array.from(fields.size.select.options);
    oldSizeOptions.forEach((option) => fields.size.select.remove(option));

    sizesOptions.forEach((option) => fields.size.select.add(option));

    // Управляем активностью полей

    const orderOfFields = [
      fields.form.select,
      [
        fields.size.select,
        fields.size.customModeCheckbox,
        ...customDimensionsFields,
      ],
      fields.material.select,
      fields.colors.select,
      fields.tirage.amount,
      fields.marginal.amount,
    ];

    orderOfFields.flat().forEach((field) => (field.disabled = true));
    
    fields.form.select.disabled = false;

    submitBtn.disabled = true;

    const resetAllNextFields = (index) => {
      const nextFields = orderOfFields.slice(index + 1);
      submitBtn.disabled = true;
      result.innerHTML = "";
      nextFields.forEach((field) => {
        if (Array.isArray(field)) {
          field.forEach((subfield) => {
            if (subfield.matches('[type="checkbox"]')) {
              subfield.checked = false;
            } else {
              subfield.value = "";
            }
            subfield.disabled = true;
          });
        } else {
          if (field.matches('[type="checkbox"]')) {
            field.checked = false;
          } else {
            field.value = "";
          }
          field.disabled = true;
        }
      });
    };

    fields.form.select.addEventListener("change", (event) => {
      resetAllNextFields(0);
      if (event.target.value) {
        fields.size.select.disabled = false;
        fields.size.customModeCheckbox.disabled = false;

        const filteredItemsByForm = data.filter(
          (item) => item.Form === event.target.value
        );
        const filteredItemsByFormShape = Array.from(
          new Set(filteredItemsByForm.map((element) => element.BxL))
        );
        Array.from(fields.size.select.options).forEach((option) => {
          if (filteredItemsByFormShape.includes(option.value)) {
            option.disabled = false;
            option.hidden = false;
          } else {
            option.disabled = true;
            option.hidden = true;
          }
        });
      }
    });

    fields.size.customModeCheckbox.addEventListener("change", (event) => {
      resetAllNextFields(1);
      customDimensionsFields.forEach((field) => (field.value = ""));
      if (event.target.checked) {
        fields.size.select.disabled = true;

        // console.log('CUstom dimensions fields', customDimensionsFields)
        customDimensionsFields.forEach((field) => (field.disabled = false));
      } else {
        fields.size.select.disabled = false;
        customDimensionsFields.forEach((field) => (field.disabled = true));
      }

      fields.size.select.value = "";
    });

    customDimensionsFields.forEach((field) => {
      field.addEventListener("input", function (event) {
        const oneOfFieldsEmpty = customDimensionsFields.find(
          (field) => !field.value
        );
        if (oneOfFieldsEmpty && fields.size.customModeCheckbox) {
          resetAllNextFields(1);
        } else if (!oneOfFieldsEmpty && fields.size.customModeCheckbox) {
          fields.material.select.disabled = false;
        }
      });
    });

    fields.size.select.addEventListener("change", function (event) {
      resetAllNextFields(1);
      customDimensionsFields.forEach((field) => (field.value = ""));
      if (event.target.value) {
        fields.material.select.disabled = false;
      }
    });

    fields.material.select.addEventListener("change", function (event) {
      resetAllNextFields(2);
      if (event.target.value) {
        fields.colors.select.disabled = false;
      }
    });

    fields.colors.select.addEventListener("change", function (event) {
      resetAllNextFields(3);
      if (event.target.value) {
        fields.tirage.amount.disabled = false;
      }
    });
    fields.tirage.amount.addEventListener("input", function (event) {
      resetAllNextFields(4);
      if (event.target.value) {
        fields.marginal.amount.disabled = false;
      }
    });

    fields.marginal.amount.addEventListener("input", function (event) {
      resetAllNextFields(5);
      if (event.target.value) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    });

    async function getEuroRate() {
      const response = await axios.get(
        "https://www.cbr-xml-daily.ru/daily_json.js"
      );
      const rate = response.data.Valute.EUR.Value;

      return rate;
    }

    async function calculate() {
      const shape = fields.form.select.value;
      const size = fields.size.select.value;
      const paperPrice = calculator.querySelector('[name="paper-price-euro"]')
        .value;
      const ppPrice = calculator.querySelector('[name="pp-price-euro"]').value;
      const euroRate = await getEuroRate();
      const material = fields.material.select.value;

      let horCount = 1 * fields.size.customSizeInputs.horCount.value;
      let verCount = 1 * fields.size.customSizeInputs.verCount.value;
      let tAmount = (1 * fields.size.customSizeInputs.tAmount.value) / 1000;
      let kAmount = (1 * fields.size.customSizeInputs.kAmount.value) / 1000;
      let width = 1 * fields.size.customSizeInputs.width.value;
      let length = 1 * fields.size.customSizeInputs.length.value;

      const materialPrice = 1 * (material === "Paper" ? paperPrice : ppPrice);
      const tirage = 1 * fields.tirage.amount.value;
      const colors = 1 * fields.colors.select.value;
      const marginal = 1 * fields.marginal.amount.value;
      let itemForCalculation = null;
      let total = 0;
      if (!fields.size.customModeCheckbox.checked) {
        itemForCalculation = data.find((element) => {
          if (element.Form === shape && element.BxL === size) {
            return true;
          } else {
            return false;
          }
        });

        if (!itemForCalculation) {
          console.error("Item for calculation not found");
          return;
        } else {
          width = 1 * itemForCalculation.B;
          length = 1 * itemForCalculation.L;
          horCount = 1 * itemForCalculation.hor;
          verCount = 1 * itemForCalculation.ver;
          tAmount = (1 * itemForCalculation.T) / 1000;
          kAmount = (1 * itemForCalculation.K) / 1000;
        }
      }

      total =
        (tirage / (horCount * verCount)) * kAmount +
        50 * colors * tAmount * materialPrice * euroRate * 1.05;
      totalWithMarginal = total * (1 + marginal / 100);

      result.innerHTML = `
      Без наценки: ${total.toFixed(2)} ₽ <br>
      Стоимость с наценкой: ${totalWithMarginal.toFixed(2)} ₽ <br>
      Стоимость единицы товара: ${(totalWithMarginal / tirage).toFixed(2)} ₽ <br>
      Прибыль: ${(totalWithMarginal - total).toFixed(2)} ₽ <br>
    `;

      console.log({
        total,
        totalWithMarginal,
        itemForCalculation,
        params: {
          width,
          length,
          horCount,
          verCount,
          tAmount,
          kAmount,
          shape,
          size,
          material,
          materialPrice,
          euroRate,
          tirage,
          colors,
          marginal,
        },
      });
    }

    submitBtn.addEventListener("click", function (event) {
      event.preventDefault();
      calculate();
    });
  })();
});
