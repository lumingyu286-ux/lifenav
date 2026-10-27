# 生活健康导航

按分类整理的生活与健康网址：9 个分类、34 个站点，带站内查找、本地收藏和深浅主题。无框架、无构建、无网络字体。

姊妹项目：[`changyong`](https://github.com/lumingyu286-ux/changyong)（工作日常向）、[`zhaizai`](https://github.com/lumingyu286-ux/zhaizai)（休闲娱乐向）、[`baike-nav`](https://github.com/lumingyu286-ux/baike-nav)（索引页）、[`nav-hub`](https://github.com/lumingyu286-ux/nav-hub)（入口页）。五个项目的视觉、模板和内容刻意互不相同，仓库与部署各自独立——其中一个被下架不会连累其余四个。

三个分类导航的分工：

| 项目 | 收的是什么 |
|---|---|
| `changyong` | 搜索、AI、办公、开发、购物——**工作日常** |
| `zhaizai` | 影视、动漫、音乐、游戏、社区——**休闲娱乐** |
| 本站 | 就医、心理、健身、政务、维权——**生活与健康** |

三边几乎不重叠，不是互为镜像。

## 这一套和前四个的区别

**模板**：前四个都是「一长条滚动，分类只是锚点」。这里是**真正的标签页**——左侧竖排标签，右侧一次只渲染一个分类的面板。完整 ARIA（`role=tablist/tab/tabpanel`）、roving tabindex、方向键 / Home / End 切换、自动激活。窄屏下标签转成横排滚动。

**视觉**：浅绿白的临床配色，深绿 `#1A6344` 作强调。`18+` 角标走描边不走填色——这套配色不想为一个角标再引入第二个实色。

**默认标签是第一个分类**，也就是成人内容，打开即在最显眼的位置。

## 文件

| 文件 | 说明 |
|---|---|
| `sites.js` | **只需要改这一个文件**：站名、分类、网址 |
| `index.html` | 页面骨架 |
| `style.css` | 样式（浅色为主，可切深色，默认跟随系统） |
| `app.js` | 标签切换、渲染、查找、收藏、主题、成人条目确认 |
| `404.html` | 找不到页面时的落地页，样式内联 |
| `_headers` | Cloudflare 用：让 `README.md` 不被索引 |
| `robots.txt` | 收录策略，见「主力站还是镜像站」 |
| `.nojekyll` / `.gitlab-ci.yml` | GitHub / GitLab Pages 用 |

## 改 sites.js

```js
var GROUPS = [
  ['分类名', '角标', [
    ['站点名', 'https://example.com', '一句话说明'],
    ['成人站', 'https://example.com', '说明', 'adult'],   // ← 第四项
  ]],
];
```

- **顺序即标签顺序**，第一个分类是默认打开的那个。
- 第四项写 `'adult'` 的条目会带 `18+` 角标，点击时先弹年龄确认。
- 每条会自动显示目标域名（去掉 `www.`），不用手写。
- 「常用」固定是最后一个标签，始终存在，空的时候显示空状态。

## 关于年龄确认

这个站绝大部分是挂号、医保、法律援助这类正经站点，所以**没有做进站全屏年龄门**——那等于把挂号锁在 18+ 警告后面。

做法是只拦成人条目：条目带 `18+` 角标，点击时弹确认框，确认过一次就不再问（只存在本机）。

**成人条目的 `href` 是 `#`，真实地址放在 `data-url`。** 别改回真地址：中键点击和右键「在新标签页中打开」都不会触发 `click` 事件，`href` 里有真地址就能直接绕过确认。代价是这一条没法「复制链接地址」，对一个需要确认才能进的链接可以接受。

## 代码里几处别动的地方

都是前几轮代码审查实际修出来的，不是预防性写法：

- **JS 注入的提示框用 `.notice`，不能用 `.boot`。** `.js-ok .boot { display:none }` 是给静态兜底块准备的，同名的话提示框刚创建就被藏掉，`sites.js` 被拦时访客看到的是一个只有搜索框的空壳。
- **主题当前值记在 `themeNow` / `userPicked` 里**，`localStorage` 只当尽力而为的持久化。每次回头读存储的话，隐私模式下写入失败、系统主题一翻转就把用户的手动选择改回去了。
- **事件绑定各自独立 `try`，且绝不走 `paintError`。** 否则一次绑定失败会把渲染好的内容整个抹掉，再甩出一句「检查 sites.js 格式」，而数据其实没问题。
- **查找时离开标签模式**：藏起标签栏和面板，改用合并结果区。否则会出现「选中了某个标签，却显示着全部分类」的自相矛盾状态。
- **焦点要还给可见元素。** 在「常用」里取消收藏后，分类面板里同名站点的星标虽然在 DOM 里，但那个面板是 `hidden` 的，对隐藏元素调 `focus()` 会静默失败。只在常用面板内部找，找不到就退回「常用」标签。
- **切标签用 `history.replaceState` 而不是改 `location.hash`**，后者每切一次压一条历史，返回键会被塞满。
- **`@media (hover: none)` 下星标常驻显示**，触屏没有 hover，否则收藏功能在手机上等于不存在。

## 部署

### Cloudflare Pages

```
npx wrangler pages deploy . --project-name=lifenav --branch main
```

新建项目时要加 `--force`，否则会被路由到 Workers 平台、拿到带账号名的长域名，而不是 `<项目名>.pages.dev`。只有创建那一次需要。

当前部署：<https://lifenav.pages.dev/>

### GitHub Pages

推到仓库，Settings → Pages → Source 选 `Deploy from a branch`，分支 `main`、目录 `/ (root)`。

`404.html` 里的脚本按**目录名**而非主机名判断基准路径，Cloudflare 根站、GitHub/GitLab 项目站、GitHub 用户站四种形态都指得对。**换仓库名时要同步改那里的 `DIR`。**

### GitLab Pages

`.gitlab-ci.yml` 已写好。新增文件记得同步加进里面的 `cp` 那一行。

## 主力站还是镜像站

选一个主力，其余按镜像配，只改一处：取消 `index.html` 里 `<meta name="robots" content="noindex,follow">` 的注释。

别再加 `canonical`（会把 `noindex` 一并传给目标页），也别把 `robots.txt` 改成 `Disallow: /`（爬虫取不到 HTML 就看不到 `noindex`，该网址仍可能凭外链被只收录网址）。

## 平台条款

按我的理解（不是法律意见，以各平台当前条款为准）：Cloudflare Pages 最宽松；GitHub 和 GitLab 的条款都禁止色情内容。本站绝大部分是正经站点，成人内容只有一条且做了年龄确认，风险较低，但仍取决于平台怎么判定。

`title` 和 `description` 照实写，没有堆砌露骨关键词——标题与内容不符本身就是搜索引擎的门页信号。

`README.md` 会随站点一起发布，`_headers` 给它加了 `noindex`。注意仓库本身是公开的（免费版 GitHub Pages 的硬性要求），README 内容在 GitHub 上本来就可读，这只是避免它混进搜索结果，不是保密措施。

## 一句免责

本站只是网址索引，不提供医疗、法律或投资建议。页脚写了同样的话。

## 本地预览

```bash
python -m http.server 8080
```

打开 <http://127.0.0.1:8080/>。用 `file://` 直接双击时 `localStorage` 可能被限制，收藏和主题不会被记住。
