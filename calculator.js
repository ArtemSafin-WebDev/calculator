document.addEventListener("DOMContentLoaded", function () {
  (async function () {
    const calculator = document.getElementById("calculator");

    if (!calculator) return;

    let data = [];
    const formSelect = calculator.querySelector("#shape-select");
    const sizeSelect = calculator.querySelector("#size-select");
    const materialSelect = calculator.querySelector("#material-select");
    const submitBtn = calculator.querySelector("#calculator-submit");
    const onlyNumericInputs = Array.from(
      calculator.querySelectorAll(".only-numeric")
    );
    const customSizeCheckbox = calculator.querySelector("#custom-size");
    const customLengthInput = calculator.querySelector("#length");
    const customWidthInput = calculator.querySelector("#width");
    const colorsSelect = calculator.querySelector("#colors-select");
    const tirageInput = calculator.querySelector("#tirage");
    const marginalInput = calculator.querySelector("#marginal");
    const result = calculator.querySelector('#result')


    const paperPrice = calculator.querySelector('[name="paper-price-euro"]')
      .value;
    const ppPrice = calculator.querySelector('[name="pp-price-euro"]').value;

    submitBtn.disabled = true;

    const selects = [formSelect, sizeSelect, materialSelect];

    async function getData() {
      const dataURL = calculator.getAttribute("data-calculator");
      if (!dataURL) throw new Error("No calculator data provided");

      const response = await axios.get(dataURL);
      //   console.log("Response", response.data);
      return response.data;
    }

    async function getEuroRate() {
      console.log("getting euro rate");
      const response = await axios.get(
        "https://www.cbr-xml-daily.ru/daily_json.js"
      );
      const rate = response.data.Valute.EUR.Value;
      console.log(response);
      return rate;
    }

    function removeSelectOptions(select) {
      const options = Array.from(select.options);
      options.forEach((option) => select.remove(option));
    }

    function createSelectOption(value, text) {
      const optionElement = document.createElement("option");
      optionElement.textContent = text;
      optionElement.value = value;
      return optionElement;
    }

    function createPlaceholderOption(placeholderText) {
      const optionElement = createSelectOption("", placeholderText);
      optionElement.hidden = true;
      optionElement.disabled = true;
      optionElement.selected = true;
      return optionElement;
    }

    function setNumericInputs(inputs) {
      inputs.forEach((input) => {
        input.addEventListener("input", () => {
          const value = input.value;
          input.value = value.replace(/[^\d]+/g, "");
        });
      });
    }

    function cleanSelects(selects) {
      selects.forEach((select) => removeSelectOptions(select));
      selects.forEach((select) => (select.disabled = true));
    }

    function createFormOptions(select) {
      const forms = data.map((item) => item.Form);
      const uniqueForms = new Set(forms);
      const options = [];

      for (let form of uniqueForms) {
        switch (form) {
          case "rectangle":
            options.push(createSelectOption(form, "Прямоугольная"));
            break;
          case "circle":
            options.push(createSelectOption(form, "Круглая"));
            break;
          case "ellipse":
            options.push(createSelectOption(form, "Эллипс"));
            break;
          case "figured":
            options.push(createSelectOption(form, "Фигурная"));
            break;
          default:
            options.push(createSelectOption(form, form));
        }
      }

      options.unshift(createPlaceholderOption("Выберите форму"));
      options.forEach((option) => select.add(option));

      select.disabled = false;
    }

    function createSizeOptions(select) {
      const forms = data.map((item) => item.BxL);
      const uniqueForms = Array.from(new Set(forms));
      const options = [];

      uniqueForms.sort((a, b) => {
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

      for (let form of uniqueForms) {
        options.push(createSelectOption(form, form));
      }

      options.unshift(createPlaceholderOption("Выберите размер"));
      options.forEach((option) => select.add(option));
    }

    function createMaterialOptions(select) {
      const forms = data.map((item) => item.Material);
      const uniqueForms = new Set(forms);
      const options = [];

      for (let form of uniqueForms) {
        switch (form) {
          case "Paper":
            options.push(createSelectOption(form, "Бумага"));
            break;
          case "PP":
            options.push(createSelectOption(form, "Пленка"));
            break;
          case "all":
            break;
          default:
            options.push(createSelectOption(form, form));
        }
      }

      options.unshift(createPlaceholderOption("Выберите материал"));
      options.forEach((option) => select.add(option));
    }

    function filterSelectSizes() {
      const currentForm = formSelect.value;
      const sizesSelectOptions = Array.from(sizeSelect.options);
      const filteredItems = data.filter((item) => item.Form === currentForm);
      const filteredItemsSizes = Array.from(
        new Set(filteredItems.map((item) => item.BxL))
      );
      // console.log('Current form', currentForm);
      // console.log('Filtered items sizes', filteredItemsSizes);
      // console.log('Size select options', sizesSelectOptions);

      sizesSelectOptions.forEach((option) => {
        const isPresentInFilteredSizes = filteredItemsSizes.includes(
          option.value
        );
        if (!option.value) {
          return;
        }

        if (isPresentInFilteredSizes) {
          option.hidden = false;
          option.disabled = false;
        } else {
          option.hidden = true;
          option.disabled = true;
        }
      });
    }

    function filterSelectMaterial() {
      const currentForm = formSelect.value;
      const currentSize = sizeSelect.value;
      const materialSelectOptions = Array.from(materialSelect.options);
      const filteredItems = data.filter((item) => {
        if (!customSizeCheckbox.checked) {
          if (item.Form === currentForm && item.BxL === currentSize) {
            return true;
          } else {
            return false;
          }
        } else {
          if (item.Form === currentForm) {
            return true;
          } else {
            return false;
          }
        }
      });
      const filteredItemsMaterials = Array.from(
        new Set(filteredItems.map((item) => item.Material))
      );

      const hasAllMaterials = filteredItemsMaterials.includes("all");

      // console.log('Filtered items materials', filteredItemsMaterials)

      materialSelectOptions.forEach((option) => {
        const isPresentInFilteredMaterials = filteredItemsMaterials.includes(
          option.value
        );
        if (!option.value) {
          return;
        }

        if (isPresentInFilteredMaterials || hasAllMaterials) {
          option.hidden = false;
          option.disabled = false;
        } else {
          option.hidden = true;
          option.disabled = true;
        }
      });
    }

    function findMatchingItem() {
      let item = null;
      const currentForm = formSelect.value;
      const currentSize = sizeSelect.value;
      const currentMaterial = materialSelect.value;

      item = data.find((element) => {
        if (customSizeCheckbox.checked) {
          if (
            element.Form === currentForm &&
            (element.Material === currentMaterial || element.Material === "all")
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          if (
            element.Form === currentForm &&
            (element.Material === currentMaterial ||
              element.Material === "all") &&
            element.BxL === currentSize
          ) {
            return true;
          } else {
            return false;
          }
        }
      });

      return item;
    }

    function fillSelects() {
      createFormOptions(formSelect);
      createSizeOptions(sizeSelect);
      createMaterialOptions(materialSelect);
    }

    async function calculateResult() {
      const euroRate = await getEuroRate();
     

      const item = findMatchingItem();

      if (!item) console.error("No item for selected requirements");

      const width =
        1 * (customSizeCheckbox.checked ? customWidthInput.value : item.B);

      const length =
        1 * (customSizeCheckbox.checked ? customLengthInput.value : item.L);

      const area = width * length;

      const material = materialSelect.value;
      const materialPrice = parseFloat(
        material === "Paper" ? paperPrice : ppPrice
      );
      const tirage = 1 * tirageInput.value;
      const numberOfColors = 1 * colorsSelect.value;
      const marginal = (1 * marginalInput.value) / 100;

      const horVer = 1 * item.hor * item.ver;

      const K = 1 * item.K;
      const T = 1 * item.T;

      const total = (tirage / horVer * K) + (50 * numberOfColors * T * materialPrice * euroRate * 1.05);
      console.log({
        itemForCalculation: item,
        area: {
          width,
          length,
          area,
        },
        material: {
          material,
          materialPrice,
        },
        euroRate,
        tirage,
        numberOfColors,
        marginalRate: marginal,
        itemParams: {
          horVer,
          K,
          T,
        },
        total
      });


      result.innerHTML = '';
      result.innerHTML = `
        Без наценки: ${total.toFixed(2)} ₽ <br>
        Стоимость с наценкой: ${(total * (1 + marginal)).toFixed(2)} ₽ <br>
        Стоимость единцы товара ${((total * (1 + marginal)) / tirage).toFixed(2)} ₽ <br>
      `
      
       
    }

    setNumericInputs(onlyNumericInputs);
    data = await getData();

    cleanSelects(selects);
    fillSelects();

    formSelect.addEventListener("change", () => {
      result.innerHTML = '';
      const value = formSelect.value;
      if (value) {
        sizeSelect.disabled = false;
        customSizeCheckbox.disabled = false;
        filterSelectSizes();
      } else {
        sizeSelect.disabled = true;
      }
      sizeSelect.value = "";
      materialSelect.disabled = true;
      submitBtn.disabled = true;
      materialSelect.value = "";
      colorsSelect.disabled = true;
      colorsSelect.value = "1";
      tirageInput.disabled = true;
      tirageInput.value = "";
      marginalInput.value = "";
      marginalInput.disabled = true;
      submitBtn.disabled = true;
    });

    sizeSelect.addEventListener("change", () => {
      result.innerHTML = '';
      const value = sizeSelect.value;

      if (value) {
        materialSelect.disabled = false;
        filterSelectMaterial();
      } else {
        materialSelect.disabled = true;
      }

      materialSelect.value = "";
      submitBtn.disabled = true;
      colorsSelect.value = "1";
      colorsSelect.disabled = true;
      tirageInput.value = "";
      tirageInput.disabled = true;
      marginalInput.disabled = true;
      marginalInput.value = "";
      submitBtn.disabled = true;
    });

    customSizeCheckbox.addEventListener("change", () => {
      result.innerHTML = '';
      sizeSelect.value = "";
      if (customSizeCheckbox.checked) {
        sizeSelect.disabled = true;
        customWidthInput.disabled = false;
        customLengthInput.disabled = false;
      } else {
        sizeSelect.disabled = false;
      }

      materialSelect.value = "";
      materialSelect.disabled = true;
      colorsSelect.value = "1";
      colorsSelect.disabled = true;
      tirageInput.value = "";
      tirageInput.disabled = true;
      marginalInput.value = "";
      marginalInput.disabled = true;
    });

    const customDimensionInputs = [customLengthInput, customWidthInput];

    customDimensionInputs.forEach((input) =>
    
      input.addEventListener("input", () => {
        result.innerHTML = '';
        if (
          customLengthInput.value &&
          customWidthInput.value &&
          customSizeCheckbox.checked
        ) {
          materialSelect.disabled = false;
        } else {
          materialSelect.disabled = true;
        }

        materialSelect.value = "";
      })
    );

    materialSelect.addEventListener("change", () => {
      result.innerHTML = '';
      const value = materialSelect.value;
      if (value) {
        colorsSelect.disabled = false;
        tirageInput.disabled = false;
      } else {
        submitBtn.disabled = true;
        colorsSelect.disabled = true;
        tirageInput.disabled = true;
      }

      colorsSelect.value = "1";
    });

    colorsSelect.addEventListener('change', () => {
      result.innerHTML = '';
    })

    tirageInput.addEventListener("input", () => {
      result.innerHTML = '';
      if (tirageInput.value) {
        marginalInput.disabled = false;
        if (marginalInput.value) {
          submitBtn.disabled = false;
        }
      } else {
        marginalInput.disabled = true;
        marginalInput.value = "";
        submitBtn.disabled = true;
      }
    });

    marginalInput.addEventListener("input", () => {
      result.innerHTML = '';
      if (marginalInput.value && tirageInput.value) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    });

    calculator.addEventListener("submit", (event) => {
      event.preventDefault();
      calculateResult();
    });
  })();
});
