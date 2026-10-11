import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Box,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  Eraser,
  FileText,
  Film,
  FolderOpen,
  Globe2,
  Image,
  KeyRound,
  LayoutTemplate,
  Lock,
  LogOut,
  MessageCircle,
  Package,
  Palette,
  Paperclip,
  Plus,
  ReceiptText,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Upload,
  User,
  Users,
  Wallet,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

import {
  applyRecharge,
  applySpend,
  coinPackages,
  commercePolicy,
  coinsPerDollar,
  createExportCharge,
  createGenerationCharge,
  defaultAccount,
  defaultWallet,
  formatCoins,
  getToolCharge,
  imageModel,
  packageCoins,
  productionReadinessItems,
  serverApiEndpoints,
  soraCoinsPerSecond,
  summarizeWallet,
  tokensForCoins,
  tokensPerCoin,
  videoModel,
} from "./lib/commerce.js";
import "./styles.css";

const markets = {
  US: {
    label: "United States",
    audience: "Shopify, Amazon, Meta Ads",
    directive: "Fast claims, clear proof, seasonal promos",
  },
  Europe: {
    label: "Europe",
    audience: "DTC, retail partners, marketplaces",
    directive: "Localized tone, clean compliance, premium catalog systems",
  },
  Japan: {
    label: "Japan",
    audience: "Rakuten, storefront, LINE campaigns",
    directive: "Compact copy, refined detail pages, trust-first presentation",
  },
};

const navItems = [
  { key: "Command", label: "Command", icon: Activity },
  { key: "Tools", label: "AI Tools", icon: WandSparkles },
  { key: "Templates", label: "Templates", icon: LayoutTemplate },
  { key: "Projects", label: "Projects", icon: FolderOpen },
  { key: "Insights", label: "Insights", icon: BarChart3 },
];

const quickTasks = [
  {
    title: "Launch product kit",
    note: "GPT-image listings, A+ blocks, hero banners",
    icon: Package,
    prompt: "Create a full product-launch kit using GPT-image for listing visuals, a marketplace detail page, and three social ad variations.",
  },
  {
    title: "Localize campaign",
    note: "Rewrite visuals for US, EU, and Japan",
    icon: Globe2,
    prompt: "Adapt this product campaign for US, European, and Japanese merchants with localized tone and channel-ready layouts.",
  },
  {
    title: "Build social ads",
    note: "GPT-image statics, Sora short video script",
    icon: MessageCircle,
    prompt: "Turn this product into a social ad pack with GPT-image feed and carousel visuals plus Sora short video creative directions.",
  },
  {
    title: "Polish brand system",
    note: "Palette, type, packaging, storefront assets",
    icon: Palette,
    prompt: "Create a premium brand system for an ecommerce merchant, including GPT-image packaging, storefront, and campaign asset directions.",
  },
];

const tools = [
  {
    title: "Product Kit",
    group: "Commerce",
    icon: Package,
    model: imageModel,
    description: "Generate listing images, carousel modules, comparison tiles, and purchase-proof visuals with GPT-image.",
    outputs: ["8 GPT-image listing images", "3 GPT-image comparison panels", "1 GPT-image storefront hero"],
  },
  {
    title: "A+ Page Builder",
    group: "Marketplace",
    icon: FileText,
    model: imageModel,
    description: "Assemble GPT-image-ready marketplace detail pages with benefit blocks and localized proof copy.",
    outputs: ["GPT-image hero module", "Benefit strip", "Specs grid"],
  },
  {
    title: "Social Ad Lab",
    group: "Growth",
    icon: MessageCircle,
    model: `${imageModel} + ${videoModel}`,
    description: "Create GPT-image static ads and Sora video concepts for Meta, TikTok, Pinterest, LINE, and creator seeding.",
    outputs: ["GPT-image feed ad", "GPT-image story ad", "Sora UGC video brief"],
  },
  {
    title: "Video Sprint",
    group: "Motion",
    icon: Film,
    model: videoModel,
    description: "Plan Sora short product videos with hook, shot list, caption logic, and export ratios.",
    outputs: ["Sora 15s concept", "Shot list", "Caption set"],
  },
  {
    title: "Smart Cutout",
    group: "Production",
    icon: Search,
    model: imageModel,
    description: "Use GPT-image for clean product cutouts, edge repair, and transparent campaign assets.",
    outputs: ["GPT-image PNG cutout", "Shadow pass", "Edge cleanup"],
  },
  {
    title: "AI Eraser",
    group: "Production",
    icon: Eraser,
    model: imageModel,
    description: "Use GPT-image to remove unwanted scene objects and regenerate clean lifestyle backgrounds.",
    outputs: ["GPT-image clean scene", "Before/after", "Retouch notes"],
  },
  {
    title: "Brand Translator",
    group: "Localization",
    icon: Globe2,
    model: imageModel,
    description: "Translate GPT-image creative direction between US, European, and Japanese buyer expectations.",
    outputs: ["GPT-image tone map", "Copy variants", "Market notes"],
  },
  {
    title: "Batch Export",
    group: "Operations",
    icon: Download,
    model: `${imageModel} / ${videoModel}`,
    description: "Prepare GPT-image and Sora outputs with channel-specific dimensions and asset names.",
    outputs: ["Export queue", "Naming map", "Channel sizes"],
  },
];

const categories = [
  "All",
  "Amazon A+",
  "Social Ads",
  "Shopify",
  "Brand System",
  "Japan Launch",
  "Retail",
  "Seasonal",
];

const templateCards = [
  { title: "Clean Beauty Launch", market: "US DTC", height: "large", index: 0, tags: ["All", "Shopify", "Brand System"] },
  { title: "European Fashion Billboard", market: "EU Fashion", height: "large", index: 1, tags: ["All", "Social Ads", "Retail"] },
  { title: "Coffee Storefront Set", market: "Local Retail", height: "medium", index: 2, tags: ["All", "Brand System", "Retail"] },
  { title: "Warehouse Proof Stack", market: "Amazon Seller", height: "medium", index: 3, tags: ["All", "Amazon A+"] },
  { title: "Holiday Home Promo", market: "Seasonal", height: "large", index: 4, tags: ["All", "Seasonal", "Shopify"] },
  { title: "Travel Charger Hero", market: "Electronics", height: "medium", index: 5, tags: ["All", "Amazon A+", "Shopify"] },
  { title: "Tote Brand Mockup", market: "EU Lifestyle", height: "small", index: 6, tags: ["All", "Brand System"] },
  { title: "Outdoor Bottle Details", market: "A+ Content", height: "large", index: 7, tags: ["All", "Amazon A+"] },
  { title: "Apparel Try-on Scene", market: "Japan Store", height: "medium", index: 8, tags: ["All", "Japan Launch", "Social Ads"] },
  { title: "Summer Social Drop", market: "Creator Ads", height: "small", index: 9, tags: ["All", "Social Ads"] },
  { title: "Stationery Flatlay", market: "Japan Launch", height: "medium", index: 10, tags: ["All", "Japan Launch", "Brand System"] },
  { title: "Boutique Storefront", market: "EU Retail", height: "small", index: 11, tags: ["All", "Retail"] },
  { title: "Serum Detail Poster", market: "Beauty", height: "large", index: 12, tags: ["All", "Amazon A+", "Shopify"] },
  { title: "Outdoor Gear Ad", market: "DTC", height: "medium", index: 13, tags: ["All", "Social Ads"] },
  { title: "Accessories Bundle", market: "Shopify", height: "small", index: 14, tags: ["All", "Shopify"] },
  { title: "Food Delivery Brand", market: "Local Service", height: "medium", index: 15, tags: ["All", "Brand System", "Retail"] },
  { title: "Cosmetics Campaign", market: "EU Beauty", height: "small", index: 16, tags: ["All", "Social Ads"] },
  { title: "Home Goods Catalog", market: "Marketplace", height: "medium", index: 17, tags: ["All", "Shopify", "Retail"] },
  { title: "Kitchen Appliance Hero", market: "Amazon", height: "small", index: 18, tags: ["All", "Amazon A+"] },
  { title: "Luxury Gift Promo", market: "Holiday", height: "medium", index: 19, tags: ["All", "Seasonal"] },
];

const notifications = [
  "Japan Launch template pack finished exporting.",
  "EU compliance copy suggestions are ready for review.",
  "Product Kit has 3 new marketplace size presets.",
];

const defaultProjects = [
  {
    id: "skincare-us",
    name: "Clean Skincare Launch",
    market: "US",
    status: "In production",
    updated: "Today",
    channels: ["Shopify", "Amazon A+", "Meta Ads"],
  },
  {
    id: "fashion-eu",
    name: "European Fashion Drop",
    market: "Europe",
    status: "Review",
    updated: "Yesterday",
    channels: ["Retail", "Pinterest", "Storefront"],
  },
  {
    id: "home-jp",
    name: "Japan Home Goods Campaign",
    market: "Japan",
    status: "Draft",
    updated: "Sep 30",
    channels: ["Rakuten", "LINE", "Storefront"],
  },
];

const defaultJobs = [
  {
    id: "job-sample-1",
    title: "US marketplace listing set",
    status: "Ready for review",
    market: "US",
    created: "Today",
    outputs: ["GPT-image listing hero", "GPT-image benefit strip", "GPT-image comparison tile"],
  },
];

function readStoredValue(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStoredValue(key, fallback));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage is a progressive enhancement for the prototype.
    }
  }, [key, value]);

  return [value, setValue];
}

function normalizeOutputLabel(output) {
  if (output.includes(imageModel) || output.includes(videoModel)) return output;
  if (/video|short|script|sequence|storyboard/i.test(output)) return `${videoModel} ${output}`;
  return `${imageModel} ${output}`;
}

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        <path className="mark-beam" d="M29 10h20L39 30H18z" />
        <path className="mark-ember" d="M14 18h13l-8 16H8z" />
        <path className="mark-anvil" d="M18 33h33L40 47H11z" />
        <path className="mark-base" d="M21 48h25l-5 7H26z" />
      </svg>
    </span>
  );
}

function AppButton({ children, className = "", ...props }) {
  return (
    <button className={`app-button ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

function Panel({ panel, onClose, onAction }) {
  if (!panel) return null;

  const Icon = panel.icon || Sparkles;

  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <aside
        aria-label={panel.title}
        className="detail-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="panel-header">
          <span className="panel-icon">
            <Icon size={22} />
          </span>
          <div>
            <p>{panel.label}</p>
            <h2>{panel.title}</h2>
          </div>
          <button aria-label="Close panel" className="icon-button" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </div>
        <div className="panel-body">{panel.content}</div>
        <div className="panel-actions">
          {panel.primary ? (
            <AppButton className="primary" onClick={() => onAction(panel.primary)}>
              {panel.primary}
            </AppButton>
          ) : null}
          <AppButton onClick={onClose}>Close</AppButton>
        </div>
      </aside>
    </div>
  );
}

function TemplateCard({ card, onOpen }) {
  return (
    <button className={`template-card ${card.height}`} onClick={() => onOpen(card)} type="button">
      <img alt="" src={`/assets/templates/template-${String(card.index).padStart(2, "0")}.png`} />
      <span className="template-badge">{card.market}</span>
      <span className="template-caption">
        <strong>{card.title}</strong>
        <small>{card.tags.filter((tag) => tag !== "All").slice(0, 2).join(" / ")}</small>
      </span>
    </button>
  );
}

function ProjectCard({ project, onOpen }) {
  return (
    <button className="project-card" onClick={() => onOpen(project)} type="button">
      <span className="project-market">{project.market}</span>
      <strong>{project.name}</strong>
      <small>{project.channels.join(" / ")}</small>
      <span className="project-footer">
        <span>{project.status}</span>
        <span>{project.updated}</span>
      </span>
    </button>
  );
}

function WorkspaceView({
  activeModule,
  generated,
  jobs,
  projects,
  selectedMarket,
  onCreateProject,
  onOpenJob,
  onOpenProject,
}) {
  const marketCounts = projects.reduce(
    (counts, project) => ({ ...counts, [project.market]: (counts[project.market] || 0) + 1 }),
    {},
  );

  if (activeModule === "Projects") {
    return (
      <section className="module-surface" aria-label="Projects workspace">
        <div className="section-heading compact">
          <span>Projects</span>
          <h2>Merchant launch workspace</h2>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} onOpen={onOpenProject} project={project} />
          ))}
          <button className="project-card new-project" onClick={onCreateProject} type="button">
            <Plus size={22} />
            <strong>Create from current brief</strong>
            <small>Save the active market, prompt, and outputs as a reusable launch project.</small>
          </button>
        </div>
      </section>
    );
  }

  if (activeModule === "Insights") {
    return (
      <section className="module-surface" aria-label="Insights workspace">
        <div className="section-heading compact">
          <span>Insights</span>
          <h2>Market readiness dashboard</h2>
        </div>
        <div className="metric-grid">
          <article>
            <strong>{projects.length}</strong>
            <span>Active projects</span>
          </article>
          <article>
            <strong>{jobs.length}</strong>
            <span>Generation jobs</span>
          </article>
          <article>
            <strong>{generated.length || 3}</strong>
            <span>Draft outputs</span>
          </article>
          <article>
            <strong>{selectedMarket}</strong>
            <span>Current market</span>
          </article>
        </div>
        <div className="market-mix">
          {Object.keys(markets).map((market) => (
            <span key={market}>
              <strong>{market}</strong>
              <em style={{ width: `${Math.max(18, (marketCounts[market] || 0) * 30)}%` }} />
              <small>{marketCounts[market] || 0} projects</small>
            </span>
          ))}
        </div>
      </section>
    );
  }

  if (activeModule === "Templates") {
    return (
      <section className="module-surface" aria-label="Template planning workspace">
        <div className="section-heading compact">
          <span>Templates</span>
          <h2>Template operations</h2>
        </div>
        <div className="job-list">
          <button onClick={onCreateProject} type="button">
            <LayoutTemplate size={18} />
            Convert selected template direction into a saved launch project
          </button>
          <button onClick={() => onOpenJob(defaultJobs[0])} type="button">
            <Download size={18} />
            Review export presets for marketplace, storefront, and social formats
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="module-surface" aria-label="Command workspace">
      <div className="section-heading compact">
        <span>{activeModule === "Tools" ? "AI Tools" : "Command"}</span>
        <h2>{activeModule === "Tools" ? "Tool queue" : "Persistent launch state"}</h2>
      </div>
      <div className="job-list">
        {jobs.map((job) => (
          <button key={job.id} onClick={() => onOpenJob(job)} type="button">
            <Sparkles size={18} />
            <span>
              <strong>{job.title}</strong>
              <small>{job.status} · {job.market} · {job.created}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function App() {
  const [activeModule, setActiveModule] = useStoredState("marketforge.activeModule", "Command");
  const [activeCategory, setActiveCategory] = useStoredState("marketforge.activeCategory", "All");
  const [selectedMarket, setSelectedMarket] = useStoredState("marketforge.market", "US");
  const [prompt, setPrompt] = useStoredState("marketforge.prompt", "Launch a premium skincare product across Shopify, Amazon A+, and social ads.");
  const [assets, setAssets] = useStoredState("marketforge.assets", ["hero-packaging.png", "ingredient-shot.jpg"]);
  const [generated, setGenerated] = useStoredState("marketforge.generated", []);
  const [projects, setProjects] = useStoredState("marketforge.projects", defaultProjects);
  const [jobs, setJobs] = useStoredState("marketforge.jobs", defaultJobs);
  const [account, setAccount] = useStoredState("marketforge.account", defaultAccount);
  const [wallet, setWallet] = useStoredState("marketforge.wallet", defaultWallet);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useStoredState("marketforge.toast", "Third round started: projects, jobs, and launch state now persist locally.");

  const visibleCards = useMemo(() => {
    return templateCards.filter((card) => card.tags.includes(activeCategory));
  }, [activeCategory]);

  const selectedMarketInfo = markets[selectedMarket];
  const readiness = Math.min(96, 62 + assets.length * 4 + (generated.length || 3) * 3 + jobs.length * 2);
  const boardOutputs = jobs[0]?.outputs?.length
    ? jobs[0].outputs.map(normalizeOutputLabel)
    : (generated.length ? generated : [`${imageModel} US marketplace image set`, `${imageModel} storefront hero`, `${videoModel} social video direction`])
      .map(normalizeOutputLabel);
  const walletSummary = summarizeWallet(wallet);

  function flash(message) {
    setToast(message);
  }

  function spendCoins(charge) {
    if (!account.signedIn) {
      openAccountCenter("signin", "access");
      flash("Sign in before using generation tools.");
      return false;
    }

    const spend = applySpend(wallet, charge);
    if (!spend.ok) {
      openBillingCenter("recharge", "packages", spend.charge);
      flash(`Add coins to run ${charge.label}.`);
      return false;
    }

    setWallet(spend.wallet);
    flash(`${spend.charge.label} used ${formatCoins(spend.charge.coins)}.`);
    return true;
  }

  function purchaseCoins(pack) {
    const recharge = applyRecharge(wallet, pack);
    setWallet(recharge.wallet);
    flash(`Added ${formatCoins(recharge.coins)} to ${account.workspace}.`);
    setPanel({
      icon: Coins,
      label: "Recharge complete",
      title: `${formatCoins(recharge.wallet.coins)} available`,
      primary: "Close receipt",
      content: (
        <div className="profile-card">
          <strong>{pack.label} package added</strong>
          <span>${pack.dollars} converted into {recharge.coins} coins.</span>
          <span>Token allowance added: {tokensForCoins(recharge.coins).toLocaleString()} billable tokens.</span>
          <span>Rate: $1 = {coinsPerDollar} coins.</span>
        </div>
      ),
    });
  }

  function updateAccount(nextFields) {
    setAccount((currentAccount) => ({ ...currentAccount, ...nextFields }));
  }

  function openTool(tool) {
    setPanel({
      icon: tool.icon,
      label: tool.group,
      title: tool.title,
      primary: `Run ${tool.title}`,
      content: (
        <>
          <p className="panel-copy">{tool.description}</p>
          <div className="output-list">
            <span>
              <BadgeCheck size={16} />
              Model: {tool.model}
            </span>
            {tool.outputs.map((output) => (
              <span key={output}>
                <CheckCircle2 size={16} />
                {output}
              </span>
            ))}
          </div>
        </>
      ),
    });
  }

  function openTemplate(card) {
    setPanel({
      icon: LayoutTemplate,
      label: card.market,
      title: card.title,
      primary: "Use template",
      content: (
        <>
          <img
            alt=""
            className="panel-preview"
            src={`/assets/templates/template-${String(card.index).padStart(2, "0")}.png`}
          />
          <p className="panel-copy">
            A channel-ready starting point for {card.tags.filter((tag) => tag !== "All").join(", ")} campaigns.
          </p>
          <div className="output-list">
            <span><CheckCircle2 size={16} />Editable hero layout</span>
            <span><CheckCircle2 size={16} />GPT-image visual prompts</span>
            <span><CheckCircle2 size={16} />Sora video prompt outline</span>
          </div>
        </>
      ),
    });
  }

  function openModule(item) {
    setActiveModule(item.key);
    flash(`${item.label} workspace opened.`);
  }

  function openAccountCenter(section = "profile", leaf = "overview") {
    const tabs = [
      { key: "profile", label: "Profile", icon: User },
      { key: "team", label: "Team", icon: Users },
      { key: "security", label: "Security", icon: Lock },
      { key: "api", label: "API", icon: KeyRound },
    ];
    const leafs = {
      profile: ["overview", "region", "preferences"],
      team: ["members", "roles", "invites"],
      security: ["access", "sessions", "audit"],
      api: ["keys", "webhooks", "limits"],
      signin: ["access"],
    };

    setPanel({
      icon: User,
      label: account.signedIn ? account.plan : "Signed out",
      title: account.signedIn ? account.workspace : "Sign in required",
      primary: account.signedIn ? "Save profile" : "Sign in demo account",
      content: (
        <>
          <div className="account-shell">
            <div className="menu-row" aria-label="Account sections">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    className={section === tab.key ? "active" : ""}
                    key={tab.key}
                    onClick={() => openAccountCenter(tab.key, leafs[tab.key][0])}
                    type="button"
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="sub-menu" aria-label="Account details">
              {(leafs[section] || leafs.profile).map((item) => (
                <button
                  className={leaf === item ? "active" : ""}
                  key={item}
                  onClick={() => openAccountCenter(section, item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            {section === "profile" ? (
              <div className="profile-card">
                <strong>{account.name}</strong>
                <span>{account.email}</span>
                <span>{account.role}</span>
                <span>Region: {account.region}</span>
                <span>Detail: {leaf}</span>
              </div>
            ) : null}

            {section === "team" ? (
              <div className="settings-grid">
                <article>
                  <strong>3 seats</strong>
                  <span>Creative lead, brand manager, marketplace ops</span>
                </article>
                <article>
                  <strong>Role controls</strong>
                  <span>Editors can generate; reviewers can comment and export.</span>
                </article>
                <button onClick={() => flash("Team invite prepared for review.")} type="button">
                  <Plus size={16} />
                  Invite teammate
                </button>
              </div>
            ) : null}

            {section === "security" ? (
              <div className="settings-grid">
                <article>
                  <strong>Session policy</strong>
                  <span>Require re-authentication before purchases and API key changes.</span>
                </article>
                <article>
                  <strong>Audit detail</strong>
                  <span>Generation, recharge, export, and team changes are logged.</span>
                </article>
                <button
                  onClick={() => {
                    updateAccount({ signedIn: false });
                    setPanel(null);
                    flash("Signed out of the demo account.");
                  }}
                  type="button"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            ) : null}

            {section === "api" ? (
              <div className="settings-grid">
                <article>
                  <strong>{account.apiKeyStatus}</strong>
                  <span>Generation API routes image requests to {imageModel} and video requests to {videoModel}.</span>
                </article>
                <article>
                  <strong>Webhook queue</strong>
                  <span>Recharge, spend, export, and failed generation events are ready to wire to a backend.</span>
                </article>
                <button onClick={() => flash("Demo API key rotated.")} type="button">
                  <KeyRound size={16} />
                  Rotate API key
                </button>
                {productionReadinessItems.map((item) => (
                  <article key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.status}: {item.detail}</span>
                  </article>
                ))}
                <div className="output-list compact-list">
                  {serverApiEndpoints.map((endpoint) => (
                    <span key={endpoint.path}>
                      <BadgeCheck size={16} />
                      {endpoint.method} {endpoint.path} · {endpoint.purpose}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {!account.signedIn ? (
              <div className="settings-grid">
                <article>
                  <strong>Demo sign-in</strong>
                  <span>Restores access to saved projects, wallet balance, and generation tools.</span>
                </article>
                <button
                  onClick={() => {
                    updateAccount({ signedIn: true });
                    flash("Signed in to the demo merchant account.");
                    openAccountCenter("profile", "overview");
                  }}
                  type="button"
                >
                  <User size={16} />
                  Sign in demo account
                </button>
              </div>
            ) : null}
          </div>
        </>
      ),
    });
  }

  function openBillingCenter(section = "recharge", leaf = "packages", pendingCharge = null) {
    const tabs = [
      { key: "recharge", label: "Recharge", icon: CreditCard },
      { key: "usage", label: "Usage", icon: ReceiptText },
      { key: "pricing", label: "Pricing", icon: DollarSign },
    ];
    const leafs = {
      recharge: ["packages", "checkout"],
      usage: ["ledger", "limits"],
      pricing: ["coin rule", "model costs", "safeguards"],
    };

    setPanel({
      icon: Wallet,
      label: "$1 = 20 coins",
      title: `${formatCoins(wallet.coins)} available`,
      primary: "Buy $1 pack",
      content: (
        <>
          <div className="wallet-summary">
            <span>
              <strong>{walletSummary.availableCoins}</strong>
              available coins
            </span>
            <span>
              <strong>{walletSummary.spentCoins}</strong>
              spent coins
            </span>
            <span>
              <strong>{walletSummary.trackedTokens.toLocaleString()}</strong>
              tracked tokens
            </span>
            <span>
              <strong>{walletSummary.estimatedRemainingTokens.toLocaleString()}</strong>
              est. remaining tokens
            </span>
          </div>

          {pendingCharge ? (
            <div className="billing-alert">
              <strong>{pendingCharge.label}</strong>
              <span>Needs {formatCoins(pendingCharge.coins)}. Add coins to continue.</span>
            </div>
          ) : null}

          <div className="menu-row" aria-label="Billing sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  className={section === tab.key ? "active" : ""}
                  key={tab.key}
                  onClick={() => openBillingCenter(tab.key, leafs[tab.key][0])}
                  type="button"
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="sub-menu" aria-label="Billing details">
            {leafs[section].map((item) => (
              <button
                className={leaf === item ? "active" : ""}
                key={item}
                onClick={() => openBillingCenter(section, item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          {section === "recharge" ? (
            <div className="coin-package-grid">
              {coinPackages.map((pack) => (
                <button className="coin-package" key={pack.dollars} onClick={() => purchaseCoins(pack)} type="button">
                  <span>{pack.label}</span>
                  <strong>${pack.dollars}</strong>
                  <small>{packageCoins(pack)} coins{pack.bonus ? `, ${pack.bonus} bonus` : ""}</small>
                </button>
              ))}
            </div>
          ) : null}

          {section === "usage" ? (
            <div className="ledger-list">
              {wallet.ledger.map((entry) => (
                <span className={entry.type} key={entry.id}>
                  <strong>{entry.type === "credit" ? "+" : "-"}{entry.coins} coins</strong>
                  <small>{entry.label} · {entry.model} · {entry.created}</small>
                </span>
              ))}
            </div>
          ) : null}

          {section === "pricing" ? (
            <div className="settings-grid">
              <article>
                <strong>1 coin = {tokensPerCoin} billable tokens</strong>
                <span>$1 buys 20 coins, so each coin sells for $0.05.</span>
              </article>
              <article>
                <strong>Policy {commercePolicy.version}</strong>
                <span>Pricing rules are centralized so checkout, ledger, and generation estimates share the same values.</span>
              </article>
              <article>
                <strong>{imageModel}</strong>
                <span>Image actions spend coins from token estimates, using a conservative margin buffer.</span>
              </article>
              <article>
                <strong>{videoModel}</strong>
                <span>Sora is priced per second, so this prototype charges {soraCoinsPerSecond} coins per second.</span>
              </article>
            </div>
          ) : null}
        </>
      ),
    });
  }

  function returnToCommandCenter(event) {
    event.preventDefault();
    setActiveModule("Command");
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    flash("Returned to command center.");
  }

  function runGenerate() {
    const copy = prompt.trim() || "Create an international merchant launch kit.";
    const charge = createGenerationCharge();
    if (!spendCoins(charge)) return;
    const results = [
      `${imageModel} ${selectedMarket} marketplace image set`,
      `${imageModel} ${selectedMarket} storefront hero`,
      `${videoModel} ${selectedMarket} short video sequence`,
    ];
    const job = {
      id: `job-${Date.now()}`,
      title: `${selectedMarket} launch kit generation`,
      status: "Ready for review",
      market: selectedMarket,
      created: "Just now",
      outputs: results,
    };
    setGenerated(results);
    setJobs((currentJobs) => [job, ...currentJobs]);
    flash(`Generated GPT-image and Sora draft outputs for ${markets[selectedMarket].label}.`);
    setPanel({
      icon: Sparkles,
      label: "Generation complete",
      title: "Launch drafts are ready",
      primary: "Export draft pack",
      content: (
        <>
          <p className="panel-copy">{copy}</p>
          <div className="output-list">
            <span><Coins size={16} />Cost: {formatCoins(charge.coins)}</span>
            <span><BadgeCheck size={16} />Image model: {imageModel}</span>
            <span><BadgeCheck size={16} />Video model: {videoModel}</span>
            {results.map((result) => (
              <span key={result}><CheckCircle2 size={16} />{result}</span>
            ))}
          </div>
        </>
      ),
    });
  }

  function createProjectFromBrief() {
    const project = {
      id: `project-${Date.now()}`,
      name: `${selectedMarketInfo.label} Launch Kit`,
      market: selectedMarket,
      status: generated.length ? "Review" : "Draft",
      updated: "Just now",
      channels: ["Marketplace", "Storefront", "Social"],
    };
    setProjects((currentProjects) => [project, ...currentProjects]);
    setActiveModule("Projects");
    flash(`${project.name} saved to Projects.`);
  }

  function openProject(project) {
    setPanel({
      icon: FolderOpen,
      label: project.market,
      title: project.name,
      primary: "Open project",
      content: (
        <>
          <p className="panel-copy">Saved launch project with a persistent brief, market target, and export channels.</p>
          <div className="output-list">
            <span><Activity size={16} />{project.status}</span>
            <span><Clock3 size={16} />Updated {project.updated}</span>
            <span><Download size={16} />{project.channels.join(", ")}</span>
          </div>
        </>
      ),
    });
  }

  function openJob(job) {
    setPanel({
      icon: Sparkles,
      label: job.market,
      title: job.title,
      primary: "Export draft pack",
      content: (
        <>
          <p className="panel-copy">{job.status} · {job.created}</p>
          <div className="output-list">
            {job.outputs.map(normalizeOutputLabel).map((output) => (
              <span key={output}><CheckCircle2 size={16} />{output}</span>
            ))}
          </div>
        </>
      ),
    });
  }

  function openExportChecklist() {
    setPanel({
      icon: Download,
      label: "Export checklist",
      title: "Draft pack export",
      primary: "Export draft pack",
      content: (
        <>
          <p className="panel-copy">Prepare the current GPT-image and Sora outputs for marketplace, storefront, and social teams.</p>
          <div className="output-list">
            <span><CheckCircle2 size={16} />Confirm GPT-image asset names</span>
            <span><CheckCircle2 size={16} />Confirm Sora video prompt notes</span>
            <span><CheckCircle2 size={16} />Apply channel sizes and export naming</span>
            <span><CheckCircle2 size={16} />Send draft pack to review</span>
          </div>
        </>
      ),
    });
  }

  function openUpload() {
    setPanel({
      icon: Upload,
      label: "Source assets",
      title: "Upload product references",
      primary: "Add demo references",
      content: (
        <>
          <div className="dropzone">
            <Upload size={25} />
            <strong>Drop product shots, packaging, brand files, or campaign references</strong>
            <small>This prototype simulates uploads without sending files anywhere.</small>
          </div>
          <div className="output-list">
            {assets.map((asset) => (
              <span key={asset}><Paperclip size={16} />{asset}</span>
            ))}
          </div>
        </>
      ),
    });
  }

  function handlePanelAction(action) {
    if (action === "Add demo references") {
      const nextAssets = ["hero-packaging.png", "ingredient-shot.jpg", "storefront-reference.pdf", "ugc-shotlist.mov"];
      setAssets(nextAssets);
      flash("Added 2 demo references to the launch brief.");
      setPanel({
        icon: Upload,
        label: "Source assets",
        title: "Upload product references",
        primary: "Add demo references",
        content: (
          <>
            <div className="dropzone">
              <Upload size={25} />
              <strong>Demo references added</strong>
              <small>The launch brief now has packaging, storefront, and video context.</small>
            </div>
            <div className="output-list">
              {nextAssets.map((asset) => (
                <span key={asset}><Paperclip size={16} />{asset}</span>
              ))}
            </div>
          </>
        ),
      });
      return;
    }
    if (action === "Use template") {
      setPrompt(`Use this template direction to create a localized launch kit with ${imageModel} product images, ${videoModel} video directions, social ads, and storefront modules.`);
      flash("Template direction added to the launch brief.");
      setPanel(null);
      return;
    }
    if (action?.startsWith("Run ")) {
      const toolTitle = action.replace("Run ", "");
      const tool = tools.find((candidate) => candidate.title === toolTitle);
      const charge = getToolCharge(toolTitle);
      if (!spendCoins(charge)) return;
      const modelOutput = toolTitle === "Video Sprint"
        ? `${videoModel} short video concept`
        : toolTitle === "Social Ad Lab"
          ? `${imageModel} static ad set + ${videoModel} video concept`
          : `${imageModel} visual output`;
      const outputs = tool?.outputs || [modelOutput, "Localized copy set", "Export checklist"];
      const job = {
        id: `job-${Date.now()}`,
        title: `${toolTitle} run`,
        status: "Ready for review",
        market: selectedMarket,
        created: "Just now",
        outputs,
      };
      setGenerated(outputs);
      setJobs((currentJobs) => [job, ...currentJobs]);
      flash(`${toolTitle} completed with ${toolTitle === "Video Sprint" ? videoModel : imageModel} outputs.`);
      setPanel({
        icon: tool?.icon || Sparkles,
        label: "Run complete",
        title: `${toolTitle} outputs are ready`,
        primary: "Export draft pack",
        content: (
          <>
            <p className="panel-copy">The tool run is saved to the launch board and ready for export review.</p>
            <div className="output-list">
              <span><Coins size={16} />Cost: {formatCoins(charge.coins)}</span>
              <span><BadgeCheck size={16} />Model: {tool?.model || imageModel}</span>
              {outputs.map((output) => (
                <span key={output}><CheckCircle2 size={16} />{normalizeOutputLabel(output)}</span>
              ))}
            </div>
          </>
        ),
      });
      return;
    }
    if (action === "Export draft pack") {
      if (!spendCoins(createExportCharge())) return;
      flash("Draft pack queued for export.");
      setPanel(null);
      return;
    }
    if (action === "Buy $1 pack") {
      purchaseCoins(coinPackages[0]);
      return;
    }
    if (action === "Sign in demo account") {
      updateAccount({ signedIn: true });
      flash("Signed in to the demo merchant account.");
      setPanel(null);
      return;
    }
    const actionMessages = {
      "Mark all as reviewed": "Notifications marked as reviewed.",
      "Manage profile": "Profile settings opened.",
      "Save profile": "Account profile saved.",
      "View plans": "Plan options opened for review.",
      "Attach selected": "Selected launch assets attached.",
      "Open project": "Project opened in the launch workspace.",
      "Open notes": "Notes opened for this section.",
      "Close receipt": "Recharge receipt closed.",
    };
    if (actionMessages[action]) {
      flash(actionMessages[action]);
      setPanel(null);
      return;
    }
    flash(`${action} opened.`);
  }

  function openStaticPanel(type) {
    const panels = {
      notifications: {
        icon: Bell,
        label: "Updates",
        title: "Notification Center",
        primary: "Mark all as reviewed",
        content: (
          <div className="output-list">
            {notifications.map((note) => (
              <span key={note}><Bell size={16} />{note}</span>
            ))}
          </div>
        ),
      },
      account: {
        icon: User,
        label: "Account",
        title: "Merchant workspace",
        primary: "Manage profile",
        content: (
          <div className="profile-card">
            <strong>MarketForge Pro</strong>
            <span>3 markets active</span>
            <span>14 exports this month</span>
            <span>Team role: Creative lead</span>
          </div>
        ),
      },
      credits: {
        icon: Zap,
        label: "Credits",
        title: "Trial credit balance",
        primary: "View plans",
        content: (
          <div className="profile-card">
            <strong>$1 trial credit active</strong>
            <span>Good for sample generations and exports.</span>
            <span>Upgrade paths can be connected to billing later.</span>
          </div>
        ),
      },
      assets: {
        icon: Paperclip,
        label: "Library",
        title: "Attached launch assets",
        primary: "Attach selected",
        content: (
          <div className="output-list">
            {assets.map((asset) => (
              <span key={asset}><Paperclip size={16} />{asset}</span>
            ))}
          </div>
        ),
      },
    };
    setPanel(panels[type]);
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" onClick={returnToCommandCenter}>
          <LogoMark />
          <span>
            <strong>MarketForge OS</strong>
            <small>Merchant creative command</small>
          </span>
        </a>
        <nav aria-label="Primary navigation" className="topnav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeModule === item.key ? "active" : ""}
                key={item.key}
                onClick={() => openModule(item)}
                type="button"
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="account-actions">
          <AppButton className="credit" onClick={() => openBillingCenter("recharge", "packages")}>
            <Coins size={15} /> {wallet.coins} coins
          </AppButton>
          <button aria-label="Notifications" className="icon-button" onClick={() => openStaticPanel("notifications")} type="button">
            <Bell size={18} />
          </button>
          <button aria-label="Account" className="icon-button" onClick={() => openAccountCenter("profile", "overview")} type="button">
            <User size={18} />
          </button>
        </div>
      </header>

      <main className="page" id="top">
        <section className="hero-grid" aria-label="Campaign command center">
          <div className="hero-copy">
            <p className="eyebrow">Built for US, European, and Japanese merchants</p>
            <h1>Turn product references into launch-ready commerce campaigns.</h1>
            <p>
              MarketForge OS coordinates GPT-image product visuals, Sora video concepts,
              localized copy, marketplace detail pages, and social ad variants from one focused launch brief.
            </p>
            <div className="market-row" aria-label="Market selector">
              {Object.keys(markets).map((market) => (
                <button
                  className={selectedMarket === market ? "selected" : ""}
                  key={market}
                  onClick={() => {
                    setSelectedMarket(market);
                    flash(`${markets[market].label} market guidance loaded.`);
                  }}
                  type="button"
                >
                  {market}
                </button>
              ))}
            </div>
          </div>

          <section className="launch-console" aria-label="Launch brief">
            <div className="console-header">
              <div>
                <span>Active brief</span>
                <strong>{selectedMarketInfo.label} launch kit</strong>
              </div>
              <span className="status-pill">
                <ShieldCheck size={15} /> Ready
              </span>
            </div>
            <textarea
              aria-label="Launch brief"
              onChange={(event) => setPrompt(event.target.value)}
              value={prompt}
            />
            <div className="brief-meta">
              <span><Globe2 size={15} />{selectedMarketInfo.audience}</span>
              <span><Sparkles size={15} />{selectedMarketInfo.directive}</span>
            </div>
            <div className="console-actions">
              <AppButton onClick={openUpload}><Upload size={16} /> Upload</AppButton>
              <AppButton onClick={() => openStaticPanel("assets")}><Paperclip size={16} /> Assets</AppButton>
              <AppButton onClick={createProjectFromBrief}><FolderOpen size={16} /> Save</AppButton>
              <AppButton className="primary" onClick={runGenerate}><Send size={16} /> Generate</AppButton>
            </div>
            <div className="channel-strip" aria-label="Prepared channel outputs">
              <span><ShoppingBag size={15} />Marketplace</span>
              <span><Image size={15} />GPT-image</span>
              <span><Film size={15} />Sora video</span>
            </div>
          </section>

          <aside className="insight-card" aria-label="Launch status">
            <div className="score-ring" data-score={readiness} style={{ "--score": `${readiness}%` }}>{readiness}</div>
            <div>
              <span>Launch readiness</span>
              <strong>{activeModule}</strong>
              <p>{toast}</p>
            </div>
            <div className="mini-list">
              <span><CheckCircle2 size={15} />{assets.length} references attached</span>
              <span><Clock3 size={15} />12 min estimated production</span>
              <span><Coins size={15} />{wallet.coins} coins available</span>
              <span><BadgeCheck size={15} />{imageModel} + {videoModel} pipeline</span>
              <span><BadgeCheck size={15} />{jobs.length} persistent jobs</span>
            </div>
          </aside>
        </section>

        <section className="quick-section" aria-label="Launch shortcuts">
          {quickTasks.map((task) => {
            const Icon = task.icon;
            return (
              <button
                className="quick-task"
                key={task.title}
                onClick={() => {
                  setPrompt(task.prompt);
                  flash(`${task.title} loaded into the brief.`);
                }}
                type="button"
              >
                <Icon size={22} />
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.note}</small>
                </span>
              </button>
            );
          })}
        </section>

        <WorkspaceView
          activeModule={activeModule}
          generated={generated}
          jobs={jobs}
          onCreateProject={createProjectFromBrief}
          onOpenJob={openJob}
          onOpenProject={openProject}
          projects={projects}
          selectedMarket={selectedMarket}
        />

        <section className="workspace-grid" aria-label="AI tools and outputs">
          <div className="section-heading">
            <span>Workflow tools</span>
            <h2>Choose a production lane</h2>
          </div>
          <div className="tool-grid">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button className="tool-card" key={tool.title} onClick={() => openTool(tool)} type="button">
                  <span className="tool-icon"><Icon size={21} /></span>
                  <span className="tool-group">{tool.group}</span>
                  <strong>{tool.title}</strong>
                  <small>{tool.description}</small>
                  <em className="model-chip">{tool.model}</em>
                </button>
              );
            })}
          </div>
          <aside className="output-board">
            <div className="section-heading compact">
              <span>Draft outputs</span>
              <h2>Launch board</h2>
            </div>
            {boardOutputs.map((item, index) => (
              <button
                className="output-row"
                key={item}
                onClick={() => jobs[0] ? openJob(jobs[0]) : flash(`${item} selected for review.`)}
                type="button"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
                <ChevronDown size={16} />
              </button>
            ))}
            <AppButton className="wide" onClick={openExportChecklist}>
              <Download size={16} /> Open export checklist
            </AppButton>
          </aside>
        </section>

        <section className="template-section" aria-label="Template marketplace">
          <div className="section-heading">
            <span>Template atlas</span>
            <h2>Original campaign starters</h2>
          </div>
          <div className="category-row" aria-label="Template categories">
            {categories.map((category) => (
              <button
                className={activeCategory === category ? "active" : ""}
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  flash(`${category} templates are now showing.`);
                }}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="template-grid">
            {visibleCards.map((card) => (
              <TemplateCard card={card} key={card.title} onOpen={openTemplate} />
            ))}
          </div>
        </section>

        <footer className="site-footer">
          <div className="footer-brand">
            <LogoMark />
            <div>
              <strong>MarketForge OS</strong>
              <p>International merchant creative operations, prototyped locally.</p>
            </div>
          </div>
          {["Security", "Docs", "Partners", "Roadmap"].map((link) => (
            <button
              key={link}
              onClick={() => {
                setPanel({
                  icon: Settings,
                  label: "Footer",
                  title: link,
                  primary: "Open notes",
                  content: <p className="panel-copy">{link} content is represented as a connected prototype panel.</p>,
                });
              }}
              type="button"
            >
              {link}
            </button>
          ))}
        </footer>
      </main>

      <Panel panel={panel} onAction={handlePanelAction} onClose={() => setPanel(null)} />
    </div>
  );
}
