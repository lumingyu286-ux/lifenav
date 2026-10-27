/* ===========================================================
   只需要改这一个文件。

   分类格式：[分类名, 角标, [条目...]]
   条目格式：[名称, 网址, 说明]
             [名称, 网址, 说明, 'adult']  ← 第四项加 'adult'
                                            点击时会先弹年龄确认

   顺序即标签顺序，第一个分类是默认打开的那个。
   成人百科排第一位。

   用 var 不用 const：app.js 通篇是 ES5 写法。这里若用 const，
   老引擎直接解析失败，会被报成「sites.js 被拦截了」，把人往
   错误方向带。
   =========================================================== */

var SITE = {
  name: '生活健康导航',
  tagline: '身体、心理、办事和维权，需要的时候能找到',
  deployedOn: '',
};

var GROUPS = [

['成人内容', '18+', [
  ['成人内容百科', 'https://chengrenbaike.com', '性知识与两性健康百科，仅限成年人', 'adult'],
]],

['就医与用药', '✚', [
  ['丁香医生',       'https://dxy.com',                    '疾病科普与用药说明'],
  ['好大夫在线',     'https://www.haodf.com',              '找医生、看口碑与在线问诊'],
  ['微医',           'https://www.guahao.com',             '预约挂号与复诊'],
  ['春雨医生',       'https://www.chunyuyisheng.com',      '在线问诊与健康咨询'],
  ['国家药品监督管理局', 'https://www.nmpa.gov.cn',        '药品、器械与化妆品查询'],
]],

['健康科普', '◉', [
  ['国家卫生健康委员会', 'http://www.nhc.gov.cn',      '政策、疾病防控与健康提示'],
  ['中国疾控中心',       'https://www.chinacdc.cn',    '传染病与公共卫生信息'],
  ['世界卫生组织',       'https://www.who.int/zh',     '全球健康指南（中文）'],
  ['科学辟谣平台',       'https://piyao.kepuchina.cn', '健康谣言逐条核实'],
]],

['心理与情绪', '◍', [
  ['简单心理',     'https://www.jiandanxinli.com', '心理咨询师预约与科普'],
  ['壹心理',       'https://www.xinli001.com',     '心理测评、文章与咨询'],
  ['KnowYourself', 'https://www.knowyourself.cc',  '心理学视角的关系与自我'],
]],

['健身与营养', '◭', [
  ['Keep',          'https://www.gotokeep.com',       '训练计划与跟练'],
  ['薄荷健康',      'https://www.boohee.com',         '食物热量与饮食记录'],
  ['MyFitnessPal',  'https://www.myfitnesspal.com',   '卡路里与营养追踪'],
  ['Strava',        'https://www.strava.com',         '跑步骑行记录与社区'],
]],

['政务与办事', '▤', [
  ['中国政府网',       'https://www.gov.cn',              '政策发布与政务信息'],
  ['国家政务服务平台', 'https://gjzwfw.gov.cn',           '跨省通办与证照查询'],
  ['个人所得税',       'https://etax.chinatax.gov.cn',    '汇算清缴与专项附加扣除'],
  ['国家医保服务平台', 'https://fuwu.nhsa.gov.cn',        '参保、备案与药品目录'],
  ['交管 12123',       'https://gab.122.gov.cn',          '驾照、违章与车辆业务'],
]],

['法律与维权', '⚖', [
  ['国家法律法规数据库', 'https://flk.npc.gov.cn',          '法律、行政法规全文'],
  ['中国裁判文书网',     'https://wenshu.court.gov.cn',     '裁判文书公开查询'],
  ['全国 12315 平台',    'https://www.12315.cn',            '消费投诉与举报'],
  ['中国法律服务网',     'https://www.12348.gov.cn',        '法律咨询与法律援助'],
]],

['生活服务', '⌂', [
  ['快递 100',           'https://www.kuaidi100.com',   '全网快递查询'],
  ['国家企业信用信息公示系统', 'https://www.gsxt.gov.cn', '查公司是否真实存在'],
  ['天眼查',             'https://www.tianyancha.com',  '企业工商与风险信息'],
  ['中国邮政 EMS',       'https://www.ems.com.cn',      '邮件与包裹查询'],
]],

['安全与隐私', '⚿', [
  ['Have I Been Pwned', 'https://haveibeenpwned.com',   '查你的邮箱有没有在泄露库里'],
  ['VirusTotal',        'https://www.virustotal.com',   '文件与网址安全扫描'],
  ['Bitwarden',         'https://bitwarden.com',        '开源密码管理器'],
  ['中国互联网联合辟谣平台', 'https://www.piyao.org.cn', '网络谣言核查'],
]],

];
