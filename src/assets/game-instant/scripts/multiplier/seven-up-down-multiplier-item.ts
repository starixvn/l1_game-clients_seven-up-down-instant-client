import { _decorator, Label, Component } from "cc";
const { ccclass } = _decorator;
@ccclass
export default class SevenUpDownMultiplierItem extends Component {
    public multiplierValue = 0;

    onLoad() {
        this.node.getComponent(Label).string = `${this.multiplierValue}x`;
    }
}
