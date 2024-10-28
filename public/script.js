const translations = {
    noResults: 'Nuk u gjetën rezultate.',
    searchResults: 'Rezultatet e kërkimit:',
    error: 'Ndodhi një gabim gjatë marrjes së të dhënave.',
    viewDetails: 'Shiko detajet',
    entityDetails: 'Detajet e subjektit',
    loading: 'Duke u ngarkuar...',
    errorLoadingDetails: 'Gabim në ngarkimin e detajeve.',
    previous: 'Prapa',
    next: 'Para',
    page: 'Faqja',
    of: 'nga',
    close: 'Mbyll',
    name: 'Emri:',
    otherName: 'Emri tjetër:',
    idNumber: 'Numri Unik Identifikues:',
    taxNumber: 'Numri Fiskal:',
    incorporationDate: 'Data e Regjistrimit:',
    address: 'Adresa:',
    phone: 'Telefoni:',
    email: 'E-Mail:',
    status: 'Statusi:',
    legalForm: 'Forma ligjore:',
    capital: 'Kapitali:',
    sourceUrl: 'Burimi URL:',
    sectors: 'Sektorët:',
    primaryActivities: 'Aktivitetet Primare:',
    secondaryActivities: 'Aktivitetet Sekondare:',
    otherActivities: 'Aktivitetet e tjera:',
    appName: 'Numratori i Bizneseve të Kosovës',
    alias: 'Emri tjetër:'
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    document.title = translations.appName;
    const headerElement = document.querySelector('header h1');
    if (headerElement) {
        headerElement.textContent = translations.appName;
    } else {
        console.error('Header element not found');
    }

    // Wait for a short time to allow for any dynamic content to load
    setTimeout(() => {
        const searchForm = document.getElementById('searchForm');
        console.log('Search form element:', searchForm);
        if (searchForm) {
            searchForm.addEventListener('submit', handleSearch);
            console.log('Event listener added to search form');
        } else {
            console.error('Search form not found');
        }

        // Log all form elements on the page
        const allForms = document.getElementsByTagName('form');
        console.log('All form elements:', allForms);

        // Log the entire document body
        console.log('Document body:', document.body.innerHTML);
    }, 1000); // Wait for 1 second

    // Add this line to attempt hiding the address bar
    hideAddressBar();
});

function handleSearch(e) {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.trim();
    fetchResults(query, 1);
}

async function fetchResults(query, page) {
    const apiUrl = 'https://aleph.occrp.org/api/2/entities';
    const params = new URLSearchParams({
        q: query,
        limit: '30',
        offset: ((page - 1) * 30).toString(),
        'filter:schema': 'Company',
        'filter:countries': 'xk',
        'filter:properties.name': query,
        'filter:properties.alias': query
    });

    try {
        const response = await fetch(`${apiUrl}?${params}`);
        const data = await response.json();
        console.log('API Response:', data);
        displayResults(data, page);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = `<p>${translations.error}</p>`;
    }
}

function displayResults(data, currentPage) {
    const resultsDiv = document.getElementById('results');
    const paginationDiv = document.getElementById('pagination');
    
    if (!data.results || data.results.length === 0) {
        resultsDiv.innerHTML = `<p>${translations.noResults}</p>`;
        paginationDiv.innerHTML = '';
        return;
    }

    let html = `<h2>${translations.searchResults}</h2>`;
    data.results.forEach(result => {
        const properties = result.properties || {};
        const officialName = result.name || properties.name || '-';
        const alias = properties.alias ? (Array.isArray(properties.alias) ? properties.alias.join(', ') : properties.alias) : '-';
        
        html += `
            <div class="result-item">
                <h3>${officialName}</h3>
                ${alias !== '-' ? `<p><strong>${translations.alias}:</strong> ${alias}</p>` : ''}
                <p><strong>${translations.idNumber}</strong> ${formatPropertyValue(properties.idNumber) || '-'}</p>
                <p><strong>${translations.incorporationDate}</strong> ${formatDate(properties.incorporationDate) || '-'}</p>
                <p><strong>${translations.address}</strong> ${formatPropertyValue(properties.address) || '-'}</p>
                <button onclick="showDetailsPopup('${result.id}')">${translations.viewDetails}</button>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;

    // Pagination
    const totalResults = data.total || data.results.length;
    const totalPages = Math.ceil(totalResults / 30);
    let paginationHtml = '';

    if (currentPage > 1) {
        paginationHtml += `<button onclick="fetchResults('${document.getElementById('searchInput').value}', ${currentPage - 1})">${translations.previous}</button>`;
    }

    paginationHtml += `<span>${translations.page} ${currentPage} ${translations.of} ${totalPages}</span>`;

    if (currentPage < totalPages) {
        paginationHtml += `<button onclick="fetchResults('${document.getElementById('searchInput').value}', ${currentPage + 1})">${translations.next}</button>`;
    }

    paginationDiv.innerHTML = paginationHtml;
}

function showDetailsPopup(entityId) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <button class="close-btn" onclick="closePopup()">&times;</button>
            <h2>${translations.entityDetails}</h2>
            <div id="entityDetails" class="entity-details">
                <div class="loader"></div>
                <p>${translations.loading}</p>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    fetchEntityDetails(entityId);
}

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) {
        document.body.removeChild(popup);
    }
}

async function fetchEntityDetails(entityId) {
    const apiUrl = `https://aleph.occrp.org/api/2/entities/${entityId}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayEntityDetails(data);
    } catch (error) {
        console.error('Error fetching entity details:', error);
        document.getElementById('entityDetails').innerHTML = translations.errorLoadingDetails;
    }
}

function displayEntityDetails(data) {
    const detailsDiv = document.getElementById('entityDetails');
    const properties = data.properties || {};

    const officialName = data.name || properties.name || '-';
    const alias = properties.alias ? (Array.isArray(properties.alias) ? properties.alias.join(', ') : properties.alias) : '-';

    let html = `
        <div class="entity-header">
            <h3>${officialName}</h3>
            <span class="entity-type">${data.schema || '-'}</span>
        </div>
        <div class="entity-info">
            <ul>
                <li><strong>${translations.name}</strong> ${officialName}</li>
                <li><strong>${translations.alias}</strong> ${alias}</li>
                <li><strong>${translations.idNumber}</strong> ${formatPropertyValue(properties.idNumber) || '-'}</li>
                <li><strong>${translations.taxNumber}</strong> ${formatPropertyValue(properties.taxNumber) || '-'}</li>
                <li><strong>${translations.incorporationDate}</strong> ${formatDate(properties.incorporationDate) || '-'}</li>
                <li><strong>${translations.address}</strong> ${formatPropertyValue(properties.address) || '-'}</li>
                <li><strong>${translations.phone}</strong> ${formatPropertyValue(properties.phone) || '-'}</li>
                <li><strong>${translations.email}</strong> ${formatPropertyValue(properties.email) || '-'}</li>
                <li><strong>${translations.status}</strong> ${formatPropertyValue(properties.status) || '-'}</li>
                <li><strong>${translations.legalForm}</strong> ${formatPropertyValue(properties.legalForm) || '-'}</li>
                <li><strong>${translations.capital}</strong> ${formatPropertyValue(properties.capital) || '-'}</li>
                <li><strong>${translations.sourceUrl}</strong> ${formatSourceUrl(properties.sourceUrl)}</li>
            </ul>
        </div>
        <div class="entity-sectors">
            <h4>${translations.sectors}</h4>
            ${formatSectors(properties.sector)}
        </div>
        <div id="map" class="map-container"></div>
    `;
    detailsDiv.innerHTML = html;

    initMap(properties.address);
}

function formatPropertyValue(value) {
    if (!value) return null;
    if (Array.isArray(value)) return value.filter(v => v).join(', ');
    return value;
}

function formatDate(dateValue) {
    if (!dateValue) return null;
    const date = new Date(Array.isArray(dateValue) ? dateValue[0] : dateValue);
    return isNaN(date.getTime()) ? null : date.toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatSourceUrl(url) {
    if (!url) return '-';
    const formattedUrl = Array.isArray(url) ? url[0] : url;
    return formattedUrl ? `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${formattedUrl}</a>` : '-';
}

function formatSectors(sectors) {
    if (!sectors || (Array.isArray(sectors) && sectors.length === 0)) return '<p>-</p>';
    const sectorArray = Array.isArray(sectors) ? sectors : [sectors];
    
    const primaryActivities = sectorArray.filter(sector => sector.includes('(Primarë)'));
    const secondaryActivities = sectorArray.filter(sector => sector.includes('(Sekondarë)'));
    const otherActivities = sectorArray.filter(sector => !sector.includes('(Primarë)') && !sector.includes('(Sekondarë)'));

    const formattedSectors = [
        ...formatActivityGroup(primaryActivities, translations.primaryActivities),
        ...formatActivityGroup(secondaryActivities, translations.secondaryActivities),
        ...formatActivityGroup(otherActivities, translations.otherActivities)
    ];

    return formattedSectors.join('') || '<p>-</p>';
}

function formatActivityGroup(activities, groupTitle) {
    if (activities.length === 0) return [];

    const formattedActivities = activities.map(sector => {
        const match = sector.match(/^(\d+)\s*[-—]\s*(.*?)\s*(?:\((?:Primarë|Sekondarë)\))?$/);
        if (match) {
            const [, code, description] = match;
            return `<li><strong>${code}</strong> - ${escapeHtml(description)}</li>`;
        }
        return `<li>${escapeHtml(sector)}</li>`;
    });

    return [`
        <h5>${groupTitle}</h5>
        <ul>
            ${formattedActivities.join('')}
        </ul>
    `];
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function parseAddress(address) {
    console.log('Original address:', address);
    if (typeof address !== 'string') {
        if (Array.isArray(address)) {
            address = address.join(', ');
        } else if (typeof address === 'object' && address !== null) {
            address = Object.values(address).join(', ');
        } else {
            console.error('Unexpected address format:', address);
            return null;
        }
    }

    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length >= 2) {
        const city = parts[0];
        const fullAddress = address;
        return { city, fullAddress };
    } else if (parts.length === 1) {
        return { city: parts[0], fullAddress: parts[0] };
    }
    
    return null;
}

async function searchLocation(query) {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=XK&limit=1`);
    const data = await response.json();
    console.log(`Geocoding response for "${query}":`, data);
    
    if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    
    return null;
}

async function getCoordinates(address) {
    if (!address) return null;

    const { city, fullAddress } = address;
    
    console.log('Searching for full address:', fullAddress);
    const fullAddressCoordinates = await searchLocation(fullAddress + ', Kosovo');
    if (fullAddressCoordinates) {
        console.log('Full address coordinates found:', fullAddressCoordinates);
        return fullAddressCoordinates;
    }
    
    console.log('Full address not found. Searching for city:', city);
    const cityCoordinates = await searchLocation(city + ', Kosovo');
    if (cityCoordinates) {
        console.log('City coordinates found:', cityCoordinates);
        return cityCoordinates;
    }
    
    console.log('No coordinates found for address or city');
    return null;
}

async function initMap(address) {
    if (!address) return;

    const map = L.map('map').setView([42.6026, 20.9030], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    try {
        const parsedAddress = parseAddress(address);
        console.log('Parsed address:', parsedAddress);
        if (parsedAddress) {
            const coordinates = await getCoordinates(parsedAddress);
            if (coordinates) {
                L.marker(coordinates).addTo(map);
                map.setView(coordinates, 16);
            } else {
                console.log('No coordinates found, showing default view of Kosovo');
            }
        } else {
            console.log('Could not parse address, showing default view of Kosovo');
        }
    } catch (error) {
        console.error('Error getting coordinates:', error);
    }
}

// Add this code at the end of your existing JavaScript

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallPrompt();
});

function showInstallPrompt() {
  const installPrompt = document.createElement('div');
  installPrompt.classList.add('install-prompt');
  installPrompt.textContent = 'Instaloni aplikacionin për përdorim offline';
  
  const installButton = document.createElement('button');
  installButton.textContent = 'Instalo';
  installButton.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
    installPrompt.remove();
  });
  
  installPrompt.appendChild(installButton);
  document.body.appendChild(installPrompt);
}

// Add this function at the end of your script.js file
function hideAddressBar() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) { // Firefox
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
        document.documentElement.msRequestFullscreen();
    }
}

// Also try to hide the address bar when the user taps the screen
document.addEventListener('touchend', hideAddressBar);
