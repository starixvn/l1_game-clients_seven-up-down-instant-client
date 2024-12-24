import { _decorator, Component, instantiate, Layout, Node, Prefab, sp, Tween, tween, UIOpacity, Vec3 } from "cc";
import { AnimationUtils } from "../../../../extensions/shared-components/assets/shared/utils";
import SevenUpDownMultiplierItem from "./seven-up-down-multiplier-item";
const { ccclass, property } = _decorator;

@ccclass
export default class SevenUpDownMultiplierChoice extends Component {
    @property(Node)
    nodeMultiplier: Node = null;

    @property(Prefab)
    pfbMultiplier: Prefab = null;

    @property(sp.Skeleton)
    spineMultiplier: sp.Skeleton = null;

    @property(sp.Skeleton)
    spineParticle: sp.Skeleton = null;

    private readonly MULTIPLIER_NUMBER = 13;
    private readonly NO_ANIM_MULTIPLIER = 16;
    private readonly OFFSET_MULTIPLIER = 510;

    public listMultiplierOrigin = [];
    public multiplierValue = 0;
    private multiplierTween: Tween<Node> = null;
    private lastMultiplierTween: Tween<Node> = null;

    onDisable() {
        this.multiplierTween?.stop();
        this.lastMultiplierTween?.stop();
    }

    async showMultiplier(animated: boolean) {
        const uiOpacity = this.nodeMultiplier.getComponent(UIOpacity);
        uiOpacity.opacity = 255;
        AnimationUtils.playSpine(this.spineParticle.getComponent(sp.Skeleton), "show", true);
        if (animated) {
            this.appendMultiplier();
            this.animRollingMultiplier();
            AnimationUtils.playSpine(this.spineMultiplier.getComponent(sp.Skeleton), "show");
        } else {
            AnimationUtils.playSpine(this.spineMultiplier.getComponent(sp.Skeleton), "idle", false);
            this.setFinalMultiplier();
        }
    }

    animRollingMultiplier() {
        this.nodeMultiplier.setPosition(new Vec3(this.nodeMultiplier.position.x, 0, 0));

        const waitingDuration = 0.26;
        this.multiplierTween?.stop();
        this.multiplierTween = tween(this.nodeMultiplier)
            .delay(waitingDuration)
            .to(1.2, { position: new Vec3(this.nodeMultiplier.position.x, -238, 0) })
            .to(1.83, { position: new Vec3(this.nodeMultiplier.position.x, -this.OFFSET_MULTIPLIER, 0) })
            .to(0.67, { position: new Vec3(this.nodeMultiplier.position.x, -500, 0) })
            .start();
    }

    setFinalMultiplier() {
        this.nodeMultiplier.addChild(this.renderMultiplierValue(this.multiplierValue));
    }

    getFinalMultiplier() {
        return this.nodeMultiplier.children[0];
    }

    appendMultiplier() {
        const listMultipliers = this.generateRandomMultipliers();
        if (!listMultipliers) {
            return;
        }
        this.setFinalMultiplier();

        for (const multiplier of listMultipliers) {
            const item = this.renderMultiplierValue(multiplier);
            this.nodeMultiplier.addChild(item);
        }

        this.nodeMultiplier.getComponent(Layout).updateLayout();
    }

    renderMultiplierValue(value: number) {
        const multiplierItem = instantiate(this.pfbMultiplier);
        const comp = multiplierItem.getComponent(SevenUpDownMultiplierItem);
        comp.multiplierValue = value;
        return multiplierItem;
    }

    hideMultiplier(animated: boolean) {
        if (!animated) {
            this.resetMultiplierChoice();
            return;
        }
        let uiOpacity = this.nodeMultiplier.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.nodeMultiplier.addComponent(UIOpacity);
        }
        const hideDurationTime = 0.4;
        tween(this.nodeMultiplier)
            .parallel(
                tween(uiOpacity).to(hideDurationTime, { opacity: 0 }, { easing: "sineOut" }), // Fade out
                tween().call(() => {
                    const lastNode = this.getFinalMultiplier();
                    if (lastNode) {
                        tween(lastNode)
                            .to(0.06, { scale: new Vec3(1.2, 1.2, 1.2) })
                            .to(0.06, { scale: new Vec3(1, 1, 1) })
                            .to(0.2, { scale: new Vec3(0.5, 0.5, 0.5) })
                            .start();
                    }
                })
            )
            .call(() => {
                this.resetMultiplierChoice(); // Reset after animation completes
            })
            .start();
        AnimationUtils.playSpine(this.spineMultiplier, "hide");
    }

    resetMultiplierChoice() {
        this.node.active = false;
        this.nodeMultiplier.destroyAllChildren();
        this.nodeMultiplier.setPosition(new Vec3(this.nodeMultiplier.position.x, -this.NO_ANIM_MULTIPLIER, 0));
        this.nodeMultiplier.setScale(new Vec3(1, 1, 1));
    }

    generateRandomMultipliers() {
        if (!this.listMultiplierOrigin || this.listMultiplierOrigin.length === 0) {
            return null;
        }
        let listMultiplier = [];

        const reverseList = this.listMultiplierOrigin.slice().reverse();
        const length = this.listMultiplierOrigin.length;
        const mod = this.MULTIPLIER_NUMBER % length;
        const countLoop = Math.floor(this.MULTIPLIER_NUMBER / length);
        for (let i = 0; i < countLoop; i++) {
            listMultiplier = [...listMultiplier, ...reverseList];
        }
        if (mod > 0) {
            listMultiplier = [...listMultiplier, ...reverseList.slice(0, mod)];
        }
        return listMultiplier;
    }
}
