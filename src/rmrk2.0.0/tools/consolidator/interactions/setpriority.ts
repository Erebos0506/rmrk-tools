import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { Setpriority } from "../../../classes/setpriority";
import { IConsolidatorAdapter } from "../adapters/types";
import { findRealOwner } from "../utils";

export const setPriorityInteraction = async (
  remark: Remark,
  setPriorityEntity: Setpriority,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.SETPRIORITY}] Attempting to set priority on a non-existent NFT ${setPriorityEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.SETPRIORITY}] Attempting to set priority on burned NFT ${setPriorityEntity.id}`
    );
  }

  const rootowner =
    nft.rootowner || (await findRealOwner(nft.owner, dbAdapter));
  if (rootowner !== remark.caller) {
    throw new Error(
      `[${OP_TYPES.SETPRIORITY}] Attempting to set priority on non-owned NFT ${setPriorityEntity.id}`
    );
  }

  if (
    !nft.resources
      .filter((resource) => !resource.pending)
      .every((resource) => setPriorityEntity.priority.includes(resource.id))
  ) {
    throw new Error(
      `[${OP_TYPES.SETPRIORITY}] New priority resource ids are missing some of the resource ids on this NFT ${setPriorityEntity.id}`
    );
  }

  const priorityDiff = setPriorityEntity.priority.filter(
    (x) => !nft.priority.includes(x)
  );

  if (
    !priorityDiff.every((resourceId) =>
      Boolean(nft.resources.find((resource) => resource.id === resourceId))
    )
  ) {
    throw new Error(
      `[${OP_TYPES.SETPRIORITY}] one of the NFT resources doesn't contain resource with id from new priority array`
    );
  }

  nft.priority = setPriorityEntity.priority;
};
