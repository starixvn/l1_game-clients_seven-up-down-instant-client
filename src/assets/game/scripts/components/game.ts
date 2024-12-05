import gc from "@sg/game-client-base";
import { Label, Node, _decorator, sp, Tween, tween, v3, Vec3 } from "cc";
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
    scaleDiceCupNode: Vec3 = null;

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

    async finishShowResult(result: gc.GameServiceMessage.TResult, settlementResult: gc.GameServiceMessage.TSettlementResult) {
        super.finishShowResult(result, settlementResult);
    }

    async handleAnimResult(result: ISevenUpDownResult, roundId: number, settlementResult: any): Promise<void> {
        const { multiplier } = result;
        const extraPayMessageDelayTime = multiplier ? this.SHOW_EXTRA_PAY_DURATION : 0;
        const multiplierDelayTime = multiplier ? this.SHOW_MULTIPLIER_DURATION : 0;
        this.multiplierTween?.stop();
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
        this.playStoppableSFX("dice_shake");
        const prevResult = this.lastRound?.result;

        await new Promise<void>((resolve) => {
            tween(this.resultNode)
                .to(0.1, { position: this.positionShowDiceCup, scale: this.scaleDiceCupNode }) // Move and scale up
                .call(() => {
                    this.resultComp?.showResultAnim(prevResult, result, roundId); // Show the result animation
                })
                .delay(this.resultComp?.RESULT_DURATION || 0) // Wait for RESULT_DURATION
                .call(() => {
                    this.playWinningSound(settlementResult);
                })
                .delay(2)
                .to(0.1, { scale: v3(1, 1, 1), position: this.positionDiceCupDefault }) // Reset scale and position
                .call(resolve)
                .start();
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
            this.resetMultiplierAndResultText();
        }
    }

    @render(gc.App.AppStore, (store) => store.isLoading)
    updateLoading(isLoading: boolean) {
        this.isLoading = isLoading;
    }

    @render(RoundHistories.RoundHistoryStore, (store) => store.firstJoinGameHistory)
    async renderStaticResult(firstJoinGameHistory: gc.RoundHistories.IFirstJoinGameHistory) {
        if (!firstJoinGameHistory) return;

        const { animationHighlight, roundTime, roundHistory: lastRound } = firstJoinGameHistory;
        if (!lastRound || roundTime <= 0) return;

        const { result, roundId } = lastRound;

        if (animationHighlight && roundTime > settings.durations.wholeRound - 8) {
            this.showResultAnim(result, roundId, result);
            //this.resultComp?.showResultAnim(result, result, roundId);
        } else {
            this.resultComp?.showResultNoAnim(result, roundId);
            this.resetMultiplierAndResultText();
        }
    }

    resetMultiplierAndResultText() {
        if (!this.multiplierComp || !this.resultComp) {
            return;
        }
        this.multiplierComp.resetMultiplier(true);
        this.resultComp.setResultTextVisibility(false);
    }
}
