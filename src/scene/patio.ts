/**
 * Patio de carga en 3D (Three.js, vista isométrica).
 * Un montacargas carga pallets en el camión; cuando está lleno el camión
 * se va, llega otro y el ciclo se repite en bucle.
 */
import * as THREE from 'three'

type Tema = 'claro' | 'oscuro'

const PALETAS = {
  claro: {
    fondo: '#f8fafc',
    suelo: '#eef1f8',
    patio: '#dde2f1',
    pista: '#c9cfdf',
    linea: '#ffffff',
    vereda: '#f4f6fc',
    muro: '#f8f9fd',
    techo: '#d5daea',
    marca: '#4646e0',
    marcaOscura: '#3730a3',
    puerta: '#9aa3bd',
    ventana: '#b8c4f2',
    arbol: '#7fd3a0',
    arbol2: '#5fc08a',
  },
  oscuro: {
    fondo: '#0a0a0a',
    suelo: '#111114',
    patio: '#18181c',
    pista: '#222228',
    linea: '#4b4b55',
    vereda: '#1c1c21',
    muro: '#2a2a31',
    techo: '#1f1f25',
    marca: '#5b5bf0',
    marcaOscura: '#4646e0',
    puerta: '#3a3a44',
    ventana: '#8f95ff',
    arbol: '#2f7a52',
    arbol2: '#276645',
  },
} as const
type Rol = keyof (typeof PALETAS)['claro']

// Colores fijos (no cambian con el tema)
const C = {
  madera: '#c99a64',
  caja: '#d9a76a',
  cajaB: '#e8bd84',
  film: '#f4ecdf',
  montacargas: '#f5b301',
  negro: '#1d1d22',
  metal: '#4a4f5c',
  vidrio: '#25304f',
  blanco: '#f7f8fb',
  tronco: '#8a6a4a',
  luz: '#ffe9a8',
}

const CABINAS = ['#4646e0', '#0d9488', '#e2e5ee']

const CAPACIDAD = 4
// Posiciones (en metros) del escenario
const PICK = new THREE.Vector3(-1.2, 0, -0.7) // pallet listo en la puerta del almacén
const ESPERA_Z = 1.9 // carril del montacargas
const ALCANCE = 1.55 // distancia del montacargas al centro del pallet en las uñas
const CAMION_X = 1.6 // dónde se estaciona el camión
const CARRIL_Z = 4.7 // carril de la pista
const ALTURA_CAMA = 1.25
const SLOTS = [-2.55, -0.85, 0.85, 2.55] // posiciones del pallet en la plataforma (local x)

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export class Patio {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200)
  private tiempo = 0 // segundos de animación transcurridos
  private ultimo = 0
  private mats = new Map<Rol, THREE.MeshStandardMaterial>()
  private fijos = new Map<string, THREE.MeshStandardMaterial>()
  private hemi!: THREE.HemisphereLight
  private sol!: THREE.DirectionalLight
  private faroles: THREE.PointLight[] = []
  private tema: Tema
  private raf = 0
  private activo = false

  private montacargas!: THREE.Group
  private carro!: THREE.Group // porta-horquillas que sube y baja
  private camion!: THREE.Group
  private cabina!: THREE.MeshStandardMaterial
  private ruedasCamion: THREE.Mesh[] = []
  private palletListo: THREE.Group | null = null
  private guion: Generator<Tarea, void, unknown>
  private tarea: Tarea | null = null
  private tTarea = 0
  private nCamion = 0

  constructor(
    private host: HTMLElement,
    tema: Tema,
    private estatico = false,
  ) {
    this.tema = tema
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.domElement.style.display = 'block'
    host.appendChild(this.renderer.domElement)

    this.montarLuces()
    this.montarEscenario()
    this.montacargas = this.crearMontacargas()
    this.scene.add(this.montacargas)
    this.camion = this.crearCamion()
    this.scene.add(this.camion)
    this.aplicarTema()
    this.reponerPallet(true)

    this.guion = this.script()
    this.siguiente()
    this.resize()

    if (estatico) {
      // Sin animación: camión estacionado a medio cargar
      this.camion.position.x = CAMION_X
      for (let i = 0; i < 2; i++) {
        const p = this.crearPallet()
        p.position.set(SLOTS[i], ALTURA_CAMA, 0)
        this.camion.add(p)
      }
      this.montacargas.position.set(PICK.x, 0, ESPERA_Z)
      this.montacargas.rotation.y = Math.PI
      this.render()
    }
  }

  // ---------- materiales ----------
  private mat(rol: Rol) {
    let m = this.mats.get(rol)
    if (!m) {
      m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 })
      this.mats.set(rol, m)
    }
    return m
  }
  private fijo(color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
    const k = color + JSON.stringify(extra)
    let m = this.fijos.get(k)
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra })
      this.fijos.set(k, m)
    }
    return m
  }

  private caja(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0, sombra = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
    mesh.position.set(x, y + h / 2, z)
    mesh.castShadow = sombra
    mesh.receiveShadow = true
    return mesh
  }

  // ---------- escena ----------
  private montarLuces() {
    this.hemi = new THREE.HemisphereLight('#ffffff', '#b9c1dc', 1.6)
    this.scene.add(this.hemi)
    this.sol = new THREE.DirectionalLight('#ffffff', 2.2)
    this.sol.position.set(-12, 22, 14)
    this.sol.castShadow = true
    this.sol.shadow.mapSize.set(2048, 2048)
    const s = this.sol.shadow.camera
    s.left = -24
    s.right = 24
    s.top = 18
    s.bottom = -18
    s.near = 1
    s.far = 70
    this.sol.shadow.bias = -0.0004
    this.sol.shadow.normalBias = 0.02
    this.scene.add(this.sol)
  }

  private letrero() {
    const cv = document.createElement('canvas')
    cv.width = 1024
    cv.height = 160
    const g = cv.getContext('2d')!
    g.fillStyle = '#4646e0'
    g.fillRect(0, 0, cv.width, cv.height)
    g.fillStyle = '#ffffff'
    g.font = '800 82px Inter, system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('FERRETERÍA EL PROGRESO', cv.width / 2, cv.height / 2 + 4)
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.15 })
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.2), m)
    return plano
  }

  private montarEscenario() {
    const s = this.scene

    // Suelo, patio y pista
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), this.mat('suelo'))
    suelo.rotation.x = -Math.PI / 2
    suelo.receiveShadow = true
    s.add(suelo)
    const patio = this.caja(26, 0.04, 9.4, this.mat('patio'), -2, 0, -1.6, false)
    s.add(patio)
    s.add(this.caja(200, 0.05, 3.6, this.mat('pista'), 0, 0, CARRIL_Z, false))
    s.add(this.caja(200, 0.12, 0.35, this.mat('vereda'), 0, 0, CARRIL_Z - 1.98, false))
    s.add(this.caja(200, 0.12, 1.6, this.mat('vereda'), 0, 0, CARRIL_Z + 2.6, false))
    for (let x = -60; x < 60; x += 3) s.add(this.caja(1.4, 0.06, 0.12, this.mat('linea'), x, 0, CARRIL_Z + 1.1, false))

    // Edificio de la ferretería
    const ed = new THREE.Group()
    ed.add(this.caja(17, 5.2, 7, this.mat('muro'), -3.5, 0, -6.3))
    ed.add(this.caja(17.4, 0.35, 7.4, this.mat('techo'), -3.5, 5.2, -6.3))
    // franja de marca y zócalo
    ed.add(this.caja(17.02, 0.5, 0.05, this.mat('marca'), -3.5, 4.2, -2.79, false))
    ed.add(this.caja(17.02, 0.6, 0.05, this.mat('techo'), -3.5, 0, -2.79, false))
    // letrero
    const l = this.letrero()
    l.position.set(-7.6, 3.25, -2.74)
    ed.add(l)
    // puerta de carga (enrollable) en la zona de pick
    ed.add(this.caja(3.2, 3.4, 0.08, this.mat('puerta'), PICK.x, 0, -2.76, false))
    for (let y = 0.4; y < 3.4; y += 0.38) ed.add(this.caja(3.2, 0.04, 0.1, this.mat('techo'), PICK.x, y, -2.72, false))
    ed.add(this.caja(3.6, 0.18, 0.4, this.mat('marcaOscura'), PICK.x, 3.4, -2.6, false))
    // segunda puerta (cerrada) y ventanas de tienda
    ed.add(this.caja(3, 3.2, 0.08, this.mat('puerta'), 3.1, 0, -2.76, false))
    for (const x of [-10.4, -8.6]) ed.add(this.caja(1.4, 1.5, 0.08, this.mat('ventana'), x, 1.1, -2.76, false))
    ed.add(this.caja(1.3, 2.4, 0.08, this.mat('marcaOscura'), -5.6, 0, -2.76, false))
    // aire acondicionado en el techo
    ed.add(this.caja(1.4, 0.7, 1, this.fijo(C.blanco), -8, 5.55, -7))
    ed.add(this.caja(1.4, 0.7, 1, this.fijo(C.blanco), 1, 5.55, -5))
    s.add(ed)

    // Pallets decorativos apilados junto al almacén
    const pilas: [number, number, number][] = [
      [-8.5, -1.6, 2],
      [-7.1, -1.6, 1],
      [4.4, -1.3, 2],
      [5.8, -1.5, 1],
    ]
    pilas.forEach(([x, z, alto]) => {
      for (let i = 0; i < alto; i++) {
        const p = this.crearPallet(i % 2 === 1)
        p.position.set(x, i * 1.12, z)
        p.rotation.y = (i % 2) * 0.06
        s.add(p)
      }
    })

    // Conos y topes
    for (const x of [-4.2, 7.2]) {
      const cono = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 10), this.fijo('#f97316'))
      cono.position.set(x, 0.3, 2.3)
      cono.castShadow = true
      s.add(cono)
    }

    // Árboles y faroles
    const arboles: [number, number, number][] = [
      [-13.5, -3, 1.1],
      [-12.5, 0.5, 0.9],
      [9, -4, 1.2],
      [10.5, -1, 0.9],
      [-9, 8.6, 0.9],
      [-2, 8.8, 1],
      [6, 8.6, 0.85],
      [13, 8.8, 1.1],
    ]
    arboles.forEach(([x, z, k], i) => s.add(this.crearArbol(x, z, k, i % 2 === 0 ? 'arbol' : 'arbol2')))
    for (const x of [-10, 0.5, 11]) s.add(this.crearFarol(x, CARRIL_Z + 2.2))
  }

  private crearArbol(x: number, z: number, k: number, rol: Rol) {
    const g = new THREE.Group()
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * k, 0.14 * k, 0.9 * k, 6), this.fijo(C.tronco))
    tronco.position.y = 0.45 * k
    tronco.castShadow = true
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 * k, 0), this.mat(rol))
    copa.position.y = 1.35 * k
    copa.castShadow = true
    g.add(tronco, copa)
    g.position.set(x, 0, z)
    return g
  }

  private crearFarol(x: number, z: number) {
    const g = new THREE.Group()
    g.add(this.caja(0.1, 3.2, 0.1, this.fijo(C.metal), 0, 0, 0))
    g.add(this.caja(0.9, 0.08, 0.12, this.fijo(C.metal), -0.4, 3.15, 0))
    const foco = this.caja(0.4, 0.1, 0.25, this.fijo(C.luz, { emissive: C.luz, emissiveIntensity: 0.6 }), -0.75, 3.05, 0, false)
    g.add(foco)
    const luz = new THREE.PointLight('#ffd98a', 0, 9, 1.6)
    luz.position.set(-0.75, 2.8, 0)
    g.add(luz)
    this.faroles.push(luz)
    g.position.set(x, 0, z)
    return g
  }

  // ---------- objetos ----------
  private crearPallet(variante = Math.random() < 0.5) {
    const g = new THREE.Group()
    // base de madera
    g.add(this.caja(1.2, 0.05, 1, this.fijo(C.madera), 0, 0.1, 0))
    for (const z of [-0.42, 0, 0.42]) g.add(this.caja(1.2, 0.1, 0.14, this.fijo(C.madera, { roughness: 0.95 }), 0, 0, z))
    // carga: cajas de cartón
    const a = this.fijo(C.caja)
    const b = this.fijo(C.cajaB)
    if (variante) {
      g.add(this.caja(1.1, 0.85, 0.92, this.fijo(C.film, { roughness: 0.4 }), 0, 0.15, 0))
    } else {
      for (const [x, z] of [
        [-0.28, -0.23],
        [0.28, -0.23],
        [-0.28, 0.23],
        [0.28, 0.23],
      ])
        g.add(this.caja(0.54, 0.42, 0.44, (x + z) % 2 === 0 ? a : b, x, 0.15, z))
      g.add(this.caja(0.54, 0.4, 0.9, b, -0.28, 0.57, 0))
      g.add(this.caja(0.54, 0.4, 0.9, a, 0.28, 0.57, 0))
    }
    return g
  }

  private crearMontacargas() {
    const g = new THREE.Group()
    const am = this.fijo(C.montacargas, { roughness: 0.55 })
    const ng = this.fijo(C.negro)
    const mt = this.fijo(C.metal, { metalness: 0.4, roughness: 0.5 })
    // chasis (mira hacia +z)
    g.add(this.caja(1.1, 0.55, 1.5, am, 0, 0.22, -0.15))
    g.add(this.caja(1.12, 0.55, 0.45, ng, 0, 0.3, -0.95)) // contrapeso
    g.add(this.caja(0.5, 0.35, 0.35, ng, 0, 0.77, -0.3)) // asiento
    // cabina protectora
    for (const [x, z] of [
      [-0.48, 0.35],
      [0.48, 0.35],
      [-0.48, -0.75],
      [0.48, -0.75],
    ])
      g.add(this.caja(0.07, 1.25, 0.07, ng, x, 0.77, z))
    g.add(this.caja(1.08, 0.07, 1.2, ng, 0, 2.0, -0.2))
    // ruedas
    for (const [x, z, r] of [
      [-0.56, 0.3, 0.3],
      [0.56, 0.3, 0.3],
      [-0.56, -0.75, 0.24],
      [0.56, -0.75, 0.24],
    ]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.22, 14), ng)
      w.rotation.z = Math.PI / 2
      w.position.set(x, r, z)
      w.castShadow = true
      g.add(w)
    }
    // mástil
    for (const x of [-0.4, 0.4]) g.add(this.caja(0.09, 2.5, 0.12, mt, x, 0.05, 0.66))
    g.add(this.caja(0.9, 0.08, 0.12, mt, 0, 2.5, 0.66))
    // porta-horquillas móvil
    const carro = new THREE.Group()
    carro.add(this.caja(0.92, 0.5, 0.06, mt, 0, 0.06, 0.76))
    for (const x of [-0.27, 0.27]) carro.add(this.caja(0.12, 0.05, 1.15, ng, x, 0.06, 1.33))
    g.add(carro)
    this.carro = carro
    // baliza
    g.add(this.caja(0.14, 0.12, 0.14, this.fijo('#f97316', { emissive: '#f97316', emissiveIntensity: 0.6 }), 0, 2.07, -0.5, false))
    g.position.set(PICK.x, 0, ESPERA_Z)
    g.rotation.y = Math.PI
    return g
  }

  private crearCamion() {
    const g = new THREE.Group()
    this.cabina = new THREE.MeshStandardMaterial({ color: CABINAS[0], roughness: 0.45, metalness: 0.1 })
    const ng = this.fijo(C.negro)
    const bl = this.fijo(C.blanco, { roughness: 0.6 })
    const vd = this.fijo(C.vidrio, { roughness: 0.15, metalness: 0.3 })
    // chasis
    g.add(this.caja(9.4, 0.3, 1.6, ng, 0.9, 0.55, 0))
    // plataforma
    g.add(this.caja(7.4, 0.2, 2.4, bl, 0, ALTURA_CAMA - 0.2, 0))
    g.add(this.caja(7.4, 0.35, 0.08, this.cabina, 0, ALTURA_CAMA - 0.25, 1.21))
    g.add(this.caja(7.4, 0.35, 0.08, this.cabina, 0, ALTURA_CAMA - 0.25, -1.21))
    // compuerta delantera y postes
    g.add(this.caja(0.12, 1.4, 2.4, bl, 3.66, ALTURA_CAMA, 0))
    for (const x of [-3.6, -1.8, 0, 1.8]) for (const z of [-1.17, 1.17]) g.add(this.caja(0.08, 0.5, 0.06, ng, x, ALTURA_CAMA, z))
    // cabina
    g.add(this.caja(1.9, 1.7, 2.3, this.cabina, 4.75, 0.7, 0))
    g.add(this.caja(1.3, 0.9, 2.32, this.cabina, 4.45, 2.4, 0))
    g.add(this.caja(0.06, 0.75, 2.0, vd, 5.12, 2.45, 0, false)) // parabrisas
    for (const z of [-1.17, 1.17]) g.add(this.caja(0.85, 0.6, 0.04, vd, 4.45, 2.5, z, false)) // ventanas
    g.add(this.caja(0.12, 0.35, 2.32, ng, 5.75, 0.7, 0)) // parachoques
    for (const z of [-0.85, 0.85]) g.add(this.caja(0.06, 0.18, 0.35, this.fijo(C.luz, { emissive: C.luz, emissiveIntensity: 0.8 }), 5.78, 1.15, z, false))
    // ruedas
    for (const x of [-2.7, -1.6, 4.6])
      for (const z of [-1.05, 1.05]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.38, 16), ng)
        w.rotation.x = Math.PI / 2
        w.position.set(x, 0.48, z)
        w.castShadow = true
        const llanta = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 8), this.fijo(C.metal, { metalness: 0.5 }))
        llanta.rotation.x = Math.PI / 2
        llanta.position.copy(w.position)
        g.add(w, llanta)
        this.ruedasCamion.push(llanta)
      }
    g.position.set(-34, 0, CARRIL_Z)
    return g
  }

  // ---------- tema ----------
  setTema(tema: Tema) {
    this.tema = tema
    this.aplicarTema()
    if (this.estatico || !this.activo) this.render()
  }

  private aplicarTema() {
    const p = PALETAS[this.tema]
    ;(Object.keys(p) as Rol[]).forEach((r) => this.mat(r).color.set(p[r]))
    this.scene.background = new THREE.Color(p.fondo)
    const oscuro = this.tema === 'oscuro'
    this.mat('ventana').emissive.set(oscuro ? '#6b70ff' : '#000000')
    this.mat('ventana').emissiveIntensity = oscuro ? 0.5 : 0
    this.hemi.intensity = oscuro ? 1.0 : 1.6
    this.hemi.groundColor.set(oscuro ? '#101018' : '#b9c1dc')
    this.sol.intensity = oscuro ? 1.1 : 2.2
    this.sol.color.set(oscuro ? '#9aa6ff' : '#ffffff')
    this.faroles.forEach((f) => (f.intensity = oscuro ? 14 : 0))
  }

  // ---------- guion de la animación ----------
  private *script(): Generator<Tarea, void, unknown> {
    const m = this.montacargas
    while (true) {
      // Llega un camión
      this.nCamion++
      this.cabina.color.set(CABINAS[(this.nCamion - 1) % CABINAS.length])
      yield this.moverCamion(-34, CAMION_X, 4.5, easeOut)

      for (let i = 0; i < CAPACIDAD; i++) {
        // 1. entrar al pallet
        yield this.ir(m, { z: PICK.z + ALCANCE }, 0.9)
        // 2. tomarlo y levantarlo
        yield {
          dur: 0.45,
          inicio: () => {
            if (this.palletListo) {
              this.carro.attach(this.palletListo)
              this.palletListo = null
            }
          },
          paso: (t) => (this.carro.position.y = lerp(0, 0.25, ease(t))),
        }
        // 3. retroceder y preparar el siguiente pallet en la puerta
        yield this.combinar(this.ir(m, { z: ESPERA_Z }, 0.9), { dur: 0, inicio: () => this.reponerPallet(), paso: () => {} })
        // 4. girar y avanzar hacia el slot del camión
        const destinoX = CAMION_X + SLOTS[i]
        const dir = destinoX > m.position.x ? Math.PI / 2 : -Math.PI / 2
        yield this.girar(m, dir, 0.6)
        yield this.ir(m, { x: destinoX }, Math.max(0.6, Math.abs(destinoX - m.position.x) * 0.28))
        yield this.girar(m, 0, 0.6)
        // 5. acercarse a la plataforma subiendo las horquillas
        yield this.combinar(this.ir(m, { z: CARRIL_Z - ALCANCE }, 1.0), this.elevar(ALTURA_CAMA + 0.12, 1.0))
        // 6. bajar y soltar el pallet en el camión
        yield {
          ...this.elevar(ALTURA_CAMA - 0.06, 0.4),
          fin: () => {
            const p = this.carro.children.find((c) => c.userData.pallet) as THREE.Group | undefined
            if (p) {
              this.camion.attach(p)
              p.position.set(SLOTS[i], ALTURA_CAMA, 0)
              p.rotation.set(0, 0, 0)
            }
          },
        }
        // 7. retroceder, bajar horquillas y volver a la puerta
        yield this.combinar(this.ir(m, { z: ESPERA_Z }, 0.9), this.elevar(0, 0.9))
        const dirVuelta = PICK.x > m.position.x ? Math.PI / 2 : -Math.PI / 2
        yield this.girar(m, dirVuelta, 0.6)
        yield this.ir(m, { x: PICK.x }, Math.max(0.6, Math.abs(PICK.x - m.position.x) * 0.28))
        yield this.girar(m, Math.PI, 0.6)
      }

      // Camión lleno: se va
      yield { dur: 0.6, paso: () => {} }
      yield this.moverCamion(CAMION_X, 40, 4, easeIn)
      // limpiar carga
      this.camion.children.filter((c) => c.userData.pallet).forEach((c) => this.camion.remove(c))
      yield { dur: 0.8, paso: () => {} }
    }
  }

  private reponerPallet(inmediato = false) {
    const p = this.crearPallet()
    p.userData.pallet = true
    this.scene.add(p)
    this.palletListo = p
    if (inmediato) {
      p.position.copy(PICK)
      return
    }
    // sale por la puerta del almacén (animación propia en paralelo)
    p.position.set(PICK.x, 0, PICK.z - 2.4)
    const t0 = this.tiempo
    const anim = () => {
      const t = Math.min(1, (this.tiempo - t0) / 1.6)
      p.position.z = lerp(PICK.z - 2.4, PICK.z, ease(t))
      if (t < 1 && p.parent === this.scene) this.extras.push(anim)
    }
    this.extras.push(anim)
  }
  private extras: (() => void)[] = []

  private ir(obj: THREE.Object3D, hacia: { x?: number; z?: number }, dur: number): Tarea {
    let x0 = 0
    let z0 = 0
    return {
      dur,
      inicio: () => {
        x0 = obj.position.x
        z0 = obj.position.z
      },
      paso: (t) => {
        const k = ease(t)
        if (hacia.x !== undefined) obj.position.x = lerp(x0, hacia.x, k)
        if (hacia.z !== undefined) obj.position.z = lerp(z0, hacia.z, k)
      },
    }
  }

  private girar(obj: THREE.Object3D, ang: number, dur: number): Tarea {
    let a0 = 0
    let d = 0
    return {
      dur,
      inicio: () => {
        a0 = obj.rotation.y
        d = ((ang - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      },
      paso: (t) => (obj.rotation.y = a0 + d * ease(t)),
    }
  }

  private elevar(h: number, dur: number): Tarea {
    let h0 = 0
    return {
      dur,
      inicio: () => (h0 = this.carro.position.y),
      paso: (t) => (this.carro.position.y = lerp(h0, h, ease(t))),
    }
  }

  private combinar(...ts: Tarea[]): Tarea {
    return {
      dur: Math.max(...ts.map((t) => t.dur)),
      inicio: () => ts.forEach((t) => t.inicio?.()),
      paso: (t) => ts.forEach((x) => x.paso(t)),
      fin: () => ts.forEach((t) => t.fin?.()),
    }
  }

  private moverCamion(desde: number, hasta: number, dur: number, curva: (t: number) => number): Tarea {
    let ultimo = desde
    return {
      dur,
      inicio: () => {
        this.camion.position.x = desde
        ultimo = desde
      },
      paso: (t) => {
        const x = lerp(desde, hasta, curva(t))
        const dx = x - ultimo
        ultimo = x
        this.camion.position.x = x
        this.ruedasCamion.forEach((r) => (r.rotation.y -= dx / 0.48))
      },
    }
  }

  private siguiente() {
    if (this.tarea?.fin) this.tarea.fin()
    const n = this.guion.next()
    this.tarea = n.done ? null : (n.value as Tarea)
    this.tTarea = 0
    this.tarea?.inicio?.()
  }

  // ---------- ciclo ----------
  play() {
    if (this.estatico || this.activo) return
    this.activo = true
    this.ultimo = performance.now()
    const loop = () => {
      if (!this.activo) return
      const ahora = performance.now()
      const dt = Math.min((ahora - this.ultimo) / 1000, 0.05)
      this.ultimo = ahora
      this.tiempo += dt
      this.avanzar(dt)
      this.render()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  pause() {
    this.activo = false
    cancelAnimationFrame(this.raf)
  }

  private avanzar(dt: number) {
    const ex = this.extras
    this.extras = []
    ex.forEach((f) => f())
    let resto = dt
    while (this.tarea && resto > 0) {
      const falta = this.tarea.dur - this.tTarea
      const usa = Math.min(falta, resto)
      this.tTarea += usa
      resto -= usa
      this.tarea.paso(this.tarea.dur ? this.tTarea / this.tarea.dur : 1)
      if (this.tTarea >= this.tarea.dur) this.siguiente()
    }
  }

  resize() {
    const w = this.host.clientWidth || 1
    const h = this.host.clientHeight || 1
    this.renderer.setSize(w, h, false)
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    const aspecto = w / h
    // Zoom según el alto disponible
    const ancho = aspecto > 1.6
    const mitadAlto = ancho ? 7.4 : 7.2
    const mitadAncho = mitadAlto * aspecto
    const c = this.camera
    c.left = -mitadAncho
    c.right = mitadAncho
    c.top = mitadAlto
    c.bottom = -mitadAlto
    c.position.set(14, 15, 18)
    const foco = ancho ? new THREE.Vector3(-0.8, 1.4, 0.9) : new THREE.Vector3(1.4, 1.2, 1.2)
    c.position.add(foco)
    c.lookAt(foco)
    c.updateProjectionMatrix()
    if (!this.activo) this.render()
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.pause()
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose()
    })
    this.mats.forEach((m) => m.dispose())
    this.fijos.forEach((m) => m.dispose())
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

type Tarea = {
  dur: number
  inicio?: () => void
  paso: (t: number) => void
  fin?: () => void
}
