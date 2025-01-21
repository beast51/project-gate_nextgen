import { unitalkGateUsersProvider } from "../providers/unitalkGateUsersProvider";
import { ApiGateUsersType } from "../types/GateUser.type";

const createApiGateUsers = (provider: ApiGateUsersType): ApiGateUsersType => {
  return {
    addGateUserToApi: provider.addGateUserToApi,
    deleteGateUserFromApi: provider.deleteGateUserFromApi,
    editGateUserOnApi: provider.editGateUserOnApi,
    getGateUsersFromApi: provider.getGateUsersFromApi
  };
};

export const unitalkApiGateUsers = createApiGateUsers(unitalkGateUsersProvider())