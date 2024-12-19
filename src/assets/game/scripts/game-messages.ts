export namespace GameServiceMessage {
    export class MatchConfig {
        home: string;
        away: string;

        static eventName = "match";
    }

    export class SevenUpDownGameConfigs {
        multipliers: Array<number>;

        static eventName = "gameConfigs";
    }

    export const signedIn = "signedIn";
}
