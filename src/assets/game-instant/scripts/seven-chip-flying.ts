import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import Observer from "observer";
import ChipFlyingInstant from "../../../extensions/shared-components/assets/game-instant/common-components/chips/chip-flying-instant";
import { ISevenUpDownResult } from "./seven-up-down-choices";
const { ccclass } = _decorator;
const { render } = Observer;
@ccclass
export default class SevenChipFlying extends ChipFlyingInstant {
    private readonly DELAY_DEFAULT_DURATION = 4;
    private readonly DELAY_MULTIPLIER_DURATION = 11;
    @render(gc.Settlements.SettlementStore, (store) => store.result)
    updateDelayAnimPayChip(result: ISevenUpDownResult) {
        this.delayAnimPayChips = result?.multiplier ? this.DELAY_MULTIPLIER_DURATION : this.DELAY_DEFAULT_DURATION;
    }
}
