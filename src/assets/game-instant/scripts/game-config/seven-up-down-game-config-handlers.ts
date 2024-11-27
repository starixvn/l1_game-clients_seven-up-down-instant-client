import { IMultipleHandlers } from "@sg/game-client-base/dist/shared";
import inversify from "inversify";
import { GameServiceMessage } from "../../../game/scripts/game-messages";
import { SevenUpDownGameConfigStore } from "./seven-up-down-game-config-store";
const { injectable, inject } = inversify;
@injectable()
export class SevenUpDownGameConfigHandlers implements IMultipleHandlers {
    @inject(SevenUpDownGameConfigStore) protected readonly gameConfigStore: SevenUpDownGameConfigStore;

    handleGameConfigs(gameConfigs: GameServiceMessage.SevenUpDownGameConfigs) {
        this.gameConfigStore.multipliers = gameConfigs.multipliers;
    }
    eventHandleList = [
        {
            name: GameServiceMessage.SevenUpDownGameConfigs.eventName,
            handle: this.handleGameConfigs,
        },
    ];
}
