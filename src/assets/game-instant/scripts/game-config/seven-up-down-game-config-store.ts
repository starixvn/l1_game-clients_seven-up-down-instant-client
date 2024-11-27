import inversify from "inversify";
import mobx from "mobx";

const { injectable } = inversify;
const { makeAutoObservable } = mobx;

@injectable()
export class SevenUpDownGameConfigStore {
    private _multipliers : Array<number>;

    constructor() {
        makeAutoObservable(this);
    }

    get multipliers() {
        return this._multipliers;
    }

    set multipliers(multipliers: Array<number>) {
        this._multipliers = multipliers;
    }
}
