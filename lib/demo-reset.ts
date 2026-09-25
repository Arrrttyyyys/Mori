import "server-only";

import { resetPilotDemo } from "@/lib/pilot";
import { resetUserData } from "@/lib/user-data-store";
import { resetDemoLife } from "@/lib/life/store";
import { resetDemoLearning } from "@/lib/life/learning-store";
import { resetDemoSessionEngine } from "@/lib/life/session-engine";
import { resetAdaptiveDemo } from "@/lib/memory-engine/demo-adaptive-runtime";
import { SessionStore } from "@/lib/therapy/session-store";

export function resetFictionalDemo(userId: string) {
  new SessionStore().resetUser(userId);
  resetPilotDemo(userId);
  resetUserData(userId);
  resetDemoLife();
  resetDemoLearning(userId);
  resetDemoSessionEngine(userId);
  resetAdaptiveDemo(userId);
}
