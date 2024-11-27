export enum BetChoice {
    UP = "up",
    DOWN = "down",
    SEVEN = "seven"
}

export interface ISevenUpDownSettlementResult {
    up: boolean;
    down: boolean;
    seven: boolean;
}

export interface ISevenUpDownSettlement {
    result: ISevenUpDownResult;
    settlementResult: ISevenUpDownSettlementResult;
    roundId: number;
}

export interface ISevenUpDownResult {
    dice1: number;
    dice2: number;
    multiplier: {
        value: number;
        choice: string;
    };
}
