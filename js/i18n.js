/* ============================================================
   i18n — ko / en / ja / zh / fr
============================================================ */
const LANG_STORAGE_KEY = 'chunjik.lang';
const SUPPORTED_LANGS = ['ko', 'en', 'ja', 'zh', 'fr'];

const LANG_META = {
  ko: { label: '한국어', short: 'KO', chatName: 'Korean' },
  en: { label: 'English', short: 'EN', chatName: 'English' },
  ja: { label: '日本語', short: 'JA', chatName: 'Japanese' },
  zh: { label: '中文', short: 'ZH', chatName: 'Simplified Chinese' },
  fr: { label: 'Français', short: 'FR', chatName: 'French' },
};

const I18N_STRINGS = {
  ko: {
    'meta.title': 'AI41 | 한 사람을 위한 AI · 스카이 · 뉴로크래프트',
    'meta.desc': '자폐·신경다양성을 위한 저자극 AI 스카이, DEI 데이터 아웃소싱 뉴로크래프트. 사회적기업 창업지원사업 선정 AI41이 만듭니다.',
    'badge.prep': '사회적기업 창업지원사업 선정',
    'nav.home': '홈',
    'nav.mission': '미션',
    'nav.products': '제품',
    'nav.impact': '임팩트',
    'nav.achievements': '성과',
    'nav.partners': '파트너',
    'nav.contact': '문의',
    'nav.aria': '사이트 섹션',
    'lang.aria': '언어 선택',
    'lang.switched': '언어를 바꿨어요.',
    'hero.line': '한 사람을 위한 AI',
    'hero.lead': '신경다양성 당사자와 가족을 위한 AI를 만들고,<br>AI 시대의 새 일자리와 창작 기회를 여는 사회적기업입니다.',
    'hero.try': '스카이 체험',
    'hero.intro': '도입 문의',
    'hero.hint': '오른쪽 스카이에게 말해주세요. ',
    'ask.try': '스카이 체험하고 싶어',
    'ask.intro': '기관 도입 문의하고 싶어',
    'ask.skyUse': '스카이 써볼래',
    'ask.poc': '뉴로크래프트 PoC 문의하고 싶어',
    'mission.h2': '우리가 지키는 것',
    'mission.sub': '사람을 대체하지 않고, 한 사람의 가능성에 응답합니다.',
    'mission.human': '사람이 먼저',
    'mission.opp': '기회를 모두에게',
    'mission.create': '함께 만든다',
    'mission.build': '실행으로 증명',
    'mission.global': '처음부터 세계로',
    'products.h2': '스카이 · 뉴로크래프트',
    'products.sub': '두 제품으로 일상 지원과 질적 고용을 함께 만듭니다.',
    'sky.h3': '저자극 AI Companion',
    'sky.p': '신경다양성 당사자·가족을 위한 일상 지원 AI',
    'sky.f1': '사회성', 'sky.f2': '루틴', 'sky.f3': '감정조절', 'sky.f4': '의사소통', 'sky.f5': '미니게임', 'sky.f6': '타로',
    'sky.cta': '체험하기',
    'nc.h3': 'Managed AI Workforce',
    'nc.p': '신경다양성 Managed 3+1 팀의 데이터·크리에이티브 아웃소싱',
    'nc.f1': '데이터 검수', 'nc.f2': '크리에이티브', 'nc.cta': 'PoC 문의',
    'impact.h2': '숫자로 보는 AI41',
    'impact.founded': '설립',
    'impact.demo': '스카이 시연',
    'impact.comm': '커뮤니티',
    'impact.verify': '검증 참여',
    'achieve.h2': '성과와 생태계',
    'achieve.nia': '공공·디지털 생태계 연계',
    'achieve.kakao': '카카오 AI 생태계',
    'achieve.kakao.p': 'MCP · 수어 등 AI 확장 실험',
    'achieve.expo': '오티즘엑스포',
    'achieve.expo.p': '스카이 공개 시연',
    'achieve.social': '사회적기업 창업지원사업 선정',
    'achieve.social.p': '창업지원 · 임팩트',
    'partners.h2': '연대 허브',
    'contact.h2': '함께할까요?',
    'contact.sub': '학교·센터 도입, PoC, 파트너십 — 오른쪽 스카이에게 말씀해 주시면 문의를 받아 메일로 전달합니다.',
    'contact.mailBtn': '메일 문의 시작',
    'contact.hint': '접수: ai41@ai41.kr',
    'footer.corp': '주식회사 AI41 · AI FOR ONE · 서울 · 설립 2025.08.07',
    'footer.disclaimer': '스카이는 치료·진단을 대체하지 않는 보조 도구입니다.',
    'sky.status': '안녕! 나는 스카이야',
    'sky.placeholder': '스카이에게 말 걸어봐...',
    'sky.greet': '말 걸어봐!',
    'sky.newChat': '새로운 대화 시작!',
    'route.tarot': '타로로 갈게!',
    'route.social': '사회성 연습으로 갈게!',
    'route.picture': '그림 말하기로 이동할게!',
    'route.regulation': '행동 조절 화면으로 이동할게!',
    'route.routine': '루틴 관리로 이동할게!',
    'route.games': '미니게임으로 이동할게!',
    'sky.apiKey': 'API 키',
    'fab.home': '홈으로',
    'fab.aboutAi41': 'AI41 소개',
    'fab.aboutSky': '스카이 소개',
    'fab.tarot': '타로 보기',
    'fab.social': '사회성 연습',
    'fab.picture': '그림 말하기',
    'fab.regulation': '행동 조절',
    'fab.routine': '루틴 관리',
    'fab.games': '미니게임',
    'fab.privacy': '개인정보',
    'fab.guardian': '보호자 보기',
    'inq.start': '도입·상담 문의를 도와드릴게요. 먼저 개인이신가요, 단체(법인)이신가요? (취소라고 하시면 중단해요)',
    'inq.typeRetry': '「개인」또는 「단체(법인)」으로 답해 주세요.',
    'inq.affPerson': '알겠어요. 소속이나 이름을 알려 주세요. (예: 프리랜서, 보호자, 관심 있는 분)',
    'inq.affOrg': '알겠어요. 소속 기관·법인명을 알려 주세요.',
    'inq.affRetry': '소속을 한두 글자 이상 적어 주세요.',
    'inq.message': '어떤 내용으로 문의하시나요? 도입·PoC·파트너십 등 편하게 적어 주세요.',
    'inq.msgRetry': '문의 내용을 조금만 더 적어 주시면 전달하기 좋아요.',
    'inq.contact': '마지막으로, 회신 받으실 이메일(또는 전화번호)을 알려 주세요.',
    'inq.contactRetry': '회신 가능한 이메일이나 전화번호를 적어 주세요.',
    'inq.sending': '말씀해 주신 내용을 모아 ai41@ai41.kr 로 보내는 중이에요…',
    'inq.sent': '접수했어요. ai41@ai41.kr 로 메일을 보냈고, 확인되는 대로 회신드릴게요.',
    'inq.fail': '메일 전송에 실패했어요. 잠시 후 다시 「도입 문의」를 말해 주세요.',
    'inq.cancel': '문의를 취소했어요. 나중에 다시 「도입 문의」라고 말해 주세요.',
    'inq.noServer': '지금은 문의 전송 서버에 연결되지 않았어요. 잠시 후 다시 시도해 주세요.',
    'kind.person': '개인',
    'kind.org': '단체(법인)',
  },
  en: {
    'meta.title': 'AI41 | AI for One · Sky · NeuroCraft',
    'meta.desc': 'Low-stimulus AI Sky for autism and neurodiversity, and NeuroCraft DEI data outsourcing — by AI41, selected for the Social Enterprise Startup Support Program.',
    'badge.prep': 'Selected: Social Enterprise Startup Support',
    'nav.home': 'Home',
    'nav.mission': 'Mission',
    'nav.products': 'Products',
    'nav.impact': 'Impact',
    'nav.achievements': 'Achievements',
    'nav.partners': 'Partners',
    'nav.contact': 'Contact',
    'nav.aria': 'Site sections',
    'lang.aria': 'Language',
    'lang.switched': 'Language updated.',
    'hero.line': 'AI for One',
    'hero.lead': 'We build AI for neurodivergent people and families,<br>and open new jobs and creative opportunities in the AI era.',
    'hero.try': 'Try Sky',
    'hero.intro': 'Ask about adoption',
    'hero.hint': 'Talk to Sky on the right. ',
    'ask.try': 'I want to try Sky',
    'ask.intro': 'I want to ask about institutional adoption',
    'ask.skyUse': 'Let me try Sky',
    'ask.poc': 'I want to ask about a NeuroCraft PoC',
    'mission.h2': 'What we stand for',
    'mission.sub': 'We do not replace people — we answer one person’s potential.',
    'mission.human': 'People first',
    'mission.opp': 'Opportunity for all',
    'mission.create': 'Create together',
    'mission.build': 'Prove by building',
    'mission.global': 'Global by default',
    'products.h2': 'Sky · NeuroCraft',
    'products.sub': 'Everyday support and quality employment in two products.',
    'sky.h3': 'Low-stimulus AI Companion',
    'sky.p': 'Daily-support AI for neurodivergent people and families',
    'sky.f1': 'Social', 'sky.f2': 'Routine', 'sky.f3': 'Regulation', 'sky.f4': 'Communication', 'sky.f5': 'Games', 'sky.f6': 'Tarot',
    'sky.cta': 'Try it',
    'nc.h3': 'Managed AI Workforce',
    'nc.p': 'Data and creative outsourcing with a Managed 3+1 neurodiversity team',
    'nc.f1': 'Data QA', 'nc.f2': 'Creative', 'nc.cta': 'PoC inquiry',
    'impact.h2': 'AI41 in numbers',
    'impact.founded': 'Founded',
    'impact.demo': 'Sky demo',
    'impact.comm': 'Community',
    'impact.verify': 'Validation',
    'achieve.h2': 'Outcomes & ecosystem',
    'achieve.nia': 'Public–digital ecosystem links',
    'achieve.kakao': 'Kakao AI ecosystem',
    'achieve.kakao.p': 'MCP, sign language, and AI experiments',
    'achieve.expo': 'Autism Expo',
    'achieve.expo.p': 'Public Sky demo',
    'achieve.social': 'Social Enterprise Startup Support',
    'achieve.social.p': 'Startup support · Impact',
    'partners.h2': 'Solidarity hub',
    'contact.h2': 'Shall we work together?',
    'contact.sub': 'School/clinic adoption, PoC, partnerships — tell Sky on the right and we will email your inquiry.',
    'contact.mailBtn': 'Start email inquiry',
    'contact.hint': 'Inbox: ai41@ai41.kr',
    'footer.corp': 'AI41 Inc. · AI FOR ONE · Seoul · Founded 2025.08.07',
    'footer.disclaimer': 'Sky is a support tool and does not replace treatment or diagnosis.',
    'sky.status': 'Hi! I am Sky',
    'sky.placeholder': 'Say something to Sky...',
    'sky.greet': 'Say hi!',
    'sky.newChat': 'New chat started!',
    'route.tarot': 'Opening tarot!',
    'route.social': 'Opening social practice!',
    'route.picture': 'Opening picture talk!',
    'route.regulation': 'Opening regulation tools!',
    'route.routine': 'Opening routines!',
    'route.games': 'Opening mini-games!',
    'sky.apiKey': 'API key',
    'fab.home': 'Home',
    'fab.aboutAi41': 'About AI41',
    'fab.aboutSky': 'About Sky',
    'fab.tarot': 'Tarot',
    'fab.social': 'Social practice',
    'fab.picture': 'Picture talk',
    'fab.regulation': 'Regulation',
    'fab.routine': 'Routines',
    'fab.games': 'Mini-games',
    'fab.privacy': 'Privacy',
    'fab.guardian': 'Guardian view',
    'inq.start': 'I can help with an adoption inquiry. Are you an individual or an organization? (Say cancel to stop.)',
    'inq.typeRetry': 'Please answer Individual or Organization.',
    'inq.affPerson': 'Got it. What is your name or affiliation?',
    'inq.affOrg': 'Got it. What is your organization name?',
    'inq.affRetry': 'Please enter at least a short affiliation.',
    'inq.message': 'What would you like to ask about? Adoption, PoC, partnership — anything.',
    'inq.msgRetry': 'Please add a little more detail so we can forward it.',
    'inq.contact': 'Lastly, what email or phone should we reply to?',
    'inq.contactRetry': 'Please share a reply email or phone number.',
    'inq.sending': 'Sending your inquiry to ai41@ai41.kr…',
    'inq.sent': 'Received. We emailed ai41@ai41.kr and will reply when we can.',
    'inq.fail': 'Sending failed. Please say “adoption inquiry” again later.',
    'inq.cancel': 'Canceled. Say “adoption inquiry” anytime to restart.',
    'inq.noServer': 'The inquiry server is unavailable right now. Please try again later.',
    'kind.person': 'Individual',
    'kind.org': 'Organization',
  },
  ja: {
    'meta.title': 'AI41 | 一人のためのAI · スカイ · ニューロクラフト',
    'meta.desc': '自閉・ニューロダイバーシティ向け低刺激AIスカイと、DEIデータアウトソーシングのニューロクラフト。社会的企業創業支援事業に選定されたAI41。',
    'badge.prep': '社会的企業 創業支援事業 選定',
    'nav.home': 'ホーム',
    'nav.mission': 'ミッション',
    'nav.products': 'プロダクト',
    'nav.impact': 'インパクト',
    'nav.achievements': '成果',
    'nav.partners': 'パートナー',
    'nav.contact': 'お問い合わせ',
    'nav.aria': 'サイトセクション',
    'lang.aria': '言語',
    'lang.switched': '言語を切り替えました。',
    'hero.line': '一人のためのAI',
    'hero.lead': 'ニューロダイバーシティの当事者と家族のためのAIを作り、<br>AI時代の新しい仕事と創作の機会を開く社会的企業です。',
    'hero.try': 'スカイを体験',
    'hero.intro': '導入の相談',
    'hero.hint': '右のスカイに話しかけてください。 ',
    'ask.try': 'スカイを体験したい',
    'ask.intro': '機関導入について相談したい',
    'ask.skyUse': 'スカイを使ってみたい',
    'ask.poc': 'ニューロクラフトのPoCについて聞きたい',
    'mission.h2': '私たちが守ること',
    'mission.sub': '人を置き換えず、一人の可能性に応えます。',
    'mission.human': '人が先',
    'mission.opp': '機会をすべての人へ',
    'mission.create': '共につくる',
    'mission.build': '実行で示す',
    'mission.global': 'はじめから世界へ',
    'products.h2': 'スカイ · ニューロクラフト',
    'products.sub': '日常支援と質の高い雇用を、二つのプロダクトで。',
    'sky.h3': '低刺激AIコンパニオン',
    'sky.p': '当事者・家族の日常を支えるAI',
    'sky.f1': '社会性', 'sky.f2': 'ルーチン', 'sky.f3': '感情調整', 'sky.f4': 'コミュニケーション', 'sky.f5': 'ミニゲーム', 'sky.f6': 'タロット',
    'sky.cta': '体験する',
    'nc.h3': 'Managed AI Workforce',
    'nc.p': 'Managed 3+1チームによるデータ・クリエイティブ・アウトソーシング',
    'nc.f1': 'データ検収', 'nc.f2': 'クリエイティブ', 'nc.cta': 'PoC相談',
    'impact.h2': '数字で見るAI41',
    'impact.founded': '設立',
    'impact.demo': 'スカイ実証',
    'impact.comm': 'コミュニティ',
    'impact.verify': '検証参加',
    'achieve.h2': '成果とエコシステム',
    'achieve.nia': '公共・デジタル連携',
    'achieve.kakao': 'カカオAIエコシステム',
    'achieve.kakao.p': 'MCP・手話などAI拡張の実験',
    'achieve.expo': 'オティズムエキスポ',
    'achieve.expo.p': 'スカイ公開デモ',
    'achieve.social': '社会的企業 創業支援事業 選定',
    'achieve.social.p': '創業支援 · インパクト',
    'partners.h2': '連帯ハブ',
    'contact.h2': '一緒にやりませんか？',
    'contact.sub': '学校・センター導入、PoC、パートナーシップ — 右のスカイに話すと、内容をメールで届けます。',
    'contact.mailBtn': 'メール相談を開始',
    'contact.hint': '受付: ai41@ai41.kr',
    'footer.corp': '株式会社AI41 · AI FOR ONE · ソウル · 設立 2025.08.07',
    'footer.disclaimer': 'スカイは治療・診断の代替ではありません。',
    'sky.status': 'こんにちは！スカイです',
    'sky.placeholder': 'スカイに話しかけて…',
    'sky.greet': '話しかけてね！',
    'sky.newChat': '新しい会話を開始！',
    'route.tarot': 'タロットを開くね！',
    'route.social': '社会性練習を開くね！',
    'route.picture': '絵で話すへ移動するね！',
    'route.regulation': '行動調整を開くね！',
    'route.routine': 'ルーチンを開くね！',
    'route.games': 'ミニゲームを開くね！',
    'sky.apiKey': 'APIキー',
    'fab.home': 'ホームへ',
    'fab.aboutAi41': 'AI41について',
    'fab.aboutSky': 'スカイについて',
    'fab.tarot': 'タロット',
    'fab.social': '社会性練習',
    'fab.picture': '絵で話す',
    'fab.regulation': '行動調整',
    'fab.routine': 'ルーチン',
    'fab.games': 'ミニゲーム',
    'fab.privacy': 'プライバシー',
    'fab.guardian': '保護者ビュー',
    'inq.start': '導入のご相談をお手伝いします。個人ですか、団体（法人）ですか？（「キャンセル」で中止）',
    'inq.typeRetry': '「個人」または「団体（法人）」で答えてください。',
    'inq.affPerson': 'わかりました。所属やお名前を教えてください。',
    'inq.affOrg': 'わかりました。機関・法人名を教えてください。',
    'inq.affRetry': '所属を短くでも書いてください。',
    'inq.message': 'ご相談内容を教えてください。導入・PoC・パートナーなど自由に。',
    'inq.msgRetry': 'もう少し詳しく書いていただけると助かります。',
    'inq.contact': '最後に、返信先のメール（または電話）を教えてください。',
    'inq.contactRetry': '返信可能なメールか電話を書いてください。',
    'inq.sending': '内容をまとめて ai41@ai41.kr に送信中です…',
    'inq.sent': '受け付けました。ai41@ai41.kr に送付し、確認次第ご返信します。',
    'inq.fail': '送信に失敗しました。後でもう一度「導入相談」と言ってください。',
    'inq.cancel': 'キャンセルしました。また「導入相談」と言ってください。',
    'inq.noServer': '今は送信サーバーに接続できません。後でもう一度お試しください。',
    'kind.person': '個人',
    'kind.org': '団体（法人）',
  },
  zh: {
    'meta.title': 'AI41 | 为一个人而做的AI · Sky · NeuroCraft',
    'meta.desc': '面向自闭与神经多样性的低刺激AI Sky，以及DEI数据外包 NeuroCraft。由获选社会企业创业支持项目的 AI41 打造。',
    'badge.prep': '社会企业创业支持项目 入选',
    'nav.home': '首页',
    'nav.mission': '使命',
    'nav.products': '产品',
    'nav.impact': '影响',
    'nav.achievements': '成果',
    'nav.partners': '合作伙伴',
    'nav.contact': '联系',
    'nav.aria': '站点栏目',
    'lang.aria': '语言',
    'lang.switched': '已切换语言。',
    'hero.line': '为一个人而做的AI',
    'hero.lead': '我们为神经多样性当事人与家庭打造AI，<br>并在AI时代创造新的就业与创作机会。',
    'hero.try': '体验 Sky',
    'hero.intro': '机构引入咨询',
    'hero.hint': '请与右侧的 Sky 对话。 ',
    'ask.try': '想体验一下 Sky',
    'ask.intro': '想咨询机构引入',
    'ask.skyUse': '想试用 Sky',
    'ask.poc': '想咨询 NeuroCraft PoC',
    'mission.h2': '我们坚持的事',
    'mission.sub': '不替代人，而是回应每一个人的可能性。',
    'mission.human': '人优先',
    'mission.opp': '机会面向所有人',
    'mission.create': '一起创造',
    'mission.build': '用行动证明',
    'mission.global': '从一开始面向世界',
    'products.h2': 'Sky · NeuroCraft',
    'products.sub': '用两款产品同时做日常支持与优质就业。',
    'sky.h3': '低刺激 AI Companion',
    'sky.p': '面向当事人与家庭的日常支持AI',
    'sky.f1': '社交', 'sky.f2': '节奏', 'sky.f3': '情绪调节', 'sky.f4': '沟通', 'sky.f5': '小游戏', 'sky.f6': '塔罗',
    'sky.cta': '去体验',
    'nc.h3': 'Managed AI Workforce',
    'nc.p': 'Managed 3+1 团队的数据与创意外包',
    'nc.f1': '数据质检', 'nc.f2': '创意', 'nc.cta': 'PoC 咨询',
    'impact.h2': '数字看 AI41',
    'impact.founded': '成立',
    'impact.demo': 'Sky 演示',
    'impact.comm': '社区',
    'impact.verify': '验证参与',
    'achieve.h2': '成果与生态',
    'achieve.nia': '公共与数字生态连接',
    'achieve.kakao': 'Kakao AI 生态',
    'achieve.kakao.p': 'MCP、手语等 AI 扩展实验',
    'achieve.expo': '自闭症博览会',
    'achieve.expo.p': 'Sky 公开演示',
    'achieve.social': '社会企业创业支持项目 入选',
    'achieve.social.p': '创业支持 · 影响',
    'partners.h2': '连带枢纽',
    'contact.h2': '一起合作吗？',
    'contact.sub': '学校/中心引入、PoC、伙伴合作 — 告诉右侧 Sky，我们会把咨询发送到邮箱。',
    'contact.mailBtn': '开始邮件咨询',
    'contact.hint': '收件：ai41@ai41.kr',
    'footer.corp': 'AI41株式会社 · AI FOR ONE · 首尔 · 成立 2025.08.07',
    'footer.disclaimer': 'Sky 是辅助工具，不替代治疗或诊断。',
    'sky.status': '你好！我是 Sky',
    'sky.placeholder': '和 Sky 说点什么…',
    'sky.greet': '跟我说句话吧！',
    'sky.newChat': '新对话已开始！',
    'route.tarot': '打开塔罗！',
    'route.social': '打开社交练习！',
    'route.picture': '打开图画表达！',
    'route.regulation': '打开行为调节！',
    'route.routine': '打开日程管理！',
    'route.games': '打开小游戏！',
    'sky.apiKey': 'API 密钥',
    'fab.home': '回首页',
    'fab.aboutAi41': '关于 AI41',
    'fab.aboutSky': '关于 Sky',
    'fab.tarot': '塔罗',
    'fab.social': '社交练习',
    'fab.picture': '图画表达',
    'fab.regulation': '行为调节',
    'fab.routine': '日程管理',
    'fab.games': '小游戏',
    'fab.privacy': '隐私',
    'fab.guardian': '监护人视图',
    'inq.start': '我可以帮你做引入咨询。您是个人，还是团体（法人）？（说“取消”可停止）',
    'inq.typeRetry': '请回答「个人」或「团体（法人）」。',
    'inq.affPerson': '好的。请告诉我您的姓名或所属。',
    'inq.affOrg': '好的。请告诉我机构或法人名称。',
    'inq.affRetry': '请至少简短填写所属。',
    'inq.message': '想咨询什么？引入、PoC、合作都可以。',
    'inq.msgRetry': '请再补充一点内容，方便我们转发。',
    'inq.contact': '最后，请留下方便回复的邮箱或电话。',
    'inq.contactRetry': '请填写可回复的邮箱或电话。',
    'inq.sending': '正在汇总并发送到 ai41@ai41.kr…',
    'inq.sent': '已收到。邮件已发到 ai41@ai41.kr，确认后会回复。',
    'inq.fail': '发送失败。请稍后再说「引入咨询」。',
    'inq.cancel': '已取消。之后可以说「引入咨询」重新开始。',
    'inq.noServer': '目前无法连接咨询服务器，请稍后再试。',
    'kind.person': '个人',
    'kind.org': '团体（法人）',
  },
  fr: {
    'meta.title': 'AI41 | Une IA pour une personne · Sky · NeuroCraft',
    'meta.desc': 'Sky, IA à faible stimulation pour l’autisme et la neurodiversité, et NeuroCraft pour l’externalisation DEI — par AI41, sélectionné au programme d’appui au démarrage des entreprises sociales.',
    'badge.prep': 'Sélection : appui démarrage entreprise sociale',
    'nav.home': 'Accueil',
    'nav.mission': 'Mission',
    'nav.products': 'Produits',
    'nav.impact': 'Impact',
    'nav.achievements': 'Résultats',
    'nav.partners': 'Partenaires',
    'nav.contact': 'Contact',
    'nav.aria': 'Sections du site',
    'lang.aria': 'Langue',
    'lang.switched': 'Langue mise à jour.',
    'hero.line': 'Une IA pour une personne',
    'hero.lead': 'Nous créons une IA pour les personnes neurodivergentes et leurs familles,<br>et ouvrons de nouveaux emplois et espaces créatifs à l’ère de l’IA.',
    'hero.try': 'Essayer Sky',
    'hero.intro': 'Demande d’adoption',
    'hero.hint': 'Parlez à Sky à droite. ',
    'ask.try': 'Je veux essayer Sky',
    'ask.intro': 'Je veux demander une adoption institutionnelle',
    'ask.skyUse': 'Laisse-moi essayer Sky',
    'ask.poc': 'Je veux un PoC NeuroCraft',
    'mission.h2': 'Ce que nous défendons',
    'mission.sub': 'Nous ne remplaçons pas les personnes — nous répondons au potentiel de chacun.',
    'mission.human': 'Les personnes d’abord',
    'mission.opp': 'Des opportunités pour tous',
    'mission.create': 'Créer ensemble',
    'mission.build': 'Prouver en construisant',
    'mission.global': 'Global dès le départ',
    'products.h2': 'Sky · NeuroCraft',
    'products.sub': 'Soutien du quotidien et emploi de qualité en deux produits.',
    'sky.h3': 'Compagnon IA à faible stimulation',
    'sky.p': 'IA de soutien quotidien pour les personnes neurodivergentes et les familles',
    'sky.f1': 'Social', 'sky.f2': 'Routine', 'sky.f3': 'Régulation', 'sky.f4': 'Communication', 'sky.f5': 'Jeux', 'sky.f6': 'Tarot',
    'sky.cta': 'Essayer',
    'nc.h3': 'Managed AI Workforce',
    'nc.p': 'Externalisation data et créative avec une équipe Managed 3+1',
    'nc.f1': 'QA data', 'nc.f2': 'Créatif', 'nc.cta': 'Demande PoC',
    'impact.h2': 'AI41 en chiffres',
    'impact.founded': 'Création',
    'impact.demo': 'Démo Sky',
    'impact.comm': 'Communauté',
    'impact.verify': 'Validation',
    'achieve.h2': 'Résultats et écosystème',
    'achieve.nia': 'Liens public–numérique',
    'achieve.kakao': 'Écosystème Kakao AI',
    'achieve.kakao.p': 'MCP, langue des signes et expérimentations IA',
    'achieve.expo': 'Autism Expo',
    'achieve.expo.p': 'Démo publique de Sky',
    'achieve.social': 'Appui démarrage entreprise sociale',
    'achieve.social.p': 'Soutien startup · Impact',
    'partners.h2': 'Hub de solidarité',
    'contact.h2': 'On avance ensemble ?',
    'contact.sub': 'Adoption école/centre, PoC, partenariats — dites-le à Sky à droite, nous enverrons l’e-mail.',
    'contact.mailBtn': 'Démarrer la demande e-mail',
    'contact.hint': 'Boîte : ai41@ai41.kr',
    'footer.corp': 'AI41 Inc. · AI FOR ONE · Séoul · Fondée le 2025.08.07',
    'footer.disclaimer': 'Sky est un outil de soutien et ne remplace ni traitement ni diagnostic.',
    'sky.status': 'Salut ! Je suis Sky',
    'sky.placeholder': 'Parle à Sky…',
    'sky.greet': 'Dis-moi quelque chose !',
    'sky.newChat': 'Nouvelle conversation !',
    'route.tarot': 'Ouverture du tarot !',
    'route.social': 'Ouverture de la pratique sociale !',
    'route.picture': 'Ouverture du parler en images !',
    'route.regulation': 'Ouverture des outils de régulation !',
    'route.routine': 'Ouverture des routines !',
    'route.games': 'Ouverture des mini-jeux !',
    'sky.apiKey': 'Clé API',
    'fab.home': 'Accueil',
    'fab.aboutAi41': 'À propos d’AI41',
    'fab.aboutSky': 'À propos de Sky',
    'fab.tarot': 'Tarot',
    'fab.social': 'Pratique sociale',
    'fab.picture': 'Parler en images',
    'fab.regulation': 'Régulation',
    'fab.routine': 'Routines',
    'fab.games': 'Mini-jeux',
    'fab.privacy': 'Confidentialité',
    'fab.guardian': 'Vue parent/tuteur',
    'inq.start': 'Je peux vous aider pour une demande d’adoption. Êtes-vous un particulier ou une organisation ? (Dites annuler pour arrêter.)',
    'inq.typeRetry': 'Répondez Particulier ou Organisation.',
    'inq.affPerson': 'D’accord. Quel est votre nom ou votre affiliation ?',
    'inq.affOrg': 'D’accord. Quel est le nom de l’organisation ?',
    'inq.affRetry': 'Indiquez au moins une courte affiliation.',
    'inq.message': 'De quoi souhaitez-vous parler ? Adoption, PoC, partenariat…',
    'inq.msgRetry': 'Ajoutez un peu plus de détail pour transmettre le message.',
    'inq.contact': 'Enfin, quel e-mail ou téléphone pour vous répondre ?',
    'inq.contactRetry': 'Indiquez un e-mail ou un téléphone de réponse.',
    'inq.sending': 'Envoi de votre demande à ai41@ai41.kr…',
    'inq.sent': 'Reçu. L’e-mail a été envoyé à ai41@ai41.kr ; nous répondrons dès que possible.',
    'inq.fail': 'Échec de l’envoi. Dites à nouveau « demande d’adoption » plus tard.',
    'inq.cancel': 'Annulé. Dites « demande d’adoption » pour recommencer.',
    'inq.noServer': 'Le serveur de contact est indisponible. Réessayez plus tard.',
    'kind.person': 'Particulier',
    'kind.org': 'Organisation',
  },
};

let currentLang = 'ko';

function t(key, fallback) {
  const pack = I18N_STRINGS[currentLang] || I18N_STRINGS.ko;
  return pack[key] ?? I18N_STRINGS.ko[key] ?? fallback ?? key;
}

function getLangChatName(lang = currentLang) {
  return LANG_META[lang]?.chatName || 'Korean';
}

function applyI18n() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : currentLang;
  document.title = t('meta.title');
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('meta.desc'));

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    if (el.getAttribute('data-i18n-html') === '1') el.innerHTML = t(key);
    else el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });

  document.querySelectorAll('[data-i18n-ask]').forEach((el) => {
    el.setAttribute('data-ask-sky', t(el.getAttribute('data-i18n-ask')));
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });

  document.querySelectorAll('.lang-switch [data-lang]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === currentLang ? 'true' : 'false');
  });
}

function setLanguage(lang, { announce = true, userText = null } = {}) {
  if (!SUPPORTED_LANGS.includes(lang)) return false;
  const prev = currentLang;
  currentLang = lang;
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (_) {}
  applyI18n();
  if (announce && typeof showStatus === 'function') {
    showStatus(t('lang.switched'), 2200);
  }
  if (userText != null && typeof addMessage === 'function') {
    // callers handle messaging
  }
  if (prev !== lang && typeof logPrivacyActivity === 'function') {
    logPrivacyActivity('lang_switch', lang);
  }
  return true;
}

function detectLanguageIntent(raw) {
  const t0 = String(raw || '').trim();
  if (!t0) return null;
  const low = t0.toLowerCase();
  const compact = t0.replace(/\s/g, '');

  // 「영어로」「일본어로」처럼 방향만 말해도 전환 (좌측 홈 포함 applyI18n)
  if (/(한국어로|한글로)/.test(compact) || /^(한국어|한글)$/.test(compact)) return 'ko';
  if (/(영어로)/.test(compact) || /^(영어|english|en)$/i.test(low)) return 'en';
  if (/(일본어로)/.test(compact) || /(日本語で|日本語に)/.test(t0) || /^(일본어|japanese|ja|日本語)$/i.test(low)) return 'ja';
  if (/(중국어로)/.test(compact) || /(换成中文|用中文)/.test(t0) || /^(중국어|chinese|zh|中文)$/i.test(low)) return 'zh';
  if (/(프랑스어로)/.test(compact) || /(en\s*français|en\s*francais)/i.test(t0) || /^(프랑스어|french|fr|francais|français)$/i.test(low)) return 'fr';

  if (/\bin\s+english\b|\bspeak\s+english\b/i.test(low)) return 'en';
  if (/\bin\s+japanese\b|\bspeak\s+japanese\b/i.test(low)) return 'ja';
  if (/\bin\s+chinese\b|\bspeak\s+chinese\b/i.test(low)) return 'zh';
  if (/\bin\s+french\b|\bspeak\s+french\b|\ben\s+français\b/i.test(low)) return 'fr';
  if (/\bin\s+korean\b|\bspeak\s+korean\b/i.test(low)) return 'ko';

  // "영어로 바꿔줘" / "switch to English" 등
  const switchCue = /(언어|language|langue|言語|语言|바꿔|바꾸|전환|switch\s+to|change\s+(to|language)|换成|にして)/i.test(t0);
  if (!switchCue) return null;

  if (/(english|영어|anglais)/i.test(t0)) return 'en';
  if (/(japanese|일본어|日本語|日本语|japonais)/i.test(t0)) return 'ja';
  if (/(chinese|중국어|中文|chinois)/i.test(t0)) return 'zh';
  if (/(french|프랑스어|francais|français|法语)/i.test(t0)) return 'fr';
  if (/(korean|한국어|韓国語|韩语|coréen)/i.test(t0)) return 'ko';
  return null;
}

function replyLanguageSwitch(userText, lang) {
  addMessage(userText, 'user');
  setLanguage(lang, { announce: false });
  applyI18n(); // 좌측 홈·내비·스카이 UI 전체 갱신 보장
  addMessage(t('lang.switched'), 'bot');
  hideStatus?.();
  setState?.(null);
  return true;
}

function initLanguageSystem() {
  let saved = '';
  try { saved = localStorage.getItem(LANG_STORAGE_KEY) || ''; } catch (_) {}
  const boot = SUPPORTED_LANGS.includes(saved) ? saved : 'ko';
  currentLang = boot;
  applyI18n();

  document.querySelectorAll('.lang-switch').forEach((wrap) => {
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      const lang = btn.getAttribute('data-lang');
      if (!lang || lang === currentLang) return;
      setLanguage(lang, { announce: true });
    });
  });
}
