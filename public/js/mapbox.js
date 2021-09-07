/* eslint-disable */
export const displayMap = (locations) => {
  //   mapboxgl.accessToken =
  //     'pk.eyJ1Ijoiam9uYXNzY2htZWR0bWFubiIsImEiOiJjam54ZmM5N3gwNjAzM3dtZDNxYTVlMnd2In0.ytpI7V7w7cyT1Kq5rT9Z1A';

  //   var map = new mapboxgl.Map({
  //     container: 'map',
  //     style: 'mapbox://styles/jonasschmedtmann/cjvi9q8jd04mi1cpgmg7ev3dy',
  //     scrollZoom: false,
  //     // center: [-118.113491, 34.111745],
  //     // zoom: 10,
  //     // interactive: false
  //   });
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYnJpZ2lob3J2YXRoODIiLCJhIjoiY2psMHh1ZXNjMTl6NjNscXAxZGUzZjJvcyJ9.OueRj6WnXxfEWGh5VXon-w';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/brigihorvath82/ckt30h6dx2i1v17mc4m0zl90f',
    scrollZoom: false,
  });

  // bounds will be the area that appears on the map
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
