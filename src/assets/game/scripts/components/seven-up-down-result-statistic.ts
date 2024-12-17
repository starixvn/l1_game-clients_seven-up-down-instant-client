import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import { ResultStatistic } from "db://shared-components/game/result-statistic/scripts/components/result-statistic";
const { ccclass, property } = _decorator;

@ccclass
export class SevenUpDownResultStatistic extends ResultStatistic {
    @property({ override: true })
    supportStatisticKeys = "up,down,seven";

    protected generateStatisticalData(histories: gc.RoundHistories.RoundHistory[]) {
        const statisticCount = histories.reduce((settlementResult, history) => {
            this.statisticKeys?.forEach((key) => {
                if (history.settlementResult[key]) {
                    settlementResult[key] = (settlementResult[key] || 0) + 1;
                }
            });
            return settlementResult;
        }, {});
        return Object.keys(statisticCount).reduce((settlementResult, key) => {
            settlementResult[key] = `${Math.round((statisticCount[key] / histories.length) * 100)}%`;
            return settlementResult;
        }, {});
    }

    protected setData(statistic: Object) {
        this.statisticItems?.forEach((item) => {
            const percentItem = statistic[item.value];
            if (item.label && percentItem) {
                item.label.string = percentItem.toString();
            } else {
                item.label.string = "0%";
            }
        });
    }
}
