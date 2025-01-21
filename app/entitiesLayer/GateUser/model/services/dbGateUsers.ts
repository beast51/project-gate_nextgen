import { MongoDbGateUsersProvider } from "../providers/mongoDbGateUsersProvider";
import { DatabaseGateUsersProviderType } from "../types/GateUser.type";

const createMongoDbGateUsers = (provider: DatabaseGateUsersProviderType): DatabaseGateUsersProviderType => {
  return {
    addGateUsersToDatabase: provider.addGateUsersToDatabase,
    deleteGateUserFromDb: provider.deleteGateUserFromDb,
    editGateUserInDb: provider.editGateUserInDb,
    getGateUserFromDb: provider.getGateUserFromDb
  };
};

export const mongoDbGateUsers = createMongoDbGateUsers(MongoDbGateUsersProvider())