import { ActionType } from "../../GateUserControlPanel.type"

export type ConfirmButtonsPropsType = {
  confirmAction: (action: ActionType, time?: number) => void
  handleClose: () => void
  action: ActionType
  isLoading: boolean
}