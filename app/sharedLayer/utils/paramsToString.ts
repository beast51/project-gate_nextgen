export const paramsToString = (params: string | null) => {
  return params && params.split('"').join('')
}