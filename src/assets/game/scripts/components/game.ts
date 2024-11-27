import gc from "@sg/game-client-base";
import { Label, Node, _decorator, log, sp, Tween, tween } from "cc";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { startGame } from "db://shared-components/shared/scripts/startup";
import Observer from "observer";
import { AudioUtils } from "../../../../extensions/shared-components/assets/game/audios/utils";
import { bundleManager } from "../../../../extensions/shared-components/assets/shared/common-components/bundle-magager/bundle-manager";
import { AnimationUtils, FunctionUtils } from "../../../../extensions/shared-components/assets/shared/utils";
import { siteConfigs } from "../../../scripts/site-configs";
import { GameServiceMessage } from "../game-messages";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
import { SevenUpDownResult } from "../../../game-instant/scripts/seven-up-down-result";
import { ISevenUpDownResult, ISevenUpDownSettlement } from "../../../game-instant/scripts/seven-up-down-choices";
import SevenUpDownMultiplier from "../../../game-instant/scripts/multiplier/seven-up-down-multiplier";

const { Rounds, Translator, RoundHistories, UserSettings } = gc;

startGame(settings.name, containerOptions, siteConfigs);

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

type ResultSoundInfo = {
    soundId: string;
    duration: number;
};

@ccclass
@observer(settings.name)
export default class Game extends GameComponent {
    @property({ type: Label, override: true, visible: false })
    lblMinBet: Label = null;

    @property({ type: Label, override: true, visible: false })
    lblMaxBet: Label = null;

    @property({ type: Node })
    winningResultNode: Node = null;

    @property({ type: Node })
    resultNode: Node = null;

    @property(SevenUpDownMultiplier)
    multiplierComp: SevenUpDownMultiplier = null;

    @property(sp.Skeleton)
    spineExtraPaid: sp.Skeleton = null;
    public resultComp: SevenUpDownResult = null;

    override namespace = settings.name;
    override containerOptions = containerOptions;
    isLoading = true;
    isFinishDiceAnim = false;
    private readonly crowdSounds = "crowd-game";
    private readonly SHOW_EXTRA_PAY_DURATION = 2.07;
    private readonly SHOW_MULTIPLIER_DURATION = 3.66;
    private readonly TOTAL_SHOW_MULTIPLIER_DURATION = 6;
    private readonly winningSounds = {
        up: "up",
        seven: "seven",
        down: "down",
    };
    multiplierTween: Tween<Node> | null = null;
    protected clientRoundId = -1;
    protected resultSoundIds: ResultSoundInfo[] = [];
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
            this.loadSoundResultBeforeRead(result);
            if (hasAnimation) {
                await this.handleAnimResult(result, this.roundId, settlementResult);
                this.playWinningSound();
            }
        }
    }

    async handleAnimResult(result: ISevenUpDownResult, roundId: number, settlementResult) {
        const { multiplier } = result;
        const extraPayMessageDelayTime = !!multiplier ? this.SHOW_EXTRA_PAY_DURATION : 0;
        const multiplierDelayTime = !!multiplier ? this.SHOW_MULTIPLIER_DURATION : 0;

        this.multiplierTween?.stop();
        this.multiplierTween = tween(this.node)
            .call(() => {
                if (multiplier) {
                    this.spineExtraPaid.node.active = true;
                    AnimationUtils.playSpine(this.spineExtraPaid, "show");
                }
            })
            .delay(extraPayMessageDelayTime)
            .call(() => {
                if (multiplier) {
                    //this.gameAudios?.playSFXAudio("multiplier");
                    this.multiplierComp.renderMultiplier(multiplier, true);
                }
            })
            .delay(multiplierDelayTime)
            .call(async () => {
                await this.showResultAnim(result, roundId);
            })
            .start();
    }

    @render(gc.Settlements.SettlementStore, (store) => store.roundId)
    public updateLatestRoundId(roundId: number) {
        this.roundId = roundId;
    }

    @render(gc.RoundHistories.RoundHistoryStore, (store) => store.getLastRound())
    public setLastRound(round: gc.RoundHistories.RoundHistory) {
        this.lastRound = round;
    }

    async showResultAnim(result: gc.GameServiceMessage.TResult, roundId: number) {
        //this.gameAudios?.playSFXAudio("dice_shake");
        const prevResult = this.lastRound?.result;
        this.resultComp?.showResultAnim(prevResult, result, roundId);

        await AnimationUtils.delayTime(this.resultComp?.RESULT_DURATION);

        this.isFinishDiceAnim = true;
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartPlacingBet)
    startPlacingBet(isStartPlacingBet: boolean) {
        this.playStoppableSFX(this.crowdSounds);
    }

    async playWinningSound() {
        for (const resultSoundInfo of this.resultSoundIds) {
            this.playStoppableSFX(resultSoundInfo.soundId);
            await FunctionUtils.delay(resultSoundInfo.duration * 1000);
        }
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

    async loadSoundResultBeforeRead(data: ISevenUpDownResult) {
        let isCancelLoadSounds = false;
        const maxWaitTime = 5000;
        const result = Object.keys(data).find((key) => data[key]);

        const timeoutCancelWinningSound = setTimeout(() => {
            isCancelLoadSounds = true;
        }, maxWaitTime);

        if (isCancelLoadSounds) {
            return;
        }
        const winOptionName = this.winningSounds[result];
        const soundId = this.getAudioKeyForLanguage(winOptionName);
        if (soundId) {
            const duration = await AudioUtils.getDurationClip(soundId);

            this.resultSoundIds.push({ soundId, duration });
        }
        timeoutCancelWinningSound && clearTimeout(timeoutCancelWinningSound);
    }

    getAudioKeyForLanguage(name: string): string {
        return `${name}_win_${Translator.getLanguageId() || "en"}`;
    }

    async handleStartRound(isStartRound: boolean) {
        if (isStartRound) {
            super.handleStartRound(isStartRound);
            this.resultComp?.setResultTextVisibility(false);
            this.highlightResult?.hide();
            this.resultSoundIds = [];
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
        if (!firstJoinGameHistory) {
            return;
        }

        const { animationHighlight, roundTime, roundHistory: lastRound } = firstJoinGameHistory;
        if (lastRound && animationHighlight && roundTime > 0) {
            const { result } = lastRound;
            this.highlightResult?.show(result);
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
