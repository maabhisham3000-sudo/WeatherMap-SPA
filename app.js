// OpenWeatherMap API Key
const API_KEY = '60d4a32584594bbff7c9524cfad639ec';

// Initialize Map centered on Khartoum, Sudan (Phase 1)
const map = L.map('map').setView([15.5007, 32.5599], 10);

// Add standard OpenStreetMap tile layer (Free, stable, no API key required)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentMarker = null;

// DOM Elements
const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const spinner = document.getElementById('loading-spinner');
const alertContainer = document.getElementById('alert-container');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const forecastContainer = document.getElementById('forecast-container');

// Dark Mode Toggle Logic
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        darkModeToggle.textContent = '☀️ Light Mode';
        darkModeToggle.classList.replace('btn-outline-dark', 'btn-outline-light');
    } else {
        darkModeToggle.textContent = '🌙 Dark Mode';
        darkModeToggle.classList.replace('btn-outline-light', 'btn-outline-dark');
    }
});

// Core function to fetch weather and 5-day forecast by Coordinates
async function fetchWeatherByCoords(lat, lon, customCityName = null) {
    clearAlerts();
    showSpinner(true);
    forecastContainer.innerHTML = '';

    try {
        let name = customCityName;

        // Current Weather Fetch API
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) throw new Error('Failed to fetch current weather data.');
        const weatherData = await weatherResponse.json();
        
        if (!name) {
            name = weatherData.name;
        }

        // 5-Day Forecast Fetch API
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) throw new Error('Failed to fetch forecast data.');
        const forecastData = await forecastResponse.json();

        // Map Center & Marker Animation
        map.setView([lat, lon], 12, { animate: true, duration: 1.5 });
        if (currentMarker) map.removeLayer(currentMarker);
        currentMarker = L.marker([lat, lon]).addTo(map);

        const temp = Math.round(weatherData.main.temp);
        const description = weatherData.weather[0].description;
        const iconCode = weatherData.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const humidity = weatherData.main.humidity;
        const windSpeed = weatherData.wind.speed;

        const popupContent = document.createElement('div');
        popupContent.style.textAlign = 'center';
        popupContent.style.minWidth = '150px';
        popupContent.innerHTML = `
            <h6 style="margin-bottom: 5px; font-weight: bold;">${name}</h6>
            <img src="${iconUrl}" alt="Weather Icon" style="width: 50px; height: 50px; margin: 0;">
            <h3 style="margin: 0; font-weight: bold;">${temp}°C</h3>
            <p style="margin: 5px 0; text-transform: capitalize; font-size: 0.9rem;">${description}</p>
            <hr style="margin: 5px 0;">
            <small style="display: block; font-size: 0.8rem; color: #555;">Humidity: ${humidity}% | Wind: ${windSpeed} m/s</small>
            <button id="share-btn" class="btn btn-sm btn-primary mt-2" style="font-size: 0.75rem;">Share Weather</button>
        `;

        // Share button logic (Real Clipboard Copy Fallback)
        const shareBtn = popupContent.querySelector('#share-btn');
        shareBtn.addEventListener('click', () => {
            const shareText = `Current weather in ${name}: ${temp}°C, ${description}. Checked via WeatherMap SPA!`;
            
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    shareBtn.textContent = 'Copied Successfully!';
                    shareBtn.classList.remove('btn-primary');
                    shareBtn.classList.add('btn-success');
                    
                    setTimeout(() => {
                        shareBtn.textContent = 'Share Weather';
                        shareBtn.classList.remove('btn-success');
                        shareBtn.classList.add('btn-primary');
                    }, 2000);
                } else {
                    alert('Copy failed.');
                }
            } catch (err) {
                alert('Browser does not support automatic copying.');
            }
            
            document.body.removeChild(textarea);
        });

        currentMarker.bindPopup(popupContent).openPopup();

        // Render 5-Day Forecast Cards
        const dailyForecasts = forecastData.list.filter(item => item.dt_txt.includes('12:00:00'));
        
        dailyForecasts.forEach(day => {
            const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const dayTemp = Math.round(day.main.temp);
            const dayDesc = day.weather[0].description;
            const dayIcon = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;

            const card = document.createElement('div');
            card.className = 'col';
            card.innerHTML = `
                <div class="card text-center p-2 shadow-sm h-100 forecast-card">
                    <small class="text-muted fw-bold">${date}</small>
                    <img src="${dayIcon}" alt="Icon" class="mx-auto" style="width: 45px; height: 45px;">
                    <span class="fw-bold fs-5">${dayTemp}°C</span>
                    <small class="text-muted text-capitalize" style="font-size: 0.75rem;">${dayDesc}</small>
                </div>
            `;
            forecastContainer.appendChild(card);
        });

    } catch (error) {
        showAlert(error.message);
    } finally {
        showSpinner(false);
    }
}

// Function to fetch weather by City Name (Smart Name Extractor)
async function fetchWeatherByCity(cityName) {
    clearAlerts();
    showSpinner(true);

    try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            throw new Error(`Location "${cityName}" not found. Please check the spelling.`);
        }

        const lat = parseFloat(geoData[0].lat);
        const lon = parseFloat(geoData[0].lon);
        
        const fullName = geoData[0].display_name;
        let parts = fullName.split(',').map(p => p.trim());
        
        let cleanName = parts[0];
        if (/^\d+$/.test(cleanName) && parts.length > 1) {
            let validPart = parts.find(p => !/^\d+$/.test(p));
            cleanName = validPart || parts[1] || cityName;
        } else if (!cleanName || /^\d+$/.test(cleanName)) {
            cleanName = cityName;
        }

        await fetchWeatherByCoords(lat, lon, cleanName);

    } catch (error) {
        showAlert(error.message);
        showSpinner(false);
    }
}

// Form Submit Event Listener
weatherForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cityName = cityInput.value.trim();
    if (!cityName) return;
    fetchWeatherByCity(cityName);
});

// Helper Functions for UI states
function showSpinner(show) {
    if (show) spinner.classList.remove('d-none');
    else spinner.classList.add('d-none');
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

// Default initial marker on Khartoum when page loads
window.addEventListener('DOMContentLoaded', () => {
    const khartoumLat = 15.5007;
    const khartoumLon = 32.5599;
    currentMarker = L.marker([khartoumLat, khartoumLon]).addTo(map);
    currentMarker.bindPopup("<b>Khartoum</b><br>Default Location. Search any city to see forecast!").openPopup();
});