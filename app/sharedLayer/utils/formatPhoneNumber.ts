export const formatPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.slice(2).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};