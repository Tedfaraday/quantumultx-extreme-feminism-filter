# 关键词来源与取舍

整理日期：2026-08-23

这份词库用于用户自己的小红书信息流过滤。它只表示“该文字在公开材料中出现过，且用户不想在信息流中看到”，不对截图真实性、发帖者身份、仓库作者的结论或任何群体作事实判断。

词汇候选来源索引：

- [keyzf/Block-misuse-of-feminist-terminology](https://github.com/keyzf/Block-misuse-of-feminist-terminology)
- [ChinaFeminist/ChinaFeminist](https://github.com/ChinaFeminist/ChinaFeminist)
- [boxresskiller/boxressdata](https://github.com/boxresskiller/boxressdata)
- [person-without-name/AntiChinaFeminist](https://github.com/person-without-name/AntiChinaFeminist)
- [FemRun/FemRun](https://github.com/FemRun/FemRun)，包括公开 Issues

Quantumult X 的配置、重写和远程分发形式另参考 [ddgksf2013/ddgksf2013](https://github.com/ddgksf2013/ddgksf2013)；它属于技术参考，不列作词汇来源。更完整的来源分类和权利说明见 [`../SOURCES.md`](../SOURCES.md)。

## 分层方式

- `CORE_KEYWORDS`：复合词、变体和较完整的表达，通常比单字误伤少。
- `BROAD_KEYWORDS`：一至三字的强过滤层，当前按用户要求默认开启。它会连同引用、反驳、新闻转述和学术讨论一起过滤；误伤多时可在脚本顶部把 `includeBroadKeywords` 改为 `false`。
- 匹配采用规范化后的“包含匹配”，不是分词或语义判断。因此没有加入 `男`、`女`、`拳`、`权`、`驴`、`吊` 等极易命中普通内容的单字。

## 深读范围

### ChinaFeminist/ChinaFeminist

检查了[仓库默认分支“女权”](https://github.com/ChinaFeminist/ChinaFeminist/tree/%E5%A5%B3%E6%9D%83)的完整文件树、[89 次可达提交](https://github.com/ChinaFeminist/ChinaFeminist/commits/%E5%A5%B3%E6%9D%83)和删除路径。当前 38 个文件包括 15 个 DOCX、9 个 PDF、3 个 PNG、1 个 TXT 和 10 个无扩展名纯文本；没有 JS、CONF、生成脚本或独立词库，也没有不可达的隐藏对象。对 DOCX 正文、表格、页眉页脚及可提取文字的 PDF 做了检索。主要可复核文件包括：

- [`刚接触女权阶段的常见问题Q&A.docx`](https://github.com/ChinaFeminist/ChinaFeminist/blob/%E5%A5%B3%E6%9D%83/%E5%88%9A%E6%8E%A5%E8%A7%A6%E5%A5%B3%E6%9D%83%E9%98%B6%E6%AE%B5%E7%9A%84%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98Q%26A.docx)：`6B4T`、`WOMAD`、`平权仙`、`带屌跨性者`等。
- [`能让娇妻听女爹劝的只有即视利益或权力.docx`](https://github.com/ChinaFeminist/ChinaFeminist/blob/%E5%A5%B3%E6%9D%83/%E5%A5%B3%E6%9D%83%E6%80%9D%E6%83%B3%E4%B8%8E%E8%AE%A8%E8%AE%BA/%E8%83%BD%E8%AE%A9%E5%A8%87%E5%A6%BB%E5%90%AC%E5%A5%B3%E7%88%B9%E5%8A%9D%E7%9A%84%E5%8F%AA%E6%9C%89%E5%8D%B3%E8%A7%86%E5%88%A9%E7%9B%8A%E6%88%96%E6%9D%83%E5%8A%9B.docx)：`娇妻`、`女爹`、`向下自由`、`女利`、`训夫模范`等。
- [`女权提倡的生活方式是不是剥夺了女人的自由.docx`](https://github.com/ChinaFeminist/ChinaFeminist/blob/%E5%A5%B3%E6%9D%83/%E5%A5%B3%E6%9D%83%E6%80%9D%E6%83%B3%E4%B8%8E%E8%AE%A8%E8%AE%BA/%E5%A5%B3%E6%9D%83%E6%8F%90%E5%80%A1%E7%9A%84%E7%94%9F%E6%B4%BB%E6%96%B9%E5%BC%8F%E6%98%AF%E4%B8%8D%E6%98%AF%E5%89%A5%E5%A4%BA%E4%BA%86%E5%A5%B3%E4%BA%BA%E7%9A%84%E8%87%AA%E7%94%B1.docx)：`6B4T`、`100BT`、`1000BT`、`媚男`、`脱腐脱宅`、`鉴权`、`独自高贵派`等。
- [`男宝妈脑中的Y染色体.docx`](https://github.com/ChinaFeminist/ChinaFeminist/blob/%E5%A5%B3%E6%9D%83/%E7%9F%A5%E8%AF%86%E7%A7%91%E6%99%AE/%E7%94%B7%E5%AE%9D%E5%A6%88%E8%84%91%E4%B8%AD%E7%9A%84Y%E6%9F%93%E8%89%B2%E4%BD%93.docx)：`男宝妈`。
- [`我发起【三争三反】运动（含英文版）.docx`](https://github.com/ChinaFeminist/ChinaFeminist/blob/%E5%A5%B3%E6%9D%83/%E7%9F%A5%E8%AF%86%E7%A7%91%E6%99%AE/%E6%88%91%E5%8F%91%E8%B5%B7%E3%80%90%E4%B8%89%E4%BA%89%E4%B8%89%E5%8F%8D%E3%80%91%E8%BF%90%E5%8A%A8%EF%BC%88%E5%90%AB%E8%8B%B1%E6%96%87%E7%89%88%EF%BC%89.docx)：`三争三反`、`争女性武力`、`反婚`、`反子宫绑架`等。

仓库中的长篇通识书籍没有整本转成词库：其中大量“父权制、女性、婚姻”等属于普通学术用语，批量导入会让过滤器失去可用性。

历史版本也做了差异核查。较早的 [Q&A 版本](https://github.com/ChinaFeminist/ChinaFeminist/blob/b191f491b7dfd75ec8d8ce2799a4ca6ec6cbc593/%E5%88%9A%E6%8E%A5%E8%A7%A6%E5%A5%B3%E6%9D%83%E9%98%B6%E6%AE%B5%E7%9A%84%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98Q%26A.docx)使用 `megalian`、`10bt`，当前版改用 `WOMAD`、`6B4T`；旧版还出现 `po尿`、`po墨`、`卖yin`、`奴 li` 等规避写法。这些历史变体已经纳入核心层。仓库只有一个分支、没有 Tag 或 Release，当前与全部历史均未发现 LICENSE。

### person-without-name/AntiChinaFeminist

检查了[当前树](https://github.com/person-without-name/AntiChinaFeminist/tree/32900c07d91d33f227b564c08502410424c09ff9)、[三次提交的历史](https://github.com/person-without-name/AntiChinaFeminist/commits/master)以及截图文件。该仓库没有 JS、CONF、JSON、TXT 或其他机器词表，主要是截图；历史中也没有找到隐藏词表。

用于复核的代表性截图：

- [`女拳极端言论.jpeg`](https://github.com/person-without-name/AntiChinaFeminist/blob/master/%E5%A5%B3%E6%8B%B3%E6%9E%81%E7%AB%AF%E8%A8%80%E8%AE%BA.jpeg)：`国蝻`、`堕男胎`、`父权洗脑`及灭绝性表达。
- [`写小说爽文杀男人.jpeg`](https://github.com/person-without-name/AntiChinaFeminist/blob/master/%E5%86%99%E5%B0%8F%E8%AF%B4%E7%88%BD%E6%96%87%E6%9D%80%E7%94%B7%E4%BA%BA.jpeg)：`杀光99%蝻人`等。
- [`想杀男人.jpeg`](https://github.com/person-without-name/AntiChinaFeminist/blob/master/%E6%83%B3%E6%9D%80%E7%94%B7%E4%BA%BA.jpeg)：`想杀男人`、`蝻`。
- [`微博日常恐男.jpeg`](https://github.com/person-without-name/AntiChinaFeminist/blob/master/%E5%BE%AE%E5%8D%9A%E6%97%A5%E5%B8%B8%E6%81%90%E7%94%B7.jpeg)：`仨蝻`、`只杀男`。
- [`挑拨离间.jpeg`](https://github.com/person-without-name/AntiChinaFeminist/blob/master/%E6%8C%91%E6%8B%A8%E7%A6%BB%E9%97%B4.jpeg)：`y病毒`、`不沾吊`、`男性之恶`等。
- [`男人垃圾.jpeg`](https://github.com/person-without-name/AntiChinaFeminist/blob/master/%E7%94%B7%E4%BA%BA%E5%9E%83%E5%9C%BE.jpeg)：`男的垃圾`。

部分截图包含反讽、转述或批评文字，所以“出现在截图中”不等于该词由截图中的账号首创，也不等于发图者赞同它。

### boxresskiller/boxressdata

检查了[仓库根目录](https://github.com/boxresskiller/boxressdata)、[提交历史](https://github.com/boxresskiller/boxressdata/commits/main)及“小红书”“微博”等深层目录。当前完整树共 417 项，其中 311 个 JPG、50 个 MD、7 个 MP4；没有 JS、CONF、JSON、TXT、CSV、生成脚本或机器词表。约 130 次历史提交中的删除记录只涉及许可证和截图，没有被删词表。该仓库的主要内容是账号资料、截图和视频，不是一份词典。

截图正文中可独立成立的内容词包括 `拳媛`、`女权媛`、`男蛆`、`蝻窝`、`下头男`、`爹味`、`开除女籍`、`爱屌女`、`拜吊小作家`、`mansplaining`、`radfem` 等；它们已按误伤风险分别放入核心或强过滤层。为了避免把针对内容的过滤变成针对个人的名单，下列信息全部排除：

- 用户名、账号 ID、头像和个人主页链接；
- 城市、学校、工作单位、生日及其他身份线索；
- 仓库作者对具体个人的标签或推断。

只有截图正文中能够独立成立、且与个人身份无关的短语才有资格作为候选；与其他来源重复的词只保留一份。

### FemRun/FemRun

检查了 [FemRun/FemRun](https://github.com/FemRun/FemRun) 的当前树和完整可达历史。仓库只有 `main` 一个分支，当前 18 个纯文本文件（17 个 Markdown、1 个无扩展名文本）；`main` 共 608 个提交，时间范围为 2022-08-10 至 2022-12-23。没有 Tag、Release、LICENSE、COPYING、代码、配置或机器脚本。删除历史只有重命名和两张后来删除的图片；图片没有文字词表，Git 对象核查也没有发现不可达的隐藏内容。

当前文档中用于交叉核对的主要来源包括：

- [`真正的润学真谛，核心信条，是什么.md`](https://github.com/FemRun/FemRun/blob/main/%E7%9C%9F%E6%AD%A3%E7%9A%84%E6%B6%A6%E5%AD%A6%E7%9C%9F%E8%B0%9B%EF%BC%8C%E6%A0%B8%E5%BF%83%E4%BF%A1%E6%9D%A1%EF%BC%8C%E6%98%AF%E4%BB%80%E4%B9%88.md)：`脂蝻`、`蜘蝻`、`图尽v染`、`不踩死男人的女权`等。
- [`男本位爱情谎言：通过偷盗女性建立的男权.md`](https://github.com/FemRun/FemRun/blob/main/%E7%94%B7%E6%9C%AC%E4%BD%8D%E7%88%B1%E6%83%85%E8%B0%8E%E8%A8%80%EF%BC%9A%E9%80%9A%E8%BF%87%E5%81%B7%E7%9B%97%E5%A5%B3%E6%80%A7%E5%BB%BA%E7%AB%8B%E7%9A%84%E7%94%B7%E6%9D%83.md)：`脚刹滑蝻`、`大螂喝药`、`接老公车祸`、`接男友暴毙`等。
- [`天然的第二性，雄性.md`](https://github.com/FemRun/FemRun/blob/main/%E5%A4%A9%E7%84%B6%E7%9A%84%E7%AC%AC%E4%BA%8C%E6%80%A7%EF%BC%8C%E9%9B%84%E6%80%A7.md)：`易碎是茶壶的天性`、`雄配子载体`及针对雄性的暴力表达。

Issues 也进行了全量核查：当前可访问 13 条 Issue（12 open、1 closed），评论合计 54 条。最直接的来源是仓库维护者建立的 [Issue #17“润学基本词汇表”](https://github.com/FemRun/FemRun/issues/17)，其中明确列出 `莮`、`-÷`、`♂÷`、`支男`、`织男`、`滑蝻`、`支家哥`、`小茶壶`、`雄堕`、`劣等y染`、`吊子`、`一拳打死蝻宝`、`小仙男`等。其他关键来源包括：

- [Issue #9](https://github.com/FemRun/FemRun/issues/9)：`撕蛋剪吊暴死`、`男税`、`男役`、`吊缘关系`等；
- [Issue #17 的评论](https://github.com/FemRun/FemRun/issues/17#issuecomment-1246264781)：`纯血激女`、`y染屠杀`、`劣精灭绝`等；
- [Issue #18 的评论](https://github.com/FemRun/FemRun/issues/18#issuecomment-1272318497)：`织男孽种`、`男本位寄生虫`、`y染优越`、`性缘脑`等；
- [Issue #24 的评论](https://github.com/FemRun/FemRun/issues/24#issuecomment-1289259939)：`女强驴`、`润学婧髓`等。

Issue 编号从 #24 大幅跳到 #974。现存 [#17 评论](https://github.com/FemRun/FemRun/issues/17#issuecomment-1288121225)称曾有 bot 批量创建数百条 Issue，随后内容变为 404；这些已删除内容现在无法合法复核，因此不声称已经读取，也不据此猜词。

Issues 中的争吵内容按发言方向做了区分：没有把反对者留下的普通性别辱骂伪装成仓库方词汇；#2 中未经核实的个人指控、账号名、@用户名、位置暗示和社工线索全部排除。Issue 内容只能证明相关字符串曾公开出现，不能证明其中陈述属实或代表任何群体。

## 未纳入的高误伤词

以下类型即使在材料中出现，也没有直接启用：

- `男`、`女`、`拳`、`权`、`驴`、`吊`、`癌`、`贱`：单字包含匹配范围过大；
- `国男`：会误命中“中国男篮”“英国男人”等普通文本；
- `男人`、`男性`、`姐妹`、`女权`：会过滤大面积普通讨论以及反对极端言论的帖子；
- `情绪价值`、`软糯`、`剪刀`、`脱脂`、`河童`、`猪头三`、`小黄人`：虽出现在 FemRun 的词表或正文中，但普通语义过宽；
- 账号昵称、真实姓名或疑似谐音姓名：目标是过滤内容，不是定位个人。

## 许可与 GitHub 标注

四个来源仓库都不应被理解为给本项目授予了复制其截图或文档的许可：`ChinaFeminist/ChinaFeminist`、`person-without-name/AntiChinaFeminist` 与 `FemRun/FemRun` 未发现 LICENSE；`boxresskiller/boxressdata` 的初始历史曾加入 MIT，随后又删除，当前树没有许可证。本项目没有打包或再发布这些原文件，只整理了短词、来源链接和独立编写的过滤逻辑。

如果把这套脚本放到 GitHub：

- 作为你自己新建的仓库发布即可，不需要也不应手工标成上述仓库的 `fork`；GitHub 的 fork 标识只用于由平台 Fork 功能建立的仓库关系。
- 保留本文件的来源链接和“截图未经独立核实、个人信息未纳入”说明。
- 不要把上述仓库的截图、文档、个人资料或 README 整包复制进自己的仓库；若要复制，应先确认原作者许可。
