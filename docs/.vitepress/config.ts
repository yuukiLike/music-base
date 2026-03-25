import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Music Base',
  description: '中文交互式乐理知识库 — 第一性原理版',
  lang: 'zh-CN',

  head: [
    ['meta', { name: 'keywords', content: '乐理, 音乐理论, 第一性原理, MIDI, 音乐入门, music theory' }],
  ],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '学习路径', link: '/foundations/' },
      { text: '深入参考', link: '/intervals/' },
    ],

    sidebar: {
      // Main learning path — follows the first-principles guide order
      '/foundations/': sidebarLearningPath(),
      '/rhythm/': sidebarLearningPath(),
      '/pitch/': sidebarLearningPath(),
      '/harmony/': sidebarLearningPath(),
      '/expression/': sidebarLearningPath(),
      '/midi/': sidebarLearningPath(),
      '/reference/': sidebarLearningPath(),
      '/ear-training/': sidebarLearningPath(),
      '/progressions/': sidebarLearningPath(),

      // Deep-dive reference sections
      '/intervals/': [
        {
          text: '← 回到学习路径',
          items: [{ text: '音程概述', link: '/pitch/intervals' }],
        },
        {
          text: '音程详解 Intervals',
          items: [
            { text: '什么是音程', link: '/intervals/' },
            { text: '半音与全音', link: '/intervals/half-whole-steps' },
            { text: '音程的分类', link: '/intervals/classification' },
            { text: '协和与不协和', link: '/intervals/consonance' },
            { text: '音程听辨', link: '/intervals/ear-training' },
            { text: '音程应用', link: '/intervals/applications' },
          ],
        },
      ],
      '/chords/': [
        {
          text: '← 回到学习路径',
          items: [{ text: '和弦概述', link: '/harmony/chords' }],
        },
        {
          text: '和弦详解 Chords',
          items: [
            { text: '什么是和弦', link: '/chords/' },
            { text: '大三和弦', link: '/chords/major' },
            { text: '小三和弦', link: '/chords/minor' },
            { text: '减三和弦与增三和弦', link: '/chords/dim-aug' },
            { text: '七和弦', link: '/chords/seventh' },
            { text: '挂留和弦', link: '/chords/sus' },
            { text: '和弦转位', link: '/chords/inversions' },
            { text: '和弦构建器', link: '/chords/builder' },
          ],
        },
      ],
      '/scales/': [
        {
          text: '← 回到学习路径',
          items: [{ text: '音阶概述', link: '/pitch/scales' }],
        },
        {
          text: '音阶详解 Scales',
          items: [
            { text: '什么是音阶', link: '/scales/' },
            { text: '大调音阶', link: '/scales/major' },
            { text: '自然小调', link: '/scales/natural-minor' },
            { text: '和声小调与旋律小调', link: '/scales/harmonic-melodic' },
            { text: '教会调式', link: '/scales/modes' },
            { text: '五声音阶', link: '/scales/pentatonic' },
            { text: '布鲁斯音阶', link: '/scales/blues' },
            { text: '半音阶', link: '/scales/chromatic' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
      options: {
        _miniSearchOptions: {
          tokenize: (text: string) => {
            const tokens: string[] = []
            const words = text.match(/[a-zA-Z]+/g)
            if (words) tokens.push(...words.map(w => w.toLowerCase()))
            const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g)
            if (cjk) {
              for (const segment of cjk) {
                if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
                  const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' })
                  for (const { segment: word } of segmenter.segment(segment)) {
                    if (word.trim()) tokens.push(word)
                  }
                } else {
                  for (let i = 0; i < segment.length; i++) {
                    tokens.push(segment[i])
                    if (i < segment.length - 1) {
                      tokens.push(segment.slice(i, i + 2))
                    }
                  }
                }
              }
            }
            return tokens
          },
        },
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: '第一性原理学乐理 — 不从术语开始，从本质开始',
      copyright: 'Music Base — 开源乐理知识库',
    },

    outline: {
      label: '目录',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
  },
})

function sidebarLearningPath() {
  return [
    {
      text: '① 基础：音乐到底是什么',
      items: [
        { text: '音乐 = 时间轴上的声音事件', link: '/foundations/' },
        { text: '时间骨架', link: '/foundations/time' },
        { text: '重复性', link: '/foundations/repetition' },
      ],
    },
    {
      text: '② 节奏：时间上的变化',
      items: [
        { text: '强拍与弱拍', link: '/rhythm/' },
        { text: '节奏变化', link: '/rhythm/variation' },
      ],
    },
    {
      text: '③ 音高：发什么音',
      items: [
        { text: '音符、音高、八度', link: '/pitch/' },
        { text: '音程', link: '/pitch/intervals' },
        { text: '音阶与调', link: '/pitch/scales' },
      ],
    },
    {
      text: '④ 横向与纵向',
      items: [
        { text: '旋律、和弦、和声', link: '/harmony/' },
        { text: '和弦详解', link: '/harmony/chords' },
      ],
    },
    {
      text: '⑤ 表达层',
      items: [
        { text: '力度、音色、演奏法', link: '/expression/' },
      ],
    },
    {
      text: '⑥ MIDI 视角',
      items: [
        { text: 'MIDI 与结构化表达', link: '/midi/' },
      ],
    },
    {
      text: '⑦ 实战',
      items: [
        { text: '听音训练', link: '/ear-training/' },
        { text: '和弦进行', link: '/progressions/' },
      ],
    },
    {
      text: '⑧ 速查',
      items: [
        { text: '五度圈 + 词汇表', link: '/reference/' },
      ],
    },
  ]
}
