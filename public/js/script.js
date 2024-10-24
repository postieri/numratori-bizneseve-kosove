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
    name: 'Emri zyrtar:',
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
    searchInputPlaceholder: 'Shkruani emrin e biznesit, qytetin, numrin e telefonit ose email-in',
};

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    document.title = translations.appName;
    updateHeaderTitle();
    setupSearchForm();
}

function updateHeaderTitle() {
    const headerElement = document.querySelector('header h1');
    if (headerElement) {
        headerElement.textContent = translations.appName;
    }
}

function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    } else {
        console.error('Formulari i kërkimit nuk u gjet');
    }

    const searchInput = document.getElementById('searchInput');
    searchInput.placeholder = translations.searchInputPlaceholder;
}

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
        'filter:countries': 'xk'
    });

    try {
        const response = await fetch(`${apiUrl}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Response:', data);
        displayResults(data, page);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = `<p class="error-message">${translations.error}</p>`;
    }
}

function displayResults(data, currentPage) {
    const resultsDiv = document.getElementById('results');
    const paginationDiv = document.getElementById('pagination');
    
    if (!data.results || data.results.length === 0) {
        resultsDiv.innerHTML = `<p class="no-results">${translations.noResults}</p>`;
        paginationDiv.innerHTML = '';
        return;
    }

    let html = `<h2>${translations.searchResults}</h2>`;
    data.results.forEach(result => {
        const properties = result.properties || {};
        const officialName = getOfficialName(result, properties);
        const address = formatAddress(properties.address);
        
        html += `
            <div class="result-item">
                <h3>${escapeHtml(String(officialName))}</h3>
                <p><strong>${translations.idNumber}</strong> ${escapeHtml(String(properties.idNumber?.[0] || 'N/A'))}</p>
                <p><strong>${translations.address}</strong> ${escapeHtml(address)}</p>
                <p><strong>${translations.phone}</strong> ${escapeHtml(String(properties.phone?.[0] || 'N/A'))}</p>
                <p><strong>${translations.email}</strong> ${escapeHtml(String(properties.email?.[0] || 'N/A'))}</p>
                <button onclick="showDetailsPopup('${result.id}')">${translations.viewDetails}</button>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
    displayPagination(data, currentPage);
}

function getOfficialName(result, properties) {
    return result.name || properties.name || properties.officialName || properties.alias || 'N/A';
}

function displayPagination(data, currentPage) {
    const paginationDiv = document.getElementById('pagination');
    const totalResults = data.total || data.results.length;
    const totalPages = Math.ceil(totalResults / 30);
    
    let paginationHtml = '<div class="pagination-controls">';
    if (currentPage > 1) {
        paginationHtml += `<button onclick="fetchResults('${document.getElementById('searchInput').value}', ${currentPage - 1})" class="pagination-btn">${translations.previous}</button>`;
    }
    paginationHtml += `<span class="pagination-info">${translations.page} ${currentPage} ${translations.of} ${totalPages}</span>`;
    if (currentPage < totalPages) {
        paginationHtml += `<button onclick="fetchResults('${document.getElementById('searchInput').value}', ${currentPage + 1})" class="pagination-btn">${translations.next}</button>`;
    }
    paginationHtml += '</div>';
    
    paginationDiv.innerHTML = paginationHtml;
}

function showDetailsPopup(entityId) {
    const popup = createPopupElement();
    document.body.appendChild(popup);
    fetchEntityDetails(entityId);
}

function createPopupElement() {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <button class="close-btn" onclick="closePopup()">${translations.close}</button>
            <div id="entityDetails" class="entity-details">
                <div class="loader"></div>
                <p>${translations.loading}</p>
            </div>
        </div>
    `;
    return popup;
}

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) {
        document.body.removeChild(popup);
    }
}

async function fetchEntityDetails(id) {
    const apiUrl = `https://aleph.occrp.org/api/2/entities/${id}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayEntityDetails(data);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('entityDetails').innerHTML = `<p>${translations.errorLoadingDetails}</p>`;
    }
}

function displayEntityDetails(entity) {
    const detailsDiv = document.getElementById('entityDetails');
    const properties = entity.properties || {};
    const address = formatAddress(properties.address);

    let html = `
        <h2>${translations.entityDetails}</h2>
        <div class="entity-info">
            <ul>
                <li><strong>${translations.name}</strong> ${properties.name?.[0] || 'N/A'}</li>
                <li><strong>${translations.otherName}</strong> ${properties.alias?.[0] || 'N/A'}</li>
                <li><strong>${translations.idNumber}</strong> ${properties.idNumber?.[0] || 'N/A'}</li>
                <li><strong>${translations.taxNumber}</strong> ${properties.taxNumber?.[0] || 'N/A'}</li>
                <li><strong>${translations.incorporationDate}</strong> ${formatDate(properties.incorporationDate?.[0])}</li>
                <li><strong>${translations.address}</strong> ${address}</li>
                <li><strong>${translations.phone}</strong> ${properties.phone?.[0] || 'N/A'}</li>
                <li><strong>${translations.email}</strong> ${properties.email?.[0] || 'N/A'}</li>
                <li><strong>${translations.status}</strong> ${properties.status?.[0] || 'N/A'}</li>
                <li><strong>${translations.legalForm}</strong> ${properties.legalForm?.[0] || 'N/A'}</li>
                <li><strong>${translations.capital}</strong> ${properties.capital?.[0] || 'N/A'}</li>
            </ul>
        </div>
        <div id="map" class="map-container"></div>
    `;
    detailsDiv.innerHTML = html;

    setTimeout(() => {
        initMap(address);
    }, 100);
}

function formatDate(dateValue) {
    if (!dateValue) return 'N/A';
    const date = new Date(Array.isArray(dateValue) ? dateValue[0] : dateValue);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatAddress(addressArray) {
    if (Array.isArray(addressArray) && addressArray.length > 0) {
        return addressArray[0];
    }
    return 'N/A';
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return unsafe;
    }
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function extractRoadName(address) {
    // Split the address into parts
    const parts = address.split(',').map(part => part.trim());
    
    // Look for the part that likely contains the road name
    for (let part of parts) {
        // Remove common road prefixes
        part = part.replace(/^(Rruga|Rr\.|Rr|Rrugica|Sheshi|Bulevardi|Bul\.) /i, '');
        
        // If the part still has content, it's likely the road name
        if (part.length > 0) {
            return part;
        }
    }
    
    // If no road name found, return the whole address
    return address;
}

async function initMap(address) {
    if (!address || address === 'N/A') {
        console.error('No valid address provided for map initialization');
        return;
    }

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    mapContainer.innerHTML = '';

    const map = L.map('map').setView([42.6026, 20.9030], 8); // Default view of Kosovo

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    try {
        const roadName = extractRoadName(address);
        console.log('Extracted road name:', roadName);
        
        const coordinates = await getCoordinates(roadName + ', Kosovo');
        if (coordinates) {
            L.marker(coordinates).addTo(map);
            map.setView(coordinates, 16); // Zoom in closer for street level
        } else {
            console.log('Could not find coordinates for the road:', roadName);
            // If we can't find the road, try to locate the city
            const cityCoordinates = await getCityCoordinates(address);
            if (cityCoordinates) {
                L.marker(cityCoordinates).addTo(map);
                map.setView(cityCoordinates, 13);
            } else {
                console.log('Could not find coordinates for the city, showing default view of Kosovo');
            }
        }
    } catch (error) {
        console.error('Error getting coordinates:', error);
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}

async function getCoordinates(address) {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=xk`);
    const data = await response.json();

    if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }

    return null;
}

async function getCityCoordinates(address) {
    const city = address.split(',')[1]?.trim() || address.split(',')[0].trim();
    const encodedCity = encodeURIComponent(city + ', Kosovo');
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedCity}&limit=1&countrycodes=xk`);
    const data = await response.json();

    if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }

    return null;
}
