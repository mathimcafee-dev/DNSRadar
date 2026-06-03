import { useEffect, useRef } from 'react'

const REGIONS = [
  { key:'us',   label:'N. America',   x: 0.18, y: 0.38 },
  { key:'eu',   label:'Europe',       x: 0.50, y: 0.25 },
  { key:'apac', label:'Asia Pacific', x: 0.77, y: 0.35 },
  { key:'au',   label:'Australia',    x: 0.80, y: 0.67 },
]

export default function WorldMap({ regionStatus }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Load D3 + TopoJSON from CDN then draw
    const d3Script = document.createElement('script')
    d3Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'
    d3Script.onload = () => {
      const topoScript = document.createElement('script')
      topoScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js'
      topoScript.onload = () => {
        drawMap(window.d3, window.topojson, el)
      }
      document.head.appendChild(topoScript)
    }
    document.head.appendChild(d3Script)

    function drawMap(d3, topojson, container) {
      const W = container.clientWidth || 800
      const H = Math.round(W * 0.52)

      const svg = d3.select(container).select('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('width', '100%')

      const projection = d3.geoNaturalEarth1()
        .scale(W / 6.4)
        .translate([W / 2, H / 2])

      const path = d3.geoPath().projection(projection)

      // Fetch world topo
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(r => r.json())
        .then(world => {
          const land = topojson.feature(world, world.objects.land)

          // Ocean bg
          svg.select('.ocean').datum({type:'Sphere'}).attr('d', path)

          // Graticule
          const graticule = d3.geoGraticule().step([30, 30])()
          svg.select('.graticule').datum(graticule).attr('d', path)

          // Equator
          svg.select('.equator').datum({type:'LineString', coordinates:[[-180,0],[180,0]]}).attr('d', path)

          // Land
          svg.select('.land').datum(land).attr('d', path)

          // Pins
          REGIONS.forEach(reg => {
            const pass = regionStatus(reg.key)
            const coords = projection([reg.x * 360 - 180, 90 - reg.y * 180])
            if (!coords) return
            const [px, py] = coords

            const g = svg.select(`.pin-${reg.key}`)
              .attr('transform', `translate(${px},${py})`)

            g.select('.pin-path')
              .attr('fill', pass ? '#1a7fd4' : '#e53e3e')
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 2.5)
              .attr('d', 'M0,-28 C-12,-28 -21,-19 -21,-8 C-21,8 0,26 0,26 C0,26 21,8 21,-8 C21,-19 12,-28 0,-28 Z')

            g.select('.pin-inner')
              .attr('cx', 0).attr('cy', -8).attr('r', 9)
              .attr('fill', '#ffffff')

            g.select('.pin-label-bg')
              .attr('x', -40).attr('y', 28)
              .attr('width', 80).attr('height', 20)
              .attr('rx', 10)
              .attr('fill', 'rgba(255,255,255,0.95)')
              .attr('stroke', pass ? '#1a7fd4' : '#e53e3e')
              .attr('stroke-width', 1.5)

            g.select('.pin-label-text')
              .attr('x', 0).attr('y', 42)
              .attr('text-anchor', 'middle')
              .attr('font-size', 10)
              .attr('font-weight', 700)
              .attr('fill', pass ? '#0059a5' : '#c53030')
              .attr('font-family', "'Plus Jakarta Sans',system-ui")
              .text(reg.label)
          })
        })
    }

    return () => {
      // cleanup: remove the SVG content
      if (ref.current) ref.current.querySelector('svg').innerHTML = ref.current.querySelector('svg').innerHTML
    }
  }, [])

  return (
    <div ref={ref} style={{ position:'relative', borderRadius:'0 0 12px 12px', overflow:'hidden', background:'#d6e9f8' }}>
      <svg style={{ width:'100%', display:'block' }}>
        <path className="ocean" fill="#d6e9f8"/>
        <path className="graticule" fill="none" stroke="#b8d4ea" strokeWidth="0.5" opacity="0.6"/>
        <path className="equator" fill="none" stroke="#a0c0d8" strokeWidth="1" strokeDasharray="4,4"/>
        <path className="land" fill="#2186d0" stroke="#1878c0" strokeWidth="0.5"/>
        {REGIONS.map(reg => (
          <g key={reg.key} className={`pin-${reg.key}`}>
            <ellipse rx={10} ry={4} cy={22} fill="rgba(0,0,0,0.15)"/>
            <path className="pin-path"/>
            <circle className="pin-inner"/>
            <rect className="pin-label-bg"/>
            <text className="pin-label-text"/>
          </g>
        ))}
      </svg>
    </div>
  )
}
