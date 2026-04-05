// 創業成功清單系統 - 資料定義與內容
// Types
export interface ChecklistResource {
  title: string;
  description: string;
  url?: string;
  type: 'article' | 'video' | 'tool' | 'template' | 'book';
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  resources: ChecklistResource[];
  tools: string[];
  tips: string;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  items: ChecklistItem[];
}

export interface DayTask {
  day: number;
  title: string;
  description: string;
  categoryId: string;
  itemIds: string[];
  milestone?: string;
}

export interface WeekPlan {
  week: number;
  theme: string;
  days: DayTask[];
}

// =============================================
// 十大模組清單資料
// =============================================

export const checklistCategories: ChecklistCategory[] = [
  // ---- 模組 1：創業心態與自我評估 ----
  {
    id: 'mindset',
    title: '創業心態與自我評估',
    icon: 'Brain',
    description: '確認創業動機、盤點個人能力、評估風險承受度，為創業打下堅實心理基礎',
    color: 'text-purple-400',
    items: [
      {
        id: 'mindset-1',
        title: '確認創業動機與願景',
        description: '深入思考為什麼要創業？你想解決什麼問題？你的長期願景是什麼？寫下你的創業使命宣言。',
        resources: [
          { title: '《從0到1》Peter Thiel', description: '理解如何創造全新價值，而非複製現有模式', type: 'book' },
          { title: '黃金圈理論 - 找到你的Why', description: 'Simon Sinek 的 Start With Why 理論，幫助你找到創業的核心動機', type: 'article' },
          { title: '願景板製作指南', description: '用視覺化方式呈現你的創業願景與目標', type: 'template' },
        ],
        tools: ['Canva 願景板', 'Miro 心智圖', 'Notion 筆記'],
        tips: '花至少一週時間深入思考，不要急於行動。與家人和信任的朋友討論你的想法，聽取不同觀點。',
      },
      {
        id: 'mindset-2',
        title: '個人能力與經驗盤點',
        description: '列出你的專業技能、產業經驗、人脈資源和獨特優勢，找出需要補強的領域。',
        resources: [
          { title: 'SWOT 個人分析模板', description: '系統化分析自身的優勢、劣勢、機會與威脅', type: 'template' },
          { title: '創業者能力評估量表', description: '從領導力、財務、行銷等面向評估自己的創業準備度', type: 'tool' },
          { title: '《刻意練習》', description: '了解如何有系統地補強弱項技能', type: 'book' },
        ],
        tools: ['Notion 自我評估模板', 'MindMeister 心智圖', 'StrengthsFinder 測評'],
        tips: '誠實面對自己的不足，找到互補的合夥人比什麼都自己來更重要。',
      },
      {
        id: 'mindset-3',
        title: '風險承受度評估',
        description: '評估你在財務、時間、心理上能承受的最大風險，設定止損點。',
        resources: [
          { title: '創業財務風險評估指南', description: '計算你的財務跑道和最壞情況下的退場方案', type: 'article' },
          { title: '風險評估矩陣模板', description: '用機率和影響度來量化各種創業風險', type: 'template' },
        ],
        tools: ['Google Sheets 風險試算表', 'Excel 財務模型'],
        tips: '準備至少6-12個月的個人生活費作為緩衝，不要把所有雞蛋放在一個籃子裡。',
      },
      {
        id: 'mindset-4',
        title: '家庭與時間資源規劃',
        description: '與家人溝通創業計畫，規劃時間分配，確保工作與生活的基本平衡。',
        resources: [
          { title: '創業者時間管理術', description: '如何在有限時間內最大化創業產出', type: 'article' },
          { title: '家庭支持系統建立指南', description: '如何獲得家人的理解與支持', type: 'article' },
        ],
        tools: ['Google Calendar', 'Toggl 時間追蹤', 'RescueTime'],
        tips: '創業是馬拉松不是短跑，設定明確的工作時間邊界，避免過勞。',
      },
      {
        id: 'mindset-5',
        title: '設定短中長期目標',
        description: '用 SMART 原則設定 3 個月、1 年、3 年的具體目標，建立可衡量的里程碑。',
        resources: [
          { title: 'SMART 目標設定法', description: '具體、可衡量、可達成、相關性、有時限的目標設定框架', type: 'article' },
          { title: 'OKR 目標管理法', description: '用 Objectives and Key Results 來管理創業目標', type: 'article' },
          { title: '目標規劃模板', description: '現成的目標分解與追蹤模板', type: 'template' },
        ],
        tools: ['Notion OKR 模板', 'Trello 看板', 'Monday.com'],
        tips: '目標要有彈性，每季度回顧並調整。重要的是方向正確，而非計畫完美。',
      },
      {
        id: 'mindset-6',
        title: '尋找創業導師或顧問',
        description: '找到有經驗的創業前輩作為導師，加入創業社群獲取支持與資源。',
        resources: [
          { title: '台灣創業加速器清單', description: 'AppWorks、SparkLabs、台大創創中心等加速器資訊', type: 'article' },
          { title: '如何找到對的創業導師', description: '選擇導師的標準與建立關係的方法', type: 'article' },
        ],
        tools: ['LinkedIn', 'Meetup 創業活動', 'SCORE 導師平台'],
        tips: '好的導師不是告訴你答案，而是問你正確的問題。主動參加創業活動拓展人脈。',
      },
    ],
  },
  // ---- 模組 2：市場調研與商業模式 ----
  {
    id: 'market',
    title: '市場調研與商業模式',
    icon: 'Search',
    description: '深入了解市場機會、競爭格局和目標客群，設計可行的商業模式',
    color: 'text-blue-400',
    items: [
      {
        id: 'market-1',
        title: '目標市場分析與定義',
        description: '明確定義你要進入的市場，了解市場規模、成長率和主要趨勢。',
        resources: [
          { title: '市場分析完整指南', description: '從宏觀到微觀的市場分析方法論', type: 'article' },
          { title: '產業報告取得管道', description: '免費和付費的產業研究報告來源清單', type: 'tool' },
        ],
        tools: ['Google Trends', 'Statista', 'SimilarWeb', '經濟部產業資訊'],
        tips: '不要只看整體市場，要找到你能切入的利基市場 (niche)。',
      },
      {
        id: 'market-2',
        title: '競爭對手研究',
        description: '識別直接和間接競爭者，分析他們的優劣勢、定價策略和市場定位。',
        resources: [
          { title: '競爭分析框架', description: 'Porter 五力分析與競爭者矩陣模板', type: 'template' },
          { title: '《競爭策略》Michael Porter', description: '理解產業競爭的經典著作', type: 'book' },
        ],
        tools: ['SimilarWeb', 'SEMrush', 'Crunchbase', 'App Annie'],
        tips: '研究競爭對手的客戶評價，那裡藏著未被滿足的需求。',
      },
      {
        id: 'market-3',
        title: '目標客群人物誌 (Persona)',
        description: '建立 2-3 個理想客戶的詳細人物誌，包含人口統計、行為模式、痛點和需求。',
        resources: [
          { title: '客戶人物誌製作指南', description: '如何建立精準的目標客戶畫像', type: 'article' },
          { title: 'Persona 模板', description: '現成的客戶人物誌模板', type: 'template' },
        ],
        tools: ['Canva Persona模板', 'Xtensio', 'HubSpot Persona工具'],
        tips: '人物誌要基於真實訪談，而非你想像中的客戶。至少訪談 10-20 位潛在客戶。',
      },
      {
        id: 'market-4',
        title: '市場規模估算 (TAM/SAM/SOM)',
        description: '估算總可獲得市場 (TAM)、可服務市場 (SAM) 和可獲得市場 (SOM)。',
        resources: [
          { title: 'TAM/SAM/SOM 計算方法', description: '由上而下和由下而上的市場規模估算技巧', type: 'article' },
          { title: '市場規模估算試算表', description: '現成的計算模板', type: 'template' },
        ],
        tools: ['Google Sheets', 'Excel', 'Statista'],
        tips: '投資人重視 SOM（你真正能拿到的市場份額），不要過度膨脹 TAM。',
      },
      {
        id: 'market-5',
        title: '商業模式畫布 (Business Model Canvas)',
        description: '使用商業模式畫布梳理你的價值主張、客戶關係、收入來源等九大要素。',
        resources: [
          { title: '《商業模式新生代》', description: 'Alexander Osterwalder 的商業模式設計經典', type: 'book' },
          { title: 'BMC 填寫指南', description: '逐步教你如何填寫商業模式畫布', type: 'article' },
          { title: 'BMC 線上模板', description: '可協作的線上商業模式畫布工具', type: 'template' },
        ],
        tools: ['Strategyzer', 'Canvanizer', 'Miro BMC模板'],
        tips: '商業模式畫布不是填一次就好，隨著市場驗證持續迭代更新。',
      },
      {
        id: 'market-6',
        title: '價值主張設計',
        description: '明確定義你的產品/服務為客戶創造什麼獨特價值，你的差異化優勢是什麼。',
        resources: [
          { title: '價值主張畫布', description: '精確匹配客戶需求與產品價值的設計工具', type: 'template' },
          { title: '獨特銷售主張 (USP) 撰寫指南', description: '如何用一句話說清楚你的核心價值', type: 'article' },
        ],
        tools: ['Strategyzer VP Canvas', 'Miro'],
        tips: '好的價值主張要讓客戶在 5 秒內理解你能為他解決什麼問題。',
      },
      {
        id: 'market-7',
        title: '產業趨勢研究',
        description: '研究產業的技術趨勢、法規變化、消費者行為轉變，預判未來 3-5 年的發展方向。',
        resources: [
          { title: '趨勢研究方法論', description: 'PEST 分析與趨勢掃描技巧', type: 'article' },
          { title: '全球趨勢報告', description: 'McKinsey、Deloitte 等機構的年度趨勢報告', type: 'article' },
        ],
        tools: ['Google Trends', 'CB Insights', 'TrendHunter'],
        tips: '跟著趨勢走，但不要追逐每一個風口。找到與你核心能力契合的趨勢。',
      },
      {
        id: 'market-8',
        title: '驗證市場需求（客戶訪談）',
        description: '透過客戶訪談、問卷調查和落地頁測試，驗證你的商業假設是否成立。',
        resources: [
          { title: '《精實創業》Eric Ries', description: '用最小成本驗證商業假設的方法論', type: 'book' },
          { title: '客戶訪談技巧', description: 'The Mom Test - 如何問出真實需求', type: 'article' },
          { title: '訪談問題模板', description: '客戶發現訪談的問題清單', type: 'template' },
        ],
        tools: ['Google Forms', 'Typeform', 'Calendly', 'Zoom'],
        tips: '不要問客戶「你會不會買？」而要問「你現在怎麼解決這個問題？花了多少錢？」',
      },
    ],
  },
  // ---- 模組 3：公司設立與法律事務 ----
  {
    id: 'legal',
    title: '公司設立與法律事務',
    icon: 'Building2',
    description: '完成公司登記、稅務設定和法律保障，讓你的事業合法合規運營',
    color: 'text-green-400',
    items: [
      {
        id: 'legal-1',
        title: '選擇公司型態',
        description: '了解行號、有限公司、股份有限公司的差異，選擇最適合你的組織型態。',
        resources: [
          { title: '公司型態比較表', description: '行號 vs 有限公司 vs 股份有限公司的稅務、責任、彈性比較', type: 'article' },
          { title: '如何選擇公司型態', description: '根據你的業務需求選擇最佳組織形式', type: 'article' },
        ],
        tools: ['經濟部商業司', '全國商工行政服務入口網'],
        tips: '如果計畫未來募資，建議直接設立股份有限公司。小型個人事業可先從行號開始。',
      },
      {
        id: 'legal-2',
        title: '公司名稱預查與核准',
        description: '擬定 3-5 個公司名稱備選，到經濟部進行名稱預查，確保名稱可用。',
        resources: [
          { title: '公司命名規則說明', description: '了解公司命名的法規限制與注意事項', type: 'article' },
          { title: '商業名稱預查系統', description: '線上查詢公司名稱是否已被使用', type: 'tool' },
        ],
        tools: ['經濟部公司名稱預查', '商標檢索系統'],
        tips: '名稱要好記、好唸、有意義。同時檢查網域名稱和社群帳號是否可用。',
      },
      {
        id: 'legal-3',
        title: '資本額規劃與驗資',
        description: '決定公司資本額，準備驗資證明。了解最低資本額要求和實際營運所需資金。',
        resources: [
          { title: '資本額規劃指南', description: '如何決定適當的公司資本額', type: 'article' },
          { title: '驗資流程說明', description: '銀行驗資的步驟與所需文件', type: 'article' },
        ],
        tools: ['銀行開戶服務', '會計師事務所'],
        tips: '資本額不是越高越好，要根據實際營運需求和稅務考量來決定。',
      },
      {
        id: 'legal-4',
        title: '公司登記（經濟部商業司）',
        description: '準備所有文件，向經濟部辦理公司設立登記，取得公司統一編號。',
        resources: [
          { title: '公司設立登記流程', description: '完整的設立登記步驟與所需文件清單', type: 'article' },
          { title: '線上設立登記系統', description: '經濟部商業司線上申辦系統', type: 'tool' },
        ],
        tools: ['經濟部商業司線上申辦', '公司登記代辦服務'],
        tips: '可以委託會計師代辦，費用約 5,000-15,000 元，省下大量時間和避免錯誤。',
      },
      {
        id: 'legal-5',
        title: '營業登記與統一編號',
        description: '完成國稅局營業登記，取得營業稅籍編號，正式成為營業人。',
        resources: [
          { title: '營業登記申請指南', description: '營業登記的流程與注意事項', type: 'article' },
          { title: '營業稅基礎知識', description: '了解營業稅的計算方式與申報週期', type: 'article' },
        ],
        tools: ['財政部稅務入口網', '電子申報繳稅服務'],
        tips: '營業登記完成後，記得按時申報營業稅（每兩個月一次）。',
      },
      {
        id: 'legal-6',
        title: '營業項目登記',
        description: '選擇正確的營業項目代碼，確保涵蓋你的主要業務和可能的延伸業務。',
        resources: [
          { title: '營業項目代碼表', description: '完整的營業項目代碼查詢', type: 'tool' },
          { title: '如何選擇營業項目', description: '選擇營業項目的策略與常見問題', type: 'article' },
        ],
        tools: ['經濟部營業項目代碼查詢'],
        tips: '建議多登記幾個相關項目，日後變更需要額外手續和費用。最後一項加上ZZ99999全國性事業。',
      },
      {
        id: 'legal-7',
        title: '開立公司銀行帳戶',
        description: '攜帶公司登記文件到銀行開立公司帳戶，將個人財務與公司財務分開。',
        resources: [
          { title: '公司開戶所需文件', description: '各銀行開立公司帳戶所需的文件清單', type: 'article' },
          { title: '選擇企業銀行帳戶指南', description: '比較各銀行的企業戶方案與手續費', type: 'article' },
        ],
        tools: ['各大銀行企業金融服務'],
        tips: '選擇數位金融服務完善的銀行，方便日後線上轉帳和對帳。',
      },
      {
        id: 'legal-8',
        title: '勞健保設立',
        description: '成立投保單位，為自己和員工辦理勞保、健保和勞工退休金。',
        resources: [
          { title: '勞健保設立指南', description: '投保單位成立流程與費率說明', type: 'article' },
          { title: '勞基法基礎知識', description: '雇主必須了解的勞動法規', type: 'article' },
        ],
        tools: ['勞保局 e 化服務', '健保署線上服務', '勞動部勞工法令查詢'],
        tips: '即使只有負責人一人，也需要辦理健保。有僱用員工就必須辦理勞保。',
      },
      {
        id: 'legal-9',
        title: '商標註冊申請',
        description: '將品牌名稱和 Logo 申請商標註冊，保護你的品牌智慧財產權。',
        resources: [
          { title: '商標註冊流程', description: '從檢索到取得商標權的完整流程', type: 'article' },
          { title: '商標檢索系統', description: '智慧財產局商標檢索工具', type: 'tool' },
        ],
        tools: ['智慧財產局商標檢索', 'TIPO 線上申請', 'Namechk'],
        tips: '先做商標檢索確認沒有衝突，審查期約 6-8 個月，盡早申請。',
      },
      {
        id: 'legal-10',
        title: '必要合約範本準備',
        description: '準備合夥協議書、保密協議 (NDA)、勞動契約、服務合約等基本法律文件。',
        resources: [
          { title: '創業必備合約清單', description: '創業初期需要準備的各類合約範本', type: 'article' },
          { title: '合約範本下載', description: '常用商業合約的範本資源', type: 'template' },
        ],
        tools: ['LawDepot 合約範本', '法律諮詢平台'],
        tips: '重要合約一定要請律師審閱，特別是合夥協議和股東協議。這筆錢不能省。',
      },
    ],
  },
  // ---- 模組 4：財務規劃與資金籌措 ----
  {
    id: 'finance',
    title: '財務規劃與資金籌措',
    icon: 'DollarSign',
    description: '建立健全的財務制度，規劃資金來源，確保公司有足夠的財務跑道',
    color: 'text-yellow-400',
    items: [
      {
        id: 'finance-1',
        title: '創業資金需求估算',
        description: '估算創業初期所需的一次性投入和每月固定支出，計算至少 12 個月的資金需求。',
        resources: [
          { title: '創業資金估算模板', description: '完整的開辦費用和營運資金計算表格', type: 'template' },
          { title: '創業成本控制指南', description: '如何在創業初期精打細算', type: 'article' },
        ],
        tools: ['Google Sheets 財務模板', 'Excel', 'LivePlan'],
        tips: '實際花費通常是預估的 1.5-2 倍，務必留足緩衝資金。',
      },
      {
        id: 'finance-2',
        title: '個人財務規劃與準備金',
        description: '確保個人有 6-12 個月生活費的儲備，設定個人薪資計畫。',
        resources: [
          { title: '創業者個人財務規劃', description: '如何在創業期間管理個人財務', type: 'article' },
          { title: '緊急預備金計算器', description: '計算你需要多少緊急預備金', type: 'tool' },
        ],
        tools: ['記帳 App (MoneyForward)', 'Google Sheets'],
        tips: '創業初期可以不領薪水，但要計算清楚個人最低生活開支。',
      },
      {
        id: 'finance-3',
        title: '記帳與會計制度建立',
        description: '選擇記帳方式（自行記帳或委託記帳士），建立帳務管理流程。',
        resources: [
          { title: '小公司記帳入門', description: '創業初期的基礎會計知識', type: 'article' },
          { title: '選擇記帳士/會計師指南', description: '如何選擇適合的會計服務', type: 'article' },
        ],
        tools: ['KPMG Small Business', 'Wave Accounting', 'QuickBooks', '鼎新 A1'],
        tips: '即使規模小也要養成記帳習慣，委託專業記帳士每月費用約 2,000-5,000 元。',
      },
      {
        id: 'finance-4',
        title: '發票申請與開立',
        description: '申請統一發票，了解電子發票和紙本發票的差異，建立開立發票的流程。',
        resources: [
          { title: '統一發票申請流程', description: '如何向國稅局申請使用統一發票', type: 'article' },
          { title: '電子發票導入指南', description: '電子發票的優勢與導入方式', type: 'article' },
        ],
        tools: ['財政部電子發票平台', '關貿網路 e 化服務'],
        tips: '月營業額 20 萬以下可申請免用統一發票，但要開收據。',
      },
      {
        id: 'finance-5',
        title: '稅務規劃（營業稅/營所稅）',
        description: '了解營業稅（5%）和營利事業所得稅的計算方式與申報時程。',
        resources: [
          { title: '新創公司稅務指南', description: '創業者必知的稅務基礎知識', type: 'article' },
          { title: '營所稅申報懶人包', description: '營利事業所得稅的申報流程與節稅技巧', type: 'article' },
        ],
        tools: ['財政部稅務入口網', '電子申報繳稅服務'],
        tips: '善用研發投資抵減等租稅優惠。務必按時申報，逾期會有罰款。',
      },
      {
        id: 'finance-6',
        title: '資金來源規劃',
        description: '評估自有資金、銀行貸款、天使投資、創投等各種資金管道的優缺點。',
        resources: [
          { title: '創業融資全攻略', description: '從種子輪到 A 輪的融資策略', type: 'article' },
          { title: '《創業投資聖經》', description: '了解創投的運作方式和投資邏輯', type: 'book' },
        ],
        tools: ['AngelList', 'Crunchbase', '台灣天使投資協會'],
        tips: '初期盡量用自有資金和營收，過早引入外部資金會稀釋股權。',
      },
      {
        id: 'finance-7',
        title: '政府補助與創業貸款申請',
        description: '了解 SBIR、SIIR、青年創業貸款等政府資源，準備申請文件。',
        resources: [
          { title: '政府創業補助總覽', description: 'SBIR、SIIR、CITD 等補助計畫比較', type: 'article' },
          { title: '青年創業貸款申請指南', description: '青創貸款的資格條件和申請流程', type: 'article' },
          { title: '補助計畫書撰寫技巧', description: '如何寫出成功的補助申請計畫書', type: 'template' },
        ],
        tools: ['中小企業處補助網', '青年創業圓夢網', '中小企業信保基金'],
        tips: '政府補助是「先花錢後補助」，要確保有足夠的周轉金。找有經驗的顧問協助撰寫計畫書。',
      },
      {
        id: 'finance-8',
        title: '財務報表基礎',
        description: '學會看懂損益表、資產負債表和現金流量表，建立財務儀表板。',
        resources: [
          { title: '三大財務報表入門', description: '用白話文解說損益表、資產負債表、現金流量表', type: 'article' },
          { title: '財務報表模板', description: '適合新創公司的財務報表模板', type: 'template' },
          { title: '《財報就像一本故事書》', description: '用故事的方式理解財務報表', type: 'book' },
        ],
        tools: ['Google Sheets 財報模板', 'QuickBooks', 'Xero'],
        tips: '每月至少看一次財務報表，現金流比利潤更重要！很多公司是賺錢但倒閉的。',
      },
    ],
  },
  // ---- 模組 5：品牌建立與行銷策略 ----
  {
    id: 'branding',
    title: '品牌建立與行銷策略',
    icon: 'Palette',
    description: '打造獨特的品牌形象，規劃有效的行銷策略，讓目標客群認識你',
    color: 'text-pink-400',
    items: [
      {
        id: 'branding-1',
        title: '品牌命名與標語設計',
        description: '設計一個好記、有意義且能體現品牌價值的名稱和標語。',
        resources: [
          { title: '品牌命名方法論', description: '7 種品牌命名策略與評估標準', type: 'article' },
          { title: '標語撰寫技巧', description: '如何寫出讓人記住的品牌標語', type: 'article' },
        ],
        tools: ['Namechk 域名檢查', 'Namelix AI命名', 'Shopify 商業名稱產生器'],
        tips: '好名字要好記、好唸、好寫、有意義。同時檢查域名和社群帳號可用性。',
      },
      {
        id: 'branding-2',
        title: 'Logo 與視覺識別系統 (VI)',
        description: '設計品牌 Logo、選定品牌色彩、字體和視覺風格，建立一致的品牌識別。',
        resources: [
          { title: 'VI 設計基礎指南', description: '視覺識別系統的組成要素和設計原則', type: 'article' },
          { title: '色彩心理學', description: '不同顏色傳達的品牌印象和情緒', type: 'article' },
        ],
        tools: ['Canva', 'Adobe Illustrator', 'Figma', 'Looka AI Logo'],
        tips: '初期可以用 AI 工具快速產出，但品牌成長後建議請專業設計師重新設計。',
      },
      {
        id: 'branding-3',
        title: '品牌故事撰寫',
        description: '撰寫引人入勝的品牌故事，包含創辦緣由、品牌理念和願景。',
        resources: [
          { title: '品牌故事撰寫框架', description: '用英雄旅程架構撰寫品牌故事', type: 'template' },
          { title: '《故事的力量》', description: '如何用故事打動人心', type: 'book' },
        ],
        tools: ['Notion', 'Google Docs', 'ChatGPT 輔助撰寫'],
        tips: '好的品牌故事要有衝突、轉折和解決方案，讓客戶成為故事的主角。',
      },
      {
        id: 'branding-4',
        title: '行銷通路規劃',
        description: '評估各行銷通路（線上/線下）的成本效益，選擇最適合的 2-3 個核心通路。',
        resources: [
          { title: '行銷通路選擇指南', description: '各行銷通路的優缺點比較與適用場景', type: 'article' },
          { title: '行銷漏斗設計', description: 'AARRR 海盜指標與行銷漏斗設計', type: 'article' },
        ],
        tools: ['Google Analytics', 'UTM Builder', 'Bitly'],
        tips: '不要一開始就全面撒網，專注做好 1-2 個通路比什麼都做半調子好。',
      },
      {
        id: 'branding-5',
        title: '社群媒體策略',
        description: '選擇適合的社群平台，制定內容策略和發文排程。',
        resources: [
          { title: '社群媒體行銷指南', description: 'FB、IG、LINE、TikTok 等平台的經營策略', type: 'article' },
          { title: '社群內容日曆模板', description: '規劃每月社群發文的模板', type: 'template' },
        ],
        tools: ['Meta Business Suite', 'Hootsuite', 'Buffer', 'Later'],
        tips: '選擇你的目標客群最活躍的平台，質量比數量重要。',
      },
      {
        id: 'branding-6',
        title: '內容行銷計畫',
        description: '規劃部落格、電子報、影片等內容策略，建立品牌的專業形象和自然流量。',
        resources: [
          { title: '內容行銷完整指南', description: '從策略到執行的內容行銷教學', type: 'article' },
          { title: '內容日曆規劃模板', description: '規劃季度內容產出的模板', type: 'template' },
        ],
        tools: ['WordPress', 'Medium', 'Substack', 'ConvertKit'],
        tips: '內容行銷是長期投資，至少要持續 6 個月才能看到效果。先求量再求質。',
      },
      {
        id: 'branding-7',
        title: 'SEO 基礎建置',
        description: '建立網站的 SEO 基礎架構，研究關鍵字，優化網頁內容。',
        resources: [
          { title: 'SEO 入門指南', description: '搜尋引擎優化的基礎知識和實作步驟', type: 'article' },
          { title: '關鍵字研究教學', description: '如何找到高價值的目標關鍵字', type: 'article' },
        ],
        tools: ['Google Search Console', 'Ahrefs', 'Ubersuggest', 'Yoast SEO'],
        tips: 'SEO 需要 3-6 個月才能看到成效，越早開始越好。先做好站內SEO基礎。',
      },
      {
        id: 'branding-8',
        title: '廣告投放策略（Google/Meta）',
        description: '學習數位廣告基礎，設定廣告預算，規劃第一波廣告活動。',
        resources: [
          { title: 'Google Ads 新手指南', description: '從零開始學習 Google 關鍵字廣告', type: 'article' },
          { title: 'Meta 廣告投放教學', description: 'Facebook/Instagram 廣告投放實務', type: 'article' },
        ],
        tools: ['Google Ads', 'Meta Ads Manager', 'Google Analytics 4'],
        tips: '初期先用小預算測試，找到 ROAS > 3 的廣告組合再放大投入。',
      },
    ],
  },
  // ---- 模組 6：產品與服務開發 ----
  {
    id: 'product',
    title: '產品與服務開發',
    icon: 'Lightbulb',
    description: '從構想到上市，用精實方法開發你的產品或服務',
    color: 'text-orange-400',
    items: [
      {
        id: 'product-1',
        title: '最小可行產品 (MVP) 定義',
        description: '定義 MVP 的核心功能，確定最少需要什麼功能來驗證你的價值主張。',
        resources: [
          { title: '《精實創業》Eric Ries', description: 'MVP 概念的經典著作', type: 'book' },
          { title: 'MVP 設計方法', description: '如何用最少資源打造有效的 MVP', type: 'article' },
        ],
        tools: ['Notion 產品規格文件', 'FigJam', 'Miro'],
        tips: 'MVP 不是半成品，而是用最少功能解決核心問題的完整體驗。',
      },
      {
        id: 'product-2',
        title: '產品原型設計',
        description: '製作低成本的產品原型或 Mockup，用來測試概念和收集回饋。',
        resources: [
          { title: '快速原型設計方法', description: '從紙上原型到高保真原型的設計流程', type: 'article' },
          { title: '原型設計工具比較', description: 'Figma vs Sketch vs Adobe XD 比較', type: 'article' },
        ],
        tools: ['Figma', 'Sketch', 'InVision', 'Marvel'],
        tips: '用最低成本驗證想法，紙上原型有時比精美的設計稿更有效。',
      },
      {
        id: 'product-3',
        title: '用戶體驗 (UX) 設計',
        description: '設計直觀的用戶流程和介面，確保產品易用且能解決用戶痛點。',
        resources: [
          { title: 'UX 設計入門', description: '用戶體驗設計的基本原則和方法', type: 'article' },
          { title: '《不要讓我思考》', description: 'Steve Krug 的 Web 可用性經典', type: 'book' },
        ],
        tools: ['Figma', 'Maze 用戶測試', 'Hotjar 熱點圖'],
        tips: '讓 5 個人試用你的原型，你會發現 85% 的可用性問題。',
      },
      {
        id: 'product-4',
        title: '產品開發與測試',
        description: '進行實際的產品開發，建立開發流程和品質管控機制。',
        resources: [
          { title: '敏捷開發入門', description: 'Scrum 和看板方法的基礎介紹', type: 'article' },
          { title: '產品開發清單', description: '從開發到上線的完整檢查清單', type: 'template' },
        ],
        tools: ['Jira', 'Trello', 'GitHub', 'GitLab'],
        tips: '每週都要有可展示的進度。不要等完美了再發布，先發布再迭代。',
      },
      {
        id: 'product-5',
        title: 'Beta 測試與用戶回饋',
        description: '邀請早期用戶參與 Beta 測試，系統性收集和分析用戶回饋。',
        resources: [
          { title: 'Beta 測試規劃指南', description: '如何組織有效的 Beta 測試', type: 'article' },
          { title: '用戶回饋收集方法', description: '定性和定量回饋收集的最佳實踐', type: 'article' },
        ],
        tools: ['Google Forms', 'Typeform', 'UserTesting', 'TestFlight'],
        tips: '找到 10 個願意深度使用並給回饋的 Beta 用戶，比找 100 個淺嚐即止的人更有價值。',
      },
      {
        id: 'product-6',
        title: '產品迭代優化',
        description: '根據 Beta 測試回饋，優先處理最關鍵的問題，進行產品迭代。',
        resources: [
          { title: '產品迭代方法論', description: '如何決定功能優先順序和迭代節奏', type: 'article' },
          { title: 'RICE 評分框架', description: '用影響力、信心、效果和努力程度來排序需求', type: 'template' },
        ],
        tools: ['ProductBoard', 'Notion', 'Linear'],
        tips: '用 80/20 法則決定優先順序，解決 20% 最重要的問題能產生 80% 的影響。',
      },
      {
        id: 'product-7',
        title: '定價策略制定',
        description: '研究競品定價，評估成本結構，制定有競爭力且可獲利的定價策略。',
        resources: [
          { title: '定價策略全攻略', description: '成本加成、價值定價、競爭定價等策略比較', type: 'article' },
          { title: '《定價的藝術》', description: '深入了解消費者對價格的心理反應', type: 'book' },
        ],
        tools: ['Google Sheets 定價模型', 'PriceIntelligently'],
        tips: '不要害怕定高價，低價策略是最難維持的。先測試較高的價格再調降。',
      },
    ],
  },
  // ---- 模組 7：團隊組建與人力資源 ----
  {
    id: 'team',
    title: '團隊組建與人力資源',
    icon: 'Users',
    description: '找到對的人，建立有戰鬥力的團隊，打造正向的企業文化',
    color: 'text-cyan-400',
    items: [
      {
        id: 'team-1',
        title: '組織架構規劃',
        description: '規劃公司的組織架構，確定各部門職能和匯報關係。',
        resources: [
          { title: '新創組織設計指南', description: '從扁平化到功能型組織的選擇', type: 'article' },
          { title: '組織架構圖模板', description: '各類組織架構圖的範例', type: 'template' },
        ],
        tools: ['Lucidchart', 'Miro', 'Canva'],
        tips: '初期保持扁平化，團隊超過 10 人再考慮正式的部門劃分。',
      },
      {
        id: 'team-2',
        title: '職位說明書撰寫',
        description: '為每個需要招募的職位撰寫清晰的工作說明書 (JD)。',
        resources: [
          { title: 'JD 撰寫指南', description: '如何寫出吸引人才的職位說明書', type: 'article' },
          { title: '職位說明書模板', description: '各類職位的 JD 範本', type: 'template' },
        ],
        tools: ['Notion HR 模板', 'Google Docs'],
        tips: '好的 JD 要說明這個職位能學到什麼、對公司的影響力，而不只是列條件。',
      },
      {
        id: 'team-3',
        title: '招募管道建立',
        description: '選擇適合的招募管道，建立雇主品牌，吸引優秀人才。',
        resources: [
          { title: '新創招募策略', description: '如何用有限預算招到好人才', type: 'article' },
          { title: '雇主品牌建立指南', description: '打造有吸引力的雇主品牌', type: 'article' },
        ],
        tools: ['104人力銀行', 'CakeResume', 'LinkedIn', 'Yourator'],
        tips: '新創最好的招募來源是團隊的人脈推薦，推薦獎金是值得的投資。',
      },
      {
        id: 'team-4',
        title: '面試與錄用流程',
        description: '設計結構化的面試流程，包含技能評估、文化契合度和試用期規劃。',
        resources: [
          { title: '結構化面試指南', description: '如何設計公平有效的面試流程', type: 'article' },
          { title: '面試問題庫', description: '各職位的面試問題範例', type: 'template' },
        ],
        tools: ['Notion 面試記錄', 'Calendly 約面試'],
        tips: '招人要慢、開除要快。文化契合度比技能更重要，技能可以培養。',
      },
      {
        id: 'team-5',
        title: '勞動契約與工作規則',
        description: '準備符合勞基法的勞動契約，制定基本工作規則。',
        resources: [
          { title: '勞動契約範本', description: '符合最新勞基法的勞動契約範本', type: 'template' },
          { title: '工作規則制定指南', description: '30人以上企業必須報備的工作規則內容', type: 'article' },
        ],
        tools: ['勞動部勞工法令查詢', '法律諮詢平台'],
        tips: '勞動契約必須包含勞基法規定的必要條款，建議請勞資專家審閱。',
      },
      {
        id: 'team-6',
        title: '薪資福利制度設計',
        description: '設計有競爭力的薪資結構和福利制度，包含股權激勵計畫。',
        resources: [
          { title: '新創薪資設計指南', description: '如何在預算有限時設計有吸引力的薪酬方案', type: 'article' },
          { title: '員工股權激勵 (ESOP) 入門', description: '用股權激勵留住核心人才', type: 'article' },
        ],
        tools: ['薪資調查報告 (104)', 'Google Sheets 薪資結構'],
        tips: '新創可能薪水比不上大公司，但可以用股權、學習機會和彈性工作來吸引人才。',
      },
      {
        id: 'team-7',
        title: '企業文化與團隊建設',
        description: '定義公司核心價值觀，建立團隊溝通機制和文化活動。',
        resources: [
          { title: '打造企業文化指南', description: '如何從零開始建立正向的企業文化', type: 'article' },
          { title: '《什麼才是最難的事》', description: 'Ben Horowitz 談創業團隊管理', type: 'book' },
        ],
        tools: ['Slack', 'Discord', 'Gather Town'],
        tips: '文化不是寫在牆上的標語，而是團隊每天做決策時依循的價值觀。創辦人就是文化的最大影響者。',
      },
    ],
  },
  // ---- 模組 8：數位工具與系統建置 ----
  {
    id: 'digital',
    title: '數位工具與系統建置',
    icon: 'Monitor',
    description: '導入必要的數位工具和系統，提升營運效率和團隊協作',
    color: 'text-indigo-400',
    items: [
      {
        id: 'digital-1',
        title: '公司官方網站建置',
        description: '建立專業的公司網站，包含品牌介紹、產品服務、聯絡方式等基本資訊。',
        resources: [
          { title: '企業網站建置指南', description: '從域名註冊到網站上線的完整流程', type: 'article' },
          { title: '網站架構規劃', description: '企業網站必備頁面和內容規劃', type: 'template' },
        ],
        tools: ['WordPress', 'Wix', 'Squarespace', 'Webflow'],
        tips: '初期用 WordPress 或 Wix 快速建站即可，不需要客製化開發。先上線再優化。',
      },
      {
        id: 'digital-2',
        title: '電子郵件與通訊系統',
        description: '設定公司專屬電子郵件，選擇團隊通訊工具。',
        resources: [
          { title: 'Google Workspace vs Microsoft 365', description: '兩大企業郵件方案的比較', type: 'article' },
          { title: '團隊通訊工具選擇', description: 'Slack、Teams、LINE Works 等工具比較', type: 'article' },
        ],
        tools: ['Google Workspace', 'Microsoft 365', 'Slack', 'LINE Works'],
        tips: '使用公司域名郵箱（如 name@company.com）能大幅提升專業形象。',
      },
      {
        id: 'digital-3',
        title: '雲端儲存與協作工具',
        description: '建立雲端文件管理系統，確保團隊能高效協作。',
        resources: [
          { title: '雲端儲存方案比較', description: 'Google Drive、Dropbox、OneDrive 等方案比較', type: 'article' },
          { title: '文件管理最佳實踐', description: '如何建立清晰的檔案分類和命名規則', type: 'article' },
        ],
        tools: ['Google Drive', 'Notion', 'Dropbox Business', 'Confluence'],
        tips: '從第一天就建立清楚的文件分類規則，避免日後檔案混亂難以查找。',
      },
      {
        id: 'digital-4',
        title: 'CRM 客戶關係管理系統',
        description: '導入 CRM 系統管理客戶資料、銷售管線和客戶互動記錄。',
        resources: [
          { title: 'CRM 選擇指南', description: '不同規模企業適合的 CRM 方案', type: 'article' },
          { title: 'CRM 導入最佳實踐', description: '成功導入 CRM 的步驟和常見陷阱', type: 'article' },
        ],
        tools: ['HubSpot CRM（免費版）', 'Pipedrive', 'Salesforce', 'Zoho CRM'],
        tips: 'HubSpot 免費版對新創來說已經很夠用，等客戶量大了再升級。',
      },
      {
        id: 'digital-5',
        title: '專案管理工具導入',
        description: '選擇適合團隊的專案管理工具，建立工作流程和任務追蹤機制。',
        resources: [
          { title: '專案管理工具比較', description: 'Notion、Trello、Asana、Monday 等工具比較', type: 'article' },
          { title: '敏捷專案管理入門', description: 'Scrum 和看板在小團隊的應用', type: 'article' },
        ],
        tools: ['Notion', 'Trello', 'Asana', 'Linear'],
        tips: '工具不要太複雜，團隊願意用才是最好的工具。',
      },
      {
        id: 'digital-6',
        title: '會計與 ERP 系統',
        description: '選擇適合的會計軟體或 ERP 系統，自動化財務流程。',
        resources: [
          { title: '小企業會計軟體比較', description: '各種會計軟體的功能和價格比較', type: 'article' },
          { title: 'ERP 導入評估', description: '何時需要導入 ERP 以及如何選擇', type: 'article' },
        ],
        tools: ['QuickBooks', 'Xero', '鼎新 A1', 'ECOUNT'],
        tips: '初期用 Excel 或簡單的會計軟體即可，等月營業額超過 50 萬再考慮 ERP。',
      },
      {
        id: 'digital-7',
        title: '電子商務平台（若需要）',
        description: '如果有線上銷售需求，選擇適合的電商平台或建立自有商城。',
        resources: [
          { title: '電商平台比較', description: 'Shopify、WooCommerce、91APP 等平台比較', type: 'article' },
          { title: '電商營運指南', description: '從商品上架到出貨的完整流程', type: 'article' },
        ],
        tools: ['Shopify', 'WooCommerce', '91APP', 'SHOPLINE'],
        tips: '先在蝦皮等現有平台測試市場反應，驗證可行後再建立自有商城。',
      },
      {
        id: 'digital-8',
        title: '資訊安全基礎建置',
        description: '建立基本的資訊安全措施，保護公司和客戶的數據安全。',
        resources: [
          { title: '中小企業資安指南', description: '基礎資安措施和常見威脅防範', type: 'article' },
          { title: '密碼管理最佳實踐', description: '如何建立安全的密碼管理機制', type: 'article' },
        ],
        tools: ['1Password Business', 'Google 2FA', 'Cloudflare', 'NordVPN'],
        tips: '至少做到：全員啟用二步驟驗證、使用密碼管理器、定期備份重要資料。',
      },
    ],
  },
  // ---- 模組 9：客戶開發與銷售 ----
  {
    id: 'sales',
    title: '客戶開發與銷售',
    icon: 'Target',
    description: '建立銷售體系，開發第一批客戶，打造可複製的銷售流程',
    color: 'text-red-400',
    items: [
      {
        id: 'sales-1',
        title: '銷售漏斗設計',
        description: '設計從接觸到成交的完整銷售漏斗，定義每個階段的轉換指標。',
        resources: [
          { title: '銷售漏斗設計指南', description: '從認知到成交的銷售漏斗建立方法', type: 'article' },
          { title: '銷售漏斗模板', description: '各產業的銷售漏斗範例', type: 'template' },
        ],
        tools: ['HubSpot CRM', 'Pipedrive', 'Google Sheets'],
        tips: '追蹤每個階段的轉換率，找出瓶頸並優化。',
      },
      {
        id: 'sales-2',
        title: '客戶開發策略',
        description: '制定主動獲客（Outbound）和被動獲客（Inbound）策略。',
        resources: [
          { title: '客戶開發方法論', description: 'B2B 和 B2C 的客戶開發策略差異', type: 'article' },
          { title: '《跨越鴻溝》', description: 'Geoffrey Moore 的新產品市場擴散理論', type: 'book' },
        ],
        tools: ['LinkedIn Sales Navigator', 'Hunter.io', 'Apollo.io'],
        tips: '先找到 10 個死忠客戶比找到 1000 個普通用戶重要。深耕比廣撒更有效。',
      },
      {
        id: 'sales-3',
        title: '銷售話術與簡報準備',
        description: '準備電梯簡報 (Elevator Pitch)、銷售簡報和常見問題應對話術。',
        resources: [
          { title: 'Pitch Deck 製作指南', description: '如何製作有說服力的銷售簡報', type: 'article' },
          { title: '電梯簡報模板', description: '30 秒、1 分鐘、5 分鐘版本的簡報結構', type: 'template' },
        ],
        tools: ['Canva 簡報', 'Beautiful.ai', 'Google Slides'],
        tips: '練習到可以自然地在 30 秒內清楚說明你做什麼、為誰做、有什麼不同。',
      },
      {
        id: 'sales-4',
        title: '報價與合約流程',
        description: '建立標準化的報價單模板和合約簽訂流程。',
        resources: [
          { title: '報價單模板', description: '專業報價單的格式和必要內容', type: 'template' },
          { title: '商業合約注意事項', description: '簽訂商業合約時的法律注意事項', type: 'article' },
        ],
        tools: ['PandaDoc', 'DocuSign', 'Google Docs 模板'],
        tips: '報價要明確列出範圍和排除項目，避免後續糾紛。',
      },
      {
        id: 'sales-5',
        title: '客戶服務流程建立',
        description: '建立客戶服務標準和流程，包含問題回報、處理和追蹤機制。',
        resources: [
          { title: '客服流程設計指南', description: '建立高效客服體系的步驟', type: 'article' },
          { title: '客服 SOP 模板', description: '常見問題處理的標準作業流程', type: 'template' },
        ],
        tools: ['Intercom', 'Zendesk', 'Freshdesk', 'LINE 官方帳號'],
        tips: '回應速度是客服最重要的指標。設定客服回應時間目標（如 1 小時內）。',
      },
      {
        id: 'sales-6',
        title: '客戶回饋收集機制',
        description: '建立系統化的客戶回饋收集和分析流程，持續改善產品和服務。',
        resources: [
          { title: 'NPS 淨推薦分數指南', description: '如何使用 NPS 衡量客戶滿意度', type: 'article' },
          { title: '客戶回饋收集方法', description: '問卷、訪談、社群聆聽等方法比較', type: 'article' },
        ],
        tools: ['SurveyMonkey', 'Typeform', 'Google Forms', 'Hotjar'],
        tips: '定期（至少每季）進行客戶滿意度調查，並把結果轉化為具體的改善行動。',
      },
      {
        id: 'sales-7',
        title: '客戶留存與復購策略',
        description: '設計客戶留存機制，包含會員制度、定期回訪、交叉銷售等策略。',
        resources: [
          { title: '客戶留存策略指南', description: '提升客戶留存率的實務方法', type: 'article' },
          { title: '會員制度設計', description: '如何設計有效的會員忠誠度計畫', type: 'article' },
        ],
        tools: ['Mailchimp', 'LINE 官方帳號', 'HubSpot'],
        tips: '獲取新客戶的成本是留住舊客戶的 5-7 倍。優先投資客戶留存。',
      },
    ],
  },
  // ---- 模組 10：成長擴展與永續經營 ----
  {
    id: 'growth',
    title: '成長擴展與永續經營',
    icon: 'Rocket',
    description: '建立數據驅動的決策機制，規劃規模化成長和長期永續發展',
    color: 'text-emerald-400',
    items: [
      {
        id: 'growth-1',
        title: '關鍵績效指標 (KPI) 設定',
        description: '為公司各部門設定可衡量的 KPI，建立績效追蹤儀表板。',
        resources: [
          { title: 'KPI 設定指南', description: '如何選擇和設定有意義的 KPI', type: 'article' },
          { title: '新創核心指標', description: 'MRR、CAC、LTV、Churn Rate 等新創關鍵指標解說', type: 'article' },
        ],
        tools: ['Google Analytics', 'Mixpanel', 'Google Sheets 儀表板'],
        tips: '不要追蹤太多指標，聚焦在 3-5 個最能反映業務健康度的核心指標。',
      },
      {
        id: 'growth-2',
        title: '數據分析與決策',
        description: '建立數據收集和分析流程，讓決策有數據支撐。',
        resources: [
          { title: '數據驅動決策指南', description: '如何建立數據文化和分析流程', type: 'article' },
          { title: '數據分析工具入門', description: 'Google Analytics、Mixpanel 等工具的使用教學', type: 'article' },
        ],
        tools: ['Google Analytics 4', 'Tableau', 'Power BI', 'Looker Studio'],
        tips: '數據是為了輔助決策，不是為了製造漂亮的圖表。問對問題比收集數據更重要。',
      },
      {
        id: 'growth-3',
        title: '規模化策略規劃',
        description: '制定從 1 到 100 的規模化成長計畫，識別成長槓桿和瓶頸。',
        resources: [
          { title: '《閃電式擴張》', description: 'Reid Hoffman 的快速規模化策略', type: 'book' },
          { title: '成長飛輪設計', description: '如何設計自我強化的成長飛輪', type: 'article' },
        ],
        tools: ['Miro 策略地圖', 'Notion 規劃文件'],
        tips: '規模化之前先確保產品市場契合 (PMF)。在找到 PMF 之前，不要急著擴張。',
      },
      {
        id: 'growth-4',
        title: '合作夥伴開發',
        description: '識別和建立策略合作夥伴關係，擴大市場覆蓋和資源共享。',
        resources: [
          { title: '策略聯盟建立指南', description: '如何找到並建立互利的合作關係', type: 'article' },
          { title: '合作合約範本', description: '策略合作協議的基本條款', type: 'template' },
        ],
        tools: ['LinkedIn', 'CRM 合作夥伴管理'],
        tips: '好的合作關係是雙贏的。先想你能為對方帶來什麼價值。',
      },
      {
        id: 'growth-5',
        title: '國際化準備',
        description: '評估國際市場機會，準備產品在地化和跨境營運的基礎。',
        resources: [
          { title: '新創國際化指南', description: '從本土到國際的擴張策略', type: 'article' },
          { title: '跨境電商入門', description: '進軍國際市場的電商策略', type: 'article' },
        ],
        tools: ['Stripe 國際支付', 'Shopify Markets', 'TransferWise'],
        tips: '不需要一開始就想全球化，但產品設計要預留多語言和多幣別的彈性。',
      },
      {
        id: 'growth-6',
        title: '企業社會責任 (CSR/ESG)',
        description: '建立企業社會責任意識，規劃 ESG（環境、社會、治理）策略。',
        resources: [
          { title: 'ESG 入門指南', description: '中小企業如何開始實踐 ESG', type: 'article' },
          { title: '社會企業案例', description: '成功結合商業與社會影響力的案例', type: 'article' },
        ],
        tools: ['B Corp 認證', 'ESG 自評工具'],
        tips: 'ESG 不只是大企業的事。從節能減碳、公平雇用等小事開始做起。',
      },
    ],
  },
];

// =============================================
// 365 天創業行動計畫（52 週）
// =============================================

// 輔助函數：生成一週的任務
function week(w: number, theme: string, days: Omit<DayTask, 'day'>[]): WeekPlan {
  return {
    week: w,
    theme,
    days: days.map((d, i) => ({ ...d, day: (w - 1) * 7 + i + 1 })),
  };
}

export const yearPlan: WeekPlan[] = [
  // ======== 第 1 個月：創業心態與自我評估 + 市場調研起步 ========
  week(1, '啟動創業之旅：認識自己', [
    { title: '寫下你的創業初衷', description: '花 30 分鐘寫下你想創業的原因、想解決的問題和你的願景', categoryId: 'mindset', itemIds: ['mindset-1'] },
    { title: '閱讀創業經典', description: '開始閱讀《從0到1》或《精實創業》，每天至少 30 頁', categoryId: 'mindset', itemIds: ['mindset-1'] },
    { title: '製作個人 SWOT 分析', description: '列出你的優勢、劣勢、機會和威脅', categoryId: 'mindset', itemIds: ['mindset-2'] },
    { title: '盤點人脈資源', description: '列出所有可能幫助你創業的人脈，分類整理', categoryId: 'mindset', itemIds: ['mindset-2'] },
    { title: '評估財務風險承受度', description: '計算你的個人存款、每月支出和可承受的創業投入金額', categoryId: 'mindset', itemIds: ['mindset-3'] },
    { title: '與家人溝通創業計畫', description: '與伴侶/家人坦誠討論創業想法，聽取他們的意見和顧慮', categoryId: 'mindset', itemIds: ['mindset-4'] },
    { title: '本週回顧與反思', description: '回顧本週的發現，寫下你對創業的信心程度（1-10分）', categoryId: 'mindset', itemIds: ['mindset-1'] },
  ]),
  week(2, '深入自我探索與目標設定', [
    { title: '完成創業者能力測評', description: '使用線上工具完成創業能力評估，找出需要補強的領域', categoryId: 'mindset', itemIds: ['mindset-2'] },
    { title: '設定 SMART 短期目標', description: '設定未來 3 個月的 3-5 個具體、可衡量的目標', categoryId: 'mindset', itemIds: ['mindset-5'] },
    { title: '設定 SMART 中長期目標', description: '設定 1 年和 3 年的願景目標', categoryId: 'mindset', itemIds: ['mindset-5'] },
    { title: '研究創業社群活動', description: '搜尋當地的創業聚會、加速器說明會和相關活動', categoryId: 'mindset', itemIds: ['mindset-6'] },
    { title: '參加一場創業活動', description: '報名並參加一場線上或實體的創業相關活動', categoryId: 'mindset', itemIds: ['mindset-6'] },
    { title: '建立創業筆記系統', description: '用 Notion 或筆記本建立你的創業知識管理系統', categoryId: 'mindset', itemIds: ['mindset-5'] },
    { title: '撰寫創業使命宣言初稿', description: '用一段話描述你的創業使命和價值觀', categoryId: 'mindset', itemIds: ['mindset-1'] },
  ]),
  week(3, '市場調研啟動', [
    { title: '定義你想進入的市場', description: '寫下你的目標市場範圍、產業類別和地理範圍', categoryId: 'market', itemIds: ['market-1'] },
    { title: '使用 Google Trends 研究趨勢', description: '搜尋相關關鍵字的搜尋趨勢和熱門度', categoryId: 'market', itemIds: ['market-7'] },
    { title: '列出 5-10 個競爭對手', description: '找出直接和間接的競爭者，記錄他們的基本資訊', categoryId: 'market', itemIds: ['market-2'] },
    { title: '分析競爭對手的產品', description: '試用競爭對手的產品/服務，記錄優缺點', categoryId: 'market', itemIds: ['market-2'] },
    { title: '研究競爭對手的定價', description: '整理競爭對手的定價策略和方案', categoryId: 'market', itemIds: ['market-2'] },
    { title: '開始建立客戶人物誌', description: '描繪你的第一個理想客戶畫像', categoryId: 'market', itemIds: ['market-3'] },
    { title: '本週研究成果整理', description: '整理本週的市場研究發現，更新筆記', categoryId: 'market', itemIds: ['market-1'] },
  ]),
  week(4, '市場驗證第一步', [
    { title: '設計客戶訪談問題', description: '準備 10-15 個開放式問題，了解潛在客戶的痛點和需求', categoryId: 'market', itemIds: ['market-8'] },
    { title: '安排第一批客戶訪談', description: '聯繫 5-10 位潛在客戶，預約訪談時間', categoryId: 'market', itemIds: ['market-8'] },
    { title: '進行 2-3 場客戶訪談', description: '執行訪談並做詳細記錄', categoryId: 'market', itemIds: ['market-8'] },
    { title: '估算市場規模 (TAM/SAM/SOM)', description: '用由上而下和由下而上的方法估算市場規模', categoryId: 'market', itemIds: ['market-4'] },
    { title: '進行更多客戶訪談', description: '繼續進行客戶訪談，累計至少 5 場', categoryId: 'market', itemIds: ['market-8'] },
    { title: '整理訪談發現', description: '歸納訪談中發現的共同痛點和需求模式', categoryId: 'market', itemIds: ['market-8'] },
    { title: '第一個月回顧', description: '回顧整個月的進度，評估創業方向是否需要調整', categoryId: 'mindset', itemIds: ['mindset-5'], milestone: '完成自我評估與市場初步研究' },
  ]),

  // ======== 第 2 個月：深入市場調研 + 商業模式設計 ========
  week(5, '深入市場研究', [
    { title: '完善客戶人物誌', description: '根據訪談結果完善 2-3 個客戶人物誌', categoryId: 'market', itemIds: ['market-3'] },
    { title: '產業趨勢深度研究', description: '閱讀產業報告，了解未來 3-5 年的趨勢', categoryId: 'market', itemIds: ['market-7'] },
    { title: '競爭對手深度分析', description: '製作競爭者分析矩陣，比較各維度的優劣', categoryId: 'market', itemIds: ['market-2'] },
    { title: '分析競爭對手的行銷策略', description: '研究競爭對手的社群媒體、廣告和內容策略', categoryId: 'market', itemIds: ['market-2'] },
    { title: '識別市場缺口', description: '從研究中找出競爭者未能滿足的需求', categoryId: 'market', itemIds: ['market-1'] },
    { title: '撰寫市場分析報告', description: '將所有研究成果整理成一份完整的市場分析報告', categoryId: 'market', itemIds: ['market-1'] },
    { title: '本週回顧', description: '回顧研究成果，確認是否有足夠大的市場機會', categoryId: 'market', itemIds: ['market-4'] },
  ]),
  week(6, '商業模式設計', [
    { title: '學習商業模式畫布', description: '閱讀 BMC 教學資料，理解九大要素', categoryId: 'market', itemIds: ['market-5'] },
    { title: '填寫商業模式畫布初版', description: '完成第一版商業模式畫布', categoryId: 'market', itemIds: ['market-5'] },
    { title: '設計價值主張', description: '用價值主張畫布精確定義你的核心價值', categoryId: 'market', itemIds: ['market-6'] },
    { title: '定義收入模式', description: '確定你要如何賺錢：訂閱制、一次性、抽成等', categoryId: 'market', itemIds: ['market-5'] },
    { title: '列出關鍵資源和合作夥伴', description: '盤點實現商業模式所需的資源和夥伴', categoryId: 'market', itemIds: ['market-5'] },
    { title: '估算成本結構', description: '列出所有固定成本和變動成本', categoryId: 'market', itemIds: ['market-5'] },
    { title: '商業模式驗證計畫', description: '列出需要驗證的關鍵假設和驗證方法', categoryId: 'market', itemIds: ['market-8'] },
  ]),
  week(7, '商業模式驗證', [
    { title: '設計驗證實驗', description: '為最關鍵的 3 個商業假設設計低成本驗證實驗', categoryId: 'market', itemIds: ['market-8'] },
    { title: '建立簡易落地頁', description: '用 Carrd 或 Wix 建立產品概念的落地頁', categoryId: 'market', itemIds: ['market-8'] },
    { title: '投放小額測試廣告', description: '投入少量預算測試落地頁的轉換率', categoryId: 'market', itemIds: ['market-8'] },
    { title: '收集初步數據', description: '分析落地頁數據和廣告效果', categoryId: 'market', itemIds: ['market-8'] },
    { title: '進行第二輪客戶訪談', description: '帶著更具體的產品概念再訪談 5 位潛在客戶', categoryId: 'market', itemIds: ['market-8'] },
    { title: '分析驗證結果', description: '評估驗證實驗的結果，哪些假設被證實或推翻', categoryId: 'market', itemIds: ['market-8'] },
    { title: '更新商業模式畫布', description: '根據驗證結果修改商業模式畫布', categoryId: 'market', itemIds: ['market-5'] },
  ]),
  week(8, '確立商業模式與準備公司設立', [
    { title: '完善價值主張陳述', description: '用一句話清楚說明你的價值主張', categoryId: 'market', itemIds: ['market-6'] },
    { title: '制定初步定價策略', description: '根據市場研究和成本分析，制定初步定價', categoryId: 'product', itemIds: ['product-7'] },
    { title: '撰寫一頁式商業計畫', description: '將商業模式濃縮成一頁式的商業計畫書', categoryId: 'market', itemIds: ['market-5'] },
    { title: '研究公司型態選擇', description: '了解行號、有限公司、股份有限公司的差異', categoryId: 'legal', itemIds: ['legal-1'] },
    { title: '諮詢會計師/律師', description: '預約會計師或律師諮詢，了解設立公司的建議', categoryId: 'legal', itemIds: ['legal-1'] },
    { title: '決定公司型態', description: '根據專業建議和自身需求，決定公司組織型態', categoryId: 'legal', itemIds: ['legal-1'] },
    { title: '第二個月回顧', description: '回顧商業模式設計成果，確認方向明確', categoryId: 'market', itemIds: ['market-5'], milestone: '商業模式確立' },
  ]),

  // ======== 第 3 個月：公司設立與法律事務 ========
  week(9, '公司名稱與登記準備', [
    { title: '腦力激盪公司名稱', description: '想出 5-10 個公司名稱候選，考慮品牌意義和好記度', categoryId: 'legal', itemIds: ['legal-2'] },
    { title: '公司名稱預查', description: '到經濟部商業司線上預查名稱是否可用', categoryId: 'legal', itemIds: ['legal-2'] },
    { title: '同步檢查域名和社群帳號', description: '確認公司名稱對應的網域和社群帳號可用性', categoryId: 'legal', itemIds: ['legal-2'] },
    { title: '規劃資本額', description: '根據營運需求和會計師建議決定資本額', categoryId: 'legal', itemIds: ['legal-3'] },
    { title: '準備設立文件', description: '準備公司章程、股東同意書等設立所需文件', categoryId: 'legal', itemIds: ['legal-4'] },
    { title: '銀行驗資', description: '到銀行辦理資本額驗資程序', categoryId: 'legal', itemIds: ['legal-3'] },
    { title: '提交公司設立申請', description: '向經濟部提交公司設立登記申請', categoryId: 'legal', itemIds: ['legal-4'] },
  ]),
  week(10, '完成公司登記', [
    { title: '追蹤設立登記進度', description: '確認公司設立登記是否已核准', categoryId: 'legal', itemIds: ['legal-4'] },
    { title: '取得公司統一編號', description: '公司登記核准後取得統編', categoryId: 'legal', itemIds: ['legal-5'] },
    { title: '辦理營業登記', description: '到國稅局辦理營業登記', categoryId: 'legal', itemIds: ['legal-5'] },
    { title: '登記營業項目', description: '選擇並登記適當的營業項目代碼', categoryId: 'legal', itemIds: ['legal-6'] },
    { title: '刻製公司大小章', description: '製作公司印章和負責人印章', categoryId: 'legal', itemIds: ['legal-4'] },
    { title: '開立公司銀行帳戶', description: '攜帶登記文件到銀行開立公司帳戶', categoryId: 'legal', itemIds: ['legal-7'] },
    { title: '本週法律事務回顧', description: '確認所有登記程序的進度和待辦事項', categoryId: 'legal', itemIds: ['legal-4'] },
  ]),
  week(11, '勞健保與智慧財產權', [
    { title: '辦理勞保投保單位設立', description: '到勞保局辦理投保單位成立', categoryId: 'legal', itemIds: ['legal-8'] },
    { title: '辦理健保投保單位設立', description: '到健保署辦理健保投保單位', categoryId: 'legal', itemIds: ['legal-8'] },
    { title: '商標檢索', description: '在智慧財產局檢索你的品牌名稱是否有商標衝突', categoryId: 'legal', itemIds: ['legal-9'] },
    { title: '準備商標申請文件', description: '準備商標圖樣和申請書', categoryId: 'legal', itemIds: ['legal-9'] },
    { title: '提交商標註冊申請', description: '向智慧財產局提交商標註冊申請', categoryId: 'legal', itemIds: ['legal-9'] },
    { title: '準備基礎合約範本', description: '準備保密協議 (NDA) 和基本服務合約範本', categoryId: 'legal', itemIds: ['legal-10'] },
    { title: '整理所有法律文件', description: '建立法律文件資料夾，妥善保管所有證照和合約', categoryId: 'legal', itemIds: ['legal-10'] },
  ]),
  week(12, '法律事務收尾與財務啟動', [
    { title: '確認所有登記完成', description: '逐一確認公司登記、營業登記、勞健保等是否全部完成', categoryId: 'legal', itemIds: ['legal-4'] },
    { title: '準備合夥/股東協議', description: '如有合夥人，請律師審閱合夥協議書', categoryId: 'legal', itemIds: ['legal-10'] },
    { title: '準備勞動契約範本', description: '準備符合勞基法的勞動契約', categoryId: 'legal', itemIds: ['legal-10'] },
    { title: '開始估算創業資金需求', description: '列出所有一次性開辦費用和每月固定支出', categoryId: 'finance', itemIds: ['finance-1'] },
    { title: '研究記帳方式', description: '了解自行記帳和委託記帳士的優缺點', categoryId: 'finance', itemIds: ['finance-3'] },
    { title: '聯繫記帳士/會計師', description: '比較並選擇適合的記帳士或會計事務所', categoryId: 'finance', itemIds: ['finance-3'] },
    { title: '第三個月回顧', description: '公司已正式成立！回顧法律事務完成度', categoryId: 'legal', itemIds: ['legal-4'], milestone: '公司正式成立' },
  ]),

  // ======== 第 4 個月：財務規劃與資金籌措 ========
  week(13, '財務基礎建設', [
    { title: '完成創業資金需求估算', description: '製作詳細的資金需求表，包含 12 個月的預算', categoryId: 'finance', itemIds: ['finance-1'] },
    { title: '規劃個人財務緩衝', description: '確認個人準備金是否足夠 6-12 個月生活費', categoryId: 'finance', itemIds: ['finance-2'] },
    { title: '簽約記帳士', description: '與選定的記帳士/會計事務所簽約', categoryId: 'finance', itemIds: ['finance-3'] },
    { title: '建立記帳流程', description: '與記帳士確認每月記帳流程和需要提供的資料', categoryId: 'finance', itemIds: ['finance-3'] },
    { title: '了解發票制度', description: '學習統一發票的種類和開立方式', categoryId: 'finance', itemIds: ['finance-4'] },
    { title: '申請統一發票', description: '向國稅局申請使用統一發票（若需要）', categoryId: 'finance', itemIds: ['finance-4'] },
    { title: '建立基礎財務報表', description: '用 Excel/Sheets 建立損益表和現金流追蹤表', categoryId: 'finance', itemIds: ['finance-8'] },
  ]),
  week(14, '稅務與資金規劃', [
    { title: '學習營業稅計算', description: '了解營業稅 5% 的計算方式和申報流程', categoryId: 'finance', itemIds: ['finance-5'] },
    { title: '了解營所稅基礎', description: '學習營利事業所得稅的稅率和申報時程', categoryId: 'finance', itemIds: ['finance-5'] },
    { title: '設定稅務行事曆', description: '在 Google Calendar 標記所有稅務申報截止日期', categoryId: 'finance', itemIds: ['finance-5'] },
    { title: '評估資金缺口', description: '比較資金需求和自有資金，計算資金缺口', categoryId: 'finance', itemIds: ['finance-6'] },
    { title: '研究融資選項', description: '了解銀行貸款、天使投資、政府補助等選項', categoryId: 'finance', itemIds: ['finance-6'] },
    { title: '研究政府創業補助', description: '查詢 SBIR、青年創業貸款等政府資源', categoryId: 'finance', itemIds: ['finance-7'] },
    { title: '本週財務回顧', description: '確認財務基礎建設的進度', categoryId: 'finance', itemIds: ['finance-8'] },
  ]),
  week(15, '資金籌措行動', [
    { title: '準備融資簡報', description: '製作投資人或銀行用的融資簡報 (Pitch Deck)', categoryId: 'finance', itemIds: ['finance-6'] },
    { title: '撰寫商業計畫書', description: '完成用於申請貸款或補助的商業計畫書', categoryId: 'finance', itemIds: ['finance-7'] },
    { title: '申請青年創業貸款', description: '準備文件並提出青創貸款申請（若符合資格）', categoryId: 'finance', itemIds: ['finance-7'] },
    { title: '研究 SBIR/SIIR 補助', description: '了解申請時程和準備文件', categoryId: 'finance', itemIds: ['finance-7'] },
    { title: '建立財務儀表板', description: '製作可視化的財務追蹤儀表板', categoryId: 'finance', itemIds: ['finance-8'] },
    { title: '學習看懂三大財報', description: '學習損益表、資產負債表、現金流量表的解讀', categoryId: 'finance', itemIds: ['finance-8'] },
    { title: '設定每月財務檢視流程', description: '建立每月定期檢視財務報表的習慣', categoryId: 'finance', itemIds: ['finance-8'] },
  ]),
  week(16, '財務系統到位', [
    { title: '確認所有財務系統運作', description: '檢查記帳、發票、報稅等流程是否順暢', categoryId: 'finance', itemIds: ['finance-3'] },
    { title: '設定預算控制機制', description: '為各類支出設定預算上限和審核流程', categoryId: 'finance', itemIds: ['finance-1'] },
    { title: '建立緊急資金預案', description: '制定資金不足時的應急計畫', categoryId: 'finance', itemIds: ['finance-2'] },
    { title: '開始品牌命名發想', description: '開始思考品牌名稱，列出候選清單', categoryId: 'branding', itemIds: ['branding-1'] },
    { title: '研究品牌設計參考', description: '收集你喜歡的品牌設計案例作為參考', categoryId: 'branding', itemIds: ['branding-2'] },
    { title: '研究行銷通路選項', description: '初步了解各行銷通路的優缺點', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '第四個月回顧', description: '財務系統已到位！回顧資金狀況', categoryId: 'finance', itemIds: ['finance-1'], milestone: '財務系統到位' },
  ]),

  // ======== 第 5 個月：品牌建立基礎 ========
  week(17, '品牌命名與識別設計', [
    { title: '確定品牌名稱', description: '從候選清單中選定品牌名稱，檢查域名和商標', categoryId: 'branding', itemIds: ['branding-1'] },
    { title: '撰寫品牌標語', description: '為品牌設計一句簡短有力的標語 (Slogan)', categoryId: 'branding', itemIds: ['branding-1'] },
    { title: '設計品牌 Logo', description: '設計或委託設計品牌 Logo，準備不同尺寸版本', categoryId: 'branding', itemIds: ['branding-2'] },
    { title: '選定品牌色彩', description: '確定主色、輔色和強調色，製作色彩規範', categoryId: 'branding', itemIds: ['branding-2'] },
    { title: '選定品牌字體', description: '選擇標題和內文字體，確保中英文搭配和諧', categoryId: 'branding', itemIds: ['branding-2'] },
    { title: '製作品牌識別規範', description: '整理 Logo 使用規範、色彩代碼、字體規格', categoryId: 'branding', itemIds: ['branding-2'] },
    { title: '註冊域名', description: '購買公司域名和相關社群媒體帳號', categoryId: 'branding', itemIds: ['branding-1'] },
  ]),
  week(18, '品牌故事與行銷策略', [
    { title: '撰寫品牌故事', description: '寫出品牌的起源故事、理念和願景', categoryId: 'branding', itemIds: ['branding-3'] },
    { title: '製作品牌介紹簡報', description: '製作一份完整的品牌介紹簡報', categoryId: 'branding', itemIds: ['branding-3'] },
    { title: '研究目標客群使用的媒體', description: '調查目標客群最常使用的社群和媒體管道', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '選定核心行銷通路', description: '選擇 2-3 個最適合的行銷通路', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '制定社群媒體策略', description: '選擇社群平台，制定發文頻率和內容主題', categoryId: 'branding', itemIds: ['branding-5'] },
    { title: '建立社群帳號', description: '在選定的平台建立並完善品牌社群帳號', categoryId: 'branding', itemIds: ['branding-5'] },
    { title: '發出第一篇社群貼文', description: '發布品牌的第一篇社群貼文', categoryId: 'branding', itemIds: ['branding-5'] },
  ]),
  week(19, '內容行銷與 SEO', [
    { title: '制定內容行銷計畫', description: '規劃未來 3 個月的內容主題和發布排程', categoryId: 'branding', itemIds: ['branding-6'] },
    { title: '進行關鍵字研究', description: '用 Ubersuggest 等工具找出目標關鍵字', categoryId: 'branding', itemIds: ['branding-7'] },
    { title: '建立部落格', description: '在官網或 Medium 建立品牌部落格', categoryId: 'branding', itemIds: ['branding-6'] },
    { title: '撰寫第一篇部落格文章', description: '針對目標關鍵字撰寫一篇高品質文章', categoryId: 'branding', itemIds: ['branding-6'] },
    { title: '建立 SEO 基礎架構', description: '設定 Google Search Console 和基本 SEO 設置', categoryId: 'branding', itemIds: ['branding-7'] },
    { title: '製作社群內容日曆', description: '用模板規劃下個月的社群內容排程', categoryId: 'branding', itemIds: ['branding-5'] },
    { title: '本週行銷回顧', description: '確認行銷通路是否開始產生互動', categoryId: 'branding', itemIds: ['branding-4'] },
  ]),
  week(20, '廣告策略與品牌完善', [
    { title: '學習 Google Ads 基礎', description: '了解 Google 關鍵字廣告的基本操作', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '學習 Meta 廣告基礎', description: '了解 Facebook/Instagram 廣告的基本操作', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '設計廣告素材', description: '為第一波廣告準備圖片和文案', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '設定小額測試廣告', description: '投入少量預算（2,000-5,000元）測試廣告效果', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '安裝 Google Analytics', description: '在網站安裝 GA4 追蹤碼', categoryId: 'branding', itemIds: ['branding-7'] },
    { title: '設定追蹤像素', description: '安裝 Meta Pixel 等追蹤工具', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '第五個月回顧', description: '品牌形象已建立！回顧品牌和行銷進度', categoryId: 'branding', itemIds: ['branding-1'], milestone: '品牌形象建立完成' },
  ]),

  // ======== 第 6 個月：產品/服務開發（MVP） ========
  week(21, 'MVP 規劃', [
    { title: '定義 MVP 核心功能', description: '列出 MVP 必須包含的最少功能清單', categoryId: 'product', itemIds: ['product-1'] },
    { title: '撰寫產品規格文件', description: '詳細描述 MVP 的功能規格和用戶流程', categoryId: 'product', itemIds: ['product-1'] },
    { title: '繪製用戶流程圖', description: '畫出主要用戶操作的流程圖', categoryId: 'product', itemIds: ['product-3'] },
    { title: '設計低保真原型', description: '用紙筆或 Figma 製作低保真原型', categoryId: 'product', itemIds: ['product-2'] },
    { title: '用原型做用戶測試', description: '找 3-5 人用原型走過主要流程', categoryId: 'product', itemIds: ['product-2'] },
    { title: '確定技術方案', description: '決定開發技術和工具選擇', categoryId: 'product', itemIds: ['product-4'] },
    { title: '制定開發計畫', description: '將 MVP 開發分解為 2-4 週的迭代計畫', categoryId: 'product', itemIds: ['product-4'] },
  ]),
  week(22, 'MVP 開發第一週', [
    { title: '設置開發環境', description: '搭建開發環境和基礎架構', categoryId: 'product', itemIds: ['product-4'] },
    { title: '開發核心功能 1', description: '開始開發 MVP 的第一個核心功能', categoryId: 'product', itemIds: ['product-4'] },
    { title: '開發核心功能 2', description: '繼續開發第二個核心功能', categoryId: 'product', itemIds: ['product-4'] },
    { title: '內部測試', description: '對已完成功能進行基本測試', categoryId: 'product', itemIds: ['product-4'] },
    { title: '修復發現的問題', description: '修復測試中發現的 bug', categoryId: 'product', itemIds: ['product-4'] },
    { title: '設計產品介面', description: '完善產品的視覺設計和使用者介面', categoryId: 'product', itemIds: ['product-3'] },
    { title: '開發進度檢視', description: '回顧開發進度，調整下週計畫', categoryId: 'product', itemIds: ['product-4'] },
  ]),
  week(23, 'MVP 開發第二週', [
    { title: '繼續核心功能開發', description: '完成剩餘的核心功能開發', categoryId: 'product', itemIds: ['product-4'] },
    { title: '整合各功能模組', description: '將各個功能模組整合在一起', categoryId: 'product', itemIds: ['product-4'] },
    { title: '端到端測試', description: '進行完整的用戶流程測試', categoryId: 'product', itemIds: ['product-4'] },
    { title: '效能優化', description: '優化載入速度和使用者體驗', categoryId: 'product', itemIds: ['product-3'] },
    { title: '準備部署環境', description: '設置上線環境和部署流程', categoryId: 'product', itemIds: ['product-4'] },
    { title: '撰寫使用說明', description: '為用戶準備基本的使用指南', categoryId: 'product', itemIds: ['product-4'] },
    { title: 'MVP 上線！', description: '將 MVP 部署上線，開放使用', categoryId: 'product', itemIds: ['product-4'], milestone: 'MVP產品上線' },
  ]),
  week(24, 'MVP 上線與初步回饋', [
    { title: '邀請首批用戶', description: '邀請 10-20 位早期用戶試用 MVP', categoryId: 'product', itemIds: ['product-5'] },
    { title: '設立回饋收集機制', description: '建立用戶回饋的收集管道（表單、對話）', categoryId: 'product', itemIds: ['product-5'] },
    { title: '監控產品數據', description: '追蹤用戶行為數據和錯誤日誌', categoryId: 'product', itemIds: ['product-5'] },
    { title: '收集用戶回饋', description: '主動聯繫早期用戶收集使用回饋', categoryId: 'product', itemIds: ['product-5'] },
    { title: '處理緊急問題', description: '修復上線後發現的緊急問題', categoryId: 'product', itemIds: ['product-6'] },
    { title: '分析首週數據', description: '分析第一週的用戶數據和回饋', categoryId: 'product', itemIds: ['product-5'] },
    { title: '第六個月回顧', description: '半年過去了！MVP 已上線，回顧所有進度', categoryId: 'product', itemIds: ['product-1'] },
  ]),

  // ======== 第 7 個月：產品測試與優化 ========
  week(25, 'Beta 測試擴大', [
    { title: '擴大 Beta 測試範圍', description: '邀請更多用戶參與測試，目標 50-100 人', categoryId: 'product', itemIds: ['product-5'] },
    { title: '設計用戶問卷', description: '製作結構化的用戶滿意度問卷', categoryId: 'product', itemIds: ['product-5'] },
    { title: '進行用戶深度訪談', description: '與 5 位活躍用戶進行深度訪談', categoryId: 'product', itemIds: ['product-5'] },
    { title: '分析用戶行為數據', description: '用數據分析工具了解用戶使用模式', categoryId: 'product', itemIds: ['product-5'] },
    { title: '識別核心問題', description: '從數據和回饋中識別最需要解決的問題', categoryId: 'product', itemIds: ['product-6'] },
    { title: '制定迭代計畫', description: '排定功能優化和 bug 修復的優先順序', categoryId: 'product', itemIds: ['product-6'] },
    { title: '本週回顧', description: '檢視 Beta 測試的關鍵發現', categoryId: 'product', itemIds: ['product-5'] },
  ]),
  week(26, '產品迭代優化', [
    { title: '修復最高優先級問題', description: '解決用戶反映最多的問題', categoryId: 'product', itemIds: ['product-6'] },
    { title: '優化核心用戶流程', description: '改善用戶最常使用功能的體驗', categoryId: 'product', itemIds: ['product-6'] },
    { title: '新增用戶要求的功能', description: '實作用戶需求最高的 1-2 個新功能', categoryId: 'product', itemIds: ['product-6'] },
    { title: '更新產品說明', description: '更新使用說明和 FAQ', categoryId: 'product', itemIds: ['product-6'] },
    { title: '進行 A/B 測試', description: '對關鍵頁面或功能進行 A/B 測試', categoryId: 'product', itemIds: ['product-6'] },
    { title: '優化產品效能', description: '改善載入速度和整體效能', categoryId: 'product', itemIds: ['product-6'] },
    { title: '發布更新版本', description: '發布包含改進的新版本', categoryId: 'product', itemIds: ['product-6'] },
  ]),
  week(27, '定價與商業化準備', [
    { title: '分析競品定價', description: '整理競爭對手的定價方案和策略', categoryId: 'product', itemIds: ['product-7'] },
    { title: '計算單位經濟學', description: '計算 CAC（客戶獲取成本）和 LTV（客戶終身價值）', categoryId: 'product', itemIds: ['product-7'] },
    { title: '設計定價方案', description: '制定 2-3 個定價方案（免費/基礎/進階）', categoryId: 'product', itemIds: ['product-7'] },
    { title: '測試定價敏感度', description: '與潛在客戶討論定價方案，收集反應', categoryId: 'product', itemIds: ['product-7'] },
    { title: '建立付款系統', description: '整合線上付款功能（信用卡、匯款等）', categoryId: 'product', itemIds: ['product-7'] },
    { title: '準備銷售頁面', description: '製作產品銷售頁面和購買流程', categoryId: 'product', itemIds: ['product-7'] },
    { title: '本週回顧', description: '確認定價策略和商業化準備', categoryId: 'product', itemIds: ['product-7'] },
  ]),
  week(28, 'Beta 完成與正式版準備', [
    { title: '最終一輪 Beta 修復', description: '修復 Beta 期間遺留的所有問題', categoryId: 'product', itemIds: ['product-6'] },
    { title: '準備正式上線計畫', description: '制定正式上線的時間表和宣傳計畫', categoryId: 'product', itemIds: ['product-4'] },
    { title: '撰寫上線公告', description: '準備產品正式上線的公告和宣傳文案', categoryId: 'branding', itemIds: ['branding-6'] },
    { title: '設計上線活動', description: '規劃上線慶祝活動或優惠方案', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '準備客服流程', description: '建立客戶問題處理的標準流程', categoryId: 'sales', itemIds: ['sales-5'] },
    { title: '正式版上線', description: '產品正式對外公開上線', categoryId: 'product', itemIds: ['product-4'] },
    { title: '第七個月回顧', description: 'Beta 測試完成，產品正式上線！', categoryId: 'product', itemIds: ['product-5'], milestone: 'Beta測試完成' },
  ]),

  // ======== 第 8 個月：團隊組建 ========
  week(29, '組織規劃與招募準備', [
    { title: '規劃組織架構', description: '根據業務需求規劃初期組織架構', categoryId: 'team', itemIds: ['team-1'] },
    { title: '盤點人力需求', description: '列出最需要招募的 2-3 個職位', categoryId: 'team', itemIds: ['team-1'] },
    { title: '撰寫職位說明書', description: '為每個職位撰寫完整的 JD', categoryId: 'team', itemIds: ['team-2'] },
    { title: '設計薪資方案', description: '研究市場行情，制定有競爭力的薪資方案', categoryId: 'team', itemIds: ['team-6'] },
    { title: '建立招募管道', description: '在 104、CakeResume 等平台發布職缺', categoryId: 'team', itemIds: ['team-3'] },
    { title: '設計面試流程', description: '制定面試標準、問題和評分表', categoryId: 'team', itemIds: ['team-4'] },
    { title: '啟動人脈推薦', description: '告知身邊人脈你正在招募，請求推薦', categoryId: 'team', itemIds: ['team-3'] },
  ]),
  week(30, '招募進行中', [
    { title: '篩選履歷', description: '篩選收到的履歷，挑選進入面試的候選人', categoryId: 'team', itemIds: ['team-4'] },
    { title: '進行第一輪面試', description: '進行初步面試，評估基本條件和文化契合度', categoryId: 'team', itemIds: ['team-4'] },
    { title: '進行第二輪面試', description: '對通過初篩的候選人進行深度面試', categoryId: 'team', itemIds: ['team-4'] },
    { title: '準備勞動契約', description: '確認勞動契約範本符合最新法規', categoryId: 'team', itemIds: ['team-5'] },
    { title: '了解勞基法重點', description: '確認加班、休假、資遣等規定', categoryId: 'team', itemIds: ['team-5'] },
    { title: '規劃員工福利', description: '設計基本的員工福利方案', categoryId: 'team', itemIds: ['team-6'] },
    { title: '本週回顧', description: '檢視招募進度和候選人狀況', categoryId: 'team', itemIds: ['team-4'] },
  ]),
  week(31, '團隊到位', [
    { title: '發出錄用通知', description: '向選定的候選人發出正式錄用通知', categoryId: 'team', itemIds: ['team-4'] },
    { title: '完成入職手續', description: '簽約、辦理勞健保加保', categoryId: 'team', itemIds: ['team-5'] },
    { title: '準備入職培訓', description: '製作新人入職手冊和培訓計畫', categoryId: 'team', itemIds: ['team-7'] },
    { title: '設定工作帳號', description: '為新成員建立所有必要的工作帳號', categoryId: 'digital', itemIds: ['digital-2'] },
    { title: '進行入職培訓', description: '帶領新成員了解公司、產品和工作流程', categoryId: 'team', itemIds: ['team-7'] },
    { title: '設定試用期目標', description: '與新成員設定試用期的工作目標和評估標準', categoryId: 'team', itemIds: ['team-4'] },
    { title: '建立團隊溝通機制', description: '建立每日站會、週會等溝通機制', categoryId: 'team', itemIds: ['team-7'] },
  ]),
  week(32, '團隊建設與文化塑造', [
    { title: '定義核心價值觀', description: '與團隊一起討論並定義公司的核心價值觀', categoryId: 'team', itemIds: ['team-7'] },
    { title: '建立工作制度', description: '制定上下班、休假、遠端工作等基本制度', categoryId: 'team', itemIds: ['team-5'] },
    { title: '規劃績效評估', description: '設計適合小團隊的績效評估機制', categoryId: 'team', itemIds: ['team-6'] },
    { title: '團隊建設活動', description: '安排一次團隊建設活動，增進默契', categoryId: 'team', itemIds: ['team-7'] },
    { title: '建立知識管理系統', description: '用 Notion 或 Wiki 建立團隊知識庫', categoryId: 'digital', itemIds: ['digital-3'] },
    { title: '考慮是否需要股權激勵', description: '評估是否需要為核心員工設計 ESOP', categoryId: 'team', itemIds: ['team-6'] },
    { title: '第八個月回顧', description: '核心團隊已到位！回顧團隊組建成果', categoryId: 'team', itemIds: ['team-1'], milestone: '核心團隊到位' },
  ]),

  // ======== 第 9 個月：數位系統建置 ========
  week(33, '官網與基礎系統', [
    { title: '規劃官網架構', description: '設計官網的頁面結構和內容規劃', categoryId: 'digital', itemIds: ['digital-1'] },
    { title: '建置或優化公司官網', description: '建立專業的公司官方網站', categoryId: 'digital', itemIds: ['digital-1'] },
    { title: '設定 Google Workspace', description: '導入公司專屬郵件和協作工具', categoryId: 'digital', itemIds: ['digital-2'] },
    { title: '建立雲端文件架構', description: '規劃並建立雲端文件的分類和權限', categoryId: 'digital', itemIds: ['digital-3'] },
    { title: '導入專案管理工具', description: '選定並設置專案管理工具（如 Notion、Trello）', categoryId: 'digital', itemIds: ['digital-5'] },
    { title: '制定工具使用規範', description: '為團隊制定各數位工具的使用規範', categoryId: 'digital', itemIds: ['digital-5'] },
    { title: '培訓團隊使用工具', description: '教導團隊成員使用新導入的工具', categoryId: 'digital', itemIds: ['digital-5'] },
  ]),
  week(34, 'CRM 與商務系統', [
    { title: '導入 CRM 系統', description: '選定並設置 CRM 系統（推薦 HubSpot 免費版）', categoryId: 'digital', itemIds: ['digital-4'] },
    { title: '建立客戶資料結構', description: '在 CRM 中設定客戶資料欄位和分類', categoryId: 'digital', itemIds: ['digital-4'] },
    { title: '匯入現有客戶資料', description: '將已有的客戶資料匯入 CRM', categoryId: 'digital', itemIds: ['digital-4'] },
    { title: '設定銷售管線', description: '在 CRM 中建立銷售階段和自動化流程', categoryId: 'digital', itemIds: ['digital-4'] },
    { title: '評估會計軟體需求', description: '評估是否需要從 Excel 升級到專業會計軟體', categoryId: 'digital', itemIds: ['digital-6'] },
    { title: '評估電商需求', description: '如果需要線上銷售，評估電商平台選項', categoryId: 'digital', itemIds: ['digital-7'] },
    { title: '本週回顧', description: '檢視數位系統建置進度', categoryId: 'digital', itemIds: ['digital-4'] },
  ]),
  week(35, '自動化與資安', [
    { title: '識別可自動化的流程', description: '列出目前手動執行但可以自動化的工作流程', categoryId: 'digital', itemIds: ['digital-5'] },
    { title: '設定工作流程自動化', description: '用 Zapier 或其他工具自動化重複性工作', categoryId: 'digital', itemIds: ['digital-5'] },
    { title: '導入密碼管理器', description: '為團隊導入 1Password 等密碼管理工具', categoryId: 'digital', itemIds: ['digital-8'] },
    { title: '啟用二步驟驗證', description: '為所有重要帳號啟用 2FA', categoryId: 'digital', itemIds: ['digital-8'] },
    { title: '建立備份機制', description: '設定自動備份重要資料的機制', categoryId: 'digital', itemIds: ['digital-8'] },
    { title: '制定資安政策', description: '撰寫基本的資訊安全政策文件', categoryId: 'digital', itemIds: ['digital-8'] },
    { title: '進行資安培訓', description: '教導團隊基本的資安意識和操作規範', categoryId: 'digital', itemIds: ['digital-8'] },
  ]),
  week(36, '系統整合與行銷啟動', [
    { title: '整合各系統', description: '確保 CRM、郵件、官網等系統間資料互通', categoryId: 'digital', itemIds: ['digital-4'] },
    { title: '建立數據儀表板', description: '整合各系統數據到一個可視化儀表板', categoryId: 'digital', itemIds: ['digital-4'] },
    { title: '測試所有系統', description: '進行全面的系統測試確保一切正常運作', categoryId: 'digital', itemIds: ['digital-5'] },
    { title: '準備行銷素材', description: '為下月的行銷推廣準備所有素材', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '規劃行銷啟動活動', description: '設計產品正式推廣的行銷活動', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '設定行銷預算', description: '為接下來 3 個月分配行銷預算', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '第九個月回顧', description: '數位系統全面上線！回顧系統建置成果', categoryId: 'digital', itemIds: ['digital-1'], milestone: '數位系統全面上線' },
  ]),

  // ======== 第 10 個月：行銷啟動與客戶開發 ========
  week(37, '全面行銷啟動', [
    { title: '啟動行銷活動', description: '執行規劃好的行銷推廣活動', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '加大社群發文頻率', description: '增加社群媒體的發文頻率和互動', categoryId: 'branding', itemIds: ['branding-5'] },
    { title: '投放正式廣告', description: '根據測試結果投放正式的數位廣告', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '設計銷售漏斗', description: '建立從接觸到成交的完整銷售漏斗', categoryId: 'sales', itemIds: ['sales-1'] },
    { title: '準備銷售話術', description: '撰寫電梯簡報和常見問題應對話術', categoryId: 'sales', itemIds: ['sales-3'] },
    { title: '製作銷售簡報', description: '製作產品銷售用的完整簡報', categoryId: 'sales', itemIds: ['sales-3'] },
    { title: '啟動客戶開發', description: '開始主動聯繫潛在客戶', categoryId: 'sales', itemIds: ['sales-2'] },
  ]),
  week(38, '客戶開發衝刺', [
    { title: '列出目標客戶清單', description: '建立 50-100 個目標客戶的聯繫清單', categoryId: 'sales', itemIds: ['sales-2'] },
    { title: '發送開發信/訊息', description: '開始聯繫目標客戶，介紹你的產品', categoryId: 'sales', itemIds: ['sales-2'] },
    { title: '安排產品展示', description: '為有興趣的客戶安排產品 Demo', categoryId: 'sales', itemIds: ['sales-3'] },
    { title: '準備報價模板', description: '製作標準化的報價單模板', categoryId: 'sales', itemIds: ['sales-4'] },
    { title: '進行產品展示', description: '為潛在客戶進行產品展示和說明', categoryId: 'sales', itemIds: ['sales-3'] },
    { title: '追蹤銷售管線', description: '在 CRM 中追蹤所有銷售機會的進度', categoryId: 'sales', itemIds: ['sales-1'] },
    { title: '本週銷售回顧', description: '分析本週的銷售數據和轉換率', categoryId: 'sales', itemIds: ['sales-1'] },
  ]),
  week(39, '成交與客戶服務', [
    { title: '推動銷售成交', description: '針對管線中的機會積極推進成交', categoryId: 'sales', itemIds: ['sales-4'] },
    { title: '簽訂第一份合約', description: '與客戶簽訂正式的服務/銷售合約', categoryId: 'sales', itemIds: ['sales-4'] },
    { title: '交付產品/服務', description: '完成第一位付費客戶的產品交付', categoryId: 'sales', itemIds: ['sales-5'] },
    { title: '建立客服流程', description: '設定客戶問題回報和處理的標準流程', categoryId: 'sales', itemIds: ['sales-5'] },
    { title: '設定客服工具', description: '導入客服工具（如 Intercom、LINE 官方帳號）', categoryId: 'sales', itemIds: ['sales-5'] },
    { title: '收集客戶反饋', description: '向第一批客戶收集使用反饋', categoryId: 'sales', itemIds: ['sales-6'] },
    { title: '慶祝第一單！', description: '恭喜你獲得了第一位付費客戶！', categoryId: 'sales', itemIds: ['sales-2'] },
  ]),
  week(40, '擴大客戶群', [
    { title: '分析首批客戶特徵', description: '分析成功成交客戶的共同特徵', categoryId: 'sales', itemIds: ['sales-2'] },
    { title: '優化銷售流程', description: '根據經驗優化銷售話術和流程', categoryId: 'sales', itemIds: ['sales-1'] },
    { title: '擴大客戶開發', description: '基於成功經驗擴大客戶開發範圍', categoryId: 'sales', itemIds: ['sales-2'] },
    { title: '設定客戶 NPS 調查', description: '建立定期的淨推薦分數調查機制', categoryId: 'sales', itemIds: ['sales-6'] },
    { title: '規劃客戶推薦計畫', description: '設計鼓勵客戶推薦的獎勵機制', categoryId: 'sales', itemIds: ['sales-7'] },
    { title: '分析行銷 ROI', description: '評估各行銷通路的投資報酬率', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '第十個月回顧', description: '首批付費客戶到手！回顧銷售成果', categoryId: 'sales', itemIds: ['sales-2'], milestone: '首批付費客戶' },
  ]),

  // ======== 第 11 個月：銷售優化與客戶經營 ========
  week(41, '銷售流程優化', [
    { title: '檢視銷售漏斗數據', description: '分析每個銷售階段的轉換率，找出瓶頸', categoryId: 'sales', itemIds: ['sales-1'] },
    { title: '優化銷售話術', description: '根據實戰經驗更新銷售話術和常見問題解答', categoryId: 'sales', itemIds: ['sales-3'] },
    { title: '建立銷售 SOP', description: '將成功的銷售流程標準化為 SOP 文件', categoryId: 'sales', itemIds: ['sales-1'] },
    { title: '優化報價流程', description: '簡化報價和合約簽訂流程，加快成交速度', categoryId: 'sales', itemIds: ['sales-4'] },
    { title: '分析客戶流失原因', description: '了解未成交客戶的流失原因並改善', categoryId: 'sales', itemIds: ['sales-1'] },
    { title: '設計追加銷售策略', description: '規劃對現有客戶的升級銷售或交叉銷售', categoryId: 'sales', itemIds: ['sales-7'] },
    { title: '本週回顧', description: '檢視銷售優化的成效', categoryId: 'sales', itemIds: ['sales-1'] },
  ]),
  week(42, '客戶經營深化', [
    { title: '分析客戶使用數據', description: '了解客戶如何使用你的產品，找出改善空間', categoryId: 'sales', itemIds: ['sales-6'] },
    { title: '進行客戶滿意度調查', description: '執行正式的客戶滿意度調查', categoryId: 'sales', itemIds: ['sales-6'] },
    { title: '建立客戶成功流程', description: '設計確保客戶成功使用產品的流程', categoryId: 'sales', itemIds: ['sales-5'] },
    { title: '設計會員/忠誠度計畫', description: '規劃獎勵長期客戶的忠誠度計畫', categoryId: 'sales', itemIds: ['sales-7'] },
    { title: '建立客戶社群', description: '建立用戶社群（LINE群、FB社團等）', categoryId: 'sales', itemIds: ['sales-7'] },
    { title: '撰寫客戶成功案例', description: '訪談滿意客戶，撰寫成功案例分享', categoryId: 'branding', itemIds: ['branding-6'] },
    { title: '發布客戶案例', description: '在官網和社群發布客戶成功案例', categoryId: 'branding', itemIds: ['branding-6'] },
  ]),
  week(43, '持續行銷與內容', [
    { title: '檢視 SEO 成效', description: '分析 3 個月來的 SEO 排名和流量變化', categoryId: 'branding', itemIds: ['branding-7'] },
    { title: '優化表現好的內容', description: '更新和優化排名上升的文章', categoryId: 'branding', itemIds: ['branding-6'] },
    { title: '規劃新一季內容', description: '制定下一季的內容行銷計畫', categoryId: 'branding', itemIds: ['branding-6'] },
    { title: '優化廣告投放', description: '根據數據調整廣告策略和預算分配', categoryId: 'branding', itemIds: ['branding-8'] },
    { title: '嘗試新行銷通路', description: '測試一個新的行銷通路（如 KOL 合作、Podcast）', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '建立電子報', description: '建立定期電子報，培養潛在客戶', categoryId: 'branding', itemIds: ['branding-6'] },
    { title: '本週回顧', description: '檢視行銷整體成效和 ROI', categoryId: 'branding', itemIds: ['branding-8'] },
  ]),
  week(44, '銷售流程成熟化', [
    { title: '整理銷售數據', description: '彙整過去 2 個月的完整銷售數據', categoryId: 'sales', itemIds: ['sales-1'] },
    { title: '計算關鍵業務指標', description: '計算 MRR、CAC、LTV、Churn Rate 等指標', categoryId: 'growth', itemIds: ['growth-1'] },
    { title: '銷售預測模型', description: '建立基於歷史數據的銷售預測模型', categoryId: 'sales', itemIds: ['sales-1'] },
    { title: '評估是否需要擴大團隊', description: '根據業務量評估是否需要增加銷售或客服人員', categoryId: 'team', itemIds: ['team-1'] },
    { title: '優化客戶服務', description: '根據客戶回饋持續改善服務流程', categoryId: 'sales', itemIds: ['sales-5'] },
    { title: '更新產品路線圖', description: '根據客戶需求和市場變化更新產品發展計畫', categoryId: 'product', itemIds: ['product-6'] },
    { title: '第十一個月回顧', description: '銷售流程成熟！回顧業務發展', categoryId: 'sales', itemIds: ['sales-1'], milestone: '銷售流程成熟' },
  ]),

  // ======== 第 12 個月：成長擴展規劃 ========
  week(45, '數據驅動決策', [
    { title: '設定年度 KPI', description: '為下一年設定關鍵績效指標', categoryId: 'growth', itemIds: ['growth-1'] },
    { title: '建立數據分析流程', description: '制定定期數據分析和報告的流程', categoryId: 'growth', itemIds: ['growth-2'] },
    { title: '深度業務數據分析', description: '分析一年來的業務數據，找出成長機會', categoryId: 'growth', itemIds: ['growth-2'] },
    { title: '客戶分群分析', description: '分析不同客戶群的特徵和價值', categoryId: 'growth', itemIds: ['growth-2'] },
    { title: '產品使用分析', description: '分析產品功能的使用率和滿意度', categoryId: 'growth', itemIds: ['growth-2'] },
    { title: '行銷通路效果分析', description: '比較各行銷通路的成本效益', categoryId: 'growth', itemIds: ['growth-2'] },
    { title: '制定數據改善計畫', description: '根據分析結果制定改善行動計畫', categoryId: 'growth', itemIds: ['growth-2'] },
  ]),
  week(46, '規模化策略', [
    { title: '評估產品市場契合度', description: '用 PMF 調查問卷評估是否達到產品市場契合', categoryId: 'growth', itemIds: ['growth-3'] },
    { title: '識別成長槓桿', description: '找出能帶來指數成長的關鍵因素', categoryId: 'growth', itemIds: ['growth-3'] },
    { title: '設計成長飛輪', description: '設計自我強化的成長循環機制', categoryId: 'growth', itemIds: ['growth-3'] },
    { title: '規劃規模化路徑', description: '制定從現在到 10 倍成長的路徑圖', categoryId: 'growth', itemIds: ['growth-3'] },
    { title: '評估資金需求', description: '計算規模化所需的資金投入', categoryId: 'finance', itemIds: ['finance-6'] },
    { title: '研究潛在合作夥伴', description: '識別能加速成長的策略合作機會', categoryId: 'growth', itemIds: ['growth-4'] },
    { title: '本週策略回顧', description: '評估規模化策略的可行性', categoryId: 'growth', itemIds: ['growth-3'] },
  ]),
  week(47, '合作夥伴與未來佈局', [
    { title: '聯繫潛在合作夥伴', description: '開始接觸潛在的策略合作夥伴', categoryId: 'growth', itemIds: ['growth-4'] },
    { title: '準備合作提案', description: '製作合作提案簡報和互利方案', categoryId: 'growth', itemIds: ['growth-4'] },
    { title: '評估國際化機會', description: '初步評估海外市場的機會和挑戰', categoryId: 'growth', itemIds: ['growth-5'] },
    { title: '規劃產品國際化', description: '評估產品多語言和在地化的需求', categoryId: 'growth', itemIds: ['growth-5'] },
    { title: '思考 CSR/ESG', description: '開始思考企業社會責任的實踐方式', categoryId: 'growth', itemIds: ['growth-6'] },
    { title: '整理公司文件檔案', description: '確保所有公司文件、合約、帳務都妥善歸檔', categoryId: 'legal', itemIds: ['legal-10'] },
    { title: '本週回顧', description: '檢視合作和未來佈局的進展', categoryId: 'growth', itemIds: ['growth-4'] },
  ]),
  week(48, '年度財務與團隊回顧', [
    { title: '年度財務結算', description: '與會計師進行年度財務結算和審計', categoryId: 'finance', itemIds: ['finance-8'] },
    { title: '稅務規劃', description: '規劃年度稅務申報和合法節稅策略', categoryId: 'finance', itemIds: ['finance-5'] },
    { title: '員工年度績效評估', description: '進行團隊成員的年度績效評估', categoryId: 'team', itemIds: ['team-6'] },
    { title: '薪資福利檢視', description: '根據市場和公司狀況檢視薪資福利', categoryId: 'team', itemIds: ['team-6'] },
    { title: '團隊發展計畫', description: '為每位成員制定下一年的成長計畫', categoryId: 'team', itemIds: ['team-7'] },
    { title: '公司文化回顧', description: '回顧並強化公司文化和核心價值觀', categoryId: 'team', itemIds: ['team-7'] },
    { title: '本週回顧', description: '完成年度財務和團隊回顧', categoryId: 'finance', itemIds: ['finance-8'] },
  ]),

  // ======== 最後衝刺：年度回顧與下一年計畫 ========
  week(49, '年度業績回顧', [
    { title: '製作年度業績報告', description: '彙整全年的業績數據和關鍵成果', categoryId: 'growth', itemIds: ['growth-1'] },
    { title: '回顧年初目標達成度', description: '對照年初設定的目標，評估達成情況', categoryId: 'mindset', itemIds: ['mindset-5'] },
    { title: '分析成功因素', description: '分析哪些決策和策略帶來了最大成效', categoryId: 'growth', itemIds: ['growth-2'] },
    { title: '反思失敗教訓', description: '回顧犯過的錯誤和學到的教訓', categoryId: 'mindset', itemIds: ['mindset-1'] },
    { title: '整理客戶評價', description: '收集並整理客戶的評價和推薦語', categoryId: 'sales', itemIds: ['sales-6'] },
    { title: '計算年度 ROI', description: '計算各項投資（行銷、人力、產品）的回報率', categoryId: 'finance', itemIds: ['finance-8'] },
    { title: '撰寫年度總結', description: '撰寫一份完整的年度總結報告', categoryId: 'growth', itemIds: ['growth-1'] },
  ]),
  week(50, '下一年策略規劃', [
    { title: '設定下年度願景', description: '更新公司的中長期願景和使命', categoryId: 'mindset', itemIds: ['mindset-1'] },
    { title: '制定下年度目標', description: '設定具體、可衡量的年度目標', categoryId: 'growth', itemIds: ['growth-1'] },
    { title: '規劃產品路線圖', description: '制定下一年的產品發展路線圖', categoryId: 'product', itemIds: ['product-6'] },
    { title: '規劃行銷策略', description: '制定下一年的行銷策略和預算', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '規劃團隊擴充', description: '根據業務需求規劃下一年的招募計畫', categoryId: 'team', itemIds: ['team-1'] },
    { title: '制定財務預算', description: '制定下一年的財務預算和資金計畫', categoryId: 'finance', itemIds: ['finance-1'] },
    { title: '整理策略文件', description: '將所有策略規劃整理成文件', categoryId: 'growth', itemIds: ['growth-3'] },
  ]),
  week(51, '執行準備', [
    { title: '分解年度目標為季度目標', description: '將年度目標分解為四個季度的里程碑', categoryId: 'growth', itemIds: ['growth-1'] },
    { title: '制定 Q1 行動計畫', description: '制定第二年 Q1 的具體行動計畫', categoryId: 'growth', itemIds: ['growth-3'] },
    { title: '更新所有工具和系統', description: '確保所有系統和工具都是最新版本', categoryId: 'digital', itemIds: ['digital-5'] },
    { title: '更新合約和法律文件', description: '檢查並更新所有合約和法律文件', categoryId: 'legal', itemIds: ['legal-10'] },
    { title: '準備新年行銷活動', description: '規劃新年的行銷活動和促銷方案', categoryId: 'branding', itemIds: ['branding-4'] },
    { title: '團隊新年會議', description: '召開團隊新年策略會議，分享願景和計畫', categoryId: 'team', itemIds: ['team-7'] },
    { title: '設定新年第一週任務', description: '安排第二年第一週的具體工作任務', categoryId: 'growth', itemIds: ['growth-1'] },
  ]),
  week(52, '創業一年完成！', [
    { title: '最後的業務收尾', description: '完成年底的所有業務收尾工作', categoryId: 'growth', itemIds: ['growth-1'] },
    { title: '感謝客戶', description: '發送年末感謝信給所有客戶', categoryId: 'sales', itemIds: ['sales-7'] },
    { title: '感謝團隊', description: '舉辦年末聚餐或活動，感謝團隊的付出', categoryId: 'team', itemIds: ['team-7'] },
    { title: '個人成長回顧', description: '回顧這一年自己作為創業者的成長', categoryId: 'mindset', itemIds: ['mindset-2'] },
    { title: '更新創業使命宣言', description: '根據一年的經驗重新審視和更新你的使命宣言', categoryId: 'mindset', itemIds: ['mindset-1'] },
    { title: '規劃個人充電', description: '安排短暫的休息和充電，為第二年做好準備', categoryId: 'mindset', itemIds: ['mindset-4'] },
    { title: '慶祝創業一週年！', description: '恭喜你！你已經走過了創業最艱難的第一年！繼續前進！', categoryId: 'mindset', itemIds: ['mindset-1'], milestone: '創業第一年完成！' },
  ]),
];

// =============================================
// 戰國策服務 (NSS Services) - 創業必備數位服務
// =============================================

export interface NssServiceItem {
  id: string;
  title: string;
  description: string;
  features: string[];
  recommended: string;
  tips: string;
}

export interface NssServiceCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  phaseTag: string;
  services: NssServiceItem[];
}

export const nssServices: NssServiceCategory[] = [
  {
    id: 'nss-domain',
    title: '網域名稱註冊',
    icon: 'Globe',
    description: '為你的品牌註冊專屬網域名稱，建立線上品牌識別的第一步',
    color: 'text-blue-400',
    phaseTag: '品牌建立階段',
    services: [
      {
        id: 'nss-domain-tw',
        title: '.com.tw / .tw 台灣網域',
        description: '台灣在地企業首選，增加客戶信任感和本地搜尋排名優勢。適合以台灣市場為主要目標的創業者。',
        features: ['台灣本土網域，提升在地信任感', '有助於 Google 台灣搜尋排名', '支援中文域名', 'DNS 代管服務', 'WHOIS 隱私保護'],
        recommended: '適合主要面向台灣市場的企業，建議同時註冊 .com.tw 和 .tw',
        tips: '公司名稱確定後立即註冊，避免被搶註。建議同時註冊常見的拼寫變體。',
      },
      {
        id: 'nss-domain-com',
        title: '.com 國際網域',
        description: '全球通用的頂級域名，適合有國際化發展計畫的品牌。',
        features: ['全球最通用的域名後綴', '高品牌辨識度', '國際化發展基礎', '支援所有主流 DNS 設定'],
        recommended: '適合有國際市場目標的品牌，建議與 .com.tw 一起註冊',
        tips: '好的 .com 域名越來越稀少，一旦想到好名字就立即註冊。',
      },
      {
        id: 'nss-domain-special',
        title: '特殊域名（.shop / .store / .io 等）',
        description: '新型態頂級域名，適合特定行業或想要獨特網域的品牌。',
        features: ['多種新型態後綴可選', '.shop / .store 適合電商', '.io 適合科技公司', '.ai 適合 AI 相關企業'],
        recommended: '適合想要獨特品牌定位或特定產業的企業',
        tips: '.io 在科技圈很流行，.shop 適合電商，選擇能代表你行業特性的後綴。',
      },
    ],
  },
  {
    id: 'nss-hosting',
    title: '虛擬主機與網站代管',
    icon: 'Server',
    description: '穩定可靠的網站託管服務，讓你的網站 24/7 全天候運作',
    color: 'text-green-400',
    phaseTag: '數位建置階段',
    services: [
      {
        id: 'nss-hosting-shared',
        title: '共享虛擬主機',
        description: '最經濟實惠的架站方案，適合新創公司官網和小型網站。提供穩定的 Linux/Windows 主機環境。',
        features: ['月費經濟實惠', 'cPanel/Plesk 控制面板', '一鍵安裝 WordPress', '免費 SSL 憑證', '每日自動備份', '99.9% 運作時間保證'],
        recommended: '創業初期的最佳選擇，適合月流量 10 萬以內的網站',
        tips: '創業初期用共享主機即可，等流量成長到需要更多資源時再升級。',
      },
      {
        id: 'nss-hosting-vps',
        title: 'VPS 虛擬專屬主機',
        description: '獨立的虛擬伺服器資源，適合需要更多效能和控制權的成長中企業。',
        features: ['專屬 CPU 和記憶體資源', 'Root 完整管理權限', '可自訂系統環境', '獨立 IP 位址', '彈性升降級', 'SSD 高速儲存'],
        recommended: '適合月流量超過 10 萬或有客製化需求的企業',
        tips: '網站開始有穩定流量後就該考慮升級到 VPS，效能提升很明顯。',
      },
      {
        id: 'nss-hosting-cloud',
        title: '雲端主機服務',
        description: '彈性伸縮的雲端運算服務，適合流量波動大或快速成長的業務。',
        features: ['按用量計費', '自動伸縮擴展', '高可用性架構', '全球節點部署', '即時監控面板', 'API 管理介面'],
        recommended: '適合 SaaS 產品、App 後端或流量波動大的業務',
        tips: '如果你的業務有明顯的流量高低峰（如電商促銷），雲端主機的彈性伸縮很實用。',
      },
      {
        id: 'nss-hosting-wordpress',
        title: 'WordPress 專用主機',
        description: '針對 WordPress 最佳化的主機環境，提供更快的載入速度和專業支援。',
        features: ['WordPress 專屬最佳化環境', '自動更新和安全防護', 'CDN 加速', '每日備份', 'WordPress 專家技術支援', '預裝常用外掛'],
        recommended: '如果你的官網使用 WordPress 架設，強烈建議使用專用主機',
        tips: '搭配本平台的 WordPress 文章發布功能，可以實現內容自動化生產和發布。',
      },
    ],
  },
  {
    id: 'nss-email',
    title: '企業電子郵件',
    icon: 'Mail',
    description: '使用公司域名的專業電子郵件，提升品牌形象和客戶信任度',
    color: 'text-yellow-400',
    phaseTag: '品牌建立階段',
    services: [
      {
        id: 'nss-email-basic',
        title: '企業郵件基本方案',
        description: '以公司域名為後綴的電子郵件服務（如 name@yourcompany.com），提升專業形象。',
        features: ['自訂域名郵箱', '網頁版收發介面', '大容量信箱空間', '垃圾郵件過濾', '支援 POP3/IMAP/SMTP', '行動裝置同步'],
        recommended: '每家公司都應該有！使用公司域名郵箱是專業的基本門檻',
        tips: '立即停止用 Gmail/Yahoo 個人信箱代表公司，企業郵箱是建立信任的第一步。',
      },
      {
        id: 'nss-email-advanced',
        title: '企業郵件進階方案',
        description: '包含行事曆、通訊錄和團隊協作功能的完整企業通訊解決方案。',
        features: ['共享行事曆', '全域通訊錄', '郵件群組和別名', '大附件傳送', '郵件加密', '管理員控制面板', '稽核和合規功能'],
        recommended: '適合 5 人以上團隊，需要郵件協作和管理功能',
        tips: '團隊成長後建議升級到進階方案，共享行事曆和通訊錄能大幅提升協作效率。',
      },
    ],
  },
  {
    id: 'nss-ssl',
    title: 'SSL 憑證與資安服務',
    icon: 'Shield',
    description: '保護網站安全和客戶資料，建立使用者信任的安全基礎',
    color: 'text-red-400',
    phaseTag: '數位建置階段',
    services: [
      {
        id: 'nss-ssl-standard',
        title: '標準 SSL 憑證 (DV)',
        description: '網域驗證型 SSL 憑證，提供基本的 HTTPS 加密，適合一般企業網站。',
        features: ['HTTPS 加密連線', '瀏覽器綠色鎖頭標示', '快速簽發（分鐘內）', 'Google 搜尋排名加分', '256位元加密', '保障客戶資料安全'],
        recommended: '每個網站都必須安裝 SSL 憑證，這是 2024 年的基本要求',
        tips: 'Google 已將 HTTPS 列為搜尋排名因素，沒有 SSL 的網站會被標記為「不安全」。',
      },
      {
        id: 'nss-ssl-ov',
        title: '企業型 SSL 憑證 (OV)',
        description: '組織驗證型 SSL 憑證，需驗證企業身份，適合需要展示企業可信度的商業網站。',
        features: ['企業身份驗證', '顯示公司名稱', '更高的信任等級', '適合 B2B 企業網站', '電子商務安全保障'],
        recommended: '適合 B2B 企業網站和需要展示公司可信度的業務',
        tips: '如果你的網站涉及客戶資料收集或金融交易，建議使用 OV 或 EV 憑證。',
      },
      {
        id: 'nss-ssl-wildcard',
        title: '萬用字元 SSL 憑證',
        description: '保護主域名及所有子域名，適合有多個子網站的企業。',
        features: ['一張憑證保護所有子域名', '如 *.yourcompany.com', '適合多站點架構', '節省管理成本', '支援無限子域名'],
        recommended: '適合有多個子網站（如 blog.、shop.、app.）的企業',
        tips: '如果你計畫建立多個子網站，萬用字元憑證比個別購買更經濟。',
      },
      {
        id: 'nss-security-waf',
        title: '網站應用程式防火牆 (WAF)',
        description: '進階網站安全防護，防禦 SQL 注入、XSS、DDoS 等常見網路攻擊。',
        features: ['即時威脅偵測', '阻擋惡意流量', 'DDoS 防護', 'SQL 注入防護', 'XSS 攻擊防護', '安全報表和分析'],
        recommended: '適合電商網站、會員系統或處理敏感資料的應用',
        tips: '隨著業務成長，網站會成為攻擊目標。WAF 是保護你的客戶資料和業務的重要投資。',
      },
    ],
  },
  {
    id: 'nss-design',
    title: '網站設計與開發',
    icon: 'PenTool',
    description: '專業的網站設計和開發服務，打造符合品牌形象的企業官網',
    color: 'text-purple-400',
    phaseTag: '品牌建立階段',
    services: [
      {
        id: 'nss-design-corporate',
        title: '企業形象網站設計',
        description: '量身打造專業的企業形象網站，展現品牌特色和企業實力。',
        features: ['客製化視覺設計', '響應式行動裝置適配', 'SEO 基礎優化', '內容管理系統 (CMS)', '聯絡表單和地圖', '社群媒體整合', '多語言支援'],
        recommended: '適合需要專業形象網站但沒有技術團隊的創業者',
        tips: '一個好的企業官網是你的線上門面，值得投資專業設計。可以搭配 WordPress 方便後續自行更新內容。',
      },
      {
        id: 'nss-design-ecommerce',
        title: '電子商務網站開發',
        description: '功能完整的電商網站，從商品展示到金流串接一站完成。',
        features: ['商品管理系統', '購物車和結帳流程', '金流串接（信用卡/超商/轉帳）', '物流串接', '訂單管理後台', '會員系統', '優惠券和促銷功能', '銷售報表'],
        recommended: '適合需要線上銷售實體或數位商品的創業者',
        tips: '電商網站的關鍵是結帳流程要簡單順暢，每多一個步驟就會流失 20% 的客戶。',
      },
      {
        id: 'nss-design-landing',
        title: '行銷著陸頁設計',
        description: '高轉換率的行銷著陸頁，專為廣告投放和活動推廣設計。',
        features: ['高轉換率設計', '呼叫行動 (CTA) 優化', 'A/B 測試支援', '表單和名單收集', '追蹤碼整合', '快速載入優化'],
        recommended: '適合投放數位廣告、舉辦活動或需要收集潛在客戶名單的企業',
        tips: '好的著陸頁專注在一個目標、一個行動呼籲，不要把太多資訊塞在一頁。',
      },
      {
        id: 'nss-design-app',
        title: 'Web 應用程式開發',
        description: '客製化的 Web 應用程式開發，包含前後端開發和 API 整合。',
        features: ['前端 React/Vue 開發', '後端 API 開發', '資料庫設計', '第三方 API 整合', '使用者驗證和權限', '效能優化'],
        recommended: '適合需要開發 SaaS 產品或客製化系統的企業',
        tips: '如果你的核心業務是技術產品，建議自建技術團隊。但初期可以先外包 MVP 驗證市場。',
      },
    ],
  },
  {
    id: 'nss-marketing',
    title: '數位行銷服務',
    icon: 'Megaphone',
    description: '全方位數位行銷支援，幫助你的品牌被目標客群看見',
    color: 'text-orange-400',
    phaseTag: '客戶開發階段',
    services: [
      {
        id: 'nss-marketing-seo',
        title: 'SEO 搜尋引擎優化',
        description: '專業的 SEO 優化服務，提升網站在 Google 搜尋結果的排名。',
        features: ['關鍵字研究和策略', '站內 SEO 優化', '技術 SEO 改善', '內容策略規劃', '外部連結建設', '每月排名報告', '競爭對手分析'],
        recommended: '適合想要長期獲得自然搜尋流量的企業，SEO 是成本效益最高的行銷方式',
        tips: 'SEO 是長期投資，通常 3-6 個月才會看到成效，但效果是持續累積的。',
      },
      {
        id: 'nss-marketing-ads',
        title: '廣告代操服務（Google/Meta）',
        description: '專業的數位廣告投放和優化服務，最大化你的廣告投資報酬率。',
        features: ['Google Ads 關鍵字廣告', 'Meta (FB/IG) 廣告投放', '受眾分析和定位', '廣告素材設計', 'A/B 測試和優化', '每月成效報告', 'ROAS 追蹤和優化'],
        recommended: '適合想要快速獲得曝光和客戶但不熟悉廣告投放的創業者',
        tips: '初期可以小預算測試，找到 ROAS > 3 的廣告組合再放大投入。',
      },
      {
        id: 'nss-marketing-social',
        title: '社群媒體經營',
        description: '社群媒體帳號經營和內容管理服務，建立品牌的社群影響力。',
        features: ['社群內容策略規劃', '貼文設計和撰寫', '社群互動管理', '粉絲成長策略', '社群數據分析', '網紅/KOL 合作媒合'],
        recommended: '適合沒有專職社群人員但需要經營社群的企業',
        tips: '社群經營最重要的是持續和真實，選擇最適合你品牌調性的平台深耕。',
      },
      {
        id: 'nss-marketing-content',
        title: '內容行銷服務',
        description: '專業的內容創作和行銷策略，搭配本平台的 AI 文章生成功能。',
        features: ['內容策略規劃', '文章撰寫和編輯', 'SEO 文章優化', '部落格經營', '電子報規劃', '搭配 AI 文章生成平台'],
        recommended: '搭配本平台使用，用 AI 生成初稿，由專業編輯潤色修改，事半功倍',
        tips: '利用本平台的 AI 文章生成功能產出初稿，再搭配戰國策的內容編輯服務進行優化和發布。',
      },
    ],
  },
  {
    id: 'nss-server',
    title: '實體伺服器與機房服務',
    icon: 'HardDrive',
    description: '企業級的實體伺服器和機房託管服務，適合高效能和高安全性需求',
    color: 'text-slate-400',
    phaseTag: '成長擴展階段',
    services: [
      {
        id: 'nss-server-dedicated',
        title: '實體專屬伺服器',
        description: '完全獨佔的實體伺服器，提供最高效能和完整控制權。',
        features: ['專屬硬體資源', '最高效能表現', '完全 Root 權限', '客製化硬體配置', '24/7 硬體監控', '快速硬體更換'],
        recommended: '適合大型電商、高流量網站或有特殊效能需求的企業',
        tips: '除非你有明確的高效能需求，否則 VPS 或雲端主機在大多數情況下已經足夠。',
      },
      {
        id: 'nss-server-colocation',
        title: '主機代管/機房託管',
        description: '將你自己的伺服器託管在專業機房，享受電信級的網路和電力環境。',
        features: ['專業機房環境', '不斷電系統 (UPS)', '恆溫恆濕控管', '多線路網路', '24/7 實體安全', '遠端 KVM 管理'],
        recommended: '適合有自有伺服器但需要專業機房環境的企業',
        tips: '自建機房的成本遠高於託管，除非有特殊法規要求，否則建議使用託管服務。',
      },
    ],
  },
];

// 戰國策服務與創業階段的對應關係
export const nssPhaseMapping: Record<string, string[]> = {
  'mindset': [],
  'market': [],
  'legal': ['nss-domain'],
  'finance': [],
  'branding': ['nss-domain', 'nss-email', 'nss-design', 'nss-marketing'],
  'product': ['nss-hosting', 'nss-ssl', 'nss-design'],
  'team': ['nss-email'],
  'digital': ['nss-hosting', 'nss-email', 'nss-ssl', 'nss-design'],
  'sales': ['nss-marketing'],
  'growth': ['nss-server', 'nss-hosting', 'nss-marketing'],
};
