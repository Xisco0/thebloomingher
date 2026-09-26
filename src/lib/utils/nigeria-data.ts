export interface NigerianState {
  code: string;
  name: string;
}

export const NIGERIAN_STATES: NigerianState[] = [
  { code: 'LA', name: 'Lagos' },
  { code: 'FC', name: 'Abuja / FCT' },
  { code: 'OG', name: 'Ogun' },
  { code: 'OY', name: 'Oyo' },
  { code: 'RI', name: 'Rivers' },
  { code: 'ED', name: 'Edo' },
  { code: 'DE', name: 'Delta' },
  { code: 'AN', name: 'Anambra' },
  { code: 'EN', name: 'Enugu' },
  { code: 'KD', name: 'Kaduna' },
  { code: 'KN', name: 'Kano' },
  { code: 'KW', name: 'Kwara' },
  { code: 'AB', name: 'Abia' },
  { code: 'AD', name: 'Adamawa' },
  { code: 'AK', name: 'Akwa Ibom' },
  { code: 'BA', name: 'Bauchi' },
  { code: 'BY', name: 'Bayelsa' },
  { code: 'BE', name: 'Benue' },
  { code: 'BO', name: 'Borno' },
  { code: 'CR', name: 'Cross River' },
  { code: 'EB', name: 'Ebonyi' },
  { code: 'EK', name: 'Ekiti' },
  { code: 'GO', name: 'Gombe' },
  { code: 'IM', name: 'Imo' },
  { code: 'JI', name: 'Jigawa' },
  { code: 'KT', name: 'Katsina' },
  { code: 'KE', name: 'Kebbi' },
  { code: 'KO', name: 'Kogi' },
  { code: 'NA', name: 'Nasarawa' },
  { code: 'NI', name: 'Niger' },
  { code: 'ON', name: 'Ondo' },
  { code: 'OS', name: 'Osun' },
  { code: 'PL', name: 'Plateau' },
  { code: 'SO', name: 'Sokoto' },
  { code: 'TA', name: 'Taraba' },
  { code: 'YO', name: 'Yobe' },
  { code: 'ZA', name: 'Zamfara' },
];

export const LAGOS_LGAS = [
  'Agege',
  'Ajeromi-Ifelodun',
  'Alimosho',
  'Amuwo-Odofin',
  'Apapa',
  'Badagry',
  'Epe',
  'Eti-Osa (Ikoyi / Lekki / Victoria Island)',
  'Ibeju-Lekki',
  'Ifako-Ijaiye',
  'Ikeja (GRA / Maryland / Allen)',
  'Ikorodu',
  'Kosofe (Gbagada / Magodo / Ogudu)',
  'Lagos Island (Marina / Onikan)',
  'Lagos Mainland (Yaba / Surulere)',
  'Mushin',
  'Ojo',
  'Oshodi-Isolo',
  'Shomolu',
  'Surulere',
];

export const STORE_PICKUP_LOCATION = {
  name: 'TheBloomingHer Lagos Store & Dispatch Hub',
  address: '30 Clem Road, Ifako-Ijaiye',
  city: 'Lagos',
  state: 'Lagos',
  hours: 'Mon – Sat: 9:00 AM – 6:00 PM',
  phone: '+2348103641002',
};

/**
 * Normalizes any valid Nigerian phone number format into a standard +234XXXXXXXXXX format.
 * Supports: 080..., 070..., 081..., 090..., 091..., 234..., +234...
 */
export function normalizeNigerianPhone(phone: string): { isValid: boolean; formatted: string; cleanNumber: string } {
  // Strip all non-numeric characters except leading plus
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+234')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('234')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // A valid Nigerian subscriber number has 10 digits (e.g. 8012345678, 8103641002)
  const isValid = /^([789][01]\d{8})$/.test(cleaned);

  if (!isValid) {
    return {
      isValid: false,
      formatted: phone,
      cleanNumber: phone,
    };
  }

  return {
    isValid: true,
    formatted: `+234 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`,
    cleanNumber: `+234${cleaned}`,
  };
}

export const DELIVERY_RATES = {
  LAGOS_STANDARD: 2500,
  FREE_SHIPPING_THRESHOLD: 40000,
  NATIONWIDE_STANDARD: 4500,
  STORE_PICKUP: 0,
};

export function calculateDeliveryFee(state: string, deliveryType: 'shipping' | 'pickup', subtotal: number): number {
  if (deliveryType === 'pickup') {
    return DELIVERY_RATES.STORE_PICKUP;
  }

  const isLagos = state.toLowerCase().includes('lagos') || state === 'LA';

  if (isLagos) {
    return subtotal >= DELIVERY_RATES.FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_RATES.LAGOS_STANDARD;
  }

  // Other Nigerian States
  return DELIVERY_RATES.NATIONWIDE_STANDARD;
}
