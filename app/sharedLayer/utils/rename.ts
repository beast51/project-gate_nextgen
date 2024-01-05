export const rename = (name: string) => {
  const pattern = /Владелец/g; 
  const newName = name?.replace(pattern, 'Власник'); 
  return newName;
}