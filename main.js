let coinsArray = [];
let Chartinterval;

(function () {
  $(function () {
    //Before getting the information from the API
    clearInterval(Chartinterval);
    $(".loader").show();
    $("#errorMsg").hide();

    let url = "https://api.coingecko.com/api/v3/coins";
    //Got the information from the API
    $.get(url)
      .then((coins) => {
        coinsArray = coins;
        showCoins(coins);
        $(".loader").hide();
      })
      .catch((e) => {
        alert("Failed connecting to the server !");
        console.error(e);
      });
  });
})();

function showCoins(coins) {
  for (let i = 0; i < coins.length; i++) {
    showCoinInUi(coins[i]);
    getMoreInfoAboutCoin(coins[i].id);
  }
}

function showCoinInUi(coin) {
  let coinDivHtml = $(`
            <div class="col-sm" id="${coin.symbol.toUpperCase()}">
                <div class="coinCard">
                    <div id="symbolAndCheckBox">
                        <h1 id="coinSymbol"> ${coin.symbol} </h1>
                        <label class="switch">
                        <input type="checkbox" id="check${coin.symbol.toUpperCase()}" onchange="onToggleClick(this,'${coin.symbol.toUpperCase()}')"></input>
                        <span class="slider round"></span>
                        </label>
                    </div>
                    <h1 id="coinName"> ${coin.name} </h1>
                    <div class="moreInfoDiv">
                        <button class="moreInfo collapsed" aria-expanded="false" id="moreInfo${coin.id
    }" 
                        data-toggle="collapse" data-target="#${coin.id}">
                        </button>
                        <div class="spinner-border" id="loader${coin.id}"></div>
                        </div>
                        <div class="infoDiv collapse show" id="open${coin.id}">
                        <div class="card collapse in" id="${coin.id}"></div>
                    </div>
                </div>
            </div>`);
  $("#mainContainer").append(coinDivHtml);
}

let coinsMapToCurrencies = new Map();
function getMoreInfoAboutCoin(coinId) {
  $(`#moreInfo${coinId}`).on("click", function () {
    //Check if the coin is in the map.(if yes, take the information from there)
    if (coinsMapToCurrencies.has(coinId)) {
      let coin = coinsMapToCurrencies.get(coinId);
      //Here we take the Info from the Cache
      showMoreInfoInCoinCard(coin, coinId);
    }

    //if its not in the map, make another AJAX req, and show the updated currencies.
    else {
      $(`#loader${coinId}`).show();
      $.get(`https://api.coingecko.com/api/v3/coins/${coinId}`)
        .then((result) => {
          $(`#loader${coinId}`).hide();

          let img = result.image.thumb;
          let ils = result.market_data.current_price.ils;
          let eur = result.market_data.current_price.eur;
          let usd = result.market_data.current_price.usd;

          coin = { img, ils, eur, usd };
          //Here we take the Info from the API
          showMoreInfoInCoinCard(coin, coinId);
          coinsMapToCurrencies.set(result.id, coin);

          //After 2 minutes remove the coin from the map (to get new information from ajax).
          setTimeout(() => coins.delete(result.id), 120000);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  });
}

function showMoreInfoInCoinCard(coin, coinId) {
  $(`#${coinId}.card`).html(`
                    <div class="prices">
                    <img src="${coin.img}"><br>
                    <span><i class="fas fa-shekel-sign"></i> ${coin.ils}</span><br>
                    <span><i class="fas fa-dollar-sign"></i> ${coin.usd}</span><br>
                    <span><i class="fas fa-euro-sign"></i> ${coin.eur}</span>
                    </div`);
}

let selectedCoins = [];
let selectedToggleIds = [];
function onToggleClick(currenttoggle, coinName) {
  let toggleId = currenttoggle.id;

  let SymbolCoinIndex = selectedCoins.indexOf(coinName);
  let indexToggleId = selectedToggleIds.indexOf(toggleId);

  if (SymbolCoinIndex != -1) {
    selectedCoins.splice(SymbolCoinIndex, 1);
    updateCoinSpan();
    selectedToggleIds.splice(indexToggleId, 1);
  } else {
    if (selectedCoins.length < 5) {
      selectedCoins.push(coinName);
      updateCoinSpan();
      selectedToggleIds.push(toggleId);
    } else {
      $("#modalbody").empty();
      $(`#${toggleId}`).prop("checked", false);

      $("#modalbody").html(
        'To add the "<b>' +
        coinName +
        '</b>" coin, you must unselect one of the following: <br>'
      );
      $("#mymodal").css("display", "block");

      $("#keepcurrent").on("click", () => {
        $("#mymodal").css("display", "none");
      });

      let counterId = 1;

      for (let i = 0; i < selectedCoins.length; i++) {
        $("#modalbody").append(
          `
                <div id="modalCoinDiv">
                    <div class="card" id="modalcard">
                        <div class="card-body" id="modalcardbody">
                        <div class="nameAndToggle">
                            <h6 id="modalcoinname" class="card-title">${selectedCoins[i]}</h6>
                            
                            <label class="switch" id="modalswitch">
                             <input type="checkbox" class="checkboxes" id="chosenToggle${counterId}"> <span class="slider round" id="modalslider"></span>
                            </label>
                            </div>

                            </div>

                        </div>
                    </div>
                </div>
           `
        );

        $(`#chosenToggle${counterId}`).prop("checked", true);
        $(`#chosenToggle${counterId}`).on("change", () => {
          let indexCoinRemove = selectedCoins.indexOf(selectedCoins[i]);
          let ToggleTofalse = selectedToggleIds[indexCoinRemove];
          selectedCoins.splice(indexCoinRemove, 1);
          updateCoinSpan();

          selectedToggleIds.splice(indexCoinRemove, 1);
          selectedCoins.push(coinName);
          updateCoinSpan();

          selectedToggleIds.push(toggleId);
          $("#mymodal").css("display", "none");
          $(`#${ToggleTofalse}`).prop("checked", false);
          checkIfCoinIsToggled();
        });
        counterId++;
      }
    }
  }
}

function checkIfCoinIsToggled() {
  for (let i = 0; i < selectedToggleIds.length; i++) {
    $(`#${selectedToggleIds[i]}`).prop("checked", true);
  }
}

//Instant search function (by coin ID or coin full Name).
$("#search-input").on("keyup", function (e) {
  clearInterval(Chartinterval);
  const value = e.target.value;
  let filteredCoins = coinsArray.filter((coin) => {
    return coin.symbol.includes(value) || coin.id.includes(value);
  });
  console.log(filteredCoins);
  showCoinsFromSearch(filteredCoins);
});

let showCoinsFromSearch = (coins) => {
  let htmlString = coins
    .map((coin) => {
      return `
            <div class="col-sm" id="${coin.symbol.toUpperCase()}">
                <div class="coinCard">
                    <div id="symbolAndCheckBox">
                        <h1 id="coinSymbol"> ${coin.symbol} </h1>
                        <label class="switch">
                        <input type="checkbox" id="check${coin.symbol.toUpperCase()}" onchange="onToggleClick(this,'${coin.symbol.toUpperCase()}')"></input>
                        <span class="slider round"></span>
                        </label>
                    </div>
                    <h1 id="coinName"> ${coin.name} </h1>
                    <div class="moreInfoDiv">
                        <button class="moreInfo collapsed" id="moreInfo${coin.id
        }" 
                        data-toggle="collapse" data-target="#${coin.id}">
                        </button>
                    </div>
                    <div class="infoDiv collapse show" id="open${coin.id}">
                        <div class="card collapse in" id="${coin.id}"></div>
                    </div>
                </div>
                </div>`;
    })
    .join("");
  if (coins.length == 0) {
    $("#mainContainer").html(
      `<div class="notFoundCoin">Not found any coin with this name.</div>`
    );
    return;
  }
  $("#mainContainer").html(htmlString);

  for (let i = 0; i < coins.length; i++) {
    getMoreInfoAboutCoin(coins[i].id);
  }
  checkIfCoinIsToggled();
};

// When the user clicks on the button, scroll to the top of the document
function scrollTotopFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

//Navbar Callbacks
function onHomeClicked() {
  showHomePage();
  let coinsToShow = showCoins(coinsArray);
  checkIfCoinIsToggled();
  $("#mainContainer").append(coinsToShow);
}

function onLiveReportsClicked() {
  clearInterval(Chartinterval);

  if (selectedCoins == 0) {
    $("#errorMsg").fadeIn("slow");
    $("#errorMsg").html(
      `<div id="errorContainer">
        <div id="errorBody">
        <span>You must select at least one coin !</span>
        <button onclick="cancel()" id="errorBtn">Cancel</button>
        </div>
       </div>`
    );
    return;
  }
  showLiveReportsPage();

  let firstCoinSelected = [];
  let secondCoinSelected = [];
  let thirdCoinSelected = [];
  let fourthCoinSelected = [];
  let fifthCoinSelected = [];
  let coinKeysArray = [];

  Chartinterval = setInterval(() => {
    getDataFromApi();
  }, 2000);

  function getDataFromApi() {
    let url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${selectedCoins[0]},${selectedCoins[1]},${selectedCoins[2]},${selectedCoins[3]},${selectedCoins[4]}&tsyms=USD`;
    $.get(url).then((result) => {
      $(`#mainContainer`).html(
        `<div id="chartContainer" style="height: 450px; width: 100%;"></div>`
      );
      let currentDate = new Date();
      let coinCounter = 1;
      for (let key in result) {
        if (coinCounter == 1) {
          firstCoinSelected.push({ x: currentDate, y: result[key].USD });
          coinKeysArray.push(key);
        }
        if (coinCounter == 2) {
          secondCoinSelected.push({ x: currentDate, y: result[key].USD });
          coinKeysArray.push(key);
        }
        if (coinCounter == 3) {
          thirdCoinSelected.push({ x: currentDate, y: result[key].USD });
          coinKeysArray.push(key);
        }
        if (coinCounter == 4) {
          fourthCoinSelected.push({ x: currentDate, y: result[key].USD });
          coinKeysArray.push(key);
        }
        if (coinCounter == 5) {
          fifthCoinSelected.push({ x: currentDate, y: result[key].USD });
          coinKeysArray.push(key);
        }
        coinCounter++;
      }

      createChart();
      $(".loader").hide();
    });
  }

  function createChart() {
    let options = {
      exportEnabled: false,
      animationEnabled: false,
      showInLegend: true,
      title: {
        text: "Crypto coins currencies",
      },
      axisX: {
        title: "Time",
        ValueFormatString: "HH:mm:ss",
      },
      axisY: {
        title: "Currency Value",
        suffix: "$",
        titleFontColor: "#4F81BC",
        lineColor: "#4F81BC",
        labelFontColor: "#4F81BC",
        tickColor: "#4F81BC",
        includeZero: true
      },
      toolTip: {
        shared: true,
      },
      data: [
        {
          type: "spline",
          name: coinKeysArray[0],
          showInLegend: true,
          xValueFormatString: "HH:mm:ss",
          dataPoints: firstCoinSelected,
        },
        {
          type: "spline",
          name: coinKeysArray[1],
          showInLegend: true,
          xValueFormatString: "HH:mm:ss",
          dataPoints: secondCoinSelected,
        },
        {
          type: "spline",
          name: coinKeysArray[2],
          showInLegend: true,
          xValueFormatString: "HH:mm:ss",
          dataPoints: thirdCoinSelected,
        },
        {
          type: "spline",
          name: coinKeysArray[3],
          showInLegend: true,
          xValueFormatString: "HH:mm:ss",
          dataPoints: fourthCoinSelected,
        },
        {
          type: "spline",
          name: coinKeysArray[4],
          showInLegend: true,
          xValueFormatString: "HH:mm:ss",
          dataPoints: fifthCoinSelected,
        },
      ],
    };
    $("#chartContainer").CanvasJSChart(options);
    $("#mainContainer").append(options);
    $("#mainContainer").css("margin-top", "150px");

  }
}

function onAboutClicked() {
  showAboutPage();
}

function showHomePage() {
  $("#logo").removeClass("fixedToTop");
  $("#logo").hide();
  $("#logo").fadeIn("slow");
  $("#search-input").hide();
  $("#clearAllToggleBtn").show();
  $(".icon").show();
  $("#search-input").fadeIn("slow");
  clearInterval(Chartinterval);
  $("#search-input").show();
  $(`.aboutWrapper`).empty();
  $(`#mainContainer`).empty();
  $(`#mainContainer`).hide();
  $(`#mainContainer`).fadeIn("slow");
  showClickedBtn("#home", "#liveReports", "#aboutt");
  $("#mainContainer").css("margin-top", "0px");
}

function showLiveReportsPage() {
  $("#search-input").hide();
  $("#logo").addClass("fixedToTop");
  $("#clearAllToggleBtn").hide();
  $(".icon").hide();
  showClickedBtn("#liveReports", "#home", "#aboutt");
  $("#errorMsg").html("");
  $(".loader").show();
  $(`#mainContainer`).empty();
}

function showAboutPage() {
  clearInterval(Chartinterval);
  $("#logo").addClass("fixedToTop");
  $("#search-input").hide();
  $("#clearAllToggleBtn").hide();
  $(".icon").hide();
  showClickedBtn("#aboutt", "#home", "#liveReports");
  $("#mainContainer").css("margin-top", "150px");

  $("#mainContainer").empty();
  $(`#mainContainer`).hide();
  $(`#mainContainer`).fadeIn("slow");
  $("#mainContainer").html(`<div class="aboutWrapper">
      <div id="aboutContainer">
        <div class="headline">
        <div id="aboutImgDiv"><img id="aboutImg" src="aboutIMG.jpg" width="300px"></div><br>
          <h3>About myself:</h3>
        </div>
        <div class="aboutBody">
          <p>
            My name is Yair, im 21 years old.<br>
            lives in Porat, I study at John Bryce. love and breath the WEB,<br>
            this is my second project about crypto currencies,<br>
            in this project you will find techniqes like AJAX, jQuery, and API
          </p>
        </div>

      </div>
    </div>`);
}

function updateCoinSpan() {
  let coinspandata = "";
  for (let i = 0; i < selectedCoins.length; i++) {
    if (i == selectedCoins.length - 1) {
      coinspandata += selectedCoins[i];
    } else {
      coinspandata += selectedCoins[i] + ", ";
    }
  }
  $("#selectedcoins").html("Selected coins: " + coinspandata);
}

function showClickedBtn(id, idToHide, idToHide2) {
  $(id).css("background-color", "#669cff");
  $(id).css("color", "white");

  $(idToHide).css("background-color", "white");
  $(idToHide).css("color", "black");

  $(idToHide2).css("background-color", "white");
  $(idToHide2).css("color", "black");
}


window.addEventListener("scroll", function () {
  if (window.scrollY > 170) {
    $("#myBtn").css("display", "block");
    $("#search-input").css("margin-top", "210px");
    $(".icon").css("margin-top", "205px");
    $("#logo").addClass("fixedToTop");
  } else {
    $("#myBtn").css("display", "none");
    $("#logo").removeClass("fixedToTop");
    $("#search-input").css("margin-top", "25px");
    $(".icon").css("margin-top", "20px");
  }
});

function cancel() {
  $("#errorMsg").fadeOut("slow");
}

$("#clearAllToggleBtn").click(() => {
  $(`input`).prop("checked", false);
  selectedCoins = [];
  selectedToggleIds = [];
  updateCoinSpan();
});
