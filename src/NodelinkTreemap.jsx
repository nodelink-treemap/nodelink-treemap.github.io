import { useState, useEffect } from 'react'

import Panels, { Colors } from './components/Panels'

import * as d3 from 'd3'


import './App.css'

function NodelinkTreemap() {
  const datasets = [
    'animals',
    'flare',
    'sp500',
    'orchestras',
  ]

  const [data, setData] = useState({
    flare: undefined,
    animals: undefined,
    sp500: undefined,
    orchestras: undefined,
  })

  const [currentData, setCurrentData] = useState(undefined)
  const [color, setColor] = useState('blues')

  // on load, get csv files
  useEffect(() => {

    async function fetch() {
      let flareData = await d3.json('/flare.json')
      let animalData = await d3.json('/animals.json')
      let sp500Data = await d3.json('/sp500.json')
      let orchestrasData = await d3.json('/orchestras.json')

      const newData = { 
        flare: { data: flareData, value: d => d.size },
        animals: { data: animalData, value: d => d.species },
        sp500: { data: sp500Data, value: d => d.marketcap, format: d => d3.format('.3~s')(d).replace('G','B') },
        orchestras: { data: orchestrasData, value: d => d.number },
      }
      setData(newData)
      setCurrentData(newData.animals)
    }
    fetch()

  }, [])

  const handleChange = (event) => {
    const value = event.target.value;
    setCurrentData(data[value])
  }
  
  return (
    <div className="app">
      <div className='topWrapper'>
        <select onChange={handleChange}
          style={{
            width: 100,
            marginRight: 200
          }}
        >
          {datasets.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>

        <div className="colorWrapper">
          <svg className="legendSVG"/>

          <select onChange={(e) => setColor(e.target.value)}>
            {Object.keys(Colors).map((color, i) => {
              return <option key={i} value={color}>{color}</option>
            })}
          </select>
        </div>

      </div>
      <Panels 
        data={currentData && currentData.data} 
        value={currentData && currentData.value} 
        format={currentData && currentData.format} 
        color={color}
      />  
    </div>
  )
}

export default NodelinkTreemap
