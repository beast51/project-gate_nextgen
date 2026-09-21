import { GateUser } from '../entities/gateUser';
import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUserChanges, GateUsersRepository } from '../ports/gateUsersRepository';
import { RecordActivity } from './activity';
import { PenaltyRecorder } from './penalties';

type Dependencies = {
  directory: GateUsersDirectory
  gateUsers: GateUsersRepository
  recordActivity: RecordActivity
  penalties: PenaltyRecorder
}

// Black listing is a part of editing: a black listed user stays in the directory without the right to open the gate
const DESCRIPTIVE_FIELDS = ['name', 'carNumber', 'apartmentNumber', 'image', 'additionalImages'] as const;

// fields the edit really changes; an empty image never erases the stored one, so it is not a change
export const changedFieldsOf = (before: GateUser | undefined, after: GateUser): string[] => {
  if (!before) return [];

  return DESCRIPTIVE_FIELDS.filter(field => {
    const next = after[field];
    if ((field === 'image' || field === 'additionalImages') && (next === undefined || next === null || next.length === 0)) {
      return false;
    }
    return JSON.stringify(before[field] ?? null) !== JSON.stringify(next ?? null);
  });
};

export const createEditGateUser = ({ directory, gateUsers, recordActivity, penalties }: Dependencies) =>
  async (user: GateUser): Promise<void> => {
    // the state before the edit tells what the edit was: a penalty, its removal or a change of data
    const [before] = await gateUsers.list({ phoneNumber: user.phoneNumber });
    const changedFields = changedFieldsOf(before, user);
    const wasBlackListed = Boolean(before?.isBlackListed);

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

    // A penalty is a fact the statistics count, unlike the journal below it is not optional: a failure
    // is reported, and saving the blocked user again completes the record (`kept` starts a missing one).
    if (!wasBlackListed && user.isBlackListed) await penalties.imposed(user);
    else if (wasBlackListed && user.isBlackListed) await penalties.kept(user);
    else if (wasBlackListed && !user.isBlackListed) await penalties.lifted(user, 'manually');

    if (!wasBlackListed && user.isBlackListed) {
      await recordActivity('gateUserBlocked', [user], { blockedUntil: user.blackListedTo, changedFields });
    } else if (wasBlackListed && !user.isBlackListed) {
      await recordActivity('gateUserUnblocked', [user], { changedFields });
    } else if (changedFields.length > 0) {
      await recordActivity('gateUserChanged', [user], { changedFields });
    }
  };
