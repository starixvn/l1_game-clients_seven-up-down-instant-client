import gc from "@sg/game-client-base";
import { ISevenUpDownResult } from "../../game-instant/scripts/seven-up-down-choices";
export namespace GameServiceMessage {
    export class MatchConfig {
        home: string;
        away: string;

        static eventName = "match";
    }

    export class LastMatchConfig {
        home: string;
        away: string;
        roundId: number;

        static eventName = "roundHistory";
    }

    export class SevenUpDownGameConfigs {
        multipliers: Array<number>;

        static eventName = "gameConfigs";
    }

    export const signedIn = "signedIn";
}
