import gc from "@sg/game-client-base";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import { sharedContainer } from "../../scripts/shared-container";
import * as SevenUpDownGameConfigFeature from "../../game-instant/scripts/game-config";

export const settings = {
    id: 103,
    name: "SevenUpDown",
    namespaces: ["7Up7Down"],
    durations: {
        wholeRound: 33,
        lockingBet: 3,
        placingBet: 20,
        generatingResult: 11,
        startRound: 1,
    },
    numberOfRoundHistory: 100,
};

export const containerOptions: gc.IContainerOptions = {
    globalContainer: sharedContainer,
    onContainerCreated: (container) => {
        container.bind(gc.GameConfigs.GameSetting).toConstantValue(settings);
        container.bind(LogStore).to(LogStore);
    },
    features: [SevenUpDownGameConfigFeature, gc.RoundBasePF, ...gc.defaultFeatures],
};
