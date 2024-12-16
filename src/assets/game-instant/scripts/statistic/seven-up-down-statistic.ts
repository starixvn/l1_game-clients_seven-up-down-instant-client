import { _decorator, CCFloat, Component, instantiate, Node, ScrollView, Size, UITransform, v3 } from "cc";
import { BlinkAnimation } from "../../../../extensions/shared-components/assets/shared/common-components/blink-animation/blink-animation";
const { ccclass, property } = _decorator;

@ccclass
export default class SevenUpDownStatistic extends Component {
    @property({ type: Node })
    items: Node[] = [];

    @property(Node)
    content: Node = null;

    @property(Node)
    itemNext: Node = null;

    @property(CCFloat)
    rowMax = 6;

    @property(Size)
    itemSize: Size = new Size(22, 22);

    @property(Size)
    padding: Size = new Size(2, 2);

    public nextMark: Node = null;
    protected dots: Node[] = [];
    protected isHideNextDot = false;
    checkShowNext = () => false;
    _managedByParent = false;
    get managedByParent(): boolean {
        return this._managedByParent;
    }
    set managedByParent(value: boolean) {
        this._managedByParent = value;
    }

    _nextItemActive = false;
    get nextItemActive(): boolean {
        return this._nextItemActive;
    }
    set nextItemActive(value: boolean) {
        this._nextItemActive = value;
        this.updateDisplayNextItem();
        this.node.getComponent(ScrollView).scrollToRight();
    }

    updateDisplayNextItem() {
        if (this.nextMark && this.nextMark.isValid) {
            this.nextMark.active = this.nextItemActive;
        }
    }

    init(condition: () => boolean) {
        this.checkShowNext = condition;
    }

    public setData(results: number[]) {
        console.log("set Data", results);
        this.dots.forEach((dot) => {
            dot.removeFromParent();
            dot.destroy();
        });
        this.dots = [];

        let col = 0,
            row = 0;
        let maxX = 0;
        let nextCol = 1;
        let previousResult = undefined;
        const rowMax = {};
        let colMax = 0;
        const start = v3(-this.itemSize.width / 2, -this.itemSize.height / 2 - this.padding.height);
        results.forEach((result, i) => {
            if (result === previousResult) {
                const max = rowMax.hasOwnProperty(col) ? rowMax[col] : this.rowMax;
                if (row < max - 1) {
                    row++;
                } else if (row === 0 && max === 1) {
                    col = nextCol;
                    nextCol++;
                } else {
                    col++;
                    rowMax[col] = row;
                }
            } else {
                row = 0;
                col = nextCol;
                nextCol++;
            }

            if (col > colMax) {
                colMax = col;
            }

            previousResult = result;

            const dot = this.createDotNode(result);
            maxX = this.handleDotAction(dot, start, col, row, maxX);
        });

        this.addNextMark(rowMax, row, col, nextCol, start);
        this.updateContentPosition(maxX);
    }

    createDotNode(result: number) {
        return instantiate(this.items[result]);
    }

    protected handleDotAction(dot: any, start: any, col: number, row: number, maxX: number) {
        dot.active = true;
        dot.position = v3(start.x + col * this.itemSize.width, start.y - row * this.itemSize.height, 0);
        maxX = Math.max(maxX, dot.position.x);
        this.content.addChild(dot);
        this.dots.push(dot);

        return maxX;
    }

    protected updateContentPosition(maxX: number) {
        maxX = Math.max(maxX, this.nextMark.position.x);
        const uiContent = this.content.getComponent(UITransform);
        uiContent.width = Math.max(maxX + this.itemSize.width / 2, uiContent.width) + 2 * this.padding.width;

        this.content.position = v3(-uiContent.width, this.content.position.y, this.content.position.z);
    }

    protected addNextMark(rowMax, row, col, nextCol, start) {
        const max = rowMax.hasOwnProperty(col) ? rowMax[col] : this.rowMax;

        if (row < max - 1) {
            row++;
        } else {
            row = 0;
            col = nextCol;
        }
        const dot = instantiate(this.itemNext);
        dot.active = false;
        dot.position = v3(start.x + col * this.itemSize.width, start.y - row * this.itemSize.height, 0);
        dot.addComponent(BlinkAnimation).duration = 0.5;
        this.content.addChild(dot);
        this.nextMark = dot;
        this.dots.push(dot);
    }

    update() {
        if (this.managedByParent) {
            return;
        }
        if (this.nextMark && this.nextMark.isValid) {
            if (this.nextMark.active !== this.checkShowNext()) {
                console.log("change active ", this.checkShowNext());
            }
            this.nextMark.active = this.checkShowNext();
        }
    }
}
