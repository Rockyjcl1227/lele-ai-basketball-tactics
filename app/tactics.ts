export type DefenseType = "盯人" | "2-3 联防" | "3-2 联防" | "换防" | "沉退" | "全场压迫";
export type RouteKind = "move" | "pass" | "screen";
export type Point = [number, number];

export type TacticRoute = {
  actor: number;
  kind: RouteKind;
  points: Point[];
  label: string;
};

export type TacticPhase = {
  name: string;
  objective: string;
  positions: Point[];
  routes: TacticRoute[];
  actions: string[];
  fallback: string;
};

export type TacticTemplate = {
  id: string;
  name: string;
  family: string;
  levels: string[];
  defenses: DefenseType[];
  intents: string[];
  complexity: number;
  phases: [TacticPhase, TacticPhase, TacticPhase];
  reads: string[];
  risks: string[];
  fallback: string;
};

export type CapabilityKey = "shooting" | "handling" | "passing" | "finishing" | "defense" | "athleticism";
export type CapabilityProfile = Record<CapabilityKey, number>;
export type ValidationCheck = { id: string; label: string; status: "pass" | "warn"; detail: string };
export type StressTest = { scenario: "deny" | "换防" | "夹击"; response: string };

export type GenerationInput = {
  level: string;
  defense: DefenseType;
  objective: string;
  tolerance: string;
  team: string;
  roster?: Partial<CapabilityProfile>;
};

export type TacticResult = {
  template: TacticTemplate;
  phases: TacticPhase[];
  score: number;
  confidence: number;
  confidenceLabel: "高" | "中" | "低";
  reasons: string[];
  assumptions: string[];
  reads: string[];
  risks: string[];
  alternative: string;
  rosterFit: number;
  capabilityGaps: string[];
  validationChecks: ValidationCheck[];
  stressTests: StressTest[];
};

const P = (name: string, objective: string, positions: Point[], routes: TacticRoute[], actions: string[], fallback: string): TacticPhase => ({ name, objective, positions, routes, actions, fallback });
const R = (actor: number, kind: RouteKind, from: Point, to: Point, label: string): TacticRoute => ({ actor, kind, points: [from, to], label });

export const TACTICS: TacticTemplate[] = [
  {
    id: "wide-rim-advance", name: "转换进攻 · Wide-Rim-Advance", family: "转换进攻", complexity: 2,
    levels: ["小学", "初中", "高中", "大学", "社区", "业余", "半职业", "职业"], defenses: ["盯人", "全场压迫"], intents: ["快", "转换", "追分", "6 秒"],
    phases: [
      P("篮、边、中三道启动", "先看前传并拉满宽度", [[20,50],[30,12],[30,88],[24,35],[25,65]], [R(1,"move",[20,50],[45,50],"中路推进"),R(2,"move",[30,12],[58,10],"左翼踩边线"),R(5,"move",[25,65],[60,62],"第一内线冲筐")], ["4/5 抢板后先看前传","双翼沿边线跑宽","第一内线直冲篮圈"], "无前传窗口则 outlet 给 1 号"),
      P("前传与压篮同步", "在退防落位前制造 2v1", [[48,50],[62,10],[62,90],[52,36],[65,62]], [R(1,"pass",[48,50],[65,62],"击地给顺下"),R(3,"move",[62,90],[82,86],"弱侧到底角"),R(4,"move",[52,36],[65,42],"拖后到弧顶")], ["1 号中路推进","rim runner 压篮","拖后内线跟到弧顶"], "人数不占优立即降速"),
      P("篮下—底角—回流", "完成高质量终结或安全进入半场", [[76,50],[84,12],[84,88],[70,38],[86,58]], [R(1,"move",[76,50],[89,48],"攻防守者外侧肩"),R(1,"pass",[76,50],[84,88],"协防收缩传底角")], ["无人护筐攻篮","低人收缩传对角","无优势流入 5-out"], "不强攻，顶弧重置"),
    ],
    reads: ["前场无人护筐 → 传第一内线", "low defender 收缩 → 传对角底角", "2v1 → 攻击防守者外侧肩后再传", "无人数优势 → 进入半场进攻"],
    risks: ["两翼收窄导致跑道拥堵", "抢板后低头运球错过前传", "领先时无必要提速增加活球失误"], fallback: "降级为篮、边、中三道，不打二次拖后掩护",
  },
  {
    id: "pass-cut-fill", name: "5-out Motion · Pass-Cut-Fill", family: "连续进攻", complexity: 2,
    levels: ["小学", "初中", "高中", "大学", "社区", "业余", "半职业", "职业"], defenses: ["盯人", "换防"], intents: ["半场", "拉开", "传切", "弱侧"],
    phases: [
      P("五点拉开", "建立宽度与空切通道", [[38,50],[50,14],[50,86],[64,18],[64,82]], [R(1,"pass",[38,50],[50,14],"传翼")], ["1 顶、2/3 双翼、4/5 双角","相邻点保持约 4.5 米"], "窗口关闭则安全反转"),
      P("传后强切", "利用防守看球攻击篮下", [[61,45],[58,14],[53,86],[66,25],[66,75]], [R(1,"move",[38,50],[82,50],"传后切篮"),R(3,"move",[50,86],[45,54],"补顶"),R(2,"pass",[50,14],[82,50],"回传空切")], ["1 传 2 后强切","最近球员 fill 空位","deny 时改背切"], "切到底后清到弱侧角"),
      P("切出—补位—再触发", "保持连续性而非停球", [[80,78],[57,18],[43,50],[66,28],[66,82]], [R(1,"move",[82,50],[80,78],"清空弱侧"),R(2,"pass",[58,14],[43,50],"安全反转")], ["切入者清到弱侧","空位由最近者补","可再次 pass-cut"], "五点重置，保留安全出口"),
    ],
    reads: ["传球后防守者看球 → 立即切篮", "防守 overplay 传球线 → 背切", "油漆区收缩 → kick-out 再多传一次", "空位无人补 → 等 0.5 秒后安全反转"],
    risks: ["切入后停在油漆区", "多人同时补同一空位", "无外线威胁时空间价值下降"], fallback: "只保留传—切—补位，不叠加手递手",
  },
  {
    id: "post-follow", name: "4-out-1-in · Post-Follow", family: "内外结合", complexity: 3,
    levels: ["初中", "高中", "大学", "社区", "业余", "半职业", "职业"], defenses: ["盯人", "换防"], intents: ["低位", "内线", "错位", "半场"],
    phases: [
      P("四外一内建立传球角", "让 5 号先卡位而非追球", [[38,50],[52,16],[52,84],[68,82],[73,28]], [R(1,"pass",[38,50],[52,16],"传球侧翼"),R(5,"move",[73,28],[78,35],"低位卡位")], ["四人弧外拉开","5 号球侧低位 seal"], "无法卡位则 5 上提肘区"),
      P("喂低位与 split cut", "制造单打或夹击出球", [[61,44],[59,18],[50,78],[68,86],[78,35]], [R(2,"pass",[59,18],[78,35],"喂低位"),R(1,"move",[61,44],[75,54],"强切"),R(3,"move",[50,78],[44,50],"补位")], ["球进 5 后最近外线 split cut","弱侧保持宽度"], "内传被拒绝则快速反转"),
      P("包夹出球或高位手递手", "根据夹击完成 inside-out", [[73,55],[74,18],[48,50],[72,86],[66,36]], [R(5,"pass",[78,35],[72,86],"包夹传底角"),R(5,"move",[78,35],[60,42],"上提手递手")], ["包夹先看底角再看对角","不包夹则单打","无优势上提 DHO"], "外线顶弧接应并重置"),
    ],
    reads: ["低位被 front → 先确认弱侧协防再高吊", "low man 收缩 → 底角", "换防小防大 → 快速 seal", "5 无低位优势 → 不强喂"],
    risks: ["内线追球堵塞突破通道", "低位传球角度过平", "夹击后弱侧处理不足"], fallback: "5 号上提做一次手递手，随后回到四外站位",
  },
  {
    id: "horns-twist", name: "Horns · Twist", family: "阵地战术", complexity: 4,
    levels: ["高中", "大学", "半职业", "职业"], defenses: ["盯人", "沉退", "换防"], intents: ["挡拆", "沉退", "阵地", "弱侧"],
    phases: [
      P("双肘与双底角", "从对称站位隐藏入口", [[38,50],[70,12],[70,88],[55,38],[55,62]], [R(1,"move",[38,50],[52,47],"接近 5 号掩护"),R(5,"screen",[55,62],[56,52],"右肘掩护")], ["1 顶弧持球","4/5 两肘","2/3 两底角"], "持球停在顶弧安全点"),
      P("第一掩护与 Twist", "先迫使 X5 表态，再反向攻击", [[62,58],[74,12],[74,88],[55,45],[70,55]], [R(1,"move",[52,47],[70,58],"使用第一掩护"),R(5,"move",[55,62],[78,58],"顺下"),R(4,"screen",[55,38],[65,52],"反向二次掩护")], ["1 使用 5 的掩护","5 顺下","4 转为反向二次掩护"], "第一拍无优势时使用 4 的反向掩护"),
      P("顺下—外弹—弱侧角", "按 coverage 完成终结", [[78,54],[78,12],[78,88],[67,42],[87,58]], [R(1,"pass",[78,54],[87,58],"pocket pass"),R(1,"pass",[78,54],[78,12],"低人协防传角")], ["沉退读抛投或 pocket","换防找 5 seal","夹击找短顺下"], "4 外弹到顶作为重置点"),
    ],
    reads: ["沉退 → 抛投/中距离或 pocket pass", "换防 → 5 号 seal 小个", "夹击 → 短顺下形成 4v3", "绕掩护下方 → 合格射手投篮或重掩护"],
    risks: ["双肘站位过近", "持球人提前离开掩护", "底角过早上提释放低人"], fallback: "去掉 Twist，只打单侧高位挡拆并保留弱侧底角",
  },
  {
    id: "spain-middle", name: "Spain PnR · Middle", family: "阵地战术", complexity: 5,
    levels: ["高中", "大学", "半职业", "职业"], defenses: ["沉退", "盯人"], intents: ["Spain", "挡拆", "三分", "沉退", "追分"],
    phases: [
      P("中路挡拆 + 背掩护预备", "建立三人时序与双底角空间", [[38,50],[54,50],[68,88],[68,12],[55,52]], [R(5,"screen",[55,52],[54,50],"中路球掩护"),R(2,"move",[54,50],[62,50],"跟进背掩护")], ["1 顶弧","5 在中路设球掩护","2 位于 5 身后","3/4 双角"], "时序未建立则不启动"),
      P("顺下 + X5 背掩护", "让护筐者与射手防守人同时做决定", [[66,47],[65,50],[72,88],[72,12],[75,52]], [R(1,"move",[38,50],[68,46],"借掩护持球"),R(5,"move",[55,52],[82,52],"顺下"),R(2,"screen",[62,50],[72,52],"背掩护 X5")], ["5 掩护后顺下","2 同步背掩护 X5","1 保持运球观察"], "同步失败则降为普通中路 PnR"),
      P("Rim → Pop → Corner", "严格按优先级出球", [[76,44],[60,48],[76,88],[76,12],[88,52]], [R(1,"pass",[76,44],[88,52],"首读顺下"),R(2,"move",[65,50],[55,48],"掩护后外弹"),R(1,"pass",[76,44],[55,48],"X2 下沉回传")], ["先看篮下","X2 下沉再回传 pop","夹击则短传 5"], "角落与顶弧均无窗口时回撤重置"),
    ],
    reads: ["X5 被背掩护 → lob/pocket 给 5", "X2 下沉护筐 → 回传 2 外弹", "两人夹 1 → 短传 5 打 4v3", "全换防 → 5 seal 最小防守者"],
    risks: ["2 号移动掩护犯规", "三人时序不齐造成中路拥挤", "弱侧角提前上提"], fallback: "去掉背掩护，降级为普通中路 PnR",
  },
  {
    id: "slob-zipper-roll", name: "ATO 边线球 · Zipper-Roll", family: "ATO", complexity: 4,
    levels: ["高中", "大学", "半职业", "职业"], defenses: ["盯人", "换防"], intents: ["边线", "发球", "ATO", "暂停"],
    phases: [
      P("双肘双低位发球站位", "优先保证 5 秒内安全发进", [[49,8],[72,82],[45,5],[58,38],[58,62]], [R(5,"screen",[58,62],[68,50],"下掩护"),R(1,"move",[49,8],[48,50],"zipper cut")], ["3 边线发球","4/5 双肘","1/2 双低位"], "5 pop 到边线作 safety"),
      P("篮下偷袭 + Zipper 接球", "先看篮，再看安全发进", [[52,50],[82,76],[47,8],[64,60],[68,45]], [R(4,"screen",[58,38],[72,68],"给 2 背掩护"),R(2,"move",[72,82],[87,67],"切篮"),R(3,"pass",[45,5],[52,50],"发给 1")], ["2 借背掩护切篮","1 zipper 到顶接球","3 发完占角"], "1 被 deny 时传 5 safety"),
      P("接球即入高位挡拆", "把发球结构流入可读的 PnR", [[70,52],[82,12],[68,18],[83,72],[77,52]], [R(5,"screen",[68,45],[72,52],"立即球掩护"),R(5,"move",[72,52],[88,55],"顺下"),R(1,"pass",[70,52],[88,55],"读 roll")], ["5 立即给 1 掩护","4 到弱侧 dunker","1 读篮下、roll、角、回传"], "回传发球侧安全点"),
    ],
    reads: ["2 无人跟 → 直接传篮下", "1 出现安全窗口 → 先发进", "全部 deny → 5 号 safety", "5 接球 → 不得朝中线盲转"],
    risks: ["5 秒违例", "向中线传球带来回场风险", "所有人只接球而不威胁篮筐"], fallback: "5 上提边线安全接球，再与发球人手递手",
  },
  {
    id: "high-low-short", name: "破 2-3 联防 · High-Low-Short", family: "联防进攻", complexity: 3,
    levels: ["初中", "高中", "大学", "社区", "业余", "半职业", "职业"], defenses: ["2-3 联防", "3-2 联防"], intents: ["联防", "破联防", "高低位", "半场"],
    phases: [
      P("高位 + 短角双占位", "同时牵动中锋与底线防守者", [[38,50],[52,18],[52,82],[72,78],[58,50]], [R(1,"pass",[38,50],[52,18],"传翼"),R(5,"move",[58,50],[68,42],"球侧高位闪")], ["1 顶、2/3 双翼","5 在罚球线附近","4 弱侧短角"], "外线快速反转，不在顶弧停球"),
      P("球侧高位闪 + 底线跑", "制造一次 paint touch", [[50,48],[60,18],[52,82],[84,22],[68,42]], [R(2,"pass",[60,18],[68,42],"传高位"),R(4,"move",[72,78],[84,22],"沿底线到球侧短角"),R(3,"move",[52,82],[58,84],"弱侧拉宽")], ["2 优先传 5 高位","4 跑球侧短角","窗口关则反转"], "高位被卡死则 short-corner-first"),
      P("高位面筐四读", "从油漆区向外完成 inside-out", [[62,48],[72,15],[68,85],[87,25],[72,47]], [R(5,"pass",[72,47],[87,25],"中锋上提传短角"),R(5,"pass",[72,47],[68,85],"弱侧收缩 skip")], ["中锋上提传短角","底线卫内收传翼","弱侧收缩 skip","无人收缩则高位攻"], "回传顶弧，重新改变球侧"),
    ],
    reads: ["优先 paint touch，再 inside-out", "中锋上提 → 传短角/篮下", "底线卫内收 → 传球侧翼", "弱侧整体收缩 → skip pass"],
    risks: ["高位固定站死被卡传球线", "高位与短角站在同一纵线", "只绕弧传球不威胁油漆区"], fallback: "只保留反转—高位—底线三角",
  },
  {
    id: "delay-safe-pnr", name: "保护领先 · Delay-Safe-PnR", family: "比赛管理", complexity: 3,
    levels: ["高中", "大学", "社区", "业余", "半职业", "职业"], defenses: ["盯人", "换防", "全场压迫"], intents: ["领先", "保护", "耗时", "稳", "低失误"],
    phases: [
      P("五外安全接应", "保留宽度并避开陷阱角", [[38,50],[55,14],[55,86],[48,32],[48,68]], [R(1,"pass",[38,50],[48,32],"传最近安全点"),R(1,"move",[38,50],[48,55],"pass-and-replace")], ["最稳控卫居中","双角拉开","至少一名后场安全接应"], "对手施压时提前回传安全点"),
      P("控时浅切与替换", "不到阈值不进入高风险区域", [[55,54],[62,14],[62,86],[48,42],[48,68]], [R(4,"pass",[48,42],[55,54],"回传控卫"),R(1,"move",[55,54],[62,48],"浅切替换")], ["pass-and-replace 保持接应","不进入底角陷阱","出现空篮可立即攻击"], "夹击前把球传给最近安全点"),
      P("延迟高位 PnR", "在阈值后获得安全终结", [[73,48],[78,14],[78,86],[64,34],[68,55]], [R(5,"screen",[48,68],[68,55],"高位掩护"),R(1,"move",[62,48],[82,48],"阈值后攻筐"),R(5,"move",[68,55],[86,56],"短顺下")], ["阈值后才发动","优先攻筐/造罚球","两人固定退防"], "回撤安全点，不跨场冒险传球"),
    ],
    reads: ["对手不施压 → 持有至进攻阈值", "对手夹击 → 提前传最近安全点", "对手犯规 → 球到最佳罚球手", "篮下完全空 → 立即得分"],
    risks: ["退到底角被夹击", "过早出手增加对手回合", "只顾耗时忽略退防"], fallback: "取消掩护，只做居中控球与两侧安全接应",
  },
];

const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  shooting: "投篮", handling: "控运", passing: "组织/传球", finishing: "终结", defense: "防守", athleticism: "运动",
};

export const TACTIC_REQUIREMENTS: Record<string, Partial<CapabilityProfile>> = {
  "wide-rim-advance": { passing: 58, finishing: 64, athleticism: 68 },
  "pass-cut-fill": { shooting: 55, handling: 56, passing: 62 },
  "post-follow": { shooting: 58, passing: 64, finishing: 68 },
  "horns-twist": { shooting: 62, handling: 70, passing: 69, finishing: 64 },
  "spain-middle": { shooting: 75, handling: 78, passing: 76, finishing: 70 },
  "slob-zipper-roll": { handling: 66, passing: 70, athleticism: 60 },
  "high-low-short": { shooting: 60, passing: 72, finishing: 64 },
  "delay-safe-pnr": { shooting: 62, handling: 74, passing: 72, defense: 58 },
};

function targetComplexity(level: string) {
  if (level.includes("小学")) return 1;
  if (level.includes("初中") || level.includes("社区") || level.includes("业余")) return 2;
  if (level.includes("高中")) return 4;
  return 5;
}

function objectiveMatches(template: TacticTemplate, objective: string) {
  return template.intents.reduce((total, keyword) => total + (objective.includes(keyword) ? 1 : 0), 0);
}

function requirementState(template: TacticTemplate, roster: Partial<CapabilityProfile> | undefined) {
  const requirements = TACTIC_REQUIREMENTS[template.id] || {};
  const gaps: string[] = [];
  let deficit = 0;
  Object.entries(requirements).forEach(([rawKey, minimum]) => {
    const key = rawKey as CapabilityKey;
    const value = roster?.[key];
    if (value == null) {
      gaps.push(`${CAPABILITY_LABELS[key]}数据缺失（门槛 ${minimum}）`);
      deficit += 8;
    } else if (value < Number(minimum)) {
      const difference = Math.ceil(Number(minimum) - value);
      gaps.push(`${CAPABILITY_LABELS[key]} ${Math.round(value)}，低于门槛 ${minimum}（差 ${difference}）`);
      deficit += difference;
    }
  });
  const fit = Math.max(0, Math.round(100 - deficit * 2.2));
  return { gaps, deficit, fit };
}

function simplifyPhase(phase: TacticPhase, simplify: boolean): TacticPhase {
  if (!simplify) return { ...phase, positions: phase.positions.map(point => [...point] as Point), routes: phase.routes.map(route => ({ ...route, points: route.points.map(point => [...point] as Point) })) };
  return {
    ...phase,
    positions: phase.positions.map(point => [...point] as Point),
    routes: phase.routes.filter(route => route.kind !== "screen").slice(0, 2).map(route => ({ ...route, points: route.points.map(point => [...point] as Point) })),
    actions: phase.actions.slice(0, 2),
  };
}

/** 纯函数：只基于显式输入进行模板检索、能力门槛、复杂度裁剪、静态校验与解释。 */
export function generateTactic(input: GenerationInput): TacticResult {
  const maxComplexity = targetComplexity(input.level);
  const ranked = TACTICS.map(template => {
    const capability = requirementState(template, input.roster);
    const defenseFit = template.defenses.includes(input.defense) ? 34 : input.defense === "盯人" && !template.defenses.includes("2-3 联防") ? 12 : 0;
    const intentFit = Math.min(30, objectiveMatches(template, input.objective) * 14);
    const levelFit = template.levels.some(level => input.level.includes(level) || level.includes(input.level)) ? 18 : 5;
    const complexityGap = Math.max(0, template.complexity - maxComplexity);
    const simplicity = input.tolerance.includes("简化") || input.tolerance.includes("稳") ? Math.max(0, 12 - template.complexity * 2) : 7;
    const capabilityPenalty = capability.deficit * 1.2 + capability.gaps.length * 4;
    return { template, capability, score: 34 + defenseFit + intentFit + levelFit + simplicity - complexityGap * 13 - capabilityPenalty };
  }).sort((a, b) => b.score - a.score);

  const selected = ranked[0];
  const simplify = maxComplexity <= 2 || selected.template.complexity > maxComplexity || selected.capability.deficit >= 10 || input.tolerance.includes("简化");
  const phases = selected.template.phases.map(phase => simplifyPhase(phase, simplify));
  const score = Math.max(42, Math.min(96, Math.round(selected.score)));
  const actionCount = phases.reduce((total, item) => total + item.actions.length, 0);
  const actionBudget = maxComplexity <= 1 ? 6 : maxComplexity <= 2 ? 7 : maxComplexity <= 4 ? 10 : 12;
  const legalPositions = phases.every(item => item.positions.length === 5 && item.positions.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100));
  const weakSideWidth = phases.every(item => item.positions.some(([, y]) => y <= 25) && item.positions.some(([, y]) => y >= 75));
  const validationChecks: ValidationCheck[] = [
    { id: "defense", label: "防守类型匹配", status: selected.template.defenses.includes(input.defense) ? "pass" : "warn", detail: selected.template.defenses.includes(input.defense) ? `模板明确覆盖${input.defense}。` : `模板未直接标注${input.defense}，需现场确认 coverage。` },
    { id: "complexity", label: "水平复杂度预算", status: selected.template.complexity <= maxComplexity ? "pass" : "warn", detail: selected.template.complexity <= maxComplexity ? `复杂度 ${selected.template.complexity}/5 未超过${input.level}预算。` : `复杂度超预算，已裁剪同步动作与二次分支。` },
    { id: "roster", label: "阵容能力门槛", status: selected.capability.gaps.length ? "warn" : "pass", detail: selected.capability.gaps.length ? selected.capability.gaps.join("；") : `已满足 ${Object.keys(TACTIC_REQUIREMENTS[selected.template.id] || {}).length} 项最低能力要求。` },
    { id: "spacing", label: "弱侧宽度与站位合法性", status: legalPositions && weakSideWidth ? "pass" : "warn", detail: legalPositions && weakSideWidth ? "五人坐标均在界内，三阶段均保留两侧宽度。" : "存在宽度不足或站位边界风险，训练前需手动校正。" },
    { id: "actions", label: "动作数量预算", status: actionCount <= actionBudget ? "pass" : "warn", detail: `当前 ${actionCount} 个关键动作；${input.level}预算上限 ${actionBudget}。` },
  ];
  const passedChecks = validationChecks.filter(item => item.status === "pass").length;
  const providedCapabilityCount = (Object.keys(CAPABILITY_LABELS) as CapabilityKey[]).filter(key => input.roster?.[key] != null).length;
  const dataCompleteness = (providedCapabilityCount + (input.level ? 1 : 0) + (input.defense ? 1 : 0) + (input.objective.trim() ? 1 : 0) + (input.team ? 1 : 0)) / 10;
  const hardPassRate = passedChecks / validationChecks.length;
  const confidence = Math.max(.35, Math.min(.95, .3 + dataCompleteness * .35 + hardPassRate * .3));
  const alternative = ranked.find(item => item.template.id !== selected.template.id && item.template.complexity <= selected.template.complexity && item.capability.deficit <= selected.capability.deficit)?.template.name || TACTICS[1].name;
  const capabilitySummary = selected.capability.gaps.length ? `阵容适配 ${selected.capability.fit}/100，存在 ${selected.capability.gaps.length} 项能力缺口。` : `阵容适配 ${selected.capability.fit}/100，当前平均能力达到模板最低门槛。`;

  return {
    template: selected.template,
    phases,
    score,
    confidence,
    confidenceLabel: confidence >= .8 ? "高" : confidence >= .6 ? "中" : "低",
    reasons: [
      `对手防守被标记为「${input.defense}」，${selected.template.defenses.includes(input.defense) ? "模板主 read 与其轮转/coverage 直接匹配" : "以安全出口应对未完全匹配的 coverage"}。`,
      `目标“${input.objective.slice(0, 28)}${input.objective.length > 28 ? "…" : ""}”命中 ${selected.template.family} 的检索标签。`,
      capabilitySummary,
      simplify ? `${input.level}、能力缺口或容错偏好触发复杂度裁剪：减少同步路线与二次分支，但保留安全出口。` : `${input.level}水平与阵容门槛允许保留 coverage counter。`,
    ],
    assumptions: [
      providedCapabilityCount === 6 ? "能力输入为当前球员六维属性的简单平均；尚未表达角色差异、样本量与对位分布。" : `六维能力仅提供 ${providedCapabilityCount}/6 项，缺失项不按 0 处理，并已降低可信度。`,
      "未输入进攻钟、暂停与犯规状态；末节阈值仍需教练现场确认。",
      `“${input.defense}”来自人工选择，未经过实时视频识别。`,
    ],
    reads: selected.template.reads.slice(0, simplify ? 2 : 4),
    risks: [...selected.template.risks.slice(0, simplify ? 2 : 3), ...selected.capability.gaps.map(item => `能力缺口：${item}`), `降级：${selected.template.fallback}`],
    alternative,
    rosterFit: selected.capability.fit,
    capabilityGaps: selected.capability.gaps,
    validationChecks,
    stressTests: [
      { scenario: "deny", response: `首选入口被拒绝：${selected.template.fallback}` },
      { scenario: "换防", response: selected.template.reads.find(item => item.includes("换防")) || `不强打预设路线，改用更简单备选：${alternative}` },
      { scenario: "夹击", response: selected.template.reads.find(item => item.includes("夹")) || `提前传最近安全点，再执行：${selected.template.fallback}` },
    ],
  };
}

export const DEFENSE_OPTIONS: DefenseType[] = ["盯人", "2-3 联防", "3-2 联防", "换防", "沉退", "全场压迫"];
export const TACTIC_SOURCES = [
  { label: "USA Basketball 青训分级", url: "https://www.usab.com/youth/development" },
  { label: "Jr. NBA 教练资源", url: "https://jr.nba.com/" },
  { label: "FIBA / WABC 教练资源", url: "https://wabc.fiba.com/" },
];
