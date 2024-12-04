import { _decorator } from "cc";
import Observer from "observer";
import { JoinGameStore } from "./join-game/index";
import GameConnection from "../../../extensions/shared-components/assets/shared/common-components/game-connection";

const { ccclass } = _decorator;
const { render } = Observer;

@ccclass
export default class SevenUpDownGameConnection extends GameConnection {
    @render(JoinGameStore, (store) => store.signedIn, { fireImmediately: false })
    requestOpenGame() {
        this.openGameCallback();
    }
}