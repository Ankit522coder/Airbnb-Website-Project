function initMap() {
  const mapDiv = document.getElementById("map");

  if (!mapDiv) {
    console.log("Map div not found");
    return;
  }

  // Get coordinates from data attributes
  let lat = parseFloat(mapDiv.dataset.lat);
  let lng = parseFloat(mapDiv.dataset.lng);
  const listingId = mapDiv.dataset.id;

  // Default to India center if coordinates are invalid or missing
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    lat = 20.5937; // India latitude
    lng = 78.9629; // India longitude
  }

  // Initialize Leaflet map
  const map = L.map(mapDiv).setView([lat, lng], 10);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add draggable marker
  const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
  console.log("Marker added at:", lat, lng);

  // Handle marker drag to update coordinates in DB
  marker.on('dragend', async function(event) {
    const newLatLng = event.target.getLatLng();
    const newLat = newLatLng.lat;
    const newLng = newLatLng.lng;
    console.log("Marker dragged to:", newLat, newLng);

    try {
      const response = await fetch(`/listings/${listingId}/geometry`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat: newLat, lng: newLng }),
      });

      if (response.ok) {
        console.log('Coordinates updated successfully');
      } else {
        console.error('Failed to update coordinates');
      }
    } catch (error) {
      console.error('Error updating coordinates:', error);
    }
  });

  console.log("Map initialization complete");
}

window.initMap = initMap;
