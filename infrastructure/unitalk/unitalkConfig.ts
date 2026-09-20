export type UnitalkConfig = {
  url: string
  // contacts API
  authorization: string
  // calls history API
  internalApiAuthorization: string
  projectId: string
  // id of the Unitalk employee ("responsible") whose contacts are allowed to open the gate
  canOpenGatesResponsibleId: string
}
