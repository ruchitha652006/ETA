// High-precision geographic coordinates for Indian Railway stations
export const STATION_COORDINATES = {
  // Telangana / Andhra Pradesh (SCR)
  HYB:  { lat: 17.3850, lng: 78.4867, name: 'Hyderabad Deccan' },
  SC:   { lat: 17.4344, lng: 78.5013, name: 'Secunderabad Jn' },
  KZJ:  { lat: 17.9750, lng: 79.5100, name: 'Kazipet Jn' },
  WL:   { lat: 17.9689, lng: 79.5941, name: 'Warangal' },
  MB:   { lat: 17.6034, lng: 80.0000, name: 'Mahabubabad' },
  DKJ:  { lat: 17.5147, lng: 80.1584, name: 'Dornakal Jn' },
  KMT:  { lat: 17.2472, lng: 80.1514, name: 'Khammam' },
  MDR:  { lat: 16.9150, lng: 80.3540, name: 'Madhira' },
  BZA:  { lat: 16.5062, lng: 80.6480, name: 'Vijayawada Jn' },
  GNT:  { lat: 16.3004, lng: 80.4428, name: 'Guntur Jn' },
  TEL:  { lat: 16.2354, lng: 80.6477, name: 'Tenali Jn' },
  BPP:  { lat: 15.9038, lng: 80.4682, name: 'Bapatla' },
  CLX:  { lat: 15.8272, lng: 80.3512, name: 'Chirala' },
  OGL:  { lat: 15.5057, lng: 80.0499, name: 'Ongole' },
  SKM:  { lat: 15.2890, lng: 80.0160, name: 'Singarayakonda' },
  KVZ:  { lat: 14.9125, lng: 79.9880, name: 'Kavali' },
  NLR:  { lat: 14.4426, lng: 79.9865, name: 'Nellore' },
  GDR:  { lat: 14.1500, lng: 79.8500, name: 'Gudur Jn' },
  SPE:  { lat: 13.6890, lng: 80.0210, name: 'Sullurupeta' },

  // Tamil Nadu (SR)
  MAS:  { lat: 13.0827, lng: 80.2707, name: 'MGR Chennai Central' },
  MS:   { lat: 13.0784, lng: 80.2612, name: 'Chennai Egmore' },
  TBM:  { lat: 12.9249, lng: 80.1000, name: 'Tambaram' },
  CBE:  { lat: 11.0016, lng: 76.9628, name: 'Coimbatore Jn' },
  MDU:  { lat: 9.9197,  lng: 78.1194, name: 'Madurai Jn' },

  // North / Central (NR, WCR, CR)
  NDLS: { lat: 28.6448, lng: 77.2167, name: 'New Delhi' },
  NZM:  { lat: 28.5888, lng: 77.2530, name: 'Hazrat Nizamuddin' },
  AGC:  { lat: 27.1584, lng: 77.9904, name: 'Agra Cantt' },
  GWL:  { lat: 26.2167, lng: 78.1833, name: 'Gwalior Jn' },
  VGLJ: { lat: 25.4484, lng: 78.5685, name: 'Virangana Lakshmibai Jn (Jhansi)' },
  BPL:  { lat: 23.2685, lng: 77.4126, name: 'Bhopal Jn' },
  ET:   { lat: 22.6108, lng: 77.7610, name: 'Itarsi Jn' },
  NGP:  { lat: 21.1528, lng: 79.0882, name: 'Nagpur Jn' },
  BPQ:  { lat: 19.8569, lng: 79.3586, name: 'Balharshah' },
  SKZR: { lat: 19.3400, lng: 79.4800, name: 'Sirpur Kaghaznagar' },
  BPA:  { lat: 19.0435, lng: 79.4870, name: 'Bellampalli' },
  MCI:  { lat: 18.8744, lng: 79.4480, name: 'Manchiryal' },
  RDM:  { lat: 18.7610, lng: 79.4750, name: 'Ramagundam' },
  PDPL: { lat: 18.6189, lng: 79.3780, name: 'Peddapalli Jn' },

  // West & East
  BCT:  { lat: 18.9711, lng: 72.8195, name: 'Mumbai Central' },
  MMCT: { lat: 18.9711, lng: 72.8195, name: 'Mumbai Central' },
  CSMT: { lat: 18.9401, lng: 72.8356, name: 'Chhatrapati Shivaji Maharaj Terminus' },
  PUNE: { lat: 18.5284, lng: 73.8739, name: 'Pune Jn' },
  SBC:  { lat: 12.9784, lng: 77.5684, name: 'KSR Bengaluru City' },
  YPR:  { lat: 13.0234, lng: 77.5502, name: 'Yesvantpur Jn' },
  HWH:  { lat: 22.5830, lng: 88.3426, name: 'Howrah Jn' },
  VSKP: { lat: 17.7210, lng: 83.2922, name: 'Visakhapatnam Jn' },
};

/**
 * Get coordinates for a station code.
 * If station code is not directly known, estimate along the corridor or use default.
 */
export function getStationCoordinates(code, stationName = '', fallbackIndex = 0, totalStations = 1) {
  const cleanCode = (code || '').toUpperCase().trim();
  if (STATION_COORDINATES[cleanCode]) {
    return [STATION_COORDINATES[cleanCode].lat, STATION_COORDINATES[cleanCode].lng];
  }

  // Fallback: Default to SCR region corridor if unknown
  // Hyderabad to Vijayawada default path approximation
  const startLat = 17.3850;
  const startLng = 78.4867;
  const endLat = 14.4426;
  const endLng = 79.9865;
  
  const fraction = totalStations > 1 ? fallbackIndex / (totalStations - 1) : 0.5;
  const lat = startLat + (endLat - startLat) * fraction + ((fallbackIndex % 2 === 0 ? 0.04 : -0.04));
  const lng = startLng + (endLng - startLng) * fraction;
  return [lat, lng];
}
