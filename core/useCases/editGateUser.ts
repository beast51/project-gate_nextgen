import { GateUser } from '../entities/gateUser';
import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUserChanges, GateUsersRepository } from '../ports/gateUsersRepository';

type Dependencies = {
  directory: GateUsersDirectory
  gateUsers: GateUsersRepository
}

// Black listing is a part of editing: a black listed user stays in the directory without the right to open the gate
export const createEditGateUser = ({ directory, gateUsers }: Dependencies) =>
  async (user: GateUser): Promise<void> => {
    await directory.update({
      externalId: user.externalId,
      name: user.name,
      phoneNumber: user.phoneNumber,
      carNumber: Array.isArray(user.carNumber) ? user.carNumber : [],
      apartmentNumber: user.apartmentNumber || '',
      isBlackListed: user.isBlackListed,
    });

    const changes: GateUserChanges = {
      externalId: user.externalId,
      name: user.name,
      phoneNumber: user.phoneNumber,
      carNumber: user.carNumber,
      apartmentNumber: user.apartmentNumber,
      isBlackListed: user.isBlackListed,
      blackListedFrom: user.blackListedFrom,
      blackListedTo: user.blackListedTo,
    };

    // images are managed separately, an empty value must not erase them
    if (user.image !== undefined && user.image !== null) {
      changes.image = user.image;
    }
    if (user.additionalImages && user.additionalImages.length !== 0) {
      changes.additionalImages = user.additionalImages;
    }

    await gateUsers.update(changes);
  };
