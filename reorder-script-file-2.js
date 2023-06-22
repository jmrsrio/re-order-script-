const reorderUrl = window.location.href;
const accountPage = reorderUrl.match(/\account$/)
  ? reorderUrl.match(/\account$/).length
  : 0;
var baseUrl = "https://api.reorder.sandbox.sapp.springrain.io";
var currencyCode = Shopify.currency.active;
var mobileMediaQuery = window.matchMedia("(max-width: 768px)");
async function fetchReorderSettingsData() {
  let couponInSession = sessionStorage.getItem("reorderData");
  if (couponInSession) return JSON.parse(couponInSession);
  const response = await fetch(
    `http://localhost:53688/public/popup/coupons?shop=${Shopify.shop}`
  );
  const data = await response.json();
  sessionStorage.setItem("reorderData", JSON.stringify(data));
  return JSON.parse(sessionStorage.getItem("reorderData"));
}

if (accountPage) {
  if (document.getElementsByClassName("account").length) {
    initReorderApp();
  }
}

async function initReorderApp() {
  let table = document.querySelector('table[role="table"].order-history');
  let tbody = table.querySelector("tbody");
  let trs = tbody.querySelectorAll("tr");
  var couponCode = await fetchReorderSettingsData();
  let couponCodeMessage = null;
  if (couponCode?.coupon_code) {
    couponCode = JSON.parse(couponCode?.coupon_code);
    let couponCodeValue = "";
    if (couponCode?.type === "fixed_amount") {
      couponCodeValue = `${currencyCode}`;
    } else if (couponCode?.type === "percentage") {
      couponCodeValue = `%`;
    }
    //here couponCodeMessage

    if (window.matchMedia("(max-width: 768px)").matches) {
      couponCodeMessage = `<div style="background-color:#f5f5f5;padding: 7px 15px;margin:10px 15px; border-radius: 5px;"><div style="font-size: 14px;margin: 0; display: flex; gap: 10px; align-items: center;"><img src="https://cdn.shopify.com/s/files/1/0555/4346/4122/files/bullhorn-solid_1.svg?v=1687246688"/ style="height: 17px;"><div>Reorder and get ${Math.abs(
        couponCode.value
      )}${couponCodeValue} off. Use coupon code<P style = "color:#d97d54;font-weight:bold;margin:0">${
        couponCode.title
      }</P></div></div></div>`;
    } else if (window.matchMedia("(min-width: 768px)").matches) {
      couponCodeMessage = `<div style="background-color:#f5f5f5;padding:0 15px;margin:10px 15px; border-radius: 5px;"><div style="font-size: 14px;margin: 0; display: flex; gap: 10px; align-items: center;"><img src="https://cdn.shopify.com/s/files/1/0555/4346/4122/files/bullhorn-solid_1.svg?v=1687246688"/ style="height: 17px;">Reorder and get ${Math.abs(
        couponCode.value
      )}${couponCodeValue} off. Use coupon code<P style = "color:#d97d54;font-weight:bold">${
        couponCode.title
      }</P></div></div>`;
    }
  } else {
    couponCodeMessage = `<div><h1 style="background-color:#f5f5f5;padding:10px 15px;margin:10px 15px; border-radius: 5px;font-size: 14px">No coupon available</h1></div>`;
  }

  for (let i = 0; i < trs.length; i++) {
    let lineItems = orders[i].lineItems || [];
    const orderId = orders[i].orderId;
    let itemsButton = document.createElement("button");
    var buttonSettings = await fetchReorderSettingsData();
    if (buttonSettings.button_settings !== "") {
      buttonSettings = JSON.parse(buttonSettings.button_settings);
    }
    itemsButton.textContent = ` ${
      buttonSettings.buttonText ? buttonSettings.buttonText : "Reorder"
    }`;
    itemsButton.style.cssText = `
      margin: ${
        buttonSettings?.margin ? buttonSettings.margin + "px" : "10px 0"
      };
      background-color: ${buttonSettings.backgroundColor};
      padding: ${buttonSettings.padding ? buttonSettings.padding + "px" : "0"};
      color: ${
        buttonSettings.textColor ? buttonSettings.textColor + "px" : "0"
      };
      border-radius: ${
        buttonSettings.borderRadius ? buttonSettings.borderRadius + "px" : "0"
      };
    `;

    let popup = document.createElement("div");
    popup.style.cssText =
      "display: none; position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.3); z-index: 9999;";

    let popupContainer = document.createElement("div");
    popupContainer.classList.add("popupContainer");
    popup.appendChild(popupContainer);
    //here popup style
    popupContainer.innerHTML = `<div style="background-color:#f7f7f7;display:flex; justify-content: space-between;align-items: center;padding: 10px 20px;"><h1 style="font-size:20px;font-weight: 500;margin: 0;">Select products to Reorder
</h1> <button style="height:30px ;border: none;background: none;cursor: pointer;" id="closeButton"> &#x2716;</button> <div></div></div><div><h1 style="font-size: 16px;margin: 0;">${couponCodeMessage}</h1></div>`;

    function handleMobileQueryChange(mobileQuery) {
      if (mobileQuery.matches) {
        popupContainer.style.cssText =
          "background-color:white; width:auto; margin:auto;position: fixed;left: 20px; bottom: 20px; right: 20px;";
      } else {
        popupContainer.style.cssText =
          "background-color:white; width:600px; margin:auto;position: fixed;top: 20%;left: 30%";
      }
    }
    mobileMediaQuery.addListener(handleMobileQueryChange);
    handleMobileQueryChange(mobileMediaQuery);
    let productDetailsContainer = document.createElement("div");
    productDetailsContainer.classList.add("productDetailsContainer");
    productDetailsContainer.style.maxHeight = "270px";
    productDetailsContainer.style.padding = "0 15px";
    productDetailsContainer.style.overflowY = "auto";
    productDetailsContainer.setAttribute("data-reorder-id", orderId);
    popupContainer.appendChild(productDetailsContainer);
    var totalOrderSummary = document.createElement("div");
    totalOrderSummary.classList.add("reorder-total-price" + orderId);
    let parentElement = productDetailsContainer.parentNode;
    parentElement.insertBefore(
      totalOrderSummary,
      productDetailsContainer.nextSibling
    );
    function createPopupHandler(linItems) {
      return function () {
        for (let j = 0; j < linItems.length; j++) {
          const lineItem = linItems[j];
          document.body.appendChild(popup);
          popup.style.display = "block";
          const productDetails = document.createElement("div");
          productDetails.classList.add("reorder-product-card");
          let productImg = lineItem.product.image.src;
          productDetailsContainer.appendChild(productDetails);
          productDetails.setAttribute("data-total", lineItem.price);
          productDetails.setAttribute("data-reorder-variant-id", lineItem.id);

          //products detail for reorder
          function handleMobileQueryChange(mobileQuery) {
            if (mobileQuery.matches) {
              productDetails.innerHTML = `<div style="border:1px solid #f1efef;margin:10px 0;padding: 10px; display:flex;gap: 20px;align-items: center;"><div style="border: 1px solid #f1efef;"><img src="${productImg}" alt="Image" style ="width:75px;height: 50px;margin-top: 10px;"></div><div> <h2 style="margin: 0;font-size:14px; font-weight: 600;">${lineItem.title}</h2><h2 style="margin: 0;font-size:14px; font-weight: 600; padding: 5px 0" class="product-price" data-price="${lineItem.price}">${lineItem.price} ${currencyCode}</h2><div><div style="display:flex; gap:20px;align-items: center;"><div style="display:flex; gap:10px;align-items: center; border:1px solid #f1efef;height: 30px;border-radius: 4px;" ><button style="background: none;border: none; font-size:16px;cursor: pointer" onclick="handleDecrease(this,${lineItem.id}, ${lineItem.price})"  data-order-id="${orderId}"  data-variant-id="${lineItem.id}" data-variant-price="${lineItem.price}" class="decrease${j}">-</button> 
          <input  data-variant-id="${lineItem.id}" data-variant-price="${lineItem.price}" style="width:15px;text-align: center; border:none" type="text" class="quantity-input${j}" id="input-${lineItem.id}" value="1" readonly>
            <button onclick="handleIncrease(this,${lineItem.id}, ${lineItem.price})" data-order-id="${orderId}"  data-variant-id="${lineItem.id}" data-variant-price="${lineItem.price}" style="background: none;border: none; font-size:16px;cursor: pointer" class="increase${j} reorder-increase-btn">+</button>
         </div><div style="cursor: pointer;margin-top: 5px;" class = "variant-${lineItem.id}"> <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-trash"
            onclick="handleRemovebtn(this,${lineItem.id},)" data-order-id="${orderId}"  data-variant-id="${lineItem.id}"
            viewBox="0 0 16 16"
          >
            <path
              d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
            />
            <path
              fill-rule="evenodd"
              d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
            />
          </svg></div></div> </div>`;
            } else {
              productDetails.innerHTML = `<div style="border:1px solid #f1efef;margin:10px 0;padding: 10px; display:flex;justify-content: space-between;align-items: center;"><div style="display:flex; gap:20px;align-items: center;"><div style="border: 1px solid #f1efef"><img src="${productImg}" alt="Image" style = "width: 75px;height: 50px; margin-top: 10px;"></div> <h2 style="margin: 0;font-size:14px; font-weight: 600;">${lineItem.title}</h2></div><div style="display:flex; gap:20px;align-items: center;"><div style="display:flex; gap:10px;align-items: center; border:1px solid #f1efef;height: 30px;border-radius: 4px;" ><button style="background: none;border: none; font-size:16px;cursor: pointer" onclick="handleDecrease(this,${lineItem.id}, ${lineItem.price})"  data-order-id="${orderId}"  data-variant-id="${lineItem.id}" data-variant-price="${lineItem.price}" class="decrease${j}">-</button> 
          <input  data-variant-id="${lineItem.variant.id}" data-variant-price="${lineItem.price}" style="width:15px;text-align: center; border:none" type="text" class="quantity-input${j} reorder-product-input" id="input-${lineItem.id}" value="1" readonly>
            <button onclick="handleIncrease(this,${lineItem.id}, ${lineItem.price})" data-order-id="${orderId}"  data-variant-id="${lineItem.id}" data-variant-price="${lineItem.price}" style="background: none;border: none; font-size:16px;cursor: pointer" class="increase${j} reorder-increase-btn">+</button>
         </div><div style="cursor: pointer;margin-top: 5px;" class = "variant-${lineItem.id}"> <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-trash"
            onclick="handleRemovebtn(this,${lineItem.id})" data-order-id="${orderId}"  data-variant-id="${lineItem.id}"
            viewBox="0 0 16 16"
          >
            <path
              d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
            />
            <path
              fill-rule="evenodd"
              d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
            />
          </svg></div><h2 style="margin: 0;font-size:14px; font-weight: 600;" class="product-price" data-price="${lineItem.price}">${lineItem.price} ${currencyCode}</h2></div></div>`;
            }
          }
          mobileMediaQuery.addListener(handleMobileQueryChange);
          handleMobileQueryChange(mobileMediaQuery);
        }
        // products details with button
        const totalPrice = lineItems.reduce((iTM, lineItem) => {
          return iTM + Number(lineItem.price);
        }, 0);
        let totalPriceElement = document.querySelector(
          ".reorder-total-price" + orderId
        );
        totalPriceElement.innerHTML = `<div style="padding: 0 15px;"><h2 class="product-price" style="text-align:right;font-size: 16px;font-weight: 600;margin-bottom: 0px;">Order summary: ${totalPrice.toFixed(
          2
        )} ${currencyCode}</h2> <H4 style="text-align:right;font-size: 16px;margin: 0;">${
          lineItems.length
        } products</h4></div> <div style="display:flex;gap:10px;justify-content: end; margin-top:10px;padding: 20px 15px;background: #f7f7f7; ">
  <button onclick="handleReorderATC()" style="padding: 10px 15px;background-color: white;cursor: pointer;" class="btn">Add to cart</button>
<button onclick="handleReorderCheckOut()" style="padding: 10px 20px;background-color: #0289E5;color:white; border:none;cursor: pointer;">Checkout</button></div>`;
      };
    }
    popup.querySelector("#closeButton").addEventListener("click", () => {
      const productDetails = document.querySelectorAll(".reorder-product-card");
      productDetails.forEach(productDetail => {
        productDetail.innerHTML = "";
      });
      popup.style.display = "none";
    });
    itemsButton.addEventListener("click", createPopupHandler(lineItems));
    trs[i].appendChild(itemsButton);
  }
}

function handleIncrease(self, id, price) {
  const currentButton = self;
  const currentInput = currentButton.previousElementSibling;

  // total calculation here
  const quantity = parseInt(currentInput.value) + 1;

  const totalPrice = quantity * parseFloat(price);

  currentInput.value = quantity;

  const thisProductCard = document.querySelector(
    `[data-reorder-variant-id="${id}"]`
  );
  const orderId = currentButton.dataset.orderId;

  thisProductCard.setAttribute("data-total", totalPrice);
  updateTotalPrice(orderId);
}

function handleDecrease(self, id, price) {
  const currentButton = self;
  const currentInput = currentButton.nextElementSibling;

  // total calculation here
  let quantity = parseInt(currentInput.value);
  if (quantity > 1) {
    quantity = parseInt(currentInput.value) - 1;

    const totalPrice = quantity * parseFloat(price);

    currentInput.value = quantity;

    const thisProductCard = document.querySelector(
      `[data-reorder-variant-id="${id}"]`
    );
    const orderId = currentButton.dataset.orderId;

    thisProductCard.setAttribute("data-total", totalPrice);
    updateTotalPrice(orderId);
  }
}

function updateTotalPrice(orderId) {
  const allProductCardsContainer = document.querySelector(
    `[data-reorder-id="${orderId}"]`
  );

  const allProductCards = Array.from(
    allProductCardsContainer.querySelectorAll(".reorder-product-card")
  );
  const allPrices = allProductCards.map(card => Number(card.dataset.total));

  const totalPrice = allPrices.reduce((prev, next) => {
    return prev + next;
  }, 0);

  let totalPriceElement = document.querySelector(
    ".reorder-total-price" + orderId
  );
  if (totalPrice) {
    totalPriceElement.innerHTML = `<div><h2 class="product-price" style="text-align:right;font-size: 16px;font-weight: 600;margin-bottom: 0px;">Order summary: ${totalPrice.toFixed(
      2
    )} ${currencyCode}</h2><H4 style="text-align:right;font-size: 16px;margin: 0;">${
      allProductCards.length
    } products</h4></div><div style="display:flex;gap:10px;justify-content: end; margin-top:10px;padding: 20px 15px;background: #f7f7f7;  ">
  <button onclick="handleReorderATC()" style="padding: 10px 15px;background-color: white;cursor: pointer;" class="btn">Add to cart</button>
<button onclick="handleReorderCheckOut()" style="padding: 10px 20px;background-color: #0289E5;color:white; border:none;cursor: pointer;">Checkout</button></div>`;
  } else {
    totalPriceElement.innerHTML = `<div>No product found</div>`;
  }
}
// remove product button here
function handleRemovebtn(element) {
  const currentInput = document.querySelector("[data-order-id]");
  const orderId = currentInput.dataset.orderId;
  var productCard = element.closest(".reorder-product-card");
  if (productCard) {
    productCard.remove();
  }
  updateTotalPrice(orderId);
}
//Add to Cart button here
function handleReorderATC() {
  const allInputs = document.querySelectorAll(".reorder-product-input");
  const lineItems = [];
  allInputs?.forEach(input => {
    const quantity = Number(input.value);
    const id = Number(input.dataset.variantId);
    lineItems.push({ id, quantity });
  });
  const data = {
    items: lineItems,
  };
  fetch("/cart/add.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then(response => {
      console.log("Items added to cart:", response.json());
      window.location.href = "/cart";
    })
    .catch(error => {
      console.log("Error adding items to cart:", error);
    });
}
//Checkout button here
async function handleReorderCheckOut() {
  let couponCode = await fetchReorderSettingsData();
  couponCode = JSON.parse(couponCode.coupon_code);
  discountCode = couponCode?.title || null;
  const allInputs = document.querySelectorAll(".reorder-product-input");
  const lineItems = [];
  allInputs?.forEach(input => {
    const quantity = Number(input.value);
    const id = Number(input.dataset.variantId);
    lineItems.push({ id, quantity });
  });
  const data = {
    items: lineItems,
  };
  fetch("/cart/add.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then(response => {
      let url = `/checkout`;
      if (discountCode !== null) {
        let discountApplyUrl =
          "https://" + Shopify.shop + "/discount/" + discountCode;
        fetch(discountApplyUrl);
        window.location.href = url;
      } else {
        window.location.href = url;
      }
    })
    .catch(error => {
      console.log("Error adding items to cart:", error);
    });
}
