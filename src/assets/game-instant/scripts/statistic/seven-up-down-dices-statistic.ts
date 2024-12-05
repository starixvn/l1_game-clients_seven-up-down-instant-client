import { _decorator, Prefab, instantiate, SpriteFrame, Node } from "cc";
import Observer from "observer";
import gc from "@sg/game-client-base";
import { ObserverComponent } from "../../../../extensions/shared-components/assets/shared/common-components/observer-component/scripts/observer-component";
import SevenUpDownRoundResult from "./seven-up-down-round-result";
const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export default class SevenUpDownDicesStatistic extends ObserverComponent {
    @property(Prefab)
    roundResultPrefab: Prefab = null;

    @property(Node)
    roundResultContainer: Node = null;

    @property(SpriteFrame)
    diceSpriteFrames: SpriteFrame[] = [];


    @render(gc.RoundHistories.RoundHistoryStore, (store) => store.histories)
    updateRoundResult(dataLogs: any[]) {
        this.roundResultContainer.destroyAllChildren();

        for (let i = 0; i < dataLogs.length; i++) {
            const dataLog = dataLogs[i];
            const { result } = dataLog;
            const roundResultNode = instantiate(this.roundResultPrefab);
            const roundResultComponent = roundResultNode.getComponent(SevenUpDownRoundResult);
            roundResultComponent.updateLabels(dataLog);
            roundResultComponent.dice1.spriteFrame = this.diceSpriteFrames[result.dice1 - 1];
            roundResultComponent.dice2.spriteFrame = this.diceSpriteFrames[result.dice2 - 1];
            roundResultComponent.highlight.node.active = i === 0;
            this.roundResultContainer.addChild(roundResultNode);
        }
    }
}