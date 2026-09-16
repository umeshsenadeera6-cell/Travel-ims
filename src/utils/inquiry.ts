import type { Inquiry } from '@/types';

export const travelerCount = (i: Pick<Inquiry, 'adults' | 'children' | 'infants'>) => i.adults + i.children + i.infants;

export function inquiryDestination(i: Inquiry): string {
  if (i.type === 'Inbound') return i.inbound?.destinations.join(', ') || 'Sri Lanka';
  return [i.outbound?.destinationCity, i.outbound?.destinationCountry].filter(Boolean).join(', ') || '—';
}

/** Single destination key used for filters/reports. */
export function destinationKey(i: Inquiry): string {
  if (i.type === 'Inbound') return i.inbound?.destinations[0] ?? 'Sri Lanka';
  return i.outbound?.destinationCountry ?? '—';
}

export const travelStart = (i: Inquiry) => (i.type === 'Inbound' ? i.inbound?.arrivalDate : i.outbound?.travelDate) ?? '';
export const travelEnd = (i: Inquiry) => (i.type === 'Inbound' ? i.inbound?.departureDate : i.outbound?.returnDate) ?? '';
export const inquiryCountry = (i: Inquiry) => (i.type === 'Inbound' ? i.inbound?.country ?? '—' : 'Sri Lanka');
