import { Prefab, _decorator } from "cc";
import { bundleManager } from "../../../../extensions/shared-components/assets/shared/common-components/bundle-manager/bundle-manager";
import SplashInstantVisibility from "../../../../extensions/shared-components/assets/splash/scripts/components/splash-instant-visibility";
const { ccclass, property } = _decorator;

@ccclass
export class SplashInstantVisibilityCustomize extends SplashInstantVisibility {
    async loadSplashInfo(assetPath: string) {
        let splashInfoPrefab: Prefab = null;

        try {
            splashInfoPrefab = await bundleManager.loadResourcesAsset<Prefab>(`splash/${assetPath}/splash-info`, Prefab, null);
        } catch (error) {
            console.error("Failed to load splash info:", error);
        }

        return splashInfoPrefab;
    }
}
