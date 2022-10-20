/* global Widget, WIDGETS, utils, Convo, NNE, SNT, Color */
class TutorialsGuide extends Widget {
  constructor (opts) {
    super(opts)
    this.title = 'Learning Guide (BETA-2.0)'
    this.key = 'tutorials-guide'
    this.keywords = [
      'tutorials', 'guide', 'lesson', 'how to', 'how', 'to', 'learn', 'reference'
    ]

    this.on('open', () => {
      this.update({ left: 20, top: 20 }, 500)
      this._openConvo()
    })

    this.resizable = false
    // currently loaded tutorial data
    this.metadata = null
    this.data = null
    this.loaded = null

    Convo.load(this.key, () => { this.convos = window.CONVOS[this.key](this) })

    this._createPage('mainOpts', 'learning-guide-main.html', null, (div) => {
      // div.querySelector('#bf-submission').addEventListener('click', () => {
      //   WIDGETS['functions-menu'].BrowserFest()
      // })

      // create sub pages
      this._createPage('aboutOpts', 'learning-guide-about.html', this.mainOpts)

      // initial HTML
      this._createHTML()
      this.title = 'Learning Guide (BETA-2.0)'
    })
  }

  load (name, time) {
    setTimeout(() => {
      utils.showCurtain('tutorial.html')
    }, 100)

    utils.get(`tutorials/${name}/metadata.json`, (json) => {
      this.metadata = json
      this.loaded = name
      if (WIDGETS['student-session'].getData('opened-project')) {
        WIDGETS['student-session'].clearProjectData()
      }
      NNE.addCustomRoot(`tutorials/${name}/`)
      utils.get(`tutorials/${name}/data.json`, (json) => {
        this.data = json
        this._loadTutorial(name, time)
      })
    })
    SNT.post(SNT.dataObj('TUT-select', { name }))
  }

  quit () {
    WIDGETS.list().filter(w => w.opened).forEach(w => w.close())
    this.metadata = null
    this.data = null
    utils.hideCurtain('tutorial.html')
  }

  // •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*
  // •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.••.¸¸¸.•*• private methods

  _openConvo () {
    if (!this.convos) {
      setTimeout(() => this._openConvo(), 100)
      return
    }
    window.convo = new Convo(this.convos, 'guide-open')
  }

  _createPage (type, page, b, cb) {
    utils.get(`./data/learning-guide/${page}`, (html) => {
      const div = document.createElement('div')
      div.innerHTML = html
      const name = page.split('.')[0]
      // options objects for <widget-slide> .updateSlide() method
      this[type] = { name: name, widget: this, back: b, ele: div }
      if (cb) cb(div)
    }, true)
  }

  _createHTML () {
    if (!utils.customElementReady('widget-slide')) {
      setTimeout(() => this._createHTML(), 100)
      return
    }

    this.slide = document.createElement('widget-slide')
    this.innerHTML = this.slide

    // this.ele.style.padding = '8px 5px 10px'
    this.ele.querySelector('.w-top-bar').style.padding = '0px 15px 0px'
    this.ele.querySelector('.w-innerHTML').style.padding = '0 0 10px 0'

    this.slide.updateSlide(this.mainOpts)

    this._enableExamplesButton()
    this._listTutorials()
    this._enableAppendixLinks()

    const canvas = this.ele.querySelector('canvas')
    this._createStarField(canvas)
    this._highlightTitles()
  }

  _enableExamplesButton () {
    this.slide.querySelector('#ex-open-btn')
      .addEventListener('click', () => {
        WIDGETS.open('code-examples')
        this.close()
        window.convo.hide()
      })
  }

  _enableAppendixLinks () {
    this.slide.querySelectorAll('[name^="ref"]').forEach(ele => {
      const arr = ele.getAttribute('name').split(':')
      const widget = `${arr[1]}-reference`
      ele.addEventListener('click', () => {
        window.convo.hide()
        WIDGETS.open(widget, null, (w) => w.slide.updateSlide(w[arr[2]]))
      })
    })
  }

  _listTutorials () {
    const tutHTML = (t, i) => {
      const div = document.createElement('div')
      div.className = 'learning-guide__tut'
      div.innerHTML = `
        <div>
          <div>
            <h2>${t.title}</h2>
            <b>${t.subtitle}</b>
          </div>
          <div>
            <button name="tut:${t.id}">play</button>
            <button name="i:${t.id}">i</button>
          </div>
        </div>
        <p name="nfo:${t.id}">${t.description}</p>
      `
      const p = div.querySelector('p')
      const W = 554
      const w = 340
      const f = W / 2 - w / 2
      const l = f - (Math.sin(i) * f)
      div.style.width = w + 'px'
      div.style.marginLeft = l + 'px'
      p.style.width = W + 'px'
      p.style.transform = `translateX(-${l}px)`
      return div
    }

    const tutorials = []
    const div = this.ele.querySelector('.learning-guide__tut-list')

    utils.get('tutorials/list.json', (json) => {
      let count = 0
      json.listed.forEach((name, i) => {
        utils.get(`tutorials/${name}/metadata.json`, (tut) => {
          tutorials.push({ // create tutorial <div>
            index: json.listed.indexOf(name), html: tutHTML(tut, i)
          })
          count++
          // ...
          if (count === json.listed.length) {
            tutorials // when all are loaded, append tutorial <div> to guide
              .sort((a, b) => parseFloat(a.index) - parseFloat(b.index))
              .forEach(obj => div.appendChild(obj.html))

            this._enableTutorialEventListeners(div)
          }
          // ...
        })
      })
    })
  }

  _enableTutorialEventListeners (div) {
    this.slide.querySelector('#page-aboutOpts')
      .addEventListener('click', () => {
        this.slide.updateSlide(this.aboutOpts)
        window.convo.hide()
      })

    // enable "play" buttons
    div.querySelectorAll('[name^="tut"]').forEach(ele => {
      const tut = ele.getAttribute('name').split(':')[1]
      ele.addEventListener('click', () => this.load(tut))
    })

    // calc <p> heights && hide them
    div.querySelectorAll('[name^="nfo"]').forEach(p => {
      p.dataset.height = p.offsetHeight
      p.style.height = '0px'
      p.style.display = 'none'
    })

    // enable "info" buttons
    div.querySelectorAll('[name^="i"]').forEach(ele => {
      const t = ele.getAttribute('name').split(':')[1]
      ele.addEventListener('click', () => {
        const p = div.querySelector(`[name="nfo:${t}"]`)
        if (ele.textContent === 'i') {
          p.style.display = 'block'
          ele.textContent = 'x'
          setTimeout(() => {
            p.style.height = p.dataset.height + 'px'
            p.style.paddingTop = '8px'
          }, 10)
        } else {
          p.style.height = '0px'
          p.style.paddingTop = '0px'
          ele.textContent = 'i'
          setTimeout(() => { p.style.display = 'none' }, 1000)
        }
      })
    })
  }

  // •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*
  // •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.••. tutorial loading logic

  _loadTutorial (name, time) {
    WIDGETS.open('hyper-video-player', null, () => {
      WIDGETS['hyper-video-player'].video.oncanplay = () => {
        this.convos = window.CONVOS[this.key](this)
        window.convo = new Convo(this.convos, 'introducing-tutorial')
        this.close() // close the tutorials guide && setup first keyframe
        WIDGETS['hyper-video-player'].renderKeyframe()

        setTimeout(() => {
          utils.hideCurtain('tutorial.html')
          if (time) WIDGETS['hyper-video-player'].seek(time)
          WIDGETS['hyper-video-player'].video.oncanplay = null
        }, utils.getVal('--layout-transition-time'))
      }

      WIDGETS['hyper-video-player'].title = this.metadata.title
      WIDGETS['hyper-video-player'].loadKeyframes(this.data.keyframes)
      WIDGETS['hyper-video-player'].updateVideo(this.metadata.videofile, this.metadata.id)

      for (const key in this.data.widgets) {
        if (!WIDGETS.instantiated.includes(key)) {
          WIDGETS.create(this.data.widgets[key])
        }
      }

      if (this.metadata.duration) {
        WIDGETS['hyper-video-player'].duration = Number(this.metadata.duration)
      }

      if (this.metadata.jsfile) {
        const file = `tutorials/${name}/${this.metadata.jsfile}`
        utils.loadFile(file, () => window.TUTORIAL.init())
      }
    })
  }

  // •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*
  // •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.••. star field background

  _createStarField (ele) {
    const self = this
    this.starField = {
      setup: function () {
        this.canvas = ele
        this.canvas.style.position = 'absolute'
        this.canvas.style.top = 0
        this.canvas.style.left = 0
        this.canvas.style.zIndex = 0
        this.canvas.width = self.ele.offsetWidth
        this.canvas.height = self.ele.offsetHeight
        this.ctx = this.canvas.getContext('2d')
        this.ctx.clearRect(0, 0, this.w(), this.h())

        this.stars = []
        this.acceleration = 1
        for (let i = 0; i < 100; i++) this.stars.push(this.star())
      },

      star: function (star = {}) {
        star.x = this.w() / 2
        star.y = this.h() / 2
        star.dx = Math.random() * 10 - 5
        star.dy = Math.random() * 10 - 5
        star.w = 1
        star.h = 1
        star.a = 0
        star.z = 500
        const s = (this.w() > this.h()) ? this.w() : this.h()
        star.x += star.dx * s / 10
        star.y += star.dy * s / 10
        return star
      },

      w: function () {
        return this.canvas.width
      },

      h: function () {
        return this.canvas.height
      },

      update: function () {
        setTimeout(() => this.update(), 1000 / 60)
        this.ctx.clearRect(0, 0, this.w(), this.h())

        this.stars.forEach(star => {
          this.ctx.fillStyle = utils.getVal('--netizen-text')

          star.x += star.dx
          star.y += star.dy
          star.a++

          const outdX = star.x < 0 || star.x > this.w()
          const outdY = star.y < 0 || star.y > this.h()
          if (outdX && outdY) {
            star.x = this.w() / 2 + this.dx * 2
            star.y = this.h() / 2 + this.dy * 2
            star.dx += star.dx / (50 / this.acceleration)
            star.dy += star.dy / (50 / this.acceleration)
          }

          if (star.a === Math.floor(50 / this.acceleration) |
              star.a === Math.floor(150 / this.acceleration) |
              star.a === Math.floor(300 / this.acceleration)) {
            star.w++
            star.h++
          }

          if (star.x + star.w < 0 | star.x > this.w() |
          star.y + star.h < 0 | star.y > this.h()) {
            star = this.star(star)
          }

          this.ctx.fillRect(star.x, star.y, 1, 1)
        })
      }
    }

    this.starField.setup()
    this.starField.update()
  }

  _highlightTitles () {
    const c = Color.hex2rgb(utils.getVal('--netizen-number'))
    const m = Color.hex2rgb(utils.getVal('--netizen-meta'))
    this.ele.querySelectorAll('h2, h3').forEach(ele => {
      ele.style.textShadow = `rgba(${c.r}, ${c.g}, ${c.b}, 0.6) -1px -1px 6px, rgba(${m.r}, ${m.g}, ${m.b}, 0.6) 1px 1px 6px`
    })
  }
}

window.TutorialsGuide = TutorialsGuide
