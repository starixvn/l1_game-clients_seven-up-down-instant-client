import gc from "@sg/game-client-base";
import { _decorator, CCFloat, Node, UITransform, v3 } from "cc";
import { LedLightTooltip } from "db://shared-components/game/led-light/scripts/components/led-light-tooltip";
import { findWinningChoice } from "../seven-up-down-helper";
const { ccclass, property } = _decorator;

export enum TipAlignment {
    Left,
    Cennter,
    Right,
}

@ccclass("CustomLedLightTooltip")
export class CustomLedLightTooltip extends LedLightTooltip {
    @property(Node)
    background: Node = null;

    @property(CCFloat)
    offsetAligment = 0.2;

    protected onLoad(): void {
        super.onLoad();
    }

    public setTooltipInfo(ledLightInfo: gc.RoundHistories.RoundHistory) {
        const roundIdText = `#${ledLightInfo.roundId}`;
        this.roundId.string = roundIdText;
        const { settlementResult, result } = ledLightInfo;
        const rawWinChoice = findWinningChoice(settlementResult);
        const winChoice = rawWinChoice === "seven" ? "7" : rawWinChoice;
        let choiceWin = gc.Translator.gameTranslate(`glossary_${winChoice}`).toUpperCase();
        const diceResult = `(${result["dice1"]},${result["dice2"]})`;

        this.result.string =`${choiceWin} ${diceResult}`;

        const backgroundTransform = this.background.getComponent(UITransform);
        if (backgroundTransform) {
            const letterWidth = 19;
            const roundIdWidth = roundIdText.length * letterWidth;
            let backgroundWidth = (this.result.string?.length || 9) * letterWidth;
            backgroundWidth = backgroundWidth > roundIdWidth ? backgroundWidth : roundIdWidth;
            backgroundTransform.width = backgroundWidth;
        }

        this.showTooltip();
    }
    public adjustBackgroundWidth(increment: number) {
        if (!this.background) {
            return;
        }

        const backgroundTransform = this.background.getComponent(UITransform);
        if (backgroundTransform) {
            backgroundTransform.width += increment;
        }
    }

    public setAlignment(alignment: TipAlignment) {
        if (!this.background) {
            return;
        }

        this.adjustBackgroundWidth(25);

        const pos = this.background.position;
        const backgroundTransform = this.background.getComponent(UITransform);
        if (backgroundTransform) {
            const width = backgroundTransform.width;
            const dict = [-0.5 + this.offsetAligment, 0, 0.5 - this.offsetAligment];
            const posX = width * dict[alignment];
            this.background.position = v3(posX, pos.y, pos.z);
        }
    }

    public setBackground() {
        this.adjustBackgroundWidth(25); // Điều chỉnh chiều rộng
    }
}
