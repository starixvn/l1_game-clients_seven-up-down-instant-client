import gc from "@sg/game-client-base";
import { Label, Node, _decorator, sp, Tween, tween, v3, Vec3, UIOpacity } from "cc";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { startGame } from "db://shared-components/shared/scripts/startup";
import Observer from "observer";
import { AnimationUtils } from "../../../../extensions/shared-components/assets/shared/utils";
import { siteConfigs } from "../../../scripts/site-configs";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
import { SevenUpDownResult } from "../../../game-instant/scripts/seven-up-down-result";
import { ISevenUpDownResult } from "../../../game-instant/scripts/seven-up-down-choices";
import SevenUpDownMultiplier from "../../../game-instant/scripts/multiplier/seven-up-down-multiplier";
import { findWinningChoice } from "../../../game-instant/scripts/seven-up-down-helper";

const { Rounds, Translator, RoundHistories, UserSettings } = gc;

startGame(settings.name, containerOptions, siteConfigs, settings.namespaces);

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
@observer(settings.name)
export default class Game extends GameComponent {
    @property({ type: Label, override: true, visible: false })
    lblMinBet: Label = null;

    @property({ type: Label, override: true, visible: false })
    lblMaxBet: Label = null;

    @property({ type: Node })
    resultNode: Node = null;

    @property(SevenUpDownMultiplier)
    multiplierComp: SevenUpDownMultiplier = null;

    @property(sp.Skeleton)
    spineExtraPaid: sp.Skeleton = null;

    @property(Vec3)
    positionDiceCupDefault: Vec3 = null;

    @property(Vec3)
    positionShowDiceCup: Vec3 = null;

    @property(Vec3)
    scaleDiceCupSettlement: Vec3 = null;

    @property(Vec3)
    scaleDiceCupDefault: Vec3 = null;

    public resultComp: SevenUpDownResult = null;

    override namespace = settings.name;
    override containerOptions = containerOptions;
    isLoading = true;
    isFinishDiceAnim = false;
    private readonly crowdSounds = "crowd-game";
    private readonly SHOW_EXTRA_PAY_DURATION = 2.07;
    private readonly SHOW_MULTIPLIER_DURATION = 3.66;
    private readonly TOTAL_SHOW_MULTIPLIER_DURATION = 6;

    multiplierTween: Tween<Node> | null = null;
    protected clientRoundId = -1;

    enableFixHandleFinish = true;

    protected lastRound: gc.RoundHistories.RoundHistory = null;

    protected roundId: number = null;

    protected histories: gc.RoundHistories.RoundHistory[];

    onLoad() {
        super.onLoad();
        this.fetchComponents();
    }

    fetchComponents() {
        this.resultComp = this.resultNode?.getComponent(SevenUpDownResult);
    }

    @render(Rounds.RoundStore, (store) => store.clientRoundId)
    storeClientRoundId(clientRoundId: number) {
        this.clientRoundId = clientRoundId;
    }

    @render(Rounds.RoundTimeStore, (store) => store.isInRoundTime)
    renderInRoundTime(isInRoundTime: boolean) {
        if (isInRoundTime && !this.isLoading) {
            this.resultComp?.setResultTextVisibility(false);
        }
    }

    async showResult(result: ISevenUpDownResult, hasAnimation: boolean, settlementResult: gc.GameServiceMessage.TSettlementResult) {
        if (result) {
            this.resultComp?.setResultTextVisibility(false);
            if (hasAnimation) {
                await this.handleAnimResult(result, this.roundId, settlementResult);
            }
        }
    }

    async finishShowResult(result: ISevenUpDownResult, settlementResult: gc.GameServiceMessage.TSettlementResult) {
        super.finishShowResult(result, settlementResult);
    }

    async handleAnimResult(result: ISevenUpDownResult, roundId: number, settlementResult: any): Promise<void> {
        const { multiplier } = result;
        const extraPayMessageDelayTime = multiplier ? this.SHOW_EXTRA_PAY_DURATION : 0;
        const multiplierDelayTime = multiplier ? this.SHOW_MULTIPLIER_DURATION : 0;
        this.multiplierTween?.stop();
        this.multiplierComp?.resetMultiplier(false);
        const tweenSequence = tween(this.node)
            .call(() => {
                if (multiplier) {
                    this.spineExtraPaid.node.active = true;
                    AnimationUtils.playSpine(this.spineExtraPaid, "show");
                }
            })
            .delay(extraPayMessageDelayTime)
            .call(() => {
                if (multiplier) {
                    this.playStoppableSFX("multiplier");
                    this.multiplierComp.renderMultiplier(multiplier, true);
                }
            })
            .delay(multiplierDelayTime);

        await this.runTweenAsPromise(tweenSequence);
        await this.showResultAnim(result, roundId, settlementResult);
    }

    private runTweenAsPromise(tweenObj: Tween<any>): Promise<void> {
        return new Promise((resolve) => {
            tweenObj.call(resolve).start();
        });
    }

    @render(gc.Settlements.SettlementStore, (store) => store.roundId)
    public updateLatestRoundId(roundId: number) {
        this.roundId = roundId;
    }

    @render(gc.RoundHistories.RoundHistoryStore, (store) => store.getLastRound())
    public setLastRound(round: gc.RoundHistories.RoundHistory) {
        this.lastRound = round;
    }

    async showResultAnim(result: gc.GameServiceMessage.TResult, roundId: number, settlementResult): Promise<void> {
        const prevResult = this.lastRound?.result;

        await new Promise<void>((resolve) => {
            tween(this.resultNode)
                .to(0.15, { position: new Vec3(0, this.positionDiceCupDefault.y, this.positionDiceCupDefault.z) })
                .to(0.15, {
                    position: new Vec3(this.positionShowDiceCup.x, this.positionShowDiceCup.y - 20, this.positionShowDiceCup.z),
                    scale: new Vec3(0.9, 0.88, 1),
                })
                .to(0.15, {
                    position: this.positionShowDiceCup,
                    scale: this.scaleDiceCupSettlement,
                })
                .delay(0.15)
                .call(() => {
                    this.playStoppableSFX("dice_shake");
                    this.resultComp?.showResultAnim(prevResult, result, roundId); // Show the result animation
                })
                .delay(this.resultComp?.RESULT_DURATION || 0)
                .call(() => {
                    this.playWinningSound(settlementResult);
                })
                .delay(1.6)
                .to(0.4, {
                    position: this.positionDiceCupDefault,
                    scale: this.scaleDiceCupDefault,
                })
                .call(resolve)
                .start();
            this.resultComp.playHighLight();
        });

        this.isFinishDiceAnim = true;
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartPlacingBet)
    startPlacingBet(isStartPlacingBet: boolean) {
        //this.playStoppableSFX(this.crowdSounds);
    }

    playWinningSound(settlementResult: gc.GameServiceMessage.TSettlementResult) {
        const winChoice = findWinningChoice(settlementResult);
        const soundId = this.getAudioKeyForLanguage(winChoice);
        this.playStoppableSFX(soundId);
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.stopStoppableSFX(id))
    stopStoppableSFX(id: string) {
        return id;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playStoppableSFX(id))
    playStoppableSFX(id: string) {
        return id;
    }

    @render(UserSettings.UserSettingStore, (store) => store.sfxEnable)
    enableSFX(sfxEnable: boolean) {
        if (!sfxEnable) {
            this.stopStoppableSFX("");
        }
    }
    getAudioKeyForLanguage(name: string): string {
        return `${name}_win_${Translator.getLanguageId() || "en"}`;
    }

    async handleStartRound(isStartRound: boolean) {
        if (isStartRound) {
            super.handleStartRound(isStartRound);
            this.resultComp?.setResultTextVisibility(false);
            this.multiplierTween?.stop();
            this.spineExtraPaid.node.active = false;
            this.isFinishDiceAnim = false;
            this.resetMultiplierAndResultText(true);
        }
    }

    @render(gc.App.AppStore, (store) => store.isLoading)
    updateLoading(isLoading: boolean) {
        this.isLoading = isLoading;
    }

    @render(RoundHistories.RoundHistoryStore, (store) => store.firstJoinGameHistory)
    async renderStaticResult(firstJoinGameHistory: gc.RoundHistories.IFirstJoinGameHistory) {
        if (!firstJoinGameHistory) return;
        this.resultComp?.showResultNoAnim(this.histories[1]?.result, this.histories[1]?.roundId);
        const { animationHighlight, roundTime, roundHistory: lastRound } = firstJoinGameHistory;
        if (!lastRound) return;

        const { result: rawResult, roundId } = lastRound;
        const result = this.convertToSevenUpDownResult(rawResult);
        if (animationHighlight) {
            this.multiplierComp?.renderMultiplier(result?.multiplier, false);
        }
        animationHighlight && roundTime > settings.durations.wholeRound - 8
            ? this.showResultAnim(result, roundId, result)
            : this.resultComp?.showResultNoAnim(result, roundId);
    }

    private convertToSevenUpDownResult(rawResult: gc.GameServiceMessage.TResult): ISevenUpDownResult {
        return {
            dice1: rawResult["dice1"],
            dice2: rawResult["dice2"],
            multiplier: rawResult["multiplier"] ?? null,
        } as ISevenUpDownResult;
    }

    @render(gc.RoundHistories.RoundHistoryStore, (store) => store.histories)
    updateHistories(dataLogs: any[]) {
        this.histories = dataLogs;
    }

    resetMultiplierAndResultText(animated: boolean) {
        if (!this.multiplierComp || !this.resultComp) {
            return;
        }
        this.multiplierComp.resetMultiplier(animated);
        this.resultComp.setResultTextVisibility(false);
    }
}
