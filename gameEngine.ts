// ===== gameEngine.ts =====
// 超本格SFクリッカー 完全型安全エンジン (TypeScript)
// CodeSandbox用 コンパイル後 gameEngine.js として出力

interface GameState {
  energy: number;
  drones: number;
  reactors: number;
  amplifier: number;        // 特異点増幅器(所有0 or 1, 拡張性考慮)
  droneCost: number;
  reactorCost: number;
  ampCost: number;
  multiplier: number;       // 重力増幅倍率
  lastUpdate: number;
  eventLog: string;
}

type UpgradeType = 'drone' | 'reactor' | 'amplifier';

class NebulaCoreEngine {
  private state: GameState;
  private readonly DRONE_BASE_PROD = 0.3;
  private readonly REACTOR_BASE_PROD = 2.5;
  private readonly AMP_MULTIPLIER_BOOST = 2.0;

  // DOM 参照 (型安全に)
  private energyEl: HTMLElement;
  private epsEl: HTMLElement;
  private droneCountEl: HTMLElement;
  private reactorCountEl: HTMLElement;
  private ampOwnedEl: HTMLElement;
  private multiplierEl: HTMLElement;
  private droneCostEl: HTMLElement;
  private reactorCostEl: HTMLElement;
  private ampCostEl: HTMLElement;
  private droneOwnedEl: HTMLElement;
  private reactorOwnedEl: HTMLElement;
  private eventLogEl: HTMLElement;
  private gravityWellEl: HTMLElement;
  private timestampEl: HTMLElement;

  private buyDroneBtn: HTMLElement;
  private buyReactorBtn: HTMLElement;
  private buyAmpBtn: HTMLElement;
  private clickCore: HTMLElement;

  private startTime: number;

  constructor() {
    // 初期状態: 完全にバランス調整済み
    this.state = {
      energy: 1250.0,          // スタートダッシュ
      drones: 2,              // 初期ドローン2機 (超本格)
      reactors: 0,
      amplifier: 0,
      droneCost: 15.0,
      reactorCost: 80.0,
      ampCost: 650.0,
      multiplier: 1.0,
      lastUpdate: Date.now(),
      eventLog: '[システム] コア起動。クリックで時空歪曲。'
    };

    this.startTime = Date.now();

    // DOM 初期化 (nullチェック)
    this.energyEl = document.getElementById('energyDisplay')!;
    this.epsEl = document.getElementById('epsDisplay')!;
    this.droneCountEl = document.getElementById('droneCountDisplay')!;
    this.reactorCountEl = document.getElementById('reactorCountDisplay')!;
    this.ampOwnedEl = document.getElementById('ampOwned')!;
    this.multiplierEl = document.getElementById('multiplierDisplay')!;
    this.droneCostEl = document.getElementById('droneCostValue')!;
    this.reactorCostEl = document.getElementById('reactorCostValue')!;
    this.ampCostEl = document.getElementById('ampCostValue')!;
    this.droneOwnedEl = document.getElementById('droneOwned')!;
    this.reactorOwnedEl = document.getElementById('reactorOwned')!;
    this.eventLogEl = document.getElementById('eventLog')!;
    this.gravityWellEl = document.getElementById('gravityWell')!;
    this.timestampEl = document.getElementById('timestamp')!;

    this.buyDroneBtn = document.getElementById('buyDroneBtn')!;
    this.buyReactorBtn = document.getElementById('buyReactorBtn')!;
    this.buyAmpBtn = document.getElementById('buyAmpBtn')!;
    this.clickCore = document.getElementById('clickCore')!;

    this.initEventListeners();
    this.updateUI();
    this.startGameLoop();
  }

  private initEventListeners(): void {
    this.clickCore.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addEnergy(1.618); // 黄金比エネルギー
      this.logEvent('⍟ 時空共振 +1.618 TF');
    });

    this.buyDroneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.purchaseUpgrade('drone');
    });

    this.buyReactorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.purchaseUpgrade('reactor');
    });

    this.buyAmpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.purchaseUpgrade('amplifier');
    });

    // キーボードショートカット: C でクリック
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        this.addEnergy(1.618);
        this.logEvent('[キー] 共振誘導 +1.618 TF');
      }
    });
  }

  public purchaseUpgrade(type: UpgradeType): void {
    switch (type) {
      case 'drone':
        if (this.state.energy >= this.state.droneCost) {
          this.state.energy -= this.state.droneCost;
          this.state.drones += 1;
          this.state.droneCost = Number((this.state.droneCost * 1.17).toFixed(2));
          this.logEvent(`🛰️ 探査ドローン調達。稼働数: ${this.state.drones}`);
          this.updateUI();
        }
        break;
      case 'reactor':
        if (this.state.energy >= this.state.reactorCost) {
          this.state.energy -= this.state.reactorCost;
          this.state.reactors += 1;
          this.state.reactorCost = Number((this.state.reactorCost * 1.15).toFixed(2));
          this.logEvent(`⚛️ 融合リアクター起動。出力増大。`);
          this.updateUI();
        }
        break;
      case 'amplifier':
        // 特異点増幅器: 最大1個 (拡張で複数も可能だが本格仕様)
        if (this.state.amplifier === 0 && this.state.energy >= this.state.ampCost) {
          this.state.energy -= this.state.ampCost;
          this.state.amplifier = 1;
          this.state.multiplier = this.AMP_MULTIPLIER_BOOST; // 2倍
          this.state.ampCost = Number.MAX_SAFE_INTEGER; // 二度と買えない
          this.logEvent('🌀 重力特異点増幅器 起動！全出力2倍！');
          this.updateUI();
        }
        break;
    }
  }

  private addEnergy(amount: number): void {
    this.state.energy += amount;
    this.updateUI();
  }

  private calculateEPS(): number {
    const base = (this.state.drones * this.DRONE_BASE_PROD) + 
                 (this.state.reactors * this.REACTOR_BASE_PROD);
    return base * this.state.multiplier;
  }

  private updateUI(): void {
    // フォーマット
    this.energyEl.textContent = this.formatNumber(this.state.energy, 2);
    const eps = this.calculateEPS();
    this.epsEl.textContent = this.formatNumber(eps, 2);
    this.droneCountEl.textContent = this.state.drones.toString();
    this.reactorCountEl.textContent = this.state.reactors.toString();
    this.ampOwnedEl.textContent = this.state.amplifier.toString();
    this.multiplierEl.textContent = this.state.multiplier.toFixed(2);
    this.droneOwnedEl.textContent = this.state.drones.toString();
    this.reactorOwnedEl.textContent = this.state.reactors.toString();

    // コスト更新
    this.droneCostEl.textContent = this.formatNumber(this.state.droneCost, 2);
    this.reactorCostEl.textContent = this.formatNumber(this.state.reactorCost, 2);
    if (this.state.amplifier === 0) {
      this.ampCostEl.textContent = this.formatNumber(this.state.ampCost, 2);
    } else {
      this.ampCostEl.textContent = '---';
    }

    // 重力ウェル 演出 (EPSに連動)
    if (this.gravityWellEl) {
      const grav = (0.98 + eps * 0.0008).toFixed(3);
      this.gravityWellEl.textContent = grav;
    }

    // ボタン無効化
    this.toggleButtonState(this.buyDroneBtn, this.state.energy >= this.state.droneCost);
    this.toggleButtonState(this.buyReactorBtn, this.state.energy >= this.state.reactorCost);
    if (this.state.amplifier === 0) {
      this.toggleButtonState(this.buyAmpBtn, this.state.energy >= this.state.ampCost);
    } else {
      this.buyAmpBtn.classList.add('disabled');
    }

    // タイムスタンプ
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.timestampEl.textContent = `T+ ${elapsed.toFixed(1)} s`;
  }

  private toggleButtonState(btn: HTMLElement, condition: boolean): void {
    if (condition) btn.classList.remove('disabled');
    else btn.classList.add('disabled');
  }

  private formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  private logEvent(message: string): void {
    this.state.eventLog = `[${new Date().toLocaleTimeString()}] ${message}`;
    if (this.eventLogEl) {
      this.eventLogEl.textContent = this.state.eventLog;
    }
  }

  private gameTick(): void {
    const eps = this.calculateEPS();
    this.state.energy += eps;  // 毎秒加算
    this.updateUI();
  }

  private startGameLoop(): void {
    setInterval(() => this.gameTick(), 1000);
    setInterval(() => {
      // 装飾: 動的重力 (エフェクト)
      const fakeGrav = (0.97 + Math.sin(Date.now() / 600) * 0.03).toFixed(3);
      if (this.gravityWellEl) this.gravityWellEl.textContent = fakeGrav;
    }, 200);
  }
}

// 起動 (DOMロード完了後)
window.addEventListener('DOMContentLoaded', () => {
  new NebulaCoreEngine();
});
