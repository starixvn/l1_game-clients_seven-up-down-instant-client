import inversify from "inversify";
import mobx from "mobx";

const { injectable } = inversify;
const { makeAutoObservable } = mobx;

@injectable()
export class JoinGameStore {
    signedIn = false;

    constructor() {
        makeAutoObservable(this);
    }
}
