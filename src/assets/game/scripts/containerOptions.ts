import gc from "@sg/game-client-base";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import * as SevenUpDownGameConfigFeature from "../../game-instant/scripts/game-config";
import { sharedContainer } from "../../scripts/shared-container";
import { settings } from "./game-settings";

export const containerOptions: gc.IContainerOptions = {
    globalContainer: sharedContainer,
    onContainerCreated: (container) => {
        container.bind(gc.GameConfigs.GameSetting).toConstantValue(settings);
        container.bind(LogStore).to(LogStore);
    },
    features: [SevenUpDownGameConfigFeature, gc.RoundBasePF, ...gc.defaultFeatures],
};
