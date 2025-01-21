export const formatCarNumber = (carNumber: string) => {
  return carNumber.split(' ').join('').toUpperCase()
}