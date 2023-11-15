import { ActionType } from "../../GateUserControlPanel.type"

export type BlockButtonsPropsType = {
  confirmAction: (action: ActionType, time?: number) => void
  handleClose: () => void
  action: ActionType
  isLoading: boolean
  title: string
}