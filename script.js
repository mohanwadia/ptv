// Step 3.1: Set up the API credentials and stops 2:33
const PTV_USER_ID = '3002484';
const PTV_API_KEY = '783e7302-3d61-4de8-9db7-6dc87ebca97b';

// Replace these with the actual stop IDs you want to track
const STOPS_TO_TRACK = [
    { id: 19441, name: 'Fuchsia Ct/Cootamundra Dr' }, 
    { id: 15864, name: 'Watsons Rd/Ferntree Gully Rd' },
    { id: 20140, name: 'Flinders St Station/Elizabeth St'}
];

// Step 3.2: Calculate the Signature
async function getSignature(url) {
    const hmac_algorithm = {
        name: "HMAC",
        hash: "SHA-1"
    };
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(PTV_API_KEY),
        hmac_algorithm,
        false,
        ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
        hmac_algorithm,
        key,
        new TextEncoder().encode(url)
    );
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return signature;
}

// Step 3.3: Fetch the Data
async function fetchDepartures(stopId) {
    // Use a CORS proxy to get around the browser security policy
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; 
    const baseUrl = `https://timetableapi.ptv.vic.gov.au/v3/departures/2/${stopId}?devid=${PTV_USER_ID}`;

    const signature = await getSignature(baseUrl);
    const apiUrl = `${baseUrl}&signature=${signature}`;

    // Combine the proxy URL and the API URL
    const finalUrl = `${proxyUrl}${apiUrl}`;

    try {
        // Note: We fetch from the proxy URL now, not the direct API URL
        const response = await fetch(finalUrl); 
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}
// Step 3.4: Display the Data
function displayDepartures(stop, data) {
    const container = document.getElementById('departures-container');
    if (!data || !data.departures || data.departures.length === 0) {
        container.innerHTML += `<p>No upcoming departures found for ${stop.name}.</p>`;
        return;
    }

    let html = `<h2>${stop.name} (${stop.id})</h2>`;
    html += `<ul>`;
    
    // Loop through the first 5 departures
    data.departures.slice(0, 5).forEach(departure => {
        const time = new Date(departure.scheduled_departure_utc);
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        const formattedTime = time.toLocaleTimeString('en-US', options);

        html += `
            <li>
                Bus to **${departure.platform.direction.direction_name}** at ${formattedTime}
            </li>
        `;
    });
    
    html += `</ul>`;
    container.innerHTML += html;
}

// Step 3.5: Putting it all together
async function loadAllDepartures() {
    const container = document.getElementById('departures-container');
    container.innerHTML = '<p>Loading bus departures...</p>'; // Show a loading message

    for (const stop of STOPS_TO_TRACK) {
        const data = await fetchDepartures(stop.id);
        displayDepartures(stop, data);
    }
}

// Call the main function when the page loads
window.onload = loadAllDepartures;
