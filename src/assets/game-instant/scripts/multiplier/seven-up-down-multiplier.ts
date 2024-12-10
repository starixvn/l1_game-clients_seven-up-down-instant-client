import Observer from "observer";
import { _decorator, Node } from "cc";
import SevenUpDownMultiplierChoice from "./seven-up-down-multiplier-choice";
import { ObserverComponent } from "../../../../extensions/shared-components/assets/shared/common-components/observer-component/scripts/observer-component";
const { ccclass, property } = _decorator;
const { render } = Observer;
import { SevenUpDownGameConfigStore } from "../game-config/index";

@ccclass()
export default class SevenUpDownMultiplier extends ObserverComponent {
    @property(Node)
    listMultiplier: Node[] = [];
    private multiplierAnim: SevenUpDownMultiplierChoice = null;
    multipliersConfigs = [];

    onEnable() {
        this.resetMultiplier(false);
    }

    @render(SevenUpDownGameConfigStore, (store) => store.multipliers, { fireImmediately: true })
    updateMultiplierConfigs(multipliers: Array<number>) {
        this.multipliersConfigs = multipliers;
    }

    resetMultiplier(animated: boolean) {
        this.listMultiplier.forEach((item) => {
            const comp = item.getComponent(SevenUpDownMultiplierChoice);
            comp.hideMultiplier(animated);
        });
    }

    renderMultiplier(multiplier: any, animated = true) {
        if (!multiplier) {
            return;
        }

        const choice = this.listMultiplier.find((choice) => choice.name === multiplier.choice);
        this.multiplierAnim = choice?.getComponent(SevenUpDownMultiplierChoice);
        if (!this.multiplierAnim || !choice) {
            return;
        }
        this.multiplierAnim.multiplierValue = multiplier?.value;
        this.multiplierAnim.listMultiplierOrigin = this.multipliersConfigs;
        choice.active = true;
        this.multiplierAnim.showMultiplier(animated);
    }
}
