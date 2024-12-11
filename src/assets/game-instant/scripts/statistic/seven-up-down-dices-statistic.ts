import { _decorator, Prefab, instantiate, SpriteFrame, Node, Layout, Widget, ScrollView, UITransform } from "cc";
import Observer from "observer";
import gc from "@sg/game-client-base";
import { ObserverComponent } from "../../../../extensions/shared-components/assets/shared/common-components/observer-component/scripts/observer-component";
import SevenUpDownRoundResult from "./seven-up-down-round-result";
import { findWinningChoice } from "../seven-up-down-helper";
import SevenUpDownStatistic from "./seven-up-down-statistic";
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

    @property(SevenUpDownStatistic)
    logView: SevenUpDownStatistic = null;

    @property(Node)
    statsScrollView: Node = null;

    @property(Node)
    diceStatisticNode: Node = null;

    protected isShowDiceView = true;

    @render(gc.RoundHistories.RoundHistoryStore, (store) => store.histories)
    updateData(dataLogs: any[]) {
        this.updateRoundResult(dataLogs);
        this.renderLogView(dataLogs);
        this.roundResultContainer.getComponent(Layout).updateLayout();
        this.roundResultContainer.getComponent(Widget).updateAlignment();
        this.statsScrollView.getComponent(ScrollView).scrollToRight(0.2);
    }

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

    get getChoices(): string[] {
        return ["up", "seven", "down"];
    }

    renderLogView(dataLogs: any[]) {
        const statsData = [];
        if (dataLogs.length > 0) {
            dataLogs.forEach((log) => {
                const { settlementResult } = log;
                const indexWin = this.getChoices.indexOf(findWinningChoice(settlementResult));
                statsData.unshift(indexWin);
            });
            this.logView.setData(statsData);
        }
    }

    changeDisplayMode() {
        this.isShowDiceView = !this.isShowDiceView;
        this.diceStatisticNode.active = this.isShowDiceView;
        this.statsScrollView.active = this.isShowDiceView;
        this.logView.node.active = !this.isShowDiceView;
    }
}
