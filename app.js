(() => {
  const { ethers } = window;

  const DEFAULT_TESTNET_RPC = "https://bsc-dataseed.binance.org";

  const CONFIG = {
    chainIdHex: "0x38",
    chainId: 56,
    chainName: "BNB Smart Chain",
    rpcUrl: DEFAULT_TESTNET_RPC,
    explorer: "https://bscscan.com",
    factoryAddress: "0x19d44C65380b855d70647D515cDfD66CB928eB16",
    vaultAddress: "",
    tokenAddress: "",
  };

  const CONFIG_STORAGE_KEY = `spp:config:${CONFIG.chainId}`;
  const ENABLE_CONTRACT_INFO_UI = false;

  function trimOrEmpty(value) {
    return String(value || "").trim();
  }

  function isValidAddress(value) {
    const v = trimOrEmpty(value);
    if (!v) return false;
    try {
      return ethers.isAddress(v);
    } catch (_) {
      return false;
    }
  }

  function loadConfigOverrides() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
      if (saved && typeof saved === "object") {
        if (isValidAddress(saved.vaultAddress)) CONFIG.vaultAddress = trimOrEmpty(saved.vaultAddress);
        if (isValidAddress(saved.tokenAddress)) CONFIG.tokenAddress = trimOrEmpty(saved.tokenAddress);
        if (isValidAddress(saved.factoryAddress)) CONFIG.factoryAddress = trimOrEmpty(saved.factoryAddress);
        if (saved.rpcUrl) {
          CONFIG.rpcUrl = trimOrEmpty(saved.rpcUrl) || DEFAULT_TESTNET_RPC;
        }
      }
    } catch (_) {}

    try {
      const q = new URLSearchParams(window.location.search);
      const vault = trimOrEmpty(q.get("vault"));
      const token = trimOrEmpty(q.get("token"));
      const factory = trimOrEmpty(q.get("factory"));
      const rpc = trimOrEmpty(q.get("rpc"));

      if (isValidAddress(vault)) CONFIG.vaultAddress = vault;
      if (isValidAddress(token)) CONFIG.tokenAddress = token;
      if (isValidAddress(factory)) CONFIG.factoryAddress = factory;
      if (rpc) CONFIG.rpcUrl = rpc;
    } catch (_) {}
  }

  function isConfigReady() {
    return isValidAddress(CONFIG.vaultAddress) || (isValidAddress(CONFIG.tokenAddress) && isValidAddress(CONFIG.factoryAddress));
  }

  function saveConfig(next) {
    localStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({
        rpcUrl: trimOrEmpty(next.rpcUrl || CONFIG.rpcUrl),
        factoryAddress: trimOrEmpty(next.factoryAddress || CONFIG.factoryAddress),
        vaultAddress: trimOrEmpty(next.vaultAddress || CONFIG.vaultAddress),
        tokenAddress: trimOrEmpty(next.tokenAddress || CONFIG.tokenAddress),
      })
    );
  }

  function openConfigModal() {
    openModal(
      "配置合约地址",
      `
      <p class="section-text">请等待代币绑定网站后进行游戏，当前未绑定。</p>
      <div class="inline-actions">
        <button id="cfgCancelBtn" class="primary-btn">知道了</button>
      </div>
    `
    );

    document.getElementById("cfgCancelBtn")?.addEventListener("click", closeModal);
  }

  const ZERO = "0x0000000000000000000000000000000000000000";
  const TACTICAL_PACK_COST = ethers.parseEther("100000");

  const ITEM_META = [
    { id: 0, key: "D80", label: "竞聘折扣券（8折）", desc: "下次竞聘主教练席位时，仅对溢价部分按 8 折计算。", tab: "discounts", action: "discount" },
    { id: 1, key: "D70", label: "竞聘折扣券（7折）", desc: "下次竞聘主教练席位时，仅对溢价部分按 7 折计算。", tab: "discounts", action: "discount" },
    { id: 2, key: "D60", label: "竞聘折扣券（6折）", desc: "下次竞聘主教练席位时，仅对溢价部分按 6 折计算。", tab: "discounts", action: "discount" },
    { id: 3, key: "D50", label: "竞聘折扣券（5折）", desc: "下次竞聘主教练席位时，仅对溢价部分按 5 折计算。", tab: "discounts", action: "discount" },
    { id: 4, key: "B10", label: "换人微调", desc: "当前主教练席位权重 +10%，持续 60 分钟。", tab: "buffs", action: "buff" },
    { id: 5, key: "B20", label: "定位球战术", desc: "当前主教练席位权重 +20%，持续 60 分钟。", tab: "buffs", action: "buff" },
    { id: 6, key: "B30", label: "高位逼抢", desc: "当前主教练席位权重 +30%，持续 60 分钟。", tab: "buffs", action: "buff" },
    { id: 7, key: "B50", label: "临场换阵", desc: "当前主教练席位权重 +50%，持续 30 分钟。", tab: "buffs", action: "buff" },
    { id: 8, key: "B100", label: "点球大战预案", desc: "当前主教练席位权重 +100%，持续 30 分钟。", tab: "buffs", action: "buff" },
    { id: 9, key: "P5", label: "青训储备", desc: "永久执教履历权重 +5%。", tab: "marks", action: "mark" },
    { id: 10, key: "P8", label: "战绩背书", desc: "永久执教履历权重 +8%。", tab: "marks", action: "mark" },
    { id: 11, key: "P15", label: "名帅光环", desc: "永久执教履历权重 +15%。", tab: "marks", action: "mark" },
    { id: 12, key: "P25", label: "传奇教头", desc: "永久执教履历权重 +25%。", tab: "marks", action: "mark" }
  ];
  const LEGION_NAMES = { 1: "发射军团", 2: "星链军团", 3: "机器人军团", 4: "火星军团", 5: "能源军团" };
  const LEGION_ICONS = {
    1: "./素材/图标/发射军团.webp",
    2: "./素材/图标/星链军团.webp",
    3: "./素材/图标/机器人军团.webp",
    4: "./素材/图标/火星军团.webp",
    5: "./素材/图标/能源军团.webp"
  };
  function getLegionIcon(legionId) { return LEGION_ICONS[Number(legionId)] || ""; }
  const RANK_NAMES = ["散户", "老韭菜", "分析师", "基金经理", "投资总监", "华尔街之狼", "股神", "Stock Emperor"];
  const RANK_ICONS = {
    0: "./素材/图标2/散户.webp",
    1: "./素材/图标2/老韭菜.webp",
    2: "./素材/图标2/分析师.webp",
    3: "./素材/图标2/基金经理.webp",
    4: "./素材/图标2/投资总监.webp",
    5: "./素材/图标2/华尔街之狼.webp",
    6: "./素材/图标2/股神.webp",
    7: "./素材/图标2/Stock Emperor.webp"
  };
  function getRankIcon(rank) { return RANK_ICONS[Math.max(0, Math.min(Number(rank) || 0, 7))] || ""; }
  const RANK_WEIGHTS = [0, 0, 100, 110, 120, 140, 160, 200];
  const RANK_WEIGHT_BPS = [0, 0, 10000, 11000, 12000, 14000, 16000, 20000];
  const MIN_HOLDING_TOKEN = 1_000_000n * 10n ** 18n;
  const HEAT_PER_BNB = 1_000_000n;
  const WEI = 10n ** 18n;
  function getLegionName(legionId) { return LEGION_NAMES[Number(legionId)] || "未加入"; }
  function getRankName(rank) { return RANK_NAMES[Math.max(0, Math.min(Number(rank) || 0, 7))]; }
  function getRankWeight(rank) { return `${RANK_WEIGHTS[Math.max(0, Math.min(Number(rank) || 0, 7))]}%`; }
  function getRankWeightBps(rank) { return RANK_WEIGHT_BPS[Math.max(0, Math.min(Number(rank) || 0, 7))] || 0; }
  function heatFromBnbWei(valueWei) { return (BigInt(valueWei || 0) * HEAT_PER_BNB) / WEI; }

  const vaultAbi = [
    "function description() view returns (string)","function vaultUISchema() view returns ((string vaultType,string description,(string name,string description,(string name,string fieldType,string description,uint8 decimals)[] inputs,(string name,string fieldType,string description,uint8 decimals)[] outputs,(string tokenType,string amountFieldName)[] approvals,bool isInputArray,bool isOutputArray,bool isWriteMethod)[] methods))","function currentSeasonId() view returns (uint256)","function seasonTimeRange(uint256) view returns (uint64,uint64,uint64)","function isLockPeriod(uint256) view returns (bool)","function stockKingTreasury() view returns (uint256)","function getVaultOverview() view returns (uint256,uint32,uint256,uint256,bool)","function getCurrentSeasonWindow() view returns (uint256,uint64,uint64,uint64,bool)","function getLegionState(uint8) view returns (uint256,uint256,uint32,address,uint64,uint256,uint256,uint32,uint32)","function getUserStatus(address) view returns (uint8,uint8,uint256,uint64,bool)","function taxToken() view returns (address)","function getSeasonRewardState(uint256,uint8) view returns (bool,uint256,address,bool,uint256,uint256,bool)","function legions(uint8) view returns (address leader,uint64,uint64,uint256 totalHistoricalContribution,uint256 totalTreasuryWon,uint32 totalWinCount,uint32 totalTop3Count)","function seasonLegions(uint256,uint8) view returns (uint256 heat,uint256 qualifiedWeight,uint32 validContributorCount,uint64,bool,address,bool,bool,bool,uint256,uint256,uint256,uint256)","function seasons(uint256) view returns (uint64 startTime,uint64 endTime,uint64 lockTime,uint64 settledTime,uint64 claimDeadline,uint32 dailyCycleId,bool settled,uint8 rankedCount,uint256 treasuryBeforeRelease,uint256 releasedAmount,uint256 rolledAmount)","function users(address) view returns (uint8 currentLegion,uint8 rank,uint64 lastLegionChangeTime)","function userLegionHistoricalContribution(address,uint8) view returns (uint256)","function userSeasonLegion(uint256,address,uint8) view returns (uint256 rawContribution,uint256 weightedContribution,uint256 qualifiedRawContribution,uint256 qualifiedWeightedContribution,bool claimed,bool leaderClaimed)","function holdingQualifiedSince(address) view returns (uint64)","function upgradeFees(uint256) view returns (uint256)","function joinLegion(uint8)","function contribute(uint8) payable","function upgradeRank(uint8) payable","function upgradeRankTo(uint8,uint8) payable","function switchLegionWithContribution(uint8) payable","function burnForLegion(uint8,uint256)","function challengeLeader(uint8)","function settleSeason(uint256)","function claim(uint256,uint8)","function processExpiredSeasonReward(uint256,uint8)"
  ];

  const tokenAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner,address spender) view returns (uint256)",
    "function approve(address spender,uint256 amount) returns (bool)"
  ];

  const factoryAbi = [
    "event VaultCreated(address indexed vault,address indexed token,address indexed creator)"
  ];

  const state = {
    currentFilter: "all",
    drawerTab: "rewards",
    seatsIntroEntered: true,
    seatsEntering: false,
    readProvider: null,
    rewardUi: null,
    injectedProvider: null,
    browserProvider: null,
    signer: null,
    readVault: null,
    readToken: null,
    writeVault: null,
    writeToken: null,
    userAddress: null,
    tokenMeta: { name: "--", symbol: "--", decimals: 18 },
    publicData: {
      description: "",
      tacticalPackPool: 0n,
      accumulatedBnbTax: 0n,
      occupiedSeats: 0,
      totalSeats: 100,
      seats: []
    },
    userData: null,
    selectedSeatId: null,
    isSubmitting: false,
    isRefreshing: false
  };

  const el = {
    connectWalletBtn: document.getElementById("connectWalletBtn"), contractInfoBtn: document.getElementById("contractInfoBtn"), footerContractBtn: document.getElementById("footerContractBtn"), openRulesBtn: document.getElementById("openRulesBtn"), refreshBtn: document.getElementById("refreshBtn"), joinLegionBtn: document.getElementById("joinLegionBtn"), contributeBtn: document.getElementById("contributeBtn"), upgradeRankBtn: document.getElementById("upgradeRankBtn"), switchLegionBtn: document.getElementById("switchLegionBtn"), heroSeasonId: document.getElementById("heroSeasonId"), heroCountdownLabel: document.getElementById("heroCountdownLabel"), heroCountdown: document.getElementById("heroCountdown"), heroCountdownHint: document.getElementById("heroCountdownHint"), heroTreasury: document.getElementById("heroTreasury"), heroKingName: document.getElementById("heroKingName"), heroBoardList: document.getElementById("heroBoardList"), legionBoard: document.getElementById("legionBoard"), myPanel: document.getElementById("myPanel"), rewardSeasonId: document.getElementById("rewardSeasonId"), rewardLegionId: document.getElementById("rewardLegionId"), rewardPreviewBtn: document.getElementById("rewardPreviewBtn"), rewardClaimBtn: document.getElementById("rewardClaimBtn"), rewardResult: document.getElementById("rewardResult"), seatsGrid: document.getElementById("seatsGrid"), recentRecords: document.getElementById("recentRecords"), modalBackdrop: document.getElementById("modalBackdrop"), modalTitle: document.getElementById("modalTitle"), modalBody: document.getElementById("modalBody"), closeModalBtn: document.getElementById("closeModalBtn"), drawer: document.getElementById("drawer"), closeDrawerBtn: document.getElementById("closeDrawerBtn"), drawerContent: document.getElementById("drawerContent"), statusToast: document.getElementById("statusToast"), loadingOverlay: document.getElementById("loadingOverlay"), loadingTitle: document.getElementById("loadingTitle"), loadingText: document.getElementById("loadingText")
  };

  function shortAddr(value) {
    if (!value || value === ZERO) return "席位空缺";
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  function formatToken(value) {
    const raw = ethers.formatUnits(value, state.tokenMeta.decimals);
    const intPart = raw.split(".")[0];
    const sign = intPart.startsWith("-") ? "-" : "";
    const digits = sign ? intPart.slice(1) : intPart;
    const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${sign}${withCommas}`;
  }

  function formatBnb(value) {
    const etherValue = ethers.formatEther(value);
    // 使用 parseFloat 避免截断后出现如 0.0000 的情况，保留最多 4 位小数
    return `${parseFloat(Number(etherValue).toFixed(4))} BNB`;
  }

  const PLACEHOLDER_COACH_IMAGE = "";
  const LOADED_COACH_IMAGES = new Set();

  function getCoachMeta(seatId) {
    return { id: seatId, coachName: `旧席位 #${seatId}`, tier: "-", title: "已停用", image: "" };
  }

  function zoneInfo() {
    return { key: "legacy", name: "旧分区" };
  }

  function countdownText() {
    return "已停用";
  }

  function nowText() {
    return new Date().toLocaleString("zh-CN");
  }

  function occupiedSeatCount() {
    return 0;
  }

  function parseError(error) {
    const msg = (
      error?.reason ||
      error?.shortMessage ||
      error?.info?.error?.message ||
      error?.message ||
      "交易失败"
    );
    
    // 拦截 ethers.js 常见的解析错误（通常由于 RPC 延迟或非标 ABI 导致，不影响实际上链结果）
    if (typeof msg === "string" && msg.includes("could not coalesce error")) {
      return "操作已执行（节点状态同步中）";
    }
    
    return msg;
  }

  function showToast(message, type = "normal") {
    el.statusToast.textContent = message;
    el.statusToast.className = `status-toast ${type === "normal" ? "" : type}`;
    el.statusToast.classList.remove("hidden");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      el.statusToast.classList.add("hidden");
    }, 3400);
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function getInjectedProvider() {
    const eth = window.ethereum;
    if (!eth) return null;
    const providers = Array.isArray(eth.providers) ? eth.providers : [eth];
    return providers.find((p) => p.isMetaMask && !p.isTokenPocket) ||
      providers.find((p) => p.isOKXWallet) ||
      providers.find((p) => p.isBinance) ||
      providers.find((p) => p.isCoinbaseWallet) ||
      providers[0] || null;
  }

  function openWalletGuide() {
    const dappPath = `${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
    openModal("打开钱包", `
      <p class="section-text">移动端请尽量使用钱包内置 DApp 浏览器打开当前页面，再进行连接与签名。</p>
      <div class="inline-actions">
        <a class="primary-btn" href="https://metamask.app.link/dapp/${dappPath}" target="_blank" rel="noopener noreferrer">MetaMask 打开</a>
        <a class="ghost-btn" href="https://www.okx.com/download" target="_blank" rel="noopener noreferrer">OKX 钱包</a>
        <a class="ghost-btn" href="https://www.binance.com/zh-CN/web3wallet" target="_blank" rel="noopener noreferrer">Binance 钱包</a>
      </div>
      <p class="section-text">如果已安装钱包 App，请优先复制当前链接并在钱包浏览器内打开。</p>
    `);
  }

  function setBusy(active, title = "处理中", text = "请在钱包中确认，并等待链上返回结果。") {
    state.isSubmitting = active;
    el.loadingTitle.textContent = title;
    el.loadingText.textContent = text;
    el.loadingOverlay.classList.toggle("hidden", !active);
    renderActionButtons();
  }

  function setWalletButtonText() {
    el.connectWalletBtn.textContent = state.userAddress ? shortAddr(state.userAddress) : "连接钱包";
  }

  function needsApproval(amount) {
    return !state.userData || state.userData.allowance < amount;
  }

  function getSeatPayAmount(seat) {
    const current = seat.currentPrice;
    if (!seat.occupied) return current;
    const nextPrice = (current * 120n) / 100n;
    const premium = nextPrice - current;
    const discount = BigInt(state.userData?.signingDiscount || 100);
    return current + (premium * discount) / 100n;
  }

  function getCurrentSeatId() {
    return state.userData?.startingSlotIdPlusOne ? state.userData.startingSlotIdPlusOne - 1 : -1;
  }

  function getSeatActionState(seat) {
    if (state.isSubmitting) return { label: "交易处理中", disabled: true, reason: "当前有交易正在处理中" };
    if (!state.userAddress) return { label: "连接钱包后竞聘", disabled: false, reason: "" };
    const mySeatId = getCurrentSeatId();
    if (mySeatId === seat.id) return { label: "我已在任", disabled: true, reason: "你当前正在执教该主教练席位" };
    if (mySeatId !== -1) return { label: "已有席位", disabled: true, reason: "每个地址最多持有一个主教练席位" };
    if (seat.isCooling) return { label: "保护期内不可竞聘", disabled: true, reason: "该主教练席位仍在保护期" };
    const payAmount = getSeatPayAmount(seat);
    if (state.userData.balance < payAmount) return { label: "余额不足", disabled: true, reason: "当前代币余额不足" };
    if (needsApproval(payAmount)) return { label: "先授权后竞聘", disabled: false, reason: "" };
    return { label: "竞聘该席位", disabled: false, reason: "" };
  }

  function getBlindBoxActionState() {
    return { label: "旧入口已停用", disabled: true, reason: "当前前端不再接入旧战术包玩法" };
  }

  function getPendingTacticalPackState() {
    return { hasPending: false, settleBlock: 0, canSettle: false, remainingBlocks: 0 };
  }

  function getBlindBoxPurchaseState() {
    return { label: "旧入口已停用", disabled: true, reason: "当前前端不再接入旧战术包玩法" };
  }

  function getClaimActionState() {
    return { label: "请使用奖励中心", disabled: true, reason: "当前统一通过奖励中心手动查询和领取" };
  }

  function getDistributionActionState() {
    return { label: "旧入口已停用", disabled: true, reason: "当前前端不再接入旧赛事分奖入口", canTrigger: false };
  }

  function applyButtonState(button, actionState) {
    if (!button) return;
    button.textContent = actionState.label;
    button.disabled = actionState.disabled;
    button.title = actionState.reason || "";
  }

  function normalizeSeat(raw, id) {
    const zone = zoneInfo(id);
    const occupyTime = Number(raw.occupyTime);
    const occupied = raw.owner !== ZERO;
    const cooldownEndTime = occupyTime + 900;
    const isCooling = occupied && Math.floor(Date.now() / 1000) < cooldownEndTime;

    return {
      id,
      zoneKey: zone.key,
      zoneName: zone.name,
      owner: raw.owner,
      currentPrice: raw.currentPrice,
      paidAmount: raw.paidAmount,
      occupyTime,
      baseWeight: Number(raw.baseWeight),
      tacticalBoostWeight: Number(raw.performanceBoostWeight),
      tacticalBoostExpiry: Number(raw.performanceBoostExpiry),
      lastWeightUpdate: Number(raw.lastWeightUpdate),
      occupied,
      cooldownEndTime,
      isCooling
    };
  }

  async function ensureChain(provider = state.injectedProvider || getInjectedProvider()) {
    if (!provider) throw new Error("未检测到钱包");
    const currentChain = await provider.request({ method: "eth_chainId" });
    if (currentChain === CONFIG.chainIdHex) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CONFIG.chainIdHex }]
      });
    } catch (switchError) {
      if (switchError.code !== 4902) throw switchError;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CONFIG.chainIdHex,
          chainName: CONFIG.chainName,
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: [CONFIG.rpcUrl],
          blockExplorerUrls: [CONFIG.explorer]
        }]
      });
    }
  }

  async function connectWallet(silent = false) {
    const provider = getInjectedProvider();
    state.injectedProvider = provider;
    if (!provider) {
      if (!silent && isMobileDevice()) return openWalletGuide();
      if (!silent) showToast("请在钱包浏览器中打开，或安装 MetaMask / OKX / Binance 钱包", "error");
      return;
    }

    try {
      await ensureChain(provider);
      const method = silent ? "eth_accounts" : "eth_requestAccounts";
      const accounts = await provider.request({ method });
      if (!accounts.length) return;

      state.browserProvider = new ethers.BrowserProvider(provider);
      state.signer = await state.browserProvider.getSigner();
      state.userAddress = accounts[0];
      state.writeVault = new ethers.Contract(CONFIG.vaultAddress, vaultAbi, state.signer);
      state.writeToken = new ethers.Contract(CONFIG.tokenAddress, tokenAbi, state.signer);

      setBusy(true, "连接钱包", "请在钱包中确认连接请求。");
      setWalletButtonText();
      await loadAll();
      showToast("钱包已连接", "success");
    } catch (error) {
      const msg = parseError(error);
      const isSyncMsg = msg === "操作已执行（节点状态同步中）";
      if (!silent) showToast(msg, isSyncMsg ? "success" : "error");
    } finally {
      setBusy(false);
    }
  }

  async function loadTokenMeta() {
    const [name, rawSymbol, decimals] = await Promise.all([
      state.readToken.name(),
      state.readToken.symbol(),
      state.readToken.decimals()
    ]);

    const symbolText = String(rawSymbol || "").trim();
    const cleanedSymbol = symbolText.replace(/1$/, "");

    state.tokenMeta = {
      name,
      rawSymbol: symbolText,
      symbol: cleanedSymbol,
      decimals: Number(decimals)
    };
  }

  async function loadSeatSnapshots() {
    return [];
  }

  async function loadPublicData() {
    if (!state.readVault) return;
    const description = await state.readVault.description();
    const seasonId = Number(await state.readVault.currentSeasonId());
    const [t, locked, treasury] = await Promise.all([
      state.readVault.seasonTimeRange(seasonId),
      state.readVault.isLockPeriod(seasonId),
      state.readVault.stockKingTreasury()
    ]);
    const actionSeasonId = locked ? seasonId + 1 : seasonId;
    const legions = await Promise.all(
      Array.from({ length: 5 }, async (_, i) => {
        const id = i + 1;
        const [g, s] = await Promise.all([
          state.readVault.legions(id),
          state.readVault.seasonLegions(actionSeasonId, id)
        ]);
        return { legionId: id, leader: g.leader, heat: s.heat, qualifiedWeight: s.qualifiedWeight, validContributorCount: Number(s.validContributorCount || 0) };
      })
    );
    state.publicData = { description, currentSeasonId: seasonId, actionSeasonId, seasonStart: Number(t[0]), seasonEnd: Number(t[1]), seasonLockTime: Number(t[2]), isLocked: locked, treasury, legions, seats: [] };
  }

  async function loadUserData() {
    if (!state.userAddress) return void (state.userData = null);
    const [u, balance, seasonId, allowance] = await Promise.all([state.readVault.users(state.userAddress), state.readToken.balanceOf(state.userAddress), state.readVault.currentSeasonId(), state.readToken.allowance(state.userAddress, CONFIG.vaultAddress)]);
    const activeSeasonId = Number(state.publicData?.actionSeasonId || seasonId);
    const lid = Number(u.currentLegion || 0);
    const seasonUser = lid ? await state.readVault.userSeasonLegion(activeSeasonId, state.userAddress, lid) : null;
    const hist = lid ? await state.readVault.userLegionHistoricalContribution(state.userAddress, lid) : 0n;
    state.userData = { currentLegion: lid, rank: Number(u.rank || 0), lastLegionChangeTime: Number(u.lastLegionChangeTime || 0), balance, historicalContribution: hist, currentSeasonRaw: seasonUser?.rawContribution || 0n, currentSeasonWeighted: seasonUser?.weightedContribution || 0n, currentSeasonQualifiedWeighted: seasonUser?.qualifiedWeightedContribution || 0n, allowance, pendingBNB: 0n, unclaimedNTM: 0n, tacticalPackRewardTokens: 0n, inventoryCounts: [] };
  }

  async function loadAll() {
    if (!state.readVault || !state.readToken) return;
    await loadPublicData();
    if (state.userAddress) {
      await loadUserData();
    }
    renderAll();
  }

  function fmtRemain(ts) { const r = Math.max(0, ts - Math.floor(Date.now() / 1000)); const h = Math.floor(r / 3600), m = Math.floor((r % 3600) / 60), s = r % 60; return `${h}h ${m}m ${s}s`; }
  function formatInteger(value) { return String(value ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function getSortedLegions() { return [...(state.publicData.legions || [])].sort((a, b) => a.heat === b.heat ? a.legionId - b.legionId : b.heat > a.heat ? 1 : -1); }
  function pctFromHeat(heat, maxHeat) {
    if (!maxHeat || maxHeat <= 0n) return 0;
    const pct = Number((BigInt(heat || 0) * 10000n) / maxHeat) / 100;
    return Math.max(0, Math.min(100, pct));
  }
  function barWidth(heat, maxHeat) {
    if (!heat || heat <= 0n) return 0;
    const pct = pctFromHeat(heat, maxHeat);
    if (pct <= 0) return 0;
    return Math.min(92, Math.max(6, pct));
  }
  function renderLeaderboardRows(list) {
    const maxHeat = list.reduce((m, x) => (x.heat > m ? x.heat : m), 0n);
    return list
      .map((x, i) => {
        const rank = i + 1;
        const name = getLegionName(x.legionId);
        const icon = getLegionIcon(x.legionId);
        const width = barWidth(x.heat, maxHeat);
        const rankClass = rank === 1 ? "top1" : rank === 2 ? "top2" : rank === 3 ? "top3" : "";
        const leaderText = x.leader && x.leader !== "0x0000000000000000000000000000000000000000" ? shortAddr(x.leader) : "暂无";
        const countText = x.validContributorCount || 0;
        return `<div class="lb-row" data-legion="${x.legionId}"><div class="lb-rank ${rankClass}">${rank}</div><div class="lb-icon">${icon ? `<img src="${icon}" alt="${name}" />` : ""}</div><div class="lb-main"><div class="lb-name">${name}</div><div class="lb-bar"><div class="lb-bar-fill" style="width:${width}%"></div></div><div class="lb-meta">军团长: ${leaderText} &nbsp;|&nbsp; 有效人数: ${countText}</div></div><div class="lb-score">${formatInteger(x.heat)}</div></div>`;
      })
      .join("");
  }
  function renderHero() {
    if (!el.heroSeasonId) return;
    const showSeasonId = state.publicData.actionSeasonId || state.publicData.currentSeasonId;
    const isLocked = Boolean(state.publicData.isLocked);
    el.heroSeasonId.textContent = showSeasonId || "--";
    el.heroCountdown.textContent = fmtRemain(state.publicData.seasonEnd);
    if (el.heroCountdownLabel) el.heroCountdownLabel.textContent = isLocked ? "锁榜倒计时" : "赛季倒计时";
    if (el.heroCountdownHint) el.heroCountdownHint.textContent = isLocked ? "锁榜期剩余时间" : `距锁榜 ${fmtRemain(state.publicData.seasonLockTime)}`;
    el.heroTreasury.textContent = `${Number(ethers.formatEther(state.publicData.treasury || 0n)).toFixed(4)} BNB`;
    const kicker = document.querySelector("#leaderboardBoard .hero-board-kicker");
    if (kicker) kicker.textContent = isLocked ? "实时热度（计入下轮）" : "实时热度";
    const list = getSortedLegions();
    if (el.heroBoardList) {
      el.heroBoardList.classList.remove("is-loading");
      el.heroBoardList.setAttribute("aria-busy", "false");
      el.heroBoardList.innerHTML = renderLeaderboardRows(list);
    }
    if (el.heroKingName) {
      const top = list[0];
      const hasHeat = top && (top.heat > 0n);
      el.heroKingName.textContent = hasHeat ? getLegionName(top.legionId) : "--";
    }
  }
  function renderLegionBoard() {
    if (!el.legionBoard) return;
    const list = getSortedLegions();
    el.legionBoard.innerHTML = list.length ? renderLeaderboardRows(list) : `<div class="empty-seat-card">暂无军团数据</div>`;
  }

  function seatFilterLabel() {
    return "旧席位区已停用";
  }

  function setSeatFilter(filter) {
    state.currentFilter = filter;
  }

  function enterSeatZone(filter) {
    setSeatFilter(filter);
  }

  function getFilteredSeats() {
    return [];
  }

  function renderSeats() {
    if (el.seatsGrid) el.seatsGrid.innerHTML = "";
  }

  function renderRecentRecords() {
    if (el.recentRecords) el.recentRecords.innerHTML = "";
  }

  function renderActionButtons() {
    // 移除了页面上固定的领取和购买按钮
  }

  function renderMyPanel() {
    if (!el.myPanel) return;
    if (!state.userData) return void (el.myPanel.innerHTML = `<div class="my-meta" data-accent="muted"><div class="my-meta-head"><div class="my-meta-label"><span>钱包状态</span><em>连接钱包后可读写链上数据</em></div><div class="meta-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 7H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div></div><strong>未连接</strong></div>`);

    const legionId = Number(state.userData.currentLegion || 0);
    const rank = Number(state.userData.rank || 0);
    const balance = BigInt(state.userData.balance || 0n);
    const holdingOk = balance >= MIN_HOLDING_TOKEN;
    const holdingPct = MIN_HOLDING_TOKEN > 0n ? Number((balance * 10000n) / MIN_HOLDING_TOKEN) / 100 : 0;

    const currentLegionLabel = legionId ? `0${legionId} ${getLegionName(legionId)}` : "未加入";
    const legionIcon = legionId ? getLegionIcon(legionId) : "";
    const rankName = getRankName(rank);
    const rankIcon = getRankIcon(rank);

    const raw = BigInt(state.userData.currentSeasonRaw || 0n);
    const qualified = BigInt(state.userData.currentSeasonQualifiedWeighted || 0n);
    const base = raw > qualified ? raw : qualified;
    const rawPct = base > 0n ? Number((raw * 10000n) / base) / 100 : 0;
    const qualifiedPct = base > 0n ? Number((qualified * 10000n) / base) / 100 : 0;

    const eligibleRank = rank >= 2;
    const eligibleText = eligibleRank && holdingOk ? `已满足资格 · 有效加权 ${getRankWeight(rank)}` : eligibleRank && !holdingOk ? "军衔已满足 · 仍需持仓达标" : "军衔未满足 · 贡献仅计入原始热度";

    const rankTrack = RANK_NAMES.map((name, idx) => `<span class="my-rank-chip ${idx === rank ? "active" : ""}">Lv${idx} ${name}</span>`).join("");

    el.myPanel.innerHTML = `
      <div class="my-meta" data-accent="muted">
        <div class="my-meta-head">
          <div class="my-meta-label"><span>地址</span><em>当前已连接钱包</em></div>
          <div class="meta-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>
        <strong>${shortAddr(state.userAddress)}</strong>
      </div>

      <div class="my-meta" data-accent="primary">
        <div class="my-meta-head">
          <div class="my-meta-label"><span>当前军团</span><em>${legionId ? "你当前赛季归属的军团" : "加入军团后才可参与赛季竞争"}</em></div>
          <div class="meta-icon">${legionIcon ? `<img src="${legionIcon}" alt="" />` : ""}</div>
        </div>
        <strong>${currentLegionLabel}</strong>
      </div>

      <div class="my-meta" data-accent="primary">
        <div class="my-meta-head">
          <div class="my-meta-label"><span>当前军衔</span><em>${eligibleRank ? `当前有效加权 ${getRankWeight(rank)}` : "当前处于基础热度阶段"}</em></div>
          <div class="meta-icon">${rankIcon ? `<img src="${rankIcon}" alt="" />` : ""}</div>
        </div>
        <strong>Lv${rank} · ${rankName}</strong>
      </div>

      <div class="my-meta" data-accent="muted">
        <div class="my-meta-head">
          <div class="my-meta-label"><span>代币余额</span><em>门槛：≥ ${formatToken(MIN_HOLDING_TOKEN)}</em></div>
          <div class="meta-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1v22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>
        <strong>${formatToken(balance)}</strong>
        <div class="my-progress"><div class="my-progress-bar"><i style="width:${Math.max(0, Math.min(100, holdingPct))}%"></i></div><span class="my-progress-text">${holdingOk ? "已达标" : `${Math.max(0, Math.min(100, holdingPct)).toFixed(1)}%`}</span></div>
      </div>

      <div class="my-meta" data-accent="muted">
        <div class="my-meta-head">
          <div class="my-meta-label"><span>历史贡献</span><em>累计到当前军团的历史热度</em></div>
          <div class="meta-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 14l3-3 3 2 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>
        <strong>${formatInteger(state.userData.historicalContribution || 0n)}</strong>
      </div>

      <div class="my-meta" data-accent="muted">
        <div class="my-meta-head">
          <div class="my-meta-label"><span>本季原始贡献</span><em>热度累计口径：BNB × 1,000,000</em></div>
          <div class="meta-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 9h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 13h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
        </div>
        <strong>${formatInteger(raw)}</strong>
      </div>

      <div class="my-meta my-meta-span" data-accent="primary">
        <div class="my-meta-head">
          <div class="my-meta-label"><span>本季有效加权贡献</span><em>${eligibleText}</em></div>
          <div class="meta-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>
        <strong>${formatInteger(qualified)}</strong>
        <div class="my-bars">
          <div class="my-bar"><span>原始</span><div class="my-bar-track"><i style="width:${Math.max(0, Math.min(100, rawPct))}%"></i></div><b>${formatInteger(raw)}</b></div>
          <div class="my-bar"><span>有效</span><div class="my-bar-track"><i style="width:${Math.max(0, Math.min(100, qualifiedPct))}%"></i></div><b>${formatInteger(qualified)}</b></div>
        </div>
      </div>

      <div class="my-meta my-meta-wide" data-accent="muted">
        <div class="my-meta-head">
          <div class="my-meta-label"><span>军衔体系</span><em>当前等级高亮显示</em></div>
          <div class="meta-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>
        <div class="my-rank-track">${rankTrack}</div>
      </div>
    `;
  }

  function renderDrawer() {
    if (!el.drawerContent) return;
    el.drawerContent.innerHTML = `<p class="empty-text">旧背包与战术包面板已停用，当前前端仅保留 SPCX STOCK 新玩法读写入口。</p>`;
  }

  function loadSeatImage(img, src) {
    if (!img || !src) return;
    if (img.dataset.loaded === "1") return;
    img.dataset.loaded = "1";

    const obs = getSeatImageObserver();

    if (LOADED_COACH_IMAGES.has(src)) {
      img.src = src;
      img.removeAttribute("data-src");
      obs?.unobserve(img);
      return;
    }

    img.addEventListener(
      "load",
      () => {
        LOADED_COACH_IMAGES.add(src);
        img.removeAttribute("data-src");
        obs?.unobserve(img);
      },
      { once: true }
    );

    img.addEventListener(
      "error",
      () => {
        const retry = Number(img.dataset.retry || "0");
        img.src = PLACEHOLDER_COACH_IMAGE;

        if (!obs || retry >= 2) {
          img.removeAttribute("data-src");
          obs?.unobserve(img);
          return;
        }

        img.dataset.retry = String(retry + 1);
        img.dataset.loaded = "0";

        window.setTimeout(() => {
          if (!img.isConnected) return;
          obs.observe(img);
        }, 500 * (retry + 1));
      },
      { once: true }
    );

    img.src = src;
  }

  function getSeatImageObserver() {
    if (getSeatImageObserver._observer) return getSeatImageObserver._observer;
    if (!("IntersectionObserver" in window)) return null;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = entry.target;
          const src = img.getAttribute("data-src");
          if (src) loadSeatImage(img, src);
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: 0.01 }
    );

    getSeatImageObserver._observer = obs;
    return obs;
  }

  function hydrateSeatCardImages() {
    const imgs = Array.from(document.querySelectorAll(".seat-card-image[data-src]"));
    const observer = getSeatImageObserver();
    const eagerCount = isMobileDevice() ? 6 : 12;

    imgs.forEach((img, index) => {
      if (img.dataset.hydrated === "1") return;
      img.dataset.hydrated = "1";

      const src = img.getAttribute("data-src");
      if (!src) return;

      if (LOADED_COACH_IMAGES.has(src) || !observer || index < eagerCount) {
        loadSeatImage(img, src);
        return;
      }

      observer.observe(img);
    });
  }

  function tickSeatCountdowns() {
    const now = Math.floor(Date.now() / 1000);

    if (el.heroCountdown && state.publicData) {
      const target = state.publicData.isLocked ? state.publicData.seasonEnd : state.publicData.seasonLockTime;
      if (target) el.heroCountdown.textContent = fmtRemain(target);
    }

    const nodes = document.querySelectorAll(".seat-card[data-seat-id]");
    nodes.forEach((node) => {
      const id = Number(node.getAttribute("data-seat-id"));
      const seat = state.publicData.seats[id];
      if (!seat) return;
      const tag = node.querySelector(".status-tag");
      if (!tag) return;
      if (!seat.occupied) {
        tag.textContent = "可竞聘";
        return;
      }
      const remain = Math.max(0, seat.cooldownEndTime - now);
      if (remain > 0) {
        const m = Math.floor(remain / 60);
        const s = remain % 60;
        tag.textContent = `保护期 ${m}分 ${s}秒`;
      } else {
        tag.textContent = "可竞聘";
      }
    });
  }

  function renderAll() { renderHero(); renderLegionBoard(); renderMyPanel(); renderRewardResult?.(); }

  function openModal(title, html) {
    el.modalTitle.textContent = title;
    el.modalBody.className = "modal-body";
    el.modalBackdrop.querySelector(".modal")?.classList.remove("rules-dialog");
    el.modalBody.innerHTML = html;
    el.modalBackdrop.classList.remove("hidden");
  }

  function closeModal() {
    el.modalBackdrop.classList.add("hidden");
    el.modalBody.className = "modal-body";
    el.modalBackdrop.querySelector(".modal")?.classList.remove("rules-dialog");
    state.selectedSeatId = null;
    state.rewardUi = null;
  }

  function openDrawer() {
    showToast("当前版本暂未启用背包面板", "error");
  }

  function closeDrawer() {
    el.drawer.classList.remove("open");
  }

  function openSeatDetail() {
    showToast("旧席位详情已停用，当前前端仅保留 SPCX STOCK 新玩法入口", "error");
  }

  async function ensureApproval(amount) {
    if (!state.userAddress) await connectWallet();
    if (!state.userData) await loadUserData();
    if (!needsApproval(amount)) return;

    setBusy(true, "授权代币", "请在钱包中确认授权，并等待链上完成确认。");
    try {
      showToast("正在发起代币授权，请在钱包中确认");
      const tx = await state.writeToken.approve(CONFIG.vaultAddress, amount);
      await tx.wait();
      showToast("授权成功", "success");
      await loadUserData();
    } finally {
      setBusy(false);
    }
  }

  async function withTx(label, action) {
    if (state.isSubmitting) return;
    setBusy(true, label, `请在钱包中确认${label}，并等待链上完成确认。`);
    try {
      await action();
      await loadAll();
      showToast(`${label}成功`, "success");
      closeModal();
    } catch (error) {
      const msg = parseError(error);
      const isSyncMsg = msg === "操作已执行（节点状态同步中）";
      showToast(msg, isSyncMsg ? "success" : "error");
    } finally {
      setBusy(false);
    }
  }

  async function takeSeat() {
    unsupportedLegacyAction();
  }

  function unsupportedLegacyAction() {
    showToast("旧版世界杯玩法入口已停用，当前前端仅接入 SPCX STOCK 新玩法", "error");
  }

  async function buyBlindBox() { unsupportedLegacyAction(); }
  async function settleMyTacticalPack() { unsupportedLegacyAction(); }
  async function exitSeat() { unsupportedLegacyAction(); }
  async function claimBaseReward() { unsupportedLegacyAction(); }
  async function claimBackpackReward() { unsupportedLegacyAction(); }
  async function syncMyRewards() { unsupportedLegacyAction(); }
  async function useDiscount() { unsupportedLegacyAction(); }
  async function useBuff() { unsupportedLegacyAction(); }
  async function usePermanentBuff() { unsupportedLegacyAction(); }

  function openRules() {
    openModal("军团玩法", `
      <div class="rules-modal rules-layout">
        <section class="rules-hero rules-top">
          <div><p class="eyebrow">SPCX STOCK 玩法总览</p><h3>五大军团、军衔成长、热度冲榜、赛季分奖与 24 小时股王</h3><p>先看加入规则，再看热度与资格，最后看 30 分钟单轮结算、48 轮汇总成 24 小时股王周期，以及军团长竞争。</p></div>
        </section>
        <section class="rules-onboard">
          <div><p class="rules-section-title">五大固定军团</p><div class="rules-legions-grid"><span class="rules-legion-pill">01 发射军团</span><span class="rules-legion-pill">02 星链军团</span><span class="rules-legion-pill">03 机器人军团</span><span class="rules-legion-pill">04 火星军团</span><span class="rules-legion-pill">05 能源军团</span></div></div>
          <article class="rules-side-note"><strong>首次加入与后续换团</strong><p>首次可免费绑定 1-5 任一军团；后续切换必须通过“换仓并贡献”完成，最低 0.005 BNB，其中 20% 为税，税后 80% 计入新军团热度。</p></article>
        </section>
        <section class="rules-core">
          <div class="rules-stack">
            <article class="rules-visual-card"><strong>热度如何形成</strong><div class="rules-eq"><span>直接贡献</span><b>BNB × 1,000,000</b></div><div class="rules-eq"><span>升级军衔</span><b>费用 × 1,000,000</b></div><div class="rules-eq"><span>换仓并贡献</span><b>税后 80% × 1,000,000</b></div><div class="rules-eq"><span>燃烧主币</span><b>数量 ÷ 1000</b></div></article>
            <article class="rules-visual-card"><strong>入场门槛与有效资格</strong><div class="rules-fact-grid"><div class="rules-fact"><span>直接贡献</span><b>最低 0.001 BNB</b></div><div class="rules-fact"><span>换仓并贡献</span><b>最低 0.005 BNB</b></div><div class="rules-fact"><span>有效持仓</span><b>1,000,000 主币</b></div><div class="rules-fact"><span>起算军衔</span><b>分析师及以上</b></div></div><div class="rules-bars"><i style="width:50%">分析师 100%</i><i style="width:55%">基金经理 110%</i><i style="width:60%">投资总监 120%</i><i style="width:70%">华尔街之狼 140%</i><i style="width:80%">股神 160%</i><i style="width:100%">Stock Emperor 200%</i></div><p>只有满足持仓门槛且达到分析师及以上，个人贡献才会进入有效加权排名。</p></article>
          </div>
          <div class="rules-stack">
            <article class="rules-visual-card"><strong>等级与升级费用</strong><div class="rules-ladder-chart"><div class="rules-ladder-step"><em>Lv0</em><small>散户</small><span>初始军衔</span></div><div class="rules-ladder-step"><em>Lv1</em><small>老韭菜</small><span>0.001 BNB</span></div><div class="rules-ladder-step"><em>Lv2</em><small>分析师</small><span>0.005 BNB</span></div><div class="rules-ladder-step"><em>Lv3</em><small>基金经理</small><span>0.01 BNB</span></div><div class="rules-ladder-step"><em>Lv4</em><small>投资总监</small><span>0.02 BNB</span></div><div class="rules-ladder-step"><em>Lv5</em><small>华尔街之狼</small><span>0.05 BNB</span></div><div class="rules-ladder-step"><em>Lv6</em><small>股神</small><span>0.1 BNB</span></div><div class="rules-ladder-step highlight"><em>Lv7</em><small>Stock Emperor</small><span>0.2 BNB</span></div></div></article>
            <article class="rules-visual-card"><strong>军团长产生与挑战</strong><div class="rules-eq"><span>初始军团长</span><b>首位成功挑战者</b></div><div class="rules-eq"><span>挑战门槛</span><b>投资总监及以上</b></div><div class="rules-eq"><span>比较标准</span><b>本军团历史贡献更高</b></div><div class="rules-eq"><span>成功结果</span><b>成为军团长并获得 5 分钟保护</b></div><p>锁榜期和未结算阶段不可挑战，避免赛果被临门改写。</p></article>
          </div>
        </section>
        <section class="rules-settlement">
          <article class="rules-visual-card"><strong>赛季流程</strong><div class="rules-flow"><div class="rules-flow-step"><label>01</label><span>赛季开始</span><b>30 分钟一轮</b></div><div class="rules-flow-step"><label>02</label><span>锁榜阶段</span><b>最后 1 分钟</b></div><div class="rules-flow-step active"><label>03</label><span>本轮释放</span><b>当前奖池 40%</b></div><div class="rules-flow-step"><label>04</label><span>用户领奖</span><b>30 天内手动领取</b></div></div><p>单轮结算按 30 分钟进行；每累计 48 轮，会汇总成一个 24 小时股王周期。</p></article>
          <article class="rules-visual-card"><strong>分奖结构、领取与 24 小时股王</strong><div class="rules-pie-legend"><span><em class="c1"></em>第1名 50%</span><span><em class="c2"></em>第2名 30%</span><span><em class="c3"></em>第3名 20%</span></div><div class="rules-allocation"><i class="c1" style="width:50%"></i><i class="c2" style="width:30%"></i><i class="c3" style="width:20%"></i></div><div class="rules-eq"><span>24 小时股王</span><b>按 48 轮累计结果产生</b></div><div class="rules-eq"><span>统计口径</span><b>看日周期积分、第一名次数与累计热度</b></div><p>若军团长在锁榜快照时满足资格，可额外拿到该军团奖励的 10%；所有奖励均需用户手动领取，过期回库。</p></article>
        </section>
        <section class="rules-leader-strip"><div><span>首次绑定</span><b>首次入团免费，任选 1-5 军团</b></div><div><span>换团路径</span><b>只能通过换仓并贡献完成</b></div><div><span>24 小时股王</span><b>每 48 轮汇总一次日周期结果</b></div></section>
      </div>
    `);
    el.modalBody.classList.add("rules-modal-body");
    el.modalBackdrop.querySelector(".modal")?.classList.add("rules-dialog");
  }

  function openPoolInfo() {
    unsupportedLegacyAction();
  }

  function openBlindBoxPanel() {
    unsupportedLegacyAction();
  }

  function openMyPanelModal() {
    unsupportedLegacyAction();
  }

  function getActiveRewardUi() {
    if (state.rewardUi) return state.rewardUi;
    return { seasonEl: el.rewardSeasonId, legionEl: el.rewardLegionId, resultEl: el.rewardResult };
  }

  async function previewReward() {
    try {
      if (!state.userAddress) await connectWallet();
      if (!state.readVault || !state.readToken) throw new Error("合约未初始化，请先刷新或重新连接钱包");
      const ui = getActiveRewardUi();
      const sid = Number(ui.seasonEl?.value);
      const lid = Number(ui.legionEl?.value);
      if (!sid || lid < 1 || lid > 5) return showToast("请输入有效的赛季和军团", "error");
      if (ui.resultEl) ui.resultEl.textContent = `查询中…（赛季 ${sid} / 军团 ${lid}）`;
      const [seasonUser, seasonLegion, seasonState, balance] = await Promise.all([
        state.readVault.userSeasonLegion(sid, state.userAddress, lid),
        state.readVault.seasonLegions(sid, lid),
        state.readVault.seasons(sid),
        state.readToken.balanceOf(state.userAddress)
      ]);
      const now = BigInt(Math.floor(Date.now() / 1000));
      const meetsHoldingNow = balance >= MIN_HOLDING_TOKEN;
      const memberAmount = !seasonUser.claimed && seasonUser.qualifiedWeightedContribution > 0n && seasonLegion.qualifiedWeight > 0n
        ? (seasonLegion.memberRewardPool * seasonUser.qualifiedWeightedContribution) / seasonLegion.qualifiedWeight
        : 0n;
      const isLeader = Boolean(seasonLegion.leaderEligible && seasonLegion.leaderAtLock && String(seasonLegion.leaderAtLock).toLowerCase() === state.userAddress.toLowerCase());
      const leaderAmount = !seasonUser.leaderClaimed && isLeader ? seasonLegion.leaderRewardAmount : 0n;
      const expired = Boolean(seasonState.settled && BigInt(seasonState.claimDeadline || 0) > 0n && now > BigInt(seasonState.claimDeadline));
      const claimable = seasonState.settled && !expired && meetsHoldingNow ? memberAmount + leaderAmount : 0n;
      state.rewardPreview = { claimable, memberAmount, leaderAmount, expired, meetsHoldingNow, alreadyClaimed: claimable === 0n && Boolean(seasonUser.claimed || seasonUser.leaderClaimed), settled: Boolean(seasonState.settled) };
      renderRewardResult(sid, lid);
    } catch (error) {
      const msg = parseError(error);
      const ui = getActiveRewardUi();
      if (ui.resultEl) ui.resultEl.textContent = `查询失败：${msg}`;
      showToast(msg, "error");
    }
  }

  function renderRewardResult(sid, lid) {
    const ui = getActiveRewardUi();
    const target = ui.resultEl;
    if (!target) return;
    const p = state.rewardPreview;
    if (!p) return;
    const claimable = Number(ethers.formatEther(p.claimable)).toFixed(4);
    const memberAmount = Number(ethers.formatEther(p.memberAmount)).toFixed(4);
    const leaderAmount = Number(ethers.formatEther(p.leaderAmount)).toFixed(4);
    if (!p.settled) return void (target.textContent = `赛季 ${sid} / 军团 ${lid}：该赛季还没结算，暂不可领取。`);
    if (p.expired) return void (target.textContent = `赛季 ${sid} / 军团 ${lid}：该奖励已过期（30 天窗口已结束）。`);
    if (p.alreadyClaimed) return void (target.textContent = `赛季 ${sid} / 军团 ${lid}：已领取。`);
    if (!p.meetsHoldingNow) return void (target.textContent = `赛季 ${sid} / 军团 ${lid}：当前持仓不足，暂不可领取。`);
    if (p.claimable === 0n) return void (target.textContent = `赛季 ${sid} / 军团 ${lid}：暂无可领取奖励。成员 ${memberAmount} BNB；军团长 ${leaderAmount} BNB。`);
    target.textContent = `赛季 ${sid} / 军团 ${lid}：可领取 ${claimable} BNB；成员 ${memberAmount}；军团长 ${leaderAmount}。`;
  }

  async function claimReward() {
    if (!state.userAddress) await connectWallet();
    if (!state.writeVault) return showToast("请先连接钱包后再领取", "error");
    const ui = getActiveRewardUi();
    const sid = Number(ui.seasonEl?.value);
    const lid = Number(ui.legionEl?.value);
    if (!sid || lid < 1 || lid > 5) return showToast("请输入有效的赛季和军团", "error");
    await withTx("领取奖励", async () => {
      const tx = await state.writeVault.claim(sid, lid);
      await tx.wait();
      await previewReward();
    });
  }
  async function openJoinLegionModal() {
    if (!state.userAddress) await connectWallet();
    if (!state.userData) await loadUserData();

    const currentLegion = Number(state.userData?.currentLegion || 0);
    const selectedLegion = currentLegion || 1;
    const legionNames = { 1: "发射军团", 2: "星链军团", 3: "机器人军团", 4: "火星军团", 5: "能源军团" };
    const currentLabel = currentLegion ? `0${currentLegion} ${legionNames[currentLegion]}` : "未加入";

    const headText = currentLegion
      ? `你已加入 <b>${currentLabel}</b>。后续换团请使用“换仓并贡献”。`
      : "首次加入后将绑定当前军团，后续切换请使用换仓并贡献。";

    const options = [1, 2, 3, 4, 5]
      .map((id) => {
        const isActive = id === selectedLegion;
        const isCurrent = currentLegion && id === currentLegion;
        const isDisabled = currentLegion && !isCurrent;
        const sub = currentLegion ? (isCurrent ? "你的当前军团" : "已加入后不可在此更改") : `选择军团 ${id}`;
        return `<button type="button" class="chip legion-option ${isActive ? "active" : ""} ${isCurrent ? "current" : ""} ${isDisabled ? "disabled" : ""}" data-legion-option="${id}"><span class="legion-option-top"><span class="legion-option-id">0${id}</span><span class="legion-option-dot"></span></span><span class="legion-option-name">${legionNames[id]}</span><span class="legion-option-sub">${sub}</span></button>`;
      })
      .join("");

    openModal(
      "加入军团",
      `<div class="legion-picker-shell"><div class="legion-picker-head"><span>选择你的军团</span><p>${headText}</p></div><div class="legion-picker">${options}</div><input id="joinLegionInput" type="hidden" value="${selectedLegion}" /></div><div class="inline-actions legion-picker-actions">${currentLegion ? `<button id="joinLegionSwitchBtn" class="primary-btn">去换仓并贡献</button>` : `<button id="joinLegionConfirmBtn" class="primary-btn">确认加入军团</button>`}</div>`
    );

    if (currentLegion) {
      document.getElementById("joinLegionSwitchBtn")?.addEventListener("click", () => {
        closeModal();
        openSwitchLegionModal();
      });
      return;
    }

    document.querySelectorAll("[data-legion-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("joinLegionInput").value = btn.dataset.legionOption;
        document.querySelectorAll("[data-legion-option]").forEach((item) => item.classList.toggle("active", item === btn));
      });
    });

    document.getElementById("joinLegionConfirmBtn")?.addEventListener("click", async () => {
      const id = Number(document.getElementById("joinLegionInput")?.value);
      if (id < 1 || id > 5) return showToast("请选择 1-5 军团", "error");
      await withTx("加入军团", async () => {
        const tx = await state.writeVault.joinLegion(id);
        await tx.wait();
      });
    });
  }
  function openContributeModal() {
    const currentLegion = Number(state.userData?.currentLegion || 0);
    const selectedLegion = currentLegion || 1;
    const isLocked = Boolean(state.publicData?.isLocked);
    const lockNote = isLocked ? "当前处于锁榜期，本次贡献将计入下一轮热度。" : "";
    const options = [1, 2, 3, 4, 5]
      .map((id) => `<button type="button" class="chip legion-option ${id === selectedLegion ? "active" : ""} ${id === currentLegion ? "current" : ""}" data-contribute-legion="${id}"><span class="legion-option-top"><span class="legion-option-id">0${id}</span><span class="legion-option-dot"></span></span><span class="legion-option-name">${LEGION_NAMES[id]}</span><span class="legion-option-sub">${id === currentLegion ? "你的当前军团" : `为 ${LEGION_NAMES[id]} 贡献热度`}</span></button>`)
      .join("");
    openModal("BNB贡献", `<div class="legion-picker-shell contribute-shell"><div class="legion-picker-head"><span>选择要贡献的军团</span><p>最低 0.001 BNB；直接贡献按 BNB × 1,000,000 转成军团热度。${lockNote ? `<br/>${lockNote}` : ""}</p></div><div class="legion-picker">${options}</div><input id="contributeLegionInput" type="hidden" value="${selectedLegion}" /><div class="contribute-meta-grid"><div class="contribute-meta-card"><span>贡献 BNB</span><input id="contributeAmountInput" class="text-input" placeholder="例如 0.01" /><p class="input-hint">最低 0.001 BNB</p></div><div class="contribute-meta-card"><span>预计新增热度</span><strong id="contributeHeatPreview">0</strong><p id="contributeLegionHint">本次贡献将计入 0${selectedLegion} ${LEGION_NAMES[selectedLegion]}</p></div></div></div><div class="inline-actions legion-picker-actions"><button id="contributeConfirmBtn" class="primary-btn">确认贡献</button></div>`);
    const input = document.getElementById("contributeAmountInput");
    const hidden = document.getElementById("contributeLegionInput");
    const heatPreview = document.getElementById("contributeHeatPreview");
    const legionHint = document.getElementById("contributeLegionHint");
    const updateContributePreview = () => {
      const amountNum = Number(String(input?.value || "").trim());
      const legionId = Number(hidden?.value || selectedLegion);
      const heat = Number.isFinite(amountNum) && amountNum > 0 ? amountNum * 1000000 : 0;
      if (heatPreview) heatPreview.textContent = heat.toLocaleString("zh-CN", { maximumFractionDigits: 4 });
      if (legionHint) legionHint.textContent = `${legionId === currentLegion && currentLegion ? "当前所属军团" : "本次贡献将计入"} 0${legionId} ${LEGION_NAMES[legionId]}`;
    };
    document.querySelectorAll("[data-contribute-legion]").forEach((btn) => {
      btn.addEventListener("click", () => {
        hidden.value = btn.dataset.contributeLegion;
        document.querySelectorAll("[data-contribute-legion]").forEach((item) => item.classList.toggle("active", item === btn));
        updateContributePreview();
      });
    });
    input?.addEventListener("input", updateContributePreview);
    updateContributePreview();
    document.getElementById("contributeConfirmBtn")?.addEventListener("click", async () => {
      const id = Number(hidden?.value);
      const amount = String(input?.value || "").trim();
      if (id < 1 || id > 5 || !amount) return showToast("请选择军团并输入BNB数量", "error");
      const amountNum = Number(amount);
      if (!Number.isFinite(amountNum) || amountNum < 0.001) return showToast("最低 0.001 BNB", "error");
      await withTx("BNB贡献", async () => {
        const tx = await state.writeVault.contribute(id, { value: ethers.parseEther(amount) });
        await tx.wait();
      });
    });
  }
  function openBurnModal() {
    const currentLegion = Number(state.userData?.currentLegion || 0);
    const selectedLegion = currentLegion || 1;
    const isLocked = Boolean(state.publicData?.isLocked);
    const lockNote = isLocked ? "当前处于锁榜期，本次燃烧贡献将计入下一轮热度。" : "";
    const options = [1, 2, 3, 4, 5]
      .map((id) => `<button type="button" class="chip legion-option ${id === selectedLegion ? "active" : ""} ${id === currentLegion ? "current" : ""}" data-burn-legion="${id}"><span class="legion-option-top"><span class="legion-option-id">0${id}</span><span class="legion-option-dot"></span></span><span class="legion-option-name">${LEGION_NAMES[id]}</span><span class="legion-option-sub">${id === currentLegion && currentLegion ? "你的当前军团" : `为 ${LEGION_NAMES[id]} 燃烧打榜`}</span></button>`)
      .join("");
    const symbol = state.tokenMeta?.symbol || "TOKEN";
    openModal("燃烧打榜", `<div class="legion-picker-shell contribute-shell"><div class="legion-picker-head"><span>选择要燃烧打榜的军团</span><p>最低燃烧 1,000,000 ${symbol}；热度按燃烧数量 ÷ 1000 计算。${lockNote ? `<br/>${lockNote}` : ""}</p></div><div class="legion-picker">${options}</div><input id="burnLegionInput" type="hidden" value="${selectedLegion}" /><div class="contribute-meta-grid"><div class="contribute-meta-card"><span>燃烧数量</span><input id="burnAmountInput" class="text-input" placeholder="例如 1000000" /><p class="input-hint">最低 1,000,000 ${symbol}</p><p id="burnBalanceHint">当前余额 ${formatToken(state.userData?.balance || 0n)} ${symbol}</p></div><div class="contribute-meta-card"><span>预计新增热度</span><strong id="burnHeatPreview">0</strong><p id="burnLegionHint">本次燃烧将计入 0${selectedLegion} ${LEGION_NAMES[selectedLegion]}</p><p id="burnApprovalHint">如授权不足，将先发起授权交易。</p></div></div></div><div class="inline-actions legion-picker-actions"><button id="burnConfirmBtn" class="primary-btn">确认燃烧打榜</button></div>`);
    const input = document.getElementById("burnAmountInput");
    const hidden = document.getElementById("burnLegionInput");
    const heatPreview = document.getElementById("burnHeatPreview");
    const legionHint = document.getElementById("burnLegionHint");
    const approvalHint = document.getElementById("burnApprovalHint");
    const updateBurnPreview = () => {
      const amount = String(input?.value || "").trim();
      const legionId = Number(hidden?.value || selectedLegion);
      let amountUnits = 0n;
      try { amountUnits = amount ? ethers.parseUnits(amount, state.tokenMeta.decimals) : 0n; } catch {}
      const burnHeatDivisor = 1000n * 10n ** BigInt(state.tokenMeta.decimals);
      const heat = amountUnits > 0n ? amountUnits / burnHeatDivisor : 0n;
      if (heatPreview) heatPreview.textContent = formatInteger(heat);
      if (legionHint) legionHint.textContent = `${legionId === currentLegion && currentLegion ? "当前所属军团" : "本次燃烧将计入"} 0${legionId} ${LEGION_NAMES[legionId]}`;
      if (approvalHint) approvalHint.textContent = needsApproval(amountUnits) ? "授权不足，提交时会先发起授权。" : "当前授权充足，可直接燃烧。";
    };
    document.querySelectorAll("[data-burn-legion]").forEach((btn) => {
      btn.addEventListener("click", () => {
        hidden.value = btn.dataset.burnLegion;
        document.querySelectorAll("[data-burn-legion]").forEach((item) => item.classList.toggle("active", item === btn));
        updateBurnPreview();
      });
    });
    input?.addEventListener("input", updateBurnPreview);
    updateBurnPreview();
    document.getElementById("burnConfirmBtn")?.addEventListener("click", async () => {
      const id = Number(hidden?.value);
      const amount = String(input?.value || "").trim();
      if (id < 1 || id > 5 || !amount) return showToast("请选择军团并输入燃烧数量", "error");
      let amountUnits;
      try { amountUnits = ethers.parseUnits(amount, state.tokenMeta.decimals); } catch { return showToast("请输入有效的燃烧数量", "error"); }
      if (amountUnits < 1_000_000n * 10n ** BigInt(state.tokenMeta.decimals)) return showToast(`最低燃烧 1,000,000 ${symbol}`, "error");
      if ((state.userData?.balance || 0n) < amountUnits) return showToast(`${symbol} 余额不足`, "error");
      await ensureApproval(amountUnits);
      await withTx("燃烧打榜", async () => {
        const tx = await state.writeVault.burnForLegion(id, amountUnits);
        await tx.wait();
      });
    });
  }

  async function openUpgradeRankModal() {
    const legionId = state.userData?.currentLegion || 1;
    const currentRank = Number(state.userData?.rank || 0);
    const currentName = getRankName(currentRank);
    if (currentRank >= 7) return openModal("升级军衔", `<div class="upgrade-modal"><div class="upgrade-rank-card next"><span>当前状态</span><strong>Lv7</strong><p>${currentName}</p><em>你已经达到当前版本最高军衔，无需继续升级。</em></div></div>`);
    const nextRank = currentRank + 1;
    const nextName = getRankName(nextRank);
    const fee = await state.readVault.upgradeFees(currentRank);
    const rawHeat = heatFromBnbWei(fee);
    const holdingOk = (state.userData?.balance || 0n) >= MIN_HOLDING_TOKEN;
    const qualifiedAfter = nextRank >= 2 && holdingOk;
    const weightedHeat = qualifiedAfter ? (rawHeat * BigInt(getRankWeightBps(nextRank))) / 10000n : 0n;
    const qualifyText = currentRank < 2 && nextRank >= 2 ? "升级后解锁有效加权资格" : nextRank >= 2 ? `有效加权从 ${getRankWeight(currentRank)} 提升到 ${getRankWeight(nextRank)}` : "升级后仍未进入有效加权资格";
    const qualifySub = nextRank < 2 ? "升级后仍为基础热度阶段" : holdingOk ? "升级后满足持仓门槛" : "升级后仍需持仓 ≥ 1,000,000 主币才计入有效加权";
    const legionLabel = legionId ? `0${legionId} ${getLegionName(legionId)}` : "未加入";
    openModal("升级军衔", `<div class="upgrade-modal"><div class="upgrade-hero"><div class="upgrade-rank-card"><span>当前军衔</span><strong>Lv${currentRank}</strong><p>${currentName}</p><em>${currentRank >= 2 ? `当前有效加权 ${getRankWeight(currentRank)}` : "当前仅累计基础热度"}</em></div><div class="upgrade-arrow">升级至</div><div class="upgrade-rank-card next"><span>升级后</span><strong>Lv${nextRank}</strong><p>${nextName}</p><em>${nextRank >= 2 ? `升级后有效加权 ${getRankWeight(nextRank)}` : "升级后仍为基础热度阶段"}</em></div></div><div class="upgrade-meta-grid"><div class="upgrade-meta-card"><span>所需支付</span><strong>${formatBnb(fee)}</strong><div class="upgrade-metrics"><div><span>预计新增热度</span><b>${formatInteger(rawHeat)}</b></div><div><span>预计有效加权贡献</span><b>${formatInteger(weightedHeat)}</b></div></div><p>升级费用按规则计入当前军团热度。</p></div><div class="upgrade-meta-card"><span>资格变化</span><strong>${qualifyText}</strong><p>${qualifySub}；本次升级将作用于 ${legionLabel}。</p></div></div><div class="inline-actions"><button id="upgradeRankConfirmBtn" class="primary-btn">确认升级到 ${nextName}</button></div></div>`);
    document.getElementById("upgradeRankConfirmBtn")?.addEventListener("click", async () => {
      await withTx("升级军衔", async () => {
        const tx = await state.writeVault.upgradeRank(legionId, { value: fee });
        await tx.wait();
      });
    });
  }
  function openSwitchLegionModal() {
    const currentLegion = Number(state.userData?.currentLegion || 0);
    if (!currentLegion) {
      showToast("请先加入军团后再换仓并贡献", "error");
      return openJoinLegionModal();
    }
    const selectedLegion = currentLegion >= 1 && currentLegion <= 5 ? (currentLegion === 1 ? 2 : 1) : 1;
    const isLocked = Boolean(state.publicData?.isLocked);
    const lockNote = isLocked ? "当前处于锁榜期，本次换仓贡献将计入下一轮热度。" : "";
    const options = [1, 2, 3, 4, 5]
      .map((id) => {
        const disabled = currentLegion && id === currentLegion;
        return `<button type="button" class="chip legion-option ${id === selectedLegion ? "active" : ""} ${id === currentLegion ? "current disabled" : ""}" data-switch-legion="${id}"><span class="legion-option-top"><span class="legion-option-id">0${id}</span><span class="legion-option-dot"></span></span><span class="legion-option-name">${LEGION_NAMES[id]}</span><span class="legion-option-sub">${disabled ? "当前军团（不可选）" : `换入 ${LEGION_NAMES[id]} 并贡献`}</span></button>`;
      })
      .join("");
    const fromLabel = `0${currentLegion} ${LEGION_NAMES[currentLegion]}`;
    const toLabel = `0${selectedLegion} ${LEGION_NAMES[selectedLegion]}`;
    openModal("换仓并贡献", `<div class="legion-picker-shell contribute-shell"><div class="legion-picker-head"><span>换仓并贡献</span><p>把所属军团从 <b id="switchFromLegion">${fromLabel}</b> 切换到 <b id="switchToLegion">${toLabel}</b>，并用 BNB 贡献热度。${lockNote ? `<br/>${lockNote}` : ""}</p></div><div class="switch-helper"><div class="switch-flow"><div class="switch-flow-step"><label>1</label><div><strong>选目标军团</strong><span>不能选择当前军团</span></div></div><div class="switch-flow-step"><label>2</label><div><strong>输入支付 BNB</strong><span>最低 0.005 BNB</span></div></div><div class="switch-flow-step"><label>3</label><div><strong>税后计入热度</strong><span>税后BNB × 1,000,000</span></div></div></div><div class="switch-formula"><span>规则</span><b>20% 税（奖池/回购），80% 计入新军团热度</b></div></div><div class="legion-picker">${options}</div><input id="switchLegionInput" type="hidden" value="${selectedLegion}" /><div class="contribute-meta-grid"><div class="contribute-meta-card"><span>支付 BNB</span><input id="switchAmountInput" class="text-input" placeholder="例如 0.01" /><p class="input-hint">最低 0.005 BNB</p><p id="switchTaxPreview">税费 0 BNB（20%）</p><p id="switchNetPreview">税后计入 0 BNB</p></div><div class="contribute-meta-card"><span>预计新增热度</span><strong id="switchHeatPreview">0</strong><p id="switchPathHint">换仓路径：${fromLabel} → ${toLabel}</p><p id="switchLegionHint">热度计入：${toLabel}</p></div></div></div><div class="inline-actions legion-picker-actions"><button id="switchLegionConfirmBtn" class="primary-btn">确认换仓并贡献</button></div>`);
    const input = document.getElementById("switchAmountInput");
    const hidden = document.getElementById("switchLegionInput");
    const heatPreview = document.getElementById("switchHeatPreview");
    const legionHint = document.getElementById("switchLegionHint");
    const taxPreview = document.getElementById("switchTaxPreview");
    const netPreview = document.getElementById("switchNetPreview");
    const pathHint = document.getElementById("switchPathHint");
    const toLegionEl = document.getElementById("switchToLegion");
    const updateSwitchPreview = () => {
      const amountNum = Number(String(input?.value || "").trim());
      const toLegion = Number(hidden?.value || selectedLegion);
      const tax = Number.isFinite(amountNum) && amountNum > 0 ? amountNum * 0.2 : 0;
      const net = Number.isFinite(amountNum) && amountNum > 0 ? amountNum * 0.8 : 0;
      const heat = net > 0 ? net * 1000000 : 0;
      const toLabelNow = `0${toLegion} ${LEGION_NAMES[toLegion]}`;
      if (heatPreview) heatPreview.textContent = heat.toLocaleString("zh-CN", { maximumFractionDigits: 4 });
      if (taxPreview) taxPreview.textContent = `税费 ${tax.toLocaleString("zh-CN", { maximumFractionDigits: 6 })} BNB（20%）`;
      if (netPreview) netPreview.textContent = `税后计入 ${net.toLocaleString("zh-CN", { maximumFractionDigits: 6 })} BNB → 热度 ${heat.toLocaleString("zh-CN", { maximumFractionDigits: 4 })}`;
      if (pathHint) pathHint.textContent = `换仓路径：0${currentLegion} ${LEGION_NAMES[currentLegion]} → ${toLabelNow}`;
      if (legionHint) legionHint.textContent = `热度计入：${toLabelNow}`;
      if (toLegionEl) toLegionEl.textContent = toLabelNow;
    };
    document.querySelectorAll("[data-switch-legion]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("disabled")) return;
        hidden.value = btn.dataset.switchLegion;
        document.querySelectorAll("[data-switch-legion]").forEach((item) => item.classList.toggle("active", item === btn));
        updateSwitchPreview();
      });
    });
    input?.addEventListener("input", updateSwitchPreview);
    updateSwitchPreview();
    document.getElementById("switchLegionConfirmBtn")?.addEventListener("click", async () => {
      const id = Number(hidden?.value);
      const amount = String(input?.value || "").trim();
      if (id < 1 || id > 5 || !amount) return showToast("请选择目标军团并输入BNB数量", "error");
      if (currentLegion && id === currentLegion) return showToast("目标军团不能与当前军团相同", "error");
      const amountNum = Number(amount);
      if (!Number.isFinite(amountNum) || amountNum < 0.005) return showToast("最低 0.005 BNB", "error");
      await withTx("换仓并贡献", async () => {
        const tx = await state.writeVault.switchLegionWithContribution(id, { value: ethers.parseEther(amount) });
        await tx.wait();
      });
    });
  }

  function openChallengeLeaderModal() {
    const currentLegion = Number(state.userData?.currentLegion || 0);
    if (!currentLegion) {
      showToast("请先加入军团后再挑战军团长", "error");
      return openJoinLegionModal();
    }

    const rank = Number(state.userData?.rank || 0);
    const legionLabel = `0${currentLegion} ${LEGION_NAMES[currentLegion]}`;
    const legion = (state.publicData?.legions || []).find((x) => Number(x.legionId) === currentLegion);
    const leader = legion?.leader || ZERO;
    const isMeLeader = state.userAddress && leader && String(leader).toLowerCase() === String(state.userAddress).toLowerCase();
    const eligibleRank = rank >= 4;

    const title = isMeLeader ? "你已是军团长" : "挑战军团长";
    const mainText = isMeLeader
      ? "当前军团长就是你，无需挑战。"
      : eligibleRank
        ? "发起挑战后，合约将按规则校验军衔与历史贡献门槛。"
        : "需要达到 投资总监 及以上（Lv4）才能发起挑战。";

    openModal(
      title,
      `<div class="upgrade-modal"><div class="upgrade-hero"><div class="upgrade-rank-card"><span>目标军团</span><strong>${legionLabel}</strong><p>当前军团长</p><em>${leader && leader !== ZERO ? shortAddr(leader) : "暂无"}</em></div><div class="upgrade-rank-card next"><span>你的军衔</span><strong>Lv${rank}</strong><p>${getRankName(rank)}</p><em>${eligibleRank ? "满足军衔门槛" : "未满足军衔门槛"}</em></div></div><div class="upgrade-meta-grid"><div class="upgrade-meta-card"><span>历史贡献</span><strong>${formatInteger(state.userData?.historicalContribution || 0n)}</strong><p>合约会按规则校验历史贡献门槛（不足将无法挑战）。</p></div><div class="upgrade-meta-card"><span>说明</span><strong>${eligibleRank ? "可发起挑战" : "暂不可挑战"}</strong><p>${mainText}</p></div></div><div class="inline-actions"><button id="challengeLeaderConfirmBtn" class="primary-btn" ${isMeLeader || !eligibleRank ? "disabled" : ""}>确认挑战</button></div></div>`
    );

    document.getElementById("challengeLeaderConfirmBtn")?.addEventListener("click", async () => {
      if (isMeLeader) return;
      if (!eligibleRank) return showToast("需要达到 投资总监（Lv4）及以上", "error");
      await withTx("挑战军团长", async () => {
        const tx = await state.writeVault.challengeLeader(currentLegion);
        await tx.wait();
      });
    });
  }

  function openContractInfo() {
    if (!ENABLE_CONTRACT_INFO_UI) return;
    openModal("合约信息", `<div class="rule-list"><p>Vault：<a href="${CONFIG.explorer}/address/${CONFIG.vaultAddress}" target="_blank" rel="noreferrer">${CONFIG.vaultAddress}</a></p><p>Token：<a href="${CONFIG.explorer}/address/${CONFIG.tokenAddress}" target="_blank" rel="noreferrer">${CONFIG.tokenAddress}</a></p><p>Factory：<a href="${CONFIG.explorer}/address/${CONFIG.factoryAddress}" target="_blank" rel="noreferrer">${CONFIG.factoryAddress}</a></p><p>当前描述：${state.publicData.description || "加载中..."}</p></div>`);
  }

  function openSettleSeasonModal() {
    const suggested = 3;
    openModal(
      "结算赛季",
      `<div class="legion-picker-shell contribute-shell"><div class="legion-picker-head"><span>补结算已结束的赛季</span><p>赛季结束后需要有人发起结算，奖励才会生成并进入 30 天领取窗口。你可以一次补结算 1-3 轮。</p></div><div class="contribute-meta-grid"><div class="contribute-meta-card"><span>补结算轮数</span><div class="inline-actions" style="margin-top:10px"><button type="button" class="chip ${suggested === 1 ? "active" : ""}" data-settle-count="1">1 轮</button><button type="button" class="chip ${suggested === 2 ? "active" : ""}" data-settle-count="2">2 轮</button><button type="button" class="chip ${suggested === 3 ? "active" : ""}" data-settle-count="3">3 轮</button></div><input id="settleCountInput" type="hidden" value="${suggested}" /><p class="input-hint">建议先用 3 轮补结算，提高补齐速度。</p></div><div class="contribute-meta-card"><span>提示</span><strong>无需支付</strong><p>结算只是一笔链上交易，会消耗少量 Gas。若当前没有待结算轮次，合约会提示“无待结算”。</p></div></div></div><div class="inline-actions legion-picker-actions"><button id="settleSeasonConfirmBtn" class="primary-btn">确认结算</button></div>`
    );

    const hidden = document.getElementById("settleCountInput");
    document.querySelectorAll("[data-settle-count]").forEach((btn) => {
      btn.addEventListener("click", () => {
        hidden.value = btn.dataset.settleCount;
        document.querySelectorAll("[data-settle-count]").forEach((item) => item.classList.toggle("active", item === btn));
      });
    });

    document.getElementById("settleSeasonConfirmBtn")?.addEventListener("click", async () => {
      const maxSeasons = Number(hidden?.value || 1);
      if (!maxSeasons || maxSeasons < 1 || maxSeasons > 3) return showToast("请选择 1-3 轮", "error");
      await withTx("结算赛季", async () => {
        const tx = await state.writeVault.settleSeason(maxSeasons);
        await tx.wait();
      });
    });
  }

  function openRewardsModal() {
    const currentSeasonId = Number(state.publicData?.currentSeasonId || 0);
    const defaultSeasonId = currentSeasonId > 1 ? currentSeasonId - 1 : 1;
    const currentLegion = Number(state.userData?.currentLegion || 0);
    const selectedLegion = currentLegion || 1;
    const options = [1, 2, 3, 4, 5]
      .map((id) => `<button type="button" class="chip legion-option ${id === selectedLegion ? "active" : ""} ${id === currentLegion ? "current" : ""}" data-reward-legion="${id}"><span class="legion-option-top"><span class="legion-option-id">0${id}</span><span class="legion-option-dot"></span></span><span class="legion-option-name">${LEGION_NAMES[id]}</span><span class="legion-option-sub">${id === currentLegion ? "你的当前军团" : "查询该军团奖励"}</span></button>`)
      .join("");

    openModal("查询奖励", `<div class="legion-picker-shell contribute-shell"><div class="legion-picker-head"><span>选择赛季与军团</span><p>奖励在赛季结算后产生；需满足持仓门槛，且在 30 天内手动领取，过期回库。</p></div><div class="contribute-meta-grid"><div class="contribute-meta-card"><span>查询赛季</span><input id="rewardModalSeasonId" class="text-input" placeholder="例如 ${defaultSeasonId}" value="${defaultSeasonId}" /><p class="input-hint">建议先查上一轮：${defaultSeasonId}</p></div><div class="contribute-meta-card"><span>查询军团</span><strong id="rewardModalLegionLabel">0${selectedLegion} ${LEGION_NAMES[selectedLegion]}</strong><p>选择你要查询的军团奖励。</p></div></div><div class="legion-picker">${options}</div><input id="rewardModalLegionId" type="hidden" value="${selectedLegion}" /><div class="contribute-meta-card"><span>查询结果</span><div id="rewardModalResult" class="section-text">填写赛季后点击查询奖励。</div></div></div><div class="inline-actions legion-picker-actions"><button id="rewardModalPreviewBtn" class="primary-btn">查询奖励</button><button id="rewardModalClaimBtn" class="ghost-btn">立即领取</button></div>`);

    const seasonEl = document.getElementById("rewardModalSeasonId");
    const legionEl = document.getElementById("rewardModalLegionId");
    const resultEl = document.getElementById("rewardModalResult");
    const labelEl = document.getElementById("rewardModalLegionLabel");
    state.rewardUi = { seasonEl, legionEl, resultEl };
    state.rewardPreview = null;

    const updateRewardLegionLabel = () => {
      const id = Number(legionEl?.value || selectedLegion);
      if (labelEl) labelEl.textContent = `0${id} ${LEGION_NAMES[id]}`;
    };

    document.querySelectorAll("[data-reward-legion]").forEach((btn) => {
      btn.addEventListener("click", () => {
        legionEl.value = btn.dataset.rewardLegion;
        document.querySelectorAll("[data-reward-legion]").forEach((item) => item.classList.toggle("active", item === btn));
        updateRewardLegionLabel();
      });
    });

    updateRewardLegionLabel();
    document.getElementById("rewardModalPreviewBtn")?.addEventListener("click", previewReward);
    document.getElementById("rewardModalClaimBtn")?.addEventListener("click", claimReward);
    window.setTimeout(() => seasonEl?.focus(), 220);
  }

  function setNavActive(key = "") {
    document.querySelectorAll(".nav [data-nav-key]").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.navKey === key);
    });
  }

  function openLeaderboardBoard() {
    const list = getSortedLegions();
    openModal("五大军团排行榜", `<div class="leaderboard-modal"><div class="leaderboard-modal-head"><p>与首页实时热度榜一致${state.publicData?.isLocked ? "，当前锁榜期贡献计入下一轮。" : "，展示当前赛季实时热度。"}</p></div><div class="hero-board-list">${renderLeaderboardRows(list)}</div></div>`);
    setNavActive("leaderboard");
  }

  function openFaqModal() {
    openModal("FAQ", `<div class="faq-modal"><div class="faq-intro"><strong>用户常见问题</strong><p>下面是最容易误解的规则与交互说明，口径均以前端当前接入合约为准。</p></div><div class="faq-list"><article class="faq-item"><h3>1. 为什么我贡献了 BNB，本季有效贡献还是 0？</h3><p>因为有效贡献要求同时满足两项：当前持仓至少 1,000,000 主币，且军衔达到分析师及以上；否则只会记入原始热度，不进入有效加权排名。</p></article><article class="faq-item"><h3>2. BNB 打榜的热度怎么计算？</h3><p>直接贡献按 BNB × 1,000,000 计算热度，例如 0.01 BNB 会增加 10,000 热度。</p></article><article class="faq-item"><h3>3. 为什么锁榜期贡献没有立刻计入当前轮？</h3><p>每轮最后 1 分钟进入锁榜期，锁榜期内的贡献会计入下一轮，防止最后时刻改写当前赛果。</p></article><article class="faq-item"><h3>4. 首次加入军团和后续换团有什么区别？</h3><p>首次加入免费，任选 1-5 军团；后续换团只能通过换仓并贡献完成，最低 0.005 BNB，税后 80% 计入新军团热度。</p></article><article class="faq-item"><h3>5. 升级军衔除了名字变化，还有什么作用？</h3><p>升级费用会转成热度，且分析师及以上才能进入有效加权；军衔越高，加权倍率越高，最高可到 200%。</p></article><article class="faq-item"><h3>6. 奖励为什么查询不到或显示 0？</h3><p>常见原因包括：赛季还没结算、你查错赛季或军团、你该赛季没有有效加权贡献、当前持仓不足，或奖励已过期/已领取。</p></article><article class="faq-item"><h3>7. 赛季奖励怎么分？</h3><p>每轮只释放当前奖池的 40%，再由前三军团按 50% / 30% / 20% 分配；如果只有 1 个或 2 个军团入榜，未分出的部分继续滚存。</p></article><article class="faq-item"><h3>8. 为什么还要手动领取奖励？</h3><p>合约采用手动领取模式，赛季结算后会开启 30 天领取窗口；过期未领的奖励会按规则回库。</p></article><article class="faq-item"><h3>9. 军团长怎么产生，怎么挑战？</h3><p>满足投资总监及以上且本军团历史贡献更高的用户，可以挑战军团长；成功后成为新军团长并获得 5 分钟保护期。</p></article><article class="faq-item"><h3>10. 为什么排行榜和奖励查询有时看起来不同步？</h3><p>排行榜是实时热度，奖励查询看的是已结算赛季结果；如果当前轮未结束或未结算，排行榜变化不会立刻体现在奖励结果里。</p></article></div></div>`);
    setNavActive("faq");
  }

  function handleUiAction(action) {
    if (action === "join") return openJoinLegionModal();
    if (action === "upgrade") return openUpgradeRankModal();
    if (action === "contribute") return openContributeModal();
    if (action === "burn") return openBurnModal();
    if (action === "switch") return openSwitchLegionModal();
    if (action === "challenge") return openChallengeLeaderModal();
    if (action === "rewards") {
      setNavActive("rewards");
      return openRewardsModal();
    }
    if (action === "leaderboard") return openLeaderboardBoard();
  }

  function bindEvents() {
    el.connectWalletBtn.addEventListener("click", () => connectWallet());
    el.contractInfoBtn?.addEventListener("click", openContractInfo);
    el.footerContractBtn?.addEventListener("click", openContractInfo);
    el.openBlindBoxModalBtn?.addEventListener("click", openBlindBoxPanel);
    el.openMyModalBtn?.addEventListener("click", openMyPanelModal);
    document.querySelectorAll("[data-open-rules]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        setNavActive("rules");
        openRules();
      });
    });
    document.querySelectorAll("[data-open-leaderboard]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        openLeaderboardBoard();
      });
    });
    document.querySelectorAll("[data-open-faq]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        openFaqModal();
      });
    });
    document.querySelector('.nav a[href="#hero"]')?.addEventListener("click", () => setNavActive("home"));
    el.refreshBtn.addEventListener("click", openSettleSeasonModal);
    el.joinLegionBtn?.addEventListener("click", openJoinLegionModal);
    el.contributeBtn?.addEventListener("click", openContributeModal);
    el.upgradeRankBtn?.addEventListener("click", openUpgradeRankModal);
    el.switchLegionBtn?.addEventListener("click", openSwitchLegionModal);
    el.rewardPreviewBtn?.addEventListener("click", previewReward);
    el.rewardClaimBtn?.addEventListener("click", claimReward);
    document.querySelectorAll("[data-ui-action]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        handleUiAction(node.dataset.uiAction);
      });
    });

    el.closeModalBtn.addEventListener("click", closeModal);
    el.modalBackdrop.addEventListener("click", (event) => {
      if (event.target === el.modalBackdrop) closeModal();
    });

    el.closeDrawerBtn?.addEventListener("click", closeDrawer);

    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        setSeatFilter(chip.dataset.filter);
      });
    });

    if (!document.getElementById("seats")?.classList.contains("hidden")) {
      document.querySelectorAll(".drawer-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          state.drawerTab = tab.dataset.tab;
          document.querySelectorAll(".drawer-tab").forEach((item) => item.classList.remove("active"));
          tab.classList.add("active");
          renderDrawer();
        });
      });

      el.seatsGrid?.addEventListener("click", (event) => {
        const card = event.target.closest("[data-seat-id]");
        if (!card) return;
        openSeatDetail(Number(card.dataset.seatId));
      });
    }

    const provider = getInjectedProvider();
    if (provider?.on) {
      provider.on("accountsChanged", async () => {
        await connectWallet(true);
      });
      provider.on("chainChanged", () => window.location.reload());
    }
  }

  async function resolveLatestVaultAddress() {
    if (isValidAddress(CONFIG.vaultAddress)) return CONFIG.vaultAddress;
    if (!isValidAddress(CONFIG.factoryAddress) || !isValidAddress(CONFIG.tokenAddress)) return null;
    try {
      const factory = new ethers.Contract(CONFIG.factoryAddress, factoryAbi, state.readProvider);
      const logs = await factory.queryFilter(factory.filters.VaultCreated(null, CONFIG.tokenAddress, null), 0, "latest");
      const latest = logs[logs.length - 1];
      const nextVault = latest?.args?.vault;
      if (isValidAddress(nextVault)) {
        CONFIG.vaultAddress = nextVault;
        saveConfig({ rpcUrl: CONFIG.rpcUrl, factoryAddress: CONFIG.factoryAddress, vaultAddress: CONFIG.vaultAddress, tokenAddress: CONFIG.tokenAddress });
        return CONFIG.vaultAddress;
      }
    } catch (error) {
      console.warn("resolveLatestVaultAddress failed", error);
    }
    return null;
  }

  async function resolveTokenAddressFromVault() {
    if (!isValidAddress(CONFIG.vaultAddress) || isValidAddress(CONFIG.tokenAddress)) return CONFIG.tokenAddress;
    try {
      const vault = new ethers.Contract(CONFIG.vaultAddress, vaultAbi, state.readProvider);
      const token = await vault.taxToken();
      if (isValidAddress(token)) {
        CONFIG.tokenAddress = token;
        saveConfig({ rpcUrl: CONFIG.rpcUrl, factoryAddress: CONFIG.factoryAddress, vaultAddress: CONFIG.vaultAddress, tokenAddress: CONFIG.tokenAddress });
        return CONFIG.tokenAddress;
      }
    } catch (error) {
      console.warn("resolveTokenAddressFromVault failed", error);
    }
    return null;
  }

  function isAbiMismatchError(error) {
    const msg = String(error?.shortMessage || error?.message || "");
    return msg.includes("missing revert data") || msg.includes("CALL_EXCEPTION");
  }

  async function bootstrap() {
    loadConfigOverrides();
    state.readProvider = new ethers.JsonRpcProvider(CONFIG.rpcUrl, undefined, { batchMaxCount: 1 });

    bindEvents();

    if (!isConfigReady()) {
      openConfigModal();
      return;
    }

    await resolveLatestVaultAddress();
    if (!isValidAddress(CONFIG.vaultAddress)) {
      openConfigModal();
      return;
    }
    await resolveTokenAddressFromVault();
    if (!isValidAddress(CONFIG.tokenAddress)) {
      openConfigModal();
      return;
    }
    state.readVault = new ethers.Contract(CONFIG.vaultAddress, vaultAbi, state.readProvider);
    state.readToken = new ethers.Contract(CONFIG.tokenAddress, tokenAbi, state.readProvider);

    await loadTokenMeta();
    await loadAll();
    await connectWallet(true);
    setInterval(loadPublicDataAndRender, 30000);
    setInterval(tickSeatCountdowns, 1000);
  }

  async function loadPublicDataAndRender() {
    if (state.isRefreshing) return;
    state.isRefreshing = true;
    try {
      await loadPublicData();
      if (state.userAddress) await loadUserData();
      renderAll();
    } catch (error) {
      if (isAbiMismatchError(error)) {
        showToast("读取失败：Vault 地址对应的合约版本与前端不匹配，请更新 Vault 地址（或填写 Factory 让前端自动选择最新 Vault）", "error");
        openConfigModal();
      }
    } finally {
      state.isRefreshing = false;
    }
  }

  bootstrap().catch((error) => {
    console.error(error);
    showToast("前端初始化失败，请检查 RPC 或地址配置", "error");
  });
})();
