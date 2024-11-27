import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { ResultStatistic } from "db://shared-components/game/result-statistic/scripts/components/result-statistic";
const { ccclass, property } = _decorator;
import Observer from "observer";
const { render } = Observer;

@ccclass
export class SevenUpDownResultStatistic extends ResultStatistic {
    @property({ override: true })
    supportStatisticKeys = "up,down,seven";

    protected generateStatisticalData(histories: gc.RoundHistories.RoundHistory[]) {
        const statisticCount = histories.reduce((result, history) => {
            this.statisticKeys?.forEach((key) => {
                if (history.result[key]) {
                    result[key] = (result[key] || 0) + 1;
                }
            });
            return result;
        }, {});
        return Object.keys(statisticCount).reduce((result, key) => {
            result[key] = `${Math.round((statisticCount[key] / histories.length) * 100)}%`;
            return result;
        }, {});
    }
}
