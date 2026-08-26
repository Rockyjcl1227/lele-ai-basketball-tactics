"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { DEFENSE_OPTIONS, TACTIC_SOURCES, generateTactic, type CapabilityProfile, type DefenseType, type TacticResult, type TacticRoute } from "./tactics";

type GlyphProps = { size?: number };
const makeGlyph = (symbol: string) => function Glyph({ size = 16 }: GlyphProps) {
  return <span className="glyph-icon" style={{ fontSize: `${Math.max(11, size - 2)}px` }} aria-hidden="true">{symbol}</span>;
};
const Activity = makeGlyph("⌁");
const ArrowUpRight = makeGlyph("↗");
const ArrowLeftRight = makeGlyph("⇄");
const BarChart3 = makeGlyph("▥");
const BrainCircuit = makeGlyph("AI");
const Check = makeGlyph("✓");
const ChevronRight = makeGlyph("›");
const Clock3 = makeGlyph("◷");
const Draw = makeGlyph("✎");
const Eraser = makeGlyph("⌫");
const Layers3 = makeGlyph("册");
const Menu = makeGlyph("☰");
const MessageSquareText = makeGlyph("▤");
const Mic = makeGlyph("◉");
const Pause = makeGlyph("Ⅱ");
const Play = makeGlyph("▶");
const Plus = makeGlyph("+");
const RotateCcw = makeGlyph("↺");
const Settings = makeGlyph("⚙");
const Shield = makeGlyph("◇");
const SlidersHorizontal = makeGlyph("≡");
const Sparkles = makeGlyph("✦");
const TacticsBoard = makeGlyph("板");
const Users = makeGlyph("队");
const X = makeGlyph("×");

type View = "board" | "teams" | "lab" | "playbook";
type IntentKey = "quick" | "half" | "comeback" | "protect";
type Side = "own" | "opponent";
type BoardTool = "move" | "arrow" | "pass" | "pen";
type BoardOrientation = "vertical" | "horizontal";
type BoardField = "full" | "half";
type BoardPoint = [number, number];
type PlaybookRecord = { id: string; title: string; subtitle: string; tag: string; createdAt: string; frames: BoardToken[][]; aiDrawings?: BoardDrawing[][]; tacticResult?: TacticResult };

type BoardToken = {
  id: string;
  team: "a" | "b" | "ball";
  number?: number;
  name: string;
  x: number;
  y: number;
};

type BoardDrawing = {
  id: string;
  kind: Exclude<BoardTool, "move">;
  points: BoardPoint[];
};

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

const aggregateRosterCapabilities = (roster: Player[]): CapabilityProfile => {
  const average = (attributeIndex: number) => roster.length ? Math.round(roster.reduce((total, player) => total + (player.attributes[attributeIndex] ?? 0), 0) / roster.length) : 0;
  return { finishing: average(0), shooting: average(1), handling: average(2), passing: average(3), defense: average(4), athleticism: average(5) };
};

const opponentNames = ["X1 · 韩旭", "X2 · 梁恺", "X3 · 张珩", "X4 · 罗新", "X5 · 彭越"];

const boardFramesSeed: BoardToken[][] = [
  [
    { id: "a1", team: "a", number: 1, name: "詹姆斯", x: 50, y: 58 },
    { id: "a2", team: "a", number: 2, name: "库里", x: 19, y: 70 },
    { id: "a3", team: "a", number: 3, name: "杜兰特", x: 76, y: 86 },
    { id: "a4", team: "a", number: 4, name: "戴维斯", x: 34, y: 80 },
    { id: "a5", team: "a", number: 5, name: "约基奇", x: 67, y: 74 },
    { id: "b1", team: "b", number: 1, name: "亚历山大", x: 50, y: 60 },
    { id: "b2", team: "b", number: 2, name: "东契奇", x: 28, y: 65 },
    { id: "b3", team: "b", number: 3, name: "爱德华兹", x: 72, y: 65 },
    { id: "b4", team: "b", number: 4, name: "字母哥", x: 39, y: 76 },
    { id: "b5", team: "b", number: 5, name: "恩比德", x: 61, y: 76 },
    { id: "ball", team: "ball", name: "篮球", x: 54, y: 69 },
  ],
  [
    { id: "a1", team: "a", number: 1, name: "詹姆斯", x: 50, y: 53 },
    { id: "a2", team: "a", number: 2, name: "库里", x: 18, y: 57 },
    { id: "a3", team: "a", number: 3, name: "杜兰特", x: 82, y: 61 },
    { id: "a4", team: "a", number: 4, name: "戴维斯", x: 34, y: 68 },
    { id: "a5", team: "a", number: 5, name: "约基奇", x: 58, y: 60 },
    { id: "b1", team: "b", number: 1, name: "亚历山大", x: 49, y: 46 },
    { id: "b2", team: "b", number: 2, name: "东契奇", x: 24, y: 51 },
    { id: "b3", team: "b", number: 3, name: "爱德华兹", x: 76, y: 54 },
    { id: "b4", team: "b", number: 4, name: "字母哥", x: 40, y: 59 },
    { id: "b5", team: "b", number: 5, name: "恩比德", x: 58, y: 51 },
    { id: "ball", team: "ball", name: "篮球", x: 52, y: 53 },
  ],
  [
    { id: "a1", team: "a", number: 1, name: "詹姆斯", x: 57, y: 35 },
    { id: "a2", team: "a", number: 2, name: "库里", x: 20, y: 30 },
    { id: "a3", team: "a", number: 3, name: "杜兰特", x: 83, y: 38 },
    { id: "a4", team: "a", number: 4, name: "戴维斯", x: 35, y: 46 },
    { id: "a5", team: "a", number: 5, name: "约基奇", x: 52, y: 40 },
    { id: "b1", team: "b", number: 1, name: "亚历山大", x: 54, y: 29 },
    { id: "b2", team: "b", number: 2, name: "东契奇", x: 25, y: 26 },
    { id: "b3", team: "b", number: 3, name: "爱德华兹", x: 77, y: 33 },
    { id: "b4", team: "b", number: 4, name: "字母哥", x: 40, y: 38 },
    { id: "b5", team: "b", number: 5, name: "恩比德", x: 53, y: 25 },
    { id: "ball", team: "ball", name: "篮球", x: 23, y: 30 },
  ],
];

const cloneBoardTokens = (tokens: BoardToken[]) => tokens.map(token => ({ ...token }));

const copyPoints = (points: number[][]) => points.map(([x, y]) => [x, y] as BoardPoint);

const defenseFrames = (defense: DefenseType): BoardPoint[][] => {
  const sets: Record<DefenseType, BoardPoint[]> = {
    "盯人": [[43,50],[56,18],[56,82],[65,36],[65,64]],
    "2-3 联防": [[48,38],[48,62],[67,22],[72,50],[67,78]],
    "3-2 联防": [[48,50],[58,25],[58,75],[76,36],[76,64]],
    "换防": [[45,50],[57,18],[57,82],[63,38],[63,62]],
    "沉退": [[50,50],[62,20],[62,80],[78,38],[84,55]],
    "全场压迫": [[28,44],[34,58],[45,24],[48,76],[62,50]],
  };
  return [0, 1, 2].map(index => sets[defense].map(([x, y]) => [Math.min(94, x + index * 6), y] as BoardPoint));
};

const intentPlans: Record<IntentKey, { label: string; playName: string; title: string; subtitle: string; prompt: string; tag: string; stages: [string, string, string] }> = {
  quick: { label: "抢前 6 秒", playName: "Early Offense", title: "快速推进 · 提前掩护", subtitle: "先跑动制造防守沟通，再用提前掩护攻击尚未落位的中锋。", prompt: "我们想把节奏提到前 6 秒，利用周启的持球投射和陈骁的推进，优先攻击对手退防落位前的空当。", tag: "转换进攻", stages: ["落位：边线快速推进", "发起：提前掩护", "终结：篮下或底角"] },
  half: { label: "破沉退", playName: "Horns Twist", title: "双肘落位 · 中锋短顺", subtitle: "两名内线站到罚球线两侧，掩护后由贺川下顺接球，弱侧射手同时拉开。", prompt: "对手中锋习惯深度沉退。希望打阵地战，利用周启的持球投射和贺川的短顺策应，创造底角与篮下二选一。", tag: "阵地进攻", stages: ["落位：双肘站位", "发起：交叉掩护", "终结：短顺二选一"] },
  comeback: { label: "背水一战", playName: "Double Drag", title: "连续双掩护 · 快速三分", subtitle: "连续两个高位掩护制造三分窗口，不再消耗时间进入复杂落位。", prompt: "第四节还剩 2 分钟落后 8 分。我们需要提高三分出手速度、保留前场篮板，同时准备全场压迫。", tag: "追分模式", stages: ["落位：双掩护排开", "发起：持球连续借掩护", "终结：快速三分"] },
  protect: { label: "保护领先", playName: "Five Out", title: "五人拉开 · 控制回合", subtitle: "控制回合时间，把球稳定交到最有把握的错位与罚球点。", prompt: "最后 4 分钟领先 7 分。希望降低失误、消耗时间，用五外阵型寻找最稳的错位，不给对手轻松反击。", tag: "控场模式", stages: ["落位：五人拉开", "发起：寻找错位", "终结：稳妥出手"] },
};

const DEFAULT_RESULT = generateTactic({ level: "高中", defense: "沉退", objective: intentPlans.half.prompt, tolerance: "稳中求快", team: "海淀猎鹰 U16", roster: aggregateRosterCapabilities(initialPlayers) });

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

function CourtCanvas({ routes }: { routes: TacticRoute[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const courtImage = new Image();
    courtImage.src = "/basketball-court.png";
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
      if (courtImage.complete && courtImage.naturalWidth) {
        ctx.drawImage(courtImage, 0, courtImage.naturalHeight / 2, courtImage.naturalWidth, courtImage.naturalHeight / 2, 0, 0, w, h);
      }

      routes.forEach(route => {
        if (route.points.length < 2) return;
        const color = route.kind === "pass" ? "rgba(255,255,255,.94)" : route.kind === "screen" ? "#8fe7ff" : "#d6ff4b";
        ctx.beginPath();
        route.points.forEach(([x, y], index) => index ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)));
        ctx.setLineDash(route.kind === "pass" ? [3, 6] : route.kind === "screen" ? [9, 4] : []);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, w / 320);
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.setLineDash([]);
        const end = route.points[route.points.length - 1];
        const prior = route.points[route.points.length - 2];
        const angle = Math.atan2(Y(end[1]) - Y(prior[1]), X(end[0]) - X(prior[0]));
        ctx.beginPath();
        ctx.moveTo(X(end[0]), Y(end[1]));
        ctx.lineTo(X(end[0]) - 9 * Math.cos(angle - .5), Y(end[1]) - 9 * Math.sin(angle - .5));
        ctx.lineTo(X(end[0]) - 9 * Math.cos(angle + .5), Y(end[1]) - 9 * Math.sin(angle + .5));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      });
    };
    courtImage.addEventListener("load", draw);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      courtImage.removeEventListener("load", draw);
    };
  }, [routes]);

  return <canvas ref={ref} className="court-canvas" role="img" aria-label="当前阶段的站位、跑位、传球与掩护路线" />;
}

function VerticalBoardCanvas({ drawings, draft, orientation, field }: { drawings: BoardDrawing[]; draft: BoardDrawing | null; orientation: BoardOrientation; field: BoardField }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const courtImage = new Image();
    courtImage.src = "/basketball-court.png";

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const scale = Math.min(w, h);
      const toScreen = ([x, y]: BoardPoint): BoardPoint => orientation === "vertical"
        ? [x / 100 * w, y / 100 * h]
        : [(100 - y) / 100 * w, x / 100 * h];

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#de862b";
      ctx.fillRect(0, 0, w, h);
      if (courtImage.complete && courtImage.naturalWidth) {
        const sourceY = field === "half" ? courtImage.naturalHeight / 2 : 0;
        const sourceH = field === "half" ? courtImage.naturalHeight / 2 : courtImage.naturalHeight;
        if (orientation === "vertical") {
          ctx.drawImage(courtImage, 0, sourceY, courtImage.naturalWidth, sourceH, 0, 0, w, h);
        } else {
          ctx.save();
          ctx.translate(w, 0);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(courtImage, 0, sourceY, courtImage.naturalWidth, sourceH, 0, 0, h, w);
          ctx.restore();
        }
      }

      const renderDrawing = (drawing: BoardDrawing, isDraft = false) => {
        if (drawing.points.length < 2) return;
        const color = drawing.kind === "pass" ? "rgba(255,255,255,.94)" : drawing.kind === "pen" ? "#8fe7ff" : "#dfff54";
        const screenPoints = drawing.points.map(toScreen);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = drawing.kind === "pen" ? Math.max(2.2, scale / 150) : Math.max(2.4, scale / 135);
        ctx.globalAlpha = isDraft ? .72 : .96;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (drawing.kind === "pass") ctx.setLineDash([5, 7]);
        ctx.beginPath();
        screenPoints.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.stroke();
        if (drawing.kind === "arrow") {
          const end = screenPoints[screenPoints.length - 1];
          const prior = screenPoints[screenPoints.length - 2];
          const angle = Math.atan2(end[1] - prior[1], end[0] - prior[0]);
          const size = Math.max(10, scale * .032);
          ctx.beginPath();
          ctx.moveTo(end[0], end[1]);
          ctx.lineTo(end[0] - size * Math.cos(angle - .55), end[1] - size * Math.sin(angle - .55));
          ctx.lineTo(end[0] - size * Math.cos(angle + .55), end[1] - size * Math.sin(angle + .55));
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };
      drawings.forEach(drawing => renderDrawing(drawing));
      if (draft) renderDrawing(draft, true);
    };

    courtImage.addEventListener("load", draw);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      courtImage.removeEventListener("load", draw);
    };
  }, [drawings, draft, orientation, field]);

  return <canvas ref={ref} className="vertical-board-canvas" role="img" aria-label={`${orientation === "vertical" ? "纵向" : "横向"}${field === "half" ? "半场" : "全场"}篮球战术板`} />;
}

export default function Home() {
  const [view, setView] = useState<View>("board");
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
  const [gameLevel, setGameLevel] = useState("高中");
  const [riskPreference, setRiskPreference] = useState("稳中求快");
  const [opponentDefense, setOpponentDefense] = useState<DefenseType>("沉退");
  const [tacticResult, setTacticResult] = useState<TacticResult>(DEFAULT_RESULT);
  const [generationNote, setGenerationNote] = useState("已用本地规则生成，可修改输入后重新匹配");
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [ownPositions, setOwnPositions] = useState(copyPoints(DEFAULT_RESULT.phases[0].positions));
  const [opponentPositions, setOpponentPositions] = useState(copyPoints(defenseFrames("沉退")[0]));
  const dragging = useRef<{ side: Side; index: number } | null>(null);
  const courtStage = useRef<HTMLDivElement>(null);
  const labAnimationRef = useRef<number | null>(null);
  const labRunId = useRef(0);
  const labPositionsRef = useRef({ own: copyPoints(DEFAULT_RESULT.phases[0].positions), opponent: copyPoints(defenseFrames("沉退")[0]) });
  const [homeName, setHomeName] = useState("乐乐 A 公司队");
  const [awayName, setAwayName] = useState("B 公司雷霆队");
  const [quarter, setQuarter] = useState("4");
  const [gameClock, setGameClock] = useState("04:12");
  const [homeScore, setHomeScore] = useState("67");
  const [awayScore, setAwayScore] = useState("71");

  const [boardTool, setBoardTool] = useState<BoardTool>("move");
  const [boardOrientation, setBoardOrientation] = useState<BoardOrientation>("horizontal");
  const [boardField, setBoardField] = useState<BoardField>("half");
  const [coachName, setCoachName] = useState("凯文肚腩乐");
  const [boardAiOpen, setBoardAiOpen] = useState(false);
  const [boardAiPrompt, setBoardAiPrompt] = useState("");
  const [boardAiStatus, setBoardAiStatus] = useState("");
  const [savedPlays, setSavedPlays] = useState<PlaybookRecord[]>([]);
  const [boardPhase, setBoardPhase] = useState(0);
  const [boardFrames, setBoardFrames] = useState(() => boardFramesSeed.map(cloneBoardTokens));
  const [boardTokens, setBoardTokens] = useState(() => cloneBoardTokens(boardFramesSeed[0]));
  const [boardDrawings, setBoardDrawings] = useState<BoardDrawing[]>([]);
  const [boardAiDrawings, setBoardAiDrawings] = useState<BoardDrawing[][]>([[], [], []]);
  const [boardTacticResult, setBoardTacticResult] = useState<TacticResult | null>(null);
  const [boardOnCourtIds, setBoardOnCourtIds] = useState<Set<string>>(() => new Set(["a1", "a2", "a3", "a4", "a5"]));
  const [boardDraft, setBoardDraft] = useState<BoardDrawing | null>(null);
  const [boardPlaying, setBoardPlaying] = useState(false);
  const boardStageRef = useRef<HTMLDivElement>(null);
  const boardTokensRef = useRef(boardTokens);
  const boardDraftRef = useRef<BoardDrawing | null>(null);
  const boardDragging = useRef<{ id: string; origin: "court" | "tray" } | null>(null);
  const boardAnimationRef = useRef<number | null>(null);
  const boardRunId = useRef(0);
  const drawingId = useRef(0);

  const selectedPlayer = players.find(player => player.id === selectedPlayerId) || players[0];
  const ownTeamData = teams.find(team => team.id === ownTeam) || teams[0];
  const opponentData = teams.find(team => team.id === opponent) || teams[1];
  const quickPlan = intentPlans[intent];
  const activePhase = tacticResult.phases[phase];

  const setLabPositions = (own: BoardPoint[], opponentPoints: BoardPoint[]) => {
    const copied = { own: copyPoints(own), opponent: copyPoints(opponentPoints) };
    labPositionsRef.current = copied;
    setOwnPositions(copied.own);
    setOpponentPositions(copied.opponent);
  };

  const stopLabPlayback = () => {
    labRunId.current += 1;
    if (labAnimationRef.current) cancelAnimationFrame(labAnimationRef.current);
    labAnimationRef.current = null;
    setIsPlaying(false);
  };

  const animateLabPhase = (nextPhase: number, duration = 760) => new Promise<void>(resolve => {
    const normalized = Math.max(0, Math.min(2, nextPhase));
    const targetOwn = tacticResult.phases[normalized].positions;
    const targetOpponent = defenseFrames(opponentDefense)[normalized];
    const start = labPositionsRef.current;
    const startedAt = performance.now();
    setPhase(normalized);
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const interpolate = (from: BoardPoint[], to: BoardPoint[]) => from.map((point, index) => [point[0] + (to[index][0] - point[0]) * eased, point[1] + (to[index][1] - point[1]) * eased] as BoardPoint);
      setLabPositions(interpolate(start.own, targetOwn), interpolate(start.opponent, targetOpponent));
      if (progress < 1) labAnimationRef.current = requestAnimationFrame(tick);
      else { labAnimationRef.current = null; resolve(); }
    };
    labAnimationRef.current = requestAnimationFrame(tick);
  });

  const applyLabPhase = (nextPhase: number) => {
    stopLabPlayback();
    void animateLabPhase(nextPhase);
  };

  useEffect(() => {
    return () => {
      if (labAnimationRef.current) cancelAnimationFrame(labAnimationRef.current);
      if (boardAnimationRef.current) cancelAnimationFrame(boardAnimationRef.current);
    };
  }, []);

  useEffect(() => {
    boardTokensRef.current = boardTokens;
  }, [boardTokens]);

  useEffect(() => {
    boardDraftRef.current = boardDraft;
  }, [boardDraft]);

  useEffect(() => {
    labPositionsRef.current = { own: copyPoints(ownPositions), opponent: copyPoints(opponentPositions) };
  }, [ownPositions, opponentPositions]);

  const chooseIntent = (key: IntentKey) => {
    stopLabPlayback();
    setIntent(key);
    setPrompt(intentPlans[key].prompt);
    setPhase(0);
    setLabPositions(tacticResult.phases[0].positions, defenseFrames(opponentDefense)[0]);
    setGenerationNote(`已切换为「${intentPlans[key].label}」，等待生成适配方案`);
    setSimulated(false);
  };

  const runGeneration = () => {
    setIsGenerating(true);
    setSimulated(false);
    window.setTimeout(() => {
      const result = generateTactic({ level: gameLevel, defense: opponentDefense, objective: `${quickPlan.label} ${prompt}`, tolerance: riskPreference, team: ownTeamData.name, roster: aggregateRosterCapabilities(players) });
      setTacticResult(result);
      setIsGenerating(false);
      setPhase(0);
      setLabPositions(result.phases[0].positions, defenseFrames(opponentDefense)[0]);
      setGenerationNote(`本地规则已命中「${result.template.name}」；结果是训练决策建议，不保证比赛效果。`);
    }, 420);
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

  const togglePlay = async () => {
    if (isPlaying) {
      stopLabPlayback();
      return;
    }
    const run = labRunId.current + 1;
    labRunId.current = run;
    setIsPlaying(true);
    const startPhase = phase === 2 ? 0 : phase;
    for (let index = startPhase; index < 3; index++) {
      if (labRunId.current !== run) return;
      await animateLabPhase(index, index === startPhase ? 420 : 900);
      if (labRunId.current !== run) return;
    }
    if (labRunId.current === run) setIsPlaying(false);
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

  const setLiveBoardTokens = (tokens: BoardToken[]) => {
    boardTokensRef.current = tokens;
    setBoardTokens(tokens);
  };

  const animateBoardTo = (target: BoardToken[], duration = 900) => new Promise<void>(resolve => {
    if (boardAnimationRef.current) cancelAnimationFrame(boardAnimationRef.current);
    const start = cloneBoardTokens(boardTokensRef.current);
    const targetById = new Map(target.map(token => [token.id, token]));
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const next = start.map(token => {
        const destination = targetById.get(token.id) || token;
        return { ...token, x: token.x + (destination.x - token.x) * eased, y: token.y + (destination.y - token.y) * eased };
      });
      setLiveBoardTokens(next);
      if (progress < 1) {
        boardAnimationRef.current = requestAnimationFrame(tick);
      } else {
        boardAnimationRef.current = null;
        setLiveBoardTokens(cloneBoardTokens(target));
        resolve();
      }
    };
    boardAnimationRef.current = requestAnimationFrame(tick);
  });

  const stopBoardPlayback = () => {
    boardRunId.current += 1;
    if (boardAnimationRef.current) cancelAnimationFrame(boardAnimationRef.current);
    boardAnimationRef.current = null;
    setBoardPlaying(false);
  };

  const playBoardSequence = async () => {
    if (boardPlaying) {
      stopBoardPlayback();
      return;
    }
    const run = boardRunId.current + 1;
    boardRunId.current = run;
    setBoardPlaying(true);
    for (let index = 0; index < boardFrames.length; index++) {
      if (boardRunId.current !== run) return;
      setBoardPhase(index);
      await animateBoardTo(boardFrames[index], index === 0 ? 520 : 1050);
      if (boardRunId.current !== run) return;
    }
    if (boardRunId.current === run) setBoardPlaying(false);
  };

  const selectBoardPhase = (index: number) => {
    stopBoardPlayback();
    setBoardPhase(index);
    void animateBoardTo(boardFrames[index], 620);
  };

  const boardCoordinates = (clientX: number, clientY: number) => {
    const rect = boardStageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const screenX = Math.max(2, Math.min(98, (clientX - rect.left) / rect.width * 100));
    const screenY = Math.max(2, Math.min(98, (clientY - rect.top) / rect.height * 100));
    return boardOrientation === "vertical"
      ? [screenX, screenY] as BoardPoint
      : [screenY, 100 - screenX] as BoardPoint;
  };

  const boardTokenStyle = (token: BoardToken) => boardOrientation === "vertical"
    ? { left: `${token.x}%`, top: `${token.y}%` }
    : { left: `${100 - token.y}%`, top: `${token.x}%` };

  const moveBoardToken = (id: string, point: BoardPoint) => {
    const next = boardTokensRef.current.map(token => token.id === id ? { ...token, x: point[0], y: point[1] } : token);
    setLiveBoardTokens(next);
  };

  const beginBoardTokenDrag = (event: ReactPointerEvent<HTMLButtonElement>, id: string, origin: "court" | "tray") => {
    event.stopPropagation();
    stopBoardPlayback();
    setBoardTool("move");
    event.currentTarget.setPointerCapture(event.pointerId);
    boardDragging.current = { id, origin };
  };

  const dragBoardToken = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const activeDrag = boardDragging.current;
    if (!activeDrag) return;
    const rect = boardStageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) return;
    const point = boardCoordinates(event.clientX, event.clientY);
    if (point) {
      setBoardOnCourtIds(current => current.has(activeDrag.id) ? current : new Set([...current, activeDrag.id]));
      moveBoardToken(activeDrag.id, point);
    }
  };

  const endBoardTokenDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const activeDrag = boardDragging.current;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    boardDragging.current = null;
    const rect = boardStageRef.current?.getBoundingClientRect();
    const inside = Boolean(rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
    if (activeDrag && !inside) setBoardOnCourtIds(current => {
      const next = new Set(current);
      next.delete(activeDrag.id);
      return next;
    });
    const snapshot = cloneBoardTokens(boardTokensRef.current);
    setBoardFrames(current => current.map((frame, index) => index === boardPhase ? snapshot : frame));
  };

  const beginBoardDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (boardTool === "move") return;
    const point = boardCoordinates(event.clientX, event.clientY);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingId.current += 1;
    const draft: BoardDrawing = { id: `drawing-${drawingId.current}`, kind: boardTool, points: [point, point] };
    boardDraftRef.current = draft;
    setBoardDraft(draft);
  };

  const updateBoardDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = boardDraftRef.current;
    if (!current) return;
    const point = boardCoordinates(event.clientX, event.clientY);
    if (!point) return;
    const points = current.kind === "pen" ? [...current.points, point] : [current.points[0], point];
    const next = { ...current, points };
    boardDraftRef.current = next;
    setBoardDraft(next);
  };

  const endBoardDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = boardDraftRef.current;
    if (!current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setBoardDrawings(drawings => [...drawings, current]);
    boardDraftRef.current = null;
    setBoardDraft(null);
  };

  const addTeam = () => {
    if (teams.length >= 10) return;
    setShowAddTeam(true);
  };

  const saveTeam = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (teams.length >= 10) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("teamName") || "新建球队").trim();
    const short = String(form.get("teamShort") || name.slice(0, 4) || "新队").trim();
    const group = String(form.get("teamGroup") || "待设置").trim();
    const newTeam: Team = { id: `team-${crypto.randomUUID()}`, name, short, group, level: "待评估", pace: "待设置", players: 0, accent: "gray" };
    setTeams(current => [...current, newTeam]);
    setOwnTeam(newTeam.id);
    setShowAddTeam(false);
    setView("teams");
  };

  const addPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPlayer: Player = {
      id: `player-${crypto.randomUUID()}`,
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

  const saveTeamSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setTeams(current => current.map(team => team.id === ownTeam ? {
      ...team,
      name: String(form.get("name") || team.name), short: String(form.get("short") || team.short),
      group: String(form.get("group") || team.group), level: String(form.get("level") || team.level),
      pace: String(form.get("pace") || team.pace), accent: String(form.get("accent") || team.accent),
    } : team));
    setShowTeamSettings(false);
  };

  const savePlayerSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPlayers(current => current.map(player => player.id === selectedPlayerId ? {
      ...player, name: String(form.get("name") || player.name), number: Number(form.get("number") || player.number),
      position: String(form.get("position") || player.position), level: String(form.get("level") || player.level),
      archetype: String(form.get("archetype") || player.archetype), version: String(form.get("version") || player.version),
      role: String(form.get("role") || player.role),
    } : player));
    setShowPlayerSettings(false);
  };

  const saveGlobalSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCoachName(String(form.get("coachName") || coachName));
    setBoardField(String(form.get("field")) as BoardField);
    setBoardOrientation(String(form.get("orientation")) as BoardOrientation);
    setShowSettings(false);
  };

  const startManualPlay = () => {
    stopBoardPlayback();
    const empty = boardFramesSeed.map(frame => frame.map(token => ({ ...token, x: 50, y: 50 })));
    setBoardFrames(empty);
    setLiveBoardTokens(cloneBoardTokens(empty[0]));
    setBoardOnCourtIds(new Set());
    setBoardDrawings([]);
    setBoardAiDrawings([[], [], []]);
    setBoardTacticResult(null);
    setBoardAiOpen(false);
    setView("board");
  };

  const startAiPlay = () => {
    setBoardAiPrompt("为本队设计一套三阶段半场战术：落位、发起、终结，并优先创造弱侧空位。");
    setBoardAiOpen(true);
    setView("board");
  };

  const generateBoardPlay = () => {
    const result = generateTactic({ level: gameLevel, defense: opponentDefense, objective: boardAiPrompt || "半场进攻，优先创造弱侧空位", tolerance: riskPreference, team: ownTeamData.name, roster: aggregateRosterCapabilities(players) });
    const opponentFrameSet = defenseFrames(opponentDefense);
    const frames = boardFramesSeed.map((frame, phaseIndex) => frame.map(token => {
      const ownIndex = token.team === "a" ? Number(token.id.slice(1)) - 1 : -1;
      const opponentIndex = token.team === "b" ? Number(token.id.slice(1)) - 1 : -1;
      const point = ownIndex >= 0 ? result.phases[phaseIndex].positions[ownIndex] : opponentIndex >= 0 ? opponentFrameSet[phaseIndex][opponentIndex] : result.phases[phaseIndex].positions[0];
      return { ...token, x: point[1], y: point[0] };
    }));
    const generatedRoutes = result.phases.map((item, phaseIndex) => item.routes.map((route, routeIndex): BoardDrawing => ({
      id: `ai-${phaseIndex}-${routeIndex}`,
      kind: route.kind === "move" ? "arrow" : route.kind === "pass" ? "pass" : "pen",
      points: route.points.map(([x, y]) => [y, x] as BoardPoint),
    })));
    setBoardFrames(frames);
    setBoardAiDrawings(generatedRoutes);
    setBoardTacticResult(result);
    setBoardPhase(0);
    setBoardOnCourtIds(new Set(frames[0].map(token => token.id)));
    setLiveBoardTokens(cloneBoardTokens(frames[0]));
    setBoardAiStatus(`命中「${result.template.name}」· 适配 ${result.score}/100 · 阵容 ${result.rosterFit}/100 · 可信度${result.confidenceLabel}`);
  };

  const saveCurrentPlay = () => {
    const title = boardAiPrompt.trim().slice(0, 18) || `自定义战术 ${savedPlays.length + 1}`;
    setSavedPlays(current => [{ id: crypto.randomUUID(), title, subtitle: `${boardField === "half" ? "半场" : "全场"} · ${boardOrientation === "vertical" ? "纵向" : "横向"} · 已保存三阶段`, tag: boardTacticResult?.template.family || "自定义战术", createdAt: "刚刚", frames: boardFrames.map(cloneBoardTokens), aiDrawings: boardAiDrawings.map(items => items.map(item => ({ ...item, points: copyPoints(item.points) }))), tacticResult: boardTacticResult || undefined }, ...current]);
    setBoardAiStatus("当前战术已保存到我的战术库");
  };

  const navItems: { id: View; label: string; detail: string; icon: typeof Activity }[] = [
    { id: "board", label: "战术板", detail: "拖拽 · 绘制 · 播放", icon: TacticsBoard },
    { id: "teams", label: "球队与球员", detail: "画像与阵容", icon: Users },
    { id: "lab", label: "比赛实验室", detail: "AI 对阵推演", icon: BrainCircuit },
    { id: "playbook", label: "我的战术库", detail: "版本与分支", icon: Layers3 },
  ];

  return (
    <div className="product-shell">
      <aside className={mobileNav ? "sidebar is-open" : "sidebar"}>
        <div className="brand" aria-label="乐乐的篮球 AI 战术板">
          <span className="brand-mark">乐</span>
          <div><b>乐乐篮球战术板</b><small>KEVIN · 篮球战术工作台</small></div>
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
          <span className="avatar">乐</span>
          <div><b>{coachName}</b><small>乐乐的本地篮球战术室</small></div>
          <span className="profile-live" aria-label="本地工作区在线" />
        </div>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <button className="mobile-menu" aria-label="打开导航" onClick={() => setMobileNav(current => !current)}><Menu size={20} /></button>
          <div className="topbar-title">
            <span>{view === "board" ? "LIVE TACTICS BOARD" : view === "lab" ? "GAMEPLAN LAB" : view === "teams" ? "TEAM INTELLIGENCE" : "PLAYBOOK"}</span>
            <b>{view === "board" ? "战术板" : view === "lab" ? "比赛实验室" : view === "teams" ? "球队与球员" : "我的战术库"}</b>
          </div>
          <div className="topbar-actions">
            {view === "board" ? <span className="pure-board-status"><TacticsBoard size={15} />纯战术板模式</span> : <span className="ai-top-status"><BrainCircuit size={16} /><b>乐乐 AI 助教</b><i />在线</span>}
            <span className="local-mode"><i />LOCAL · 本地模式</span>
            <button aria-label="全局设置" onClick={() => setShowSettings(true)}><Settings size={17} /></button>
          </div>
        </header>

        {view === "board" && (
          <main className="board-page">
            <section className="board-intro">
              <div>
                <span className="eyebrow">KEVIN DUNANLE · PURE TACTICS BOARD</span>
                <h1>乐乐的篮球 AI 战术板</h1>
                <p>这里不做 AI 推演，只专心摆人、画线和讲战术。开场只有 A 队五人；B 队与篮球按需从下方候场区拖入，也能随时拖出球场收回。</p>
              </div>
              <div className="board-match-labels">
                <label><span>A 队</span><input value={homeName} onChange={event => setHomeName(event.target.value)} /></label>
                <b>VS</b>
                <label><span>B 队</span><input value={awayName} onChange={event => setAwayName(event.target.value)} /></label>
              </div>
            </section>

            <div className="board-workbench">
              <aside className="board-tools panel" aria-label="战术板工具">
                <div className="board-tool-head"><span>BOARD TOOLS</span><b>绘制工具</b></div>
                <button className={boardTool === "move" ? "active" : ""} onClick={() => setBoardTool("move")}><SlidersHorizontal size={17} /><span><b>移动</b><small>拖动球员与球</small></span><kbd>V</kbd></button>
                <button className={boardTool === "arrow" ? "active" : ""} onClick={() => setBoardTool("arrow")}><ArrowUpRight size={17} /><span><b>跑位箭头</b><small>按住拖出路线</small></span><kbd>A</kbd></button>
                <button className={boardTool === "pass" ? "active" : ""} onClick={() => setBoardTool("pass")}><ArrowLeftRight size={17} /><span><b>传球线</b><small>虚线传球</small></span><kbd>P</kbd></button>
                <button className={boardTool === "pen" ? "active" : ""} onClick={() => setBoardTool("pen")}><Draw size={17} /><span><b>自由画</b><small>写出临场细节</small></span><kbd>D</kbd></button>
                <div className="board-tool-divider" />
                <button onClick={() => setBoardDrawings(current => current.slice(0, -1))}><RotateCcw size={17} /><span><b>撤销一笔</b><small>保留球员位置</small></span></button>
                <button className="danger" onClick={() => setBoardDrawings([])}><Eraser size={17} /><span><b>清空画线</b><small>重新讲解</small></span></button>
                <div className="board-tool-tip"><i />当前：{boardTool === "move" ? "拖动模式" : boardTool === "arrow" ? "跑位箭头" : boardTool === "pass" ? "传球虚线" : "自由画笔"}</div>
              </aside>

              <section className="board-center">
                <div className="board-court-shell">
                  <div className="board-court-head">
                    <div><span><i />LIVE BOARD</span><b>{boardField === "half" ? "半场" : "全场"} · {boardOrientation === "vertical" ? "纵向" : "横向"}战术板</b></div>
                    <div className="board-court-actions">
                      <button className="orientation-toggle" onClick={() => setBoardField(current => current === "full" ? "half" : "full")}><TacticsBoard size={15} />{boardField === "full" ? "切换半场" : "切换全场"}</button>
                      <button
                        className="orientation-toggle"
                        onClick={() => setBoardOrientation(current => current === "vertical" ? "horizontal" : "vertical")}
                        aria-label={`切换为${boardOrientation === "vertical" ? "横向" : "纵向"}战术板`}
                      ><ArrowLeftRight size={15} />切换为{boardOrientation === "vertical" ? "横向" : "纵向"}</button>
                      <button onClick={saveCurrentPlay}><Check size={15} />保存战术</button>
                      <button onClick={() => { stopBoardPlayback(); setLiveBoardTokens(cloneBoardTokens(boardFrames[boardPhase])); }}><RotateCcw size={15} />复位本段</button>
                    </div>
                  </div>
                  <div
                    className={`vertical-court-stage is-${boardOrientation} is-${boardField} tool-${boardTool}`}
                    ref={boardStageRef}
                    onPointerDown={beginBoardDrawing}
                    onPointerMove={updateBoardDrawing}
                    onPointerUp={endBoardDrawing}
                    onPointerCancel={endBoardDrawing}
                  >
                    <VerticalBoardCanvas drawings={[...boardAiDrawings[boardPhase], ...boardDrawings]} draft={boardDraft} orientation={boardOrientation} field={boardField} />
                    <div className={`court-direction ${boardOrientation === "vertical" ? "top" : "left"}`}>进攻方向 <span>{boardOrientation === "vertical" ? "↑" : "→"}</span></div>
                    {boardTokens.filter(token => boardOnCourtIds.has(token.id)).map(token => token.team === "ball" ? (
                      <button
                        key={token.id}
                        className="board-ball"
                        style={boardTokenStyle(token)}
                        onPointerDown={event => beginBoardTokenDrag(event, token.id, "court")}
                        onPointerMove={dragBoardToken}
                        onPointerUp={endBoardTokenDrag}
                        onPointerCancel={endBoardTokenDrag}
                        aria-label="篮球，可拖动"
                      ><span /></button>
                    ) : (
                      <button
                        key={token.id}
                        className={`board-player team-${token.team}`}
                        style={boardTokenStyle(token)}
                        onPointerDown={event => beginBoardTokenDrag(event, token.id, "court")}
                        onPointerMove={dragBoardToken}
                        onPointerUp={endBoardTokenDrag}
                        onPointerCancel={endBoardTokenDrag}
                        aria-label={`${token.team === "a" ? "A 队" : "B 队"}${token.number}号 ${token.name}，可拖动`}
                      >
                        <b>{token.number}</b><small>{token.name}</small>
                      </button>
                    ))}
                    <span className="board-gesture-note">{boardTool === "move" ? "拖入场内 · 拖出球场即可收回" : "在球场空白处按住并拖动"}</span>
                  </div>
                </div>

                <div className="board-timeline panel">
                  <div className="timeline-controls">
                    <button className="sequence-play" onClick={playBoardSequence}>{boardPlaying ? <Pause size={16} /> : <Play size={16} />}{boardPlaying ? "暂停连动" : "连贯播放"}</button>
                    <div className="phase-buttons">
                      {(boardTacticResult?.phases.map(item => item.name) || ["手动落位", "手动发起", "手动终结"]).map((label, index) => (
                        <button key={`${label}-${index}`} className={boardPhase === index ? "active" : ""} onClick={() => selectBoardPhase(index)}><span>战术 {index + 1}</span><b>{label}</b><i /></button>
                      ))}
                    </div>
                    <span className="smooth-badge"><i />SMOOTH · 连续插值</span>
                  </div>
                  <div className="board-trays">
                    <div className="token-tray team-b-tray"><span><i />B 队候场区 · 场上 {boardTokens.filter(token => token.team === "b" && boardOnCourtIds.has(token.id)).length}/5</span><div>{boardTokens.filter(token => token.team === "b").map(token => <button className={boardOnCourtIds.has(token.id) ? "is-on-court" : ""} aria-label={`拖动 B 队 ${token.number} 号${token.name}`} key={`tray-${token.id}`} onPointerDown={event => beginBoardTokenDrag(event, token.id, "tray")} onPointerMove={dragBoardToken} onPointerUp={endBoardTokenDrag} onPointerCancel={endBoardTokenDrag}><b>{token.number}</b><small>{token.name}</small></button>)}</div></div>
                    <div className="ball-tray"><span>篮球</span><button className={boardOnCourtIds.has("ball") ? "is-on-court" : ""} aria-label="从候场区拖动篮球" onPointerDown={event => beginBoardTokenDrag(event, "ball", "tray")} onPointerMove={dragBoardToken} onPointerUp={endBoardTokenDrag} onPointerCancel={endBoardTokenDrag}><i /></button></div>
                    <div className="token-tray team-a-tray"><span><i />A 队 · 场上 {boardTokens.filter(token => token.team === "a" && boardOnCourtIds.has(token.id)).length}/5</span><div>{boardTokens.filter(token => token.team === "a").map(token => <button className={boardOnCourtIds.has(token.id) ? "is-on-court" : ""} aria-label={`拖动 A 队 ${token.number} 号${token.name}`} key={`tray-${token.id}`} onPointerDown={event => beginBoardTokenDrag(event, token.id, "tray")} onPointerMove={dragBoardToken} onPointerUp={endBoardTokenDrag} onPointerCancel={endBoardTokenDrag}><b>{token.number}</b><small>{token.name}</small></button>)}</div></div>
                  </div>
                </div>
              </section>

              <aside className="board-ai panel">
                <div className="ai-identity"><span><BrainCircuit size={18} /></span><div><small>AI TACTIC BUILDER</small><b>战术生成器</b></div><i /></div>
                {!boardAiOpen ? <button className="ai-apply-button" onClick={() => setBoardAiOpen(true)}><Sparkles size={15} />打开本地生成器<ChevronRight size={15} /></button> : <>
                  <label className="board-ai-input"><span>描述你想要的打法</span><textarea value={boardAiPrompt} onChange={event => setBoardAiPrompt(event.target.value)} placeholder="例如：领先时控制节奏，五外拉开…" /><small>{boardAiPrompt.length} 字</small></label>
                  <label className="compact-select"><span>对手防守</span><select value={opponentDefense} onChange={event => setOpponentDefense(event.target.value as DefenseType)}>{DEFENSE_OPTIONS.map(item => <option key={item}>{item}</option>)}</select></label>
                  <div className="ai-presets"><button onClick={() => setBoardAiPrompt("快速推进，6 秒内完成第一次攻击")}>快速推进</button><button onClick={() => setBoardAiPrompt("领先时五外拉开，控制回合")}>保护领先</button></div>
                  <button className="ai-apply-button" onClick={generateBoardPlay}><Sparkles size={15} />生成三阶段并写入战术板<ChevronRight size={15} /></button>
                  <button className="ai-clear-button" onClick={() => setBoardAiDrawings([[], [], []])}><Eraser size={14} />仅清空 AI 路线</button>
                </>}
                {boardAiStatus && <div className="ai-success"><Check size={14} />{boardAiStatus}</div>}
                <div className="ai-phase-readout"><span>当前三阶段</span><ol>{(boardTacticResult?.phases || []).map((item, index) => <li className={boardPhase === index ? "active" : ""} key={item.name}><b>0{index + 1}</b><p><strong>{item.name}</strong><small>{item.actions.join("；")}</small></p></li>)}</ol></div>
              </aside>
            </div>
          </main>
        )}

        {view === "lab" && (
          <main className="lab-page">
            <section className="matchup-strip">
              <div className="matchup-side">
                <span className="team-role">本队</span>
                <button className={`team-badge ${ownTeamData.accent}`} aria-label="选择本队" onClick={() => setOwnTeam(teams[(teams.findIndex(team => team.id === ownTeam) + 1) % teams.length].id)}>{ownTeamData.short.slice(0, 2)}</button>
                <label>
                  <select value={ownTeam} onChange={event => setOwnTeam(event.target.value)} aria-label="选择本队">{teams.map(team => <option value={team.id} key={team.id}>{team.name}</option>)}</select>
                  <small>{ownTeamData.level} · {ownTeamData.pace}</small>
                </label>
              </div>
              <div className="versus"><ArrowLeftRight size={17} /><span>VS</span></div>
              <div className="matchup-side opponent">
                <span className="team-role">对手</span>
                <button className={`team-badge ${opponentData.accent}`} aria-label="选择对手" onClick={() => setOpponent(teams[(teams.findIndex(team => team.id === opponent) + 1) % teams.length].id)}>{opponentData.short.slice(0, 2)}</button>
                <label>
                  <select value={opponent} onChange={event => setOpponent(event.target.value)} aria-label="选择对手">{teams.map(team => <option value={team.id} key={team.id}>{team.name}</option>)}</select>
                  <small>{opponentData.level} · {opponentData.pace}</small>
                </label>
              </div>
              <div className="game-context">
                <label className="quarter-input"><Clock3 size={14} /><span>第</span><input value={quarter} onChange={event => setQuarter(event.target.value.replace(/\D/g, "").slice(0, 1))} inputMode="numeric" aria-label="比赛节次" /><span>节</span></label>
                <label className="clock-input"><span>剩余</span><input value={gameClock} onChange={event => setGameClock(event.target.value.slice(0, 5))} aria-label="剩余时间" /></label>
                <div className="score-inputs"><input value={homeScore} onChange={event => setHomeScore(event.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" aria-label="本队比分" /><small>:</small><input value={awayScore} onChange={event => setAwayScore(event.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" aria-label="对手比分" /></div>
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
                    <button key={key} className={intent === key ? "selected" : ""} onClick={() => chooseIntent(key)}><b>{intentPlans[key].label}</b><small>{intentPlans[key].playName}</small></button>
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
                  <label><span>比赛级别</span><select value={gameLevel} onChange={event => setGameLevel(event.target.value)}><option>小学</option><option>初中</option><option>高中</option><option>大学</option><option>社区</option><option>半职业</option><option>职业</option></select></label>
                  <label><span>对手防守</span><select value={opponentDefense} onChange={event => setOpponentDefense(event.target.value as DefenseType)}>{DEFENSE_OPTIONS.map(item => <option key={item}>{item}</option>)}</select></label>
                  <label><span>容错偏好</span><select value={riskPreference} onChange={event => setRiskPreference(event.target.value)}><option>稳中求快</option><option>高风险高回报</option><option>简化执行</option></select></label>
                </div>
                <button className="generate-button" onClick={runGeneration} disabled={isGenerating}>
                  {isGenerating ? <><span className="spinner" />正在推演阵容与对位</> : <><Sparkles size={17} />生成适配战术<ChevronRight size={17} /></>}
                </button>
                <button className="simulate-button" onClick={() => setSimulated(true)}><BarChart3 size={16} />验证常见扰动</button>
                <div className="model-note"><Shield size={14} /><span>{generationNote}</span></div>
              </section>

              <section className="court-workspace panel">
                <div className="court-head">
                  <div>
                    <span className="live-dot"><i />AI 横向半场推演</span>
                    <h2>{tacticResult.template.name}</h2>
                    <p>{activePhase.objective}；安全出口：{activePhase.fallback}</p>
                  </div>
                  <div className="court-actions">
                    <button onClick={() => applyLabPhase(0)} aria-label="重置战术"><RotateCcw size={16} /></button>
                    <button className="play-button" onClick={togglePlay}>{isPlaying ? <Pause size={16} /> : <Play size={16} />}{isPlaying ? "暂停" : "播放"}</button>
                  </div>
                </div>

                <div className="court-stage" ref={courtStage}>
                  <CourtCanvas routes={activePhase.routes} />
                  <div className="court-hud"><span>{tacticResult.template.family} · 对 {opponentDefense}</span><b>{tacticResult.score}</b></div>
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

                <div className="phase-explainer"><b>每阶段均包含站位、可执行路线与安全出口</b><span>点击 01 / 02 / 03 查看具体动作；播放会按当前模板连贯切换。</span></div>
                <div className="phase-track" aria-label="战术阶段">
                  {tacticResult.phases.map((item, index) => (
                    <button key={item.name} className={phase === index ? "active" : ""} onClick={() => applyLabPhase(index)}>
                      <span>0{index + 1}</span><b>{item.name}</b><i />
                    </button>
                  ))}
                </div>

                <div className="court-legend">
                  <span><i className="own" />本队</span><span><i className="opp" />对手</span><span><i className="route" />跑位</span><span><i className="pass" />传球</span>
                  <em>选择球员查看个人任务</em>
                </div>
              </section>

              <section className="plan-panel panel">
                <div className="plan-status"><span><Sparkles size={14} />LOCAL DECISION ENGINE</span><b><Check size={13} />模板检索 + 复杂度裁剪</b></div>
                <h2>{tacticResult.template.name}</h2>
                <p className="plan-summary">为 {ownTeamData.short} 针对 {opponentData.short} 的「{opponentDefense}」选择。模板复杂度 {tacticResult.template.complexity}/5；建议需由教练结合临场人员与规则确认，不保证有效。</p>
                <div className="score-row"><div><span>适配分</span><b>{tacticResult.score}<small>/100</small></b></div><div><span>阵容适配</span><b>{tacticResult.rosterFit}<small>/100</small></b></div><div><span>可信度</span><b>{tacticResult.confidenceLabel}<small>{Math.round(tacticResult.confidence * 100)}%</small></b></div></div>
                {tacticResult.capabilityGaps.length > 0 && <div className="capability-gap"><b>能力缺口</b><span>{tacticResult.capabilityGaps.join("；")}</span></div>}
                {simulated && <div className="validation-panel"><div className="validation-title"><Activity size={16} /><div><b>可计算验证结果</b><span>可信度由输入完整度与检查通过率共同计算</span></div></div><div className="validation-list">{tacticResult.validationChecks.map(check => <div key={check.id} className={check.status}><i>{check.status === "pass" ? "PASS" : "WARN"}</i><p><b>{check.label}</b><span>{check.detail}</span></p></div>)}</div><div className="stress-list"><b>防守扰动应对</b>{tacticResult.stressTests.map(test => <p key={test.scenario}><strong>{test.scenario}</strong><span>{test.response}</span></p>)}</div></div>}
                <div className="decision-sections">
                  <details open><summary>为什么推荐</summary><ul>{tacticResult.reasons.map(item => <li key={item}>{item}</li>)}</ul></details>
                  <details open><summary>关键阅读</summary><ol>{tacticResult.reads.map(item => <li key={item}>{item}</li>)}</ol></details>
                  <details><summary>风险与降级</summary><ul>{tacticResult.risks.map(item => <li key={item}>{item}</li>)}</ul><p><b>更简单备选：</b>{tacticResult.alternative}</p></details>
                  <details><summary>生成假设</summary><ul>{tacticResult.assumptions.map(item => <li key={item}>{item}</li>)}</ul></details>
                </div>
                <div className="knowledge-note"><b>知识依据</b><p>本地规则参考 USA Basketball / Jr. NBA 分级原则与 FIBA/WABC 战术结构；不是实时联网 AI。</p><div>{TACTIC_SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div></div>
                <div className="role-heading"><span>当前阶段动作</span><b>{activePhase.name}</b></div>
                <div className="phase-action-list">{activePhase.actions.map((action, index) => <div key={action}><i>{index + 1}</i><span>{action}</span></div>)}</div>
                <div className="selected-read"><span>本阶段安全出口</span><b>{activePhase.fallback}</b></div>
              </section>
            </div>
          </main>
        )}

        {view === "teams" && (
          <main className="teams-page">
            <section className="team-list-panel panel">
              <div className="section-title"><div><span>MY TEAMS</span><h2>我的球队</h2></div><b>{teams.length} / 10</b></div>
              <div className="team-list">
                {teams.map(team => (
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
                <button onClick={() => setShowTeamSettings(true)}><Settings size={16} />球队设置</button>
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
              <div className="profile-top"><span className="profile-number">{selectedPlayer.number}</span><button aria-label="编辑球员设置" onClick={() => setShowPlayerSettings(true)}><SlidersHorizontal size={17} /></button></div>
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
                <button onClick={() => setPlayers(current => current.map(player => player.id === selectedPlayerId ? { ...player, archetype: player.position === "C" ? "约基奇式肘区策应" : "全能攻防模板", version: "AI 重匹配版" } : player))}><Sparkles size={15} />重新匹配打法模板</button>
              </div>
              <div className="profile-tags"><span>{selectedPlayer.role}</span>{selectedPlayer.traits.map(trait => <span key={trait}>{trait}</span>)}</div>
            </aside>
          </main>
        )}

        {view === "playbook" && (
          <main className="playbook-page">
            <div className="playbook-head">
              <div><span>TEAM PLAYBOOK</span><h1>战术库与 AI 分支</h1><p>保存原始战术、针对不同对手的版本，以及每名球员的执行口令。</p></div>
              <div className="playbook-actions"><button onClick={startAiPlay}><Sparkles size={16} />AI 新建战术</button><button onClick={startManualPlay}><Plus size={16} />手动新建战术</button></div>
            </div>
            <div className="playbook-grid">
              {savedPlays.map((item, index) => <button className="play-card" key={item.id} onClick={() => { setBoardFrames(item.frames.map(cloneBoardTokens)); setLiveBoardTokens(cloneBoardTokens(item.frames[0])); setBoardAiDrawings(item.aiDrawings || [[], [], []]); setBoardTacticResult(item.tacticResult || null); setBoardOnCourtIds(new Set(item.frames[0].map(token => token.id))); setView("board"); }}>
                <div className={`mini-court phase-${index % 4}`}><span className="p p1" /><span className="p p2" /><span className="p p3" /><span className="trail" /></div>
                <div className="play-card-copy"><span>{item.tag}</span><h2>{item.title}</h2><p>{item.subtitle}</p><div><b>3 个战术阶段</b><em>{item.createdAt}</em></div></div>
              </button>)}
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

      {showAddTeam && <dialog open className="modal-backdrop"><form className="player-modal compact-modal" onSubmit={saveTeam}>
        <div className="modal-head"><div><span>NEW TEAM</span><h2>添加球队</h2></div><button type="button" onClick={() => setShowAddTeam(false)}><X size={19} /></button></div>
        <div className="form-grid"><label><span>队名</span><input name="teamName" required placeholder="例如：西城飞鹰 U18" /></label><label><span>简称</span><input name="teamShort" required maxLength={6} /></label><label><span>组别</span><input name="teamGroup" placeholder="高中 · 校队" /></label></div>
        <div className="modal-actions"><button type="button" onClick={() => setShowAddTeam(false)}>取消</button><button type="submit"><Check size={16} />保存球队</button></div>
      </form></dialog>}

      {showTeamSettings && <dialog open className="modal-backdrop"><form className="player-modal compact-modal" onSubmit={saveTeamSettings}>
        <div className="modal-head"><div><span>TEAM SETTINGS</span><h2>编辑球队</h2></div><button type="button" onClick={() => setShowTeamSettings(false)}><X size={19} /></button></div>
        <div className="form-grid"><label><span>队名</span><input name="name" defaultValue={ownTeamData.name} /></label><label><span>简称</span><input name="short" defaultValue={ownTeamData.short} /></label><label><span>组别</span><input name="group" defaultValue={ownTeamData.group} /></label><label><span>等级</span><input name="level" defaultValue={ownTeamData.level} /></label><label><span>节奏</span><input name="pace" defaultValue={ownTeamData.pace} /></label><label><span>颜色</span><select name="accent" defaultValue={ownTeamData.accent}><option value="lime">荧光绿</option><option value="orange">橙色</option><option value="blue">蓝色</option><option value="violet">紫色</option><option value="gray">灰色</option></select></label></div>
        <div className="modal-actions"><button type="button" onClick={() => setShowTeamSettings(false)}>取消</button><button type="submit"><Check size={16} />保存修改</button></div>
      </form></dialog>}

      {showPlayerSettings && <dialog open className="modal-backdrop"><form className="player-modal compact-modal" onSubmit={savePlayerSettings}>
        <div className="modal-head"><div><span>PLAYER SETTINGS</span><h2>编辑球员</h2></div><button type="button" onClick={() => setShowPlayerSettings(false)}><X size={19} /></button></div>
        <div className="form-grid"><label><span>姓名</span><input name="name" defaultValue={selectedPlayer.name} /></label><label><span>号码</span><input name="number" type="number" min="0" max="99" defaultValue={selectedPlayer.number} /></label><label><span>位置</span><select name="position" defaultValue={selectedPlayer.position}>{["PG","SG","SF","PF","C","G","F"].map(item => <option key={item}>{item}</option>)}</select></label><label><span>等级</span><input name="level" defaultValue={selectedPlayer.level} /></label><label><span>打法模板</span><input name="archetype" defaultValue={selectedPlayer.archetype} /></label><label><span>模板版本</span><input name="version" defaultValue={selectedPlayer.version} /></label><label><span>球队角色</span><input name="role" defaultValue={selectedPlayer.role} /></label></div>
        <div className="modal-actions"><button type="button" onClick={() => setShowPlayerSettings(false)}>取消</button><button type="submit"><Check size={16} />保存球员</button></div>
      </form></dialog>}

      {showSettings && <dialog open className="modal-backdrop"><form className="player-modal compact-modal" onSubmit={saveGlobalSettings}>
        <div className="modal-head"><div><span>GLOBAL SETTINGS</span><h2>工作台设置</h2></div><button type="button" onClick={() => setShowSettings(false)}><X size={19} /></button></div>
        <div className="form-grid"><label><span>教练显示名</span><input name="coachName" defaultValue={coachName} /></label><label><span>默认场地</span><select name="field" defaultValue={boardField}><option value="half">半场</option><option value="full">全场</option></select></label><label><span>默认方向</span><select name="orientation" defaultValue={boardOrientation}><option value="horizontal">横向</option><option value="vertical">纵向</option></select></label></div>
        <p className="data-api-note"><b>可选数据扩展（本轮未接入）</b>：NBA 数据或 BALLDONTLIE 可补足球员统计画像，但统计相关性不能直接证明某套战术有效。</p>
        <div className="modal-actions"><button type="button" onClick={() => setShowSettings(false)}>取消</button><button type="submit"><Check size={16} />保存并应用</button></div>
      </form></dialog>}

      {showAddPlayer && (
        <dialog open className="modal-backdrop">
          <form className="player-modal" onSubmit={addPlayer}>
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
        </dialog>
      )}
    </div>
  );
}
