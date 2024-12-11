import { _decorator, Component, Sprite, SpriteAtlas, Label, tween, UIOpacity } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export default class SevenUpDownRoundResult extends Component {
    @property(Sprite)
    dice1: Sprite = null;

    @property(Sprite)
    dice2: Sprite = null;

    @property(SpriteAtlas)
    atlas: SpriteAtlas = null;

    @property(Sprite)
    total: Sprite = null;

    @property(Label)
    multiplier: Label = null;

    @property(Sprite)
    highlight: Sprite = null;

    onLoad() {
        const uiOpacity = this.highlight.getComponent(UIOpacity)
        tween(uiOpacity)
            .repeatForever(
                tween()
                    .to(0.4, { opacity: 150 }, { easing: "cubicIn" })
                    .delay(0.4)
                    .to(0.4, { opacity: 255 }, { easing: "cubicOut" })
            )
            .start();
    }

    updateLabels(data: any) {
        const { result } = data;

        // Set the total sprite frame based on the dice results
        const totalValue = result.dice1 + result.dice2;
        this.total.spriteFrame = this.atlas.getSpriteFrame(`${totalValue}`);

        // Update multiplier text if available
        if (result.multiplier) {
            this.multiplier.string = result.multiplier.value ? `${result.multiplier.value}x` : "";
        }
    }
}
