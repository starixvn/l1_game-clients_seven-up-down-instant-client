import { IMultipleHandlers } from "@sg/game-client-base/dist/shared";
import inversify from "inversify";
import { JoinGameStore } from "./join-game-store";
import { GameServiceMessage } from "../../../game/scripts/game-messages";
const { injectable, inject } = inversify;
@injectable()
export class SevenUpDownGameConfigHandlers implements IMultipleHandlers {
    @inject(JoinGameStore) protected readonly joinGameStore: JoinGameStore;

    handle() {
        this.joinGameStore.signedIn = true;
    }
    eventHandleList = [
        {
            name: GameServiceMessage.signedIn,
            handle: this.handle,
        },
    ];
}
