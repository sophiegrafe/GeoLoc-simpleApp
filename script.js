'use strict';

//Elements
let closeModal;
const sidebarText = document.querySelector('.sidebar__text');
const containerCountry = document.querySelector('.container__country--card');
const containerModal = document.querySelector('.modal');

const formLatLng = document.querySelector('.form__lat--lng');
const inputLat = document.querySelector('.input--latitude');
const inputLng = document.querySelector('.input--longitude');
const formCountryCity = document.querySelector('.form__country--city');
const inputCountry = document.querySelector('.input--country');
const inputCity = document.querySelector('.input--city');

// global variables
let map;
let mapEvent;

// functions

// handel modal for error --> will be replace by a notification popup later
function showModal(html) {
  containerModal.innerHTML = html;
  containerModal.classList.remove('hidden');
}

function hideModal() {
  containerModal.innerHTML = '';
  containerModal.classList.add('hidden');
}

function renderError(message = 'Something went wrong...', err = '') {
  const html = `
      <i class="icon__close">x</i>
      <p class="err__message">Error code: ${err}</p>
      <p class="custom__message">${message}</p>
   `;
  showModal(html);
  closeModal = document.querySelector('.icon__close');
  closeModal.addEventListener('click', () => hideModal());
}

async function getJSON(url, errorMsg = 'Something went wrong...') {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Code: ${response.status}</br>Message: ${errorMsg} `);

    return await response.json();
  } catch (err) {
    renderError();
  }
}

// Display all countries for the form <select>
function getCountriesOption() {}

// Interacting with the geoloc form.
function renderCountry(data, cssClass = '') {
  containerCountry.innerHTML = '';

  const { ...langs } = data.languages;
  let strLang = '';
  Object.entries(langs)
    .map(lang => lang[1])
    .forEach(lang => (strLang += `${lang} - `));

  const { ...currencies } = data.currencies;
  const [curCode, curObj] = Object.entries(currencies)[0];
  const html = ` 
    <img class="country__img" src="${data.flags[1]}" />
    <article class="country ${cssClass}">        
      <div class="country__data">
          <h3 class="country__name">${data.name.official}</h3>
          <h4 class="country__region">${data.region}</h4>
          <p class="country__row"><label class="country__row">Capital City:</label>${
            data.capital
          }</p>
          <p class="country__row"><label class="country__row">Language:</label>${strLang.slice(
            0,
            -2
          )}</p>
          <p class="country__row"><label class="country__row">Currency:</label>${curCode} - ${
    curObj.name
  } - ${curObj.symbol}</p>
      </div>
    </article>
    `;

  sidebarText.classList.add('hidden');
  containerCountry.classList.remove('hidden');
  containerCountry.insertAdjacentHTML('beforeend', html);
}

async function getCountry(lat, lng) {
  try {
    // Reverse coordonates
    const dataLocIQ = await getJSON(
      `https://us1.locationiq.com/v1/reverse.php?key=pk.54982b0c964f4bbbb941938ede0bdd5e&lat=${lat}&lon=${lng}&format=json`,
      'Problem reversing coordonates'
    );

    // Country data
    const dataCountry = await getJSON(
      `https://restcountries.com/v3/alpha/${dataLocIQ.address.country_code}`,
      'Problem fetching the country data'
    );

    renderCountry(dataCountry[0]);
  } catch (err) {
    renderError();
    // rethrow the error
    throw err;
  }
}

async function getCoordonates(cityOrCountryName) {
  try {
    const data = await getJSON(
      `https://restcountries.com/v3/name/${cityOrCountryName}`,
      'Could not get the coordonates'
    );
    const [lat, lng] = data[0].latlng;
    getCountry(lat, lng);
    addMarker(lat, lng);
    focusOnArea(lat, lng);
  } catch (err) {
    renderError();
  }
}

// App initialization
function getUserPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

function loadMap(position) {
  // get lat and lng destructuring object.
  const { latitude: lat, longitude: lng } = position.coords;
  const coords = [lat, lng];

  map = L.map('map').setView(coords, 1.5);

  // set theme and give attribution
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // set a circle area on browser geoloc coordonates.
  L.circle(coords, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    radius: 1000,
  })
    .addTo(map)
    .bindPopup("You're somewhere close to here");

  // get the country card when the map is clicked
  map.on('click', mapE => {
    const { lat, lng } = mapE.latlng;
    getCountry(lat, lng);
  });
}

function addMarker(lat, lng) {
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`latitude: ${lat} </br> longitude: ${lng}`)
    .openPopup();
}

function focusOnArea(lat, lng) {
  map.setView([lat, lng], 5, {
    animate: true,
    pan: {
      duration: 0.5,
    },
  });
}

function appInit() {
  getUserPosition().then(position => loadMap(position));
}

appInit();

// Events Handlers
formLatLng.addEventListener('submit', function (e) {
  e.preventDefault();
  const lat = +inputLat.value;
  const lng = +inputLng.value;
  getCountry(lat, lng);
  focusOnArea(lat, lng);
  addMarker(lat, lng);
});

formCountryCity.addEventListener('submit', function (e) {
  e.preventDefault();
  const country = inputCountry.value;
  const city = inputCity.value;

  if (!country && !city)
    renderError(
      'You need to fill at least one of those 2 fields : Country or City'
    );

  if ((country && city) || city) getCoordonates(city);

  if (country) getCoordonates(country);
});

containerCountry.addEventListener('click', () => {
  containerCountry.classList.add('hidden');
  sidebarText.classList.remove('hidden');
});
