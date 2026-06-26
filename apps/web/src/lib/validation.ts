export const VIN_LENGTH = 17;
export const VIN_PATTERN = /^[A-Za-z0-9]{17}$/;

export function normalizeVin(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, VIN_LENGTH);
}

export function isValidVin(value: string): boolean {
  return VIN_PATTERN.test(value);
}
