import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import Observer from "observer";
import { BetItems } from "../../../extensions/shared-components/assets/game/bets/scripts/components/bet-items";
const { render } = Observer;
const { ccclass } = _decorator;

@ccclass
export default class SevenUpDownBetItems extends BetItems {
    @render(gc.Rounds.RoundTimeStore, (store) => store.isStartRound)
    async handleStartRound(isStartRound: boolean) {
        if (isStartRound) {
            this.clearHighlightAnim();
        }
    }

    setHighlightStatic(staticHighlight: boolean, animationHighlight: boolean, roundHistory: gc.RoundHistories.RoundHistory) {
        if (staticHighlight || !animationHighlight) {
            this.showHighlightStatic(roundHistory.settlementResult);
        }
    }

    highlightBetItems(settlementResult: any) {
        this.betItemComponents.forEach((betItem) => {
            const choice = betItem.node.name;
            betItem.handleHighlightAnim(this.isWinning(+settlementResult?.[choice]));
        });
    }
}
