// OpenWeatherMap API Key (استبدل هذا المفتاح بمفتاحك الشخصي بعد التسجيل في موقع OpenWeatherMap)
const API_KEY = '60d4a32584594bbff7c9524cfad639ec';

// Initialize Map centered on Khartoum, Sudan (Phase 1)
const map = L.map('map').setView([15.5007, 32.5599], 6);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentMarker = null;

// DOM Elements
const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const spinner = document.getElementById('loading-spinner');
const alertContainer = document.getElementById('alert-container');

// Form Submit Event Listener (Prevent Default behavior - SPA Rule)
weatherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    clearAlerts();
    showSpinner(true);

    try {
        // Phase 2: Asynchronous Geocoding using Nominatim API
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            throw new Error(`Location "${cityName}" not found. Please check the spelling.`);
        }

        const lat = parseFloat(geoData[0].lat);
        const lon = parseFloat(geoData[0].lon);

        // Phase 3: OpenWeatherMap Fetch API
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather data. Check your API key or network.');
        }

        const weatherData = await weatherResponse.json();

        // Phase 4: Map Center & Marker Animation
        map.setView([lat, lon], 12, {
            animate: true,
            duration: 1.5
        });

        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        currentMarker = L.marker([lat, lon]).addTo(map);

        // Phase 5: Info Window Render & Share Feature
        const temp = Math.round(weatherData.main.temp);
        const description = weatherData.weather[0].description;
        const iconCode = weatherData.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const humidity = weatherData.main.humidity;
        const windSpeed = weatherData.wind.speed;
        const name = weatherData.name;

        const popupContent = `
            <div style="text-align: center; min-width: 150px;">
                <h6 style="margin-bottom: 5px; font-weight: bold;">${name}</h6>
                <img src="${iconUrl}" alt="Weather Icon" style="width: 50px; height: 50px; margin: 0;">
                <h3 style="margin: 0; font-weight: bold;">${temp}°C</h3>
                <p style="margin: 5px 0; text-transform: capitalize; font-size: 0.9rem;">${description}</p>
                <hr style="margin: 5px 0;">
                <small style="display: block; font-size: 0.8rem; color: #555;">Humidity: ${humidity}% | Wind: ${windSpeed} m/s</small>
                <button onclick="shareWeather('${name}', '${temp}', '${description}')" class="btn btn-sm btn-primary mt-2" style="font-size: 0.75rem;">Share Weather</button>
            </div>
        `;

        currentMarker.bindPopup(popupContent).openPopup();

    } catch (error) {
        showAlert(error.message);
    } finally {
        showSpinner(false);
    }
});

// Helper Functions for UI states
function showSpinner(show) {
    if (show) {
        spinner.classList.remove('d-none');
    } else {
        spinner.classList.add('d-none');
    }
}

function showAlert(message) {
    alertContainer.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

function clearAlerts() {
    alertContainer.innerHTML = '';
}

// Global Share function for the InfoWindow button (Bonus Feature)
window.shareWeather = function(city, temp, desc) {
    const shareText = `Current weather in ${city}: ${temp}°C, ${desc}. Checked via WeatherMap SPA!`;
    if (navigator.share) {
        navigator.share({
            title: 'Weather Info',
            text: shareText
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Weather info copied to clipboard!');
    }
};"// v2"  
"// v3"  
"// v4"  
"// v5"  
