"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type GlyphProps = { size?: number };
const makeGlyph = (symbol: string) => function Glyph({ size = 16 }: GlyphProps) {
  return <span className="glyph-icon" style={{ fontSize: `${Math.max(11, size - 2)}px` }} aria-hidden="true">{symbol}</span>;
};
const Activity = makeGlyph("⌁");
const ArrowLeftRight = makeGlyph("⇄");
const BarChart3 = makeGlyph("▥");
const Bell = makeGlyph("●");
const BrainCircuit = makeGlyph("AI");
const Check = makeGlyph("✓");
const ChevronRight = makeGlyph("›");
const Clock3 = makeGlyph("◷");
const Layers3 = makeGlyph("册");
const Menu = makeGlyph("☰");
const MessageSquareText = makeGlyph("▤");
const Mic = makeGlyph("◉");
const Pause = makeGlyph("Ⅱ");
const Play = makeGlyph("▶");
const Plus = makeGlyph("+");
const RotateCcw = makeGlyph("↺");
const Search = makeGlyph("⌕");
const Settings = makeGlyph("⚙");
const Shield = makeGlyph("◇");
const SlidersHorizontal = makeGlyph("≡");
const Sparkles = makeGlyph("✦");
const Users = makeGlyph("队");
const X = makeGlyph("×");

type View = "lab" | "teams" | "playbook";
type IntentKey = "quick" | "half" | "comeback" | "protect";
type Side = "own" | "opponent";

type Player = {
  id: string;
  name: string;
  number: number;
  position: string;
  height: number;
  build: string;
  level: string;
  archetype: string;
  version: string;
  role: string;
  traits: string[];
  attributes: number[];
};

type Team = {
  id: string;
  name: string;
  short: string;
  group: string;
  level: string;
  pace: string;
  players: number;
  accent: string;
};

const LEVELS = ["小学", "初中", "高中", "大学", "社区", "业余", "半职业", "职业", "NBA"];
const ATTR_LABELS = ["终结", "投篮", "控运", "组织", "防守", "运动"];

const initialTeams: Team[] = [
  { id: "falcons", name: "海淀猎鹰 U16", short: "猎鹰", group: "高中 · 校队", level: "高中精英", pace: "快节奏", players: 10, accent: "lime" },
  { id: "thunder", name: "朝阳雷霆 U16", short: "雷霆", group: "高中 · 俱乐部", level: "高中精英", pace: "阵地优先", players: 12, accent: "orange" },
  { id: "night", name: "社区夜航者", short: "夜航者", group: "社区 · 成人", level: "业余高阶", pace: "自由进攻", players: 9, accent: "violet" },
  { id: "north", name: "北城实验小学", short: "北城", group: "小学 · 校队", level: "小学进阶", pace: "基础转换", players: 14, accent: "blue" },
];

const initialPlayers: Player[] = [
  { id: "zhou", name: "周启", number: 3, position: "PG", height: 181, build: "精瘦", level: "大学高阶", archetype: "库里式无球牵引", version: "高中精英版", role: "第一持球点", traits: ["移动投射", "快速决策"], attributes: [74, 94, 91, 86, 58, 82] },
  { id: "lin", name: "林越", number: 11, position: "SG", height: 187, build: "均衡", level: "高中精英", archetype: "乔丹式中距离脚步", version: "轻量组织版", role: "第二终结点", traits: ["急停中投", "弱侧切入"], attributes: [85, 82, 78, 67, 73, 84] },
  { id: "chen", name: "陈骁", number: 7, position: "SF", height: 190, build: "强壮", level: "高中进阶", archetype: "詹姆斯式推进", version: "低球权版本", role: "转换推进手", traits: ["冲击篮筐", "防守换位"], attributes: [84, 65, 77, 74, 81, 88] },
  { id: "xu", name: "徐威", number: 4, position: "PF", height: 194, build: "长臂", level: "高中精英", archetype: "追梦式连接", version: "空间四号位", role: "前场连接点", traits: ["掩护质量", "协防覆盖"], attributes: [70, 71, 69, 83, 88, 77] },
  { id: "he", name: "贺川", number: 23, position: "C", height: 201, build: "厚重", level: "大学入门", archetype: "约基奇式肘区策应", version: "终结优先版", role: "短顺处理点", traits: ["短顺传球", "低位终结"], attributes: [89, 63, 61, 84, 76, 69] },
  { id: "gao", name: "高岩", number: 1, position: "PG", height: 176, build: "紧凑", level: "高中进阶", archetype: "保罗式节奏控制", version: "替补控场版", role: "替补控卫", traits: ["控失误", "挡拆阅读"], attributes: [67, 79, 87, 85, 70, 76] },
  { id: "wu", name: "吴牧", number: 9, position: "F", height: 192, build: "修长", level: "高中进阶", archetype: "杜兰特式高点投射", version: "定点简化版", role: "空间锋线", traits: ["定点三分", "错位投射"], attributes: [78, 87, 72, 61, 69, 79] },
  { id: "song", name: "宋安", number: 15, position: "C", height: 198, build: "强壮", level: "高中基础", archetype: "恩比德式深位卡位", version: "蓝领防守版", role: "替补中锋", traits: ["篮板保护", "护筐"], attributes: [79, 48, 44, 52, 86, 68] },
  { id: "lu", name: "陆航", number: 5, position: "G", height: 183, build: "精瘦", level: "高中进阶", archetype: "欧文式变向突破", version: "第六人版本", role: "板凳得分手", traits: ["一对一", "篮下手感"], attributes: [86, 77, 92, 64, 55, 87] },
  { id: "qiao", name: "乔川", number: 14, position: "F", height: 191, build: "均衡", level: "高中基础", archetype: "3D 锋线模板", version: "成长版", role: "侧翼轮换", traits: ["底角三分", "单防"], attributes: [62, 73, 63, 59, 78, 74] },
];

const opponentNames = ["X1 · 韩旭", "X2 · 梁恺", "X3 · 张珩", "X4 · 罗新", "X5 · 彭越"];

const offenseSets: number[][][] = [
  [[24, 50], [47, 18], [47, 82], [57, 36], [57, 64]],
  [[50, 43], [68, 18], [63, 82], [71, 64], [59, 49]],
  [[67, 33], [82, 18], [73, 82], [77, 51], [84, 64]],
  [[79, 42], [88, 20], [83, 80], [86, 57], [89, 47]],
];

const defenseSets: number[][][] = [
  [[32, 55], [54, 20], [53, 78], [64, 39], [83, 50]],
  [[55, 50], [74, 21], [70, 76], [76, 62], [79, 48]],
  [[71, 38], [84, 22], [80, 77], [82, 54], [86, 50]],
];

const intentPlans: Record<IntentKey, { label: string; title: string; subtitle: string; prompt: string; tag: string }> = {
  quick: { label: "抢前 6 秒", title: "5-SECOND PUSH · CHICAGO DRAG", subtitle: "先跑动制造防守沟通，再用提前拖曳掩护攻击退防中锋。", prompt: "我们想把节奏提到前 6 秒，利用周启的持球投射和陈骁的推进，优先攻击对手退防落位前的空当。", tag: "转换进攻" },
  half: { label: "破沉退", title: "HORNS TWIST · SHORT ROLL", subtitle: "双肘起手拉开篮下，让贺川短顺处理、弱侧射手完成二次进攻。", prompt: "对手中锋习惯深度沉退。希望打阵地战，利用周启的持球投射和贺川的短顺策应，创造底角与篮下二选一。", tag: "阵地进攻" },
  comeback: { label: "背水一战", title: "77 DOUBLE DRAG · QUICK STRIKE", subtitle: "连续高位掩护制造三分窗口，不再消耗时间进入复杂落位。", prompt: "第四节还剩 2 分钟落后 8 分。我们需要提高三分出手速度、保留前场篮板，同时准备全场压迫。", tag: "追分模式" },
  protect: { label: "保护领先", title: "DELAY 5-OUT · EMPTY CORNER", subtitle: "控制回合时间，把球稳定交到最有把握的错位与罚球点。", prompt: "最后 4 分钟领先 7 分。希望降低失误、消耗时间，用五外阵型寻找最稳的错位，不给对手轻松反击。", tag: "控场模式" },
};

const roleTasks = [
  { playerIndex: 0, player: "周启 · 3", role: "持球", task: "贴近 5 号掩护肩，先读 X5 再决定急停或击地传球", difficulty: 4, cue: "眼睛先看篮筐" },
  { playerIndex: 4, player: "贺川 · 23", role: "短顺", task: "接触后立即下滑，在罚球线外一步停住形成传球角", difficulty: 3, cue: "别冲进协防" },
  { playerIndex: 1, player: "林越 · 11", role: "弱侧", task: "X2 头转向球时从 45° 下压到底角，保持宽度", difficulty: 2, cue: "晚切半拍" },
  { playerIndex: 3, player: "徐威 · 4", role: "二次掩护", task: "第一掩护是假动作，转身后为林越做反向掩护", difficulty: 4, cue: "脚步不能停" },
];

function RadarCanvas({ player }: { player: Player }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2 + 2;
      const radius = Math.min(w, h) * 0.31;
      const point = (i: number, r: number) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
        return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
      };

      ctx.clearRect(0, 0, w, h);
      for (let ring = 1; ring <= 4; ring++) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const [x, y] = point(i, radius * ring / 4);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = ring === 4 ? "#3a403b" : "#2a2f2c";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const [x, y] = point(i, radius);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#2a2f2c";
        ctx.stroke();
      }
      ctx.beginPath();
      player.attributes.forEach((value, i) => {
        const [x, y] = point(i, radius * value / 100);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(214, 255, 75, .18)";
      ctx.strokeStyle = "#d6ff4b";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      player.attributes.forEach((value, i) => {
        const [x, y] = point(i, radius * value / 100);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#d6ff4b";
        ctx.fill();
      });
      ctx.fillStyle = "#a8afa9";
      ctx.font = "11px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ATTR_LABELS.forEach((label, i) => {
        const [x, y] = point(i, radius + 22);
        ctx.fillText(label, x, y);
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [player]);

  return <canvas ref={ref} className="radar-canvas" role="img" aria-label={`${player.name}的六维能力雷达图`} />;
}

function CourtCanvas({ phase, positions, nextPositions }: { phase: number; positions: number[][]; nextPositions: number[][] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const X = (n: number) => n / 100 * w;
      const Y = (n: number) => n / 100 * h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#9c613d";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,.025)" : "rgba(45,20,6,.03)";
        ctx.fillRect(i * w / 12, 0, w / 12, h);
      }
      ctx.strokeStyle = "rgba(255, 242, 214, .9)";
      ctx.lineWidth = Math.max(1.5, w / 420);
      const inset = 8;
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      ctx.beginPath();
      ctx.moveTo(X(5), Y(50)); ctx.lineTo(X(20), Y(50));
      ctx.moveTo(X(7), Y(5)); ctx.arc(X(7), Y(50), Y(20), -Math.PI / 2, Math.PI / 2);
      ctx.moveTo(X(100), Y(26)); ctx.lineTo(X(80), Y(26)); ctx.lineTo(X(80), Y(74)); ctx.lineTo(X(100), Y(74));
      ctx.moveTo(X(80), Y(38)); ctx.lineTo(X(100), Y(38));
      ctx.moveTo(X(80), Y(62)); ctx.lineTo(X(100), Y(62));
      ctx.moveTo(X(94), Y(44)); ctx.lineTo(X(94), Y(56));
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(X(80), Y(50), Y(12), 0, Math.PI * 2);
      ctx.arc(X(91.5), Y(50), Y(2.4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(100), Y(8));
      ctx.lineTo(X(94), Y(8));
      ctx.bezierCurveTo(X(63), Y(10), X(63), Y(90), X(94), Y(92));
      ctx.lineTo(X(100), Y(92));
      ctx.stroke();

      const active = phase < 2 ? [0, 1, 3, 4] : [0, 2, 4];
      ctx.lineCap = "round";
      active.forEach((index, routeIndex) => {
        const start = positions[index];
        const end = nextPositions[index];
        ctx.beginPath();
        ctx.moveTo(X(start[0]), Y(start[1]));
        const bend = (routeIndex % 2 ? -1 : 1) * Y(7);
        ctx.quadraticCurveTo((X(start[0]) + X(end[0])) / 2, (Y(start[1]) + Y(end[1])) / 2 + bend, X(end[0]), Y(end[1]));
        ctx.setLineDash([7, 7]);
        ctx.strokeStyle = "rgba(214,255,75,.9)";
        ctx.lineWidth = Math.max(2, w / 300);
        ctx.stroke();
        ctx.setLineDash([]);
        const angle = Math.atan2(Y(end[1]) - Y(start[1]), X(end[0]) - X(start[0]));
        ctx.beginPath();
        ctx.moveTo(X(end[0]), Y(end[1]));
        ctx.lineTo(X(end[0]) - 9 * Math.cos(angle - .5), Y(end[1]) - 9 * Math.sin(angle - .5));
        ctx.lineTo(X(end[0]) - 9 * Math.cos(angle + .5), Y(end[1]) - 9 * Math.sin(angle + .5));
        ctx.closePath();
        ctx.fillStyle = "#d6ff4b";
        ctx.fill();
      });

      const passFrom = phase === 2 ? positions[4] : positions[0];
      const passTo = phase === 0 ? nextPositions[4] : nextPositions[1];
      ctx.beginPath();
      ctx.moveTo(X(passFrom[0]), Y(passFrom[1]));
      ctx.lineTo(X(passTo[0]), Y(passTo[1]));
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = "rgba(255,255,255,.92)";
      ctx.lineWidth = Math.max(1.5, w / 400);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [phase, positions, nextPositions]);

  return <canvas ref={ref} className="court-canvas" role="img" aria-label="本队对阵对手的半场战术模拟" />;
}

function Difficulty({ value }: { value: number }) {
  return (
    <span className="difficulty" aria-label={`执行难度 ${value} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => <i key={index} className={index < value ? "filled" : ""} />)}
    </span>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("lab");
  const [mobileNav, setMobileNav] = useState(false);
  const [teams, setTeams] = useState(initialTeams);
  const [players, setPlayers] = useState(initialPlayers);
  const [ownTeam, setOwnTeam] = useState("falcons");
  const [opponent, setOpponent] = useState("thunder");
  const [intent, setIntent] = useState<IntentKey>("half");
  const [prompt, setPrompt] = useState(intentPlans.half.prompt);
  const [phase, setPhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<{ side: Side; index: number }>({ side: "own", index: 0 });
  const [selectedPlayerId, setSelectedPlayerId] = useState("zhou");
  const [teamLevel, setTeamLevel] = useState("高中精英");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [ownPositions, setOwnPositions] = useState(offenseSets[0].map(point => [...point]));
  const [opponentPositions, setOpponentPositions] = useState(defenseSets[0].map(point => [...point]));
  const dragging = useRef<{ side: Side; index: number } | null>(null);
  const courtStage = useRef<HTMLDivElement>(null);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPlayer = players.find(player => player.id === selectedPlayerId) || players[0];
  const ownTeamData = teams.find(team => team.id === ownTeam) || teams[0];
  const opponentData = teams.find(team => team.id === opponent) || teams[1];
  const plan = intentPlans[intent];

  const nextPositions = useMemo(() => offenseSets[Math.min(phase + 1, 3)], [phase]);

  useEffect(() => {
    setOwnPositions(offenseSets[phase].map(point => [...point]));
    setOpponentPositions(defenseSets[Math.min(phase, 2)].map(point => [...point]));
  }, [phase]);

  useEffect(() => {
    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, []);

  const chooseIntent = (key: IntentKey) => {
    setIntent(key);
    setPrompt(intentPlans[key].prompt);
    setSimulated(false);
  };

  const runGeneration = () => {
    setIsGenerating(true);
    setSimulated(false);
    window.setTimeout(() => {
      setIsGenerating(false);
      setPhase(0);
    }, 850);
  };

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    window.setTimeout(() => {
      setPrompt("最后 4 分钟，对手开始换防。我要让周启继续持球，但避免他被包夹；贺川负责短顺，林越埋伏弱侧底角。");
      setIsListening(false);
    }, 1100);
  };

  const togglePlay = () => {
    if (playTimer.current) {
      clearInterval(playTimer.current);
      playTimer.current = null;
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    if (phase === 2) setPhase(0);
    playTimer.current = setInterval(() => {
      setPhase(current => {
        if (current >= 2) {
          if (playTimer.current) clearInterval(playTimer.current);
          playTimer.current = null;
          setIsPlaying(false);
          return 2;
        }
        return current + 1;
      });
    }, 1250);
  };

  const dragMarker = (event: ReactPointerEvent<HTMLButtonElement>, side: Side, index: number) => {
    if (!dragging.current || !courtStage.current) return;
    const rect = courtStage.current.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, (event.clientX - rect.left) / rect.width * 100));
    const y = Math.max(7, Math.min(93, (event.clientY - rect.top) / rect.height * 100));
    const setter = side === "own" ? setOwnPositions : setOpponentPositions;
    setter(current => current.map((point, pointIndex) => pointIndex === index ? [x, y] : point));
  };

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, side: Side, index: number) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = { side, index };
    setSelectedMarker({ side, index });
    if (side === "own" && players[index]) setSelectedPlayerId(players[index].id);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragging.current = null;
  };

  const addTeam = () => {
    if (teams.length >= 10) return;
    const number = teams.length + 1;
    setTeams(current => [...current, { id: `team-${number}`, name: `新建球队 ${number}`, short: `球队 ${number}`, group: "待设置", level: "待评估", pace: "待设置", players: 0, accent: "gray" }]);
  };

  const addPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: String(form.get("name") || "新球员"),
      number: Number(form.get("number") || 0),
      position: String(form.get("position") || "G"),
      height: Number(form.get("height") || 180),
      build: String(form.get("build") || "均衡"),
      level: String(form.get("level") || "高中"),
      archetype: String(form.get("archetype") || "全能后卫模板"),
      version: String(form.get("version") || "成长版"),
      role: "待定义角色",
      traits: ["待观察", "待评估"],
      attributes: ATTR_LABELS.map(label => Number(form.get(label) || 65)),
    };
    setPlayers(current => [...current, newPlayer]);
    setSelectedPlayerId(newPlayer.id);
    setShowAddPlayer(false);
  };

  const navItems: { id: View; label: string; detail: string; icon: typeof Activity }[] = [
    { id: "lab", label: "比赛实验室", detail: "AI 对阵推演", icon: BrainCircuit },
    { id: "teams", label: "球队与球员", detail: "画像与阵容", icon: Users },
    { id: "playbook", label: "我的战术库", detail: "版本与分支", icon: Layers3 },
  ];

  return (
    <div className="product-shell">
      <aside className={mobileNav ? "sidebar is-open" : "sidebar"}>
        <div className="brand" aria-label="SETPLAY AI">
          <span className="brand-mark">SP</span>
          <div><b>SETPLAY</b><small>COACHING INTELLIGENCE</small></div>
        </div>
        <nav className="main-nav" aria-label="主导航">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} aria-label={`${item.label} · ${item.detail}`} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => { setView(item.id); setMobileNav(false); }}>
                <Icon size={18} />
                <span><b>{item.label}</b><small>{item.detail}</small></span>
                {view === item.id && <i />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-capacity">
          <div><span>已管理球队</span><b>{teams.length} / 10</b></div>
          <div className="capacity-track"><span style={{ width: `${teams.length * 10}%` }} /></div>
          <button onClick={addTeam} disabled={teams.length >= 10}><Plus size={15} />添加球队</button>
        </div>
        <div className="sidebar-profile">
          <span className="avatar">陈</span>
          <div><b>陈教练</b><small>主教练 · Pro</small></div>
          <Settings size={16} />
        </div>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <button className="mobile-menu" aria-label="打开导航" onClick={() => setMobileNav(current => !current)}><Menu size={20} /></button>
          <div className="topbar-title">
            <span>{view === "lab" ? "GAMEPLAN LAB" : view === "teams" ? "TEAM INTELLIGENCE" : "PLAYBOOK"}</span>
            <b>{view === "lab" ? "比赛实验室" : view === "teams" ? "球队与球员" : "我的战术库"}</b>
          </div>
          <div className="topbar-actions">
            <button aria-label="搜索"><Search size={18} /></button>
            <button aria-label="通知" className="notification"><Bell size={18} /><i /></button>
            <span className="sync-state"><i />阵容已同步</span>
          </div>
        </header>

        {view === "lab" && (
          <main className="lab-page">
            <section className="matchup-strip">
              <div className="matchup-side">
                <span className="team-role">本队</span>
                <div className="team-badge lime">HF</div>
                <label>
                  <select value={ownTeam} onChange={event => setOwnTeam(event.target.value)}>
                    {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                  <small>{ownTeamData.group} · {ownTeamData.players} 人可用</small>
                </label>
              </div>
              <div className="versus"><ArrowLeftRight size={17} /><span>VS</span></div>
              <div className="matchup-side opponent">
                <span className="team-role">对手</span>
                <div className="team-badge orange">CT</div>
                <label>
                  <select value={opponent} onChange={event => setOpponent(event.target.value)}>
                    {teams.filter(team => team.id !== ownTeam).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                  <small>{opponentData.group} · 模拟画像完整</small>
                </label>
              </div>
              <div className="game-context">
                <span><Clock3 size={14} />第 4 节 · 04:12</span>
                <b>67 <small>:</small> 71</b>
              </div>
            </section>

            <div className="lab-grid">
              <section className="intent-panel panel">
                <div className="panel-heading">
                  <div><span>01 · 比赛意图</span><h2>你想怎么打？</h2></div>
                  <MessageSquareText size={19} />
                </div>
                <div className="intent-chips">
                  {(Object.keys(intentPlans) as IntentKey[]).map(key => (
                    <button key={key} className={intent === key ? "selected" : ""} onClick={() => chooseIntent(key)}>{intentPlans[key].label}</button>
                  ))}
                </div>
                <div className={isListening ? "prompt-box listening" : "prompt-box"}>
                  <textarea value={prompt} onChange={event => setPrompt(event.target.value)} aria-label="输入比赛意图" />
                  <div className="prompt-tools">
                    <span>{prompt.length} 字</span>
                    <button onClick={toggleVoice} className={isListening ? "active" : ""} aria-label="语音输入"><Mic size={17} />{isListening ? "正在听…" : "语音"}</button>
                  </div>
                </div>
                <div className="context-inputs">
                  <label><span>比赛级别</span><select defaultValue="高中"><option>小学</option><option>初中</option><option>高中</option><option>大学</option><option>社区</option><option>半职业</option><option>职业</option></select></label>
                  <label><span>容错偏好</span><select defaultValue="稳中求快"><option>稳中求快</option><option>高风险高回报</option><option>简化执行</option></select></label>
                </div>
                <button className="generate-button" onClick={runGeneration} disabled={isGenerating}>
                  {isGenerating ? <><span className="spinner" />正在推演阵容与对位</> : <><Sparkles size={17} />生成适配战术<ChevronRight size={17} /></>}
                </button>
                <button className="simulate-button" onClick={() => setSimulated(true)}><BarChart3 size={16} />自动模拟 200 个防守回合</button>
                <div className="model-note"><Shield size={14} /><span>建议依据会显示球员画像与对手假设，不输出伪精确胜率。</span></div>
              </section>

              <section className="court-workspace panel">
                <div className="court-head">
                  <div>
                    <span className="live-dot"><i />LIVE BOARD</span>
                    <h2>{plan.title}</h2>
                    <p>{plan.subtitle}</p>
                  </div>
                  <div className="court-actions">
                    <button onClick={() => setPhase(0)} aria-label="重置战术"><RotateCcw size={16} /></button>
                    <button className="play-button" onClick={togglePlay}>{isPlaying ? <Pause size={16} /> : <Play size={16} />}{isPlaying ? "暂停" : "播放"}</button>
                  </div>
                </div>

                <div className="court-stage" ref={courtStage}>
                  <CourtCanvas phase={phase} positions={ownPositions} nextPositions={nextPositions} />
                  <div className="court-hud"><span>{plan.tag}</span><b>14.{phase * 3}</b></div>
                  {ownPositions.map((position, index) => (
                    <button
                      key={`own-${index}`}
                      className={selectedMarker.side === "own" && selectedMarker.index === index ? "player-marker own selected" : "player-marker own"}
                      style={{ left: `${position[0]}%`, top: `${position[1]}%` }}
                      onPointerDown={event => beginDrag(event, "own", index)}
                      onPointerMove={event => dragMarker(event, "own", index)}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      aria-label={`${players[index]?.name || index + 1}，拖动调整位置`}
                    >
                      <b>{players[index]?.number || index + 1}</b><small>{players[index]?.name || `P${index + 1}`}</small>
                      {index === 0 && <i className="ball" />}
                    </button>
                  ))}
                  {opponentPositions.map((position, index) => (
                    <button
                      key={`opponent-${index}`}
                      className={selectedMarker.side === "opponent" && selectedMarker.index === index ? "player-marker opponent selected" : "player-marker opponent"}
                      style={{ left: `${position[0]}%`, top: `${position[1]}%` }}
                      onPointerDown={event => beginDrag(event, "opponent", index)}
                      onPointerMove={event => dragMarker(event, "opponent", index)}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      aria-label={`${opponentNames[index]}，拖动调整位置`}
                    ><b>X{index + 1}</b><small>{opponentNames[index].split(" · ")[1]}</small></button>
                  ))}
                  <span className="drag-note"><SlidersHorizontal size={13} />球员与对手都可拖动</span>
                </div>

                <div className="phase-track" aria-label="战术阶段">
                  {["双肘落位", "Twist 触发", "短顺二选一"].map((label, index) => (
                    <button key={label} className={phase === index ? "active" : ""} onClick={() => setPhase(index)}>
                      <span>0{index + 1}</span><b>{label}</b><i />
                    </button>
                  ))}
                </div>

                <div className="court-legend">
                  <span><i className="own" />本队</span><span><i className="opp" />对手</span><span><i className="route" />跑位</span><span><i className="pass" />传球</span>
                  <em>选择球员查看个人任务</em>
                </div>
              </section>

              <section className="plan-panel panel">
                <div className="plan-status"><span><Sparkles size={14} />AI PLAN</span><b><Check size={13} />已完成阵容适配</b></div>
                <h2>{plan.title.split(" · ")[0]}</h2>
                <p className="plan-summary">这套打法不是通用模板：它利用周启的高阶持球投射与贺川的短顺处理，同时针对对手 X5 的深度沉退。</p>
                {simulated && <div className="simulation-result"><Activity size={16} /><div><b>模拟发现一个更稳定的分支</b><span>X4 提前收缩时，不做强行顺下，改由徐威在罚球线完成二次手递手。</span></div></div>}
                <div className="fit-reasons">
                  <span>为什么适配</span>
                  <ul>
                    <li><i>3</i><p><b>周启</b>可在掩护后直接急停，迫使 X5 离开篮下。</p></li>
                    <li><i>23</i><p><b>贺川</b>的策应高于队伍平均，适合短顺后处理 4 打 3。</p></li>
                    <li><i>X5</i><p><b>{opponentData.short}</b>中锋回撤过深，弱侧底角会被迫协防。</p></li>
                  </ul>
                </div>
                <div className="role-heading"><span>角色任务与执行难点</span><button>查看全部 5 人<ChevronRight size={13} /></button></div>
                <div className="role-list">
                  {roleTasks.map(task => (
                    <button key={task.player} className={selectedMarker.side === "own" && selectedMarker.index === task.playerIndex ? "role-row active" : "role-row"} onClick={() => { setSelectedMarker({ side: "own", index: task.playerIndex }); setSelectedPlayerId(players[task.playerIndex].id); }}>
                      <span className="role-player">{task.player}</span>
                      <span className="role-task"><b>{task.role}</b><small>{task.task}</small></span>
                      <span className="role-diff"><Difficulty value={task.difficulty} /><small>{task.cue}</small></span>
                    </button>
                  ))}
                </div>
                <div className="selected-read">
                  {selectedMarker.side === "own" ? (
                    <><span>球员聚焦 · {players[selectedMarker.index]?.name}</span><b>最难的一拍：掩护后的第一眼必须先看 X5，而不是低头找运球路线。</b></>
                  ) : (
                    <><span>对手聚焦 · {opponentNames[selectedMarker.index]}</span><b>对手画像提示：被迫横移后回位慢，可用连续二次动作制造空位。</b></>
                  )}
                </div>
              </section>
            </div>
          </main>
        )}

        {view === "teams" && (
          <main className="teams-page">
            <section className="team-list-panel panel">
              <div className="section-title"><div><span>MY TEAMS</span><h2>我的球队</h2></div><b>{teams.length} / 10</b></div>
              <div className="team-list">
                {teams.map((team, index) => (
                  <button key={team.id} className={ownTeam === team.id ? "team-list-item active" : "team-list-item"} onClick={() => setOwnTeam(team.id)}>
                    <span className={`team-badge ${team.accent}`}>{team.short.slice(0, 2)}</span>
                    <span><b>{team.name}</b><small>{team.group} · {team.players} 人</small></span>
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
              <button className="add-team-button" onClick={addTeam} disabled={teams.length >= 10}><Plus size={16} />添加一支球队</button>
            </section>

            <section className="roster-panel panel">
              <div className="team-profile-head">
                <div className="large-team-badge">HF</div>
                <div><span>球队画像</span><h1>{ownTeamData.name}</h1><p>{players.length} 名球员 · 最后更新于今天 14:32</p></div>
                <button><Settings size={16} />球队设置</button>
              </div>
              <div className="team-metrics">
                <label><span>团队平均水平</span><select value={teamLevel} onChange={event => setTeamLevel(event.target.value)}>{LEVELS.map(level => <option key={level}>{level}{level === "高中" ? "精英" : ""}</option>)}</select><small>不限制单个球员水平</small></label>
                <div><span>进攻节奏</span><b>78 <small>/ 100</small></b><em>快节奏</em></div>
                <div><span>主要体系</span><b>4-Out</b><em>挡拆 + 转换</em></div>
                <div><span>AI 画像完整度</span><b>92%</b><em>2 人待补充体测</em></div>
              </div>
              <div className="roster-toolbar">
                <div><h2>球员名单</h2><span>团队等级与个人等级彼此独立</span></div>
                <button className="add-player-button" onClick={() => setShowAddPlayer(true)}><Plus size={16} />添加球员</button>
              </div>
              <div className="roster-table-wrap">
                <table className="roster-table">
                  <thead><tr><th>球员</th><th>身体 / 位置</th><th>个人水平</th><th>打法模板</th><th>球队角色</th><th>关键能力</th></tr></thead>
                  <tbody>
                    {players.map(player => (
                      <tr key={player.id} className={selectedPlayerId === player.id ? "selected" : ""} onClick={() => setSelectedPlayerId(player.id)}>
                        <td><span className="jersey">{player.number}</span><span><b>{player.name}</b><small>{player.traits.join(" · ")}</small></span></td>
                        <td><b>{player.height} cm · {player.position}</b><small>{player.build}体型</small></td>
                        <td><span className="level-tag">{player.level}</span>{player.level.includes("大学") && <small className="level-note">高于团队平均</small>}</td>
                        <td><b>{player.archetype}</b><small>{player.version}</small></td>
                        <td><b>{player.role}</b></td>
                        <td><div className="micro-bars">{player.attributes.slice(0, 4).map((value, i) => <i key={i}><span style={{ width: `${value}%` }} /></i>)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="player-profile-panel panel">
              <div className="profile-top"><span className="profile-number">{selectedPlayer.number}</span><button aria-label="更多设置"><SlidersHorizontal size={17} /></button></div>
              <span className="eyebrow">PLAYER PROFILE</span>
              <h2>{selectedPlayer.name}</h2>
              <p>{selectedPlayer.height} cm · {selectedPlayer.position} · {selectedPlayer.build}体型</p>
              <div className="independent-level"><span>个人水平</span><b>{selectedPlayer.level}</b><small>球队平均：{teamLevel}</small></div>
              <RadarCanvas player={selectedPlayer} />
              <div className="attribute-values">
                {ATTR_LABELS.map((label, index) => <span key={label}><small>{label}</small><b>{selectedPlayer.attributes[index]}</b></span>)}
              </div>
              <div className="archetype-card">
                <span>打法像谁？</span>
                <h3>{selectedPlayer.archetype}</h3>
                <p>{selectedPlayer.version} · 依据六维能力、身体条件与比赛习惯自动匹配，可手动修改。</p>
                <button><Sparkles size={15} />重新匹配打法模板</button>
              </div>
              <div className="profile-tags"><span>{selectedPlayer.role}</span>{selectedPlayer.traits.map(trait => <span key={trait}>{trait}</span>)}</div>
            </aside>
          </main>
        )}

        {view === "playbook" && (
          <main className="playbook-page">
            <div className="playbook-head">
              <div><span>TEAM PLAYBOOK</span><h1>战术库与 AI 分支</h1><p>保存原始战术、针对不同对手的版本，以及每名球员的执行口令。</p></div>
              <button onClick={() => setView("lab")}><Plus size={16} />新建 AI 战术</button>
            </div>
            <div className="playbook-grid">
              {(["half", "quick", "comeback", "protect"] as IntentKey[]).map((key, index) => {
                const item = intentPlans[key];
                return (
                <button className="play-card" key={item.title} onClick={() => { setIntent(key); setPrompt(item.prompt); setView("lab"); }}>
                  <div className={`mini-court phase-${index}`}><i className="mini-hoop" /><span className="p p1" /><span className="p p2" /><span className="p p3" /><span className="trail" /></div>
                  <div className="play-card-copy"><span>{item.tag}</span><h2>{item.title}</h2><p>{item.subtitle}</p><div><b>{index === 0 ? "3 个" : index + 1 + " 个"} AI 分支</b><em>最近使用 · {index + 1} 天前</em></div></div>
                </button>
              )})}
            </div>
          </main>
        )}
      </section>

      {showAddPlayer && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowAddPlayer(false)}>
          <form className="player-modal" onSubmit={addPlayer} onMouseDown={event => event.stopPropagation()}>
            <div className="modal-head"><div><span>NEW PLAYER</span><h2>添加球员画像</h2></div><button type="button" onClick={() => setShowAddPlayer(false)} aria-label="关闭"><X size={19} /></button></div>
            <p className="modal-intro">团队等级不会限制个人等级。你可以在小学球队中添加职业级或 NBA 级球员画像。</p>
            <div className="form-grid">
              <label><span>姓名</span><input name="name" required placeholder="例如：王一" /></label>
              <label><span>号码</span><input name="number" type="number" min="0" max="99" defaultValue="8" /></label>
              <label><span>身高（cm）</span><input name="height" type="number" min="120" max="240" defaultValue="188" /></label>
              <label><span>位置</span><select name="position" defaultValue="SG"><option>PG</option><option>SG</option><option>SF</option><option>PF</option><option>C</option><option>G</option><option>F</option></select></label>
              <label><span>体型</span><select name="build" defaultValue="均衡"><option>精瘦</option><option>均衡</option><option>强壮</option><option>厚重</option><option>长臂</option></select></label>
              <label><span>个人水平</span><select name="level" defaultValue="高中">{LEVELS.map(level => <option key={level}>{level}</option>)}</select></label>
              <label><span>打法模板</span><select name="archetype" defaultValue="库里式无球牵引"><option>库里式无球牵引</option><option>乔丹式中距离脚步</option><option>詹姆斯式推进</option><option>恩比德式低位终结</option><option>约基奇式肘区策应</option><option>欧文式单打突破</option></select></label>
              <label><span>版本描述</span><input name="version" defaultValue="成长版" /></label>
            </div>
            <div className="slider-section"><span>六维能力</span>{ATTR_LABELS.map((label, index) => <label key={label}><small>{label}</small><input name={label} type="range" min="20" max="99" defaultValue={[72, 82, 78, 70, 68, 80][index]} /></label>)}</div>
            <div className="modal-actions"><button type="button" onClick={() => setShowAddPlayer(false)}>取消</button><button type="submit"><Check size={16} />保存球员画像</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
